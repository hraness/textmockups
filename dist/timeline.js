import { MAX_MESSAGES, isIntegerField, pointerSegments, readPointer, writePointer, } from "./pointer.js";
/** Exported so scrubbers, effects, and exporters share the exact same clock. */
export function sceneTime(scene, seconds) {
    const value = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
    const duration = scene.timeline.duration;
    // Preserve the exact end frame for an editor scrubber and one-shot export.
    return scene.timeline.loop && value > duration
        ? value % duration
        : Math.min(value, duration);
}
const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
const graphemes = (text) => Array.from(segmenter.segment(text), (part) => part.segment);
/** Prefix-preserving typing; replacements erase the old suffix before typing the new one. */
function typewriter(from, to, progress) {
    const previous = graphemes(from);
    const next = graphemes(to);
    let common = 0;
    while (common < Math.min(previous.length, next.length) &&
        previous[common] === next[common])
        common++;
    const deletions = previous.length - common;
    const additions = next.length - common;
    const steps = Math.floor((deletions + additions) * progress + 1e-9);
    return steps < deletions
        ? previous.slice(0, previous.length - steps).join("")
        : next.slice(0, common + steps - deletions).join("");
}
function interpolate(previous, next, time) {
    if (next.easing === "step")
        return previous.value;
    const raw = Math.max(0, Math.min(1, (time - previous.at) / (next.at - previous.at)));
    const progress = next.easing === "ease" ? raw * raw * (3 - 2 * raw) : raw;
    if (next.easing === "typewriter" &&
        typeof previous.value === "string" &&
        typeof next.value === "string")
        return typewriter(previous.value, next.value, progress);
    if (typeof previous.value === "number" && typeof next.value === "number")
        return previous.value + (next.value - previous.value) * progress;
    return previous.value;
}
function trackValue(initial, track, time, leftLimit = false) {
    let value = initial;
    let previous = { at: 0, value, easing: "step" };
    for (const frame of track?.keyframes ?? []) {
        if (time > frame.at ||
            (time === frame.at && !(leftLimit && frame.easing === "step"))) {
            value = frame.value;
            previous = frame;
            continue;
        }
        value = interpolate(previous, frame, time);
        break;
    }
    return value;
}
/** Integrate rate over active intervals; Simpson is exact for our linear/smoothstep curves. */
function mediaPlayhead(scene, index, time) {
    const message = scene.messages[index];
    const media = message.media;
    const rate = scene.timeline.tracks.find((track) => track.path === `/messages/${index}/media/playbackRate`);
    const playing = scene.timeline.tracks.find((track) => track.path === `/messages/${index}/media/playing`);
    const boundaries = [
        ...new Set([
            message.at,
            time,
            ...(rate?.keyframes.map((frame) => frame.at) ?? []),
            ...(playing?.keyframes.map((frame) => frame.at) ?? []),
        ]),
    ]
        .filter((at) => at >= message.at && at <= time)
        .sort((a, b) => a - b);
    let position = media.playhead ?? 0;
    for (let i = 1; i < boundaries.length; i++) {
        const start = boundaries[i - 1], end = boundaries[i], middle = (start + end) / 2;
        if (!trackValue(media.playing ?? false, playing, middle))
            continue;
        const first = trackValue(media.playbackRate ?? 1, rate, start);
        const mid = trackValue(media.playbackRate ?? 1, rate, middle);
        const last = trackValue(media.playbackRate ?? 1, rate, end, true);
        position += ((end - start) * (first + 4 * mid + last)) / 6;
    }
    return Math.max(0, position);
}
/** DOM selections use UTF-16 offsets; keep their range valid as a draft changes. */
function clampComposerSelection(scene) {
    const selection = scene.composer.selection;
    if (!selection)
        return;
    const length = scene.composer.text.length;
    const clamp = (value) => Math.max(0, Math.min(length, Number.isFinite(value) ? Math.trunc(value) : 0));
    selection.start = clamp(selection.start);
    selection.end = Math.max(selection.start, clamp(selection.end));
}
/**
 * Pure, deterministic evaluation. The caller validates foreign input with parseScene once.
 * Apply tracks before filtering so JSON pointer array indexes refer to the authored document.
 */
