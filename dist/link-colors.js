const rgba = (hex) => [
    ...[1, 3, 5].map((at) => parseInt(hex.slice(at, at + 2), 16)),
    hex.length === 9 ? parseInt(hex.slice(7, 9), 16) / 255 : 1,
];
const over = ([r, g, b, a], background) => [r, g, b].map((value, i) => value * a + background[i] * (1 - a));
const luminance = (rgb) => rgb.map((value) => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}).reduce((sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
/** Other platforms retain the existing v1 tint classification and alpha behavior. */
export function legacyLinkTone(tint) {
    return luminance(rgba(tint).slice(0, 3)) < 0.45 ? "dark" : "light";
}
/** Resolve the two tint layers onto a stable footer surface before choosing its ink. */
export function linkColors(tint, scene) {
    const screen = scene.theme === "dark" ? [0, 0, 0] : [255, 255, 255];
    const background = scene.appearance.wallpaper === "custom"
        ? over(rgba(scene.appearance.color), screen)
        : scene.appearance.wallpaper === "paper" ? [243, 239, 233] : screen;
    const color = rgba(tint);
    // The bubble paint and footer each draw the same tint. Flatten only the footer,
    // giving alpha colors a known opaque surface for deterministic readable text.
    const surface = over(color, over(color, background)).map((value) => Math.round(value * 1000) / 1000);
    const dark = contrast([255, 255, 255], surface) > contrast([0, 0, 0], surface);
    const muted = dark ? [235, 235, 245, 0.7] : [60, 60, 67, 0.8];
    return {
        tone: dark ? "dark" : "light",
        surface: `rgb(${surface.join(" ")})`,
        domain: contrast(over(muted, surface), surface) >= 4.5
            ? `rgb(${muted[0]} ${muted[1]} ${muted[2]} / ${muted[3]})`
            : dark ? "#fff" : "#000",
    };
}
