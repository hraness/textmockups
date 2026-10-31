import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { evaluateScene, sceneTime } from "./timeline.js";
import { Glyph } from "./glyph.js";
import { PhoneText } from "./text.js";
import { legacyLinkTone, linkColors } from "./link-colors.js";
import { AndroidKeyboard, AndroidNavBar, AndroidStatusBar, MatIcon, } from "./android.js";
import { deviceProfile, deviceStage, sceneOs, } from "./devices.js";
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
/**
 * The phone scaled to the width of its container, with no script: the wrapper
 * keeps the device's aspect ratio and the device scales by CSS alone. Use it
 * for responsive pages; use `Phone` when you size the device yourself.
 */
export function PhoneFit({ className, style, ...props }) {
    const { width, height } = deviceStage(props.scene);
    return (_jsx("div", { className: className ? `tm-fit ${className}` : "tm-fit", style: {
            aspectRatio: `${width} / ${height}`,
            ...{ "--tm-fit-width": `${width}px` },
            ...style,
        }, children: _jsx(Phone, { ...props }) }));
}
export function Phone({ scene: source, time, selectedMessageId, onSelectMessage, exporting = false, watermark = true, media: mediaSlots, text: Text = PhoneText, }) {
    const slots = { ...defaultPhoneMedia, ...mediaSlots, Text };
    const scene = time === undefined ? source : evaluateScene(source, time);
    const playhead = time === undefined ? source.timeline.duration : sceneTime(source, time);
    const group = isGroupConversation(scene);
    // iMessage always shows who is talking in a group.
    const rowAvatars = scene.appearance.showAvatars || (scene.platform === "imessage" && group);
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
    const model = deviceProfile(scene.device.model);
    const os = model?.os ?? "ios";
    const framed = scene.device.frame !== "none";
    const stage = deviceStage(source);
    const keyboardHeight = os === "android"
        ? scene.composer.keyboard === "alphabetic"
            ? model?.system === "one-ui"
                ? 306
                : 272
            : 300
        : scene.composer.keyboard === "alphabetic"
            ? 252
            : 286;
    const threadMessages = scene.platform === "imessage" && mode === "reply"
        ? scene.messages.filter((message) => message.id === scene.composer.context?.messageId ||
            message.replyTo === scene.composer.context?.messageId)
        : scene.messages;
    const lastOutgoing = threadMessages.findLastIndex((message) => message.senderId === self.id &&
        !message.unsent &&
        message.kind !== "system");
    return (_jsxs("div", { className: "tm-device-stage", style: { width: stage.width, height: stage.height }, children: [_jsxs("div", { className: "tm-phone", "data-textmock-phone": true, "data-platform": scene.platform, "data-theme": scene.theme, "data-frame": scene.device.frame, "data-os": os, "data-system": model?.system, "data-model": model?.model, "data-group": group || undefined, "data-exporting": exporting || undefined, "data-renderer": scene.rendererVersion, "data-transport": scene.header?.transport ??
                    (scene.platform === "google-messages" ? "rcs" : "imessage"), "data-composer-mode": mode, style: css({
                    width: framed && model ? scene.device.width + model.bezel * 2 : scene.device.width,
                    height: framed && model
                        ? scene.device.height + model.bezel * 2
                        : scene.device.height,
                    transform: `scale(${scene.device.scale})`,
                    transformOrigin: "50% 50%",
                    "--tm-type": `${scene.appearance.textSize}px`,
                    "--tm-thread-w": `${scene.device.width - 40}px`,
                    "--tm-radius": `${scene.appearance.bubbleRadius}px`,
                    "--tm-composer-extra": `${extraComposerHeight}px`,
                    "--tm-keyboard-height": `${keyboardHeight}px`,
                    "--tm-bezel": model ? `${model.bezel}px` : undefined,
                    "--tm-screen-radius": model ? `${model.radius}px` : undefined,
                    "--tm-cutout-w": model ? `${model.cutout.width}px` : undefined,
                    "--tm-cutout-h": model ? `${model.cutout.height}px` : undefined,
                    "--tm-cutout-top": model ? `${model.cutout.top}px` : undefined,
                    "--tm-status-h": model ? `${model.statusBar.height}px` : undefined,
                    "--tm-status-c": model ? `${model.statusBar.center}px` : undefined,
                    "--tm-nav-h": model ? `${model.navigation}px` : undefined,
                    "--tm-handle-w": model ? `${model.gestureHandle}px` : undefined,
                }), "aria-label": `${scene.platform === "imessage"
                    ? "iMessage"
                    : scene.platform === "whatsapp"
                        ? "WhatsApp"
                        : scene.platform === "instagram"
                            ? "Instagram"
                            : scene.platform === "google-messages"
                                ? "Google Messages"
                                : "Telegram"} conversation with ${scene.contact.name}`, children: [scene.device.frame === "iphone" && !model && (_jsxs(_Fragment, { children: [_jsx("i", { className: "tm-side-button tm-side-action" }), _jsx("i", { className: "tm-side-button tm-side-volume" }), _jsx("i", { className: "tm-side-button tm-side-power" })] })), model && framed && (_jsxs(_Fragment, { children: [_jsx("i", { className: "tm-side-key tm-key-volume" }), _jsx("i", { className: "tm-side-key tm-key-power" })] })), _jsxs("div", { className: "tm-screen", "data-textmock-screen": true, "data-keyboard": keyboard || undefined, "data-status-hidden": !scene.statusBar.visible || undefined, "data-wallpaper": scene.appearance.wallpaper, style: css({ "--tm-wall-color": scene.appearance.color }), children: [_jsx("div", { className: "tm-wallpaper", "aria-hidden": "true" }), scene.statusBar.visible &&
                                (os === "android" ? (_jsx(AndroidStatusBar, { scene: scene, Text: Text })) : (_jsx(StatusBar, { scene: scene, Text: Text }))), scene.statusBar.visible &&
                                (model ? (framed &&
                                    (os === "android" ? (_jsx("div", { className: "tm-cutout", "aria-hidden": "true" })) : (_jsx("div", { className: "tm-island", "aria-hidden": "true", children: _jsx("i", {}) })))) : (scene.device.frame === "iphone" && (_jsx("div", { className: "tm-island", "aria-hidden": "true", children: _jsx("i", {}) })))), _jsx(PhoneHeader, { slots: slots, scene: scene, person: other }), scene.platform !== "imessage" && pinned?.visible && (_jsx(PinnedBanner, { slots: slots, scene: scene })), _jsx("div", { className: "tm-thread", "data-textmock-thread": true, "data-has-pinned": (scene.platform !== "imessage" && pinned?.visible) || undefined, children: _jsxs("div", { className: "tm-thread-content", children: [threadMessages.map((message, index) => {
                                            const person = scene.participants.find((participant) => participant.id === message.senderId);
                                            const outgoing = person.isSelf;
                                            const link = scene.platform === "imessage" && message.link?.tint ? linkColors(message.link.tint, scene) : undefined;
                                            const previous = threadMessages[index - 1];
                                            const next = threadMessages[index + 1];
                                            const editing = scene.platform === "imessage" &&
                                                mode === "edit" &&
                                                scene.composer.context?.messageId === message.id;
                                            // In iMessage a photo or video stands alone: it ends the run before it and
                                            // carries its own tail and avatar.
                                            const media = (item) => scene.platform === "imessage" &&
                                                !!item &&
                                                (item.kind === "image" || item.kind === "video" || !!item.gallery);
                                            // A loose collage of a few photos floats free of the avatar column.
                                            const collage = scene.platform === "imessage" &&
                                                !!message.gallery &&
                                                (message.gallery.count ?? message.gallery.items.length) <= 4;
                                            const named = !previous ||
                                                previous.senderId !== message.senderId ||
                                                !!message.dateLabel ||
                                                previous.kind === "system" ||
                                                previous.unsent;
                                            // A tapback ends the group above it so its badge has room, unless fitBubbles
                                            // finds the badge clears the bubble above (data-clear).
                                            const tapback = scene.platform === "imessage" &&
                                                message.reactions.length > 0 &&
                                                previous?.senderId === message.senderId;
                                            const tapbackBelow = scene.platform === "imessage" &&
                                                !!next?.reactions.length &&
                                                next.senderId === message.senderId;
                                            const first = tapback ||
                                                media(message) ||
                                                media(previous) ||
                                                message.pause ||
                                                !previous ||
                                                previous.senderId !== message.senderId ||
                                                !!message.dateLabel ||
                                                previous.kind === "system" ||
                                                previous.unsent;
                                            const last = tapbackBelow ||
                                                media(message) ||
                                                media(next) ||
                                                !next ||
                                                next.pause ||
                                                next.senderId !== message.senderId ||
                                                !!next.dateLabel ||
                                                next.kind === "system" ||
                                                next.unsent;
                                            const reply = message.replyTo
                                                ? scene.messages.find((item) => item.id === message.replyTo)
                                                : undefined;
                                            // iOS 26 threads a reply with a hook from the original's middle. An original
                                            // further up the thread is repeated above the reply as an outlined ghost.
                                            const replyAdjacent = !!reply && previous?.id === reply.id;
                                            const repliedBy = scene.platform === "imessage" && next?.replyTo === message.id
                                                ? next
                                                : undefined;
                                            // Consecutive replies to one original form a run: one quote of the original
                                            // above the first, and a spine down the left past the rest.
                                            const thread = scene.platform === "imessage" && !!reply ? reply.id : undefined;
                                            const runStart = !!thread && previous?.replyTo !== thread;
                                            const runEnd = !!thread && next?.replyTo !== thread;
                                            const spine = !!thread && !(runStart && runEnd && replyAdjacent);
                                            const spineInset = 14 + (rowAvatars ? 39 : 0);
                                            const quoteCount = thread
                                                ? threadMessages.filter((item) => item.replyTo === thread).length
                                                : 0;
                                            const replyCount = scene.platform === "imessage"
                                                ? threadMessages.filter((item, at) => item.replyTo === message.id && at !== index + 1).length
                                                : 0;
                                            const receipt = outgoing &&
                                                (scene.platform === "imessage" ||
                                                    scene.platform === "instagram" ||
                                                    scene.platform === "google-messages") &&
                                                !message.scheduledAt &&
                                                ((index === lastOutgoing &&
                                                    // iMessage drops the receipt once they reply, but a set one such as
                                                    // "Read 11:38 AM" stays above the reply.
                                                    (scene.platform !== "imessage" ||
                                                        !!message.statusText ||
                                                        !threadMessages
                                                            .slice(index + 1)
                                                            .some((item) => item.senderId !== self.id && item.kind !== "system"))) ||
                                                    message.status === "failed" ||
                                                    message.status === "sending" ||
                                                    message.edited);
                                            const incomingEdited = scene.platform === "imessage" && !outgoing && message.edited;
                                            if (message.kind === "system" || message.unsent)
                                                return (_jsx("div", { className: "tm-system-message", "data-message-id": message.id, children: message.unsent
                                                        ? `${outgoing ? "You" : person.name} unsent a message`
                                                        : message.text }, message.id));
                                            return (_jsxs("div", { className: "tm-message-block", "data-message-id": message.id, "data-side": outgoing ? "out" : "in", "data-editing": editing || undefined, "data-first": first || undefined, "data-last": last || undefined, "data-reply": (scene.platform === "imessage" && !!reply) || undefined, "data-thread": (thread && !runStart) || undefined, "data-tapback": tapback || undefined, children: [scene.platform !== "imessage" &&
                                                        scene.conversation?.unread?.visible &&
                                                        scene.conversation.unread.messageId === message.id && (_jsx("div", { className: "tm-unread-divider", children: scene.platform === "whatsapp"
                                                            ? `${scene.conversation.unread.count} UNREAD MESSAGE${scene.conversation.unread.count === 1 ? "" : "S"}`
                                                            : "Unread Messages" })), message.dateLabel && (_jsxs("div", { className: "tm-date", children: [spine && !runStart && (_jsx("i", { className: "tm-thread-spine", "data-at": "date", "aria-hidden": "true", style: { left: spineInset } })), _jsx(slots.Text, { field: "date", messageId: message.id, value: message.dateLabel, children: _jsx(DateLabel, { label: message.dateLabel, platform: scene.platform }) })] })), scene.platform === "imessage" &&
                                                        message.scheduledAt &&
                                                        (!previous?.scheduledAt ||
                                                            previous.scheduledAt !== message.scheduledAt) && (_jsxs("div", { className: "tm-scheduled-label", children: [_jsx("span", { children: "Send Later" }), _jsxs("span", { children: [message.scheduledAt, " ", _jsx("b", { children: "Edit" })] })] })), thread && runStart && !replyAdjacent && reply && (_jsxs("div", { className: "tm-reply-ghost", "data-side": reply.senderId === self.id ? "out" : "in", "data-count": quoteCount > 1 || undefined, children: [_jsxs("div", { className: "tm-bubble tm-ghost", "data-side": reply.senderId === self.id ? "out" : "in", "data-kind": reply.kind, "data-compact": reply.kind === "text" || undefined, "data-tail": true, "aria-hidden": "true", children: [_jsx(GhostTail, {}), _jsx(MessageContent, { slots: slots, message: { ...reply, effect: "none" }, scene: scene, time: playhead }), _jsx("i", { className: "tm-thread-arc", "data-gap": !outgoing || undefined, "aria-hidden": "true", style: reply.senderId === self.id
                                                                            ? { right: `calc(var(--tm-thread-w) - ${spineInset + 33}px)` }
                                                                            : { left: `calc(${spineInset}px - var(--tm-avatar-gutter, 0px))` } })] }), quoteCount > 1 && (_jsxs("div", { className: "tm-reply-count", children: [quoteCount, " Replies"] }))] })), spine && !runStart && (_jsx("i", { className: "tm-thread-spine", "data-at": "top", "data-gap": !outgoing || undefined, "aria-hidden": "true", style: { left: spineInset } })), _jsxs("div", { className: "tm-message-row", "data-side": outgoing ? "out" : "in", "data-reactions": message.reactions.length > 0 || undefined, children: [spine && !runEnd && (_jsx("i", { className: "tm-thread-spine", "aria-hidden": "true", style: { left: spineInset } })), !outgoing && rowAvatars && (_jsx(Avatar, { slots: slots, name: person.name, url: person.avatar, color: person.color, className: "tm-row-avatar", hidden: !last || collage })), _jsxs("div", { className: "tm-message-stack", children: [scene.platform === "imessage" &&
                                                                        pinned?.visible &&
                                                                        pinned.messageId === message.id && (_jsxs("div", { className: "tm-pinned-item", children: [_jsx(NativeIcon, { name: "pin" }), pinned.label] })), scene.platform === "imessage" &&
                                                                        scene.interactions?.editHistory?.visible &&
                                                                        scene.interactions.editHistory.messageId ===
                                                                            message.id && (_jsxs("div", { className: "tm-edit-history", children: [message.editHistory?.versions.map((version) => (_jsxs("div", { className: "tm-history-version", children: [_jsx("small", { children: version.editedAt }), _jsx("span", { children: version.text })] }, version.id))), _jsx("small", { children: "Hide Edits" })] })), !outgoing && named && group && (_jsx("div", { className: "tm-sender-name", style: {
                                                                            color: scene.platform === "imessage"
                                                                                ? undefined
                                                                                : person.color,
                                                                        }, children: person.name })), reply && scene.platform === "instagram" && (_jsx(InstagramReply, { scene: scene, message: message, reply: reply })), _jsxs("div", { className: "tm-bubble", "data-side": outgoing ? "out" : "in", "data-tail": last || undefined, "data-first": first || undefined, "data-kind": message.kind, "data-emoji": (message.kind === "text" &&
                                                                            emojiOnly(message.text)) ||
                                                                            undefined, "data-selected": selected === message.id || undefined, "data-effect": message.effect, "data-scheduled": !!message.scheduledAt || undefined, "data-interactive": (!!onSelectMessage && !exporting) || undefined, style: {
                                                                            ...messageStyle(message, playhead, time !== undefined),
                                                                            ...(message.link?.tint && {
                                                                                "--tm-link-tint": message.link.tint,
                                                                                "--tm-link-surface": link?.surface,
                                                                                "--tm-link-domain": link?.domain,
                                                                            }),
                                                                        }, "data-tint": link?.tone ?? (message.link?.tint ? legacyLinkTone(message.link.tint) : undefined), role: onSelectMessage && !exporting ? "button" : undefined, tabIndex: onSelectMessage && !exporting ? 0 : undefined, "data-message-id": message.id, "aria-label": `${person.name}: ${message.text || message.kind}${message.status === "read" ? ", read" : ""}`, onClick: onSelectMessage && !exporting
                                                                            ? () => onSelectMessage(message.id)
                                                                            : undefined, onKeyDown: onSelectMessage && !exporting
                                                                            ? (event) => {
                                                                                if (event.key === "Enter" ||
                                                                                    event.key === " ") {
                                                                                    event.preventDefault();
                                                                                    onSelectMessage(message.id);
                                                                                }
                                                                            }
                                                                            : undefined, children: [_jsx(BubblePaint, { platform: scene.platform, message: message }), scene.platform !== "instagram" &&
                                                                                scene.platform !== "google-messages" &&
                                                                                (scene.platform === "whatsapp" ? first : last) &&
                                                                                message.kind !== "sticker" &&
                                                                                !emojiOnly(message.text) && (_jsx(BubbleTail, { platform: scene.platform, scheduled: !!message.scheduledAt })), spine && outgoing && (_jsx("i", { className: runEnd ? "tm-thread-end" : "tm-thread-loop", "aria-hidden": "true", style: {
                                                                                    right: `calc(var(--tm-thread-w) - ${spineInset + (runEnd ? 33 : 18.5)}px)`,
                                                                                } })), repliedBy && (_jsx(ReplyHook, { from: outgoing ? "out" : "in", to: repliedBy.senderId === self.id ? "out" : "in", drop: (next?.senderId === message.senderId ? 4 : 10) +
                                                                                    (repliedBy.dateLabel ? 24.27 : 0) +
                                                                                    (repliedBy.reactions.length ? 27.33 : 0) -
                                                                                    5, offset: repliedBy.senderId !== self.id &&
                                                                                    rowAvatars
                                                                                    ? 39
                                                                                    : 0 })), reply &&
                                                                                scene.platform !== "instagram" &&
                                                                                scene.platform !== "imessage" && (_jsxs("div", { className: "tm-reply", children: [_jsx("b", { children: scene.participants.find((p) => p.id === reply.senderId)?.name }), _jsx("span", { children: reply.text ||
                                                                                            `${reply.kind[0]?.toUpperCase()}${reply.kind.slice(1)}` })] })), editing ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "tm-inline-edit-text tm-bubble-content", children: _jsx(ComposerText, { scene: scene, time: playhead }) }), _jsx("span", { className: "tm-edit-cancel", children: _jsx(Glyph, { name: "close", size: 20 }) }), _jsx("span", { className: "tm-edit-confirm", children: _jsx(Glyph, { name: "check", size: 21 }) }), scene.composer.selection &&
                                                                                        scene.composer.selection.visible !== false &&
                                                                                        scene.composer.selection.end >
                                                                                            scene.composer.selection.start && (_jsxs("div", { className: "tm-selection-menu", children: [_jsx("span", { children: "Cut" }), _jsx("span", { children: "Copy" }), _jsx("span", { children: "Paste" }), _jsx("span", { children: "Replace\u2026" }), _jsx(Glyph, { name: "chevron", size: 15 })] }))] })) : (_jsx(MessageContent, { slots: slots, message: message, scene: scene, time: playhead, tail: last })), (scene.platform === "whatsapp" ||
                                                                                scene.platform === "telegram") && (_jsxs("span", { className: "tm-inline-meta", "data-status": message.status, children: [message.edited && _jsx("span", { children: "edited " }), message.timestamp ||
                                                                                        (scene.appearance.showTimestamps
                                                                                            ? scene.statusBar.time
                                                                                            : ""), outgoing && (_jsx(DeliveryGlyph, { status: message.status }))] })), scene.platform === "google-messages" &&
                                                                                outgoing &&
                                                                                message.kind !== "sticker" &&
                                                                                !emojiOnly(message.text) && (_jsx(GoogleReceipt, { status: message.status })), message.reactions.length > 0 && (_jsx(ReactionBadges, { slots: slots, message: message, scene: scene })), message.stickers?.map((sticker) => (_jsx("span", { className: "tm-attached-sticker", "data-sticker-id": sticker.id, style: {
                                                                                    left: `${sticker.x * 100}%`,
                                                                                    top: `${sticker.y * 100}%`,
                                                                                    zIndex: 5 + sticker.zIndex,
                                                                                    transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
                                                                                }, children: sticker.url ? (_jsx(slots.Image, { src: sticker.url, alt: "Attached sticker", referrerPolicy: "no-referrer", draggable: false })) : (sticker.emoji) }, sticker.id)))] }), replyCount > 0 && (_jsxs("div", { className: "tm-reply-count", children: [replyCount, " ", replyCount === 1 ? "Reply" : "Replies"] })), (receipt || incomingEdited ||
                                                                        (scene.platform === "imessage" &&
                                                                            message.kind === "voice")) && (_jsxs("div", { className: "tm-receipt-row", children: [receipt && (_jsxs("div", { className: "tm-receipt", "data-status": message.status, children: [_jsx(slots.Text, { field: "receipt", messageId: message.id, value: message.statusText || nativeReceipt(scene, message), children: _jsx(ReceiptLabel, { label: message.statusText || nativeReceipt(scene, message), platform: scene.platform }) }), message.edited && (_jsxs("span", { children: [" ", "\u00B7", " ", _jsxs("span", { className: scene.platform === "imessage" ? "tm-edited" : undefined, children: ["Edited", message.editedAt ? ` ${message.editedAt}` : ""] })] }))] })), incomingEdited && (_jsx("div", { className: "tm-receipt tm-incoming-edit", children: _jsxs("span", { className: "tm-edited", children: ["Edited", message.editedAt ? ` ${message.editedAt}` : ""] }) })), scene.platform === "imessage" &&
                                                                                message.kind === "voice" && (_jsx("span", { className: "tm-audio-keep", "data-kept": message.media?.keep || undefined, children: message.media?.keep ? "Kept" : "Keep" }))] })), scene.platform === "instagram" &&
                                                                        message.edited &&
                                                                        !receipt && (_jsx("div", { className: "tm-ig-edited", children: "Edited" })), scene.platform === "imessage" &&
                                                                        !receipt &&
                                                                        scene.appearance.showTimestamps &&
                                                                        message.timestamp && (_jsx("div", { className: "tm-message-time", children: message.timestamp }))] })] })] }, message.id));
                                        }), scene.composer.typing.visible && (_jsxs("div", { className: "tm-typing-row", children: [_jsx(TypingDots, { time: playhead }), scene.platform !== "imessage" && (_jsxs("span", { children: [scene.participants.find((p) => p.id === scene.composer.typing.participantId)?.name ?? scene.contact.name, " ", "is typing"] }))] })), _jsx(FocusStatus, { scene: scene }), scene.messages.length === 0 && (_jsxs("div", { className: "tm-empty-conversation", children: [_jsx(Avatar, { slots: slots, name: scene.contact.name, url: scene.contact.avatar ?? other?.avatar, color: other?.color }), _jsx("span", { children: scene.contact.name })] }))] }) }), scene.platform === "imessage" &&
                                scene.conversation?.unread?.visible && (_jsxs("div", { className: "tm-catch-up", children: [_jsx(Glyph, { name: "chevron", size: 16 }), _jsx(Glyph, { name: "chevron", size: 16 }), _jsx("span", { children: scene.conversation.unread.count })] })), _jsxs("div", { className: "tm-input-region", children: [_jsx(Composer, { scene: scene, time: playhead }), keyboard && mode !== "recording" && _jsx(Keyboard, { scene: scene })] }), _jsx(NativeInteraction, { slots: slots, scene: scene, time: playhead }), os === "android" ? (_jsx(AndroidNavBar, { scene: scene })) : (
                            // A screenshot never shows the home indicator; a framed device does.
                            framed && _jsx("div", { className: "tm-home-indicator", "aria-hidden": "true" })), scene.appearance.screenEffect !== "none" && (_jsx(ScreenEffect, { effect: scene.appearance.screenEffect, time: playhead }))] })] }), watermark && (_jsxs("div", { className: "tm-watermark", "data-textmock-watermark": true, style: {
                    ...watermarkStyle(scene.id, time === undefined ? 0 : playhead),
                    // Follow the phone when it shrinks, and stay inside the output when it zooms.
                    left: Math.min(stage.width - 107, Math.max(-4, (stage.width - stage.width * scene.device.scale) / 2 - 4)),
                    top: Math.min(stage.height - 43, Math.max(24, (stage.height - stage.height * scene.device.scale) / 2 + 24)),
                }, children: [_jsx("span", { children: "made with" }), _jsx("strong", { children: "textmock.com" }), _jsx("i", { "aria-hidden": "true", children: "\u2726" })] }))] }));
}
function Avatar({ slots, name, url, color, className = "", hidden = false, }) {
    return (_jsx("span", { className: `tm-avatar ${className}`, style: {
            "--tm-avatar": color,
            visibility: hidden ? "hidden" : undefined,
        }, "aria-hidden": "true", children: url ? (_jsx(slots.Image, { src: url, alt: "", referrerPolicy: "no-referrer", draggable: false })) : (initials(name)) }));
}
function StatusBar({ scene, Text = PhoneText, }) {
    const { statusBar: status } = scene;
    return (_jsxs("div", { className: "tm-status-bar", "aria-hidden": "true", children: [_jsxs("span", { className: "tm-status-left", children: [_jsx("span", { className: "tm-clock", children: _jsx(Text, { field: "clock", value: status.time, children: status.time }) }), status.silent && (_jsxs("svg", { className: "tm-silent", width: "15.33", height: "16.67", viewBox: "0 0 46 50", children: [_jsxs("mask", { id: "tm-silent-cut", children: [_jsx("rect", { width: "46", height: "50", fill: "#fff" }), _jsx("path", { d: "M3.5 4.5 41.5 43.5", stroke: "#000", strokeWidth: "10" })] }), _jsxs("g", { fill: "currentColor", mask: "url(#tm-silent-cut)", children: [_jsx("path", { d: "M22.5 2C15.5 2 11 7 9.6 13L8 24c-.7 3.5-3.5 5.5-5.5 7.5-1.3 1.5-.7 5.5 2.5 5.5h35c3.2 0 3.8-4 2.5-5.5-2-2-4.8-4-5.5-7.5l-1.6-11C34 7 29.5 2 22.5 2Z" }), _jsx("path", { d: "M16 41h13c0 3.2-2.9 5.3-6.5 5.3S16 44.2 16 41Z" })] }), _jsx("path", { d: "M3.5 4.5 41.5 43.5", stroke: "currentColor", strokeWidth: "3.6", strokeLinecap: "round" })] }))] }), _jsxs("span", { className: "tm-status-right", children: [status.cellular2 === undefined ? (_jsx("svg", { className: "tm-cellular", width: "21.67", height: "13", viewBox: "0 0 65 39", children: [0, 1, 2, 3].map((bar) => (_jsx("rect", { x: bar * 18, y: 27 - bar * 8, width: "11", height: 12 + bar * 8, rx: "3.3", fill: "currentColor", opacity: bar < status.cellular ? 1 : 0.2 }, bar))) })) : (_jsx("svg", { className: "tm-cellular", width: "21.67", height: "15", viewBox: "0 0 65 45", children: [0, 1, 2, 3].map((bar) => (_jsxs("g", { fill: "currentColor", children: [_jsx("rect", { x: bar * 18, y: 14 - bar * 4.6, width: "11", height: 13 + bar * 4.6, rx: "4.2", opacity: bar < status.cellular ? 1 : 0.2 }), _jsx("rect", { x: bar * 18, y: "33", width: "11", height: "11.7", rx: "4.2", opacity: bar < (status.cellular2 ?? 0) ? 1 : 0.2 })] }, bar))) })), status.wifi > 0 ? (_jsx("svg", { className: "tm-wifi", width: "17.67", height: "13.67", viewBox: "0 0 53 41", children: _jsxs("g", { fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { opacity: status.wifi >= 3 ? 1 : 0.2, strokeWidth: "9", d: "M2.1 13.9a36.5 36.5 0 0 1 48.8 0" }), _jsx("path", { opacity: status.wifi >= 2 ? 1 : 0.2, strokeWidth: "8", d: "M11.8 24.6a22 22 0 0 1 29.4 0" }), _jsx("path", { opacity: status.wifi >= 1 ? 1 : 0.2, fill: "currentColor", strokeWidth: "2.4", d: "M26.5 39.6 18.8 31.9a10.8 10.8 0 0 1 15.4 0Z" })] }) })) : (status.carrier && _jsx("span", { className: "tm-network", children: status.carrier })), _jsxs("span", { className: "tm-battery", "data-low": status.battery <= 20 || undefined, "data-charging": status.charging || undefined, children: [_jsx("i", { style: { width: `${status.battery}%` } }), status.charging && _jsx("b", { children: "\u03DF" })] })] })] }));
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
    if (scene.platform === "google-messages") {
        const stamp = message.timestamp ? `${message.timestamp} · ` : "";
        if (message.status === "read")
            return `${stamp}Read`;
        if (message.status === "failed")
            return "Not sent";
        if (message.status === "sending")
            return "Sending…";
        return `${stamp}${message.status === "delivered" ? "Delivered" : "Sent"}`;
    }
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
    if (sceneOs(scene) === "android")
        return _jsx(AndroidHeader, { slots: slots, scene: scene, person: person });
    const avatar = _jsx(ConversationAvatar, { slots: slots, scene: scene, person: person });
    const reply = platform === "imessage" && scene.composer.context?.mode === "reply";
    const control = (kind) => scene.header?.[kind] ?? "enabled";
    const disabled = (kind) => control(kind) === "disabled" ||
        scene.composer.context?.mode === "recording";
    const mute = scene.conversation?.muted ? _jsx(NativeIcon, { name: "muted" }) : null;
    const back = (_jsxs("span", { className: "tm-nav-back", style: reply ? { visibility: "hidden" } : undefined, children: [platform === "imessage" ? (_jsx("svg", { width: "44", height: "44", viewBox: "0 0 44 44", children: _jsx("path", { d: "M24.2 14.2 16.7 22.2 24.2 30.2", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }) })) : (_jsx(Glyph, { name: "back", size: 24 })), !!scene.header?.backCount && (_jsx("small", { className: "tm-back-count", children: scene.header.backCount > 999 ? "999+" : scene.header.backCount }))] }));
    if (platform === "instagram")
        return (_jsxs("div", { className: "tm-phone-header", "aria-hidden": "true", children: [back, avatar, _jsxs("span", { className: "tm-contact-title", children: [_jsxs("strong", { children: [_jsx(slots.Text, { field: "contact", value: scene.contact.name, children: scene.contact.name }), mute] }), subtitle && _jsx("small", { children: subtitle })] }), _jsxs("span", { className: "tm-nav-actions", children: [control("call") !== "hidden" && (_jsx("span", { "data-disabled": disabled("call") || undefined, children: _jsx(Glyph, { name: "phone", size: 23 }) })), control("video") !== "hidden" && (_jsx("span", { "data-disabled": disabled("video") || undefined, children: _jsx(Glyph, { name: "video", size: 25 }) }))] })] }));
    if (platform === "telegram")
        return (_jsxs("div", { className: "tm-phone-header", "aria-hidden": "true", children: [back, _jsxs("span", { className: "tm-contact-title", children: [_jsxs("strong", { children: [_jsx(slots.Text, { field: "contact", value: scene.contact.name, children: scene.contact.name }), mute] }), subtitle && _jsx("small", { children: subtitle })] }), avatar] }));
    return (_jsxs("div", { className: "tm-phone-header", "aria-hidden": "true", children: [back, platform === "imessage" ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "tm-im-contact", children: [avatar, _jsxs("span", { className: "tm-im-name", children: [_jsx(slots.Text, { field: "contact", value: scene.contact.name, children: scene.contact.name }), mute, _jsx("svg", { className: "tm-name-chevron", viewBox: "0 0 6 31.7", "aria-hidden": "true", children: _jsx("path", { d: "M1.5 10.4 3.9 16.4 1.5 22.4", fill: "none", stroke: "currentColor", strokeWidth: "2.6", strokeLinecap: "round", strokeLinejoin: "round" }) })] }), subtitle && (_jsx("span", { className: "tm-contact-subtitle", children: subtitle }))] }), reply ? (_jsx("span", { className: "tm-im-video", children: _jsx(Glyph, { name: "close", size: 23 }) })) : (control("video") !== "hidden" && (_jsx("span", { className: "tm-im-video", "data-disabled": disabled("video") || undefined, children: _jsx("svg", { width: "44", height: "44", viewBox: "0 0 44 44", children: _jsxs("g", { fill: "none", stroke: "currentColor", strokeWidth: "1.67", strokeLinejoin: "round", children: [_jsx("rect", { x: "10.17", y: "14.17", width: "17.33", height: "16.33", rx: "3.2" }), _jsx("path", { d: "M27.5 20.3 33.2 16.2c.6-.4 1.5 0 1.5.8v10.6c0 .8-.9 1.2-1.5.8l-5.7-4.1" })] }) }) })))] })) : (_jsxs(_Fragment, { children: [avatar, _jsxs("span", { className: "tm-contact-title", children: [_jsxs("strong", { children: [_jsx(slots.Text, { field: "contact", value: scene.contact.name, children: scene.contact.name }), mute] }), subtitle && _jsx("small", { children: subtitle })] }), _jsxs("span", { className: "tm-nav-actions", children: [control("video") !== "hidden" && (_jsx("span", { "data-disabled": disabled("video") || undefined, children: _jsx(Glyph, { name: "video", size: 25 }) })), control("call") !== "hidden" && (_jsx("span", { "data-disabled": disabled("call") || undefined, children: _jsx(Glyph, { name: "phone", size: 22 }) }))] })] }))] }));
}
/**
 * Android app bars: back arrow, avatar, name and subtitle, then Material action
 * icons. Each app keeps its own action order.
 */
