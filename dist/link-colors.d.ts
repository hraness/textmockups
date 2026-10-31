import type { Scene } from "./schema.js";
/** Other platforms retain the existing v1 tint classification and alpha behavior. */
export declare function legacyLinkTone(tint: string): "dark" | "light";
/** Resolve the two tint layers onto a stable footer surface before choosing its ink. */
export declare function linkColors(tint: string, scene: Pick<Scene, "theme" | "appearance">): {
    tone: "light" | "dark";
    surface: string;
    domain: string;
};
