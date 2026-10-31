// Renders scenes to a static HTML gallery and, optionally, screenshots each one.
//
//   bun run gallery                       # writes .gallery/index.html
//   bun run gallery --shots .gallery      # also writes one PNG per scene
//   bun run gallery --docs                # regenerates the README images in docs/
//   bun run gallery --shots .gallery --fidelity # synthetic iMessage edge states
//   bun run gallery --shots .gallery --fidelity --only fidelity-incoming-edit
//   bun run gallery --shots .gallery --fidelity --only fidelity-card- --check-card-stacking
//   bun run gallery --shots .gallery --fidelity --only fidelity-final- --check-final-fidelity
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
import { inspectFinalFidelity } from "./final-fidelity.js";

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
    const finalChecks: { id: string; result: ReturnType<typeof inspectFinalFidelity> }[] = [];
    for (const { id } of entries) {
      const path = join(shotsDir, `${id}.png`);
      await page.locator(`[data-shot="${id}"] .tm-device-stage`).screenshot({ path, omitBackground: true });
      console.log(path);
      if (args.includes("--check-card-stacking"))
        cardChecks.push({ id, result: await page.locator(`[data-shot="${id}"]`).evaluate(inspectCardStacking) });
      if (args.includes("--check-final-fidelity"))
        finalChecks.push({ id, result: await page.locator(`[data-shot="${id}"]`).evaluate(inspectFinalFidelity) });
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
    if (finalChecks.length) {
      await writeFile(join(shotsDir, "final-fidelity.json"), JSON.stringify(finalChecks, null, 2));
      const palettes: Record<string, string> = { haha: "rgb(97, 213, 238)", emphasize: "rgb(255, 124, 120)", question: "rgb(188, 140, 232)" };
      const bad: string[] = [];
      for (const { id, result } of finalChecks) {
        for (const link of result.links)
          if (link.backgroundAlpha !== 1 || link.titleContrast < 4.5 || link.domainContrast < 4.5) bad.push(`${id}: unreadable or unresolved ${link.tint} link footer`);
        for (const glyph of result.glyphs) {
          if (palettes[glyph.kind] && glyph.body !== palettes[glyph.kind]) bad.push(`${id}: wrong ${glyph.kind} palette`);
          if (["like", "dislike"].includes(glyph.kind) && (glyph.svg || glyph.text !== (glyph.kind === "like" ? "👍" : "👎"))) bad.push(`${id}: thumb must be native emoji`);
          if (!glyph.kind && ["👍🏽", "😂"].includes(glyph.text) && glyph.svg) bad.push(`${id}: custom emoji was replaced`);
          if (glyph.filter.includes("grayscale")) bad.push(`${id}: reaction was desaturated`);
          if (!glyph.picker && (glyph.width !== 34 || glyph.height !== 34)) bad.push(`${id}: badge geometry changed`);
        }
        if (result.type) {
          const expected = Number(/final-type-(\d+)/.exec(id)?.[1]);
          if (result.type.fontSize !== expected || Math.abs(result.type.lineHeight - expected * 20.28 / 17) > 0.01) bad.push(`${id}: Dynamic Type metrics are fixed`);
          if (result.type.emojiSize !== 47 || result.type.stickerSize !== 97) bad.push(`${id}: emoji or sticker size changed`);
        }
      }
      for (const theme of ["light", "dark"]) {
        const normal = finalChecks.find((item) => item.id === `fidelity-final-type-17-${theme}`)?.result.type;
        const large = finalChecks.find((item) => item.id === `fidelity-final-type-21-${theme}`)?.result.type;
        if (!normal || !large || large.lines <= normal.lines) bad.push(`${theme}: larger text did not reflow`);
      }
      if (bad.length) throw new Error(`Final fidelity failed:\n${bad.join("\n")}`);
      console.log("Final fidelity: link footer contrast, native thumbs, actor-independent puff colors, badge geometry and17/21px wrapping passed.");
    }
  } finally {
    await context?.close();
    await browser.close();
  }
}
