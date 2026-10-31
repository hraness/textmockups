import { expect, test } from "bun:test";
import { linkColors } from "./link-colors.js";
import { defaultScene } from "./presets.js";

test("transparent RGB values take their foreground from the rendered scene surface", () => {
  for (const tint of ["#ffffff00", "#00000000"]) {
    expect(linkColors(tint, { ...defaultScene, theme: "dark" })).toMatchObject({ tone: "dark", surface: "rgb(0 0 0)" });
    expect(linkColors(tint, { ...defaultScene, theme: "light" })).toMatchObject({ tone: "light", surface: "rgb(255 255 255)" });
  }
});

test("alpha accounts for both existing tint paint layers", () => {
  expect(linkColors("#ffffff80", { ...defaultScene, theme: "dark" })).toMatchObject({ tone: "light", surface: "rgb(191.749 191.749 191.749)" });
  expect(linkColors("#00000080", { ...defaultScene, theme: "light" })).toMatchObject({ tone: "dark", surface: "rgb(63.251 63.251 63.251)" });
});

test("opaque red and middle gray choose readable black ink and strengthen the domain", () => {
  for (const theme of ["light", "dark"] as const)
    for (const tint of ["#ff0000", "#777777"])
      expect(linkColors(tint, { ...defaultScene, theme })).toMatchObject({ tone: "light", domain: "#000" });
});

test("opaque sampled light and dark colors keep their surface and native muted domain", () => {
  expect(linkColors("#f4e4c8", defaultScene)).toEqual({ tone: "light", surface: "rgb(244 228 200)", domain: "rgb(60 60 67 / 0.8)" });
  expect(linkColors("#263544", defaultScene)).toEqual({ tone: "dark", surface: "rgb(38 53 68)", domain: "rgb(235 235 245 / 0.7)" });
});

test("a custom scene surface is composited before transparent link colors", () => {
  const scene = { ...defaultScene, theme: "dark" as const, appearance: { ...defaultScene.appearance, wallpaper: "custom" as const, color: "#ffffff" } };
  expect(linkColors("#00000000", scene)).toMatchObject({ tone: "light", surface: "rgb(255 255 255)" });
});
