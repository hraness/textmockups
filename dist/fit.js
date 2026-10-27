/**
 * iMessage wraps a long message, then narrows the bubble to its longest line. CSS sizes a
 * wrapped box to its container instead, so once a phone is in the document, `fitBubbles`
 * measures each wrapped text bubble and sets that width. It only reads and writes the
 * bubbles' own inline width, so it is safe to call after every render; a bubble that holds
 * the focus (being edited) is left free to grow.
 */
export function fitBubbles(root) {
    const bubbles = [
        ...root.querySelectorAll('[data-platform="imessage"] .tm-bubble[data-kind="text"]'),
    ];
    for (const bubble of bubbles)
        bubble.style.width = "";
    const widths = bubbles.map(measure);
    bubbles.forEach((bubble, index) => {
        const width = widths[index];
        if (!width)
            return;
        const lines = lineCount(bubble);
        bubble.style.width = `${width}px`;
        // Subpixel rounding must never rewrap the text.
        if (lineCount(bubble) !== lines)
            bubble.style.width = "";
    });
}
function scaleOf(bubble) {
    return bubble.getBoundingClientRect().width / bubble.offsetWidth || 1;
}
function textRects(bubble) {
    const text = bubble.querySelector(":scope > .tm-bubble-text");
    if (!text)
        return [];
    const range = bubble.ownerDocument.createRange();
    range.selectNodeContents(text);
    return [...range.getClientRects()].filter((rect) => rect.width > 0);
}
function lineCount(bubble) {
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
function measure(bubble) {
    const active = bubble.ownerDocument.activeElement;
    if (active && bubble.contains(active))
        return 0;
    if (lineCount(bubble) < 2)
        return 0;
    const scale = scaleOf(bubble);
    const style = getComputedStyle(bubble);
    const left = bubble.getBoundingClientRect().left / scale +
        parseFloat(style.borderLeftWidth) +
        parseFloat(style.paddingLeft);
    const right = Math.max(...textRects(bubble).map((rect) => rect.right / scale));
    // Whole device pixels at 3x, rounded up so the longest line still fits.
    const width = Math.ceil((right - left) * 3 - 0.01) / 3;
    return style.boxSizing === "border-box"
        ? width + parseFloat(style.paddingLeft) + parseFloat(style.paddingRight)
        : width;
}
