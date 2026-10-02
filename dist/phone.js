import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { evaluateScene, sceneTime } from "./timeline.js";
import { Glyph } from "./glyph.js";
import { conversationMembers, isGroupConversation, receiptReaders, } from "./conversation.js";
const LOCAL_REFERENCE = /^local:/;
/** Plain image slot. Browser-local `local:` references have no URL here, so they render empty. */
export function PhoneImage({ src, alt = "Photo", ...props }) {
    const url = typeof src === "string" && !LOCAL_REFERENCE.test(src) ? src : undefined;
    return _jsx("img", { ...props, src: url, alt: alt });
}
/** Plain video slot: the poster frame, which is what a paused video shows. */
export function PhoneVideoPoster({ poster, className = "" }) {
    return poster ? (_jsx(PhoneImage, { className: className, src: poster, alt: "", referrerPolicy: "no-referrer", draggable: false })) : null;
}
export const defaultPhoneMedia = {
    Image: PhoneImage,
    Video: PhoneVideoPoster,
};
const css = (value) => value;
const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
const initials = (name) => name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => [...word][0] ?? "")
    .join("")
    .toUpperCase();
const duration = (seconds) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
/** Stable, smooth, scene-seeded color drift. This is branding, not a security watermark. */
export function watermarkStyle(sceneId, seconds) {
    let seed = 0;
    for (const character of sceneId)
        seed = (Math.imul(seed, 31) + character.charCodeAt(0)) >>> 0;
    const phase = seconds * 0.08 + (seed % 997) / 73;
    const hue = (offset) => Math.round((252 + 45 * Math.sin(phase + offset) + 360) % 360);
    return {
        background: `linear-gradient(${Math.round(125 + seconds * 4)}deg, hsl(${hue(0)} 35% 16%), hsl(${hue(2.1)} 38% 24%) 55%, hsl(${hue(4.2)} 32% 15%))`,
    };
}
export function Phone({ scene: source, time, selectedMessageId, onSelectMessage, exporting = false, watermark = true, media: mediaSlots, }) {
    const slots = { ...defaultPhoneMedia, ...mediaSlots };
    const scene = time === undefined ? source : evaluateScene(source, time);
    const playhead = time === undefined ? source.timeline.duration : sceneTime(source, time);
    const group = isGroupConversation(scene);
    const self = scene.participants.find((person) => person.isSelf);
    const other = scene.participants.find((person) => scene.contact.participantIds.includes(person.id) && !person.isSelf);
    const keyboard = scene.composer.keyboard !== "hidden" &&
        scene.composer.context?.mode !== "recording";
    const selected = exporting ? undefined : selectedMessageId;
    const mode = scene.composer.context?.mode ?? "normal";
    const pinned = scene.conversation?.pinned;
    const extraComposerHeight = (scene.platform !== "imessage" && (mode === "reply" || mode === "edit")) ||
        mode === "scheduled"
        ? 48
        : mode === "recording" && scene.composer.context?.recording.locked
            ? 45
            : 0;
    const focusHeight = scene.platform === "imessage" && scene.conversation?.focus?.visible
        ? 38
        : 0;
    const threadMessages = scene.platform === "imessage" && mode === "reply"
        ? scene.messages.filter((message) => message.id === scene.composer.context?.messageId ||
            message.replyTo === scene.composer.context?.messageId)
        : scene.messages;
    const lastOutgoing = threadMessages.findLastIndex((message) => message.senderId === self.id &&
        !message.unsent &&
        message.kind !== "system");
    return (_jsxs("div", { className: "tm-device-stage", style: { width: source.device.width, height: source.device.height }, children: [_jsxs("div", { className: "tm-phone", "data-textmock-phone": true, "data-platform": scene.platform, "data-theme": scene.theme, "data-frame": scene.device.frame, "data-group": group || undefined, "data-exporting": exporting || undefined, "data-renderer": scene.rendererVersion, "data-transport": scene.header?.transport ?? "imessage", "data-composer-mode": mode, style: css({
                    width: scene.device.width,
                    height: scene.device.height,
                    transform: `scale(${scene.device.scale})`,
                    transformOrigin: "50% 50%",
                    "--tm-type": `${scene.appearance.textSize}px`,
                    "--tm-radius": `${scene.appearance.bubbleRadius}px`,
                    "--tm-composer-extra": `${extraComposerHeight + focusHeight}px`,
                    "--tm-keyboard-height": scene.composer.keyboard === "alphabetic" ? "252px" : "286px",
                }), "aria-label": `${scene.platform === "imessage" ? "iMessage" : scene.platform === "whatsapp" ? "WhatsApp" : scene.platform === "instagram" ? "Instagram" : "Telegram"} conversation with ${scene.contact.name}`, children: [scene.device.frame === "iphone" && (_jsxs(_Fragment, { children: [_jsx("i", { className: "tm-side-button tm-side-action" }), _jsx("i", { className: "tm-side-button tm-side-volume" }), _jsx("i", { className: "tm-side-button tm-side-power" })] })), _jsxs("div", { className: "tm-screen", "data-textmock-screen": true, "data-keyboard": keyboard || undefined, "data-status-hidden": !scene.statusBar.visible || undefined, "data-wallpaper": scene.appearance.wallpaper, style: css({ "--tm-wall-color": scene.appearance.color }), children: [_jsx("div", { className: "tm-wallpaper", "aria-hidden": "true" }), scene.statusBar.visible && _jsx(StatusBar, { scene: scene }), scene.device.frame === "iphone" && scene.statusBar.visible && (_jsx("div", { className: "tm-island", "aria-hidden": "true", children: _jsx("i", {}) })), _jsx(PhoneHeader, { slots: slots, scene: scene, person: other }), scene.platform !== "imessage" && pinned?.visible && (_jsx(PinnedBanner, { slots: slots, scene: scene })), _jsx("div", { className: "tm-thread", "data-textmock-thread": true, "data-has-pinned": (scene.platform !== "imessage" && pinned?.visible) || undefined, children: _jsxs("div", { className: "tm-thread-content", children: [threadMessages.map((message, index) => {
                                            const person = scene.participants.find((participant) => participant.id === message.senderId);
                                            const outgoing = person.isSelf;
                                            const previous = threadMessages[index - 1];
                                            const next = threadMessages[index + 1];
                                            const editing = scene.platform === "imessage" &&
                                                mode === "edit" &&
                                                scene.composer.context?.messageId === message.id;
                                            const first = !previous ||
                                                previous.senderId !== message.senderId ||
                                                !!message.dateLabel ||
                                                previous.kind === "system" ||
                                                previous.unsent;
                                            const last = !next ||
                                                next.senderId !== message.senderId ||
                                                !!next.dateLabel ||
                                                next.kind === "system" ||
                                                next.unsent;
                                            const reply = message.replyTo
                                                ? scene.messages.find((item) => item.id === message.replyTo)
                                                : undefined;
                                            const receipt = outgoing &&
                                                (scene.platform === "imessage" ||
                                                    scene.platform === "instagram") &&
                                                !message.scheduledAt &&
                                                (index === lastOutgoing ||
                                                    message.status === "failed" ||
                                                    message.status === "sending" ||
                                                    message.edited);
                                            if (message.kind === "system" || message.unsent)
                                                return (_jsx("div", { className: "tm-system-message", "data-message-id": message.id, children: message.unsent
                                                        ? `${outgoing ? "You" : person.name} unsent a message`
                                                        : message.text }, message.id));
                                            return (_jsxs("div", { className: "tm-message-block", "data-message-id": message.id, "data-side": outgoing ? "out" : "in", "data-editing": editing || undefined, "data-first": first || undefined, "data-last": last || undefined, children: [scene.platform !== "imessage" &&
                                                        scene.conversation?.unread?.visible &&
                                                        scene.conversation.unread.messageId === message.id && (_jsx("div", { className: "tm-unread-divider", children: scene.platform === "whatsapp"
                                                            ? `${scene.conversation.unread.count} UNREAD MESSAGE${scene.conversation.unread.count === 1 ? "" : "S"}`
                                                            : "Unread Messages" })), message.dateLabel && (_jsx("div", { className: "tm-date", children: _jsx("span", { children: message.dateLabel }) })), scene.platform === "imessage" &&
                                                        message.scheduledAt &&
                                                        (!previous?.scheduledAt ||
                                                            previous.scheduledAt !== message.scheduledAt) && (_jsxs("div", { className: "tm-scheduled-label", children: [_jsx("span", { children: "Send Later" }), _jsxs("span", { children: [message.scheduledAt, " ", _jsx("b", { children: "Edit" })] })] })), _jsxs("div", { className: "tm-message-row", "data-side": outgoing ? "out" : "in", "data-reactions": message.reactions.length > 0 || undefined, children: [!outgoing && scene.appearance.showAvatars && (_jsx(Avatar, { slots: slots, name: person.name, url: person.avatar, color: person.color, className: "tm-row-avatar", hidden: !last })), _jsxs("div", { className: "tm-message-stack", children: [scene.platform === "imessage" &&
                                                                        pinned?.visible &&
                                                                        pinned.messageId === message.id && (_jsxs("div", { className: "tm-pinned-item", children: [_jsx(NativeIcon, { name: "pin" }), pinned.label] })), scene.platform === "imessage" &&
                                                                        scene.interactions?.editHistory?.visible &&
                                                                        scene.interactions.editHistory.messageId ===
                                                                            message.id && (_jsxs("div", { className: "tm-edit-history", children: [message.editHistory?.versions.map((version) => (_jsxs("div", { className: "tm-history-version", children: [_jsx("small", { children: version.editedAt }), _jsx("span", { children: version.text })] }, version.id))), _jsx("small", { children: "Hide Edits" })] })), !outgoing && first && group && (_jsx("div", { className: "tm-sender-name", style: { color: person.color }, children: person.name })), reply && scene.platform === "instagram" && (_jsx(InstagramReply, { scene: scene, message: message, reply: reply })), _jsxs("div", { className: "tm-bubble", "data-side": outgoing ? "out" : "in", "data-tail": last || undefined, "data-first": first || undefined, "data-kind": message.kind, "data-emoji": (message.kind === "text" &&
                                                                            emojiOnly(message.text)) ||
                                                                            undefined, "data-selected": selected === message.id || undefined, "data-effect": message.effect, "data-scheduled": !!message.scheduledAt || undefined, "data-interactive": (!!onSelectMessage && !exporting) || undefined, style: messageStyle(message, playhead, time !== undefined), role: onSelectMessage && !exporting ? "button" : undefined, tabIndex: onSelectMessage && !exporting ? 0 : undefined, "aria-label": `${person.name}: ${message.text || message.kind}${message.status === "read" ? ", read" : ""}`, onClick: onSelectMessage && !exporting
                                                                            ? () => onSelectMessage(message.id)
                                                                            : undefined, onKeyDown: onSelectMessage && !exporting
                                                                            ? (event) => {
                                                                                if (event.key === "Enter" ||
                                                                                    event.key === " ") {
                                                                                    event.preventDefault();
                                                                                    onSelectMessage(message.id);
                                                                                }
                                                                            }
                                                                            : undefined, children: [scene.platform !== "instagram" &&
                                                                                (scene.platform === "whatsapp" ? first : last) &&
                                                                                message.kind !== "sticker" &&
                                                                                !emojiOnly(message.text) && (_jsx(BubbleTail, { platform: scene.platform })), reply && scene.platform !== "instagram" && (_jsxs("div", { className: "tm-reply", children: [_jsx("b", { children: scene.participants.find((p) => p.id === reply.senderId)?.name }), _jsx("span", { children: reply.text ||
                                                                                            `${reply.kind[0]?.toUpperCase()}${reply.kind.slice(1)}` })] })), editing ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "tm-inline-edit-text", children: _jsx(ComposerText, { scene: scene, time: playhead }) }), _jsx("span", { className: "tm-edit-cancel", children: _jsx(Glyph, { name: "close", size: 20 }) }), _jsx("span", { className: "tm-edit-confirm", children: _jsx(Glyph, { name: "check", size: 21 }) }), scene.composer.selection &&
                                                                                        scene.composer.selection.visible !== false &&
                                                                                        scene.composer.selection.end >
                                                                                            scene.composer.selection.start && (_jsxs("div", { className: "tm-selection-menu", children: [_jsx("span", { children: "Cut" }), _jsx("span", { children: "Copy" }), _jsx("span", { children: "Paste" }), _jsx("span", { children: "Replace\u2026" }), _jsx(Glyph, { name: "chevron", size: 15 })] }))] })) : (_jsx(MessageContent, { slots: slots, message: message, scene: scene, time: playhead })), scene.platform !== "imessage" &&
                                                                                scene.platform !== "instagram" && (_jsxs("span", { className: "tm-inline-meta", "data-status": message.status, children: [message.edited && _jsx("span", { children: "edited " }), message.timestamp ||
                                                                                        (scene.appearance.showTimestamps
                                                                                            ? scene.statusBar.time
                                                                                            : ""), outgoing && (_jsx(DeliveryGlyph, { status: message.status }))] })), message.reactions.length > 0 && (_jsx(ReactionBadges, { slots: slots, message: message, scene: scene })), message.stickers?.map((sticker) => (_jsx("span", { className: "tm-attached-sticker", "data-sticker-id": sticker.id, style: {
                                                                                    left: `${sticker.x * 100}%`,
                                                                                    top: `${sticker.y * 100}%`,
                                                                                    zIndex: 5 + sticker.zIndex,
                                                                                    transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
                                                                                }, children: sticker.url ? (_jsx(slots.Image, { src: sticker.url, alt: "Attached sticker", referrerPolicy: "no-referrer", draggable: false })) : (sticker.emoji) }, sticker.id)))] }), (receipt ||
                                                                        (scene.platform === "imessage" &&
                                                                            message.kind === "voice")) && (_jsxs("div", { className: "tm-receipt-row", children: [receipt && (_jsxs("div", { className: "tm-receipt", "data-status": message.status, children: [message.statusText ||
                                                                                        nativeReceipt(scene, message), message.edited && (_jsxs("span", { children: [" ", "\u00B7 Edited", message.editedAt
                                                                                                ? ` ${message.editedAt}`
                                                                                                : ""] }))] })), scene.platform === "imessage" &&
                                                                                message.kind === "voice" && (_jsx("span", { className: "tm-audio-keep", "data-kept": message.media?.keep || undefined, children: message.media?.keep ? "Kept" : "Keep" }))] })), scene.platform === "instagram" &&
                                                                        message.edited &&
                                                                        !receipt && (_jsx("div", { className: "tm-ig-edited", children: "Edited" })), scene.platform === "imessage" &&
                                                                        !receipt &&
                                                                        scene.appearance.showTimestamps &&
                                                                        message.timestamp && (_jsx("div", { className: "tm-message-time", children: message.timestamp }))] })] })] }, message.id));
                                        }), scene.composer.typing.visible && (_jsxs("div", { className: "tm-typing-row", children: [_jsx(TypingDots, { time: playhead }), scene.platform !== "imessage" && (_jsxs("span", { children: [scene.participants.find((p) => p.id === scene.composer.typing.participantId)?.name ?? scene.contact.name, " ", "is typing"] }))] })), scene.messages.length === 0 && (_jsxs("div", { className: "tm-empty-conversation", children: [_jsx(Avatar, { slots: slots, name: scene.contact.name, url: scene.contact.avatar ?? other?.avatar, color: other?.color }), _jsx("span", { children: scene.contact.name })] }))] }) }), scene.platform === "imessage" &&
                                scene.conversation?.unread?.visible && (_jsxs("div", { className: "tm-catch-up", children: [_jsx(Glyph, { name: "chevron", size: 16 }), _jsx(Glyph, { name: "chevron", size: 16 }), _jsx("span", { children: scene.conversation.unread.count })] })), _jsxs("div", { className: "tm-input-region", children: [_jsx(FocusStatus, { scene: scene }), _jsx(Composer, { scene: scene, time: playhead }), keyboard && mode !== "recording" && _jsx(Keyboard, { scene: scene })] }), _jsx(NativeInteraction, { slots: slots, scene: scene, time: playhead }), _jsx("div", { className: "tm-home-indicator", "aria-hidden": "true" }), scene.appearance.screenEffect !== "none" && (_jsx(ScreenEffect, { effect: scene.appearance.screenEffect, time: playhead }))] })] }), watermark && (_jsxs("div", { className: "tm-watermark", "data-textmock-watermark": true, style: {
                    ...watermarkStyle(scene.id, time === undefined ? 0 : playhead),
                    // Follow the phone when it shrinks, and stay inside the output when it zooms.
                    left: Math.min(source.device.width - 107, Math.max(-4, (source.device.width -
                        scene.device.width * scene.device.scale) /
                        2 -
                        4)),
                    top: Math.min(source.device.height - 43, Math.max(24, (source.device.height -
                        scene.device.height * scene.device.scale) /
                        2 +
                        24)),
                }, children: [_jsx("span", { children: "made with" }), _jsx("strong", { children: "textmock.com" }), _jsx("i", { "aria-hidden": "true", children: "\u2726" })] }))] }));
}
function Avatar({ slots, name, url, color, className = "", hidden = false, }) {
    return (_jsx("span", { className: `tm-avatar ${className}`, style: {
            background: color,
            visibility: hidden ? "hidden" : undefined,
        }, "aria-hidden": "true", children: url ? (_jsx(slots.Image, { src: url, alt: "", referrerPolicy: "no-referrer", draggable: false })) : (initials(name)) }));
}
function StatusBar({ scene }) {
    const { statusBar: status } = scene;
    return (_jsxs("div", { className: "tm-status-bar", "aria-hidden": "true", children: [_jsx("span", { className: "tm-clock", children: status.time }), _jsxs("span", { className: "tm-status-right", children: [status.carrier && _jsx("span", { className: "tm-carrier", children: status.carrier }), _jsx("svg", { className: "tm-cellular", width: "19", height: "13", viewBox: "0 0 19 13", children: [0, 1, 2, 3].map((bar) => (_jsx("rect", { x: bar * 5, y: 9 - bar * 3, width: "3.4", height: 4 + bar * 3, rx: ".9", fill: "currentColor", opacity: bar < status.cellular ? 1 : 0.25 }, bar))) }), _jsxs("svg", { width: "17", height: "13", viewBox: "0 0 18 14", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", children: [_jsx("path", { opacity: status.wifi >= 3 ? 1 : 0.2, d: "M2 4a11 11 0 0 1 14 0" }), _jsx("path", { opacity: status.wifi >= 2 ? 1 : 0.2, d: "M5 7.4a6 6 0 0 1 8 0" }), _jsx("path", { opacity: status.wifi >= 1 ? 1 : 0.2, d: "m8 10.8 1 1 1-1" })] }), _jsxs("span", { className: "tm-battery", "data-low": status.battery <= 20 || undefined, "data-charging": status.charging || undefined, children: [_jsx("i", { style: { width: `${status.battery}%` } }), status.charging && _jsx("b", { children: "\u03DF" })] })] })] }));
}
function ConversationAvatar({ slots, scene, person, }) {
    if (!isGroupConversation(scene) || scene.contact.avatar)
        return (_jsx(Avatar, { slots: slots, name: scene.contact.name, url: scene.contact.avatar ?? person?.avatar, color: person?.color }));
    const members = conversationMembers(scene)
        .filter((person) => !person.isSelf)
        .slice(0, 3);
    return (_jsx("span", { className: "tm-group-avatar", "data-members": members.length, "aria-hidden": "true", children: members.map((person) => (_jsx(Avatar, { slots: slots, name: person.name, url: person.avatar, color: person.color }, person.id))) }));
}
function nativeReceipt(scene, message) {
    if (message.status === "read") {
        const readers = isGroupConversation(scene) && scene.platform === "instagram"
            ? receiptReaders(scene, message)
            : [];
        const verb = scene.platform === "instagram" ? "Seen" : "Read";
        if (readers.length)
            return `${verb} by ${readers.slice(0, 2).join(", ")}${readers.length > 2 ? ` +${readers.length - 2}` : ""}`;
        return `${verb}${scene.platform !== "instagram" && message.timestamp ? ` ${message.timestamp}` : ""}`;
    }
    if (message.status === "failed")
        return scene.platform === "instagram" ? "Not sent" : "Not Delivered";
    if (message.status === "sending")
        return "Sending…";
    return scene.platform === "instagram" || message.status === "sent"
        ? "Sent"
        : "Delivered";
}
function InstagramReply({ scene, message, reply, }) {
    const person = scene.participants.find((p) => p.id === message.senderId);
    const original = scene.participants.find((p) => p.id === reply.senderId);
    return (_jsxs("div", { className: "tm-ig-reply", children: [_jsxs("small", { children: [person?.isSelf ? "You" : person?.name, " replied to", " ", original?.isSelf ? "you" : original?.name] }), _jsx("span", { "data-side": original?.isSelf ? "out" : "in", children: reply.text || reply.kind })] }));
}
function PhoneHeader({ slots, scene, person, }) {
    const platform = scene.platform;
    const group = isGroupConversation(scene);
    const members = conversationMembers(scene);
    const subtitle = scene.contact.subtitle ||
        (group && platform === "telegram"
            ? `${members.length} members`
            : group && platform === "whatsapp"
                ? members.map((p) => (p.isSelf ? "You" : p.name)).join(", ")
                : "");
    const avatar = _jsx(ConversationAvatar, { slots: slots, scene: scene, person: person });
    const reply = platform === "imessage" && scene.composer.context?.mode === "reply";
    const control = (kind) => scene.header?.[kind] ?? "enabled";
    const disabled = (kind) => control(kind) === "disabled" ||
        scene.composer.context?.mode === "recording";
    const mute = scene.conversation?.muted ? _jsx(NativeIcon, { name: "muted" }) : null;
    const back = (_jsxs("span", { className: "tm-nav-back", style: reply ? { visibility: "hidden" } : undefined, children: [_jsx(Glyph, { name: "back", size: 24 }), !!scene.header?.backCount && (_jsx("small", { className: "tm-back-count", children: scene.header.backCount > 999 ? "999+" : scene.header.backCount }))] }));
    if (platform === "instagram")
        return (_jsxs("div", { className: "tm-phone-header", "aria-hidden": "true", children: [back, avatar, _jsxs("span", { className: "tm-contact-title", children: [_jsxs("strong", { children: [scene.contact.name, mute] }), subtitle && _jsx("small", { children: subtitle })] }), _jsxs("span", { className: "tm-nav-actions", children: [control("call") !== "hidden" && (_jsx("span", { "data-disabled": disabled("call") || undefined, children: _jsx(Glyph, { name: "phone", size: 23 }) })), control("video") !== "hidden" && (_jsx("span", { "data-disabled": disabled("video") || undefined, children: _jsx(Glyph, { name: "video", size: 25 }) }))] })] }));
    if (platform === "telegram")
        return (_jsxs("div", { className: "tm-phone-header", "aria-hidden": "true", children: [back, _jsxs("span", { className: "tm-contact-title", children: [_jsxs("strong", { children: [scene.contact.name, mute] }), subtitle && _jsx("small", { children: subtitle })] }), avatar] }));
    return (_jsxs("div", { className: "tm-phone-header", "aria-hidden": "true", children: [back, platform === "imessage" ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "tm-im-contact", children: [avatar, _jsxs("span", { className: "tm-im-name", children: [scene.contact.name, mute, _jsx(Glyph, { name: "chevron", size: 10 })] }), subtitle && (_jsx("span", { className: "tm-contact-subtitle", children: subtitle }))] }), reply ? (_jsx("span", { className: "tm-im-video", children: _jsx(Glyph, { name: "close", size: 23 }) })) : (control("video") !== "hidden" && (_jsx("span", { className: "tm-im-video", "data-disabled": disabled("video") || undefined, children: _jsx(Glyph, { name: "video", size: 23 }) })))] })) : (_jsxs(_Fragment, { children: [avatar, _jsxs("span", { className: "tm-contact-title", children: [_jsxs("strong", { children: [scene.contact.name, mute] }), subtitle && _jsx("small", { children: subtitle })] }), _jsxs("span", { className: "tm-nav-actions", children: [control("video") !== "hidden" && (_jsx("span", { "data-disabled": disabled("video") || undefined, children: _jsx(Glyph, { name: "video", size: 25 }) })), control("call") !== "hidden" && (_jsx("span", { "data-disabled": disabled("call") || undefined, children: _jsx(Glyph, { name: "phone", size: 22 }) }))] })] }))] }));
}
function BubbleTail({ platform }) {
    return platform === "imessage" ? (_jsx("svg", { className: "tm-tail", viewBox: "-16 -17.5 23 18", "aria-hidden": "true", children: _jsx("path", { d: "M-16 -17.5H0C0 -7.6 1.7 -2.4 6.4 -.45 6.95 -.2 6.85 .45 6.2 .5 2.6 .7-1.2-.6-3.4-2.5-4.3-3.3-5.2-4.1-6-4.9L-16-17.5Z" }) })) : (_jsx("svg", { className: "tm-tail", viewBox: "0 0 12 14", "aria-hidden": "true", children: _jsx("path", { d: "M0 0h12v14C7 13 2 8 0 0Z" }) }));
}
function DeliveryGlyph({ status }) {
    if (status === "failed")
        return _jsx("span", { className: "tm-failed", children: "!" });
    return (_jsx(Glyph, { name: status === "sending"
            ? "clock"
            : status === "sent"
                ? "check"
                : "double-check", size: 15 }));
}
function MessageContent({ slots, message, scene, time, }) {
    let content = null;
    const media = message.media;
    if (message.kind === "image" || message.kind === "video")
        content = (_jsxs("div", { className: "tm-media", style: { aspectRatio: `${media?.width ?? 4} / ${media?.height ?? 3}` }, children: [message.kind === "video" && media?.videoUrl ? (_jsx(slots.Video, { src: media.videoUrl, playhead: media.playhead, width: media.width, height: media.height, poster: media.poster ?? media.url })) : media?.url || media?.poster ? (_jsx(slots.Image, { src: message.kind === "video"
                        ? (media?.poster ?? media?.url)
                        : media?.url, alt: media?.alt ?? "", referrerPolicy: "no-referrer", draggable: false })) : (_jsx(Landscape, {})), message.kind === "video" && (_jsxs(_Fragment, { children: [!media?.playing && (_jsx("span", { className: "tm-media-play", children: _jsx(Glyph, { name: "play", size: 29 }) })), _jsx("span", { className: "tm-media-duration", children: duration(media?.duration ?? 0) })] }))] }));
    if (message.kind === "voice")
        content = _jsx(VoiceMessage, { slots: slots, message: message, scene: scene });
    if (message.kind === "file")
        content = (_jsxs("div", { className: "tm-file", children: [_jsx("span", { className: "tm-file-icon", children: _jsx(Glyph, { name: "file", size: 28 }) }), _jsxs("span", { children: [_jsx("strong", { children: message.file?.name }), _jsxs("small", { children: [formatBytes(message.file?.size ?? 0), " \u00B7", " ", message.file?.mimeType.split("/").at(-1)?.toUpperCase()] })] }), _jsx(Glyph, { name: "download", size: 20 })] }));
    if (message.kind === "link")
        content = (_jsxs("div", { className: "tm-link-card", children: [message.link?.image ? (_jsx(slots.Image, { src: message.link.image, alt: "", referrerPolicy: "no-referrer" })) : (_jsxs("div", { className: "tm-link-art", children: [_jsx("span", { children: "\u2197" }), _jsx("span", { children: safeHostname(message.link?.url) })] })), _jsxs("div", { children: [_jsx("strong", { children: message.link?.title }), message.link?.description && _jsx("p", { children: message.link.description }), _jsx("small", { children: safeHostname(message.link?.url) })] })] }));
    if (message.kind === "location")
        content = (_jsxs("div", { className: "tm-location", children: [_jsxs("div", { className: "tm-map", children: [_jsx("i", {}), _jsx("i", {}), _jsx("i", {}), _jsx("span", { children: _jsx(Glyph, { name: "pin", size: 29 }) })] }), _jsx("strong", { children: message.location?.label }), _jsx("small", { children: message.location?.address ||
                        `${message.location?.latitude}, ${message.location?.longitude}` })] }));
    if (message.kind === "contact")
        content = (_jsxs("div", { className: "tm-contact-card", children: [_jsx(Avatar, { slots: slots, name: message.sharedContact?.name ?? "Contact", url: message.sharedContact?.avatar }), _jsx("strong", { children: message.sharedContact?.name }), _jsx("small", { children: message.sharedContact?.phone }), _jsx("span", { children: "Contact card" })] }));
    if (message.kind === "sticker")
        content = message.sticker?.url ? (_jsx(slots.Image, { className: "tm-sticker", src: message.sticker.url, alt: message.sticker.alt, referrerPolicy: "no-referrer" })) : (_jsx("span", { className: "tm-sticker-emoji", children: message.sticker?.emoji }));
    if (message.kind === "poll")
        content = (_jsxs("div", { className: "tm-poll", children: [_jsx("strong", { children: message.poll?.question }), _jsx("small", { children: "Poll" }), message.poll?.options.map((option) => (_jsxs("div", { className: "tm-poll-option", children: [_jsx("i", { style: {
                                width: `${clamp(option.votes / Math.max(1, message.poll?.totalVotes ?? 1)) * 100}%`,
                            } }), _jsx("span", { children: option.text }), _jsxs("b", { children: [Math.round(clamp(option.votes / Math.max(1, message.poll?.totalVotes ?? 1)) * 100), "%"] })] }, option.id))), _jsxs("small", { children: [message.poll?.totalVotes, " votes"] })] }));
    if (message.kind === "payment")
        content = (_jsxs("div", { className: "tm-payment", children: [_jsx("span", { children: scene.platform === "imessage" ? "Cash" : "Payment" }), _jsx("strong", { children: new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: message.payment?.currency ?? "USD",
                        maximumFractionDigits: 2,
                    }).format(message.payment?.amount ?? 0) }), message.payment?.note && _jsx("small", { children: message.payment.note })] }));
    return (_jsxs(_Fragment, { children: [content, message.text && (_jsx("span", { className: "tm-bubble-text", "data-ink": message.effect === "invisible-ink" || undefined, style: message.effect === "invisible-ink"
                    ? {
                        backgroundPosition: `${Math.round(time * 19)}px ${Math.round(time * 11)}px`,
                    }
                    : undefined, children: message.textRuns ? (_jsx(FormattedText, { runs: message.textRuns, time: Math.max(0, time - message.at) })) : (message.text) }))] }));
}
function groupedReactions(message, scene) {
    const groups = new Map();
    for (const reaction of message.reactions) {
        const person = scene.participants.find((person) => person.id === reaction.participantId);
        const group = groups.get(reaction.emoji) ?? {
            emoji: reaction.emoji,
            names: [],
            self: false,
        };
        group.names.push(person?.isSelf ? "You" : (person?.name ?? "Unknown participant"));
        group.self ||= !!person?.isSelf;
        groups.set(reaction.emoji, group);
    }
    return [...groups.values()];
}
function ReactionBadges({ slots, message, scene, }) {
    const groups = groupedReactions(message, scene);
    const label = groups
        .map((group) => `${group.emoji}: ${group.names.join(", ")}`)
        .join("; ");
    const overflow = groups
        .slice(3)
        .reduce((total, group) => total + group.names.length, 0);
    if (scene.platform === "instagram")
        return (_jsx("div", { className: "tm-reactions tm-ig-reactions", role: "img", "aria-label": `Reactions — ${label}`, title: label, "data-count": message.reactions.length, children: _jsxs("span", { className: "tm-reaction", children: [groups.slice(0, 3).map((group) => (_jsx("span", { children: group.emoji }, group.emoji))), message.reactions.length > 1 && (_jsx("b", { className: "tm-reaction-count", children: message.reactions.length }))] }) }));
    return (_jsxs("div", { className: "tm-reactions", "data-count": message.reactions.length, role: "img", "aria-label": `Reactions — ${label}`, title: label, children: [groups.slice(0, 3).map((group, index) => (_jsxs("span", { className: "tm-reaction", style: { zIndex: index + 1 }, "data-self": group.self || undefined, children: [_jsxs("span", { children: [group.emoji, group.names.length > 1 && (_jsx("b", { className: "tm-reaction-count", children: group.names.length }))] }), scene.platform === "imessage" && (_jsxs(_Fragment, { children: [_jsx("i", {}), _jsx("i", {})] }))] }, group.emoji))), overflow > 0 && (_jsxs("span", { className: "tm-reaction tm-reaction-count", title: groups
                    .slice(3)
                    .map((group) => `${group.emoji}: ${group.names.join(", ")}`)
                    .join("; "), children: ["+", overflow] }))] }));
}
function VoiceMessage({ slots, message, scene }) {
    const media = message.media;
    const waveform = media.waveform.length
        ? media.waveform
        : Array.from({ length: 36 }, (_, index) => 0.13 +
            0.8 * Math.abs(Math.sin(index * 1.73) * Math.cos(index * 0.41)));
    const progress = media.duration ? clamp(media.playhead / media.duration) : 0;
    const person = scene.participants.find((participant) => participant.id === message.senderId);
    const displaySeconds = media.playing ? media.playhead : media.duration;
    const clock = scene.platform === "imessage"
        ? duration(displaySeconds).padStart(5, "0")
        : duration(displaySeconds);
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "tm-voice", "data-wa": scene.platform === "whatsapp" || undefined, "data-playing": media.playing || undefined, children: [_jsx("span", { className: "tm-voice-play", children: _jsx(Glyph, { name: media.playing ? "pause" : "play", size: scene.platform === "imessage" ? 19 : 24 }) }), _jsxs("div", { className: "tm-voice-track", children: [_jsxs("div", { className: "tm-waveform", children: [waveform.map((height, index) => (_jsx("i", { "data-played": index / waveform.length < progress || undefined, style: { height: 3 + height * 24 } }, index))), scene.platform === "whatsapp" && (_jsx("b", { className: "tm-voice-thumb", style: { left: `${progress * 100}%` } }))] }), scene.platform === "whatsapp" && (_jsx("span", { className: "tm-voice-duration", children: clock }))] }), scene.platform === "whatsapp" ? (_jsxs("span", { className: "tm-voice-avatar", children: [_jsx(Avatar, { slots: slots, name: person.name, url: person.avatar, color: person.color }), _jsx(Glyph, { name: "mic", size: 18 })] })) : (_jsx("span", { className: "tm-voice-duration", children: clock })), media.playbackRate !== 1 && (_jsxs("span", { className: "tm-voice-rate", children: [media.playbackRate, "\u00D7"] }))] }), media.transcript && (_jsx("span", { className: "tm-audio-transcript", children: media.transcript }))] }));
}
const textSegmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
function FormattedText({ runs, time, }) {
    return (_jsx(_Fragment, { children: runs.map((run) => (_jsx("span", { className: "tm-text-run", "data-text-run": run.id, "data-text-effect": run.effect, style: {
                fontWeight: run.bold ? 700 : undefined,
                fontStyle: run.italic ? "italic" : undefined,
                textDecoration: [
                    run.underline ? "underline" : "",
                    run.strikethrough ? "line-through" : "",
                ]
                    .filter(Boolean)
                    .join(" ") || undefined,
            }, children: run.effect === "none"
                ? run.text
                : run.text.split(/(\s+)/u).map((word, wordIndex) => /^\s+$/u.test(word) ? (word) : (_jsx("span", { className: "tm-effect-word", children: [...textSegmenter.segment(word)].map(({ segment }, letterIndex) => (_jsx("span", { className: "tm-effect-letter", style: textEffectStyle(run.effect, time, letterIndex + wordIndex * 3), children: segment }, letterIndex))) }, wordIndex))) }, run.id))) }));
}
function textEffectStyle(effect, seconds, index) {
    const cycle = seconds % 3.4;
    const active = clamp(1 - Math.max(0, cycle - 1.6) / 0.8);
    const phase = seconds * 8 - index * 0.48;
    let x = 0, y = 0, scale = 1, rotate = 0;
    if (effect === "big")
        scale = 1 + 0.25 * Math.sin(clamp(cycle / 2.4) * Math.PI);
    if (effect === "small")
        scale = 1 - 0.25 * Math.sin(clamp(cycle / 2.4) * Math.PI);
    if (effect === "shake")
        x = Math.sin(seconds * 35 + index) * 1.8 * active;
    if (effect === "nod")
        y = Math.sin(phase) * 2.5 * active;
    if (effect === "explode") {
        const burst = Math.sin(clamp(cycle / 2.4) * Math.PI);
        x = Math.sin(index * 2.3) * 5 * burst;
        y = Math.cos(index * 1.7) * 7 * burst;
        rotate = Math.sin(index * 4.1) * 15 * burst;
    }
    if (effect === "ripple")
        y = Math.sin(phase) * 3 * active;
    if (effect === "bloom")
        scale = 1 + Math.max(0, Math.sin(phase * 0.7)) * 0.22 * active;
    if (effect === "jitter") {
        x = Math.sin(seconds * 47 + index * 9) * active;
        y = Math.cos(seconds * 39 + index * 7) * 1.5 * active;
        rotate = Math.sin(seconds * 28 + index) * 5 * active;
    }
    return {
        transform: `translate(${x.toFixed(3)}px, ${y.toFixed(3)}px) rotate(${rotate.toFixed(3)}deg) scale(${scale.toFixed(4)})`,
    };
}
function Landscape() {
    return (_jsxs("svg", { className: "tm-landscape", viewBox: "0 0 600 450", role: "img", "aria-label": "Illustrated alpine lake", children: [_jsxs("defs", { children: [_jsxs("linearGradient", { id: "tm-sky", x2: "0", y2: "1", children: [_jsx("stop", { stopColor: "#b9d5de" }), _jsx("stop", { offset: "1", stopColor: "#e8e5d9" })] }), _jsxs("linearGradient", { id: "tm-lake", x2: "0", y2: "1", children: [_jsx("stop", { stopColor: "#9bbec3" }), _jsx("stop", { offset: "1", stopColor: "#486f79" })] })] }), _jsx("path", { fill: "url(#tm-sky)", d: "M0 0h600v450H0z" }), _jsx("path", { fill: "#94aeb0", d: "m0 230 80-125 47 52L224 35l120 161L440 76l160 166v208H0" }), _jsx("path", { fill: "#dce5df", d: "m139 143 85-108 72 97-52-20-24-30-25 51-25-12Z" }), _jsx("path", { fill: "#537577", d: "m0 198 96 59 104-77 119 85 79-119 93 69 109-52v287H0" }), _jsx("path", { fill: "url(#tm-lake)", d: "m0 305 130-36 96 17 102-13 120 30 152-15v162H0Z" }), _jsx("path", { fill: "#264f4d", d: "m0 237 33 38 45 12 22 38-48 13L0 321Zm600 0-25 23-48 27-12 34 85 24Z" }), _jsx("path", { stroke: "#c4d6d3", opacity: ".5", d: "M94 337h230m55 18h160M190 375h207m-330 23h129m53 22h229" })] }));
}
function NativeIcon({ name, }) {
    return (_jsx("svg", { className: "tm-native-icon", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: name === "moon" ? (_jsx("path", { fill: "currentColor", stroke: "none", d: "M19.7 15A8.3 8.3 0 0 1 9 4.3 8.5 8.5 0 1 0 19.7 15Z" })) : name === "muted" ? (_jsx(_Fragment, { children: _jsx("path", { d: "M7 6a6 6 0 0 1 11 3v5l2 4H4l2-4V9M10 21h4M3 3l18 18" }) })) : name === "pin" ? (_jsx("path", { d: "m9 3 8 3-3 4 1 6-5-2-5-1 4-4V3Zm1 11-4 8" })) : name === "edit" ? (_jsx("path", { d: "m15 3 6 6-12 12H3v-6L15 3Zm-10 13 3 3M12 6l6 6" })) : name === "reply" ? (_jsx("path", { d: "m10 5-7 6 7 6v-4c5-1 8 1 11 6 0-8-4-11-11-10V5Z" })) : (_jsx(_Fragment, { children: _jsx("path", { d: "M4 6h16M9 3h6M6 6l1 15h10l1-15M10 10v7M14 10v7" }) })) }));
}
function FocusStatus({ scene }) {
    const focus = scene.conversation?.focus;
    if (scene.platform !== "imessage" || !focus?.visible)
        return null;
    return (_jsxs("div", { className: "tm-focus-status", children: [_jsxs("span", { children: [_jsx(NativeIcon, { name: "moon" }), focus.name, " has notifications silenced"] }), focus.notifyAnyway && _jsx("b", { children: "Notify Anyway" })] }));
}
function PinnedBanner({ slots, scene }) {
    const pin = scene.conversation?.pinned;
    const message = scene.messages.find((message) => message.id === pin?.messageId);
    if (!pin || !message)
        return null;
    return (_jsxs("div", { className: "tm-pinned-banner", children: [_jsx(NativeIcon, { name: "pin" }), _jsxs("div", { children: [scene.platform === "telegram" && _jsx("strong", { children: pin.label }), _jsx("span", { children: message.text ||
                            message.file?.name ||
                            message.link?.title ||
                            message.kind })] }), message.media?.url && (_jsx(slots.Image, { src: message.media.poster ?? message.media.url, alt: "", referrerPolicy: "no-referrer" })), _jsx(Glyph, { name: scene.platform === "telegram" ? "close" : "chevron", size: 15 })] }));
}
function RecordingComposer({ scene }) {
    const state = scene.composer.context.recording;
    const waveform = state.waveform.length
        ? state.waveform
        : Array.from({ length: 40 }, () => 0.05);
    return (_jsxs("div", { className: "tm-recording", "data-locked": state.locked || undefined, "data-paused": state.paused || undefined, "aria-hidden": "true", children: [_jsxs("div", { className: "tm-recording-meter", children: [_jsx("span", { className: "tm-recording-dot" }), _jsx("span", { className: "tm-recording-time", children: duration(state.duration) }), state.locked || scene.platform === "imessage" ? (_jsx("div", { className: "tm-recording-wave", children: waveform.map((height, index) => (_jsx("i", { style: { height: `${3 + height * 29}px` } }, index))) })) : (_jsx("span", { className: "tm-slide-cancel", children: "\u2039 slide to cancel" })), !state.locked && scene.platform !== "imessage" && (_jsxs("span", { className: "tm-recording-lock", children: [_jsx(Glyph, { name: "lock", size: 16 }), _jsx(Glyph, { name: "chevron", size: 12 })] })), _jsx("span", { className: "tm-recording-stop", children: state.locked ? (_jsx(Glyph, { name: state.paused ? "mic" : "pause", size: 22 })) : scene.platform === "imessage" ? (_jsx("i", {})) : (_jsx(Glyph, { name: "mic", size: 23 })) })] }), state.locked && (_jsxs("div", { className: "tm-recording-actions", children: [_jsx(NativeIcon, { name: "trash" }), _jsx("span", { children: state.paused ? "Resume recording" : "Pause" }), _jsx("span", { className: "tm-send", children: _jsx(Glyph, { name: scene.platform === "telegram" ? "send" : "arrow-up", size: 20 }) })] }))] }));
}
function NativeInteraction({ slots, scene, time }) {
    const picker = scene.interactions?.tapbackPicker;
    const message = scene.messages.find((message) => message.id === picker?.messageId);
    if (picker?.visible && message) {
        const outgoing = !!scene.participants.find((person) => person.id === message.senderId)?.isSelf;
        const groups = groupedReactions(message, scene);
        return (_jsxs("div", { className: "tm-native-overlay tm-reaction-overlay", "data-native-interaction": "tapback", "aria-hidden": "true", children: [scene.platform === "imessage" && groups.length > 0 && (_jsxs("div", { className: "tm-reaction-attributions", children: [groups.slice(0, 3).map((group) => (_jsxs("div", { title: `${group.emoji}: ${group.names.join(", ")}`, children: [_jsxs("span", { children: [group.emoji, group.names.length > 1 && (_jsx("small", { children: group.names.length }))] }), _jsxs("div", { children: [message.reactions
                                            .filter((reaction) => reaction.emoji === group.emoji)
                                            .slice(0, 3)
                                            .map((reaction) => {
                                            const person = scene.participants.find((person) => person.id === reaction.participantId);
                                            return (person && (_jsx(Avatar, { slots: slots, name: person.name, url: person.avatar, color: person.color }, reaction.id)));
                                        }), group.names.length > 3 && (_jsxs("small", { children: ["+", group.names.length - 3] }))] })] }, group.emoji))), groups.length > 3 && (_jsxs("small", { title: groups
                                .slice(3)
                                .map((group) => `${group.emoji}: ${group.names.join(", ")}`)
                                .join("; "), children: ["+", groups
                                    .slice(3)
                                    .reduce((total, group) => total + group.names.length, 0)] }))] })), _jsxs("div", { className: "tm-message-context", "data-side": outgoing ? "out" : "in", children: [_jsxs("div", { className: "tm-tapback-picker", children: [picker.emojis.map((emoji, index) => (_jsx("span", { "data-picked": picker.selectedEmoji === emoji || undefined, children: emoji }, index))), _jsx(Glyph, { name: "plus", size: 19 })] }), _jsx("div", { className: "tm-bubble", "data-side": outgoing ? "out" : "in", "data-kind": message.kind, children: _jsx(MessageContent, { slots: slots, message: message, scene: scene, time: time }) }), picker.showMenu && (_jsxs("div", { className: "tm-message-menu", children: [_jsxs("span", { children: ["Reply", _jsx(NativeIcon, { name: "reply" })] }), scene.platform === "imessage" && (_jsxs("span", { children: ["Add Sticker", _jsx(Glyph, { name: "sticker", size: 17 })] })), _jsxs("span", { children: ["Copy", _jsx(Glyph, { name: "file", size: 17 })] }), outgoing && (_jsxs("span", { children: ["Edit", _jsx(NativeIcon, { name: "edit" })] })), _jsxs("span", { children: ["More\u2026", _jsx(Glyph, { name: "more", size: 17 })] })] }))] })] }));
    }
    const tray = scene.interactions?.attachmentTray;
    if (!tray?.visible)
        return null;
    const items = tray.items ?? [];
    const apps = scene.platform === "imessage"
        ? [
            ["Camera", "camera"],
            ["Photos", "camera"],
            ["Stickers", "sticker"],
            ["Apple Cash", "gift"],
            ["Audio", "wave"],
            ["Location", "pin"],
            ["More", "more"],
        ]
        : scene.platform === "whatsapp"
            ? [
                ["Camera", "camera"],
                ["Photos", "camera"],
                ["Document", "file"],
                ["Location", "pin"],
                ["Contact", "phone"],
                ["Poll", "more"],
            ]
            : [
                ["Gallery", "camera"],
                ["File", "file"],
                ["Location", "pin"],
                ["Contact", "phone"],
                ["Poll", "more"],
            ];
    return (_jsx("div", { className: "tm-native-overlay tm-attachment-overlay", "data-native-interaction": "attachment", "data-tray-kind": tray.kind, "aria-hidden": "true", children: _jsxs("div", { className: "tm-attachment-sheet", children: [_jsx("div", { className: "tm-sheet-grabber" }), tray.kind === "apps" ? (_jsx("div", { className: "tm-app-tray", children: apps.map(([label, icon], index) => (_jsxs("div", { children: [_jsx("span", { style: {
                                    background: [
                                        "#8b8b90",
                                        "#faab50",
                                        "#9269dc",
                                        "#272a2b",
                                        "#ee595d",
                                        "#398af1",
                                        "#85858c",
                                    ][index],
                                }, children: _jsx(Glyph, { name: icon, size: 24 }) }), _jsx("b", { children: label })] }, label))) })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "tm-tray-heading", children: [_jsx("span", { children: tray.kind === "photos" ? "Photos" : "Stickers" }), _jsx(Glyph, { name: "close", size: 20 })] }), _jsx("div", { className: "tm-tray-tabs", children: tray.kind === "photos" ? (_jsxs(_Fragment, { children: [_jsx("span", { children: "Library" }), _jsx("span", { children: "Albums" })] })) : (_jsxs(_Fragment, { children: [_jsx(Glyph, { name: "clock", size: 20 }), _jsx(Glyph, { name: "sticker", size: 20 }), _jsx(Glyph, { name: "smile", size: 20 })] })) }), items.length ? (_jsx("div", { className: "tm-asset-tray", children: items.map((item) => (_jsxs("div", { children: [item.url ? (_jsx(slots.Image, { src: item.url, alt: item.label, referrerPolicy: "no-referrer" })) : (_jsx("span", { children: item.emoji })), item.label && _jsx("small", { children: item.label })] }, item.id))) })) : (_jsxs("div", { className: "tm-tray-empty", children: [_jsx(Glyph, { name: tray.kind === "photos" ? "camera" : "sticker", size: 40 }), _jsx("strong", { children: tray.kind === "photos" ? "No Photos" : "No Recent Stickers" })] }))] }))] }) }));
}
function ComposerText({ scene, time }) {
    const text = scene.composer.text;
    const selection = scene.composer.selection?.visible !== false
        ? scene.composer.selection
        : undefined;
    const caret = scene.composer.focused && (selection?.showCaret ?? true);
    const rawStart = selection
        ? clamp(selection.start, 0, text.length)
        : text.length;
    const rawEnd = selection
        ? clamp(selection.end, rawStart, text.length)
        : text.length;
    const boundaries = [
        0,
        ...[...textSegmenter.segment(text)].map(({ index, segment }) => index + segment.length),
    ];
    const start = boundaries.findLast((value) => value <= rawStart) ?? 0;
    const end = rawEnd === rawStart
        ? start
        : (boundaries.find((value) => value >= rawEnd) ?? text.length);
    const marker = (_jsx("i", { className: "tm-caret", style: { opacity: Math.floor(time * 2) % 2 === 0 ? 1 : 0.2 } }));
    if (start === end)
        return (_jsxs(_Fragment, { children: [text.slice(0, start), caret && marker, text.slice(start)] }));
    return (_jsxs(_Fragment, { children: [text.slice(0, start), _jsx("mark", { className: "tm-draft-selection", "data-handles": selection?.showHandles || undefined, children: text.slice(start, end) }), text.slice(end)] }));
}
function Composer({ scene, time }) {
    const context = scene.composer.context;
    const mode = context?.mode ?? "normal";
    const nativeEdit = scene.platform === "imessage" && mode === "edit";
    const hasText = !nativeEdit && scene.composer.text.length > 0;
    const referenced = scene.messages.find((message) => message.id === context?.messageId);
    const person = scene.participants.find((participant) => participant.id === referenced?.senderId);
    const placeholder = mode === "reply" && scene.platform === "imessage"
        ? "Reply"
        : scene.platform === "imessage" &&
            scene.composer.placeholder === "iMessage" &&
            scene.header?.transport !== undefined &&
            scene.header.transport !== "imessage"
            ? `Text Message · ${scene.header.transport.toUpperCase()}`
            : scene.composer.placeholder;
    if (mode === "recording" && context)
        return _jsx(RecordingComposer, { scene: scene });
    if (scene.platform === "instagram")
        return (_jsxs("div", { className: "tm-composer-wrap", "data-mode": mode, "aria-hidden": "true", children: [(mode === "reply" || mode === "edit") && (_jsxs("div", { className: "tm-compose-context", children: [_jsx(NativeIcon, { name: mode === "edit" ? "edit" : "reply" }), _jsxs("div", { children: [_jsx("strong", { children: mode === "edit"
                                        ? "Edit message"
                                        : `Replying to ${person?.isSelf ? "yourself" : (person?.name ?? "message")}` }), _jsx("span", { children: referenced?.text || referenced?.kind })] }), _jsx(Glyph, { name: "close", size: 18 })] })), mode === "scheduled" && (_jsxs("div", { className: "tm-ig-scheduled", children: [_jsx(Glyph, { name: "clock", size: 14 }), context?.scheduledAt] })), _jsx("div", { className: "tm-composer", children: _jsxs("div", { className: "tm-composer-field", children: [_jsx("span", { className: "tm-ig-camera", children: _jsx(Glyph, { name: "camera", size: 22 }) }), _jsx("span", { className: hasText ? "tm-composer-text" : "tm-composer-placeholder", children: hasText ? (_jsx(ComposerText, { scene: scene, time: time })) : (_jsxs(_Fragment, { children: [placeholder === "iMessage" || placeholder === "Message"
                                            ? "Message…"
                                            : placeholder, scene.composer.focused && _jsx("i", { className: "tm-caret" })] })) }), hasText ? (_jsx("span", { className: "tm-ig-send", children: mode === "edit" ? "Done" : "Send" })) : (_jsxs("span", { className: "tm-ig-input-actions", children: [_jsx(Glyph, { name: "mic", size: 22 }), _jsxs("svg", { width: "23", height: "23", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", children: [_jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "4" }), _jsx("circle", { cx: "8", cy: "8", r: "1.5" }), _jsx("path", { d: "m4 17 5-6 4 4 3-3 5 5" })] }), _jsx(Glyph, { name: "sticker", size: 23 })] }))] }) })] }));
    return (_jsxs("div", { className: "tm-composer-wrap", "data-mode": mode, "aria-hidden": "true", children: [scene.platform !== "imessage" &&
                (mode === "reply" || mode === "edit") && (_jsxs("div", { className: "tm-compose-context", children: [_jsx(NativeIcon, { name: mode === "edit" ? "edit" : "reply" }), _jsxs("div", { children: [_jsx("strong", { children: mode === "edit" ? "Edit Message" : (person?.name ?? "Reply") }), _jsx("span", { children: referenced?.text || referenced?.kind })] }), _jsx(Glyph, { name: "close", size: 18 })] })), _jsxs("div", { className: "tm-composer", "data-native-edit": nativeEdit || undefined, children: [_jsx("span", { className: "tm-add", children: _jsx(Glyph, { name: scene.platform === "telegram" ? "paperclip" : "plus", size: 24 }) }), _jsxs("div", { className: "tm-composer-field", "data-scheduled": mode === "scheduled" || undefined, children: [mode === "scheduled" && (_jsxs("div", { className: "tm-schedule-chip", children: [_jsx(Glyph, { name: "clock", size: 13 }), _jsx("span", { children: context?.scheduledAt }), _jsx(Glyph, { name: "chevron", size: 12 }), _jsx(Glyph, { name: "close", size: 15 })] })), _jsx("span", { className: hasText ? "tm-composer-text" : "tm-composer-placeholder", children: hasText ? (_jsx(ComposerText, { scene: scene, time: time })) : (_jsxs(_Fragment, { children: [placeholder, !nativeEdit && scene.composer.focused && (_jsx("i", { className: "tm-caret" }))] })) }), !hasText && scene.platform === "telegram" && (_jsx(Glyph, { name: "gift", size: 20 })), " ", !hasText && (_jsx(Glyph, { name: scene.platform === "imessage"
                                    ? "wave"
                                    : "sticker", size: 20 })), " ", hasText && scene.platform === "imessage" && (_jsx("span", { className: "tm-send", children: _jsx(Glyph, { name: "arrow-up", size: 20 }) }))] }), scene.platform === "whatsapp" && !hasText && (_jsx("span", { className: "tm-composer-mic", "data-camera": true, children: _jsx(Glyph, { name: "camera", size: 22 }) })), scene.platform !== "imessage" && (_jsx("span", { className: hasText ? "tm-send" : "tm-composer-mic", children: _jsx(Glyph, { name: hasText
                                ? mode === "edit"
                                    ? "check"
                                    : scene.platform === "telegram" ||
                                        scene.platform === "whatsapp"
                                        ? "send"
                                        : "arrow-up"
                                : "mic", size: 22 }) }))] })] }));
}
function Keyboard({ scene }) {
    if (scene.composer.keyboard === "emoji")
        return (_jsxs("div", { className: "tm-keyboard tm-emoji-keyboard", "aria-hidden": "true", children: [_jsxs("div", { className: "tm-emoji-search", children: [_jsx(Glyph, { name: "smile", size: 17 }), _jsx("span", { children: "Search Emoji" })] }), _jsx("span", { className: "tm-emoji-heading", children: "SMILEYS & PEOPLE" }), _jsx("div", { className: "tm-emoji-grid", children: [
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
                        "😗",
                        "😙",
                        "😚",
                        "😋",
                        "😛",
                        "😝",
                        "😜",
                        "🤪",
                        "🤨",
                        "🧐",
                        "🤓",
                        "😎",
                    ].map((emoji) => (_jsx("span", { children: emoji }, emoji))) }), _jsxs("div", { className: "tm-emoji-footer", children: [_jsx("span", { children: "ABC" }), _jsx(Glyph, { name: "clock", size: 19 }), _jsx(Glyph, { name: "smile", size: 20 }), _jsx("span", { children: "\u2661" }), _jsx("span", { children: "\u2667" }), _jsx("span", { children: "\u2691" }), _jsx(Glyph, { name: "backspace", size: 24 })] })] }));
    return (_jsxs("div", { className: "tm-keyboard tm-alphabetic-keyboard", "aria-hidden": "true", children: [["qwertyuiop", "asdfghjkl", "zxcvbnm"].map((row, index) => (_jsxs("div", { className: "tm-key-row", children: [index === 2 && (_jsx("span", { className: "tm-key tm-key-mod", children: _jsx(Glyph, { name: "shift", size: 19 }) })), [...row].map((letter) => (_jsx("span", { className: "tm-key", children: letter }, letter))), index === 2 && (_jsx("span", { className: "tm-key tm-key-mod", children: _jsx(Glyph, { name: "backspace", size: 22 }) }))] }, row))), _jsxs("div", { className: "tm-key-row tm-key-bottom", children: [_jsx("span", { className: "tm-key tm-key-mod", children: "123" }), _jsx("span", { className: "tm-key tm-key-space", children: "space" }), _jsx("span", { className: "tm-key tm-key-return", children: "return" })] }), _jsxs("div", { className: "tm-keyboard-bottom", children: [_jsx(Glyph, { name: "smile", size: 27 }), _jsx(Glyph, { name: "mic", size: 24 })] })] }));
}
function TypingDots({ time }) {
    return (_jsxs("div", { className: "tm-typing", "aria-label": "Typing", children: [[0, 1, 2].map((index) => (_jsx("i", { style: {
                    opacity: 0.35 + 0.65 * Math.max(0, Math.sin(time * 5 - index * 0.8)),
                    transform: `translateY(${-1.5 * Math.max(0, Math.sin(time * 5 - index * 0.8))}px)`,
                } }, index))), _jsx("b", {}), _jsx("b", {})] }));
}
function ScreenEffect({ effect, time, }) {
    if (effect === "spotlight")
        return (_jsx("div", { className: "tm-screen-effect tm-spotlight", style: {
                backgroundPosition: `${50 + Math.sin(time * 0.8) * 25}% ${50 + Math.cos(time * 0.6) * 20}%`,
            } }));
    if (effect === "lasers")
        return (_jsx("div", { className: "tm-screen-effect tm-lasers", children: [0, 1, 2, 3].map((index) => (_jsx("i", { style: {
                    transform: `rotate(${Math.sin(time + index * 1.7) * 60}deg)`,
                    background: ["#ec387c", "#28b8e8", "#73eeaf", "#b084ff"][index],
                } }, index))) }));
    return (_jsx("div", { className: "tm-screen-effect", "data-screen-effect": effect, children: Array.from({ length: effect === "echo" ? 8 : 36 }, (_, index) => {
            const seed = Math.sin(index * 91.31 + 2.7) * 10000;
            const x = (seed - Math.floor(seed)) * 100;
            const phase = (time * (effect === "balloons" ? 0.1 : 0.16) + index * 0.083) % 1;
            return (_jsx("span", { className: `tm-particle tm-particle-${effect}`, style: {
                    left: `${x}%`,
                    top: `${effect === "balloons" || effect === "hearts" ? 105 - phase * 130 : phase * 115 - 10}%`,
                    transform: `translateX(${Math.sin(time + index) * 26}px) rotate(${phase * 300 + index * 23}deg)`,
                    color: ["#fc75a6", "#87ccec", "#f8ce73", "#9ce0c2", "#b39aef"][index % 5],
                    opacity: effect === "echo" ? 0.4 : 0.85,
                }, children: effect === "hearts"
                    ? "♥"
                    : effect === "balloons"
                        ? "●"
                        : effect === "fireworks"
                            ? "✦"
                            : effect === "echo"
                                ? "✧"
                                : "" }, index));
        }) }));
}
function messageStyle(message, time, animate) {
    const p = message.presentation;
    const age = Math.max(0, time - message.at);
    const enter = animate ? clamp(age / 0.32) : 1;
    const spring = enter === 1
        ? 1
        : 1 - Math.pow(1 - enter, 3) + Math.sin(enter * Math.PI) * 0.04;
    let effectScale = 1;
    let rotate = 0;
    let dx = 0;
    if (animate && age < 1.5) {
        if (message.effect === "slam")
            effectScale = 1 + 0.4 * Math.exp(-age * 7) * Math.cos(age * 15);
        if (message.effect === "loud")
            effectScale = 1 + 0.2 * Math.sin(clamp(age / 1.5) * Math.PI);
        if (message.effect === "gentle")
            effectScale = 0.85 + 0.15 * clamp(age / 1.5);
        if (message.effect === "bloom")
            effectScale = 1 + Math.sin(age * 8) * 0.12 * Math.exp(-age * 2);
        if (message.effect === "shake" || message.effect === "jitter")
            dx = Math.sin(age * 65) * 4 * Math.exp(-age * 2);
        if (message.effect === "ripple")
            rotate = Math.sin(age * 18) * 3 * Math.exp(-age * 2);
    }
    return {
        opacity: p.opacity * Math.min(1, enter * 3),
        transform: `translate(${p.offsetX + dx}px, ${p.offsetY + (1 - spring) * 12}px) scale(${p.scale * (0.92 + 0.08 * spring) * effectScale}) rotate(${rotate}deg)`,
    };
}
function emojiOnly(text) {
    if (!text.trim() ||
        !/^[\p{Extended_Pictographic}\p{Emoji_Component}\u200d\ufe0f\s]+$/u.test(text) ||
        /[0-9#*]/u.test(text))
        return false;
    return ([
        ...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(text.replace(/\s+/gu, "")),
    ].length <= 3);
}
function safeHostname(url) {
    try {
        return new URL(url ?? "").hostname.replace(/^www\./, "");
    }
    catch {
        return "";
    }
}
function formatBytes(bytes) {
    return bytes >= 1e6
        ? `${(bytes / 1e6).toFixed(1)} MB`
        : bytes >= 1e3
            ? `${Math.round(bytes / 1e3)} KB`
            : `${bytes} B`;
}
