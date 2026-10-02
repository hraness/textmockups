import type { CSSProperties } from "react";

export type GlyphName =
  | "back"
  | "chevron"
  | "plus"
  | "mic"
  | "wave"
  | "video"
  | "phone"
  | "camera"
  | "send"
  | "paperclip"
  | "smile"
  | "play"
  | "pause"
  | "check"
  | "double-check"
  | "clock"
  | "file"
  | "pin"
  | "lock"
  | "more"
  | "close"
  | "shift"
  | "backspace"
  | "globe"
  | "star"
  | "download"
  | "arrow-up"
  | "gift"
  | "sticker";

/** Original vector drawings, sized in the renderer's logical points. */
export function Glyph({
  name,
  size = 24,
  className,
  style,
}: {
  name: GlyphName;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    style,
    "aria-hidden": true as const,
    focusable: false as const,
  };
  const paths: Record<GlyphName, React.ReactNode> = {
    back: <path d="m15.5 4-8 8 8 8" strokeWidth="2.5" />,
    chevron: <path d="m9 5 7 7-7 7" />,
    plus: <path d="M12 4v16M4 12h16" />,
    mic: (
      <>
        <rect x="8.5" y="2" width="7" height="13" rx="3.5" />
        <path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M9 22h6" />
      </>
    ),
    wave: <path d="M3 10v4M7.5 6v12M12 3v18M16.5 7v10M21 10v4" />,
    video: (
      <>
        <rect x="2" y="5" width="14" height="14" rx="3.5" />
        <path d="m16 10 5-3v10l-5-3" />
      </>
    ),
    phone: (
      <path d="m7 3 2.5 5-2.3 2.1a15 15 0 0 0 6.7 6.7L16 14.5l5 2.5-.5 3.1c-.1 1-1.3 1.8-2.5 1.5C9.8 19.9 4.1 14.2 2.4 6c-.3-1.2.5-2.4 1.5-2.5L7 3Z" />
    ),
    camera: (
      <>
        <path d="M3 6h4l2-3h6l2 3h4a1 1 0 0 1 1 1v13H2V7a1 1 0 0 1 1-1Z" />
        <circle cx="12" cy="13" r="4" />
      </>
    ),
    send: <path d="m3 3 19 9-19 9 4-9-4-9Zm4 9h15" />,
    paperclip: (
      <path d="m8 13 7-7a3 3 0 0 1 4 4L9 20a5 5 0 0 1-7-7L14 1M6 15l9-9" />
    ),
    smile: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path
          d="M7.5 14.5a5 5 0 0 0 9 0M8 8.5h.01M16 8.5h.01"
          strokeWidth="2"
        />
      </>
    ),
    play: <path d="m8 4 12 8-12 8V4Z" fill="currentColor" stroke="none" />,
    pause: (
      <>
        <path d="M8 5v14M16 5v14" strokeWidth="4" />
      </>
    ),
    check: <path d="m4 12 5 5L20 6" />,
    "double-check": <path d="m1.5 13 4.5 4.5L17.5 6M10 15l2.5 2.5L24 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 6v6l4 2" />
      </>
    ),
    file: (
      <>
        <path d="M5 2h9l5 5v15H5V2Zm9 0v6h5M8 13h8M8 17h5" />
      </>
    ),
    pin: (
      <>
        <path d="M19 10c0 6-7 12-7 12S5 16 5 10a7 7 0 1 1 14 0Z" />
        <circle cx="12" cy="9" r="2.5" />
      </>
    ),
    lock: (
      <>
        <rect x="5" y="10" width="14" height="11" rx="2" />
        <path d="M8 10V6a4 4 0 0 1 8 0v4" />
      </>
    ),
    more: (
      <>
        <circle cx="5" cy="12" r="1.5" fill="currentColor" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        <circle cx="19" cy="12" r="1.5" fill="currentColor" />
      </>
    ),
    close: <path d="m6 6 12 12M6 18 18 6" />,
    shift: <path d="m3 11 9-9 9 9h-5v11H8V11H3Z" />,
    backspace: (
      <>
        <path d="m9 4-7 8 7 8h13V4H9Z" />
        <path d="m12 9 6 6m-6 0 6-6" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <ellipse cx="12" cy="12" rx="4" ry="9" />
        <path d="M3 12h18M5 6.5h14M5 17.5h14" />
      </>
    ),
    star: (
      <path d="m12 2 3 6.4 7 .9-5.2 4.9 1.3 7L12 18l-6.1 3.2 1.3-7L2 9.3l7-.9L12 2Z" />
    ),
    download: (
      <>
        <path d="M12 3v13m-5-5 5 5 5-5M4 17v4h16v-4" />
      </>
    ),
    "arrow-up": <path d="M12 20V4m-6 6 6-6 6 6" strokeWidth="2.5" />,
    gift: (
      <>
        <rect x="3" y="7" width="18" height="4" rx="1" />
        <path d="M5 11v10h14V11M12 7v14M12 7H8a3 3 0 1 1 3-3l1 3Zm0 0h4a3 3 0 1 0-3-3l-1 3Z" />
      </>
    ),
    sticker: (
      <>
        <path d="M21 13a9 9 0 1 1-10-10c0 7 3 10 10 10Z" />
        <path d="M11 3a12 12 0 0 1 10 10" />
      </>
    ),
  };
  return <svg {...common}>{paths[name]}</svg>;
}
