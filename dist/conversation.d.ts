import type { Message, Participant, Scene } from "./schema.js";
/** Explicit direct/group state overrides legacy multi-contact inference. */
export declare function isGroupConversation(scene: Scene): boolean;
export declare function conversationMembers(scene: Scene): Participant[];
export declare function receiptReaders(scene: Scene, message: Message): string[];
/** Removing an actor must never silently rewrite or delete authored conversations. */
export declare function participantUsage(scene: Scene, participantId: string): string | undefined;
