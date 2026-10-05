import type { CSSProperties } from "react";
import type { Scene } from "./schema.js";
import { androidIconPaths, type AndroidIconName } from "./icons-android.js";
import { deviceProfile } from "./devices.js";

/** Material Symbols, rounded style. Paths ship in src/icons-android.ts. */
export function MatIcon({
  name,
  size = 24,
  className,
  style,
}: {
  name: AndroidIconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 -960 960 960"
      fill="currentColor"
      className={className}
      style={style}
      aria-hidden="true"
      focusable={false}
    >
      {androidIconPaths[name].map((d) => (
        <path key={d.slice(0, 24)} d={d} />
      ))}
    </svg>
  );
}

export function androidSystem(scene: Scene): "pixel" | "one-ui" {
  return deviceProfile(scene.device.model)?.system === "one-ui"
    ? "one-ui"
    : "pixel";
}

/**
 * Android status bar: a bold clock on the left; Wi-Fi, cellular and a battery
 * pill on the right. One UI draws the battery percentage inside the pill.
 */
export function AndroidStatusBar({ scene }: { scene: Scene }) {
  const { statusBar: status } = scene;
  const system = androidSystem(scene);
  return (
    <div className="tm-status-bar tm-status-android" aria-hidden="true">
      <span className="tm-clock">{status.time}</span>
      <span className="tm-status-right">
        {!!status.carrier && <span className="tm-carrier">{status.carrier}</span>}
        <MatIcon
          name="signal_wifi_4_bar-fill"
          size={17}
          style={{ opacity: status.wifi > 0 ? 1 : 0.28 }}
        />
        <MatIcon
          name="signal_cellular_4_bar-fill"
          size={16}
          style={{ opacity: status.cellular > 0 ? 1 : 0.28 }}
        />
        <span
          className="tm-battery-pill"
          data-low={status.battery <= 20 || undefined}
          data-charging={status.charging || undefined}
        >
          {system === "one-ui" && <em>{status.battery}</em>}
          <i style={{ width: `${status.battery}%` }} />
          {status.charging && <b>ϟ</b>}
        </span>
      </span>
    </div>
  );
}

/**
 * Android navigation. Pixels ship gesture navigation (a centered handle);
 * Galaxy phones ship three-button navigation (recents, home, back).
 */
export function AndroidNavBar({ scene }: { scene: Scene }) {
  const system = androidSystem(scene);
  return (
    <div className="tm-nav-bar" data-system={system} aria-hidden="true">
      {system === "one-ui" ? (
        <>
          <span className="tm-nav-btn tm-nav-recents">
            <i />
            <i />
            <i />
          </span>
          <span className="tm-nav-btn tm-nav-home" />
          <span className="tm-nav-btn tm-nav-back-btn">
            <MatIcon name="arrow_back" size={21} />
          </span>
        </>
      ) : (
        <span className="tm-nav-handle" />
      )}
    </div>
  );
}

const GB_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"] as const;

/** Gboard: a pill strip above three letter rows and an action bottom row. */
function Gboard() {
  return (
    <div className="tm-keyboard tm-gboard" aria-hidden="true">
      <div className="tm-gboard-strip">
        <span className="tm-gb-lead">
          <MatIcon name="apps" size={21} />
        </span>
        <MatIcon name="content_paste" size={19} />
        <MatIcon name="translate" size={20} />
        <MatIcon name="settings" size={21} />
        <span className="tm-gb-mic">
          <MatIcon name="mic-fill" size={21} />
        </span>
      </div>
      {GB_ROWS.map((row, index) => (
        <div className="tm-gb-row" key={row}>
          {index === 2 && (
            <span className="tm-gb-key tm-gb-mod">
              <MatIcon name="shift" size={20} />
            </span>
          )}
          {[...row].map((letter) => (
            <span className="tm-gb-key" key={letter}>
              {letter}
            </span>
          ))}
          {index === 2 && (
            <span className="tm-gb-key tm-gb-mod">
              <MatIcon name="backspace" size={21} />
            </span>
          )}
        </div>
      ))}
      <div className="tm-gb-row tm-gb-bottom">
        <span className="tm-gb-key tm-gb-mod">?123</span>
        <span className="tm-gb-key">,</span>
        <span className="tm-gb-key">
          <MatIcon name="mood" size={20} />
        </span>
        <span className="tm-gb-key tm-gb-space" />
        <span className="tm-gb-key">.</span>
        <span className="tm-gb-key tm-gb-mod tm-gb-enter">
          <MatIcon name="keyboard_return" size={20} />
        </span>
      </div>
    </div>
  );
}

