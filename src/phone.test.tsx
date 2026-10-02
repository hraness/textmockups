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
