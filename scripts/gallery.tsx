// Renders scenes to a static HTML gallery and, optionally, screenshots each one.
//
//   bun run gallery                       # writes .gallery/index.html
//   bun run gallery --shots .gallery      # also writes one PNG per scene
//   bun run gallery --docs                # regenerates the README images in docs/
//
// Screenshots use the Chromium build provisioned for the pinned playwright-core
// (`bunx playwright-core install chromium`), or TEXTMOCKUPS_BROWSER.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { Phone } from "../src/phone.js";
import { parseScene, type Scene } from "../src/schema.js";
import { presets } from "../src/presets.js";
import { heroScenes } from "./hero-scenes.js";

const root = resolve(import.meta.dir, "..");
const args = process.argv.slice(2);
const docs = args.includes("--docs");
const shotsAt = args.indexOf("--shots");
const shotsDir = docs ? join(root, "docs") : shotsAt >= 0 ? resolve(args[shotsAt + 1] ?? ".gallery") : undefined;

type Entry = { id: string; scene: Scene };
const themed = (scene: Scene, theme: Scene["theme"]): Scene =>
  parseScene({ ...scene, id: `${scene.id}-${theme}`, theme });

const entries: Entry[] = docs
  ? heroScenes.map((scene) => ({ id: scene.id, scene }))
  : presets.flatMap((preset) =>
      (["light", "dark"] as const).map((theme) => ({
        id: `${preset.id}-${theme}`,
        scene: themed(preset.scene, theme),
      })),
    );

const css = await readFile(join(root, "src", "phone.css"), "utf8");
const body = entries
  .map(
    ({ id, scene }) =>
      `<figure data-shot="${id}">${renderToStaticMarkup(<Phone scene={scene} watermark={false} />)}<figcaption>${id}</figcaption></figure>`,
  )
  .join("\n");
const html = `<!doctype html><html><head><meta charset="utf-8"><title>textmockups gallery</title><style>${css}
body{margin:0;padding:24px;display:flex;flex-wrap:wrap;gap:24px;background:transparent;font-family:system-ui}
figure{margin:0;padding:24px}figcaption{font:12px system-ui;color:#888;text-align:center}
[data-docs] figcaption{display:none}</style></head><body${docs ? " data-docs" : ""}>${body}</body></html>`;
const out = join(root, ".gallery");
await mkdir(out, { recursive: true });
await writeFile(join(out, "index.html"), html);
console.log(join(out, "index.html"));

if (shotsDir) {
  const { chromium } = await import("playwright-core");
  await mkdir(shotsDir, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.TEXTMOCKUPS_BROWSER ? { executablePath: process.env.TEXTMOCKUPS_BROWSER } : {}),
    args: ["--mute-audio", "--disable-features=PaintHolding,MacAppCodeSignClone"],
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1800, height: 1000 }, deviceScaleFactor: 2 });
    await page.goto(`file://${join(out, "index.html")}`);
    await page.evaluate(() => document.fonts.ready);
    for (const { id } of entries) {
      const path = join(shotsDir, `${id}.png`);
      await page.locator(`[data-shot="${id}"] .tm-device-stage`).screenshot({ path, omitBackground: true });
      console.log(path);
    }
  } finally {
    await browser.close();
  }
}
