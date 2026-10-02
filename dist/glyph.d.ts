import type { CSSProperties } from "react";
export type GlyphName = "back" | "chevron" | "plus" | "mic" | "wave" | "video" | "phone" | "camera" | "send" | "paperclip" | "smile" | "play" | "pause" | "check" | "double-check" | "clock" | "file" | "pin" | "lock" | "more" | "close" | "shift" | "backspace" | "globe" | "star" | "download" | "arrow-up" | "gift" | "sticker";
/** Original vector drawings, sized in the renderer's logical points. */
export declare function Glyph({ name, size, className, style, }: {
    name: GlyphName;
    size?: number;
    className?: string;
    style?: CSSProperties;
}): import("react").JSX.Element;