const SK_NUMBERS = "1234567890";

/** Samsung Keyboard: toolbar, a number row, and three letter rows. */
function SamsungKeyboard() {
  return (
    <div className="tm-keyboard tm-skboard" aria-hidden="true">
      <div className="tm-sk-strip">
        <MatIcon name="expand" size={20} />
        <MatIcon name="content_paste" size={19} />
        <MatIcon name="mood" size={20} />
        <MatIcon name="settings" size={20} />
        <span className="tm-sk-mic">
          <MatIcon name="mic-fill" size={20} />
        </span>
      </div>
      <div className="tm-sk-row tm-sk-numbers">
        {[...SK_NUMBERS].map((digit) => (
          <span className="tm-sk-key" key={digit}>
            {digit}
          </span>
        ))}
      </div>
      {GB_ROWS.map((row, index) => (
        <div className="tm-sk-row" key={row}>
          {index === 2 && (
            <span className="tm-sk-key tm-sk-mod">
              <MatIcon name="keyboard_capslock" size={20} />
            </span>
          )}
          {[...row].map((letter) => (
            <span className="tm-sk-key" key={letter}>
              {letter}
            </span>
          ))}
          {index === 2 && (
            <span className="tm-sk-key tm-sk-mod">
              <MatIcon name="backspace" size={21} />
            </span>
          )}
        </div>
      ))}
      <div className="tm-sk-row tm-sk-bottom">
        <span className="tm-sk-key tm-sk-mod">?123</span>
        <span className="tm-sk-key">,</span>
        <span className="tm-sk-key">
          <MatIcon name="mood" size={19} />
        </span>
        <span className="tm-sk-key tm-sk-space" />
        <span className="tm-sk-key">.</span>
        <span className="tm-sk-key tm-sk-mod tm-sk-enter">
          <MatIcon name="keyboard_return" size={20} />
        </span>
      </div>
    </div>
  );
}

const EMOJI_PAGE = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😆",
  "🥹",
  "😅",
  "😂",
  "🤣",
  "🥲",
  "☺️",
  "😊",
  "😇",
  "🙂",
  "🙃",
  "😉",
  "😌",
  "😍",
  "🥰",
  "😘",
  "😋",
  "😜",
  "🤪",
  "🤨",
  "🧐",
  "😎",
  "🥳",
  "😏",
  "😒",
  "😞",
  "😔",
];

/** The Gboard emoji panel: search, category tabs, grid, and a bottom bar. */
function AndroidEmojiKeyboard() {
  return (
    <div className="tm-keyboard tm-gboard tm-emoji-keyboard" aria-hidden="true">
      <div className="tm-ge-search">
        <MatIcon name="search" size={18} />
        <span>Search emoji</span>
      </div>
      <div className="tm-ge-tabs">
        <span data-active>
          <MatIcon name="mood" size={21} />
        </span>
        <span>
          <MatIcon name="image" size={20} />
        </span>
        <span>
          <MatIcon name="gif_box" size={21} />
        </span>
      </div>
      <div className="tm-ge-grid">
        {EMOJI_PAGE.map((emoji) => (
          <span key={emoji}>{emoji}</span>
        ))}
      </div>
      <div className="tm-ge-footer">
        <span className="tm-ge-abc">ABC</span>
        <MatIcon name="backspace" size={23} />
      </div>
    </div>
  );
}

/** Android keyboards follow the phone's system: Gboard on Pixel, Samsung Keyboard on Galaxy. */
export function AndroidKeyboard({ scene }: { scene: Scene }) {
  if (scene.composer.keyboard === "emoji") return <AndroidEmojiKeyboard />;
  return androidSystem(scene) === "one-ui" ? <SamsungKeyboard /> : <Gboard />;
}
