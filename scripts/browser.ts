import { realpathSync } from "node:fs";
import { resolve } from "node:path";

// Playwright 1.62.0's default switch, verified against the pinned runtime by browser.test.ts.
// Replace it with the merged value: a second --disable-features switch discards defaults.
const playwrightDisabledFeatures = [
  "AvoidUnnecessaryBeforeUnloadCheckSync",
  "BoundaryEventDispatchTracksNodeRemoval",
  "DestroyProfileOnBrowserClose",
  "DialMediaRouteProvider",
  "GlobalMediaControls",
  "HttpsUpgrades",
  "LensOverlay",
  "MediaRouter",
  "PaintHolding",
  "ThirdPartyStoragePartitioning",
  "BlockOriginHeaderModificationOnRedirect",
  "Translate",
  "AutoDeElevate",
  "OptimizationHints",
  "msForceBrowserSignIn",
  "msEdgeUpdateLaunchServicesPreferredVersion",
];
export const chromiumLaunchOptions = {
  ignoreDefaultArgs: [`--disable-features=${playwrightDisabledFeatures.join(",")}`, "--mute-audio"],
  args: ["--mute-audio", `--disable-features=${[...new Set([...playwrightDisabledFeatures, "PaintHolding", "MacAppCodeSignClone"])].join(",")}`],
};

/** Only the browser provisioned for this checkout's pinned Playwright may run. */
export function provisionedChromium(executablePath: string, override?: string): string {
  const expected = resolve(executablePath);
  if (override && resolve(override) !== expected)
    throw new Error("TEXTMOCKUPS_BROWSER cannot override pinned Chromium. Provision it with PLAYWRIGHT_SKIP_BROWSER_GC=1 bun node_modules/playwright-core/cli.js install chromium.");
  let actual: string;
  try {
    actual = realpathSync(expected);
  } catch {
    throw new Error("Pinned Chromium is missing. Provision it with PLAYWRIGHT_SKIP_BROWSER_GC=1 bun node_modules/playwright-core/cli.js install chromium.");
  }
  if (actual !== expected || /Google Chrome(?: Beta| Dev| Canary)?\.app(?:\/|$)/.test(actual))
    throw new Error("Pinned Chromium must be its provisioned executable, never the installed Chrome application or a symlink.");
  return actual;
}
