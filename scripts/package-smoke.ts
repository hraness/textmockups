// Packs the package, checks its file list, and imports the packed entry points
// from a clean directory the way a consumer would.
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const work = await mkdtemp(join(tmpdir(), "textmockups-smoke-"));
const run = (cmd: string[], cwd: string) => {
  const result = Bun.spawnSync(cmd, { cwd, stdout: "pipe", stderr: "pipe" });
  if (result.exitCode !== 0) {
    console.error(result.stdout.toString(), result.stderr.toString());
    throw new Error(`${cmd.join(" ")} failed`);
  }
  return result.stdout.toString();
};
try {
  const supplied = process.argv[2];
  if (!supplied) run(["bun", "pm", "pack", "--ignore-scripts", "--destination", work], root);
  const name = supplied ?? run(["ls", work], work).trim().split("\n").find((name) => name.endsWith(".tgz"));
  if (!name) throw new Error("no tarball");
  const tarball = supplied ? resolve(name) : join(work, name);
  const listing = run(["tar", "-tzf", tarball], work);
  for (const file of [
    "package/dist/index.js",
    "package/dist/index.d.ts",
    "package/dist/phone.css",
    "package/dist/fonts/roboto-flex-latin.woff2",
    "package/dist/fonts/google-sans-flex-latin.woff2",
    "package/LICENSE",
    "package/README.md",
    "package/THIRD-PARTY-NOTICES.md",
  ])
    if (!listing.includes(file)) throw new Error(`packed tarball is missing ${file}`);
  if (listing.includes("package/src/")) throw new Error("packed tarball includes src/");
  const app = join(work, "app");
  run(["mkdir", "-p", app], work);
  await Bun.write(join(app, "package.json"), JSON.stringify({ name: "smoke", private: true, type: "module" }));
  run(["bun", "add", "--ignore-scripts", tarball, `react@${(await import("react")).version}`, `react-dom@${(await import("react")).version}`], app);
  await Bun.write(
    join(app, "smoke.mjs"),
    `import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Phone, defaultScene, parseScene } from "@hraness/textmockups";
import { evaluateScene } from "@hraness/textmockups/timeline";
import { SCENE_VERSION } from "@hraness/textmockups/schema";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const scene = parseScene(JSON.parse(JSON.stringify(defaultScene)));
const html = renderToStaticMarkup(createElement(Phone, { scene: evaluateScene(scene, 1) }));
if (!html.includes("data-textmock-phone") || SCENE_VERSION !== 1) process.exit(1);
const css = fileURLToPath(import.meta.resolve("@hraness/textmockups/phone.css"));
const sheet = await Bun.file(css).text();
if (!sheet.includes(".tm-phone")) process.exit(1);
for (const part of sheet.split('url("./').slice(1)) {
  const font = part.slice(0, part.indexOf('"'));
  if (!(await Bun.file(join(dirname(css), font)).exists()))
    throw new Error(\`phone.css references missing asset \${font}\`);
}
console.log("packed package renders");`,
  );
  console.log(run(["bun", "smoke.mjs"], app).trim());
} finally {
  await rm(work, { recursive: true, force: true });
}
