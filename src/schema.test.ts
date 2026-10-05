import { describe, expect, test } from "bun:test";
import { defaultScene, presets } from "./presets.js";
import { z } from "zod";
import { MAX_SCENE_BYTES, parseScene } from "./schema.js";

const fresh = () => structuredClone(defaultScene);

describe("scene v1 validation", () => {
  test("every preset is a complete valid v1 document", () => {
    for (const preset of presets)
      expect(parseScene(preset.scene)).toEqual(preset.scene);
    expect(new Set(presets.map((preset) => preset.scene.platform))).toEqual(
      new Set([
        "imessage",
        "whatsapp",
        "telegram",
        "instagram",
        "google-messages",
      ]),
    );
  });
  test("rejects unknown versions, unknown fields, invalid references, and duplicate IDs", () => {
    expect(() => parseScene({ ...fresh(), version: 2 })).toThrow();
    expect(() => parseScene({ ...fresh(), experimental: true })).toThrow();
    const scene = fresh();
    scene.messages[0].senderId = "missing";
    expect(() => parseScene(scene)).toThrow("Unknown sender");
    scene.messages[0].senderId = "jamie";
    scene.messages[1].id = scene.messages[0].id;
    expect(() => parseScene(scene)).toThrow("IDs must be unique");
  });
  test("requires exactly one self, valid reply targets and temporal references", () => {
    const scene = fresh();
    scene.participants[0].isSelf = false;
    expect(() => parseScene(scene)).toThrow("Exactly one");
    scene.participants[0].isSelf = true;
    scene.messages[0].replyTo = scene.messages[0].id;
    expect(() => parseScene(scene)).toThrow("another message");
    delete scene.messages[0].replyTo;
    scene.messages[1].reactions[0].at = 0;
    expect(() => parseScene(scene)).toThrow("Reaction must occur");
  });
  test("requires attachment payloads and safe HTTPS assets", () => {
    const scene = fresh();
    scene.messages[0].kind = "image";
    expect(() => parseScene(scene)).toThrow("require media");
    scene.messages[0].media = {
      url: "https://example.com/image.jpg",
      width: 400,
      height: 300,
      duration: 0,
      alt: "Example",
      waveform: [],
      playhead: 0,
      playbackRate: 1,
      playing: false,
      keep: false,
    };
    expect(parseScene(scene).messages[0].media?.url).toBe(
      "https://example.com/image.jpg",
    );
    for (const url of [
      "javascript:alert(1)",
      "file:///etc/passwd",
      "data:image/png;base64,AA==",
      "https://user:password@example.com/image.jpg",
    ]) {
      scene.messages[0].media.url = url;
      expect(() => parseScene(scene)).toThrow();
    }
  });
  test("bounds bytes, complexity and duration", () => {
    expect(() => parseScene(" ".repeat(MAX_SCENE_BYTES + 1))).toThrow(
      "256 KiB",
    );
    const scene = fresh();
    scene.timeline.duration = 301;
    expect(() => parseScene(scene)).toThrow();
    const nested: Record<string, unknown> = {};
    let current = nested;
    for (let i = 0; i < 35; i++) {
      current.child = {};
      current = current.child as Record<string, unknown>;
    }
    expect(() =>
      parseScene({ ...fresh(), extensions: { "example.deep": nested } }),
    ).toThrow("structure exceeds");
  });
  test("rejects prototype keys, cycles and executable values", () => {
    expect(() => parseScene('{"__proto__":{"polluted":true}}')).toThrow(
      "unsafe object key",
    );
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(() => parseScene(circular)).toThrow("cycle");
    expect(() =>
      parseScene({ ...fresh(), extensions: { "example.code": () => 1 } }),
    ).toThrow("JSON values");
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined();
  });
  test("validates scalar paths, keyframe types, bounds, and easing", () => {
    for (const path of [
      "/__proto__/polluted",
      "/messages/0/constructor",
      "/unknown",
      "/messages/0/id",
      "/timeline/duration",
      "/messages/00/text",
    ]) {
      const scene = fresh();
      scene.timeline.tracks = [
        { id: "bad", path, keyframes: [{ at: 1, value: "x", easing: "step" }] },
      ];
      expect(() => parseScene(scene)).toThrow();
    }
    const scene = fresh();
    scene.timeline.tracks = [
      {
        id: "battery",
        path: "/statusBar/battery",
        keyframes: [{ at: 1, value: 101, easing: "linear" }],
      },
    ];
    expect(() => parseScene(scene)).toThrow("violates");
    scene.timeline.tracks[0].keyframes[0].value = "wrong type";
    expect(() => parseScene(scene)).toThrow("match the target");
    scene.timeline.tracks = [
      {
        id: "theme",
        path: "/theme",
        keyframes: [{ at: 1, value: "dark", easing: "typewriter" }],
      },
    ];
    expect(() => parseScene(scene)).toThrow("display-text");
  });
  test("rejects duplicate paths and non-increasing keyframes", () => {
    const scene = fresh();
    scene.timeline.tracks.push({
      ...scene.timeline.tracks[0],
      id: "duplicate",
    });
    expect(() => parseScene(scene)).toThrow("one track");
    scene.timeline.tracks.pop();
    scene.timeline.tracks[0].keyframes[1].at =
      scene.timeline.tracks[0].keyframes[0].at;
    expect(() => parseScene(scene)).toThrow("increase strictly");
  });
});

