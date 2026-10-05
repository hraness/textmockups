import { z } from "zod";
export { INTEGER_FIELD_PATTERNS, isIntegerField, MAX_MESSAGES, pointerSegments, readPointer, writePointer, } from "./pointer.js";
/** v1 is an immutable wire contract. Introduce a new version for incompatible changes. */
export declare const SCENE_VERSION: 1;
export declare const MAX_SCENE_BYTES = 262144;
export declare const MAX_DURATION = 300;
export type JsonValue = string | number | boolean | null | JsonValue[] | {
    [key: string]: JsonValue;
};
export declare const ParticipantSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    avatar: z.ZodOptional<z.ZodString>;
    color: z.ZodDefault<z.ZodString>;
    isSelf: z.ZodDefault<z.ZodBoolean>;
}, z.core.$strict>;
export type Participant = z.infer<typeof ParticipantSchema>;
export declare const ReactionSchema: z.ZodObject<{
    id: z.ZodString;
    emoji: z.ZodString;
    participantId: z.ZodString;
    at: z.ZodDefault<z.ZodNumber>;
}, z.core.$strict>;
export type Reaction = z.infer<typeof ReactionSchema>;
export declare const TextRunEffectSchema: z.ZodEnum<{
    none: "none";
    big: "big";
    small: "small";
    shake: "shake";
    nod: "nod";
    explode: "explode";
    ripple: "ripple";
    bloom: "bloom";
    jitter: "jitter";
}>;
export declare const MessageTextRunSchema: z.ZodObject<{
    id: z.ZodString;
    text: z.ZodString;
    bold: z.ZodDefault<z.ZodBoolean>;
    italic: z.ZodDefault<z.ZodBoolean>;
    underline: z.ZodDefault<z.ZodBoolean>;
    strikethrough: z.ZodDefault<z.ZodBoolean>;
    effect: z.ZodDefault<z.ZodEnum<{
        none: "none";
        big: "big";
        small: "small";
        shake: "shake";
        nod: "nod";
        explode: "explode";
        ripple: "ripple";
        bloom: "bloom";
        jitter: "jitter";
    }>>;
}, z.core.$strict>;
export type MessageTextRun = z.infer<typeof MessageTextRunSchema>;
export declare const AttachedStickerSchema: z.ZodObject<{
    id: z.ZodString;
    emoji: z.ZodDefault<z.ZodString>;
    url: z.ZodOptional<z.ZodString>;
    x: z.ZodDefault<z.ZodNumber>;
    y: z.ZodDefault<z.ZodNumber>;
    scale: z.ZodDefault<z.ZodNumber>;
    rotation: z.ZodDefault<z.ZodNumber>;
    zIndex: z.ZodDefault<z.ZodNumber>;
    at: z.ZodDefault<z.ZodNumber>;
    participantId: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type AttachedSticker = z.infer<typeof AttachedStickerSchema>;
export declare const HeaderStateSchema: z.ZodObject<{
    transport: z.ZodDefault<z.ZodEnum<{
        imessage: "imessage";
        sms: "sms";
        rcs: "rcs";
    }>>;
    backCount: z.ZodDefault<z.ZodNumber>;
    video: z.ZodDefault<z.ZodEnum<{
        enabled: "enabled";
        disabled: "disabled";
        hidden: "hidden";
    }>>;
    call: z.ZodDefault<z.ZodEnum<{
        enabled: "enabled";
        disabled: "disabled";
        hidden: "hidden";
    }>>;
}, z.core.$strict>;
export declare const ConversationStateSchema: z.ZodObject<{
    muted: z.ZodDefault<z.ZodBoolean>;
    focus: z.ZodOptional<z.ZodObject<{
        visible: z.ZodDefault<z.ZodBoolean>;
        name: z.ZodString;
        notifyAnyway: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strict>>;
    unread: z.ZodOptional<z.ZodObject<{
        visible: z.ZodDefault<z.ZodBoolean>;
        messageId: z.ZodString;
        count: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strict>>;
    pinned: z.ZodOptional<z.ZodObject<{
        visible: z.ZodDefault<z.ZodBoolean>;
        messageId: z.ZodString;
        label: z.ZodDefault<z.ZodString>;
    }, z.core.$strict>>;
}, z.core.$strict>;
export declare const ComposerContextSchema: z.ZodObject<{
    mode: z.ZodDefault<z.ZodEnum<{
        normal: "normal";
        reply: "reply";
        edit: "edit";
        recording: "recording";
        scheduled: "scheduled";
    }>>;
    messageId: z.ZodOptional<z.ZodString>;
    scheduledAt: z.ZodDefault<z.ZodString>;
    recording: z.ZodDefault<z.ZodObject<{
        duration: z.ZodDefault<z.ZodNumber>;
        locked: z.ZodDefault<z.ZodBoolean>;
        paused: z.ZodDefault<z.ZodBoolean>;
        waveform: z.ZodDefault<z.ZodArray<z.ZodNumber>>;
    }, z.core.$strict>>;
}, z.core.$strict>;
export declare const ComposerSelectionSchema: z.ZodObject<{
    start: z.ZodNumber;
    end: z.ZodNumber;
    showCaret: z.ZodDefault<z.ZodBoolean>;
    showHandles: z.ZodDefault<z.ZodBoolean>;
    visible: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strict>;
export declare const InteractionStateSchema: z.ZodObject<{
    attachmentTray: z.ZodOptional<z.ZodObject<{
        visible: z.ZodDefault<z.ZodBoolean>;
        kind: z.ZodDefault<z.ZodEnum<{
            apps: "apps";
            photos: "photos";
            stickers: "stickers";
        }>>;
        items: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            url: z.ZodOptional<z.ZodString>;
            emoji: z.ZodOptional<z.ZodString>;
            label: z.ZodDefault<z.ZodString>;
        }, z.core.$strict>>>;
    }, z.core.$strict>>;
    tapbackPicker: z.ZodOptional<z.ZodObject<{
        visible: z.ZodDefault<z.ZodBoolean>;
        messageId: z.ZodString;
        selectedEmoji: z.ZodDefault<z.ZodString>;
        emojis: z.ZodDefault<z.ZodArray<z.ZodString>>;
        showMenu: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strict>>;
    editHistory: z.ZodOptional<z.ZodObject<{
        visible: z.ZodDefault<z.ZodBoolean>;
        messageId: z.ZodString;
    }, z.core.$strict>>;
}, z.core.$strict>;
export declare const EditHistorySchema: z.ZodObject<{
    versions: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        text: z.ZodString;
        editedAt: z.ZodDefault<z.ZodString>;
    }, z.core.$strict>>;
}, z.core.$strict>;
export declare const MessageSchema: z.ZodObject<{
    id: z.ZodString;
    senderId: z.ZodString;
    at: z.ZodDefault<z.ZodNumber>;
    kind: z.ZodDefault<z.ZodEnum<{
        file: "file";
        link: "link";
        text: "text";
        video: "video";
        image: "image";
        voice: "voice";
        location: "location";
        contact: "contact";
        sticker: "sticker";
        poll: "poll";
        payment: "payment";
        system: "system";
    }>>;
    text: z.ZodDefault<z.ZodString>;
    textRuns: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        text: z.ZodString;
        bold: z.ZodDefault<z.ZodBoolean>;
        italic: z.ZodDefault<z.ZodBoolean>;
        underline: z.ZodDefault<z.ZodBoolean>;
        strikethrough: z.ZodDefault<z.ZodBoolean>;
        effect: z.ZodDefault<z.ZodEnum<{
            none: "none";
            big: "big";
            small: "small";
            shake: "shake";
            nod: "nod";
            explode: "explode";
            ripple: "ripple";
            bloom: "bloom";
            jitter: "jitter";
        }>>;
    }, z.core.$strict>>>;
    stickers: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        emoji: z.ZodDefault<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
        x: z.ZodDefault<z.ZodNumber>;
        y: z.ZodDefault<z.ZodNumber>;
        scale: z.ZodDefault<z.ZodNumber>;
        rotation: z.ZodDefault<z.ZodNumber>;
        zIndex: z.ZodDefault<z.ZodNumber>;
        at: z.ZodDefault<z.ZodNumber>;
        participantId: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>>;
    timestamp: z.ZodDefault<z.ZodString>;
    dateLabel: z.ZodDefault<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<{
        sending: "sending";
        sent: "sent";
        delivered: "delivered";
        read: "read";
        failed: "failed";
    }>>;
    statusAt: z.ZodOptional<z.ZodNumber>;
    statusText: z.ZodDefault<z.ZodString>;
    edited: z.ZodDefault<z.ZodBoolean>;
    editedAt: z.ZodDefault<z.ZodString>;
    editHistory: z.ZodOptional<z.ZodObject<{
        versions: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            text: z.ZodString;
            editedAt: z.ZodDefault<z.ZodString>;
        }, z.core.$strict>>;
    }, z.core.$strict>>;
    unsent: z.ZodDefault<z.ZodBoolean>;
    scheduledAt: z.ZodOptional<z.ZodString>;
    readBy: z.ZodOptional<z.ZodArray<z.ZodString>>;
    replyTo: z.ZodOptional<z.ZodString>;
    reactions: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        emoji: z.ZodString;
        participantId: z.ZodString;
        at: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strict>>>;
    effect: z.ZodDefault<z.ZodEnum<{
        none: "none";
        shake: "shake";
        ripple: "ripple";
        bloom: "bloom";
        jitter: "jitter";
        slam: "slam";
        loud: "loud";
        gentle: "gentle";
        "invisible-ink": "invisible-ink";
    }>>;
    presentation: z.ZodDefault<z.ZodObject<{
        opacity: z.ZodDefault<z.ZodNumber>;
        scale: z.ZodDefault<z.ZodNumber>;
        offsetX: z.ZodDefault<z.ZodNumber>;
        offsetY: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strict>>;
    media: z.ZodOptional<z.ZodObject<{
        url: z.ZodOptional<z.ZodString>;
        videoUrl: z.ZodOptional<z.ZodString>;
        alt: z.ZodDefault<z.ZodString>;
        width: z.ZodDefault<z.ZodNumber>;
        height: z.ZodDefault<z.ZodNumber>;
        duration: z.ZodDefault<z.ZodNumber>;
        poster: z.ZodOptional<z.ZodString>;
        waveform: z.ZodDefault<z.ZodArray<z.ZodNumber>>;
        transcript: z.ZodOptional<z.ZodString>;
        playhead: z.ZodDefault<z.ZodNumber>;
        playbackRate: z.ZodDefault<z.ZodNumber>;
        playing: z.ZodDefault<z.ZodBoolean>;
        keep: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strict>>;
    file: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        size: z.ZodDefault<z.ZodNumber>;
        mimeType: z.ZodDefault<z.ZodString>;
    }, z.core.$strict>>;
    link: z.ZodOptional<z.ZodObject<{
        url: z.ZodString;
        title: z.ZodString;
        description: z.ZodDefault<z.ZodString>;
        image: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>;
    location: z.ZodOptional<z.ZodObject<{
        latitude: z.ZodNumber;
        longitude: z.ZodNumber;
        label: z.ZodString;
        address: z.ZodDefault<z.ZodString>;
    }, z.core.$strict>>;
    sharedContact: z.ZodOptional<z.ZodObject<{
        name: z.ZodString;
        phone: z.ZodDefault<z.ZodString>;
        avatar: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>;
    sticker: z.ZodOptional<z.ZodObject<{
        emoji: z.ZodDefault<z.ZodString>;
        url: z.ZodOptional<z.ZodString>;
        alt: z.ZodDefault<z.ZodString>;
    }, z.core.$strict>>;
    poll: z.ZodOptional<z.ZodObject<{
        question: z.ZodString;
        options: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            text: z.ZodString;
            votes: z.ZodDefault<z.ZodNumber>;
        }, z.core.$strict>>;
        totalVotes: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strict>>;
    payment: z.ZodOptional<z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodDefault<z.ZodString>;
        note: z.ZodDefault<z.ZodString>;
    }, z.core.$strict>>;
    extensions: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodType<JsonValue, unknown, z.core.$ZodTypeInternals<JsonValue, unknown>>>>;
}, z.core.$strict>;
export type Message = z.infer<typeof MessageSchema>;
export declare const KeyframeSchema: z.ZodObject<{
    at: z.ZodNumber;
    value: z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull]>;
    easing: z.ZodDefault<z.ZodEnum<{
        typewriter: "typewriter";
        step: "step";
        linear: "linear";
        ease: "ease";
    }>>;
}, z.core.$strict>;
export type Keyframe = z.infer<typeof KeyframeSchema>;
export declare const TrackSchema: z.ZodObject<{
    id: z.ZodString;
    path: z.ZodString;
    keyframes: z.ZodArray<z.ZodObject<{
        at: z.ZodNumber;
        value: z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull]>;
        easing: z.ZodDefault<z.ZodEnum<{
            typewriter: "typewriter";
            step: "step";
            linear: "linear";
            ease: "ease";
        }>>;
    }, z.core.$strict>>;
}, z.core.$strict>;
export type Track = z.infer<typeof TrackSchema>;
declare const SceneBaseSchema: z.ZodPipe<z.ZodObject<{
    version: z.ZodLiteral<1>;
    id: z.ZodString;
    title: z.ZodDefault<z.ZodString>;
    rendererVersion: z.ZodDefault<z.ZodLiteral<"2026.1">>;
    platform: z.ZodDefault<z.ZodEnum<{
        imessage: "imessage";
        whatsapp: "whatsapp";
        telegram: "telegram";
        instagram: "instagram";
        "google-messages": "google-messages";
    }>>;
    theme: z.ZodDefault<z.ZodEnum<{
        light: "light";
        dark: "dark";
    }>>;
    device: z.ZodPrefault<z.ZodPipe<z.ZodObject<{
        model: z.ZodOptional<z.ZodEnum<{
            "iphone-17-pro": "iphone-17-pro";
            "iphone-17-pro-max": "iphone-17-pro-max";
            "pixel-11": "pixel-11";
            "pixel-11-pro": "pixel-11-pro";
            "pixel-11-pro-xl": "pixel-11-pro-xl";
            "galaxy-s26": "galaxy-s26";
            "galaxy-s26-plus": "galaxy-s26-plus";
            "galaxy-s26-ultra": "galaxy-s26-ultra";
        }>>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        frame: z.ZodOptional<z.ZodEnum<{
            none: "none";
            iphone: "iphone";
            device: "device";
        }>>;
        scale: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>, z.ZodTransform<{
        width: number;
        height: number;
        frame: "none" | "iphone" | "device";
        scale: number;
        model?: "iphone-17-pro" | "iphone-17-pro-max" | "pixel-11" | "pixel-11-pro" | "pixel-11-pro-xl" | "galaxy-s26" | "galaxy-s26-plus" | "galaxy-s26-ultra" | undefined;
    }, {
        model?: "iphone-17-pro" | "iphone-17-pro-max" | "pixel-11" | "pixel-11-pro" | "pixel-11-pro-xl" | "galaxy-s26" | "galaxy-s26-plus" | "galaxy-s26-ultra" | undefined;
        width?: number | undefined;
        height?: number | undefined;
        frame?: "none" | "iphone" | "device" | undefined;
        scale?: number | undefined;
    }>>>;
    statusBar: z.ZodDefault<z.ZodObject<{
        time: z.ZodDefault<z.ZodString>;
        battery: z.ZodDefault<z.ZodNumber>;
        charging: z.ZodDefault<z.ZodBoolean>;
        wifi: z.ZodDefault<z.ZodNumber>;
        cellular: z.ZodDefault<z.ZodNumber>;
        carrier: z.ZodDefault<z.ZodString>;
        visible: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strict>>;
    participants: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        avatar: z.ZodOptional<z.ZodString>;
        color: z.ZodDefault<z.ZodString>;
        isSelf: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strict>>;
    contact: z.ZodObject<{
        kind: z.ZodOptional<z.ZodEnum<{
            direct: "direct";
            group: "group";
        }>>;
        name: z.ZodString;
        subtitle: z.ZodDefault<z.ZodString>;
        avatar: z.ZodOptional<z.ZodString>;
        participantIds: z.ZodArray<z.ZodString>;
    }, z.core.$strict>;
    header: z.ZodOptional<z.ZodObject<{
        transport: z.ZodDefault<z.ZodEnum<{
            imessage: "imessage";
            sms: "sms";
            rcs: "rcs";
        }>>;
        backCount: z.ZodDefault<z.ZodNumber>;
        video: z.ZodDefault<z.ZodEnum<{
            enabled: "enabled";
            disabled: "disabled";
            hidden: "hidden";
        }>>;
        call: z.ZodDefault<z.ZodEnum<{
            enabled: "enabled";
            disabled: "disabled";
            hidden: "hidden";
        }>>;
    }, z.core.$strict>>;
    conversation: z.ZodOptional<z.ZodObject<{
        muted: z.ZodDefault<z.ZodBoolean>;
        focus: z.ZodOptional<z.ZodObject<{
            visible: z.ZodDefault<z.ZodBoolean>;
            name: z.ZodString;
            notifyAnyway: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strict>>;
        unread: z.ZodOptional<z.ZodObject<{
            visible: z.ZodDefault<z.ZodBoolean>;
            messageId: z.ZodString;
            count: z.ZodDefault<z.ZodNumber>;
        }, z.core.$strict>>;
        pinned: z.ZodOptional<z.ZodObject<{
            visible: z.ZodDefault<z.ZodBoolean>;
            messageId: z.ZodString;
            label: z.ZodDefault<z.ZodString>;
        }, z.core.$strict>>;
    }, z.core.$strict>>;
    interactions: z.ZodOptional<z.ZodObject<{
        attachmentTray: z.ZodOptional<z.ZodObject<{
            visible: z.ZodDefault<z.ZodBoolean>;
            kind: z.ZodDefault<z.ZodEnum<{
                apps: "apps";
                photos: "photos";
                stickers: "stickers";
            }>>;
            items: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                url: z.ZodOptional<z.ZodString>;
                emoji: z.ZodOptional<z.ZodString>;
                label: z.ZodDefault<z.ZodString>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
        tapbackPicker: z.ZodOptional<z.ZodObject<{
            visible: z.ZodDefault<z.ZodBoolean>;
            messageId: z.ZodString;
            selectedEmoji: z.ZodDefault<z.ZodString>;
            emojis: z.ZodDefault<z.ZodArray<z.ZodString>>;
            showMenu: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strict>>;
        editHistory: z.ZodOptional<z.ZodObject<{
            visible: z.ZodDefault<z.ZodBoolean>;
            messageId: z.ZodString;
        }, z.core.$strict>>;
    }, z.core.$strict>>;
    messages: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        senderId: z.ZodString;
        at: z.ZodDefault<z.ZodNumber>;
        kind: z.ZodDefault<z.ZodEnum<{
            file: "file";
            link: "link";
            text: "text";
            video: "video";
            image: "image";
            voice: "voice";
            location: "location";
            contact: "contact";
            sticker: "sticker";
            poll: "poll";
            payment: "payment";
            system: "system";
        }>>;
        text: z.ZodDefault<z.ZodString>;
        textRuns: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            text: z.ZodString;
            bold: z.ZodDefault<z.ZodBoolean>;
            italic: z.ZodDefault<z.ZodBoolean>;
            underline: z.ZodDefault<z.ZodBoolean>;
            strikethrough: z.ZodDefault<z.ZodBoolean>;
            effect: z.ZodDefault<z.ZodEnum<{
                none: "none";
                big: "big";
                small: "small";
                shake: "shake";
                nod: "nod";
                explode: "explode";
                ripple: "ripple";
                bloom: "bloom";
                jitter: "jitter";
            }>>;
        }, z.core.$strict>>>;
        stickers: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            emoji: z.ZodDefault<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            x: z.ZodDefault<z.ZodNumber>;
            y: z.ZodDefault<z.ZodNumber>;
            scale: z.ZodDefault<z.ZodNumber>;
            rotation: z.ZodDefault<z.ZodNumber>;
            zIndex: z.ZodDefault<z.ZodNumber>;
            at: z.ZodDefault<z.ZodNumber>;
            participantId: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>>;
        timestamp: z.ZodDefault<z.ZodString>;
        dateLabel: z.ZodDefault<z.ZodString>;
        status: z.ZodDefault<z.ZodEnum<{
            sending: "sending";
            sent: "sent";
            delivered: "delivered";
            read: "read";
            failed: "failed";
        }>>;
        statusAt: z.ZodOptional<z.ZodNumber>;
        statusText: z.ZodDefault<z.ZodString>;
        edited: z.ZodDefault<z.ZodBoolean>;
        editedAt: z.ZodDefault<z.ZodString>;
        editHistory: z.ZodOptional<z.ZodObject<{
            versions: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                text: z.ZodString;
                editedAt: z.ZodDefault<z.ZodString>;
            }, z.core.$strict>>;
        }, z.core.$strict>>;
        unsent: z.ZodDefault<z.ZodBoolean>;
        scheduledAt: z.ZodOptional<z.ZodString>;
        readBy: z.ZodOptional<z.ZodArray<z.ZodString>>;
        replyTo: z.ZodOptional<z.ZodString>;
        reactions: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            emoji: z.ZodString;
            participantId: z.ZodString;
            at: z.ZodDefault<z.ZodNumber>;
        }, z.core.$strict>>>;
        effect: z.ZodDefault<z.ZodEnum<{
            none: "none";
            shake: "shake";
            ripple: "ripple";
            bloom: "bloom";
            jitter: "jitter";
            slam: "slam";
            loud: "loud";
            gentle: "gentle";
            "invisible-ink": "invisible-ink";
        }>>;
        presentation: z.ZodDefault<z.ZodObject<{
            opacity: z.ZodDefault<z.ZodNumber>;
            scale: z.ZodDefault<z.ZodNumber>;
            offsetX: z.ZodDefault<z.ZodNumber>;
            offsetY: z.ZodDefault<z.ZodNumber>;
        }, z.core.$strict>>;
        media: z.ZodOptional<z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            videoUrl: z.ZodOptional<z.ZodString>;
            alt: z.ZodDefault<z.ZodString>;
            width: z.ZodDefault<z.ZodNumber>;
            height: z.ZodDefault<z.ZodNumber>;
            duration: z.ZodDefault<z.ZodNumber>;
            poster: z.ZodOptional<z.ZodString>;
            waveform: z.ZodDefault<z.ZodArray<z.ZodNumber>>;
            transcript: z.ZodOptional<z.ZodString>;
            playhead: z.ZodDefault<z.ZodNumber>;
            playbackRate: z.ZodDefault<z.ZodNumber>;
            playing: z.ZodDefault<z.ZodBoolean>;
            keep: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strict>>;
        file: z.ZodOptional<z.ZodObject<{
            name: z.ZodString;
            size: z.ZodDefault<z.ZodNumber>;
            mimeType: z.ZodDefault<z.ZodString>;
        }, z.core.$strict>>;
        link: z.ZodOptional<z.ZodObject<{
            url: z.ZodString;
            title: z.ZodString;
            description: z.ZodDefault<z.ZodString>;
            image: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>;
        location: z.ZodOptional<z.ZodObject<{
            latitude: z.ZodNumber;
            longitude: z.ZodNumber;
            label: z.ZodString;
            address: z.ZodDefault<z.ZodString>;
        }, z.core.$strict>>;
        sharedContact: z.ZodOptional<z.ZodObject<{
            name: z.ZodString;
            phone: z.ZodDefault<z.ZodString>;
            avatar: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>;
        sticker: z.ZodOptional<z.ZodObject<{
            emoji: z.ZodDefault<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            alt: z.ZodDefault<z.ZodString>;
        }, z.core.$strict>>;
        poll: z.ZodOptional<z.ZodObject<{
            question: z.ZodString;
            options: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                text: z.ZodString;
                votes: z.ZodDefault<z.ZodNumber>;
            }, z.core.$strict>>;
            totalVotes: z.ZodDefault<z.ZodNumber>;
        }, z.core.$strict>>;
        payment: z.ZodOptional<z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodDefault<z.ZodString>;
            note: z.ZodDefault<z.ZodString>;
        }, z.core.$strict>>;
        extensions: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodType<JsonValue, unknown, z.core.$ZodTypeInternals<JsonValue, unknown>>>>;
    }, z.core.$strict>>>;
    composer: z.ZodDefault<z.ZodObject<{
        text: z.ZodDefault<z.ZodString>;
        placeholder: z.ZodDefault<z.ZodString>;
        typing: z.ZodDefault<z.ZodObject<{
            visible: z.ZodDefault<z.ZodBoolean>;
            participantId: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>;
        keyboard: z.ZodDefault<z.ZodEnum<{
            emoji: "emoji";
            hidden: "hidden";
            alphabetic: "alphabetic";
        }>>;
        focused: z.ZodDefault<z.ZodBoolean>;
        context: z.ZodOptional<z.ZodObject<{
            mode: z.ZodDefault<z.ZodEnum<{
                normal: "normal";
                reply: "reply";
                edit: "edit";
                recording: "recording";
                scheduled: "scheduled";
            }>>;
            messageId: z.ZodOptional<z.ZodString>;
            scheduledAt: z.ZodDefault<z.ZodString>;
            recording: z.ZodDefault<z.ZodObject<{
                duration: z.ZodDefault<z.ZodNumber>;
                locked: z.ZodDefault<z.ZodBoolean>;
                paused: z.ZodDefault<z.ZodBoolean>;
                waveform: z.ZodDefault<z.ZodArray<z.ZodNumber>>;
            }, z.core.$strict>>;
        }, z.core.$strict>>;
        selection: z.ZodOptional<z.ZodObject<{
            start: z.ZodNumber;
            end: z.ZodNumber;
            showCaret: z.ZodDefault<z.ZodBoolean>;
            showHandles: z.ZodDefault<z.ZodBoolean>;
            visible: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strict>>;
    }, z.core.$strict>>;
    appearance: z.ZodPrefault<z.ZodObject<{
        wallpaper: z.ZodDefault<z.ZodEnum<{
            custom: "custom";
            solid: "solid";
            gradient: "gradient";
            paper: "paper";
        }>>;
        color: z.ZodDefault<z.ZodString>;
        showTimestamps: z.ZodDefault<z.ZodBoolean>;
        showAvatars: z.ZodDefault<z.ZodBoolean>;
        bubbleRadius: z.ZodOptional<z.ZodNumber>;
        textSize: z.ZodOptional<z.ZodNumber>;
        screenEffect: z.ZodDefault<z.ZodEnum<{
            none: "none";
            confetti: "confetti";
            balloons: "balloons";
            hearts: "hearts";
            lasers: "lasers";
            fireworks: "fireworks";
            echo: "echo";
            spotlight: "spotlight";
        }>>;
    }, z.core.$strict>>;
    timeline: z.ZodDefault<z.ZodObject<{
        duration: z.ZodDefault<z.ZodNumber>;
        loop: z.ZodDefault<z.ZodBoolean>;
        fps: z.ZodDefault<z.ZodNumber>;
        tracks: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            path: z.ZodString;
            keyframes: z.ZodArray<z.ZodObject<{
                at: z.ZodNumber;
                value: z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull]>;
                easing: z.ZodDefault<z.ZodEnum<{
                    typewriter: "typewriter";
                    step: "step";
                    linear: "linear";
                    ease: "ease";
                }>>;
            }, z.core.$strict>>;
        }, z.core.$strict>>>;
    }, z.core.$strict>>;
    extensions: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodType<JsonValue, unknown, z.core.$ZodTypeInternals<JsonValue, unknown>>>>;
}, z.core.$strict>, z.ZodTransform<{
    appearance: {
        bubbleRadius: number;
        textSize: number;
        wallpaper: "custom" | "solid" | "gradient" | "paper";
        color: string;
        showTimestamps: boolean;
        showAvatars: boolean;
        screenEffect: "none" | "confetti" | "balloons" | "hearts" | "lasers" | "fireworks" | "echo" | "spotlight";
    };
    version: 1;
    id: string;
    title: string;
    rendererVersion: "2026.1";
    platform: "imessage" | "whatsapp" | "telegram" | "instagram" | "google-messages";
    theme: "light" | "dark";
    device: {
        width: number;
        height: number;
        frame: "none" | "iphone" | "device";
        scale: number;
        model?: "iphone-17-pro" | "iphone-17-pro-max" | "pixel-11" | "pixel-11-pro" | "pixel-11-pro-xl" | "galaxy-s26" | "galaxy-s26-plus" | "galaxy-s26-ultra" | undefined;
    };
    statusBar: {
        time: string;
        battery: number;
        charging: boolean;
        wifi: number;
        cellular: number;
        carrier: string;
        visible: boolean;
    };
    participants: {
        id: string;
        name: string;
        color: string;
        isSelf: boolean;
        avatar?: string | undefined;
    }[];
    contact: {
        name: string;
        subtitle: string;
        participantIds: string[];
        kind?: "direct" | "group" | undefined;
        avatar?: string | undefined;
    };
    messages: {
        id: string;
        senderId: string;
        at: number;
        kind: "file" | "link" | "text" | "video" | "image" | "voice" | "location" | "contact" | "sticker" | "poll" | "payment" | "system";
        text: string;
        timestamp: string;
        dateLabel: string;
        status: "sending" | "sent" | "delivered" | "read" | "failed";
        statusText: string;
        edited: boolean;
        editedAt: string;
        unsent: boolean;
        reactions: {
            id: string;
            emoji: string;
            participantId: string;
            at: number;
        }[];
        effect: "none" | "shake" | "ripple" | "bloom" | "jitter" | "slam" | "loud" | "gentle" | "invisible-ink";
        presentation: {
            opacity: number;
            scale: number;
            offsetX: number;
            offsetY: number;
        };
        extensions: Record<string, JsonValue>;
        textRuns?: {
            id: string;
            text: string;
            bold: boolean;
            italic: boolean;
            underline: boolean;
            strikethrough: boolean;
            effect: "none" | "big" | "small" | "shake" | "nod" | "explode" | "ripple" | "bloom" | "jitter";
        }[] | undefined;
        stickers?: {
            id: string;
            emoji: string;
            x: number;
            y: number;
            scale: number;
            rotation: number;
            zIndex: number;
            at: number;
            url?: string | undefined;
            participantId?: string | undefined;
        }[] | undefined;
        statusAt?: number | undefined;
        editHistory?: {
            versions: {
                id: string;
                text: string;
                editedAt: string;
            }[];
        } | undefined;
        scheduledAt?: string | undefined;
        readBy?: string[] | undefined;
        replyTo?: string | undefined;
        media?: {
            alt: string;
            width: number;
            height: number;
            duration: number;
            waveform: number[];
            playhead: number;
            playbackRate: number;
            playing: boolean;
            keep: boolean;
            url?: string | undefined;
            videoUrl?: string | undefined;
            poster?: string | undefined;
            transcript?: string | undefined;
        } | undefined;
        file?: {
            name: string;
            size: number;
            mimeType: string;
        } | undefined;
        link?: {
            url: string;
            title: string;
            description: string;
            image?: string | undefined;
        } | undefined;
        location?: {
            latitude: number;
            longitude: number;
            label: string;
            address: string;
        } | undefined;
        sharedContact?: {
            name: string;
            phone: string;
            avatar?: string | undefined;
        } | undefined;
        sticker?: {
            emoji: string;
            alt: string;
            url?: string | undefined;
        } | undefined;
        poll?: {
            question: string;
            options: {
                id: string;
                text: string;
                votes: number;
            }[];
            totalVotes: number;
        } | undefined;
        payment?: {
            amount: number;
            currency: string;
            note: string;
        } | undefined;
    }[];
    composer: {
        text: string;
        placeholder: string;
        typing: {
            visible: boolean;
            participantId?: string | undefined;
        };
        keyboard: "emoji" | "hidden" | "alphabetic";
        focused: boolean;
        context?: {
            mode: "normal" | "reply" | "edit" | "recording" | "scheduled";
            scheduledAt: string;
            recording: {
                duration: number;
                locked: boolean;
                paused: boolean;
                waveform: number[];
            };
            messageId?: string | undefined;
        } | undefined;
        selection?: {
            start: number;
            end: number;
            showCaret: boolean;
            showHandles: boolean;
            visible?: boolean | undefined;
        } | undefined;
    };
    timeline: {
        duration: number;
        loop: boolean;
        fps: number;
        tracks: {
            id: string;
            path: string;
            keyframes: {
                at: number;
                value: string | number | boolean | null;
                easing: "typewriter" | "step" | "linear" | "ease";
            }[];
        }[];
    };
    extensions: Record<string, JsonValue>;
    header?: {
        transport: "imessage" | "sms" | "rcs";
        backCount: number;
        video: "enabled" | "disabled" | "hidden";
        call: "enabled" | "disabled" | "hidden";
    } | undefined;
    conversation?: {
        muted: boolean;
        focus?: {
            visible: boolean;
            name: string;
            notifyAnyway: boolean;
        } | undefined;
        unread?: {
            visible: boolean;
            messageId: string;
            count: number;
        } | undefined;
        pinned?: {
            visible: boolean;
            messageId: string;
            label: string;
        } | undefined;
    } | undefined;
    interactions?: {
        attachmentTray?: {
            visible: boolean;
            kind: "apps" | "photos" | "stickers";
            items?: {
                id: string;
                label: string;
                url?: string | undefined;
                emoji?: string | undefined;
            }[] | undefined;
        } | undefined;
        tapbackPicker?: {
            visible: boolean;
            messageId: string;
            selectedEmoji: string;
            emojis: string[];
            showMenu: boolean;
        } | undefined;
        editHistory?: {
            visible: boolean;
            messageId: string;
        } | undefined;
    } | undefined;
}, {
    version: 1;
    id: string;
    title: string;
    rendererVersion: "2026.1";
    platform: "imessage" | "whatsapp" | "telegram" | "instagram" | "google-messages";
    theme: "light" | "dark";
    device: {
        width: number;
        height: number;
        frame: "none" | "iphone" | "device";
        scale: number;
        model?: "iphone-17-pro" | "iphone-17-pro-max" | "pixel-11" | "pixel-11-pro" | "pixel-11-pro-xl" | "galaxy-s26" | "galaxy-s26-plus" | "galaxy-s26-ultra" | undefined;
    };
    statusBar: {
        time: string;
        battery: number;
        charging: boolean;
        wifi: number;
        cellular: number;
        carrier: string;
        visible: boolean;
    };
    participants: {
        id: string;
        name: string;
        color: string;
        isSelf: boolean;
        avatar?: string | undefined;
    }[];
    contact: {
        name: string;
        subtitle: string;
        participantIds: string[];
        kind?: "direct" | "group" | undefined;
        avatar?: string | undefined;
    };
    messages: {
        id: string;
        senderId: string;
        at: number;
        kind: "file" | "link" | "text" | "video" | "image" | "voice" | "location" | "contact" | "sticker" | "poll" | "payment" | "system";
        text: string;
        timestamp: string;
        dateLabel: string;
        status: "sending" | "sent" | "delivered" | "read" | "failed";
        statusText: string;
        edited: boolean;
        editedAt: string;
        unsent: boolean;
        reactions: {
            id: string;
            emoji: string;
            participantId: string;
            at: number;
        }[];
        effect: "none" | "shake" | "ripple" | "bloom" | "jitter" | "slam" | "loud" | "gentle" | "invisible-ink";
        presentation: {
            opacity: number;
            scale: number;
            offsetX: number;
            offsetY: number;
        };
        extensions: Record<string, JsonValue>;
        textRuns?: {
            id: string;
            text: string;
            bold: boolean;
            italic: boolean;
            underline: boolean;
            strikethrough: boolean;
            effect: "none" | "big" | "small" | "shake" | "nod" | "explode" | "ripple" | "bloom" | "jitter";
        }[] | undefined;
        stickers?: {
            id: string;
            emoji: string;
            x: number;
            y: number;
            scale: number;
            rotation: number;
            zIndex: number;
            at: number;
            url?: string | undefined;
            participantId?: string | undefined;
        }[] | undefined;
        statusAt?: number | undefined;
        editHistory?: {
            versions: {
                id: string;
                text: string;
                editedAt: string;
            }[];
        } | undefined;
        scheduledAt?: string | undefined;
        readBy?: string[] | undefined;
        replyTo?: string | undefined;
        media?: {
            alt: string;
            width: number;
            height: number;
            duration: number;
            waveform: number[];
            playhead: number;
            playbackRate: number;
            playing: boolean;
            keep: boolean;
            url?: string | undefined;
            videoUrl?: string | undefined;
            poster?: string | undefined;
            transcript?: string | undefined;
        } | undefined;
        file?: {
            name: string;
            size: number;
            mimeType: string;
        } | undefined;
        link?: {
            url: string;
            title: string;
            description: string;
            image?: string | undefined;
        } | undefined;
        location?: {
            latitude: number;
            longitude: number;
            label: string;
            address: string;
        } | undefined;
        sharedContact?: {
            name: string;
            phone: string;
            avatar?: string | undefined;
        } | undefined;
        sticker?: {
            emoji: string;
            alt: string;
            url?: string | undefined;
        } | undefined;
        poll?: {
            question: string;
            options: {
                id: string;
                text: string;
                votes: number;
            }[];
            totalVotes: number;
        } | undefined;
        payment?: {
            amount: number;
            currency: string;
            note: string;
        } | undefined;
    }[];
    composer: {
        text: string;
        placeholder: string;
        typing: {
            visible: boolean;
            participantId?: string | undefined;
        };
        keyboard: "emoji" | "hidden" | "alphabetic";
        focused: boolean;
        context?: {
            mode: "normal" | "reply" | "edit" | "recording" | "scheduled";
            scheduledAt: string;
            recording: {
                duration: number;
                locked: boolean;
                paused: boolean;
                waveform: number[];
            };
            messageId?: string | undefined;
        } | undefined;
        selection?: {
            start: number;
            end: number;
            showCaret: boolean;
            showHandles: boolean;
            visible?: boolean | undefined;
        } | undefined;
    };
    appearance: {
        wallpaper: "custom" | "solid" | "gradient" | "paper";
        color: string;
        showTimestamps: boolean;
        showAvatars: boolean;
        screenEffect: "none" | "confetti" | "balloons" | "hearts" | "lasers" | "fireworks" | "echo" | "spotlight";
        bubbleRadius?: number | undefined;
        textSize?: number | undefined;
    };
    timeline: {
        duration: number;
        loop: boolean;
        fps: number;
        tracks: {
            id: string;
            path: string;
            keyframes: {
                at: number;
                value: string | number | boolean | null;
                easing: "typewriter" | "step" | "linear" | "ease";
            }[];
        }[];
    };
    extensions: Record<string, JsonValue>;
    header?: {
        transport: "imessage" | "sms" | "rcs";
        backCount: number;
        video: "enabled" | "disabled" | "hidden";
        call: "enabled" | "disabled" | "hidden";
    } | undefined;
    conversation?: {
        muted: boolean;
        focus?: {
            visible: boolean;
            name: string;
            notifyAnyway: boolean;
        } | undefined;
        unread?: {
            visible: boolean;
            messageId: string;
            count: number;
        } | undefined;
        pinned?: {
            visible: boolean;
            messageId: string;
            label: string;
        } | undefined;
    } | undefined;
    interactions?: {
        attachmentTray?: {
            visible: boolean;
            kind: "apps" | "photos" | "stickers";
            items?: {
                id: string;
                label: string;
                url?: string | undefined;
                emoji?: string | undefined;
            }[] | undefined;
        } | undefined;
        tapbackPicker?: {
            visible: boolean;
            messageId: string;
            selectedEmoji: string;
            emojis: string[];
            showMenu: boolean;
        } | undefined;
        editHistory?: {
            visible: boolean;
            messageId: string;
        } | undefined;
    } | undefined;
}>>;
export type Scene = z.infer<typeof SceneBaseSchema>;
/** Integer animation behavior follows the schema, not a list of field names. */
export declare function isIntegerPresentationField(path: string): boolean;
export declare const SceneSchema: z.ZodPipe<z.ZodObject<{
    version: z.ZodLiteral<1>;
    id: z.ZodString;
    title: z.ZodDefault<z.ZodString>;
    rendererVersion: z.ZodDefault<z.ZodLiteral<"2026.1">>;
    platform: z.ZodDefault<z.ZodEnum<{
        imessage: "imessage";
        whatsapp: "whatsapp";
        telegram: "telegram";
        instagram: "instagram";
        "google-messages": "google-messages";
    }>>;
    theme: z.ZodDefault<z.ZodEnum<{
        light: "light";
        dark: "dark";
    }>>;
    device: z.ZodPrefault<z.ZodPipe<z.ZodObject<{
        model: z.ZodOptional<z.ZodEnum<{
            "iphone-17-pro": "iphone-17-pro";
            "iphone-17-pro-max": "iphone-17-pro-max";
            "pixel-11": "pixel-11";
            "pixel-11-pro": "pixel-11-pro";
            "pixel-11-pro-xl": "pixel-11-pro-xl";
            "galaxy-s26": "galaxy-s26";
            "galaxy-s26-plus": "galaxy-s26-plus";
            "galaxy-s26-ultra": "galaxy-s26-ultra";
        }>>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        frame: z.ZodOptional<z.ZodEnum<{
            none: "none";
            iphone: "iphone";
            device: "device";
        }>>;
        scale: z.ZodOptional<z.ZodNumber>;
    }, z.core.$strict>, z.ZodTransform<{
        width: number;
        height: number;
        frame: "none" | "iphone" | "device";
        scale: number;
        model?: "iphone-17-pro" | "iphone-17-pro-max" | "pixel-11" | "pixel-11-pro" | "pixel-11-pro-xl" | "galaxy-s26" | "galaxy-s26-plus" | "galaxy-s26-ultra" | undefined;
    }, {
        model?: "iphone-17-pro" | "iphone-17-pro-max" | "pixel-11" | "pixel-11-pro" | "pixel-11-pro-xl" | "galaxy-s26" | "galaxy-s26-plus" | "galaxy-s26-ultra" | undefined;
        width?: number | undefined;
        height?: number | undefined;
        frame?: "none" | "iphone" | "device" | undefined;
        scale?: number | undefined;
    }>>>;
    statusBar: z.ZodDefault<z.ZodObject<{
        time: z.ZodDefault<z.ZodString>;
        battery: z.ZodDefault<z.ZodNumber>;
        charging: z.ZodDefault<z.ZodBoolean>;
        wifi: z.ZodDefault<z.ZodNumber>;
        cellular: z.ZodDefault<z.ZodNumber>;
        carrier: z.ZodDefault<z.ZodString>;
        visible: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strict>>;
    participants: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        avatar: z.ZodOptional<z.ZodString>;
        color: z.ZodDefault<z.ZodString>;
        isSelf: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strict>>;
    contact: z.ZodObject<{
        kind: z.ZodOptional<z.ZodEnum<{
            direct: "direct";
            group: "group";
        }>>;
        name: z.ZodString;
        subtitle: z.ZodDefault<z.ZodString>;
        avatar: z.ZodOptional<z.ZodString>;
        participantIds: z.ZodArray<z.ZodString>;
    }, z.core.$strict>;
    header: z.ZodOptional<z.ZodObject<{
        transport: z.ZodDefault<z.ZodEnum<{
            imessage: "imessage";
            sms: "sms";
            rcs: "rcs";
        }>>;
        backCount: z.ZodDefault<z.ZodNumber>;
        video: z.ZodDefault<z.ZodEnum<{
            enabled: "enabled";
            disabled: "disabled";
            hidden: "hidden";
        }>>;
        call: z.ZodDefault<z.ZodEnum<{
            enabled: "enabled";
            disabled: "disabled";
            hidden: "hidden";
        }>>;
    }, z.core.$strict>>;
    conversation: z.ZodOptional<z.ZodObject<{
        muted: z.ZodDefault<z.ZodBoolean>;
        focus: z.ZodOptional<z.ZodObject<{
            visible: z.ZodDefault<z.ZodBoolean>;
            name: z.ZodString;
            notifyAnyway: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strict>>;
        unread: z.ZodOptional<z.ZodObject<{
            visible: z.ZodDefault<z.ZodBoolean>;
            messageId: z.ZodString;
            count: z.ZodDefault<z.ZodNumber>;
        }, z.core.$strict>>;
        pinned: z.ZodOptional<z.ZodObject<{
            visible: z.ZodDefault<z.ZodBoolean>;
            messageId: z.ZodString;
            label: z.ZodDefault<z.ZodString>;
        }, z.core.$strict>>;
    }, z.core.$strict>>;
    interactions: z.ZodOptional<z.ZodObject<{
        attachmentTray: z.ZodOptional<z.ZodObject<{
            visible: z.ZodDefault<z.ZodBoolean>;
            kind: z.ZodDefault<z.ZodEnum<{
                apps: "apps";
                photos: "photos";
                stickers: "stickers";
            }>>;
            items: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                url: z.ZodOptional<z.ZodString>;
                emoji: z.ZodOptional<z.ZodString>;
                label: z.ZodDefault<z.ZodString>;
            }, z.core.$strict>>>;
        }, z.core.$strict>>;
        tapbackPicker: z.ZodOptional<z.ZodObject<{
            visible: z.ZodDefault<z.ZodBoolean>;
            messageId: z.ZodString;
            selectedEmoji: z.ZodDefault<z.ZodString>;
            emojis: z.ZodDefault<z.ZodArray<z.ZodString>>;
            showMenu: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strict>>;
        editHistory: z.ZodOptional<z.ZodObject<{
            visible: z.ZodDefault<z.ZodBoolean>;
            messageId: z.ZodString;
        }, z.core.$strict>>;
    }, z.core.$strict>>;
    messages: z.ZodDefault<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        senderId: z.ZodString;
        at: z.ZodDefault<z.ZodNumber>;
        kind: z.ZodDefault<z.ZodEnum<{
            file: "file";
            link: "link";
            text: "text";
            video: "video";
            image: "image";
            voice: "voice";
            location: "location";
            contact: "contact";
            sticker: "sticker";
            poll: "poll";
            payment: "payment";
            system: "system";
        }>>;
        text: z.ZodDefault<z.ZodString>;
        textRuns: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            text: z.ZodString;
            bold: z.ZodDefault<z.ZodBoolean>;
            italic: z.ZodDefault<z.ZodBoolean>;
            underline: z.ZodDefault<z.ZodBoolean>;
            strikethrough: z.ZodDefault<z.ZodBoolean>;
            effect: z.ZodDefault<z.ZodEnum<{
                none: "none";
                big: "big";
                small: "small";
                shake: "shake";
                nod: "nod";
                explode: "explode";
                ripple: "ripple";
                bloom: "bloom";
                jitter: "jitter";
            }>>;
        }, z.core.$strict>>>;
        stickers: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            emoji: z.ZodDefault<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            x: z.ZodDefault<z.ZodNumber>;
            y: z.ZodDefault<z.ZodNumber>;
            scale: z.ZodDefault<z.ZodNumber>;
            rotation: z.ZodDefault<z.ZodNumber>;
            zIndex: z.ZodDefault<z.ZodNumber>;
            at: z.ZodDefault<z.ZodNumber>;
            participantId: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>>;
        timestamp: z.ZodDefault<z.ZodString>;
        dateLabel: z.ZodDefault<z.ZodString>;
        status: z.ZodDefault<z.ZodEnum<{
            sending: "sending";
            sent: "sent";
            delivered: "delivered";
            read: "read";
            failed: "failed";
        }>>;
        statusAt: z.ZodOptional<z.ZodNumber>;
        statusText: z.ZodDefault<z.ZodString>;
        edited: z.ZodDefault<z.ZodBoolean>;
        editedAt: z.ZodDefault<z.ZodString>;
        editHistory: z.ZodOptional<z.ZodObject<{
            versions: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                text: z.ZodString;
                editedAt: z.ZodDefault<z.ZodString>;
            }, z.core.$strict>>;
        }, z.core.$strict>>;
        unsent: z.ZodDefault<z.ZodBoolean>;
        scheduledAt: z.ZodOptional<z.ZodString>;
        readBy: z.ZodOptional<z.ZodArray<z.ZodString>>;
        replyTo: z.ZodOptional<z.ZodString>;
        reactions: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            emoji: z.ZodString;
            participantId: z.ZodString;
            at: z.ZodDefault<z.ZodNumber>;
        }, z.core.$strict>>>;
        effect: z.ZodDefault<z.ZodEnum<{
            none: "none";
            shake: "shake";
            ripple: "ripple";
            bloom: "bloom";
            jitter: "jitter";
            slam: "slam";
            loud: "loud";
            gentle: "gentle";
            "invisible-ink": "invisible-ink";
        }>>;
        presentation: z.ZodDefault<z.ZodObject<{
            opacity: z.ZodDefault<z.ZodNumber>;
            scale: z.ZodDefault<z.ZodNumber>;
            offsetX: z.ZodDefault<z.ZodNumber>;
            offsetY: z.ZodDefault<z.ZodNumber>;
        }, z.core.$strict>>;
        media: z.ZodOptional<z.ZodObject<{
            url: z.ZodOptional<z.ZodString>;
            videoUrl: z.ZodOptional<z.ZodString>;
            alt: z.ZodDefault<z.ZodString>;
            width: z.ZodDefault<z.ZodNumber>;
            height: z.ZodDefault<z.ZodNumber>;
            duration: z.ZodDefault<z.ZodNumber>;
            poster: z.ZodOptional<z.ZodString>;
            waveform: z.ZodDefault<z.ZodArray<z.ZodNumber>>;
            transcript: z.ZodOptional<z.ZodString>;
            playhead: z.ZodDefault<z.ZodNumber>;
            playbackRate: z.ZodDefault<z.ZodNumber>;
            playing: z.ZodDefault<z.ZodBoolean>;
            keep: z.ZodDefault<z.ZodBoolean>;
        }, z.core.$strict>>;
        file: z.ZodOptional<z.ZodObject<{
            name: z.ZodString;
            size: z.ZodDefault<z.ZodNumber>;
            mimeType: z.ZodDefault<z.ZodString>;
        }, z.core.$strict>>;
        link: z.ZodOptional<z.ZodObject<{
            url: z.ZodString;
            title: z.ZodString;
            description: z.ZodDefault<z.ZodString>;
            image: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>;
        location: z.ZodOptional<z.ZodObject<{
            latitude: z.ZodNumber;
            longitude: z.ZodNumber;
            label: z.ZodString;
            address: z.ZodDefault<z.ZodString>;
        }, z.core.$strict>>;
        sharedContact: z.ZodOptional<z.ZodObject<{
            name: z.ZodString;
            phone: z.ZodDefault<z.ZodString>;
            avatar: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>;
        sticker: z.ZodOptional<z.ZodObject<{
            emoji: z.ZodDefault<z.ZodString>;
            url: z.ZodOptional<z.ZodString>;
            alt: z.ZodDefault<z.ZodString>;
        }, z.core.$strict>>;
        poll: z.ZodOptional<z.ZodObject<{
            question: z.ZodString;
            options: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                text: z.ZodString;
                votes: z.ZodDefault<z.ZodNumber>;
            }, z.core.$strict>>;
            totalVotes: z.ZodDefault<z.ZodNumber>;
        }, z.core.$strict>>;
        payment: z.ZodOptional<z.ZodObject<{
            amount: z.ZodNumber;
            currency: z.ZodDefault<z.ZodString>;
            note: z.ZodDefault<z.ZodString>;
        }, z.core.$strict>>;
        extensions: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodType<JsonValue, unknown, z.core.$ZodTypeInternals<JsonValue, unknown>>>>;
    }, z.core.$strict>>>;
    composer: z.ZodDefault<z.ZodObject<{
        text: z.ZodDefault<z.ZodString>;
        placeholder: z.ZodDefault<z.ZodString>;
        typing: z.ZodDefault<z.ZodObject<{
            visible: z.ZodDefault<z.ZodBoolean>;
            participantId: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>>;
        keyboard: z.ZodDefault<z.ZodEnum<{
            emoji: "emoji";
            hidden: "hidden";
            alphabetic: "alphabetic";
        }>>;
        focused: z.ZodDefault<z.ZodBoolean>;
        context: z.ZodOptional<z.ZodObject<{
            mode: z.ZodDefault<z.ZodEnum<{
                normal: "normal";
                reply: "reply";
                edit: "edit";
                recording: "recording";
                scheduled: "scheduled";
            }>>;
            messageId: z.ZodOptional<z.ZodString>;
            scheduledAt: z.ZodDefault<z.ZodString>;
            recording: z.ZodDefault<z.ZodObject<{
                duration: z.ZodDefault<z.ZodNumber>;
                locked: z.ZodDefault<z.ZodBoolean>;
                paused: z.ZodDefault<z.ZodBoolean>;
                waveform: z.ZodDefault<z.ZodArray<z.ZodNumber>>;
            }, z.core.$strict>>;
        }, z.core.$strict>>;
        selection: z.ZodOptional<z.ZodObject<{
            start: z.ZodNumber;
            end: z.ZodNumber;
            showCaret: z.ZodDefault<z.ZodBoolean>;
            showHandles: z.ZodDefault<z.ZodBoolean>;
            visible: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strict>>;
    }, z.core.$strict>>;
    appearance: z.ZodPrefault<z.ZodObject<{
        wallpaper: z.ZodDefault<z.ZodEnum<{
            custom: "custom";
            solid: "solid";
            gradient: "gradient";
            paper: "paper";
        }>>;
        color: z.ZodDefault<z.ZodString>;
        showTimestamps: z.ZodDefault<z.ZodBoolean>;
        showAvatars: z.ZodDefault<z.ZodBoolean>;
        bubbleRadius: z.ZodOptional<z.ZodNumber>;
        textSize: z.ZodOptional<z.ZodNumber>;
        screenEffect: z.ZodDefault<z.ZodEnum<{
            none: "none";
            confetti: "confetti";
            balloons: "balloons";
            hearts: "hearts";
            lasers: "lasers";
            fireworks: "fireworks";
            echo: "echo";
            spotlight: "spotlight";
        }>>;
    }, z.core.$strict>>;
    timeline: z.ZodDefault<z.ZodObject<{
        duration: z.ZodDefault<z.ZodNumber>;
        loop: z.ZodDefault<z.ZodBoolean>;
        fps: z.ZodDefault<z.ZodNumber>;
        tracks: z.ZodDefault<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            path: z.ZodString;
            keyframes: z.ZodArray<z.ZodObject<{
                at: z.ZodNumber;
                value: z.ZodUnion<readonly [z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull]>;
                easing: z.ZodDefault<z.ZodEnum<{
                    typewriter: "typewriter";
                    step: "step";
                    linear: "linear";
                    ease: "ease";
                }>>;
            }, z.core.$strict>>;
        }, z.core.$strict>>>;
    }, z.core.$strict>>;
    extensions: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodType<JsonValue, unknown, z.core.$ZodTypeInternals<JsonValue, unknown>>>>;
}, z.core.$strict>, z.ZodTransform<{
    appearance: {
        bubbleRadius: number;
        textSize: number;
        wallpaper: "custom" | "solid" | "gradient" | "paper";
        color: string;
        showTimestamps: boolean;
        showAvatars: boolean;
        screenEffect: "none" | "confetti" | "balloons" | "hearts" | "lasers" | "fireworks" | "echo" | "spotlight";
    };
    version: 1;
    id: string;
    title: string;
    rendererVersion: "2026.1";
    platform: "imessage" | "whatsapp" | "telegram" | "instagram" | "google-messages";
    theme: "light" | "dark";
    device: {
        width: number;
        height: number;
        frame: "none" | "iphone" | "device";
        scale: number;
        model?: "iphone-17-pro" | "iphone-17-pro-max" | "pixel-11" | "pixel-11-pro" | "pixel-11-pro-xl" | "galaxy-s26" | "galaxy-s26-plus" | "galaxy-s26-ultra" | undefined;
    };
    statusBar: {
        time: string;
        battery: number;
        charging: boolean;
        wifi: number;
        cellular: number;
        carrier: string;
        visible: boolean;
    };
    participants: {
        id: string;
        name: string;
        color: string;
        isSelf: boolean;
        avatar?: string | undefined;
    }[];
    contact: {
        name: string;
        subtitle: string;
        participantIds: string[];
        kind?: "direct" | "group" | undefined;
        avatar?: string | undefined;
    };
    messages: {
        id: string;
        senderId: string;
        at: number;
        kind: "file" | "link" | "text" | "video" | "image" | "voice" | "location" | "contact" | "sticker" | "poll" | "payment" | "system";
        text: string;
        timestamp: string;
        dateLabel: string;
        status: "sending" | "sent" | "delivered" | "read" | "failed";
        statusText: string;
        edited: boolean;
        editedAt: string;
        unsent: boolean;
        reactions: {
            id: string;
            emoji: string;
            participantId: string;
            at: number;
        }[];
        effect: "none" | "shake" | "ripple" | "bloom" | "jitter" | "slam" | "loud" | "gentle" | "invisible-ink";
        presentation: {
            opacity: number;
            scale: number;
            offsetX: number;
            offsetY: number;
        };
        extensions: Record<string, JsonValue>;
        textRuns?: {
            id: string;
            text: string;
            bold: boolean;
            italic: boolean;
            underline: boolean;
            strikethrough: boolean;
            effect: "none" | "big" | "small" | "shake" | "nod" | "explode" | "ripple" | "bloom" | "jitter";
        }[] | undefined;
        stickers?: {
            id: string;
            emoji: string;
            x: number;
            y: number;
            scale: number;
            rotation: number;
            zIndex: number;
            at: number;
            url?: string | undefined;
            participantId?: string | undefined;
        }[] | undefined;
        statusAt?: number | undefined;
        editHistory?: {
            versions: {
                id: string;
                text: string;
                editedAt: string;
            }[];
        } | undefined;
        scheduledAt?: string | undefined;
        readBy?: string[] | undefined;
        replyTo?: string | undefined;
        media?: {
            alt: string;
            width: number;
            height: number;
            duration: number;
            waveform: number[];
            playhead: number;
            playbackRate: number;
            playing: boolean;
            keep: boolean;
            url?: string | undefined;
            videoUrl?: string | undefined;
            poster?: string | undefined;
            transcript?: string | undefined;
        } | undefined;
        file?: {
            name: string;
            size: number;
            mimeType: string;
        } | undefined;
        link?: {
            url: string;
            title: string;
            description: string;
            image?: string | undefined;
        } | undefined;
        location?: {
            latitude: number;
            longitude: number;
            label: string;
            address: string;
        } | undefined;
        sharedContact?: {
            name: string;
            phone: string;
            avatar?: string | undefined;
        } | undefined;
        sticker?: {
            emoji: string;
            alt: string;
            url?: string | undefined;
        } | undefined;
        poll?: {
            question: string;
            options: {
                id: string;
                text: string;
                votes: number;
            }[];
            totalVotes: number;
        } | undefined;
        payment?: {
            amount: number;
            currency: string;
            note: string;
        } | undefined;
    }[];
    composer: {
        text: string;
        placeholder: string;
        typing: {
            visible: boolean;
            participantId?: string | undefined;
        };
        keyboard: "emoji" | "hidden" | "alphabetic";
        focused: boolean;
        context?: {
            mode: "normal" | "reply" | "edit" | "recording" | "scheduled";
            scheduledAt: string;
            recording: {
                duration: number;
                locked: boolean;
                paused: boolean;
                waveform: number[];
            };
            messageId?: string | undefined;
        } | undefined;
        selection?: {
            start: number;
            end: number;
            showCaret: boolean;
            showHandles: boolean;
            visible?: boolean | undefined;
        } | undefined;
    };
    timeline: {
        duration: number;
        loop: boolean;
        fps: number;
        tracks: {
            id: string;
            path: string;
            keyframes: {
                at: number;
                value: string | number | boolean | null;
                easing: "typewriter" | "step" | "linear" | "ease";
            }[];
        }[];
    };
    extensions: Record<string, JsonValue>;
    header?: {
        transport: "imessage" | "sms" | "rcs";
        backCount: number;
        video: "enabled" | "disabled" | "hidden";
        call: "enabled" | "disabled" | "hidden";
    } | undefined;
    conversation?: {
        muted: boolean;
        focus?: {
            visible: boolean;
            name: string;
            notifyAnyway: boolean;
        } | undefined;
        unread?: {
            visible: boolean;
            messageId: string;
            count: number;
        } | undefined;
        pinned?: {
            visible: boolean;
            messageId: string;
            label: string;
        } | undefined;
    } | undefined;
    interactions?: {
        attachmentTray?: {
            visible: boolean;
            kind: "apps" | "photos" | "stickers";
            items?: {
                id: string;
                label: string;
                url?: string | undefined;
                emoji?: string | undefined;
            }[] | undefined;
        } | undefined;
        tapbackPicker?: {
            visible: boolean;
            messageId: string;
            selectedEmoji: string;
            emojis: string[];
            showMenu: boolean;
        } | undefined;
        editHistory?: {
            visible: boolean;
            messageId: string;
        } | undefined;
    } | undefined;
}, {
    version: 1;
    id: string;
    title: string;
    rendererVersion: "2026.1";
    platform: "imessage" | "whatsapp" | "telegram" | "instagram" | "google-messages";
    theme: "light" | "dark";
    device: {
        width: number;
        height: number;
        frame: "none" | "iphone" | "device";
        scale: number;
        model?: "iphone-17-pro" | "iphone-17-pro-max" | "pixel-11" | "pixel-11-pro" | "pixel-11-pro-xl" | "galaxy-s26" | "galaxy-s26-plus" | "galaxy-s26-ultra" | undefined;
    };
    statusBar: {
        time: string;
        battery: number;
        charging: boolean;
        wifi: number;
        cellular: number;
        carrier: string;
        visible: boolean;
    };
    participants: {
        id: string;
        name: string;
        color: string;
        isSelf: boolean;
        avatar?: string | undefined;
    }[];
    contact: {
        name: string;
        subtitle: string;
        participantIds: string[];
        kind?: "direct" | "group" | undefined;
        avatar?: string | undefined;
    };
    messages: {
        id: string;
        senderId: string;
        at: number;
        kind: "file" | "link" | "text" | "video" | "image" | "voice" | "location" | "contact" | "sticker" | "poll" | "payment" | "system";
        text: string;
        timestamp: string;
        dateLabel: string;
        status: "sending" | "sent" | "delivered" | "read" | "failed";
        statusText: string;
        edited: boolean;
        editedAt: string;
        unsent: boolean;
        reactions: {
            id: string;
            emoji: string;
            participantId: string;
            at: number;
        }[];
        effect: "none" | "shake" | "ripple" | "bloom" | "jitter" | "slam" | "loud" | "gentle" | "invisible-ink";
        presentation: {
            opacity: number;
            scale: number;
            offsetX: number;
            offsetY: number;
        };
        extensions: Record<string, JsonValue>;
        textRuns?: {
            id: string;
            text: string;
            bold: boolean;
            italic: boolean;
            underline: boolean;
            strikethrough: boolean;
            effect: "none" | "big" | "small" | "shake" | "nod" | "explode" | "ripple" | "bloom" | "jitter";
        }[] | undefined;
        stickers?: {
            id: string;
            emoji: string;
            x: number;
            y: number;
            scale: number;
            rotation: number;
            zIndex: number;
            at: number;
            url?: string | undefined;
            participantId?: string | undefined;
        }[] | undefined;
        statusAt?: number | undefined;
        editHistory?: {
            versions: {
                id: string;
                text: string;
                editedAt: string;
            }[];
        } | undefined;
        scheduledAt?: string | undefined;
        readBy?: string[] | undefined;
        replyTo?: string | undefined;
        media?: {
            alt: string;
            width: number;
            height: number;
            duration: number;
            waveform: number[];
            playhead: number;
            playbackRate: number;
            playing: boolean;
            keep: boolean;
            url?: string | undefined;
            videoUrl?: string | undefined;
            poster?: string | undefined;
            transcript?: string | undefined;
        } | undefined;
        file?: {
            name: string;
            size: number;
            mimeType: string;
        } | undefined;
        link?: {
            url: string;
            title: string;
            description: string;
            image?: string | undefined;
        } | undefined;
        location?: {
            latitude: number;
            longitude: number;
            label: string;
            address: string;
        } | undefined;
        sharedContact?: {
            name: string;
            phone: string;
            avatar?: string | undefined;
        } | undefined;
        sticker?: {
            emoji: string;
            alt: string;
            url?: string | undefined;
        } | undefined;
        poll?: {
            question: string;
            options: {
                id: string;
                text: string;
                votes: number;
            }[];
            totalVotes: number;
        } | undefined;
        payment?: {
            amount: number;
            currency: string;
            note: string;
        } | undefined;
    }[];
    composer: {
        text: string;
        placeholder: string;
        typing: {
            visible: boolean;
            participantId?: string | undefined;
        };
        keyboard: "emoji" | "hidden" | "alphabetic";
        focused: boolean;
        context?: {
            mode: "normal" | "reply" | "edit" | "recording" | "scheduled";
            scheduledAt: string;
            recording: {
                duration: number;
                locked: boolean;
                paused: boolean;
                waveform: number[];
            };
            messageId?: string | undefined;
        } | undefined;
        selection?: {
            start: number;
            end: number;
            showCaret: boolean;
            showHandles: boolean;
            visible?: boolean | undefined;
        } | undefined;
    };
    appearance: {
        wallpaper: "custom" | "solid" | "gradient" | "paper";
        color: string;
        showTimestamps: boolean;
        showAvatars: boolean;
        screenEffect: "none" | "confetti" | "balloons" | "hearts" | "lasers" | "fireworks" | "echo" | "spotlight";
        bubbleRadius?: number | undefined;
        textSize?: number | undefined;
    };
    timeline: {
        duration: number;
        loop: boolean;
        fps: number;
        tracks: {
            id: string;
            path: string;
            keyframes: {
                at: number;
                value: string | number | boolean | null;
                easing: "typewriter" | "step" | "linear" | "ease";
            }[];
        }[];
    };
    extensions: Record<string, JsonValue>;
    header?: {
        transport: "imessage" | "sms" | "rcs";
        backCount: number;
        video: "enabled" | "disabled" | "hidden";
        call: "enabled" | "disabled" | "hidden";
    } | undefined;
    conversation?: {
        muted: boolean;
        focus?: {
            visible: boolean;
            name: string;
            notifyAnyway: boolean;
        } | undefined;
        unread?: {
            visible: boolean;
            messageId: string;
            count: number;
        } | undefined;
        pinned?: {
            visible: boolean;
            messageId: string;
            label: string;
        } | undefined;
    } | undefined;
    interactions?: {
        attachmentTray?: {
            visible: boolean;
            kind: "apps" | "photos" | "stickers";
            items?: {
                id: string;
                label: string;
                url?: string | undefined;
                emoji?: string | undefined;
            }[] | undefined;
        } | undefined;
        tapbackPicker?: {
            visible: boolean;
            messageId: string;
            selectedEmoji: string;
            emojis: string[];
            showMenu: boolean;
        } | undefined;
        editHistory?: {
            visible: boolean;
            messageId: string;
        } | undefined;
    } | undefined;
}>>;
export declare function parseScene(input: unknown): Scene;
export type PresentationField = {
    path: string;
    value: string | number | boolean | null;
    type: "text" | "number" | "boolean" | "null";
    choices?: string[];
    minimum?: number;
    maximum?: number;
    integer?: boolean;
    maxLength?: number;
    typewriter: boolean;
};
/** The manual motion editor derives its controls from the same target contract as validation. */
export declare function presentationField(scene: Scene, path: string): PresentationField;