function AndroidHeader({ slots, scene, person, }) {
    const platform = scene.platform;
    const group = isGroupConversation(scene);
    const members = conversationMembers(scene);
    const subtitle = scene.contact.subtitle ||
        (group && platform === "telegram"
            ? `${members.length} members`
            : group && platform === "whatsapp"
                ? members.map((p) => (p.isSelf ? "You" : p.name)).join(", ")
                : "");
    const control = (kind) => scene.header?.[kind] ?? "enabled";
    const disabled = (kind) => control(kind) === "disabled" ||
        scene.composer.context?.mode === "recording";
    const mute = scene.conversation?.muted ? (_jsx(MatIcon, { name: "notifications_off", size: 17 })) : null;
    const action = (name) => {
        if (name === "menu")
            return (_jsx("span", { className: "tm-nav-action", children: _jsx(MatIcon, { name: "more_vert", size: 22 }) }, "menu"));
        if (control(name) === "hidden")
            return null;
        return (_jsx("span", { className: "tm-nav-action", "data-disabled": disabled(name) || undefined, children: _jsx(MatIcon, { name: name === "call" ? "call" : "videocam", size: 23 }) }, name));
    };
    const actions = platform === "google-messages"
        ? [action("call"), action("video"), action("menu")]
        : platform === "whatsapp"
            ? [action("video"), action("call"), action("menu")]
            : platform === "telegram"
                ? [action("call"), action("menu")]
                : [action("call"), action("video")];
    return (_jsxs("div", { className: "tm-phone-header", "aria-hidden": "true", children: [_jsxs("span", { className: "tm-nav-back", children: [_jsx(MatIcon, { name: "arrow_back", size: 24 }), !!scene.header?.backCount && (_jsx("small", { className: "tm-back-count", children: scene.header.backCount > 999 ? "999+" : scene.header.backCount }))] }), _jsx(ConversationAvatar, { slots: slots, scene: scene, person: person }), _jsxs("span", { className: "tm-contact-title", children: [_jsxs("strong", { children: [_jsx(slots.Text, { field: "contact", value: scene.contact.name, children: scene.contact.name }), mute] }), subtitle && _jsx("small", { children: subtitle })] }), _jsx("span", { className: "tm-nav-actions", children: actions })] }));
}
/** Google Messages delivery: a circular indicator at the bubble's corner. */
function GoogleReceipt({ status }) {
    return (_jsx("span", { className: "tm-gm-receipt", "data-status": status, "aria-hidden": "true", children: status === "failed" ? (_jsx("b", { children: "!" })) : (_jsx(MatIcon, { name: status === "sending" ? "schedule" : status === "sent" ? "check" : "done_all", size: 11 })) }));
}
/** iMessage sets the day in semibold before the time: "**Today** 9:41 AM". */
function DateLabel({ label, platform, }) {
    const split = platform === "imessage"
        ? /^(.+?)((?: at)? \d{1,2}:\d{2}(?:\s?[AP]M)?)$/i.exec(label)
        : null;
    if (!split)
        return _jsx("span", { children: label });
    return (_jsxs("span", { children: [_jsx("b", { children: split[1] }), split[2].replace(/\s([AP]M)$/i, "\u202f$1")] }));
}
/** iMessage sets the time after a receipt in regular weight: "**Read** 11:38 AM". */
function ReceiptLabel({ label, platform, }) {
    const split = platform === "imessage"
        ? /^(.+?)( \d{1,2}:\d{2}(?:\s?[AP]M)?)$/i.exec(label)
        : null;
    if (!split)
        return _jsx(_Fragment, { children: label });
    return (_jsxs(_Fragment, { children: [split[1], _jsx("span", { children: split[2].replace(/\s([AP]M)$/i, "\u202f$1") })] }));
}
/** Emoji, stickers, photos, and Send Later messages do not have a filled bubble. */
function BubblePaint({ platform, message, }) {
    if (platform !== "imessage" ||
        message.scheduledAt ||
        ["image", "video", "sticker"].includes(message.kind) ||
        (message.kind === "text" && emojiOnly(message.text)))
        return null;
    return (_jsx("span", { className: "tm-bubble-paint", "aria-hidden": "true", children: _jsx("span", { className: "tm-paint" }) }));
}
function BubbleTail({ platform, scheduled = false }) {
    if (platform === "imessage" && scheduled)
        return _jsx(GhostTail, { scheduled: true });
    return platform === "imessage" ? (_jsx("span", { className: "tm-tail", "aria-hidden": "true", children: _jsx("span", { className: "tm-paint" }) })) : (_jsx("svg", { className: "tm-tail", viewBox: "0 0 12 14", "aria-hidden": "true", children: _jsx("path", { d: "M0 0h12v14C7 13 2 8 0 0Z" }) }));
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
function MessageContent({ slots, message, scene, time, tail = false, }) {
    let content = null;
    const media = message.media;
    if (scene.platform === "imessage" && message.gallery)
        content = _jsx(ImGallery, { slots: slots, gallery: message.gallery });
    else if (scene.platform === "imessage" &&
        (message.kind === "image" || message.kind === "video")) {
        const outgoing = scene.participants.some((person) => person.isSelf && person.id === message.senderId);
        const [width, height] = mediaBox(media?.width ?? 4, media?.height ?? 3);
        content = (_jsxs("div", { className: "tm-media tm-im-media tm-bubble-content", style: {
                width,
                height,
                clipPath: `path("${mediaClip(width, height, outgoing ? "out" : "in", tail)}")`,
            }, children: [message.kind === "video" && media?.videoUrl ? (_jsx(slots.Video, { src: media.videoUrl, playhead: media.playhead, width: media.width, height: media.height, poster: media.poster ?? media.url })) : media?.url || media?.poster ? (_jsx(slots.Image, { src: message.kind === "video"
                        ? (media?.poster ?? media?.url)
                        : media?.url, alt: media?.alt ?? "", referrerPolicy: "no-referrer", draggable: false })) : (_jsx(Landscape, {})), message.kind === "video" && !media?.playing && _jsx(ImPlay, { size: 32 })] }));
    }
    else if (message.kind === "image" || message.kind === "video")
        content = (_jsxs("div", { className: "tm-media tm-bubble-content", style: { aspectRatio: `${media?.width ?? 4} / ${media?.height ?? 3}` }, children: [message.kind === "video" && media?.videoUrl ? (_jsx(slots.Video, { src: media.videoUrl, playhead: media.playhead, width: media.width, height: media.height, poster: media.poster ?? media.url })) : media?.url || media?.poster ? (_jsx(slots.Image, { src: message.kind === "video"
                        ? (media?.poster ?? media?.url)
                        : media?.url, alt: media?.alt ?? "", referrerPolicy: "no-referrer", draggable: false })) : (_jsx(Landscape, {})), message.kind === "video" && (_jsxs(_Fragment, { children: [!media?.playing && (_jsx("span", { className: "tm-media-play", children: _jsx(Glyph, { name: "play", size: 29 }) })), _jsx("span", { className: "tm-media-duration", children: duration(media?.duration ?? 0) })] }))] }));
    if (message.kind === "voice")
        content = _jsx(VoiceMessage, { slots: slots, message: message, scene: scene });
    if (message.kind === "file")
        content = (_jsxs("div", { className: "tm-file tm-bubble-content", children: [_jsx("span", { className: "tm-file-icon", children: _jsx(Glyph, { name: "file", size: 28 }) }), _jsxs("span", { children: [_jsx("strong", { children: message.file?.name }), _jsxs("small", { children: [formatBytes(message.file?.size ?? 0), " \u00B7", " ", message.file?.mimeType.split("/").at(-1)?.toUpperCase()] })] }), _jsx(Glyph, { name: "download", size: 20 })] }));
    if (message.kind === "link" &&
        scene.platform === "imessage" &&
        message.link?.icon &&
        !message.link.image &&
        message.link.description)
        // A text post (an X post, say): its words, then the author under a small picture.
        content = (_jsxs("div", { className: "tm-link-post tm-bubble-content", children: [_jsx("p", { children: message.link.description }), _jsxs("div", { children: [_jsx(slots.Image, { src: message.link.icon, alt: "", referrerPolicy: "no-referrer" }), _jsxs("span", { children: [_jsx("strong", { children: message.link.title }), _jsx("small", { children: safeHostname(message.link.url) })] })] })] }));
    else if (message.kind === "link" &&
        scene.platform === "imessage" &&
        message.link?.icon &&
        !message.link.image)
        content = (_jsxs("div", { className: "tm-link-compact tm-bubble-content", children: [_jsx(slots.Image, { src: message.link.icon, alt: "", referrerPolicy: "no-referrer" }), _jsxs("span", { children: [_jsx("strong", { children: message.link.title }), _jsx("small", { children: safeHostname(message.link.url) })] })] }));
    else if (message.kind === "link")
        content = (_jsxs("div", { className: "tm-link-card tm-bubble-content", children: [message.link?.image ? (_jsx(slots.Image, { src: message.link.image, alt: "", referrerPolicy: "no-referrer" })) : (_jsxs("div", { className: "tm-link-art", children: [_jsx("span", { children: "\u2197" }), _jsx("span", { children: safeHostname(message.link?.url) })] })), _jsxs("div", { children: [_jsx("strong", { children: message.link?.title }), message.link?.description && _jsx("p", { children: message.link.description }), _jsx("small", { children: safeHostname(message.link?.url) })] })] }));
    if (message.kind === "location")
        content = (_jsxs("div", { className: "tm-location tm-bubble-content", children: [_jsxs("div", { className: "tm-map", children: [_jsx("i", {}), _jsx("i", {}), _jsx("i", {}), _jsx("span", { children: _jsx(Glyph, { name: "pin", size: 29 }) })] }), _jsx("strong", { children: message.location?.label }), _jsx("small", { children: message.location?.address ||
                        `${message.location?.latitude}, ${message.location?.longitude}` })] }));
    if (message.kind === "contact")
        content = (_jsxs("div", { className: "tm-contact-card tm-bubble-content", children: [_jsx(Avatar, { slots: slots, name: message.sharedContact?.name ?? "Contact", url: message.sharedContact?.avatar }), _jsx("strong", { children: message.sharedContact?.name }), _jsx("small", { children: message.sharedContact?.phone }), _jsx("span", { children: "Contact card" })] }));
    if (message.kind === "sticker")
        content = message.sticker?.url ? (_jsx(slots.Image, { className: "tm-sticker tm-bubble-content", src: message.sticker.url, alt: message.sticker.alt, referrerPolicy: "no-referrer" })) : (_jsx("span", { className: "tm-sticker-emoji tm-bubble-content", children: message.sticker?.emoji }));
    if (message.kind === "poll")
        content = (_jsxs("div", { className: "tm-poll tm-bubble-content", children: [_jsx("strong", { children: message.poll?.question }), _jsx("small", { children: "Poll" }), message.poll?.options.map((option) => (_jsxs("div", { className: "tm-poll-option", children: [_jsx("i", { style: {
                                width: `${clamp(option.votes / Math.max(1, message.poll?.totalVotes ?? 1)) * 100}%`,
                            } }), _jsx("span", { children: option.text }), _jsxs("b", { children: [Math.round(clamp(option.votes / Math.max(1, message.poll?.totalVotes ?? 1)) * 100), "%"] })] }, option.id))), _jsxs("small", { children: [message.poll?.totalVotes, " votes"] })] }));
    if (message.kind === "payment")
        content = (_jsxs("div", { className: "tm-payment tm-bubble-content", children: [_jsx("span", { children: scene.platform === "imessage" ? "Cash" : "Payment" }), _jsx("strong", { children: new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: message.payment?.currency ?? "USD",
                        maximumFractionDigits: 2,
                    }).format(message.payment?.amount ?? 0) }), message.payment?.note && _jsx("small", { children: message.payment.note })] }));
    return (_jsxs(_Fragment, { children: [content, message.text && (_jsxs("span", { className: "tm-bubble-text", "data-ink": message.effect === "invisible-ink" || undefined, style: message.effect === "invisible-ink"
                    ? {
                        backgroundPosition: `${Math.round(time * 19)}px ${Math.round(time * 11)}px`,
                    }
                    : undefined, children: [_jsx(slots.Text, { field: "message", messageId: message.id, value: message.text, children: message.textRuns ? (_jsx(FormattedText, { runs: message.textRuns, time: Math.max(0, time - message.at) })) : (_jsx(EmojiText, { text: message.text })) }), message.text.endsWith("\n") && "\u200b"] }))] }));
}
// Emoji, or a clock time that a phone would detect and underline.
const EMOJI = /((?:\p{Extended_Pictographic}|\p{Regional_Indicator}{2})(?:\uFE0F|\p{Emoji_Modifier}|\u200D\p{Extended_Pictographic}\uFE0F?)*)|(?<![\d:])(?:[01]?\d|2[0-3]):[0-5]\d(?: ?[AaPp]\.?[Mm]\.?)?(?![\d:])/gu;
/** Emoji inside text, set apart so a platform can draw them at its own size, and detected times. */
function EmojiText({ text }) {
    const parts = [];
    let index = 0;
    for (const match of text.matchAll(EMOJI)) {
        if (match.index > index)
            parts.push(text.slice(index, match.index));
        parts.push(_jsx("span", { className: match[1] ? "tm-emoji" : "tm-detected", children: match[0] }, match.index));
        index = match.index + match[0].length;
    }
    if (!parts.length)
        return text;
    if (index < text.length)
        parts.push(text.slice(index));
    return _jsx(_Fragment, { children: parts });
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
    return (_jsxs("div", { className: "tm-reactions", "data-count": message.reactions.length, role: "img", "aria-label": `Reactions — ${label}`, title: label, children: [groups.slice(0, 3).map((group, index) => scene.platform === "imessage" ? (_jsxs("span", { className: "tm-reaction tm-tapback", style: { zIndex: 3 - index }, "data-self": group.self || undefined, "data-tapback": TAPBACKS[group.emoji], children: [_jsx("i", { className: "tm-tapback-ring" }), _jsx("i", { className: "tm-tapback-shape", children: _jsx("i", { className: "tm-paint" }) }), _jsx("span", { className: "tm-tapback-glyph", children: _jsx(TapbackSymbol, { emoji: group.emoji }) }), group.names.length > 1 && (_jsx("b", { className: "tm-reaction-count", children: group.names.length }))] }, group.emoji)) : (_jsx("span", { className: "tm-reaction", style: { zIndex: index + 1 }, "data-self": group.self || undefined, children: _jsxs("span", { children: [group.emoji, group.names.length > 1 && (_jsx("b", { className: "tm-reaction-count", children: group.names.length }))] }) }, group.emoji))), overflow > 0 && (_jsxs("span", { className: "tm-reaction tm-reaction-count", title: groups
                    .slice(3)
                    .map((group) => `${group.emoji}: ${group.names.join(", ")}`)
                    .join("; "), children: ["+", overflow] }))] }));
}
/** The hook that threads a reply: from the middle of the original down to the reply. */
function ReplyHook({ from, to, drop, offset, }) {
    // 14pt in from the reply's edge; across the thread when the original sits on the other side.
    const inset = 14 + offset;
    const across = `calc(var(--tm-thread-w) - ${inset + 36}px)`;
    return (_jsx("i", { className: "tm-reply-hook", "data-to": to, "aria-hidden": "true", style: {
            bottom: -drop,
            left: to === "in" ? (from === "in" ? inset : undefined) : from === "in" ? across : undefined,
            right: to === "out" ? (from === "out" ? inset : undefined) : from === "out" ? across : undefined,
        } }));
}
// iOS 26 media, measured on the 17 Pro Max: a single photo or video fits 291.67 x 332.33pt.
const MEDIA_MAX = [291.67, 332.33];
function mediaBox(width, height, [maxWidth, maxHeight] = MEDIA_MAX) {
    const aspect = width / height;
    const w = Math.min(maxWidth, maxHeight * aspect);
    return [Math.round(w * 100) / 100, Math.round((w / aspect) * 100) / 100];
}
const TAIL_START = [13.67, 0];
const TAIL = [
    [[13.67, 6.6]],
    [[13.67, 8.4], [15.1, 9.4], [15.65, 10.4]],
    [[16.05, 11.2], [15.5, 11.85], [14.6, 11.85]],
    [[13.9, 11.85], [13.3, 11.6], [12.7, 11.2]],
    [[4.4, 5.6]],
    [[3.8, 5.2], [3.4, 5], [2.6, 5]],
    [[0, 5]],
    [[0, 0]],
];
/** A rounded rectangle joined to the tail, so a photo runs into the tail like a bubble. */
function mediaClip(w, h, side, tail) {
    const r = 20;
    const n = (value) => Math.round(value * 100) / 100;
    const rect = `M${r} 0H${n(w - r)}A${r} ${r} 0 0 1 ${n(w)} ${r}V${n(h - r)}A${r} ${r} 0 0 1 ${n(w - r)} ${n(h)}H${r}A${r} ${r} 0 0 1 0 ${n(h - r)}V${r}A${r} ${r} 0 0 1 ${r} 0Z`;
    if (!tail)
        return rect;
    const at = ([x, y]) => `${n(side === "out" ? w - 24 + x : 24 - x)} ${n(h - 5 + y)}`;
    let start = TAIL_START;
    let segments = TAIL;
    if (side === "in") {
        // Mirroring flips the winding; walk the outline backwards so the shapes still unite.
        const ends = [TAIL_START, ...TAIL.map((segment) => segment.at(-1))];
        start = ends.at(-1);
        segments = TAIL.map((segment, index) => segment.length === 3
            ? [segment[1], segment[0], ends[index]]
            : [ends[index]]).reverse();
    }
    const path = segments
        .map((segment) => `${segment.length === 3 ? "C" : "L"}${segment.map(at).join(" ")}`)
        .join("");
    return `${rect}M${at(start)}${path}Z`;
}
/** The play button on a paused video: frosted glass with the triangle knocked out. */
function ImPlay({ size }) {
    return (_jsx("span", { className: "tm-im-play", "data-size": size > 36 ? "large" : undefined, "aria-hidden": "true", children: _jsx("i", {}) }));
}
/** iOS 26 groups photos sent together: a few stagger down the thread, many stack. */
function ImGallery({ slots, gallery, }) {
    const count = gallery.count ?? gallery.items.length;
    const picture = (item) => item.url ? (_jsx(slots.Image, { src: item.url, alt: "", referrerPolicy: "no-referrer", draggable: false })) : (_jsx(Landscape, {}));
    if (count > 4) {
        const [front, ...rest] = gallery.items;
        const [width, height] = mediaBox(front.width, front.height);
        return (_jsxs("div", { className: "tm-im-deck tm-bubble-content", children: [_jsxs("div", { className: "tm-im-deck-label", children: [_jsxs("svg", { width: "10.33", height: "10", viewBox: "0 0 10.33 10", "aria-hidden": "true", children: [_jsx("rect", { x: "0", y: "0", width: "4.67", height: "4.5", rx: "1.2" }), _jsx("rect", { x: "5.67", y: "0", width: "4.67", height: "4.5", rx: "1.2" }), _jsx("rect", { x: "0", y: "5.5", width: "4.67", height: "4.5", rx: "1.2" }), _jsx("rect", { x: "5.67", y: "5.5", width: "4.67", height: "4.5", rx: "1.2" })] }), _jsxs("b", { children: [count, " Items"] }), gallery.saved && " Saved"] }), _jsxs("div", { className: "tm-im-deck-cards", style: { width, height }, children: [[3, 2, 1].map((depth) => {
                            const item = rest[depth - 1] ?? front;
                            return (_jsx("div", { className: "tm-im-card", "data-depth": depth, children: picture(item) }, depth));
                        }), _jsxs("div", { className: "tm-im-card", children: [picture(front), front.video && _jsx(ImPlay, { size: 42 })] })] })] }));
    }
    return (_jsxs("div", { className: "tm-im-collage tm-bubble-content", children: [gallery.items.slice(0, 4).map((item, index) => {
                const [width, height] = mediaBox(item.width, item.height, [220.67, 229]);
                return (_jsxs("div", { className: "tm-im-card", "data-at": index % 2 ? "start" : "end", 
                    // Each photo tucks under the one above, a taller one further.
                    style: {
                        width,
                        height,
                        marginTop: index ? -Math.round(Math.max(8, height * 0.173 - 14.9) * 3) / 3 : 0,
                    }, children: [picture(item), item.video && _jsx(ImPlay, { size: 32 }), item.live && _jsx(ImLive, {})] }, index));
            }), !gallery.saved && (_jsx("span", { className: "tm-im-save", "aria-hidden": "true", children: _jsx("svg", { width: "16", height: "17", viewBox: "0 0 16 17", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M5 5.5H3.5a2 2 0 0 0-2 2v6.5a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7.5a2 2 0 0 0-2-2H11M8 1v9.5M5 7.5l3 3 3-3" }) }) }))] }));
}
/** The Live Photo badge: a dot inside a solid ring inside a dotted ring. */
function ImLive() {
    return (_jsxs("svg", { className: "tm-im-live", width: "20", height: "20", viewBox: "0 0 20 20", fill: "none", stroke: "#fff", "aria-hidden": "true", children: [_jsx("circle", { cx: "10", cy: "10", r: "2.4", fill: "#fff", stroke: "none" }), _jsx("circle", { cx: "10", cy: "10", r: "5.1", strokeWidth: "1.7" }), _jsx("circle", { cx: "10", cy: "10", r: "8.8", strokeWidth: "1.25", strokeDasharray: "0.1 1.85", strokeLinecap: "round" })] }));
}
/** iOS 26 message bar icons, traced from iPhone 17 Pro Max screenshots. */
function ComposerIcon({ name }) {
    return name === "plus" ? (_jsx("svg", { className: "tm-im-plus", width: "16", height: "16", viewBox: "-8 -8 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.67", strokeLinecap: "round", "aria-hidden": "true", children: _jsx("path", { d: "M0-6.83v13.66M-6.83 0h13.66" }) })) : (_jsxs("svg", { className: "tm-im-mic", width: "14", height: "20", viewBox: "-7 0 14 20", fill: "none", stroke: "currentColor", strokeWidth: "1.4", strokeLinecap: "round", "aria-hidden": "true", children: [_jsx("rect", { x: "-2.83", y: "0.7", width: "5.66", height: "11.6", rx: "2.83" }), _jsx("path", { d: "M-6 8v1.17a6 6 0 0 0 12 0V8M0 15.17v3.66M-4.67 18.83h9.34" })] }));
}
function GhostTail({ scheduled = false }) {
    return (_jsxs("svg", { className: `tm-ghost-tail${scheduled ? " tm-scheduled-tail" : ""}`, viewBox: "0 0 24 12", "aria-hidden": "true", children: [_jsx("path", { d: "M13.67 0V6.6C13.67 8.4 15.1 9.4 15.65 10.4 16.05 11.2 15.5 11.85 14.6 11.85 13.9 11.85 13.3 11.6 12.7 11.2L4.4 5.6C3.8 5.2 3.4 5 2.6 5H0V0Z", fill: "var(--tm-screen)" }), _jsx("path", { d: "M13.67 2.4V6.6C13.67 8.4 15.1 9.4 15.65 10.4 16.05 11.2 15.5 11.85 14.6 11.85 13.9 11.85 13.3 11.6 12.7 11.2L4.4 5.6C3.8 5.2 3.4 5 2.6 5", fill: "none", stroke: "currentColor", strokeDasharray: scheduled ? "4 4" : undefined })] }));
}
/** Classic tapbacks mix native emoji with colored puffy symbols; other emoji stay native. */
const TAPBACKS = {
    "❤️": "heart",
    "❤": "heart",
    "👍": "like",
    "👎": "dislike",
    // iOS 26 draws the HA HA tapback apart from a 😂 emoji tapback, which draws as itself.
    HAHA: "haha",
    "‼️": "emphasize",
    "‼": "emphasize",
    "❓": "question",
};
function TapbackSymbol({ emoji }) {
    const kind = TAPBACKS[emoji];
    return kind ? _jsx(TapbackGlyph, { kind: kind }) : emoji;
}
function TapbackGlyph({ kind }) {
    if (kind === "heart")
        return (_jsxs("svg", { viewBox: "0 0 56 49", width: "18.7", height: "16.3", "aria-hidden": "true", children: [_jsxs("defs", { children: [_jsxs("radialGradient", { id: "tm-heart-body", cx: "0.5", cy: "0.32", r: "0.72", children: [_jsx("stop", { offset: "0", stopColor: "#ffc3dc" }), _jsx("stop", { offset: "0.45", stopColor: "#ff92c4" }), _jsx("stop", { offset: "1", stopColor: "#ff4f9f" })] }), _jsxs("radialGradient", { id: "tm-heart-shine", cx: "0.5", cy: "0.5", r: "0.5", children: [_jsx("stop", { offset: "0", stopColor: "#fff", stopOpacity: "0.5" }), _jsx("stop", { offset: "1", stopColor: "#fff", stopOpacity: "0" })] })] }), _jsx("path", { d: "M28 48.2C21.6 43.4 1.4 30.6 1.4 15.4 1.4 7 7.4 1 15.2 1c5.8 0 10.2 3.2 12.8 7.6C30.6 4.2 35 1 40.8 1 48.6 1 54.6 7 54.6 15.4c0 15.2-20.2 28-26.6 32.8Z", fill: "url(#tm-heart-body)" }), _jsx("ellipse", { cx: "16", cy: "9.5", rx: "9", ry: "6", fill: "url(#tm-heart-shine)" }), _jsx("ellipse", { cx: "40", cy: "9.5", rx: "9", ry: "6", fill: "url(#tm-heart-shine)" }), _jsx("ellipse", { cx: "28", cy: "15", rx: "7", ry: "5", fill: "url(#tm-heart-shine)" })] }));
    if (kind === "like" || kind === "dislike")
        return kind === "like" ? "👍" : "👎";
    // iOS 26's question, emphasis and HA HA keep their own colored puff palettes.
    const strokes = {
        haha: [
            "0 0 20 19",
            "M2.2 2.4v6.4M7.2 2.4v6.4M2.2 5.5h5M10.2 8.8l2.5-5.9a.9.9 0 0 1 1.6 0l2.5 5.9M11.1 6.7h4.8M4.4 11.9v5M8.3 11.9v5M4.4 14.3h3.9M10.4 16.9l2-4.5a.7.7 0 0 1 1.3 0l2 4.5M11.1 15.3h3.9",
            3.3,
        ],
        emphasize: [
            "0 0 14 20",
            "M3.6 2.6 3.3 12M10.6 2.6 10.3 12M3.3 17.2h.01M10.3 17.2h.01",
            3.8,
        ],
        question: [
            "0 0 13 20",
            "M2.6 5.4C2.6 3.2 4.3 1.8 6.5 1.8s3.8 1.3 3.8 3.3c0 2.7-3.8 3.1-3.8 6.4M6.5 17.2h.01",
            3.8,
        ],
    };
    const [viewBox, d, width] = strokes[kind];
    const [, , boxWidth, boxHeight] = viewBox.split(" ").map(Number);
    return (_jsx("svg", { viewBox: viewBox, width: boxWidth, height: boxHeight, "aria-hidden": "true", children: _jsxs("g", { fill: "none", strokeLinecap: "round", strokeLinejoin: "round", children: [_jsx("path", { d: d, stroke: "var(--tm-puff-edge, currentColor)", strokeWidth: width + 0.7 }), _jsx("path", { d: d, stroke: "var(--tm-puff-body, currentColor)", strokeWidth: width }), _jsx("path", { d: d, stroke: "var(--tm-puff-hi, currentColor)", strokeWidth: width * 0.5, transform: "translate(-0.3 -0.4)" })] }) }));
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
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "tm-voice tm-bubble-content", "data-wa": scene.platform === "whatsapp" || undefined, "data-playing": media.playing || undefined, children: [_jsx("span", { className: "tm-voice-play", children: _jsx(Glyph, { name: media.playing ? "pause" : "play", size: scene.platform === "imessage" ? 19 : 24 }) }), _jsxs("div", { className: "tm-voice-track", children: [_jsxs("div", { className: "tm-waveform", children: [waveform.map((height, index) => (_jsx("i", { "data-played": index / waveform.length < progress || undefined, style: { height: 3 + height * 24 } }, index))), scene.platform === "whatsapp" && (_jsx("b", { className: "tm-voice-thumb", style: { left: `${progress * 100}%` } }))] }), scene.platform === "whatsapp" && (_jsx("span", { className: "tm-voice-duration", children: clock }))] }), scene.platform === "whatsapp" ? (_jsxs("span", { className: "tm-voice-avatar", children: [_jsx(Avatar, { slots: slots, name: person.name, url: person.avatar, color: person.color }), _jsx(Glyph, { name: "mic", size: 18 })] })) : (_jsx("span", { className: "tm-voice-duration", children: clock })), media.playbackRate !== 1 && (_jsxs("span", { className: "tm-voice-rate", children: [media.playbackRate, "\u00D7"] }))] }), media.transcript && (_jsx("span", { className: "tm-audio-transcript tm-bubble-content", children: media.transcript }))] }));
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
    return (_jsx("svg", { className: "tm-native-icon", width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.7", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: name === "moon" ? (_jsx("path", { fill: "currentColor", stroke: "none", d: "M19.7 15A7.3 7.3 0 0 1 9 4.3 8.5 8.5 0 1 0 19.7 15Z" })) : name === "muted" ? (_jsx(_Fragment, { children: _jsx("path", { d: "M7 6a6 6 0 0 1 11 3v5l2 4H4l2-4V9M10 21h4M3 3l18 18" }) })) : name === "pin" ? (_jsx("path", { d: "m9 3 8 3-3 4 1 6-5-2-5-1 4-4V3Zm1 11-4 8" })) : name === "edit" ? (_jsx("path", { d: "m15 3 6 6-12 12H3v-6L15 3Zm-10 13 3 3M12 6l6 6" })) : name === "reply" ? (_jsx("path", { d: "m10 5-7 6 7 6v-4c5-1 8 1 11 6 0-8-4-11-11-10V5Z" })) : (_jsx(_Fragment, { children: _jsx("path", { d: "M4 6h16M9 3h6M6 6l1 15h10l1-15M10 10v7M14 10v7" }) })) }));
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
        const link = scene.platform === "imessage" && message.link?.tint ? linkColors(message.link.tint, scene) : undefined;
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
                                    .reduce((total, group) => total + group.names.length, 0)] }))] })), _jsxs("div", { className: "tm-message-context", "data-side": outgoing ? "out" : "in", children: [_jsxs("div", { className: "tm-tapback-picker", children: [picker.emojis.map((emoji, index) => (_jsx("span", { "data-picked": picker.selectedEmoji === emoji || undefined, "data-tapback": scene.platform === "imessage" ? TAPBACKS[emoji] : undefined, children: scene.platform === "imessage" ? (_jsx("span", { className: "tm-tapback-glyph", children: _jsx(TapbackSymbol, { emoji: emoji }) })) : emoji }, index))), _jsx(Glyph, { name: "plus", size: 19 })] }), _jsxs("div", { className: "tm-bubble", "data-side": outgoing ? "out" : "in", "data-kind": message.kind, "data-tail": scene.platform === "imessage" || undefined, "data-emoji": (scene.platform === "imessage" && message.kind === "text" && emojiOnly(message.text)) || undefined, "data-scheduled": (scene.platform === "imessage" && !!message.scheduledAt) || undefined, "data-tint": link?.tone, style: link ? css({ "--tm-link-tint": message.link?.tint, "--tm-link-surface": link.surface, "--tm-link-domain": link.domain }) : undefined, children: [_jsx(BubblePaint, { platform: scene.platform, message: message }), scene.platform === "imessage" &&
                                    message.kind !== "sticker" &&
                                    !emojiOnly(message.text) && (_jsx(BubbleTail, { platform: scene.platform, scheduled: !!message.scheduledAt })), _jsx(MessageContent, { slots: slots, message: message, scene: scene, time: time, tail: true })] }), picker.showMenu && (_jsxs("div", { className: "tm-message-menu", children: [_jsxs("span", { children: ["Reply", _jsx(NativeIcon, { name: "reply" })] }), scene.platform === "imessage" && (_jsxs("span", { children: ["Add Sticker", _jsx(Glyph, { name: "sticker", size: 17 })] })), _jsxs("span", { children: ["Copy", _jsx(Glyph, { name: "file", size: 17 })] }), outgoing && (_jsxs("span", { children: ["Edit", _jsx(NativeIcon, { name: "edit" })] })), _jsxs("span", { children: ["More\u2026", _jsx(Glyph, { name: "more", size: 17 })] })] }))] })] }));
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
    if (sceneOs(scene) === "android")
        return _jsx(AndroidComposer, { scene: scene, time: time });
    return (_jsxs("div", { className: "tm-composer-wrap", "data-mode": mode, "aria-hidden": "true", children: [scene.platform !== "imessage" &&
                (mode === "reply" || mode === "edit") && (_jsxs("div", { className: "tm-compose-context", children: [_jsx(NativeIcon, { name: mode === "edit" ? "edit" : "reply" }), _jsxs("div", { children: [_jsx("strong", { children: mode === "edit" ? "Edit Message" : (person?.name ?? "Reply") }), _jsx("span", { children: referenced?.text || referenced?.kind })] }), _jsx(Glyph, { name: "close", size: 18 })] })), _jsxs("div", { className: "tm-composer", "data-native-edit": nativeEdit || undefined, children: [_jsx("span", { className: "tm-add", children: scene.platform === "imessage" ? (_jsx(ComposerIcon, { name: "plus" })) : (_jsx(Glyph, { name: scene.platform === "telegram" ? "paperclip" : "plus", size: 24 })) }), _jsxs("div", { className: "tm-composer-field", "data-scheduled": mode === "scheduled" || undefined, children: [mode === "scheduled" && (_jsxs("div", { className: "tm-schedule-chip", children: [_jsx(Glyph, { name: "clock", size: 13 }), _jsx("span", { children: context?.scheduledAt }), _jsx(Glyph, { name: "chevron", size: 12 }), _jsx(Glyph, { name: "close", size: 15 })] })), _jsx("span", { className: hasText ? "tm-composer-text" : "tm-composer-placeholder", children: hasText ? (_jsx(ComposerText, { scene: scene, time: time })) : (_jsxs(_Fragment, { children: [placeholder, !nativeEdit && scene.composer.focused && (_jsx("i", { className: "tm-caret" }))] })) }), !hasText && scene.platform === "telegram" && (_jsx(Glyph, { name: "gift", size: 20 })), " ", !hasText &&
                                (scene.platform === "imessage" ? (_jsx(ComposerIcon, { name: "mic" })) : (_jsx(Glyph, { name: "sticker", size: 20 }))), " ", hasText && scene.platform === "imessage" && (_jsx("span", { className: "tm-send", children: _jsx(Glyph, { name: "arrow-up", size: 20 }) }))] }), scene.platform === "whatsapp" && !hasText && (_jsx("span", { className: "tm-composer-mic", "data-camera": true, children: _jsx(Glyph, { name: "camera", size: 22 }) })), scene.platform !== "imessage" && (_jsx("span", { className: hasText ? "tm-send" : "tm-composer-mic", children: _jsx(Glyph, { name: hasText
                                ? mode === "edit"
                                    ? "check"
                                    : scene.platform === "telegram" ||
                                        scene.platform === "whatsapp"
                                        ? "send"
                                        : "arrow-up"
                                : "mic", size: 22 }) }))] })] }));
}
/**
 * Android composers share a pill field plus a circular voice/send button;
 * each app arranges its own icons inside the field.
 */
