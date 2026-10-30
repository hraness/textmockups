import { expect, test } from "bun:test";
import { mkdtemp, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import { chromiumLaunchOptions, provisionedChromium } from "./browser.js";

test("gallery merges required disabled features with the pinned Playwright defaults into one switch", () => {
  const runtime = readFileSync(new URL("../node_modules/playwright-core/lib/coreBundle.js", import.meta.url), "utf8");
  const declaration = /disabledFeatures = \[([\s\S]*?)\]\.filter\(Boolean\)/.exec(runtime)?.[1];
  expect(declaration).toBeDefined();
  const defaults = [...declaration!.matchAll(/^\s*"([^"]+)"[,]?\s*$/gm)].map((match) => match[1]!);
  expect(defaults.length).toBeGreaterThan(0);
  expect(chromiumLaunchOptions.ignoreDefaultArgs).toContain(`--disable-features=${defaults.join(",")}`);
  const switches = chromiumLaunchOptions.args.filter((arg) => arg.startsWith("--disable-features="));
  expect(switches).toHaveLength(1);
  const merged = switches[0]!.slice("--disable-features=".length).split(",");
  expect(merged).toEqual([...new Set([...defaults, "PaintHolding", "MacAppCodeSignClone"])]);
  expect(chromiumLaunchOptions.args).toContain("--mute-audio");
});

test("gallery accepts the provisioned file and refuses missing browsers, executable overrides, and symlinks", async () => {
  const work = await realpath(await mkdtemp(join(tmpdir(), "textmockups-browser-")));
  try {
    const pinned = join(work, "pinned-chromium");
    const other = join(work, "another-browser");
    const linked = join(work, "linked-chromium");
    await writeFile(pinned, "test browser fixture");
    await writeFile(other, "test alternative fixture");
    await symlink(other, linked);
    expect(provisionedChromium(pinned)).toBe(pinned);
    expect(provisionedChromium(pinned, pinned)).toBe(pinned);
    expect(() => provisionedChromium(join(work, "missing"))).toThrow("Pinned Chromium is missing");
    expect(() => provisionedChromium(pinned, other)).toThrow("cannot override");
    expect(() => provisionedChromium(pinned, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")).toThrow("cannot override");
    expect(() => provisionedChromium(linked)).toThrow("never the installed Chrome application or a symlink");
  } finally {
    await rm(work, { recursive: true, force: true });
  }
});
