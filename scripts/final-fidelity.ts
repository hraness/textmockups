/** Browser evidence for the final tapback, sampled-link, and Dynamic Type fixtures. */
export function inspectFinalFidelity(figure: Element) {
  const rgba = (value: string) => (value.match(/[\d.]+/g) ?? []).map(Number);
  const contrast = (foreground: string, background: string) => {
    const f = rgba(foreground), b = rgba(background);
    const alpha = f[3] ?? 1;
    const light = (rgb: number[]) => rgb.slice(0, 3).map((n) => {
      const channel = n / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, n, i) => sum + n * [0.2126, 0.7152, 0.0722][i]!, 0);
    const a = light(f.slice(0, 3).map((n, i) => n * alpha + b[i]! * (1 - alpha)));
    const z = light(b);
    return (Math.max(a, z) + 0.05) / (Math.min(a, z) + 0.05);
  };
  const links = [...figure.querySelectorAll<HTMLElement>(".tm-link-card")].map((card) => {
    const footer = card.lastElementChild!;
    const title = footer.querySelector("strong")!;
    const domain = footer.querySelector("small")!;
    const background = getComputedStyle(footer).backgroundColor;
    const bubble = card.closest<HTMLElement>(".tm-bubble")!;
    return {
      tint: bubble.dataset.tint ?? "default",
      sampledTint: bubble.style.getPropertyValue("--tm-link-tint"),
      background,
      backgroundAlpha: rgba(background)[3] ?? 1,
      titleColor: getComputedStyle(title).color,
      domainColor: getComputedStyle(domain).color,
      titleContrast: contrast(getComputedStyle(title).color, background),
      domainContrast: contrast(getComputedStyle(domain).color, background),
    };
  });
  const glyphs = [...figure.querySelectorAll<HTMLElement>(".tm-tapback-glyph")].map((glyph) => {
    const badge = glyph.closest<HTMLElement>(".tm-tapback");
    const box = badge?.getBoundingClientRect();
    const body = glyph.querySelector("g > path:nth-child(2)");
    return {
      kind: glyph.parentElement?.dataset.tapback ?? "",
      text: glyph.textContent ?? "",
      svg: !!glyph.querySelector("svg"),
      body: body ? getComputedStyle(body).stroke : "",
      picker: !!glyph.closest(".tm-tapback-picker"),
      self: badge?.hasAttribute("data-self") ?? false,
      width: box?.width,
      height: box?.height,
      filter: getComputedStyle(glyph).filter,
    };
  });
  const sized = figure.querySelector<HTMLElement>('.tm-bubble[data-message-id="sized"]');
  let type = null;
  if (sized) {
    const range = document.createRange();
    range.selectNodeContents(sized.querySelector(".tm-bubble-text")!);
    const style = getComputedStyle(sized);
    const emoji = figure.querySelector<HTMLElement>('.tm-bubble[data-message-id="emoji"]')!;
    const sticker = figure.querySelector<HTMLElement>(".tm-sticker-emoji")!;
    type = {
      fontSize: parseFloat(style.fontSize),
      lineHeight: parseFloat(style.lineHeight),
      lines: new Set([...range.getClientRects()].filter((rect) => rect.width > 0).map((rect) => Math.round(rect.top * 100))).size,
      emojiSize: parseFloat(getComputedStyle(emoji).fontSize),
      stickerSize: parseFloat(getComputedStyle(sticker).fontSize),
    };
  }
  return { links, glyphs, type };
}
