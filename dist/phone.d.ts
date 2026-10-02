import type { ComponentType, CSSProperties, ImgHTMLAttributes } from "react";
import type { Scene } from "./schema.js";
/** Props the renderer passes to the image slot. `src` is the scene's authored asset reference. */
export type PhoneImageProps = ImgHTMLAttributes<HTMLImageElement>;
/** Props the renderer passes to the video slot. `playhead` is the evaluated media time in seconds. */
export type PhoneVideoProps = {
    src: string;
    playhead: number;
    width?: number;
    height?: number;
    poster?: string;
    className?: string;
};
/**
 * Optional media slots. The defaults render HTTPS and inline raster images with
 * a plain `<img>` and show a video's poster frame. Apps that keep media
 * elsewhere (for example browser-local storage) pass their own components.
 */
export type PhoneMedia = {
    Image: ComponentType<PhoneImageProps>;
    Video: ComponentType<PhoneVideoProps>;
};
/** Plain image slot. Browser-local `local:` references have no URL here, so they render empty. */
export declare function PhoneImage({ src, alt, ...props }: PhoneImageProps): import("react").JSX.Element;
/** Plain video slot: the poster frame, which is what a paused video shows. */
export declare function PhoneVideoPoster({ poster, className }: PhoneVideoProps): import("react").JSX.Element | null;
export declare const defaultPhoneMedia: PhoneMedia;
export type PhoneProps = {
    scene: Scene;
    /** Explicit deterministic playhead, in seconds. Undefined displays the whole document. */
    time?: number;
    selectedMessageId?: string;
    onSelectMessage?: (id: string) => void;
    exporting?: boolean;
    watermark?: boolean;
    /** Image and video slots. Missing entries fall back to `defaultPhoneMedia`. */
    media?: Partial<PhoneMedia>;
};
/** Stable, smooth, scene-seeded color drift. This is branding, not a security watermark. */
export declare function watermarkStyle(sceneId: string, seconds: number): CSSProperties;
export declare function Phone({ scene: source, time, selectedMessageId, onSelectMessage, exporting, watermark, media: mediaSlots, }: PhoneProps): import("react").JSX.Element;
