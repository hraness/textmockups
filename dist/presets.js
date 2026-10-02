import { parseScene } from "./schema.js";
export const defaultScene = parseScene({
    version: 1,
    id: "coffee-window-seat",
    title: "A little catch-up",
    platform: "imessage",
    participants: [
        { id: "me", name: "You", isSelf: true },
        { id: "jamie", name: "Jamie", color: "#A69BB0" },
    ],
    contact: { name: "Jamie", participantIds: ["jamie"] },
    messages: [
        {
            id: "coffee-1",
            senderId: "jamie",
            at: 0.35,
            text: "Coffee later? ☕",
            dateLabel: "Today 9:41 AM",
        },
        {
            id: "coffee-2",
            senderId: "me",
            at: 1.5,
            text: "Yes. The usual spot?",
            reactions: [
                { id: "coffee-heart", emoji: "❤️", participantId: "jamie", at: 2.4 },
            ],
        },
        {
            id: "coffee-3",
            senderId: "jamie",
            at: 3,
            text: "4pm. Window seat.",
            timestamp: "9:42 AM",
        },
        {
            id: "coffee-4",
            senderId: "me",
            at: 4.3,
            text: "See you there 🤍",
            status: "read",
            statusAt: 5,
            statusText: "Read 9:42 AM",
        },
    ],
    timeline: {
        duration: 8,
        loop: true,
        fps: 30,
        tracks: [
            {
                id: "draft",
                path: "/composer/text",
                keyframes: [
                    { at: 5.5, value: "" },
                    { at: 7, value: "On my way…", easing: "typewriter" },
                ],
            },
        ],
    },
});
function makePreset(id, name, description, input) {
    return { id, name, description, scene: parseScene(input) };
}
export const presets = [
    makePreset("coffee", "Running late", "Four messages about a very optimistic arrival time.", {
        ...defaultScene,
        title: "Running late",
        messages: defaultScene.messages.map((message, index) => ({
            ...message,
            text: [
                "Are you close?",
                "Five minutes away.",
                "From here or from finding your shoes?",
                "Shoes have entered the chat.",
            ][index] ?? message.text,
            reactions: message.reactions.map((reaction) => ({
                ...reaction,
                emoji: "😂",
            })),
        })),
    }),
    makePreset("blue-hour", "One more episode", "A late-night conversation with a familiar excuse.", {
        ...defaultScene,
        id: "blue-hour",
        title: "One more episode",
        theme: "dark",
        appearance: { ...defaultScene.appearance, color: "#000000" },
        statusBar: { ...defaultScene.statusBar, time: "10:28", battery: 78 },
        contact: { name: "Jamie", subtitle: "", participantIds: ["jamie"] },
        messages: [
            {
                id: "night-1",
                senderId: "jamie",
                at: 0.3,
                text: "Still awake?",
                dateLabel: "Today 10:28 PM",
            },
            {
                id: "night-2",
                senderId: "me",
                at: 1.7,
                text: "One more episode.",
            },
            {
                id: "night-3",
                senderId: "jamie",
                at: 3.3,
                text: "You said that three episodes ago.",
                reactions: [
                    { id: "laugh", emoji: "😂", participantId: "me", at: 4.4 },
                ],
            },
            {
                id: "night-4",
                senderId: "me",
                at: 5.2,
                text: "The couch has custody now.",
                status: "read",
                statusText: "Read 10:29 PM",
                statusAt: 5.8,
            },
        ],
        timeline: { duration: 8, loop: true, fps: 30, tracks: [] },
    }),
    makePreset("weekend", "Dinner plans", "A group chat that gets one step closer to choosing dinner.", {
        ...defaultScene,
        id: "weekend",
        title: "Dinner plans",
        platform: "whatsapp",
        participants: [
            { id: "me", name: "You", isSelf: true },
            { id: "maya", name: "Maya", color: "#A352BC" },
            { id: "leo", name: "Leo", color: "#3F8798" },
        ],
        contact: {
            name: "Dinner plans",
            subtitle: "You, Maya, Leo",
            participantIds: ["maya", "leo"],
        },
        appearance: {
            ...defaultScene.appearance,
            wallpaper: "paper",
            color: "#EFEAE2",
            bubbleRadius: 12,
            showAvatars: true,
            showTimestamps: true,
        },
        composer: { ...defaultScene.composer, placeholder: "Message" },
        messages: [
            {
                id: "weekend-1",
                senderId: "maya",
                at: 0.3,
                text: "Dinner tonight. Any preferences?",
                timestamp: "09:41",
                dateLabel: "TODAY",
            },
            {
                id: "weekend-2",
                senderId: "leo",
                at: 1.8,
                text: "Anywhere is fine.",
                timestamp: "09:42",
            },
            {
                id: "weekend-3",
                senderId: "me",
                at: 3.1,
                text: "Pizza?",
                timestamp: "09:42",
                reactions: [
                    { id: "weekend-heart", emoji: "❤️", participantId: "maya", at: 4 },
                ],
            },
            {
                id: "weekend-4",
                senderId: "leo",
                at: 4.8,
                text: "Except pizza.",
                timestamp: "09:43",
            },
        ],
        timeline: { duration: 8, loop: true, fps: 30, tracks: [] },
    }),
    makePreset("launch", "Launch day", "Share a launch link and get the first piece of feedback.", {
        ...defaultScene,
        id: "launch",
        title: "Launch day",
        platform: "telegram",
        contact: {
            name: "Jamie",
            subtitle: "last seen recently",
            participantIds: ["jamie"],
        },
        appearance: {
            ...defaultScene.appearance,
            wallpaper: "gradient",
            color: "#DCE8D8",
            bubbleRadius: 12,
            showTimestamps: true,
        },
        composer: { ...defaultScene.composer, placeholder: "Message" },
        messages: [
            {
                id: "launch-1",
                senderId: "me",
                at: 0.3,
                text: "We shipped it. The site is live.",
                timestamp: "09:41",
                dateLabel: "September 30",
                status: "read",
            },
            {
                id: "launch-2",
                senderId: "jamie",
                at: 1.8,
                text: "Send the link.",
                timestamp: "09:41",
            },
            {
                id: "launch-3",
                senderId: "me",
                at: 3.1,
                kind: "link",
                text: "Here it is. Try it.",
                timestamp: "09:42",
                link: {
                    url: "https://textmock.com",
                    title: "Textmock",
                    description: "Editable message scenes, screenshots, and videos.",
                },
                reactions: [
                    { id: "launch-fire", emoji: "🔥", participantId: "jamie", at: 4.2 },
                ],
                status: "read",
            },
            {
                id: "launch-4",
                senderId: "jamie",
                at: 4.9,
                text: "I found a typo.",
                timestamp: "09:42",
            },
        ],
        timeline: { duration: 8, loop: true, fps: 30, tracks: [] },
    }),
    makePreset("details", "Shipping question", "Answer a common customer question with a reply and read receipt.", {
        ...defaultScene,
        id: "details",
        title: "Shipping question",
        messages: [
            {
                id: "detail-1",
                senderId: "jamie",
                at: 0.3,
                text: "Where's my tracking link?",
                dateLabel: "Today 9:41 AM",
            },
            {
                id: "detail-2",
                senderId: "me",
                at: 1.6,
                text: "In your shipping confirmation email.",
                replyTo: "detail-1",
                edited: true,
                editedAt: "9:42 AM",
            },
            {
                id: "detail-3",
                senderId: "jamie",
                at: 3,
                text: "Found it. Hiding in plain sight.",
                reactions: [
                    { id: "detail-heart", emoji: "❤️", participantId: "me", at: 3.8 },
                ],
            },
            {
                id: "detail-4",
                senderId: "me",
                at: 4.5,
                text: "Happens to all of us.",
                status: "read",
                statusAt: 5.2,
                statusText: "Read 9:43 AM",
            },
        ],
        composer: {
            ...defaultScene.composer,
            text: "Anything else I can help with?",
            focused: true,
            keyboard: "alphabetic",
        },
        timeline: { duration: 8, loop: true, fps: 30, tracks: [] },
    }),
    makePreset("voice-note", "Wrong chat", "A voice note with an unexpected audience.", {
        ...defaultScene,
        id: "voice-note",
        title: "Wrong chat",
        messages: [
            {
                id: "voice-1",
                senderId: "jamie",
                at: 0.3,
                text: "Quick update for the team.",
                dateLabel: "Today 9:41 AM",
            },
            {
                id: "voice-2",
                senderId: "jamie",
                at: 1.5,
                kind: "voice",
                media: {
                    duration: 12,
                    transcript: "Who's a good boy? Yes, you are.",
                    waveform: [
                        0.2, 0.4, 0.7, 0.3, 0.8, 1, 0.5, 0.3, 0.6, 0.9, 0.5, 0.2, 0.4,
                        0.8, 0.6, 0.3, 0.7, 0.4, 0.2, 0.5, 0.9, 0.6, 0.3, 0.2,
                    ],
                },
            },
            {
                id: "voice-3",
                senderId: "me",
                at: 3.6,
                text: "Wrong chat. But yes, he is.",
                status: "read",
                statusAt: 4.5,
                statusText: "Read 9:42 AM",
            },
        ],
        timeline: {
            duration: 8,
            loop: true,
            fps: 30,
            tracks: [
                {
                    id: "voice-typing",
                    path: "/composer/typing/visible",
                    keyframes: [
                        { at: 5, value: true },
                        { at: 7.5, value: false },
                    ],
                },
            ],
        },
        composer: {
            ...defaultScene.composer,
            typing: { visible: false, participantId: "jamie" },
        },
    }),
];
