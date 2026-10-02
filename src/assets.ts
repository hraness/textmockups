/** Portable raster assets are small, static, and dimension-bounded. SVG and arbitrary data URLs are never accepted. */
export const MAX_INLINE_IMAGE_BYTES = 32_768;
export const MAX_INLINE_IMAGE_SIDE = 1024;
export type RasterSize = {
  width: number;
  height: number;
  mime: "image/png" | "image/jpeg" | "image/webp";
};
const ascii = (bytes: Uint8Array, at: number, length: number) =>
  String.fromCharCode(...bytes.subarray(at, at + length));
export function inlineRasterSize(value: string): RasterSize | null {
  const match =
    /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(
      value,
    );
  if (
    !match ||
    match[2].length > Math.ceil(MAX_INLINE_IMAGE_BYTES / 3) * 4 ||
    match[2].length % 4 !== 0
  )
    return null;
  let bytes: Uint8Array;
  try {
    bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
  } catch {
    return null;
  }
  if (bytes.length > MAX_INLINE_IMAGE_BYTES || bytes.length < 24) return null;
  const view = new DataView(bytes.buffer);
  let width = 0,
    height = 0;
  const mime = match[1] as RasterSize["mime"];
  if (mime === "image/png") {
    if (
      ![137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v) ||
      ascii(bytes, 12, 4) !== "IHDR" ||
      view.getUint32(8) !== 13
    )
      return null;
    width = view.getUint32(16);
    height = view.getUint32(20);
    for (let at = 8; at + 12 <= bytes.length;) {
      const length = view.getUint32(at);
      if (at + 12 + length > bytes.length) return null;
      if (ascii(bytes, at + 4, 4) === "acTL") return null;
      at += 12 + length;
    }
  } else if (mime === "image/jpeg") {
    if (bytes[0] !== 255 || bytes[1] !== 216) return null;
    for (let at = 2; at + 4 < bytes.length;) {
      if (bytes[at++] !== 255) return null;
      while (bytes[at] === 255) at++;
      const marker = bytes[at++];
      if (marker === 217 || marker === 218) break;
      if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
      if (at + 2 > bytes.length) return null;
      const length = view.getUint16(at);
      if (length < 2 || at + length > bytes.length) return null;
      if (marker >= 192 && marker <= 207 && ![196, 200, 204].includes(marker)) {
        if (length < 8) return null;
        height = view.getUint16(at + 3);
        width = view.getUint16(at + 5);
        break;
      }
      at += length;
    }
  } else {
    if (
      ascii(bytes, 0, 4) !== "RIFF" ||
      ascii(bytes, 8, 4) !== "WEBP" ||
      view.getUint32(4, true) + 8 !== bytes.length
    )
      return null;
    for (let at = 12; at + 8 <= bytes.length;) {
      const kind = ascii(bytes, at, 4),
        length = view.getUint32(at + 4, true),
        p = at + 8;
      if (p + length > bytes.length) return null;
      if (kind === "ANIM" || kind === "ANMF") return null;
      if (kind === "VP8X") {
        if (length !== 10 || (bytes[p] & 2) !== 0) return null;
        width = 1 + bytes[p + 4] + (bytes[p + 5] << 8) + (bytes[p + 6] << 16);
        height = 1 + bytes[p + 7] + (bytes[p + 8] << 8) + (bytes[p + 9] << 16);
      }
      if (kind === "VP8 ") {
        if (
          length < 10 ||
          bytes[p + 3] !== 157 ||
          bytes[p + 4] !== 1 ||
          bytes[p + 5] !== 42
        )
          return null;
        width = view.getUint16(p + 6, true) & 16383;
        height = view.getUint16(p + 8, true) & 16383;
      }
      if (kind === "VP8L") {
        if (length < 5 || bytes[p] !== 47) return null;
        const bits = view.getUint32(p + 1, true);
        width = (bits & 16383) + 1;
        height = ((bits >>> 14) & 16383) + 1;
      }
      if (width > MAX_INLINE_IMAGE_SIDE || height > MAX_INLINE_IMAGE_SIDE)
        return null;
      at = p + length + (length % 2);
    }
  }
  if (
    width < 1 ||
    height < 1 ||
    width > MAX_INLINE_IMAGE_SIDE ||
    height > MAX_INLINE_IMAGE_SIDE
  )
    return null;
  return { width, height, mime };
}
export function isSceneAssetUrl(value: string): boolean {
  if (value.startsWith("data:")) return inlineRasterSize(value) !== null;
  if (value.length > 4096) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

