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
      new Set(["imessage", "whatsapp", "telegram"]),
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
      while (schema instanceof z.ZodOptional || schema instanceof z.ZodDefault)
        schema = schema.unwrap() as z.ZodType;
      return schema;
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
        await visit(`${match[1]}${match[1] === "./phone" || match[1] === "./glyph" ? ".tsx" : ".ts"}`);
      expect(source.includes('from "zod"')).toBe(false);
    };
    await visit("./phone.tsx");
    expect(seen.has("./schema.ts")).toBe(false);
  });
});
