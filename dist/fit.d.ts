/**
 * iMessage wraps a long message, then narrows the bubble to its longest line. CSS sizes a
 * wrapped box to its container instead, so once a phone is in the document, `fitBubbles`
 * measures each wrapped text bubble and sets that width. It only reads and writes the
 * bubbles' own inline width, so it is safe to call after every render; a bubble that holds
 * the focus (being edited) is left free to grow.
 */
export declare function fitBubbles(root: ParentNode): void;
