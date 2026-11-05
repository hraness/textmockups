import type { Scene } from "./schema.js";
/** Other platforms retain the existing v1 tint classification and alpha behavior. */
export declare function legacyLinkTone(tint: string): "dark" | "light";
/** Resolve the two tint layers onto a stable footer surface before choosing its ink. */
/** `white` is the contrast at which white ink always wins: 4 for footers, 3.2 for a video card's
 * post-style footer (#908c91 takes white at 3.3:1 on an iOS 26 device); the compact card, which a site
 * icon tints whole, takes white sooner (#ff6600 at 2.9:1 on an iOS 26 device). */
export declare function linkColors(tint: string, scene: Pick<Scene, "theme" | "appearance">, lean?: number): {
    tone: "light" | "dark";
    surface: string;
    domain: string;
};
