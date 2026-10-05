import type { CSSProperties } from "react";
import type { Scene } from "./schema.js";
import { type AndroidIconName } from "./icons-android.js";
/** Material Symbols, rounded style. Paths ship in src/icons-android.ts. */
export declare function MatIcon({ name, size, className, style, }: {
    name: AndroidIconName;
    size?: number;
    className?: string;
    style?: CSSProperties;
}): import("react").JSX.Element;
export declare function androidSystem(scene: Scene): "pixel" | "one-ui";
/**
 * Android status bar: a bold clock on the left; Wi-Fi, cellular and a battery
 * pill on the right. One UI draws the battery percentage inside the pill.
 */
export declare function AndroidStatusBar({ scene }: {
    scene: Scene;
}): import("react").JSX.Element;
/**
 * Android navigation. Pixels ship gesture navigation (a centered handle);
 * Galaxy phones ship three-button navigation (recents, home, back).
 */
export declare function AndroidNavBar({ scene }: {
    scene: Scene;
}): import("react").JSX.Element;
/** Android keyboards follow the phone's system: Gboard on Pixel, Samsung Keyboard on Galaxy. */
export declare function AndroidKeyboard({ scene }: {
    scene: Scene;
}): import("react").JSX.Element;
