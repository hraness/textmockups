import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Phone, PhoneFit, type PhoneImageProps } from "./phone.js";
import type { PhoneTextProps } from "./text.js";
import { defaultScene, presets } from "./presets.js";
import { parseScene } from "./schema.js";

const withAvatar = (avatar: string) =>
  parseScene({
    ...defaultScene,
    contact: { ...defaultScene.contact, avatar },
  });

describe("Phone", () => {
  test("renders every preset on the server without scripts", () => {
    for (const preset of presets) {
      const html = renderToStaticMarkup(<Phone scene={preset.scene} />);
      expect(html).toContain("data-textmock-phone");
      expect(html).toContain(`data-platform="${preset.scene.platform}"`);
    }
  });
  test("is deterministic for a fixed playhead", () => {
    const render = () =>
      renderToStaticMarkup(<Phone scene={defaultScene} time={2.5} />);
    expect(render()).toBe(render());
  });
  test("the default image slot renders HTTPS assets and leaves browser-local references empty", () => {
    const https = renderToStaticMarkup(
      <Phone scene={withAvatar("https://example.com/a.png")} />,
    );
    expect(https).toContain('src="https://example.com/a.png"');
    const local = renderToStaticMarkup(
      <Phone scene={withAvatar(`local:${"a".repeat(64)}`)} />,
    );
    expect(local).not.toContain("local:");
  });
  test("the default text slot leaves the markup unchanged apart from message ids", () => {
    const html = renderToStaticMarkup(<Phone scene={defaultScene} />);
    expect(html).toContain(`data-message-id="${defaultScene.messages[0]!.id}"`);
    for (const message of defaultScene.messages)
      if (message.text && !message.textRuns) expect(html).toContain(message.text.replaceAll("'", "&#x27;"));
  });
  test("a custom text slot wraps message text, the contact name, and the clock", () => {
    const seen = new Set<string>();
    const Text = ({ field, messageId, children }: PhoneTextProps) => {
      seen.add(messageId ? `${field}:${messageId}` : field);
      return <b data-edit={field}>{children}</b>;
    };
    for (const preset of presets) {
      seen.clear();
      renderToStaticMarkup(<Phone scene={preset.scene} text={Text} />);
      expect(seen.has("contact")).toBe(true);
      if (preset.scene.statusBar.visible) expect(seen.has("clock")).toBe(true);
      const texted = preset.scene.messages.find((message) => message.text);
      if (texted) expect(seen.has(`message:${texted.id}`)).toBe(true);
    }
  });
  test("a custom image slot receives the authored reference", () => {
    const seen: unknown[] = [];
    const Image = (props: PhoneImageProps) => {
      seen.push(props.src);
      return <img data-custom alt="" />;
    };
    const ref = `local:${"b".repeat(64)}`;
    const html = renderToStaticMarkup(
      <Phone scene={withAvatar(ref)} media={{ Image }} />,
    );
    expect(seen).toContain(ref);
    expect(html).toContain("data-custom");
  });
  test("watermark is on by default and can be turned off", () => {
    expect(renderToStaticMarkup(<Phone scene={defaultScene} />)).toContain(
      "data-textmock-watermark",
    );
    expect(
      renderToStaticMarkup(<Phone scene={defaultScene} watermark={false} />),
    ).not.toContain("data-textmock-watermark");
  });
  test("PhoneFit keeps the device ratio and scales by CSS", () => {
    const html = renderToStaticMarkup(<PhoneFit scene={defaultScene} />);
    expect(html).toContain('class="tm-fit"');
    expect(html).toContain("aspect-ratio:393 / 852");
    expect(html).toContain("--tm-fit-width:393px");
  });
  test("Android scenes draw Android chrome and no iPhone hardware", () => {
    const scene = presets.find((preset) => preset.id === "pixel-late")!.scene;
    const html = renderToStaticMarkup(<Phone scene={scene} />);
    expect(html).toContain('data-os="android"');
    expect(html).toContain('data-model="pixel-11-pro"');
    expect(html).toContain('data-system="pixel"');
    expect(html).toContain("tm-status-android");
    expect(html).toContain("tm-nav-bar");
    expect(html).toContain('class="tm-cutout"');
    expect(html).toContain("tm-gm-receipt");
    expect(html).not.toContain("tm-island");
    expect(html).not.toContain("tm-home-indicator");
    expect(html).not.toContain("tm-side-button");
  });
  test("Galaxy scenes draw One UI three-button navigation", () => {
    const scene = presets.find((preset) => preset.id === "galaxy-dinner")!
      .scene;
    const html = renderToStaticMarkup(<Phone scene={scene} />);
    expect(html).toContain('data-system="one-ui"');
    expect(html).toContain("tm-nav-recents");
  });
  test("a frameless device model draws no hardware chrome", () => {
    const scene = parseScene({
      ...defaultScene,
      platform: "whatsapp",
      device: { model: "pixel-11", frame: "none" },
    });
    const html = renderToStaticMarkup(<Phone scene={scene} />);
    expect(html).toContain('data-frame="none"');
    expect(html).toContain("tm-status-android");
    expect(html).not.toContain('class="tm-cutout"');
    expect(html).not.toContain("tm-side-key");
  });
  test("PhoneFit sizes a modelled phone by its framed stage", () => {
    const scene = presets.find((preset) => preset.id === "pixel-late")!.scene;
    const html = renderToStaticMarkup(<PhoneFit scene={scene} />);
    expect(html).toContain("aspect-ratio:442 / 946");
  });
  test("iMessage sets the day of a date label in semibold", () => {
    const scene = parseScene({
      ...defaultScene,
      messages: [{ ...defaultScene.messages[0], dateLabel: "Today 9:41 AM" }],
    });
    expect(renderToStaticMarkup(<Phone scene={scene} />)).toContain(
      "<b>Today</b> 9:41\u202fAM",
    );
    const plain = parseScene({
      ...scene,
      messages: [{ ...scene.messages[0], dateLabel: "Yesterday" }],
    });
    expect(renderToStaticMarkup(<Phone scene={plain} />)).toContain(
      "<span>Yesterday</span>",
    );
  });
  test("iMessage sets emoji apart and underlines a detected time", () => {
    const scene = parseScene({
      ...defaultScene,
      messages: [{ ...defaultScene.messages[0], text: "the drop at 3:17 😆" }],
    });
    const html = renderToStaticMarkup(<Phone scene={scene} />);
    expect(html).toContain('<span class="tm-detected">3:17</span>');
    expect(html).toContain('<span class="tm-emoji">😆</span>');
  });
  test("a pause starts a new bubble group from the same sender", () => {
    const first = { ...defaultScene.messages[0], id: "a", text: "one", dateLabel: "" };
    const tails = (pause: boolean) =>
      renderToStaticMarkup(
        <Phone
          scene={parseScene({
            ...defaultScene,
            messages: [first, { ...first, id: "b", text: "two", pause }],
          })}
        />,
      ).match(/data-tail="true"/g)?.length;
    expect(tails(false)).toBe(1);
    expect(tails(true)).toBe(2);
  });
  test("iMessage draws a gallery as a collage, or a deck past four", () => {
    const gallery = (count: number) =>
      renderToStaticMarkup(
        <Phone
          scene={parseScene({
            ...defaultScene,
            messages: [
              {
                ...defaultScene.messages[0],
                kind: "image",
                text: "",
                gallery: {
                  items: [{ width: 800, height: 600 }, { width: 600, height: 800 }],
                  count,
                },
              },
            ],
          })}
        />,
      );
    expect(gallery(2)).toContain("tm-im-collage");
    expect(gallery(15)).toContain("tm-im-deck");
    expect(gallery(15)).toContain("15 Items");
  });
  test("a link with words and an icon is a text post", () => {
    const scene = parseScene({
      ...defaultScene,
      messages: [
        {
          ...defaultScene.messages[0],
          kind: "link",
          text: "",
          link: {
            url: "https://example.com/post",
            title: "Sam (@sam)",
            description: "A thought worth sharing.",
            icon: "https://example.com/sam.png",
          },
        },
      ],
    });
    const html = renderToStaticMarkup(<Phone scene={scene} />);
    expect(html).toContain("tm-link-post");
    expect(html).toContain("<p>A thought worth sharing.</p>");
  });
  test("iMessage keeps a set receipt above their reply and sets its time in regular weight", () => {
    const base = { ...defaultScene.messages[0], dateLabel: "", statusText: "" };
    const scene = (statusText: string) =>
      parseScene({
        ...defaultScene,
        messages: [
          { ...base, id: "a", senderId: "me", text: "on my way", status: "read", statusText },
          { ...base, id: "b", senderId: "jamie", text: "see you" },
        ],
      });
    expect(renderToStaticMarkup(<Phone scene={scene("")} />)).not.toContain("tm-receipt");
    expect(renderToStaticMarkup(<Phone scene={scene("Read 11:38 AM")} />)).toContain(
      "Read<span> 11:38\u202fAM</span>",
    );
  });
  test("an iMessage tapback ends the group above it", () => {
    const base = { ...defaultScene.messages[0], senderId: "me", dateLabel: "", reactions: [] };
    const html = renderToStaticMarkup(
      <Phone
        scene={parseScene({
          ...defaultScene,
          messages: [
            { ...base, id: "a", text: "one" },
            { ...base, id: "b", text: "two", reactions: [{ id: "r", emoji: "HAHA", participantId: "jamie", at: base.at }] },
          ],
        })}
      />,
    );
    expect(html.match(/data-tail="true"/g)?.length).toBe(2);
    expect(html).toContain("data-tapback");
  });
  test("a second line's signal draws the dual SIM indicator", () => {
    const scene = parseScene({
      ...defaultScene,
      statusBar: { ...defaultScene.statusBar, cellular2: 2 },
    });
    expect(renderToStaticMarkup(<Phone scene={scene} />)).toContain(
      'viewBox="0 0 65 45"',
    );
  });
});
