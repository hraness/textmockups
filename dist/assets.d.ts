/** Portable raster assets are small, static, and dimension-bounded. SVG and arbitrary data URLs are never accepted. */
export declare const MAX_INLINE_IMAGE_BYTES = 32768;
export declare const MAX_INLINE_IMAGE_SIDE = 1024;
export type RasterSize = {
    width: number;
    height: number;
    mime: "image/png" | "image/jpeg" | "image/webp";
};
export declare function inlineRasterSize(value: string): RasterSize | null;
export declare function isSceneAssetUrl(value: string): boolean;
