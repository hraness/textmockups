import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import * as api from "./index.js";

const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");

test("the README example scene parses and renders", () => {
  const block = /```tsx\n([\s\S]*?)```/.exec(readme)?.[1] ?? "";
  const literal = /parseScene\((\{[\s\S]*?\n\})\);/.exec(block)?.[1];
  expect(literal).toBeDefined();
  // The example is a plain object literal with comments; evaluate it as data.
  const input = new Function(`return (${literal});`)() as unknown;
  const scene = api.parseScene(input);
  const html = renderToStaticMarkup(<api.Phone scene={scene} watermark={false} />);
  expect(html).toContain('data-platform="whatsapp"');
  expect(html).toContain("Farmers market tomorrow?");
});

test("the README names only exported functions", () => {
  for (const name of ["Phone", "parseScene", "evaluateScene", "sceneTime", "SceneSchema", "presets", "defaultScene"])
    expect(name in api).toBe(true);
  expect(readme).toContain(`github:hraness/textmockups#v${JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version}`);
});