describe("device models and OS compatibility", () => {
  const android = () => ({
    ...fresh(),
    platform: "whatsapp" as const,
    device: { model: "pixel-11-pro" as const },
  });
  test("fills a model's screen geometry and frame", () => {
    const pixel = parseScene(android());
    expect(pixel.device).toMatchObject({
      model: "pixel-11-pro",
      width: 410,
      height: 914,
      frame: "device",
    });
    const galaxy = parseScene({
      ...android(),
      device: { model: "galaxy-s26-ultra" },
    });
    expect(galaxy.device).toMatchObject({
      width: 384,
      height: 832,
      frame: "device",
    });
    const bare = parseScene({
      ...android(),
      device: { model: "pixel-11", frame: "none", width: 500 },
    });
    expect(bare.device).toMatchObject({ width: 500, frame: "none" });
    const iphone = parseScene({
      ...fresh(),
      device: { model: "iphone-17-pro" },
    });
    expect(iphone.device).toMatchObject({
      width: 402,
      height: 874,
      frame: "iphone",
    });
    expect(parseScene(fresh()).device.model).toBeUndefined();
  });
  test("bounds overrides to physical screen sizes", () => {
    for (const device of [
      { width: 100 },
      { height: 4000 },
      { frame: "crt" },
      { model: "pixel-3" },
    ])
      expect(() => parseScene({ ...android(), device })).toThrow();
  });
  test("keeps platforms on their own operating system", () => {
    expect(() =>
      parseScene({ ...fresh(), device: { model: "pixel-11" } }),
    ).toThrow("iMessage is only available on iPhone");
    expect(() =>
      parseScene({ ...android(), device: { model: "pixel-11", frame: "iphone" } }),
    ).toThrow("frame");
    expect(() =>
      parseScene({ ...fresh(), platform: "google-messages" }),
    ).toThrow("Android");
    expect(() =>
      parseScene({
        ...fresh(),
        platform: "google-messages",
        device: { model: "iphone-17-pro" },
      }),
    ).toThrow("Android");
    expect(() =>
      parseScene({
        ...android(),
        platform: "google-messages",
        device: { model: "galaxy-s26" },
      }),
    ).not.toThrow();
  });
  test("checks platform keyframes against the phone's OS", () => {
    const scene = android();
    scene.timeline.tracks = [
      {
        id: "swap",
        path: "/platform",
        keyframes: [{ at: 2, value: "imessage", easing: "step" }],
      },
    ];
    expect(() => parseScene(scene)).toThrow("iPhone");
    scene.timeline.tracks[0].keyframes[0].value = "google-messages";
    expect(() => parseScene(scene)).not.toThrow();
    const iphone = fresh();
    iphone.timeline.tracks = [
      {
        id: "swap",
        path: "/platform",
        keyframes: [{ at: 2, value: "google-messages", easing: "step" }],
      },
    ];
    expect(() => parseScene(iphone)).toThrow("Android");
  });
  test("applies platform-aware appearance defaults without overriding authored values", () => {
    const minimal = {
      version: 1,
      id: "t",
      platform: "google-messages",
      device: { model: "pixel-11" },
      participants: [
        { id: "me", name: "Me", isSelf: true },
        { id: "x", name: "X" },
      ],
      contact: { participantIds: ["x"], name: "X" },
    };
    const gm = parseScene(minimal);
    expect(gm.appearance.bubbleRadius).toBe(24);
    expect(gm.appearance.textSize).toBe(16);
    const tuned = parseScene({
      ...minimal,
      appearance: { bubbleRadius: 14 },
    });
    expect(tuned.appearance.bubbleRadius).toBe(14);
    expect(tuned.appearance.textSize).toBe(16);
    expect(parseScene(fresh()).appearance.bubbleRadius).toBe(20);
  });
});

