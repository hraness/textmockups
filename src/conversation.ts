import type { Message, Participant, Scene } from "./schema.js";

/** Explicit direct/group state overrides legacy multi-contact inference. */
export function isGroupConversation(scene: Scene): boolean {
  return (
    scene.contact.kind === "group" ||
    (scene.contact.kind === undefined &&
      scene.contact.participantIds.length > 1)
  );
}
export function conversationMembers(scene: Scene): Participant[] {
  const members = new Set(scene.contact.participantIds);
  return scene.participants.filter(
    (person) => person.isSelf || members.has(person.id),
  );
}
export function receiptReaders(scene: Scene, message: Message): string[] {
  return (message.readBy ?? []).flatMap((id) => {
    const person = scene.participants.find((person) => person.id === id);
    return person ? [person.isSelf ? "you" : person.name] : [];
  });
}
/** Removing an actor must never silently rewrite or delete authored conversations. */
export function participantUsage(
  scene: Scene,
  participantId: string,
): string | undefined {
  if (scene.participants.find((person) => person.id === participantId)?.isSelf)
    return "Your participant is required.";
  if (scene.participants.filter((person) => !person.isSelf).length < 2)
    return "Keep at least one other person.";
  if (scene.messages.some((message) => message.senderId === participantId))
    return "This person has messages in the scene.";
  if (
    scene.messages.some((message) =>
      message.reactions.some(
        (reaction) => reaction.participantId === participantId,
      ),
    )
  )
    return "This person has reactions in the scene.";
  if (
    scene.messages.some((message) =>
      message.stickers?.some(
        (sticker) => sticker.participantId === participantId,
      ),
    )
  )
    return "This person has stickers in the scene.";
  if (scene.messages.some((message) => message.readBy?.includes(participantId)))
    return "This person appears in a read receipt.";
  if (scene.composer.typing.participantId === participantId)
    return "This person is the typing participant.";
  const index = scene.participants.findIndex(
    (person) => person.id === participantId,
  );
  if (
    scene.timeline.tracks.some((track) =>
      track.path.startsWith(`/participants/${index}/`),
    )
  )
    return "This person has animation beats.";
  return undefined;
}
