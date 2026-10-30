/**
 * iMessage wraps a long message, then narrows the bubble to its longest line. CSS sizes a
 * wrapped box to its container instead, so once a phone is in the document, `fitBubbles`
 * measures each wrapped text bubble and sets that width. It only reads and writes the
 * bubbles' own inline width, so it is safe to call after every render; a bubble that holds
 * the focus (being edited) is left free to grow.
 */
export function fitBubbles(root: ParentNode): void {
  const bubbles = [
    ...root.querySelectorAll<HTMLElement>(
      '[data-platform="imessage"] .tm-bubble[data-kind="text"]',
    ),
  ];
  for (const bubble of bubbles) bubble.style.width = "";
  const widths = bubbles.map(measure);
  bubbles.forEach((bubble, index) => {
    const width = widths[index];
    if (!width) return;
    const lines = lineCount(bubble);
    bubble.style.width = `${width}px`;
    // Subpixel rounding must never rewrap the text.
    if (lineCount(bubble) !== lines) bubble.style.width = "";
  });
  clearTapbacks(root);
}

/**
 * Messages keeps a tapped-back message in the group above when its badge clears the bubble
 * there, so the badge rises beside it. Only the widths decide that, so it is measured here.
 */
function clearTapbacks(root: ParentNode) {
  const blocks = [
    ...root.querySelectorAll<HTMLElement>(
      '[data-platform="imessage"] .tm-message-block[data-tapback]',
    ),
  ];
  const clear = blocks.map((block) => {
    const above = block.previousElementSibling?.querySelector(".tm-message-row .tm-bubble");
    const bubble = block.querySelector<HTMLElement>(".tm-message-row .tm-bubble");
    const badge = bubble?.querySelector(".tm-reactions");
    if (!above || !bubble || !badge) return false;
    const a = above.getBoundingClientRect();
    const b = badge.getBoundingClientRect();
    const gap = 2 * scaleOf(bubble);
    return block.dataset.side === "out" ? b.right + gap <= a.left : b.left >= a.right + gap;
  });
  blocks.forEach((block, index) => {
    if (clear[index]) block.dataset.clear = "";
    else delete block.dataset.clear;
  });
}

function scaleOf(bubble: HTMLElement) {
  return bubble.getBoundingClientRect().width / bubble.offsetWidth || 1;
}

function textRects(bubble: HTMLElement) {
  const text = bubble.querySelector(":scope > .tm-bubble-text");
  if (!text) return [];
  const range = bubble.ownerDocument.createRange();
  // Editable slots can keep a transparent input over their native display.
  // Measure only the display when the consumer identifies it explicitly.
  range.selectNodeContents(text.querySelector("[data-textmock-measure-text]") ?? text);
  return [...range.getClientRects()].filter((rect) => rect.width > 0);
}

function lineCount(bubble: HTMLElement) {
  const scale = scaleOf(bubble);
  const lineHeight = parseFloat(getComputedStyle(bubble).lineHeight) || 20;
  const tops = textRects(bubble)
    .map((rect) => rect.top / scale)
    .sort((a, b) => a - b);
  let lines = 0;
  let last = -Infinity;
  for (const top of tops)
    if (top - last > lineHeight / 2) {
      lines++;
      last = top;
    }
  return lines;
}

function measure(bubble: HTMLElement) {
  const active = bubble.ownerDocument.activeElement;
  if (active && bubble.contains(active)) return 0;
  if (lineCount(bubble) < 2) return 0;
  const scale = scaleOf(bubble);
  const style = getComputedStyle(bubble);
  const left =
    bubble.getBoundingClientRect().left / scale +
    parseFloat(style.borderLeftWidth) +
    parseFloat(style.paddingLeft);
  const right = Math.max(...textRects(bubble).map((rect) => rect.right / scale));
  // Whole device pixels at 3x, rounded up so the longest line still fits.
  const width = Math.ceil((right - left) * 3 - 0.01) / 3;
  return style.boxSizing === "border-box"
    ? width + parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
    : width;
}
