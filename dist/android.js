import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { androidIconPaths } from "./icons-android.js";
import { deviceProfile } from "./devices.js";
/** Material Symbols, rounded style. Paths ship in src/icons-android.ts. */
export function MatIcon({ name, size = 24, className, style, }) {
    return (_jsx("svg", { width: size, height: size, viewBox: "0 -960 960 960", fill: "currentColor", className: className, style: style, "aria-hidden": "true", focusable: false, children: androidIconPaths[name].map((d) => (_jsx("path", { d: d }, d.slice(0, 24)))) }));
}
export function androidSystem(scene) {
    return deviceProfile(scene.device.model)?.system === "one-ui"
        ? "one-ui"
        : "pixel";
}
/**
 * Android status bar: a bold clock on the left; Wi-Fi, cellular and a battery
 * pill on the right. One UI draws the battery percentage inside the pill.
 */
export function AndroidStatusBar({ scene }) {
    const { statusBar: status } = scene;
    const system = androidSystem(scene);
    return (_jsxs("div", { className: "tm-status-bar tm-status-android", "aria-hidden": "true", children: [_jsx("span", { className: "tm-clock", children: status.time }), _jsxs("span", { className: "tm-status-right", children: [!!status.carrier && _jsx("span", { className: "tm-carrier", children: status.carrier }), _jsx(MatIcon, { name: "signal_wifi_4_bar-fill", size: 17, style: { opacity: status.wifi > 0 ? 1 : 0.28 } }), _jsx(MatIcon, { name: "signal_cellular_4_bar-fill", size: 16, style: { opacity: status.cellular > 0 ? 1 : 0.28 } }), _jsxs("span", { className: "tm-battery-pill", "data-low": status.battery <= 20 || undefined, "data-charging": status.charging || undefined, children: [system === "one-ui" && _jsx("em", { children: status.battery }), _jsx("i", { style: { width: `${status.battery}%` } }), status.charging && _jsx("b", { children: "\u03DF" })] })] })] }));
}
/**
 * Android navigation. Pixels ship gesture navigation (a centered handle);
 * Galaxy phones ship three-button navigation (recents, home, back).
 */
