/** Runs in the gallery page: hit-test the rendered labels as well as their paint layers. */
export function inspectCardStacking(figure: Element) {
  const cards: {
    kind: string;
    side: string;
    content: string;
    position: string;
    contentLayer: string;
    paintLayer: string | null;
    occluded: string[];
    layered: boolean;
    reactionsAbove: boolean;
  }[] = [];
  const contentSelectors = ".tm-media,.tm-voice,.tm-audio-transcript,.tm-file,.tm-link-post,.tm-link-compact,.tm-link-card,.tm-location,.tm-contact-card,.tm-sticker,.tm-sticker-emoji,.tm-poll,.tm-payment,.tm-im-deck,.tm-im-collage";
  for (const bubble of figure.querySelectorAll<HTMLElement>(".tm-bubble[data-message-id]")) {
    const paint = bubble.querySelector<HTMLElement>(":scope > .tm-bubble-paint");
    const paintLayer = paint ? getComputedStyle(paint).zIndex : null;
    for (const content of [...bubble.children].filter((child) => child.matches(contentSelectors))) {
      const style = getComputedStyle(content);
      const labels = [...content.querySelectorAll<HTMLElement>("strong,small,p,.tm-file-icon,.tm-voice-play,.tm-voice-duration")];
      const targets = labels.length ? labels : [content];
      const occluded: string[] = [];
      for (const target of targets) {
        const rect = target.getBoundingClientRect();
        if (!rect.width || !rect.height || getComputedStyle(target).display === "none") continue;
        const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
        if (!hit || (hit !== content && !content.contains(hit)))
          occluded.push(`${target.textContent?.trim() || target.className}: ${hit?.getAttribute("class") ?? "outside viewport"}`);
      }
      const reactions = bubble.querySelector<HTMLElement>(":scope > .tm-reactions");
      cards.push({
        kind: bubble.dataset.kind ?? "",
        side: bubble.dataset.side ?? "",
        content: content.className,
        position: style.position,
        contentLayer: style.zIndex,
        paintLayer,
        occluded,
        layered: style.position !== "static" && Number(style.zIndex) > Number(paintLayer ?? -1),
        reactionsAbove: !reactions || Number(getComputedStyle(reactions).zIndex) > Number(style.zIndex),
      });
    }
  }
  const edited = [...figure.querySelectorAll<HTMLElement>(".tm-edited")].map((label) => ({
    text: label.textContent,
    color: getComputedStyle(label).color,
    receiptColor: getComputedStyle(label.closest(".tm-receipt")!).color,
  }));
  return { cards, edited };
}