export function evaluateScene(scene, seconds) {
    const time = sceneTime(scene, seconds);
    const evaluated = structuredClone(scene);
    for (const track of scene.timeline.tracks) {
        let value = trackValue(readPointer(scene, track.path), track, time);
        // These fields are discrete counters/dimensions even during a numeric tween.
        if (typeof value === "number" && isIntegerField(track.path))
            value = Math.round(value);
        writePointer(evaluated, track.path, value);
    }
    clampComposerSelection(evaluated);
    evaluated.messages.forEach((message, index) => {
        if (message.textRuns)
            message.text = message.textRuns.map((run) => run.text).join("");
        if (message.stickers)
            message.stickers = message.stickers.filter((sticker) => sticker.at <= time);
        if (message.media) {
            const explicit = scene.timeline.tracks.some((track) => track.path === `/messages/${index}/media/playhead`);
            const playhead = explicit
                ? message.media.playhead
                : mediaPlayhead(scene, index, time);
            message.media.playhead = Math.max(0, Math.min(message.media.duration, playhead));
        }
    });
    evaluated.messages = evaluated.messages
        .filter((message) => message.at <= time)
        .map((message) => ({
        ...message,
        reactions: message.reactions.filter((reaction) => reaction.at <= time),
        ...(message.statusAt !== undefined && time < message.statusAt
            ? { status: "sent", statusText: "" }
            : {}),
    }));
    return evaluated;
}
/** Keep animation pointers attached to their authored IDs when an editor changes arrays. */
function remapPresentationPath(previous, next, path) {
    let before = previous;
    let after = next;
    const resolved = [];
    for (let segment of pointerSegments(path)) {
        if (!before ||
            !after ||
            typeof before !== "object" ||
            typeof after !== "object")
            return null;
        const original = segment;
        if (Array.isArray(before) && Array.isArray(after)) {
            const element = before[Number(segment)];
            if (element &&
                typeof element === "object" &&
                typeof element.id === "string") {
                const index = after.findIndex((candidate) => candidate &&
                    typeof candidate === "object" &&
                    candidate.id === element.id);
                if (index < 0)
                    return null;
                segment = String(index);
            }
        }
        if (!Object.hasOwn(before, original) || !Object.hasOwn(after, segment))
            return null;
        before = before[original];
        after = after[segment];
        resolved.push(segment.replace(/~/g, "~0").replace(/\//g, "~1"));
    }
    return "/" + resolved.join("/");
}
/**
 * Reconcile structural edits without rejecting an unfinished text/URL field mid-keystroke.
 * Export and sharing still validate the complete document with parseScene.
 */
export function reconcileSceneEdit(previous, draft) {
    if (draft.messages.length > MAX_MESSAGES)
        throw new Error(`A scene supports up to ${MAX_MESSAGES} messages. Start another scene to keep writing.`);
    if (draft.participants.length > 32)
        throw new Error("A conversation supports up to 32 people.");
    const oldMessages = new Map(previous.messages.map((message) => [message.id, message]));
    const ids = new Set(draft.messages.map((message) => message.id));
    const boundTime = (value, minimum = 0) => Math.min(draft.timeline.duration, Math.max(minimum, value));
    for (const message of draft.messages) {
        const old = oldMessages.get(message.id);
        message.at = boundTime(Number.isFinite(message.at) ? message.at : (old?.at ?? 0));
        const delta = old ? message.at - old.at : 0;
        if (message.statusAt !== undefined) {
            const shifted = old && message.statusAt === old.statusAt
                ? message.statusAt + delta
                : message.statusAt;
            message.statusAt = boundTime(Number.isFinite(shifted) ? shifted : message.at, message.at);
        }
        const oldReactions = new Map(old?.reactions.map((reaction) => [reaction.id, reaction]) ?? []);
        for (const reaction of message.reactions) {
            const original = oldReactions.get(reaction.id);
            const shifted = original && reaction.at === original.at
                ? reaction.at + delta
                : reaction.at;
            reaction.at = boundTime(Number.isFinite(shifted) ? shifted : message.at, message.at);
        }
        const oldStickers = new Map(old?.stickers?.map((sticker) => [sticker.id, sticker]) ?? []);
        for (const sticker of message.stickers ?? []) {
            const original = oldStickers.get(sticker.id);
            const shifted = original && sticker.at === original.at
                ? sticker.at + delta
                : sticker.at;
            sticker.at = boundTime(Number.isFinite(shifted) ? shifted : message.at, message.at);
        }
        if (!message.replyTo || !ids.has(message.replyTo))
            delete message.replyTo;
        if (message.media?.url === "")
            delete message.media.url;
        if (message.media?.poster === "")
            delete message.media.poster;
    }
    const context = draft.composer.context;
    const resetContext = !!context?.messageId && !ids.has(context.messageId);
    if (context && resetContext) {
        context.mode = "normal";
        delete context.messageId;
    }
    if (draft.conversation?.unread &&
        !ids.has(draft.conversation.unread.messageId))
        delete draft.conversation.unread;
    if (draft.conversation?.pinned &&
        !ids.has(draft.conversation.pinned.messageId))
        delete draft.conversation.pinned;
    if (draft.interactions?.tapbackPicker &&
        !ids.has(draft.interactions.tapbackPicker.messageId))
        delete draft.interactions.tapbackPicker;
    if (draft.interactions?.editHistory &&
        !ids.has(draft.interactions.editHistory.messageId))
        delete draft.interactions.editHistory;
    clampComposerSelection(draft);
    const oldTracks = new Map(previous.timeline.tracks.map((track) => [track.id, track]));
    draft.timeline.tracks = draft.timeline.tracks.flatMap((track) => {
        if (resetContext && track.path === "/composer/context/mode") {
            track = {
                ...track,
                keyframes: track.keyframes.filter((frame) => frame.value !== "reply" && frame.value !== "edit"),
            };
            if (!track.keyframes.length)
                return [];
        }
        const old = oldTracks.get(track.id);
        if (!old || old.path !== track.path)
            return [track];
        const path = remapPresentationPath(previous, draft, track.path);
        return path ? [{ ...track, path }] : [];
    });
    return draft;
}
