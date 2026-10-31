import { defaultScene } from "../src/presets.js";
import { parseScene, type Scene } from "../src/schema.js";

const conversation = (id: string, changes: Record<string, unknown>): Scene =>
  parseScene({
    ...defaultScene,
    id: `fidelity-${id}`,
    title: `iMessage ${id}`,
    device: { model: "iphone-17-pro-max", frame: "none" },
    timeline: { duration: 8, loop: false, fps: 30, tracks: [] },
    messages: [],
    ...changes,
  });

/** Synthetic fixtures for the drawing states most easily missed by a text-only preset. */
export const fidelityScenes: Scene[] = [
  ...[17, 21].map((textSize) => conversation(`final-type-${textSize}`, {
    appearance: { textSize },
    messages: [
      { id: "sized", senderId: "jamie", text: "Meet me at the little coffee shop near the station tomorrow morning. I will bring our tickets and a spare umbrella, then we can find a quiet table by the window.", dateLabel: "Today 9:41 AM" },
      { id: "reply", senderId: "me", text: "See you there." },
      { id: "emoji", senderId: "jamie", text: "🎉" },
      { id: "sticker", senderId: "me", kind: "sticker", sticker: { emoji: "✨" } },
    ],
  })),
  ...(["me", "jamie"] as const).flatMap((actor) => {
    const symbols = ["❤️", "👍", "👎", "HAHA", "‼️", "❓", "👍🏽", "😂"];
    const messages = symbols.map((emoji, index) => ({
      id: `tapback-${index}`,
      senderId: actor === "me" ? "jamie" : "me",
      text: ["Heart", "Thumbs up", "Thumbs down", "HA HA", "Emphasis", "Question", "Custom skin tone", "Laughing emoji"][index],
      dateLabel: index === 0 ? "Today 9:41 AM" : "",
      reactions: [{ id: `reaction-${index}`, emoji, participantId: actor }],
    }));
    return [
      conversation(`final-tapbacks-${actor}`, { messages }),
      conversation(`final-picker-${actor}`, {
        messages,
        interactions: { tapbackPicker: { messageId: "tapback-3", emojis: symbols, selectedEmoji: "HAHA" } },
      }),
    ];
  }),
  ...[
    { id: "untinted", tint: "" },
    { id: "light-tint", tint: "#f4e4c8" },
    { id: "dark-tint", tint: "#263544" },
  ].map(({ id, tint }) => conversation(`final-link-${id}`, {
    messages: [
      { id: "intro", senderId: "jamie", text: "A place for coffee", dateLabel: "Today 9:41 AM" },
      ...(["jamie", "me"] as const).map((senderId) => ({
        id: `link-${senderId}`,
        senderId,
        kind: "link",
        link: { url: "https://example.com/coffee", title: "The coffee shop", ...(tint ? { tint } : {}) },
      })),
    ],
  })),
  ...[
    { kind: "voice", media: { duration: 12, transcript: "Meet me at the station." } },
    { kind: "link", link: { url: "https://example.com/coffee", title: "A good coffee spot", description: "A small place near the station." } },
    { kind: "file", file: { name: "Coffee plans.pdf", size: 24576, mimeType: "application/pdf" } },
    { kind: "location", location: { latitude: 40.758, longitude: -73.986, label: "Station Square", address: "12 Example Street" } },
    { kind: "contact", sharedContact: { name: "Alex Morgan", phone: "555-0100" } },
    { kind: "poll", poll: { question: "Coffee or tea?", options: [{ id: "coffee", text: "Coffee", votes: 2 }, { id: "tea", text: "Tea", votes: 1 }], totalVotes: 3 } },
    { kind: "payment", payment: { amount: 12.5, currency: "USD", note: "For the coffee" } },
  ].map((card) => conversation(`card-${card.kind}`, {
    messages: [
      { id: "intro", senderId: "jamie", text: "Here you go.", dateLabel: "Today 9:41 AM", edited: true, editedAt: "9:42 AM" },
      { ...card, id: "card-in", senderId: "jamie" },
      { ...card, id: "card-out", senderId: "me", reactions: [{ id: "heart", emoji: "❤️", participantId: "jamie" }] },
      { id: "reply", senderId: "me", text: "Thanks!", status: "read", statusText: "Read 9:43 AM", edited: true },
    ],
  })),
  conversation("incoming-edit", {
    messages: [
      { id: "edited", senderId: "jamie", text: "Tomorrow at nine", dateLabel: "Today 9:41 AM", edited: true, editedAt: "9:42 AM" },
      { id: "followup", senderId: "jamie", text: "At the usual spot." },
      { id: "reply", senderId: "me", text: "See you there.", status: "read", statusText: "Read 9:43 AM" },
    ],
  }),
  conversation("emoji-stickers", {
    messages: [
      { id: "intro", senderId: "jamie", text: "A few favorites", dateLabel: "Today 9:41 AM" },
      { id: "emoji-in", senderId: "jamie", text: "🎉" },
      { id: "emoji-out", senderId: "me", text: "❤️ 👍" },
      { id: "sticker-in", senderId: "jamie", kind: "sticker", sticker: { emoji: "🌻" } },
      { id: "sticker-out", senderId: "me", kind: "sticker", sticker: { emoji: "✨" } },
      { id: "read", senderId: "me", text: "See you soon", status: "read", statusText: "Read 9:42 AM" },
    ],
  }),
  ...(["sms", "rcs"] as const).map((transport) =>
    conversation(transport, {
      header: { transport },
      messages: [
        { id: "in", senderId: "jamie", text: "On your way?", dateLabel: "Today 9:41 AM" },
        { id: "out", senderId: "me", text: "Just leaving now." },
        { id: "last", senderId: "me", text: "See you in ten minutes.", status: "read" },
      ],
      composer: { text: "Almost there" },
    }),
  ),
  conversation("scheduled", {
    messages: [
      { id: "in", senderId: "jamie", text: "Coffee tomorrow?", dateLabel: "Today 9:41 AM" },
      { id: "out", senderId: "me", text: "Sounds good." },
      { id: "later", senderId: "me", text: "Good morning! Still on for coffee?", scheduledAt: "Tomorrow, 9:00 AM" },
    ],
  }),
  ...(["in", "out"] as const).map((side) =>
    conversation(`tapback-${side}`, {
      messages: [
        { id: "selected", senderId: side === "in" ? "jamie" : "me", text: "The usual spot?", dateLabel: "Today 9:41 AM" },
      ],
      interactions: { tapbackPicker: { messageId: "selected" } },
    }),
  ),
  conversation("wrapping", {
    messages: [
      { id: "long", senderId: "jamie", text: "Meet me by the little bookstore around the corner. I'll bring coffee.", dateLabel: "Today 9:41 AM" },
      { id: "short", senderId: "me", text: "Perfect!", reactions: [{ id: "heart", emoji: "❤️", participantId: "jamie" }] },
      { id: "last", senderId: "me", text: "See you there.", status: "read", statusText: "Read 9:42 AM" },
    ],
  }),
];
