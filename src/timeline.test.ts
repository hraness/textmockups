import { describe, expect, test } from "bun:test";
import { defaultScene } from "./presets.js";
import { parseScene, readPointer } from "./schema.js";
import { evaluateScene, reconcileSceneEdit, sceneTime } from "./timeline.js";

describe("deterministic timeline", () => {
  test("message, reaction and receipt appear at inclusive exact boundaries", () => {
    expect(evaluateScene(defaultScene, 0.349).messages).toHaveLength(0);
    expect(evaluateScene(defaultScene, 0.35).messages).toHaveLength(1);
    expect(
      evaluateScene(defaultScene, 2.399).messages[1].reactions,
    ).toHaveLength(0);
    expect(evaluateScene(defaultScene, 2.4).messages[1].reactions).toHaveLength(
      1,
    );
    expect(evaluateScene(defaultScene, 4.99).messages[3].status).toBe("sent");
    expect(evaluateScene(defaultScene, 4.99).messages[3].statusText).toBe("");
    expect(evaluateScene(defaultScene, 5).messages[3].status).toBe("read");
  });
  test("does not mutate authored content and ignores clock history", () => {
    const before = JSON.stringify(defaultScene);
    const first = evaluateScene(defaultScene, 4);
    evaluateScene(defaultScene, 7);
    expect(evaluateScene(defaultScene, 4)).toEqual(first);
    expect(JSON.stringify(defaultScene)).toBe(before);
    first.messages[0].text = "Changed output";
    expect(defaultScene.messages[0].text).not.toBe("Changed output");
  });
  test("applies animation pointers before filtering authored indexes", () => {
    const scene = structuredClone(defaultScene);
    scene.messages[0].at = 7;
    scene.timeline.tracks = [
      {
        id: "second",
        path: "/messages/1/text",
        keyframes: [
          { at: 2, value: "Animated second message", easing: "step" },
        ],
      },
    ];
    expect(evaluateScene(parseScene(scene), 2).messages[0].text).toBe(
      "Animated second message",
    );
  });
  test("linear and smoothstep interpolation use preceding and implicit keyframes", () => {
    const scene = structuredClone(defaultScene);
    scene.timeline.tracks = [
      {
        id: "opacity",
        path: "/messages/0/presentation/opacity",
        keyframes: [{ at: 4, value: 0, easing: "linear" }],
      },
    ];
    expect(
      evaluateScene(parseScene(scene), 2).messages[0].presentation.opacity,
    ).toBe(0.5);
    scene.timeline.tracks[0].keyframes[0].easing = "ease";
    expect(
      evaluateScene(parseScene(scene), 1).messages[0].presentation.opacity,
    ).toBe(0.84375);
    expect(evaluateScene(scene, 4).messages[0].presentation.opacity).toBe(0);
  });
  test("typewriter preserves joined emoji and replaces existing suffixes", () => {
    const scene = structuredClone(defaultScene);
    scene.timeline.tracks = [
      {
        id: "typing",
        path: "/composer/text",
        keyframes: [
          { at: 0, value: "", easing: "step" },
          { at: 4, value: "A👩🏽‍💻B🇵🇷", easing: "typewriter" },
        ],
      },
    ];
    expect(evaluateScene(parseScene(scene), 2).composer.text).toBe("A👩🏽‍💻");
    expect(evaluateScene(scene, 4).composer.text).toBe("A👩🏽‍💻B🇵🇷");
    scene.timeline.tracks[0].keyframes = [
      { at: 0, value: "cat", easing: "step" },
      { at: 4, value: "car", easing: "typewriter" },
    ];
    expect(evaluateScene(parseScene(scene), 2).composer.text).toBe("ca");
    expect(evaluateScene(scene, 4).composer.text).toBe("car");
  });
  test("time clamping, looping, end scrubbing, and integer counters", () => {
    expect(sceneTime(defaultScene, -2)).toBe(0);
    expect(sceneTime(defaultScene, Number.NaN)).toBe(0);
    expect(sceneTime(defaultScene, 8)).toBe(8);
    expect(sceneTime(defaultScene, 9)).toBe(1);
    const scene = structuredClone(defaultScene);
    scene.timeline.loop = false;
    expect(sceneTime(scene, 99)).toBe(8);
    scene.timeline.tracks = [
      {
        id: "battery",
        path: "/statusBar/battery",
        keyframes: [{ at: 4, value: 97, easing: "linear" }],
      },
    ];
    expect(evaluateScene(parseScene(scene), 2).statusBar.battery).toBe(99);
  });
});