function AndroidComposer({ scene, time }) {
    const context = scene.composer.context;
    const mode = context?.mode ?? "normal";
    const platform = scene.platform;
    const hasText = scene.composer.text.length > 0;
    const referenced = scene.messages.find((message) => message.id === context?.messageId);
    const person = scene.participants.find((participant) => participant.id === referenced?.senderId);
    const placeholder = platform === "google-messages"
        ? scene.header?.transport === "sms"
            ? "Text message"
            : scene.composer.placeholder === "iMessage" ||
                scene.header?.transport === "rcs"
                ? "RCS message"
                : scene.composer.placeholder
        : scene.composer.placeholder === "iMessage"
            ? "Message"
            : scene.composer.placeholder;
    return (_jsxs("div", { className: "tm-composer-wrap", "data-mode": mode, "aria-hidden": "true", children: [(mode === "reply" || mode === "edit") && (_jsxs("div", { className: "tm-compose-context", children: [_jsx(MatIcon, { name: mode === "edit" ? "close" : "reply", size: 20 }), _jsxs("div", { children: [_jsx("strong", { children: mode === "edit"
                                    ? "Edit message"
                                    : (person?.name ?? "Reply") }), _jsx("span", { children: referenced?.text || referenced?.kind })] }), _jsx(MatIcon, { name: "close", size: 20 })] })), _jsxs("div", { className: "tm-composer", children: [_jsxs("div", { className: "tm-composer-field", "data-scheduled": mode === "scheduled" || undefined, children: [mode === "scheduled" && (_jsxs("div", { className: "tm-schedule-chip", children: [_jsx(MatIcon, { name: "schedule", size: 14 }), _jsx("span", { children: context?.scheduledAt }), _jsx(MatIcon, { name: "close", size: 16 })] })), platform === "google-messages" && mode !== "scheduled" && (_jsx(MatIcon, { name: "add", size: 24, className: "tm-field-icon" })), (platform === "whatsapp" || platform === "telegram") && (_jsx(MatIcon, { name: "mood", size: 24, className: "tm-field-icon" })), _jsx("span", { className: hasText ? "tm-composer-text" : "tm-composer-placeholder", children: hasText ? (_jsx(ComposerText, { scene: scene, time: time })) : (_jsxs(_Fragment, { children: [placeholder, scene.composer.focused && _jsx("i", { className: "tm-caret" })] })) }), platform === "google-messages" && (_jsxs(_Fragment, { children: [_jsx(MatIcon, { name: "mood", size: 24, className: "tm-field-icon" }), !hasText && (_jsx(MatIcon, { name: "photo_library", size: 24, className: "tm-field-icon" }))] })), platform === "whatsapp" && !hasText && (_jsxs(_Fragment, { children: [_jsx(MatIcon, { name: "attach_file", size: 23, className: "tm-field-icon" }), _jsx(MatIcon, { name: "photo_camera", size: 23, className: "tm-field-icon" })] })), platform === "whatsapp" && hasText && (_jsx(MatIcon, { name: "photo_camera", size: 23, className: "tm-field-icon" })), platform === "telegram" && !hasText && (_jsx(MatIcon, { name: "attach_file", size: 23, className: "tm-field-icon" }))] }), _jsx("span", { className: hasText ? "tm-send" : "tm-composer-mic", children: _jsx(MatIcon, { name: hasText ? (mode === "edit" ? "check" : "send-fill") : "mic-fill", size: hasText ? 19 : 24 }) })] })] }));
}
function Keyboard({ scene }) {
    if (sceneOs(scene) === "android")
        return _jsx(AndroidKeyboard, { scene: scene });
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
    const x = p.offsetX + dx;
    const y = p.offsetY + (1 - spring) * 12;
    const scale = p.scale * (0.92 + 0.08 * spring) * effectScale;
    const opacity = p.opacity * Math.min(1, enter * 3);
    // A resting bubble has no transform, so iMessage's blue stays anchored to the screen.
    return {
        opacity: opacity === 1 ? undefined : opacity,
        transform: x === 0 && y === 0 && scale === 1 && rotate === 0
            ? undefined
            : `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotate}deg)`,
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
