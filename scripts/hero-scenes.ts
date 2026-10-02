// The README images: the same short conversation in iMessage and WhatsApp,
// in light and dark. Everyone in them is made up.
import { parseScene, type Scene } from "../src/schema.js";

const conversation = (platform: Scene["platform"], theme: Scene["theme"]): Scene =>
  parseScene({
    version: 1,
    id: `hero-${platform}-${theme}`,
    title: "Saturday plans",
    platform,
    theme,
    device: { width: 393, height: 700, frame: "iphone", scale: 1 },
    participants: [
      { id: "me", name: "You", isSelf: true },
      { id: "ava", name: "Ava Martin", color: "#7A8CA5" },
    ],
    contact: {
      name: "Ava Martin",
      subtitle: platform === "whatsapp" ? "online" : "",
      participantIds: ["ava"],
    },
    messages: [
      { id: "m1", senderId: "ava", text: "Farmers market tomorrow?", dateLabel: "Today 9:12 AM", timestamp: "9:12 AM" },
      { id: "m2", senderId: "me", text: "Yes! 9 at the north gate?", timestamp: "9:13 AM", status: "read" },
      {
        id: "m3",
        senderId: "ava",
        text: "Perfect. I’ll bring the tote bags 🧺",
        timestamp: "9:13 AM",
        reactions: [{ id: "r1", emoji: "❤️", participantId: "me", at: 0 }],
      },
      { id: "m4", senderId: "me", text: "And I’ll bring coffee ☕️", timestamp: "9:14 AM", status: "read" },
    ],
    composer: { placeholder: platform === "whatsapp" ? "" : "iMessage" },
    timeline: { duration: 6, loop: true, fps: 30, tracks: [] },
  });

export const heroScenes: Scene[] = (["imessage", "whatsapp"] as const).flatMap((platform) =>
  (["light", "dark"] as const).map((theme) => conversation(platform, theme)),
);