describe("editor timeline reconciliation", () => {
  test("moves receipts and reactions with their message while preserving offsets", () => {
    const original = structuredClone(defaultScene);
    const changed = structuredClone(original);
    changed.messages[1].at = 3;
    changed.messages[3].at = 6;
    const next = reconcileSceneEdit(original, changed);
    expect(next.messages[1].reactions[0].at).toBe(3.9);
    expect(next.messages[3].statusAt).toBe(6.7);
    expect(() => parseScene(next)).not.toThrow();
  });
  test("clamps reactions and receipts to a shortened scene and clears empty optional URLs", () => {
    const original = structuredClone(defaultScene);
    const changed = structuredClone(original);
    changed.timeline.duration = 4;
    changed.timeline.tracks = [];
    changed.messages[0].kind = "image";
    changed.messages[0].media = {
      url: "",
      poster: "",
      alt: "",
      width: 300,
      height: 200,
      duration: 0,
      waveform: [],
      playhead: 0,
      playbackRate: 1,
      playing: false,
      keep: false,
    };
    const next = reconcileSceneEdit(original, changed);
    expect(next.messages[3].at).toBe(4);
    expect(next.messages[3].statusAt).toBe(4);
    expect(Object.hasOwn(next.messages[0].media!, "url")).toBe(false);
    expect(Object.hasOwn(next.messages[0].media!, "poster")).toBe(false);
    expect(() => parseScene(next)).not.toThrow();
  });
  test("tracks follow message IDs through reorder and are removed with their target", () => {
    const original = structuredClone(defaultScene);
    original.timeline.tracks = [
      {
        id: "message-text",
        path: "/messages/1/text",
        keyframes: [{ at: 2, value: "Tracked message", easing: "step" }],
      },
    ];
    const changed = structuredClone(original);
    [changed.messages[0], changed.messages[1]] = [
      changed.messages[1],
      changed.messages[0],
    ];
    const reordered = reconcileSceneEdit(original, changed);
    expect(reordered.timeline.tracks[0].path).toBe("/messages/0/text");
    expect(evaluateScene(parseScene(reordered), 2).messages[0].text).toBe(
      "Tracked message",
    );
    const deleted = structuredClone(reordered);
    deleted.messages.shift();
    expect(reconcileSceneEdit(reordered, deleted).timeline.tracks).toHaveLength(
      0,
    );
  });
  test("nested reaction tracks follow stable reaction IDs and new duplicate tracks remain distinct", () => {
    const original = structuredClone(defaultScene);
    original.messages[1].reactions.push({
      id: "second-reaction",
      emoji: "👍",
      participantId: "jamie",
      at: 3,
    });
    original.timeline.tracks = [
      {
        id: "reaction",
        path: "/messages/1/reactions/1/emoji",
        keyframes: [{ at: 4, value: "✨", easing: "step" }],
      },
    ];
    const changed = structuredClone(original);
    changed.messages[1].reactions.shift();
    const next = reconcileSceneEdit(original, changed);
    expect(next.timeline.tracks[0].path).toBe("/messages/1/reactions/0/emoji");
    expect(() => parseScene(next)).not.toThrow();
  });
  test("retains unfinished typed fields but rejects exceeding structural limits", () => {
    const original = structuredClone(defaultScene);
    const draft = structuredClone(original);
    draft.contact.avatar = "https://";
    expect(reconcileSceneEdit(original, draft).contact.avatar).toBe("https://");
    expect(() => parseScene(draft)).toThrow("Fix contact");
    draft.messages = Array.from({ length: 161 }, (_, index) => ({
      ...structuredClone(original.messages[0]),
      id: `message-${index}`,
    }));
    expect(() => reconcileSceneEdit(original, draft)).toThrow("160 messages");
  });
});

test("all schema integer targets stay integral between valid keyframes", () => {
  const scene = structuredClone(defaultScene);
  scene.messages[0].file = {
    name: "Test.pdf",
    size: 5,
    mimeType: "application/pdf",
  };
  scene.messages[0].poll = {
    question: "Yes?",
    options: [
      { id: "yes", text: "Yes", votes: 1 },
      { id: "no", text: "No", votes: 2 },
    ],
    totalVotes: 3,
  };
  scene.messages[0].media = {
    width: 300,
    height: 201,
    duration: 4,
    alt: "",
    waveform: [],
    playhead: 0,
    playbackRate: 1,
    playing: false,
    keep: false,
  };
  const fields = [
    ["/statusBar/battery", 91],
    ["/statusBar/cellular", 1],
    ["/statusBar/wifi", 0],
    ["/device/width", 400],
    ["/device/height", 859],
    ["/messages/0/file/size", 8],
    ["/messages/0/poll/options/0/votes", 4],
    ["/messages/0/poll/totalVotes", 8],
    ["/messages/0/media/width", 307],
    ["/messages/0/media/height", 208],
  ] as const;
  scene.timeline.tracks = fields.map(([path, value], index) => ({
    id: `integer-${index}`,
    path,
    keyframes: [{ at: 4, value, easing: "linear" as const }],
  }));
  const validated = parseScene(scene);
  for (const at of [0.4, 0.7, 1.3, 2.9, 3.9]) {
    const frame = evaluateScene(validated, at);
    for (const [path] of fields)
      expect(Number.isInteger(readPointer(frame, path))).toBe(true);
  }
});