describe("animation field contracts", () => {
  test("typing is opt-in free text and cannot corrupt platform, URLs, colors, or enum values", () => {
    const candidates = [
      ["/platform", "whatsapp"],
      ["/theme", "dark"],
      ["/composer/keyboard", "emoji"],
      ["/appearance/wallpaper", "gradient"],
      ["/appearance/color", "#FF0000"],
      ["/messages/0/status", "read"],
      ["/messages/0/effect", "slam"],
      ["/contact/avatar", "https://example.com/b.jpg"],
    ];
    for (const [path, value] of candidates) {
      const scene = fresh();
      scene.contact.avatar = "https://example.com/a.jpg";
      scene.timeline.tracks = [
        {
          id: "typed",
          path,
          keyframes: [{ at: 4, value, easing: "typewriter" }],
        },
      ];
      expect(() => parseScene(scene)).toThrow("display-text");
    }
    const valid = fresh();
    valid.timeline.tracks = [
      {
        id: "typed-name",
        path: "/contact/name",
        keyframes: [{ at: 4, value: "New friend", easing: "typewriter" }],
      },
    ];
    expect(() => parseScene(valid)).not.toThrow();
  });
});

describe("zod-free renderer helpers", () => {
  test("INTEGER_FIELD_PATTERNS is exactly the schema's integer fields", async () => {
    const { SceneSchema, INTEGER_FIELD_PATTERNS, isIntegerField, isIntegerPresentationField } = await import("./schema.js");
    const found: string[] = [];
    const unwrap = (schema: z.ZodType): z.ZodType => {
      for (;;) {
        if (
          schema instanceof z.ZodOptional ||
          schema instanceof z.ZodDefault ||
          schema instanceof z.ZodPrefault
        ) {
          schema = schema.unwrap() as z.ZodType;
        } else if (schema instanceof z.ZodPipe) {
          schema = schema.def.in as z.ZodType;
        } else {
          return schema;
        }
      }
    };
    const walk = (node: z.ZodType, path: string): void => {
      const schema = unwrap(node);
      if (schema instanceof z.ZodNumber) {
        if (schema.isInt) found.push(path);
      } else if (schema instanceof z.ZodObject) {
        for (const [key, child] of Object.entries(schema.shape)) walk(child as z.ZodType, `${path}/${key}`);
      } else if (schema instanceof z.ZodArray) walk(schema.element as z.ZodType, `${path}/*`);
    };
    walk(SceneSchema as unknown as z.ZodType, "");
    expect([...INTEGER_FIELD_PATTERNS].sort()).toEqual([...new Set(found)].sort());
    for (const pattern of found) {
      const path = pattern.replaceAll("*", "0");
      expect(isIntegerField(path)).toBe(true);
      expect(isIntegerPresentationField(path)).toBe(true);
    }
    expect(isIntegerField("/messages/0/text")).toBe(false);
    expect(isIntegerField("/appearance/textScale")).toBe(false);
  });

  test("drawing a scene never loads the Zod schema module", async () => {
    const seen = new Set<string>();
    const visit = async (file: string) => {
      if (seen.has(file)) return;
      seen.add(file);
      const source = await Bun.file(new URL(file, import.meta.url)).text();
      for (const match of source.matchAll(/^import\s+(?!type\b)[^;]*?from\s+"(\.\/[^"]+)\.js";/gms))
        await visit(
          `${match[1]}${["./phone", "./glyph", "./android"].includes(match[1]) ? ".tsx" : ".ts"}`,
        );
      expect(source.includes('from "zod"')).toBe(false);
    };
    await visit("./phone.tsx");
    expect(seen.has("./schema.ts")).toBe(false);
  });
});
