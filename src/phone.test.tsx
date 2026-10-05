import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Phone, PhoneFit, type PhoneImageProps } from "./phone.js";
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
      "<b>Today</b> 9:41 AM",
    );
    const plain = parseScene({
      ...scene,
      messages: [{ ...scene.messages[0], dateLabel: "Yesterday" }],
    });
    expect(renderToStaticMarkup(<Phone scene={plain} />)).toContain(
      "<span>Yesterday</span>",
    );
  });
});