export function AndroidNavBar({ scene }) {
    const system = androidSystem(scene);
    return (_jsx("div", { className: "tm-nav-bar", "data-system": system, "aria-hidden": "true", children: system === "one-ui" ? (_jsxs(_Fragment, { children: [_jsxs("span", { className: "tm-nav-btn tm-nav-recents", children: [_jsx("i", {}), _jsx("i", {}), _jsx("i", {})] }), _jsx("span", { className: "tm-nav-btn tm-nav-home" }), _jsx("span", { className: "tm-nav-btn tm-nav-back-btn", children: _jsx(MatIcon, { name: "arrow_back", size: 21 }) })] })) : (_jsx("span", { className: "tm-nav-handle" })) }));
}
const GB_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
/** Gboard: a pill strip above three letter rows and an action bottom row. */
function Gboard() {
    return (_jsxs("div", { className: "tm-keyboard tm-gboard", "aria-hidden": "true", children: [_jsxs("div", { className: "tm-gboard-strip", children: [_jsx("span", { className: "tm-gb-lead", children: _jsx(MatIcon, { name: "apps", size: 21 }) }), _jsx(MatIcon, { name: "content_paste", size: 19 }), _jsx(MatIcon, { name: "translate", size: 20 }), _jsx(MatIcon, { name: "settings", size: 21 }), _jsx("span", { className: "tm-gb-mic", children: _jsx(MatIcon, { name: "mic-fill", size: 21 }) })] }), GB_ROWS.map((row, index) => (_jsxs("div", { className: "tm-gb-row", children: [index === 2 && (_jsx("span", { className: "tm-gb-key tm-gb-mod", children: _jsx(MatIcon, { name: "shift", size: 20 }) })), [...row].map((letter) => (_jsx("span", { className: "tm-gb-key", children: letter }, letter))), index === 2 && (_jsx("span", { className: "tm-gb-key tm-gb-mod", children: _jsx(MatIcon, { name: "backspace", size: 21 }) }))] }, row))), _jsxs("div", { className: "tm-gb-row tm-gb-bottom", children: [_jsx("span", { className: "tm-gb-key tm-gb-mod", children: "?123" }), _jsx("span", { className: "tm-gb-key", children: "," }), _jsx("span", { className: "tm-gb-key", children: _jsx(MatIcon, { name: "mood", size: 20 }) }), _jsx("span", { className: "tm-gb-key tm-gb-space" }), _jsx("span", { className: "tm-gb-key", children: "." }), _jsx("span", { className: "tm-gb-key tm-gb-mod tm-gb-enter", children: _jsx(MatIcon, { name: "keyboard_return", size: 20 }) })] })] }));
}
const SK_NUMBERS = "1234567890";
/** Samsung Keyboard: toolbar, a number row, and three letter rows. */
function SamsungKeyboard() {
    return (_jsxs("div", { className: "tm-keyboard tm-skboard", "aria-hidden": "true", children: [_jsxs("div", { className: "tm-sk-strip", children: [_jsx(MatIcon, { name: "expand", size: 20 }), _jsx(MatIcon, { name: "content_paste", size: 19 }), _jsx(MatIcon, { name: "mood", size: 20 }), _jsx(MatIcon, { name: "settings", size: 20 }), _jsx("span", { className: "tm-sk-mic", children: _jsx(MatIcon, { name: "mic-fill", size: 20 }) })] }), _jsx("div", { className: "tm-sk-row tm-sk-numbers", children: [...SK_NUMBERS].map((digit) => (_jsx("span", { className: "tm-sk-key", children: digit }, digit))) }), GB_ROWS.map((row, index) => (_jsxs("div", { className: "tm-sk-row", children: [index === 2 && (_jsx("span", { className: "tm-sk-key tm-sk-mod", children: _jsx(MatIcon, { name: "keyboard_capslock", size: 20 }) })), [...row].map((letter) => (_jsx("span", { className: "tm-sk-key", children: letter }, letter))), index === 2 && (_jsx("span", { className: "tm-sk-key tm-sk-mod", children: _jsx(MatIcon, { name: "backspace", size: 21 }) }))] }, row))), _jsxs("div", { className: "tm-sk-row tm-sk-bottom", children: [_jsx("span", { className: "tm-sk-key tm-sk-mod", children: "?123" }), _jsx("span", { className: "tm-sk-key", children: "," }), _jsx("span", { className: "tm-sk-key", children: _jsx(MatIcon, { name: "mood", size: 19 }) }), _jsx("span", { className: "tm-sk-key tm-sk-space" }), _jsx("span", { className: "tm-sk-key", children: "." }), _jsx("span", { className: "tm-sk-key tm-sk-mod tm-sk-enter", children: _jsx(MatIcon, { name: "keyboard_return", size: 20 }) })] })] }));
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
    return (_jsxs("div", { className: "tm-keyboard tm-gboard tm-emoji-keyboard", "aria-hidden": "true", children: [_jsxs("div", { className: "tm-ge-search", children: [_jsx(MatIcon, { name: "search", size: 18 }), _jsx("span", { children: "Search emoji" })] }), _jsxs("div", { className: "tm-ge-tabs", children: [_jsx("span", { "data-active": true, children: _jsx(MatIcon, { name: "mood", size: 21 }) }), _jsx("span", { children: _jsx(MatIcon, { name: "image", size: 20 }) }), _jsx("span", { children: _jsx(MatIcon, { name: "gif_box", size: 21 }) })] }), _jsx("div", { className: "tm-ge-grid", children: EMOJI_PAGE.map((emoji) => (_jsx("span", { children: emoji }, emoji))) }), _jsxs("div", { className: "tm-ge-footer", children: [_jsx("span", { className: "tm-ge-abc", children: "ABC" }), _jsx(MatIcon, { name: "backspace", size: 23 })] })] }));
}
/** Android keyboards follow the phone's system: Gboard on Pixel, Samsung Keyboard on Galaxy. */
export function AndroidKeyboard({ scene }) {
    if (scene.composer.keyboard === "emoji")
        return _jsx(AndroidEmojiKeyboard, {});
    return androidSystem(scene) === "one-ui" ? _jsx(SamsungKeyboard, {}) : _jsx(Gboard, {});
}
