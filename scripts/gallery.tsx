// Renders scenes to a static HTML gallery and, optionally, screenshots each one.
//
//   bun run gallery                       # writes .gallery/index.html
//   bun run gallery --shots .gallery      # also writes one PNG per scene
//   bun run gallery --docs                # regenerates the README images in docs/
//   bun run gallery --shots .gallery --fidelity # synthetic iMessage edge states
//   bun run gallery --shots .gallery --fidelity --only fidelity-incoming-edit
//   bun run gallery --shots .gallery --fidelity --only fidelity-card- --check-card-stacking
//
// Screenshots use the Chromium build provisioned for the pinned playwright-core
// (`PLAYWRIGHT_SKIP_BROWSER_GC=1 bun node_modules/playwright-core/cli.js install chromium`).
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { Phone } from "../src/phone.js";
import { parseScene, type Scene } from "../src/schema.js";
import { presets } from "../src/presets.js";
import { heroScenes } from "./hero-scenes.js";
import { fidelityScenes } from "./fidelity-scenes.js";
import { chromiumLaunchOptions, provisionedChromium } from "./browser.js";
import { inspectCardStacking } from "./card-stacking.js";

const root = resolve(import.meta.dir, "..");
const args = process.argv.slice(2);
const docs = args.includes("--docs");
const shotsAt = args.indexOf("--shots");
const shotsDir = docs ? join(root, "docs") : shotsAt >= 0 ? resolve(args[shotsAt + 1] ?? ".gallery") : undefined;

type Entry = { id: string; scene: Scene };
const themed = (scene: Scene, theme: Scene["theme"]): Scene =>
  parseScene({ ...scene, id: `${scene.id}-${theme}`, theme });

const allEntries: Entry[] = docs
  ? heroScenes.map((scene) => ({ id: scene.id, scene }))
  : (args.includes("--fidelity")
      ? fidelityScenes.map((scene) => ({ id: scene.id, scene }))
      : presets).flatMap((preset) =>
      (["light", "dark"] as const).map((theme) => ({
        id: `${preset.id}-${theme}`,
        scene: themed(preset.scene, theme),
      })),
    );
const onlyAt = args.indexOf("--only");
const only = onlyAt >= 0 ? args[onlyAt + 1] : undefined;
if (onlyAt >= 0 && !only) throw new Error("--only needs a scene id prefix");
const entries = only ? allEntries.filter((entry) => entry.id.startsWith(only)) : allEntries;
if (!entries.length) throw new Error(`No gallery scenes match ${only}`);

const css = await readFile(join(root, "src", "phone.css"), "utf8");
const fitting = await Bun.build({ entrypoints: [join(root, "src", "fit.ts")], target: "browser", format: "esm" });
if (!fitting.success) throw new Error("Could not bundle gallery bubble fitting", { cause: fitting.logs });
const fittingScript = await fitting.outputs[0]!.text();
const body = entries
  .map(
    ({ id, scene }) =>
      `<figure data-shot="${id}">${renderToStaticMarkup(<Phone scene={scene} watermark={false} />)}<figcaption>${id}</figcaption></figure>`,
  )
  .join("\n");
const html = `<!doctype html><html><head><meta charset="utf-8"><title>textmockups gallery</title><style>${css}
body{margin:0;padding:24px;display:flex;flex-wrap:wrap;gap:24px;background:transparent;font-family:system-ui}
figure{margin:0;padding:24px}figcaption{font:12px system-ui;color:#888;text-align:center}
[data-docs] figcaption{display:none}</style></head><body${docs ? " data-docs" : ""}>${body}<script type="module">${fittingScript}
await document.fonts.ready;
fitBubbles(document);
document.documentElement.dataset.fitted = "true";
</script></body></html>`;
const out = join(root, ".gallery");
await mkdir(out, { recursive: true });
await cp(join(root, "src", "fonts"), join(out, "fonts"), { recursive: true });
await writeFile(join(out, "index.html"), html);
console.log(join(out, "index.html"));

if (shotsDir) {
  const { chromium } = await import("playwright-core");
  await mkdir(shotsDir, { recursive: true });
  const executablePath = provisionedChromium(chromium.executablePath(), process.env.TEXTMOCKUPS_BROWSER);
  console.log(`Browser executable: ${executablePath}`);
  const browser = await chromium.launch({
    ...chromiumLaunchOptions,
    headless: true,
    executablePath,
  });
  let context: import("playwright-core").BrowserContext | undefined;
  try {
    console.log(`Browser version: ${browser.version()}`);
    context = await browser.newContext({ viewport: { width: 1800, height: 1000 }, deviceScaleFactor: 2 });
    const page = await context.newPage();
    await page.goto(`file://${join(out, "index.html")}`);
    await page.waitForFunction(() => document.documentElement.dataset.fitted === "true");
    const cardChecks: { id: string; result: ReturnType<typeof inspectCardStacking> }[] = [];
    for (const { id } of entries) {
      const path = join(shotsDir, `${id}.png`);
      await page.locator(`[data-shot="${id}"] .tm-device-stage`).screenshot({ path, omitBackground: true });
      console.log(path);
      if (args.includes("--check-card-stacking"))
        cardChecks.push({ id, result: await page.locator(`[data-shot="${id}"]`).evaluate(inspectCardStacking) });
    }
    if (cardChecks.length) {
      await writeFile(join(shotsDir, "card-stacking.json"), JSON.stringify(cardChecks, null, 2));
      const bad = cardChecks.flatMap(({ id, result }) => [
        ...result.cards.filter((card) => !card.layered || card.occluded.length || !card.reactionsAbove).map((card) => `${id}: ${card.kind}/${card.side}/${card.content}: ${card.occluded.join("; ") || "invalid layer order"}`),
        ...result.edited.filter((label) => label.color === label.receiptColor).map(() => `${id}: Edited needs its blue link color`),
      ]);
      if (!cardChecks.some(({ result }) => result.cards.length)) bad.push("No rendered card content was inspected");
      if (bad.length) throw new Error(`Card stacking failed:\n${bad.join("\n")}`);
      console.log(`Card stacking: ${cardChecks.reduce((sum, item) => sum + item.result.cards.length, 0)} visible content layers; reactions and Edited link colors checked.`);
    }
  } finally {
    await context?.close();
    await browser.close();
  }
}
