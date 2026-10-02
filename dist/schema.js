import { z } from "zod";
import { isSceneAssetUrl, MAX_INLINE_IMAGE_BYTES } from "./assets.js";
import { FORBIDDEN_KEYS, MAX_MESSAGES, pointerSegments, readPointer } from "./pointer.js";
export { INTEGER_FIELD_PATTERNS, isIntegerField, MAX_MESSAGES, pointerSegments, readPointer, writePointer, } from "./pointer.js";
/** v1 is an immutable wire contract. Introduce a new version for incompatible changes. */
export const SCENE_VERSION = 1;
export const MAX_SCENE_BYTES = 262_144;
export const MAX_DURATION = 300;
const id = z
    .string()
    .min(1)
    .max(80)
    .regex(/^[A-Za-z0-9_-]+$/);
const color = z.string().regex(/^#[0-9a-fA-F]{6}(?:[0-9a-fA-F]{2})?$/);
// Explicit metadata makes future fields opt into typing; enums/URLs never inherit it.
const displayText = (limit) => z.string().max(limit).meta({ animation: "typewriter" });
const shortText = displayText(240);
const time = z.number().finite().min(0).max(MAX_DURATION);
// Navigable links remain HTTPS-only. Visual assets also accept bounded static rasters.
const httpsUrl = z
    .string()
    .max(4096)
    .url()
    .refine((value) => {
    try {
        const url = new URL(value);
        return url.protocol === "https:" && !url.username && !url.password;
    }
    catch {
        return false;
    }
}, "Only HTTPS URLs without embedded credentials are supported");
const maxAssetUrlLength = Math.ceil(MAX_INLINE_IMAGE_BYTES / 3) * 4 + 40;
const localAssetPattern = /^local:[a-f0-9]{64}$/;
const videoUrl = z
    .string()
    .max(4096)
    .refine((value) => localAssetPattern.test(value) || httpsUrl.safeParse(value).success, "Use an HTTPS video or a browser-local asset reference");
const assetUrl = z
    .string()
    .max(maxAssetUrlLength)
    .refine((value) => localAssetPattern.test(value) || isSceneAssetUrl(value), "Use an HTTPS image, supported small raster image, or browser-local asset reference");
const jsonValue = z.lazy(() => z.union([
    z.string().max(16_384),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(jsonValue).max(256),
    z.record(z.string().max(80), jsonValue),
]));
const extensions = z
    .record(z.string().regex(/^[a-z0-9-]+\.[a-z0-9._-]+$/), jsonValue)
    .default({});
export const ParticipantSchema = z.strictObject({
    id,
    name: shortText,
    avatar: assetUrl.optional(),
    color: color.default("#A9A0B9"),
    isSelf: z.boolean().default(false),
});
export const ReactionSchema = z.strictObject({
    id,
    emoji: z.string().min(1).max(32),
    participantId: id,
    at: time.default(0),
});
export const TextRunEffectSchema = z.enum([
    "none",
    "big",
    "small",
    "shake",
    "nod",
    "explode",
    "ripple",
    "bloom",
    "jitter",
]);
export const MessageTextRunSchema = z.strictObject({
    id,
    text: displayText(16_384),
    bold: z.boolean().default(false),
    italic: z.boolean().default(false),
    underline: z.boolean().default(false),
    strikethrough: z.boolean().default(false),
    effect: TextRunEffectSchema.default("none"),
});
export const AttachedStickerSchema = z.strictObject({
    id,
    emoji: z.string().max(32).default("✨"),
    url: assetUrl.optional(),
    x: z.number().min(-1).max(2).default(0.8),
    y: z.number().min(-1).max(2).default(0.1),
    scale: z.number().min(0.1).max(4).default(1),
    rotation: z.number().min(-360).max(360).default(0),
    zIndex: z.number().int().min(0).max(32).default(1),
    at: time.default(0),
    participantId: id.optional(),
});
// Additive conversation state: absent objects stay absent in canonical v1 bytes.
const availability = z.enum(["enabled", "disabled", "hidden"]);
export const HeaderStateSchema = z.strictObject({
    transport: z.enum(["imessage", "sms", "rcs"]).default("imessage"),
    backCount: z.number().int().min(0).max(9999).default(0),
    video: availability.default("enabled"),
    call: availability.default("enabled"),
});
export const ConversationStateSchema = z.strictObject({
    muted: z.boolean().default(false),
    focus: z
        .strictObject({
        visible: z.boolean().default(true),
        name: shortText,
        notifyAnyway: z.boolean().default(true),
    })
        .optional(),
    unread: z
        .strictObject({
        visible: z.boolean().default(true),
        messageId: id,
        count: z.number().int().min(1).max(9999).default(1),
    })
        .optional(),
    pinned: z
        .strictObject({
        visible: z.boolean().default(true),
        messageId: id,
        label: shortText.default("Pinned Message"),
    })
        .optional(),
});
export const ComposerContextSchema = z.strictObject({
    mode: z
        .enum(["normal", "reply", "edit", "recording", "scheduled"])
        .default("normal"),
    messageId: id.optional(),
    scheduledAt: shortText.default("Tomorrow, 9:00 AM"),
    recording: z
        .strictObject({
        duration: z.number().min(0).max(36_000).default(0),
        locked: z.boolean().default(false),
        paused: z.boolean().default(false),
        waveform: z.array(z.number().min(0).max(1)).max(120).default([]),
    })
        .default({ duration: 0, locked: false, paused: false, waveform: [] }),
});
export const ComposerSelectionSchema = z.strictObject({
    start: z.number().int().min(0).max(16_384),
    end: z.number().int().min(0).max(16_384),
    showCaret: z.boolean().default(true),
    showHandles: z.boolean().default(true),
    visible: z.boolean().optional(),
});
export const InteractionStateSchema = z.strictObject({
    attachmentTray: z
        .strictObject({
        visible: z.boolean().default(true),
        kind: z.enum(["apps", "photos", "stickers"]).default("apps"),
        items: z
            .array(z.strictObject({
            id,
            url: assetUrl.optional(),
            emoji: z.string().max(32).optional(),
            label: shortText.default(""),
        }))
            .max(24)
            .optional(),
    })
        .optional(),
    tapbackPicker: z
        .strictObject({
        visible: z.boolean().default(true),
        messageId: id,
        selectedEmoji: z.string().max(32).default(""),
        emojis: z
            .array(z.string().min(1).max(32))
            .min(1)
            .max(16)
            .default(["❤️", "👍", "👎", "😂", "‼️", "❓"]),
        showMenu: z.boolean().default(true),
    })
        .optional(),
    editHistory: z
        .strictObject({ visible: z.boolean().default(true), messageId: id })
        .optional(),
});
export const EditHistorySchema = z.strictObject({
    versions: z
        .array(z.strictObject({
        id,
        text: displayText(16_384),
        editedAt: displayText(80).default(""),
    }))
        .min(1)
        .max(6),
});
export const MessageSchema = z
    .strictObject({
    id,
    senderId: id,
    at: time.default(0),
    kind: z
        .enum([
        "text",
        "image",
        "video",
        "voice",
        "file",
        "link",
        "location",
        "contact",
        "sticker",
        "poll",
        "payment",
        "system",
    ])
        .default("text"),
    text: displayText(16_384).default(""),
    textRuns: z.array(MessageTextRunSchema).max(128).optional(),
    stickers: z.array(AttachedStickerSchema).max(32).optional(),
    timestamp: displayText(80).default(""),
    dateLabel: displayText(80).default(""),
    status: z
        .enum(["sending", "sent", "delivered", "read", "failed"])
        .default("delivered"),
    statusAt: time.optional(),
    statusText: displayText(120).default(""),
    edited: z.boolean().default(false),
    editedAt: displayText(80).default(""),
    editHistory: EditHistorySchema.optional(),
    unsent: z.boolean().default(false),
    scheduledAt: displayText(80).optional(),
    readBy: z.array(id).max(32).optional(),
    replyTo: id.optional(),
    reactions: z.array(ReactionSchema).max(24).default([]),
    effect: z
        .enum([
        "none",
        "slam",
        "loud",
        "gentle",
        "invisible-ink",
        "shake",
        "bloom",
        "ripple",
        "jitter",
    ])
        .default("none"),
    presentation: z
        .strictObject({
        opacity: z.number().min(0).max(1).default(1),
        scale: z.number().min(0).max(3).default(1),
        offsetX: z.number().min(-2000).max(2000).default(0),
        offsetY: z.number().min(-2000).max(2000).default(0),
    })
        .default({ opacity: 1, scale: 1, offsetX: 0, offsetY: 0 }),
    media: z
        .strictObject({
        url: assetUrl.optional(),
        videoUrl: videoUrl.optional(),
        alt: displayText(500).default(""),
        width: z.number().int().min(1).max(8192).default(800),
        height: z.number().int().min(1).max(8192).default(600),
        duration: z.number().min(0).max(36_000).default(0),
        poster: assetUrl.optional(),
        waveform: z.array(z.number().min(0).max(1)).max(120).default([]),
        transcript: displayText(16_384).optional(),
        playhead: z.number().min(0).max(36_000).default(0),
        playbackRate: z.number().min(0.25).max(3).default(1),
        playing: z.boolean().default(false),
        keep: z.boolean().default(false),
    })
        .superRefine((media, ctx) => {
        if (media.playhead > media.duration)
            ctx.addIssue({
                code: "custom",
                path: ["playhead"],
                message: "Playhead cannot exceed media duration",
            });
    })
        .optional(),
    file: z
        .strictObject({
        name: shortText,
        size: z.number().int().min(0).max(1e12).default(0),
        mimeType: z.string().max(240).default("application/octet-stream"),
    })
        .optional(),
    link: z
        .strictObject({
        url: httpsUrl,
        title: shortText,
        description: displayText(1000).default(""),
        image: assetUrl.optional(),
    })
        .optional(),
    location: z
        .strictObject({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        label: shortText,
        address: shortText.default(""),
    })
        .optional(),
    sharedContact: z
        .strictObject({
        name: shortText,
        phone: shortText.default(""),
        avatar: assetUrl.optional(),
    })
        .optional(),
    sticker: z
        .strictObject({
        emoji: z.string().max(32).default("✨"),
        url: assetUrl.optional(),
        alt: shortText.default("Sticker"),
    })
        .optional(),
    poll: z
        .strictObject({
        question: shortText,
        options: z
            .array(z.strictObject({
            id,
            text: shortText,
            votes: z.number().int().min(0).max(1e9).default(0),
        }))
            .min(2)
            .max(12),
        totalVotes: z.number().int().min(0).max(1e9).default(0),
    })
        .optional(),
    payment: z
        .strictObject({
        amount: z.number().min(0).max(1e9),
        currency: z
            .string()
            .regex(/^[A-Z]{3}$/)
            .default("USD"),
        note: shortText.default(""),
    })
        .optional(),
    extensions,
})
    .superRefine((message, ctx) => {
    const attachmentFields = {
        image: "media",
        video: "media",
        voice: "media",
        file: "file",
        link: "link",
        location: "location",
        contact: "sharedContact",
        sticker: "sticker",
        poll: "poll",
        payment: "payment",
    };
    const field = attachmentFields[message.kind];
    if (field && !message[field])
        ctx.addIssue({
            code: "custom",
            path: [field],
            message: `${message.kind} messages require ${field}`,
        });
    if (message.textRuns &&
        message.textRuns.map((run) => run.text).join("") !== message.text)
        ctx.addIssue({
            code: "custom",
            path: ["textRuns"],
            message: "Text runs must concatenate exactly to message text",
        });
    if (message.textRuns &&
        new Set(message.textRuns.map((run) => run.id)).size !==
            message.textRuns.length)
        ctx.addIssue({
            code: "custom",
            path: ["textRuns"],
            message: "Text run IDs must be unique",
        });
    if (message.stickers &&
        new Set(message.stickers.map((sticker) => sticker.id)).size !==
            message.stickers.length)
        ctx.addIssue({
            code: "custom",
            path: ["stickers"],
            message: "Attached sticker IDs must be unique",
        });
    if (message.editHistory &&
        new Set(message.editHistory.versions.map((version) => version.id))
            .size !== message.editHistory.versions.length)
        ctx.addIssue({
            code: "custom",
            path: ["editHistory", "versions"],
            message: "Edit version IDs must be unique",
        });
});
export const KeyframeSchema = z.strictObject({
    at: time,
    value: z.union([
        z.string().max(maxAssetUrlLength),
        z.number().finite(),
        z.boolean(),
        z.null(),
    ]),
    /** Easing describes the segment arriving at this keyframe. */
    easing: z.enum(["step", "linear", "ease", "typewriter"]).default("step"),
});
export const TrackSchema = z.strictObject({
    id,
    path: z.string().min(2).max(300),
    keyframes: z.array(KeyframeSchema).min(1).max(256),
});
const SceneBaseSchema = z.strictObject({
    version: z.literal(1),
    id,
    title: shortText.default("Untitled conversation"),
    rendererVersion: z.literal("2026.1").default("2026.1"),
    platform: z
        .enum(["imessage", "whatsapp", "telegram", "instagram"])
        .default("imessage"),
    theme: z.enum(["light", "dark"]).default("light"),
    device: z
        .strictObject({
        width: z.number().int().min(280).max(1024).default(393),
        height: z.number().int().min(400).max(2048).default(852),
        frame: z.enum(["iphone", "none"]).default("iphone"),
        scale: z.number().min(0.25).max(4).default(1),
    })
        .default({ width: 393, height: 852, frame: "iphone", scale: 1 }),
    statusBar: z
        .strictObject({
        time: displayText(20).default("9:41"),
        battery: z.number().int().min(0).max(100).default(100),
        charging: z.boolean().default(false),
        wifi: z.number().int().min(0).max(3).default(3),
        cellular: z.number().int().min(0).max(4).default(4),
        carrier: displayText(40).default(""),
        visible: z.boolean().default(true),
    })
        .default({
        time: "9:41",
        battery: 100,
        charging: false,
        wifi: 3,
        cellular: 4,
        carrier: "",
        visible: true,
    }),
    participants: z.array(ParticipantSchema).min(2).max(32),
    contact: z.strictObject({
        kind: z.enum(["direct", "group"]).optional(),
        name: shortText,
        subtitle: shortText.default(""),
        avatar: assetUrl.optional(),
        participantIds: z.array(id).min(1).max(32),
    }),
    header: HeaderStateSchema.optional(),
    conversation: ConversationStateSchema.optional(),
    interactions: InteractionStateSchema.optional(),
    messages: z.array(MessageSchema).max(MAX_MESSAGES).default([]),
    composer: z
        .strictObject({
        text: displayText(16_384).default(""),
        placeholder: shortText.default("iMessage"),
        typing: z
            .strictObject({
            visible: z.boolean().default(false),
            participantId: id.optional(),
        })
            .default({ visible: false }),
        keyboard: z.enum(["hidden", "alphabetic", "emoji"]).default("hidden"),
        focused: z.boolean().default(false),
        context: ComposerContextSchema.optional(),
        selection: ComposerSelectionSchema.optional(),
    })
        .default({
        text: "",
        placeholder: "iMessage",
        typing: { visible: false },
        keyboard: "hidden",
        focused: false,
    }),
    appearance: z
        .strictObject({
        wallpaper: z
            .enum(["solid", "gradient", "paper", "custom"])
            .default("solid"),
        color: color.default("#FFFFFF"),
        showTimestamps: z.boolean().default(false),
        showAvatars: z.boolean().default(false),
        bubbleRadius: z.number().min(0).max(32).default(20),
        textSize: z.number().min(12).max(24).default(17),
        screenEffect: z
            .enum([
            "none",
            "confetti",
            "balloons",
            "hearts",
            "lasers",
            "fireworks",
            "echo",
            "spotlight",
        ])
            .default("none"),
    })
        .default({
        wallpaper: "solid",
        color: "#FFFFFF",
        showTimestamps: false,
        showAvatars: false,
        bubbleRadius: 20,
        textSize: 17,
        screenEffect: "none",
    }),
    timeline: z
        .strictObject({
        duration: z.number().min(0.1).max(MAX_DURATION).default(8),
        loop: z.boolean().default(true),
        fps: z.number().int().min(1).max(60).default(30),
        tracks: z.array(TrackSchema).max(256).default([]),
    })
        .default({ duration: 8, loop: true, fps: 30, tracks: [] }),
    extensions,
});
function unwrapSchema(schema) {
    while (schema instanceof z.ZodOptional || schema instanceof z.ZodDefault)
        schema = schema.unwrap();
    return schema;
}
function fieldSchema(path) {
    let schema = SceneBaseSchema;
    for (const part of pointerSegments(path)) {
        schema = unwrapSchema(schema);
        if (schema instanceof z.ZodObject)
            schema = schema.shape[part];
        else if (schema instanceof z.ZodArray)
            schema = schema.element;
        else
            throw new Error("Unknown animation field schema");
        if (!schema)
            throw new Error("Unknown animation field schema");
    }
    return unwrapSchema(schema);
}
/** Integer animation behavior follows the schema, not a list of field names. */
export function isIntegerPresentationField(path) {
    const schema = fieldSchema(path);
    return schema instanceof z.ZodNumber && schema.isInt;
}
const nonPresentation = new Set([
    "id",
    "senderId",
    "participantId",
    "participantIds",
    "readBy",
    "messageId",
    "replyTo",
    "isSelf",
    "kind",
    "at",
    "statusAt",
    "version",
    "rendererVersion",
    "extensions",
    "timeline",
]);
export const SceneSchema = SceneBaseSchema.superRefine((scene, ctx) => {
    const issue = (path, message) => ctx.addIssue({ code: "custom", path, message });
    const unique = (values, path) => {
        if (new Set(values).size !== values.length)
            issue(path, "IDs must be unique");
    };
    unique(scene.participants.map((p) => p.id), ["participants"]);
    unique(scene.messages.map((m) => m.id), ["messages"]);
    unique(scene.timeline.tracks.map((t) => t.id), ["timeline", "tracks"]);
    unique(scene.contact.participantIds, ["contact", "participantIds"]);
    if (scene.participants.filter((p) => p.isSelf).length !== 1)
        issue(["participants"], "Exactly one participant must be self");
    const participants = new Set(scene.participants.map((p) => p.id));
    const messages = new Set(scene.messages.map((m) => m.id));
    const reference = (value, path) => {
        if (value !== undefined && !messages.has(value))
            issue(path, "Unknown message");
    };
    reference(scene.composer.context?.messageId, [
        "composer",
        "context",
        "messageId",
    ]);
    reference(scene.conversation?.unread?.messageId, [
        "conversation",
        "unread",
        "messageId",
    ]);
    reference(scene.conversation?.pinned?.messageId, [
        "conversation",
        "pinned",
        "messageId",
    ]);
    reference(scene.interactions?.tapbackPicker?.messageId, [
        "interactions",
        "tapbackPicker",
        "messageId",
    ]);
    reference(scene.interactions?.editHistory?.messageId, [
        "interactions",
        "editHistory",
        "messageId",
    ]);
    const context = scene.composer.context;
    const contextModes = [
        context?.mode,
        ...scene.timeline.tracks
            .filter((track) => track.path === "/composer/context/mode")
            .flatMap((track) => track.keyframes.map((frame) => frame.value)),
    ];
    if (contextModes.some((mode) => mode === "reply" || mode === "edit") &&
        !context?.messageId)
        issue(["composer", "context", "messageId"], "Reply and edit modes require a message reference");
    const selection = scene.composer.selection;
    if (selection &&
        (selection.start > selection.end ||
            selection.end > scene.composer.text.length))
        issue(["composer", "selection"], "Selection must be ordered and inside the draft text");
    const historyId = scene.interactions?.editHistory?.messageId;
    if (historyId &&
        !scene.messages.find((message) => message.id === historyId)?.editHistory)
        issue(["interactions", "editHistory", "messageId"], "Expanded edit history requires authored message versions");
    if (scene.interactions?.attachmentTray?.items)
        unique(scene.interactions.attachmentTray.items.map((item) => item.id), ["interactions", "attachmentTray", "items"]);
    scene.contact.participantIds.forEach((value, index) => {
        if (!participants.has(value))
            issue(["contact", "participantIds", index], "Unknown participant");
    });
    if (scene.composer.typing.participantId &&
        !participants.has(scene.composer.typing.participantId))
        issue(["composer", "typing", "participantId"], "Unknown participant");
    scene.messages.forEach((message, index) => {
        if (!participants.has(message.senderId))
            issue(["messages", index, "senderId"], "Unknown sender");
        if (message.replyTo &&
            (!messages.has(message.replyTo) || message.replyTo === message.id))
            issue(["messages", index, "replyTo"], "Reply must reference another message");
        if (message.at > scene.timeline.duration)
            issue(["messages", index, "at"], "Message starts after scene ends");
        if (message.statusAt !== undefined &&
            (message.statusAt < message.at ||
                message.statusAt > scene.timeline.duration))
            issue(["messages", index, "statusAt"], "Receipt must occur between message and scene end");
        if (message.readBy) {
            unique(message.readBy, ["messages", index, "readBy"]);
            message.readBy.forEach((reader, readerIndex) => {
                if (!participants.has(reader))
                    issue(["messages", index, "readBy", readerIndex], "Unknown receipt reader");
            });
        }
        unique(message.reactions.map((r) => r.id), ["messages", index, "reactions"]);
        if (message.poll)
            unique(message.poll.options.map((o) => o.id), ["messages", index, "poll", "options"]);
        message.stickers?.forEach((sticker, stickerIndex) => {
            if (sticker.participantId && !participants.has(sticker.participantId))
                issue(["messages", index, "stickers", stickerIndex, "participantId"], "Unknown sticker participant");
            if (sticker.at < message.at || sticker.at > scene.timeline.duration)
                issue(["messages", index, "stickers", stickerIndex, "at"], "Sticker must appear between message and scene end");
        });
        if (message.textRuns) {
            const maximumTextLength = message.textRuns.reduce((sum, run, runIndex) => {
                const track = scene.timeline.tracks.find((candidate) => candidate.path === `/messages/${index}/textRuns/${runIndex}/text`);
                return (sum +
                    Math.max(run.text.length, ...(track?.keyframes.map((frame) => typeof frame.value === "string" ? frame.value.length : 0) ?? [])));
            }, 0);
            if (maximumTextLength > 16_384)
                issue(["messages", index, "textRuns"], "Animated text runs may not exceed 16,384 combined characters");
        }
        message.reactions.forEach((reaction, r) => {
            if (!participants.has(reaction.participantId))
                issue(["messages", index, "reactions", r, "participantId"], "Unknown reacting participant");
            if (reaction.at < message.at || reaction.at > scene.timeline.duration)
                issue(["messages", index, "reactions", r, "at"], "Reaction must occur between message and scene end");
        });
    });
    if (scene.timeline.tracks.reduce((sum, track) => sum + track.keyframes.length, 0) > 1024)
        issue(["timeline", "tracks"], "At most 1,024 total keyframes are allowed");
    const paths = new Set();
    scene.timeline.tracks.forEach((track, index) => {
        try {
            const parts = pointerSegments(track.path);
            if (parts[0] === "title" ||
                (track.path !== "/interactions/attachmentTray/kind" &&
                    parts.some((part) => nonPresentation.has(part))))
                throw new Error("Animation target is not a presentation field");
            if (paths.has(track.path))
                throw new Error("Only one track per presentation field is allowed");
            paths.add(track.path);
            const initial = readPointer(scene, track.path);
            const targetSchema = fieldSchema(track.path);
            if (parts[0] === "messages" &&
                parts[2] === "text" &&
                scene.messages[Number(parts[1])]?.textRuns)
                throw new Error("Animate textRuns text when the message has formatting");
            if (initial !== null &&
                !["string", "number", "boolean"].includes(typeof initial))
                throw new Error("Animation target must be a scalar presentation field");
            let previous = -1;
            track.keyframes.forEach((frame, k) => {
                if (frame.at <= previous || frame.at > scene.timeline.duration)
                    throw new Error("Keyframe times must increase strictly within the scene duration");
                previous = frame.at;
                if (typeof frame.value !== typeof initial)
                    throw new Error("Keyframe value must match the target field type");
                if (["linear", "ease"].includes(frame.easing) &&
                    typeof initial !== "number")
                    throw new Error("Numeric easing requires a number field");
                if (frame.easing === "typewriter" &&
                    (typeof initial !== "string" ||
                        !(targetSchema instanceof z.ZodString) ||
                        targetSchema.meta()?.animation !== "typewriter" ||
                        targetSchema.format !== null ||
                        (targetSchema.minLength ?? 0) > 0))
                    throw new Error("Typewriter easing requires an unconstrained display-text field");
                if (parts[0] === "messages" &&
                    parts[2] === "media" &&
                    parts[3] === "playhead" &&
                    typeof frame.value === "number" &&
                    frame.value > (scene.messages[Number(parts[1])]?.media?.duration ?? 0))
                    throw new Error("Animated playhead cannot exceed media duration");
                const result = targetSchema.safeParse(frame.value);
                if (!result.success)
                    issue(["timeline", "tracks", index, "keyframes", k, "value"], "Keyframe value violates the target field schema");
            });
        }
        catch (error) {
            issue(["timeline", "tracks", index], error instanceof Error ? error.message : "Invalid animation track");
        }
    });
});
function inspectJson(value, ancestors = new Set(), depth = 0, budget = { nodes: 0 }) {
    if (++budget.nodes > 25_000 || depth > 32)
        throw new Error("Scene structure exceeds safety limits");
    if (value === null || ["string", "boolean", "number"].includes(typeof value))
        return;
    if (typeof value !== "object")
        throw new Error("Scene must contain JSON values only");
    if (ancestors.has(value))
        throw new Error("Scene contains a cycle");
    const proto = Object.getPrototypeOf(value);
    if (!Array.isArray(value) && proto !== Object.prototype && proto !== null)
        throw new Error("Scene must contain plain JSON objects");
    ancestors.add(value);
    for (const [key, child] of Object.entries(value)) {
        if (FORBIDDEN_KEYS.has(key))
            throw new Error("Scene contains an unsafe object key");
        inspectJson(child, ancestors, depth + 1, budget);
    }
    ancestors.delete(value);
}
export function parseScene(input) {
    let value = input;
    if (typeof value === "string") {
        if (new TextEncoder().encode(value).byteLength > MAX_SCENE_BYTES)
            throw new Error("Scene exceeds 256 KiB");
        value = JSON.parse(value);
    }
    inspectJson(value);
    if (new TextEncoder().encode(JSON.stringify(value)).byteLength > MAX_SCENE_BYTES)
        throw new Error("Scene exceeds 256 KiB");
    const parsed = SceneSchema.safeParse(value);
    if (!parsed.success) {
        const issue = parsed.error.issues[0];
        const path = issue.path
            .map((part, index) => typeof part === "number"
            ? ` ${part + 1}`
            : `${index ? " · " : ""}${String(part)}`)
            .join("");
        throw new Error(`Fix ${path || "scene"}: ${issue.message}`);
    }
    const scene = parsed.data;
    if (new TextEncoder().encode(JSON.stringify(scene)).byteLength > MAX_SCENE_BYTES)
        throw new Error("Expanded scene exceeds 256 KiB");
    return scene;
}
/** The manual motion editor derives its controls from the same target contract as validation. */
export function presentationField(scene, path) {
    const parts = pointerSegments(path);
    if (parts[0] === "title" ||
        (path !== "/interactions/attachmentTray/kind" &&
            parts.some((part) => nonPresentation.has(part))))
        throw new Error("This field cannot be animated.");
    if (parts[0] === "messages" &&
        parts[2] === "text" &&
        scene.messages[Number(parts[1])]?.textRuns)
        throw new Error("Animate the formatted text runs instead.");
    const value = readPointer(scene, path);
    if (value !== null && !["string", "number", "boolean"].includes(typeof value))
        throw new Error("Choose one detail to animate.");
    const schema = fieldSchema(path);
    const field = {
        path,
        value: value,
        type: value === null
            ? "null"
            : typeof value === "string"
                ? "text"
                : typeof value === "number"
                    ? "number"
                    : "boolean",
        typewriter: schema instanceof z.ZodString &&
            schema.meta()?.animation === "typewriter" &&
            schema.format === null &&
            (schema.minLength ?? 0) === 0,
    };
    if (schema instanceof z.ZodEnum)
        field.choices = schema.options;
    if (schema instanceof z.ZodNumber) {
        field.minimum =
            typeof schema.minValue === "number" && Number.isFinite(schema.minValue)
                ? schema.minValue
                : undefined;
        field.maximum =
            typeof schema.maxValue === "number" && Number.isFinite(schema.maxValue)
                ? schema.maxValue
                : undefined;
        field.integer = schema.isInt;
    }
    if (schema instanceof z.ZodString)
        field.maxLength = schema.maxLength ?? undefined;
    if (parts[0] === "messages" &&
        parts[2] === "media" &&
        parts[3] === "playhead")
        field.maximum = scene.messages[Number(parts[1])]?.media?.duration ?? 0;
    return field;
}