describe("optional native-state reconciliation", () => {
  test("deleting messages clears only their dependent interaction references and tracks", () => {
    const source = structuredClone(defaultScene);
    source.messages[1].editHistory = {
      versions: [
        { id: "original", text: "An earlier plan", editedAt: "9:40 AM" },
      ],
    };
    const previous = parseScene({
      ...source,
      composer: {
        ...source.composer,
        context: { mode: "reply", messageId: "coffee-2" },
      },
      conversation: {
        muted: true,
        unread: { messageId: "coffee-1" },
        pinned: { messageId: "coffee-2" },
      },
      interactions: {
        tapbackPicker: { messageId: "coffee-2" },
        editHistory: { messageId: "coffee-2" },
        attachmentTray: { kind: "photos" },
      },
      timeline: {
        ...source.timeline,
        tracks: [
          {
            id: "context-mode",
            path: "/composer/context/mode",
            keyframes: [
              { at: 1, value: "edit" },
              { at: 3, value: "recording" },
            ],
          },
          {
            id: "picker",
            path: "/interactions/tapbackPicker/visible",
            keyframes: [{ at: 2, value: false }],
          },
          {
            id: "keep-tray",
            path: "/interactions/attachmentTray/visible",
            keyframes: [{ at: 2, value: false }],
          },
        ],
      },
    });
    const changed = structuredClone(previous);
    changed.messages.splice(0, 2);
    const result = reconcileSceneEdit(previous, changed);
    expect(result.composer.context?.mode).toBe("normal");
    expect(result.composer.context?.messageId).toBeUndefined();
    expect(result.conversation).toEqual({ muted: true });
    expect(result.interactions?.tapbackPicker).toBeUndefined();
    expect(result.interactions?.editHistory).toBeUndefined();
    expect(result.interactions?.attachmentTray?.kind).toBe("photos");
    expect(result.timeline.tracks.map((track) => track.id)).toEqual([
      "context-mode",
      "keep-tray",
    ]);
    expect(
      result.timeline.tracks[0].keyframes.map((frame) => frame.value),
    ).toEqual(["recording"]);
    expect(() => parseScene(result)).not.toThrow();
  });
  test("reordering preserves native message references and deleting unrelated messages leaves them intact", () => {
    const previous = parseScene({
      ...defaultScene,
      composer: {
        ...defaultScene.composer,
        context: { mode: "reply", messageId: "coffee-2" },
      },
      conversation: { unread: { messageId: "coffee-2" } },
    });
    const changed = structuredClone(previous);
    changed.messages.reverse();
    changed.messages.pop();
    const result = reconcileSceneEdit(previous, changed);
    expect(result.composer.context).toEqual(previous.composer.context);
    expect(result.conversation?.unread).toEqual(previous.conversation?.unread);
    expect(() => parseScene(result)).not.toThrow();
  });
  test("shortening the composer clamps UTF-16 selection bounds and preserves flags", () => {
    const previous = parseScene({
      ...defaultScene,
      composer: {
        ...defaultScene.composer,
        text: "A👩🏽‍💻B coffee",
        selection: { start: 1, end: 10, showCaret: false, showHandles: true },
      },
    });
    const changed = structuredClone(previous);
    changed.composer.text = "Hi";
    expect(reconcileSceneEdit(previous, changed).composer.selection).toEqual({
      start: 1,
      end: 2,
      showCaret: false,
      showHandles: true,
    });
    const empty = structuredClone(previous);
    empty.composer.text = "";
    expect(reconcileSceneEdit(previous, empty).composer.selection).toEqual({
      start: 0,
      end: 0,
      showCaret: false,
      showHandles: true,
    });
    expect(() => parseScene(empty)).not.toThrow();
  });
  test("animated composer text cannot leave selection outside the evaluated frame", () => {
    const scene = parseScene({
      ...defaultScene,
      composer: {
        ...defaultScene.composer,
        text: "Hello",
        selection: { start: 2, end: 5 },
      },
      timeline: {
        duration: 8,
        loop: false,
        tracks: [
          {
            id: "erase",
            path: "/composer/text",
            keyframes: [{ at: 2, value: "", easing: "typewriter" }],
          },
        ],
      },
    });
    expect(evaluateScene(scene, 1).composer.selection).toEqual({
      start: 2,
      end: 3,
      showCaret: true,
      showHandles: true,
    });
    expect(evaluateScene(scene, 2).composer.selection).toEqual({
      start: 0,
      end: 0,
      showCaret: true,
      showHandles: true,
    });
    expect(scene.composer.selection?.end).toBe(5);
  });
});
