import type {
  ComponentType,
  CSSProperties,
  ImgHTMLAttributes,
  ReactNode,
} from "react";
import type { Message, MessageTextRun, Participant, Scene } from "./schema.js";
import { evaluateScene, sceneTime } from "./timeline.js";
import { Glyph } from "./glyph.js";
import { PhoneText, type PhoneTextSlot } from "./text.js";
import {
  AndroidKeyboard,
  AndroidNavBar,
  AndroidStatusBar,
  MatIcon,
} from "./android.js";
import {
  deviceProfile,
  deviceStage,
  sceneOs,
  type DeviceOs,
} from "./devices.js";
import {
  conversationMembers,
  isGroupConversation,
  receiptReaders,
} from "./conversation.js";

/** Props the renderer passes to the image slot. `src` is the scene's authored asset reference. */
export type PhoneImageProps = ImgHTMLAttributes<HTMLImageElement>;

/** Props the renderer passes to the video slot. `playhead` is the evaluated media time in seconds. */
export type PhoneVideoProps = {
  src: string;
  playhead: number;
  width?: number;
  height?: number;
  poster?: string;
  className?: string;
};

/**
 * Optional media slots. The defaults render HTTPS and inline raster images with
 * a plain `<img>` and show a video's poster frame. Apps that keep media
 * elsewhere (for example browser-local storage) pass their own components.
 */
export type PhoneMedia = {
  Image: ComponentType<PhoneImageProps>;
  Video: ComponentType<PhoneVideoProps>;
};

const LOCAL_REFERENCE = /^local:/;

/** Plain image slot. Browser-local `local:` references have no URL here, so they render empty. */
export function PhoneImage({ src, alt = "Photo", ...props }: PhoneImageProps) {
  const url =
    typeof src === "string" && !LOCAL_REFERENCE.test(src) ? src : undefined;
  return <img {...props} src={url} alt={alt} />;
}

/** Plain video slot: the poster frame, which is what a paused video shows. */
export function PhoneVideoPoster({ poster, className = "" }: PhoneVideoProps) {
  return poster ? (
    <PhoneImage
      className={className}
      src={poster}
      alt=""
      referrerPolicy="no-referrer"
      draggable={false}
    />
  ) : null;
}

export const defaultPhoneMedia: PhoneMedia = {
  Image: PhoneImage,
  Video: PhoneVideoPoster,
};

export type PhoneProps = {
  scene: Scene;
  /** Explicit deterministic playhead, in seconds. Undefined displays the whole document. */
  time?: number;
  selectedMessageId?: string;
  onSelectMessage?: (id: string) => void;
  exporting?: boolean;
  watermark?: boolean;
  /** Image and video slots. Missing entries fall back to `defaultPhoneMedia`. */
  media?: Partial<PhoneMedia>;
  /** Wraps message text, the contact name and the clock, for hosts that edit them in place. */
  text?: PhoneTextSlot;
};

type Slots = PhoneMedia & { Text: PhoneTextSlot };

const css = (value: Record<string, string | number | undefined>) =>
  value as CSSProperties;
const clamp = (value: number, low = 0, high = 1) =>
  Math.max(low, Math.min(high, value));
const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => [...word][0] ?? "")
    .join("")
    .toUpperCase();
const duration = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

/** Stable, smooth, scene-seeded color drift. This is branding, not a security watermark. */
export function watermarkStyle(
  sceneId: string,
  seconds: number,
): CSSProperties {
  let seed = 0;
  for (const character of sceneId)
    seed = (Math.imul(seed, 31) + character.charCodeAt(0)) >>> 0;
  const phase = seconds * 0.08 + (seed % 997) / 73;
  const hue = (offset: number) =>
    Math.round((252 + 45 * Math.sin(phase + offset) + 360) % 360);
  return {
    background: `linear-gradient(${Math.round(125 + seconds * 4)}deg, hsl(${hue(0)} 35% 16%), hsl(${hue(2.1)} 38% 24%) 55%, hsl(${hue(4.2)} 32% 15%))`,
  };
}

export type PhoneFitProps = PhoneProps & {
  className?: string;
  style?: CSSProperties;
};

/**
 * The phone scaled to the width of its container, with no script: the wrapper
 * keeps the device's aspect ratio and the device scales by CSS alone. Use it
 * for responsive pages; use `Phone` when you size the device yourself.
 */
export function PhoneFit({ className, style, ...props }: PhoneFitProps) {
  const { width, height } = deviceStage(props.scene);
  return (
    <div
      className={className ? `tm-fit ${className}` : "tm-fit"}
      style={{
        aspectRatio: `${width} / ${height}`,
        ...({ "--tm-fit-width": `${width}px` } as CSSProperties),
        ...style,
      }}
    >
      <Phone {...props} />
    </div>
  );
}

export function Phone({
  scene: source,
  time,
  selectedMessageId,
  onSelectMessage,
  exporting = false,
  watermark = true,
  media: mediaSlots,
  text: Text = PhoneText,
}: PhoneProps) {
  const slots: Slots = { ...defaultPhoneMedia, ...mediaSlots, Text };
  const scene = time === undefined ? source : evaluateScene(source, time);
  const playhead =
    time === undefined ? source.timeline.duration : sceneTime(source, time);
  const group = isGroupConversation(scene);
  // iMessage always shows who is talking in a group.
  const rowAvatars =
    scene.appearance.showAvatars || (scene.platform === "imessage" && group);
  const self = scene.participants.find((person) => person.isSelf)!;
  const other = scene.participants.find(
    (person) =>
      scene.contact.participantIds.includes(person.id) && !person.isSelf,
  );
  const keyboard =
    scene.composer.keyboard !== "hidden" &&
    scene.composer.context?.mode !== "recording";
  const selected = exporting ? undefined : selectedMessageId;
  const mode = scene.composer.context?.mode ?? "normal";
  const pinned = scene.conversation?.pinned;
  const extraComposerHeight =
    (scene.platform !== "imessage" && (mode === "reply" || mode === "edit")) ||
    mode === "scheduled"
      ? 48
      : mode === "recording" && scene.composer.context?.recording.locked
        ? 45
        : 0;
  const focusHeight =
    scene.platform === "imessage" && scene.conversation?.focus?.visible
      ? 38
      : 0;
  const model = deviceProfile(scene.device.model);
  const os: DeviceOs = model?.os ?? "ios";
  const framed = scene.device.frame !== "none";
  const stage = deviceStage(source);
  const keyboardHeight =
    os === "android"
      ? scene.composer.keyboard === "alphabetic"
        ? model?.system === "one-ui"
          ? 306
          : 272
        : 300
      : scene.composer.keyboard === "alphabetic"
        ? 252
        : 286;
  const threadMessages =
    scene.platform === "imessage" && mode === "reply"
      ? scene.messages.filter(
          (message) =>
            message.id === scene.composer.context?.messageId ||
            message.replyTo === scene.composer.context?.messageId,
        )
      : scene.messages;
  const lastOutgoing = threadMessages.findLastIndex(
    (message) =>
      message.senderId === self.id &&
      !message.unsent &&
      message.kind !== "system",
  );
  return (
    <div
      className="tm-device-stage"
      style={{ width: stage.width, height: stage.height }}
    >
      <div
        className="tm-phone"
        data-textmock-phone
        data-platform={scene.platform}
        data-theme={scene.theme}
        data-frame={scene.device.frame}
        data-os={os}
        data-system={model?.system}
        data-model={model?.model}
        data-group={group || undefined}
        data-exporting={exporting || undefined}
        data-renderer={scene.rendererVersion}
        data-transport={
          scene.header?.transport ??
          (scene.platform === "google-messages" ? "rcs" : "imessage")
        }
        data-composer-mode={mode}
        style={css({
          width: framed && model ? scene.device.width + model.bezel * 2 : scene.device.width,
          height:
            framed && model
              ? scene.device.height + model.bezel * 2
              : scene.device.height,
          transform: `scale(${scene.device.scale})`,
          transformOrigin: "50% 50%",
          "--tm-type": `${scene.appearance.textSize}px`,
          "--tm-thread-w": `${scene.device.width - 40}px`,
          "--tm-radius": `${scene.appearance.bubbleRadius}px`,
          "--tm-composer-extra": `${extraComposerHeight + focusHeight}px`,
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
        })}
        aria-label={`${
          scene.platform === "imessage"
            ? "iMessage"
            : scene.platform === "whatsapp"
              ? "WhatsApp"
              : scene.platform === "instagram"
                ? "Instagram"
                : scene.platform === "google-messages"
                  ? "Google Messages"
                  : "Telegram"
        } conversation with ${scene.contact.name}`}
      >
        {scene.device.frame === "iphone" && !model && (
          <>
            <i className="tm-side-button tm-side-action" />
            <i className="tm-side-button tm-side-volume" />
            <i className="tm-side-button tm-side-power" />
          </>
        )}
        {model && framed && (
          <>
            <i className="tm-side-key tm-key-volume" />
            <i className="tm-side-key tm-key-power" />
          </>
        )}
        <div
          className="tm-screen"
          data-textmock-screen
          data-keyboard={keyboard || undefined}
          data-status-hidden={!scene.statusBar.visible || undefined}
          data-wallpaper={scene.appearance.wallpaper}
          style={css({ "--tm-wall-color": scene.appearance.color })}
        >
          <div className="tm-wallpaper" aria-hidden="true" />
          {scene.statusBar.visible &&
            (os === "android" ? (
              <AndroidStatusBar scene={scene} Text={Text} />
            ) : (
              <StatusBar scene={scene} Text={Text} />
            ))}
          {scene.statusBar.visible &&
            (model ? (
              framed &&
              (os === "android" ? (
                <div className="tm-cutout" aria-hidden="true" />
              ) : (
                <div className="tm-island" aria-hidden="true">
                  <i />
                </div>
              ))
            ) : (
              scene.device.frame === "iphone" && (
                <div className="tm-island" aria-hidden="true">
                  <i />
                </div>
              )
            ))}
          <PhoneHeader slots={slots} scene={scene} person={other} />
          {scene.platform !== "imessage" && pinned?.visible && (
            <PinnedBanner slots={slots} scene={scene} />
          )}
          <div
            className="tm-thread"
            data-textmock-thread
            data-has-pinned={
              (scene.platform !== "imessage" && pinned?.visible) || undefined
            }
          >
            <div className="tm-thread-content">
              {threadMessages.map((message, index) => {
                const person = scene.participants.find(
                  (participant) => participant.id === message.senderId,
                )!;
                const outgoing = person.isSelf;
                const previous = threadMessages[index - 1];
                const next = threadMessages[index + 1];
                const editing =
                  scene.platform === "imessage" &&
                  mode === "edit" &&
                  scene.composer.context?.messageId === message.id;
                // In iMessage a photo or video stands alone: it ends the run before it and
                // carries its own tail and avatar.
                const media = (item?: Message) =>
                  scene.platform === "imessage" &&
                  !!item &&
                  (item.kind === "image" || item.kind === "video" || !!item.gallery);
                // A loose collage of a few photos floats free of the avatar column.
                const collage =
                  scene.platform === "imessage" &&
                  !!message.gallery &&
                  (message.gallery.count ?? message.gallery.items.length) <= 4;
                const named =
                  !previous ||
                  previous.senderId !== message.senderId ||
                  !!message.dateLabel ||
                  previous.kind === "system" ||
                  previous.unsent;
                const first =
                  media(message) ||
                  media(previous) ||
                  message.pause ||
                  !previous ||
                  previous.senderId !== message.senderId ||
                  !!message.dateLabel ||
                  previous.kind === "system" ||
                  previous.unsent;
                const last =
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
                const repliedBy =
                  scene.platform === "imessage" && next?.replyTo === message.id
                    ? next
                    : undefined;
                const replyCount =
                  scene.platform === "imessage"
                    ? threadMessages.filter(
                        (item, at) =>
                          item.replyTo === message.id && at !== index + 1,
                      ).length
                    : 0;
                const receipt =
                  outgoing &&
                  (scene.platform === "imessage" ||
                    scene.platform === "instagram" ||
                    scene.platform === "google-messages") &&
                  !message.scheduledAt &&
                  ((index === lastOutgoing &&
                    // iMessage drops the receipt once they reply.
                    (scene.platform !== "imessage" ||
                      !threadMessages
                        .slice(index + 1)
                        .some((item) => item.senderId !== self.id && item.kind !== "system"))) ||
                    message.status === "failed" ||
                    message.status === "sending" ||
                    message.edited);
                if (message.kind === "system" || message.unsent)
                  return (
                    <div
                      key={message.id}
                      className="tm-system-message"
                      data-message-id={message.id}
                    >
                      {message.unsent
                        ? `${outgoing ? "You" : person.name} unsent a message`
                        : message.text}
                    </div>
                  );
                return (
                  <div
                    key={message.id}
                    className="tm-message-block"
                    data-message-id={message.id}
                    data-side={outgoing ? "out" : "in"}
                    data-editing={editing || undefined}
                    data-first={first || undefined}
                    data-last={last || undefined}
                    data-reply={(scene.platform === "imessage" && !!reply) || undefined}
                  >
                    {scene.platform !== "imessage" &&
                      scene.conversation?.unread?.visible &&
                      scene.conversation.unread.messageId === message.id && (
                        <div className="tm-unread-divider">
                          {scene.platform === "whatsapp"
                            ? `${scene.conversation.unread.count} UNREAD MESSAGE${scene.conversation.unread.count === 1 ? "" : "S"}`
                            : "Unread Messages"}
                        </div>
                      )}
                    {message.dateLabel && (
                      <div className="tm-date">
                        <DateLabel
                          label={message.dateLabel}
                          platform={scene.platform}
                        />
                      </div>
                    )}
                    {scene.platform === "imessage" &&
                      message.scheduledAt &&
                      (!previous?.scheduledAt ||
                        previous.scheduledAt !== message.scheduledAt) && (
                        <div className="tm-scheduled-label">
                          <span>Send Later</span>
                          <span>
                            {message.scheduledAt} <b>Edit</b>
                          </span>
                        </div>
                      )}
                    {scene.platform === "imessage" &&
                      reply &&
                      !replyAdjacent && (
                        <div
                          className="tm-reply-ghost"
                          data-side={
                            reply.senderId === self.id ? "out" : "in"
                          }
                        >
                          <div
                            className="tm-bubble tm-ghost"
                            data-side={
                              reply.senderId === self.id ? "out" : "in"
                            }
                            data-kind={reply.kind}
                            data-tail
                            aria-hidden="true"
                          >
                            <GhostTail />
                            <MessageContent
                              slots={slots}
                              message={{ ...reply, effect: "none" }}
                              scene={scene}
                              time={playhead}
                            />
                            <ReplyHook
                              from={reply.senderId === self.id ? "out" : "in"}
                              to={outgoing ? "out" : "in"}
                              drop={
                                9 + (message.reactions.length ? 27.33 : 0) - 5
                              }
                              offset={!outgoing && rowAvatars ? 39 : 0}
                            />
                          </div>
                        </div>
                      )}
                    <div
                      className="tm-message-row"
                      data-side={outgoing ? "out" : "in"}
                      data-reactions={message.reactions.length > 0 || undefined}
                    >
                      {!outgoing && rowAvatars && (
                        <Avatar slots={slots}
                          name={person.name}
                          url={person.avatar}
                          color={person.color}
                          className="tm-row-avatar"
                          hidden={!last || collage}
                        />
                      )}
                      <div className="tm-message-stack">
                        {scene.platform === "imessage" &&
                          pinned?.visible &&
                          pinned.messageId === message.id && (
                            <div className="tm-pinned-item">
                              <NativeIcon name="pin" />
                              {pinned.label}
                            </div>
                          )}
                        {scene.platform === "imessage" &&
                          scene.interactions?.editHistory?.visible &&
                          scene.interactions.editHistory.messageId ===
                            message.id && (
                            <div className="tm-edit-history">
                              {message.editHistory?.versions.map((version) => (
                                <div
                                  key={version.id}
                                  className="tm-history-version"
                                >
                                  <small>{version.editedAt}</small>
                                  <span>{version.text}</span>
                                </div>
                              ))}
                              <small>Hide Edits</small>
                            </div>
                          )}
                        {!outgoing && named && group && (
                          <div
                            className="tm-sender-name"
                            style={{
                              color:
                                scene.platform === "imessage"
                                  ? undefined
                                  : person.color,
                            }}
                          >
                            {person.name}
                          </div>
                        )}
                        {reply && scene.platform === "instagram" && (
                          <InstagramReply
                            scene={scene}
                            message={message}
                            reply={reply}
                          />
                        )}
                        <div
                          className="tm-bubble"
                          data-side={outgoing ? "out" : "in"}
                          data-tail={last || undefined}
                          data-first={first || undefined}
                          data-kind={message.kind}
                          data-emoji={
                            (message.kind === "text" &&
                              emojiOnly(message.text)) ||
                            undefined
                          }
                          data-selected={selected === message.id || undefined}
                          data-effect={message.effect}
                          data-scheduled={!!message.scheduledAt || undefined}
                          data-interactive={
                            (!!onSelectMessage && !exporting) || undefined
                          }
                          style={{
                            ...messageStyle(
                              message,
                              playhead,
                              time !== undefined,
                            ),
                            ...(message.link?.tint && {
                              "--tm-link-tint": message.link.tint,
                            }),
                          }}
                          data-tint={
                            message.link?.tint
                              ? luminance(message.link.tint) < 0.45
                                ? "dark"
                                : "light"
                              : undefined
                          }
                          role={
                            onSelectMessage && !exporting ? "button" : undefined
                          }
                          tabIndex={
                            onSelectMessage && !exporting ? 0 : undefined
                          }
                          data-message-id={message.id}
                          aria-label={`${person.name}: ${message.text || message.kind}${message.status === "read" ? ", read" : ""}`}
                          onClick={
                            onSelectMessage && !exporting
                              ? () => onSelectMessage(message.id)
                              : undefined
                          }
                          onKeyDown={
                            onSelectMessage && !exporting
                              ? (event) => {
                                  if (
                                    event.key === "Enter" ||
                                    event.key === " "
                                  ) {
                                    event.preventDefault();
                                    onSelectMessage(message.id);
                                  }
                                }
                              : undefined
                          }
                        >
                          {scene.platform === "imessage" && (
                            <span className="tm-bubble-paint" aria-hidden="true">
                              <span className="tm-paint" />
                            </span>
                          )}
                          {scene.platform !== "instagram" &&
                            scene.platform !== "google-messages" &&
                            (scene.platform === "whatsapp" ? first : last) &&
                            message.kind !== "sticker" &&
                            !emojiOnly(message.text) && (
                              <BubbleTail platform={scene.platform} />
                            )}
                          {repliedBy && (
                            <ReplyHook
                              from={outgoing ? "out" : "in"}
                              to={repliedBy.senderId === self.id ? "out" : "in"}
                              drop={
                                (next?.senderId === message.senderId ? 4 : 10) +
                                (repliedBy.dateLabel ? 24.27 : 0) +
                                (repliedBy.reactions.length ? 27.33 : 0) -
                                5
                              }
                              offset={
                                repliedBy.senderId !== self.id &&
                                rowAvatars
                                  ? 39
                                  : 0
                              }
                            />
                          )}
                          {reply &&
                            scene.platform !== "instagram" &&
                            scene.platform !== "imessage" && (
                            <div className="tm-reply">
                              <b>
                                {
                                  scene.participants.find(
                                    (p) => p.id === reply.senderId,
                                  )?.name
                                }
                              </b>
                              <span>
                                {reply.text ||
                                  `${reply.kind[0]?.toUpperCase()}${reply.kind.slice(1)}`}
                              </span>
                            </div>
                          )}
                          {editing ? (
                            <>
                              <span className="tm-inline-edit-text">
                                <ComposerText scene={scene} time={playhead} />
                              </span>
                              <span className="tm-edit-cancel">
                                <Glyph name="close" size={20} />
                              </span>
                              <span className="tm-edit-confirm">
                                <Glyph name="check" size={21} />
                              </span>
                              {scene.composer.selection &&
                                scene.composer.selection.visible !== false &&
                                scene.composer.selection.end >
                                  scene.composer.selection.start && (
                                  <div className="tm-selection-menu">
                                    <span>Cut</span>
                                    <span>Copy</span>
                                    <span>Paste</span>
                                    <span>Replace…</span>
                                    <Glyph name="chevron" size={15} />
                                  </div>
                                )}
                            </>
                          ) : (
                            <MessageContent slots={slots}
                              message={message}
                              scene={scene}
                              time={playhead}
                              tail={last}
                            />
                          )}
                          {(scene.platform === "whatsapp" ||
                            scene.platform === "telegram") && (
                            <span
                              className="tm-inline-meta"
                              data-status={message.status}
                            >
                              {message.edited && <span>edited </span>}
                              {message.timestamp ||
                                (scene.appearance.showTimestamps
                                  ? scene.statusBar.time
                                  : "")}
                              {outgoing && (
                                <DeliveryGlyph status={message.status} />
                              )}
                            </span>
                          )}
                          {scene.platform === "google-messages" &&
                            outgoing &&
                            message.kind !== "sticker" &&
                            !emojiOnly(message.text) && (
                              <GoogleReceipt status={message.status} />
                            )}
                          {message.reactions.length > 0 && (
                            <ReactionBadges slots={slots} message={message} scene={scene} />
                          )}
                          {message.stickers?.map((sticker) => (
                            <span
                              key={sticker.id}
                              className="tm-attached-sticker"
                              data-sticker-id={sticker.id}
                              style={{
                                left: `${sticker.x * 100}%`,
                                top: `${sticker.y * 100}%`,
                                zIndex: 5 + sticker.zIndex,
                                transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
                              }}
                            >
                              {sticker.url ? (
                                <slots.Image
                                  src={sticker.url}
                                  alt="Attached sticker"
                                  referrerPolicy="no-referrer"
                                  draggable={false}
                                />
                              ) : (
                                sticker.emoji
                              )}
                            </span>
                          ))}
                        </div>
                        {replyCount > 0 && (
                          <div className="tm-reply-count">
                            {replyCount} {replyCount === 1 ? "Reply" : "Replies"}
                          </div>
                        )}
                        {(receipt ||
                          (scene.platform === "imessage" &&
                            message.kind === "voice")) && (
                          <div className="tm-receipt-row">
                            {receipt && (
                              <div
                                className="tm-receipt"
                                data-status={message.status}
                              >
                                {message.statusText ||
                                  nativeReceipt(scene, message)}
                                {message.edited && (
                                  <span>
                                    {" "}
                                    · Edited
                                    {message.editedAt
                                      ? ` ${message.editedAt}`
                                      : ""}
                                  </span>
                                )}
                              </div>
                            )}
                            {scene.platform === "imessage" &&
                              message.kind === "voice" && (
                                <span
                                  className="tm-audio-keep"
                                  data-kept={message.media?.keep || undefined}
                                >
                                  {message.media?.keep ? "Kept" : "Keep"}
                                </span>
                              )}
                          </div>
                        )}
                        {scene.platform === "instagram" &&
                          message.edited &&
                          !receipt && (
                            <div className="tm-ig-edited">Edited</div>
                          )}
                        {scene.platform === "imessage" &&
                          !receipt &&
                          scene.appearance.showTimestamps &&
                          message.timestamp && (
                            <div className="tm-message-time">
                              {message.timestamp}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {scene.composer.typing.visible && (
                <div className="tm-typing-row">
                  <TypingDots time={playhead} />
                  {scene.platform !== "imessage" && (
                    <span>
                      {scene.participants.find(
                        (p) => p.id === scene.composer.typing.participantId,
                      )?.name ?? scene.contact.name}{" "}
                      is typing
                    </span>
                  )}
                </div>
              )}
              {scene.messages.length === 0 && (
                <div className="tm-empty-conversation">
                  <Avatar slots={slots}
                    name={scene.contact.name}
                    url={scene.contact.avatar ?? other?.avatar}
                    color={other?.color}
                  />
                  <span>{scene.contact.name}</span>
                </div>
              )}
            </div>
          </div>
          {scene.platform === "imessage" &&
            scene.conversation?.unread?.visible && (
              <div className="tm-catch-up">
                <Glyph name="chevron" size={16} />
                <Glyph name="chevron" size={16} />
                <span>{scene.conversation.unread.count}</span>
              </div>
            )}
          <div className="tm-input-region">
            <FocusStatus scene={scene} />
            <Composer scene={scene} time={playhead} />
            {keyboard && mode !== "recording" && <Keyboard scene={scene} />}
          </div>
          <NativeInteraction slots={slots} scene={scene} time={playhead} />
          {os === "android" ? (
            <AndroidNavBar scene={scene} />
          ) : (
            // A screenshot never shows the home indicator; a framed device does.
            framed && <div className="tm-home-indicator" aria-hidden="true" />
          )}
          {scene.appearance.screenEffect !== "none" && (
            <ScreenEffect
              effect={scene.appearance.screenEffect}
              time={playhead}
            />
          )}
        </div>
      </div>
      {watermark && (
        <div
          className="tm-watermark"
          data-textmock-watermark
          style={{
            ...watermarkStyle(scene.id, time === undefined ? 0 : playhead),
            // Follow the phone when it shrinks, and stay inside the output when it zooms.
            left: Math.min(
              stage.width - 107,
              Math.max(
                -4,
                (stage.width - stage.width * scene.device.scale) / 2 - 4,
              ),
            ),
            top: Math.min(
              stage.height - 43,
              Math.max(
                24,
                (stage.height - stage.height * scene.device.scale) / 2 + 24,
              ),
            ),
          }}
        >
          <span>made with</span>
          <strong>textmock.com</strong>
          <i aria-hidden="true">✦</i>
        </div>
      )}
    </div>
  );
}

function Avatar({ slots,
  name,
  url,
  color,
  className = "",
  hidden = false,
}: {
  slots: Slots;
  name: string;
  url?: string;
  color?: string;
  className?: string;
  hidden?: boolean;
}) {
  return (
    <span
      className={`tm-avatar ${className}`}
      style={{
        "--tm-avatar": color,
        visibility: hidden ? "hidden" : undefined,
      } as CSSProperties}
      aria-hidden="true"
    >
      {url ? (
        <slots.Image
          src={url}
          alt=""
          referrerPolicy="no-referrer"
          draggable={false}
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}

function StatusBar({
  scene,
  Text = PhoneText,
}: {
  scene: Scene;
  Text?: PhoneTextSlot;
}) {
  const { statusBar: status } = scene;
  return (
    <div className="tm-status-bar" aria-hidden="true">
      <span className="tm-status-left">
        <span className="tm-clock">
          <Text field="clock" value={status.time}>
            {status.time}
          </Text>
        </span>
        {status.silent && (
          <svg className="tm-silent" width="15.33" height="16.67" viewBox="0 0 46 50">
            <mask id="tm-silent-cut">
              <rect width="46" height="50" fill="#fff" />
              <path d="M3.5 4.5 41.5 43.5" stroke="#000" strokeWidth="10" />
            </mask>
            <g fill="currentColor" mask="url(#tm-silent-cut)">
              <path d="M22.5 2C15.5 2 11 7 9.6 13L8 24c-.7 3.5-3.5 5.5-5.5 7.5-1.3 1.5-.7 5.5 2.5 5.5h35c3.2 0 3.8-4 2.5-5.5-2-2-4.8-4-5.5-7.5l-1.6-11C34 7 29.5 2 22.5 2Z" />
              <path d="M16 41h13c0 3.2-2.9 5.3-6.5 5.3S16 44.2 16 41Z" />
            </g>
            <path d="M3.5 4.5 41.5 43.5" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" />
          </svg>
        )}
      </span>
      <span className="tm-status-right">
        {status.cellular2 === undefined ? (
          <svg className="tm-cellular" width="21.67" height="13" viewBox="0 0 65 39">
            {[0, 1, 2, 3].map((bar) => (
              <rect
                key={bar}
                x={bar * 18}
                y={27 - bar * 8}
                width="11"
                height={12 + bar * 8}
                rx="3.3"
                fill="currentColor"
                opacity={bar < status.cellular ? 1 : 0.2}
              />
            ))}
          </svg>
        ) : (
          // Two lines: short bars for the first over a row of dots for the second.
          <svg className="tm-cellular" width="21.67" height="15" viewBox="0 0 65 45">
            {[0, 1, 2, 3].map((bar) => (
              <g key={bar} fill="currentColor">
                <rect
                  x={bar * 18}
                  y={14 - bar * 4.6}
                  width="11"
                  height={13 + bar * 4.6}
                  rx="4.2"
                  opacity={bar < status.cellular ? 1 : 0.2}
                />
                <rect
                  x={bar * 18}
                  y="33"
                  width="11"
                  height="11.7"
                  rx="4.2"
                  opacity={bar < (status.cellular2 ?? 0) ? 1 : 0.2}
                />
              </g>
            ))}
          </svg>
        )}
        {status.wifi > 0 ? (
          <svg className="tm-wifi" width="17.67" height="13.67" viewBox="0 0 53 41">
            <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
              <path
                opacity={status.wifi >= 3 ? 1 : 0.2}
                strokeWidth="9"
                d="M2.1 13.9a36.5 36.5 0 0 1 48.8 0"
              />
              <path
                opacity={status.wifi >= 2 ? 1 : 0.2}
                strokeWidth="8"
                d="M11.8 24.6a22 22 0 0 1 29.4 0"
              />
              <path
                opacity={status.wifi >= 1 ? 1 : 0.2}
                fill="currentColor"
                strokeWidth="2.4"
                d="M26.5 39.6 18.8 31.9a10.8 10.8 0 0 1 15.4 0Z"
              />
            </g>
          </svg>
        ) : (
          status.carrier && <span className="tm-network">{status.carrier}</span>
        )}
        <span
          className="tm-battery"
          data-low={status.battery <= 20 || undefined}
          data-charging={status.charging || undefined}
        >
          <i style={{ width: `${status.battery}%` }} />
          {status.charging && <b>ϟ</b>}
        </span>
      </span>
    </div>
  );
}

function ConversationAvatar({ slots,
  scene,
  person,
}: {
  slots: Slots;
  scene: Scene;
  person?: Participant;
}) {
  if (!isGroupConversation(scene) || scene.contact.avatar)
    return (
      <Avatar slots={slots}
        name={scene.contact.name}
        url={scene.contact.avatar ?? person?.avatar}
        color={person?.color}
      />
    );
  const members = conversationMembers(scene)
    .filter((person) => !person.isSelf)
    .slice(0, 3);
  return (
    <span
      className="tm-group-avatar"
      data-members={members.length}
      aria-hidden="true"
    >
      {members.map((person) => (
        <Avatar slots={slots}
          key={person.id}
          name={person.name}
          url={person.avatar}
          color={person.color}
        />
      ))}
    </span>
  );
}
function nativeReceipt(scene: Scene, message: Message): string {
  if (scene.platform === "google-messages") {
    const stamp = message.timestamp ? `${message.timestamp} · ` : "";
    if (message.status === "read") return `${stamp}Read`;
    if (message.status === "failed") return "Not sent";
    if (message.status === "sending") return "Sending…";
    return `${stamp}${message.status === "delivered" ? "Delivered" : "Sent"}`;
  }
  if (message.status === "read") {
    const readers =
      isGroupConversation(scene) && scene.platform === "instagram"
        ? receiptReaders(scene, message)
        : [];
    const verb = scene.platform === "instagram" ? "Seen" : "Read";
    if (readers.length)
      return `${verb} by ${readers.slice(0, 2).join(", ")}${readers.length > 2 ? ` +${readers.length - 2}` : ""}`;
    return `${verb}${scene.platform !== "instagram" && message.timestamp ? ` ${message.timestamp}` : ""}`;
  }
  if (message.status === "failed")
    return scene.platform === "instagram" ? "Not sent" : "Not Delivered";
  if (message.status === "sending") return "Sending…";
  return scene.platform === "instagram" || message.status === "sent"
    ? "Sent"
    : "Delivered";
}
function InstagramReply({
  scene,
  message,
  reply,
}: {
  scene: Scene;
  message: Message;
  reply: Message;
}) {
  const person = scene.participants.find((p) => p.id === message.senderId);
  const original = scene.participants.find((p) => p.id === reply.senderId);
  return (
    <div className="tm-ig-reply">
      <small>
        {person?.isSelf ? "You" : person?.name} replied to{" "}
        {original?.isSelf ? "you" : original?.name}
      </small>
      <span data-side={original?.isSelf ? "out" : "in"}>
        {reply.text || reply.kind}
      </span>
    </div>
  );
}

function PhoneHeader({ slots,
  scene,
  person,
}: {
  slots: Slots;
  scene: Scene;
  person?: Participant;
}) {
  const platform = scene.platform;
  const group = isGroupConversation(scene);
  const members = conversationMembers(scene);
  const subtitle =
    scene.contact.subtitle ||
    (group && platform === "telegram"
      ? `${members.length} members`
      : group && platform === "whatsapp"
        ? members.map((p) => (p.isSelf ? "You" : p.name)).join(", ")
        : "");
  if (sceneOs(scene) === "android")
    return <AndroidHeader slots={slots} scene={scene} person={person} />;
  const avatar = <ConversationAvatar slots={slots} scene={scene} person={person} />;
  const reply =
    platform === "imessage" && scene.composer.context?.mode === "reply";
  const control = (kind: "video" | "call") => scene.header?.[kind] ?? "enabled";
  const disabled = (kind: "video" | "call") =>
    control(kind) === "disabled" ||
    scene.composer.context?.mode === "recording";
  const mute = scene.conversation?.muted ? <NativeIcon name="muted" /> : null;
  const back = (
    <span
      className="tm-nav-back"
      style={reply ? { visibility: "hidden" } : undefined}
    >
      {platform === "imessage" ? (
        <svg width="44" height="44" viewBox="0 0 44 44">
          <path
            d="M24.2 14.2 16.7 22.2 24.2 30.2"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <Glyph name="back" size={24} />
      )}
      {!!scene.header?.backCount && (
        <small className="tm-back-count">
          {scene.header.backCount > 999 ? "999+" : scene.header.backCount}
        </small>
      )}
    </span>
  );
  if (platform === "instagram")
    return (
      <div className="tm-phone-header" aria-hidden="true">
        {back}
        {avatar}
        <span className="tm-contact-title">
          <strong>
            <slots.Text field="contact" value={scene.contact.name}>
              {scene.contact.name}
            </slots.Text>
            {mute}
          </strong>
          {subtitle && <small>{subtitle}</small>}
        </span>
        <span className="tm-nav-actions">
          {control("call") !== "hidden" && (
            <span data-disabled={disabled("call") || undefined}>
              <Glyph name="phone" size={23} />
            </span>
          )}
          {control("video") !== "hidden" && (
            <span data-disabled={disabled("video") || undefined}>
              <Glyph name="video" size={25} />
            </span>
          )}
        </span>
      </div>
    );
  if (platform === "telegram")
    return (
      <div className="tm-phone-header" aria-hidden="true">
        {back}
        <span className="tm-contact-title">
          <strong>
            <slots.Text field="contact" value={scene.contact.name}>
              {scene.contact.name}
            </slots.Text>
            {mute}
          </strong>
          {subtitle && <small>{subtitle}</small>}
        </span>
        {avatar}
      </div>
    );
  return (
    <div className="tm-phone-header" aria-hidden="true">
      {back}
      {platform === "imessage" ? (
        <>
          <div className="tm-im-contact">
            {avatar}
            <span className="tm-im-name">
              <slots.Text field="contact" value={scene.contact.name}>
                {scene.contact.name}
              </slots.Text>
              {mute}
              <svg className="tm-name-chevron" viewBox="0 0 6 31.7" aria-hidden="true">
                <path
                  d="M1.5 10.4 3.9 16.4 1.5 22.4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            {subtitle && (
              <span className="tm-contact-subtitle">{subtitle}</span>
            )}
          </div>
          {reply ? (
            <span className="tm-im-video">
              <Glyph name="close" size={23} />
            </span>
          ) : (
            control("video") !== "hidden" && (
              <span
                className="tm-im-video"
                data-disabled={disabled("video") || undefined}
              >
                <svg width="44" height="44" viewBox="0 0 44 44">
                  <g
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.67"
                    strokeLinejoin="round"
                  >
                    <rect x="10.17" y="14.17" width="17.33" height="16.33" rx="3.2" />
                    <path d="M27.5 20.3 33.2 16.2c.6-.4 1.5 0 1.5.8v10.6c0 .8-.9 1.2-1.5.8l-5.7-4.1" />
                  </g>
                </svg>
              </span>
            )
          )}
        </>
      ) : (
        <>
          {avatar}
          <span className="tm-contact-title">
            <strong>
              <slots.Text field="contact" value={scene.contact.name}>
                {scene.contact.name}
              </slots.Text>
              {mute}
            </strong>
            {subtitle && <small>{subtitle}</small>}
          </span>
          <span className="tm-nav-actions">
            {control("video") !== "hidden" && (
              <span data-disabled={disabled("video") || undefined}>
                <Glyph name="video" size={25} />
              </span>
            )}
            {control("call") !== "hidden" && (
              <span data-disabled={disabled("call") || undefined}>
                <Glyph name="phone" size={22} />
              </span>
            )}
          </span>
        </>
      )}
    </div>
  );
}

/**
 * Android app bars: back arrow, avatar, name and subtitle, then Material action
 * icons. Each app keeps its own action order.
 */
function AndroidHeader({ slots,
  scene,
  person,
}: {
  slots: Slots;
  scene: Scene;
  person?: Participant;
}) {
  const platform = scene.platform;
  const group = isGroupConversation(scene);
  const members = conversationMembers(scene);
  const subtitle =
    scene.contact.subtitle ||
    (group && platform === "telegram"
      ? `${members.length} members`
      : group && platform === "whatsapp"
        ? members.map((p) => (p.isSelf ? "You" : p.name)).join(", ")
        : "");
  const control = (kind: "video" | "call") => scene.header?.[kind] ?? "enabled";
  const disabled = (kind: "video" | "call") =>
    control(kind) === "disabled" ||
    scene.composer.context?.mode === "recording";
  const mute = scene.conversation?.muted ? (
    <MatIcon name="notifications_off" size={17} />
  ) : null;
  const action = (name: "call" | "video" | "menu") => {
    if (name === "menu")
      return (
        <span className="tm-nav-action" key="menu">
          <MatIcon name="more_vert" size={22} />
        </span>
      );
    if (control(name) === "hidden") return null;
    return (
      <span
        className="tm-nav-action"
        key={name}
        data-disabled={disabled(name) || undefined}
      >
        <MatIcon
          name={name === "call" ? "call" : "videocam"}
          size={23}
        />
      </span>
    );
  };
  const actions =
    platform === "google-messages"
      ? [action("call"), action("video"), action("menu")]
      : platform === "whatsapp"
        ? [action("video"), action("call"), action("menu")]
        : platform === "telegram"
          ? [action("call"), action("menu")]
          : [action("call"), action("video")];
  return (
    <div className="tm-phone-header" aria-hidden="true">
      <span className="tm-nav-back">
        <MatIcon name="arrow_back" size={24} />
        {!!scene.header?.backCount && (
          <small className="tm-back-count">
            {scene.header.backCount > 999 ? "999+" : scene.header.backCount}
          </small>
        )}
      </span>
      <ConversationAvatar slots={slots} scene={scene} person={person} />
      <span className="tm-contact-title">
        <strong>
          <slots.Text field="contact" value={scene.contact.name}>
            {scene.contact.name}
          </slots.Text>
          {mute}
        </strong>
        {subtitle && <small>{subtitle}</small>}
      </span>
      <span className="tm-nav-actions">{actions}</span>
    </div>
  );
}

/** Google Messages delivery: a circular indicator at the bubble's corner. */
function GoogleReceipt({ status }: { status: Message["status"] }) {
  return (
    <span
      className="tm-gm-receipt"
      data-status={status}
      aria-hidden="true"
    >
      {status === "failed" ? (
        <b>!</b>
      ) : (
        <MatIcon
          name={status === "sending" ? "schedule" : status === "sent" ? "check" : "done_all"}
          size={11}
        />
      )}
    </span>
  );
}

/** iMessage sets the day in semibold before the time: "**Today** 9:41 AM". */
function DateLabel({
  label,
  platform,
}: {
  label: string;
  platform: Scene["platform"];
}) {
  const split =
    platform === "imessage"
      ? /^(.+?)((?: at)? \d{1,2}:\d{2}(?:\s?[AP]M)?)$/i.exec(label)
      : null;
  if (!split) return <span>{label}</span>;
  return (
    <span>
      <b>{split[1]}</b>
      {/* iOS sets AM and PM off with a narrow no-break space. */}
      {split[2].replace(/\s([AP]M)$/i, "\u202f$1")}
    </span>
  );
}

function BubbleTail({ platform }: { platform: Scene["platform"] }) {
  return platform === "imessage" ? (
    <span className="tm-tail" aria-hidden="true">
      <span className="tm-paint" />
    </span>
  ) : (
    <svg className="tm-tail" viewBox="0 0 12 14" aria-hidden="true">
      <path d="M0 0h12v14C7 13 2 8 0 0Z" />
    </svg>
  );
}

function DeliveryGlyph({ status }: { status: Message["status"] }) {
  if (status === "failed") return <span className="tm-failed">!</span>;
  return (
    <Glyph
      name={
        status === "sending"
          ? "clock"
          : status === "sent"
            ? "check"
            : "double-check"
      }
      size={15}
    />
  );
}

function MessageContent({ slots,
  message,
  scene,
  time,
  tail = false,
}: {
  slots: Slots;
  message: Message;
  scene: Scene;
  time: number;
  tail?: boolean;
}) {
  let content: ReactNode = null;
  const media = message.media;
  if (scene.platform === "imessage" && message.gallery)
    content = <ImGallery slots={slots} gallery={message.gallery} />;
  else if (
    scene.platform === "imessage" &&
    (message.kind === "image" || message.kind === "video")
  ) {
    const outgoing = scene.participants.some(
      (person) => person.isSelf && person.id === message.senderId,
    );
    const [width, height] = mediaBox(media?.width ?? 4, media?.height ?? 3);
    content = (
      <div
        className="tm-media tm-im-media"
        style={{
          width,
          height,
          clipPath: `path("${mediaClip(width, height, outgoing ? "out" : "in", tail)}")`,
        }}
      >
        {message.kind === "video" && media?.videoUrl ? (
          <slots.Video
            src={media.videoUrl}
            playhead={media.playhead}
            width={media.width}
            height={media.height}
            poster={media.poster ?? media.url}
          />
        ) : media?.url || media?.poster ? (
          <slots.Image
            src={
              message.kind === "video"
                ? (media?.poster ?? media?.url)
                : media?.url
            }
            alt={media?.alt ?? ""}
            referrerPolicy="no-referrer"
            draggable={false}
          />
        ) : (
          <Landscape />
        )}
        {message.kind === "video" && !media?.playing && <ImPlay size={32} />}
      </div>
    );
  } else if (message.kind === "image" || message.kind === "video")
    content = (
      <div
        className="tm-media"
        style={{ aspectRatio: `${media?.width ?? 4} / ${media?.height ?? 3}` }}
      >
        {message.kind === "video" && media?.videoUrl ? (
          <slots.Video
            src={media.videoUrl}
            playhead={media.playhead}
            width={media.width}
            height={media.height}
            poster={media.poster ?? media.url}
          />
        ) : media?.url || media?.poster ? (
          <slots.Image
            src={
              message.kind === "video"
                ? (media?.poster ?? media?.url)
                : media?.url
            }
            alt={media?.alt ?? ""}
            referrerPolicy="no-referrer"
            draggable={false}
          />
        ) : (
          <Landscape />
        )}
        {message.kind === "video" && (
          <>
            {!media?.playing && (
              <span className="tm-media-play">
                <Glyph name="play" size={29} />
              </span>
            )}
            <span className="tm-media-duration">
              {duration(media?.duration ?? 0)}
            </span>
          </>
        )}
      </div>
    );
  if (message.kind === "voice")
    content = <VoiceMessage slots={slots} message={message} scene={scene} />;
  if (message.kind === "file")
    content = (
      <div className="tm-file">
        <span className="tm-file-icon">
          <Glyph name="file" size={28} />
        </span>
        <span>
          <strong>{message.file?.name}</strong>
          <small>
            {formatBytes(message.file?.size ?? 0)} ·{" "}
            {message.file?.mimeType.split("/").at(-1)?.toUpperCase()}
          </small>
        </span>
        <Glyph name="download" size={20} />
      </div>
    );
  if (
    message.kind === "link" &&
    scene.platform === "imessage" &&
    message.link?.icon &&
    !message.link.image &&
    message.link.description
  )
    // A text post (an X post, say): its words, then the author under a small picture.
    content = (
      <div className="tm-link-post">
        <p>{message.link.description}</p>
        <div>
          <slots.Image
            src={message.link.icon}
            alt=""
            referrerPolicy="no-referrer"
          />
          <span>
            <strong>{message.link.title}</strong>
            <small>{safeHostname(message.link.url)}</small>
          </span>
        </div>
      </div>
    );
  else if (
    message.kind === "link" &&
    scene.platform === "imessage" &&
    message.link?.icon &&
    !message.link.image
  )
    content = (
      <div className="tm-link-compact">
        <slots.Image
          src={message.link.icon}
          alt=""
          referrerPolicy="no-referrer"
        />
        <span>
          <strong>{message.link.title}</strong>
          <small>{safeHostname(message.link.url)}</small>
        </span>
      </div>
    );
  else if (message.kind === "link")
    content = (
      <div className="tm-link-card">
        {message.link?.image ? (
          <slots.Image
            src={message.link.image}
            alt=""
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="tm-link-art">
            <span>↗</span>
            <span>{safeHostname(message.link?.url)}</span>
          </div>
        )}
        <div>
          <strong>{message.link?.title}</strong>
          {message.link?.description && <p>{message.link.description}</p>}
          <small>{safeHostname(message.link?.url)}</small>
        </div>
      </div>
    );
  if (message.kind === "location")
    content = (
      <div className="tm-location">
        <div className="tm-map">
          <i />
          <i />
          <i />
          <span>
            <Glyph name="pin" size={29} />
          </span>
        </div>
        <strong>{message.location?.label}</strong>
        <small>
          {message.location?.address ||
            `${message.location?.latitude}, ${message.location?.longitude}`}
        </small>
      </div>
    );
  if (message.kind === "contact")
    content = (
      <div className="tm-contact-card">
        <Avatar slots={slots}
          name={message.sharedContact?.name ?? "Contact"}
          url={message.sharedContact?.avatar}
        />
        <strong>{message.sharedContact?.name}</strong>
        <small>{message.sharedContact?.phone}</small>
        <span>Contact card</span>
      </div>
    );
  if (message.kind === "sticker")
    content = message.sticker?.url ? (
      <slots.Image
        className="tm-sticker"
        src={message.sticker.url}
        alt={message.sticker.alt}
        referrerPolicy="no-referrer"
      />
    ) : (
      <span className="tm-sticker-emoji">{message.sticker?.emoji}</span>
    );
  if (message.kind === "poll")
    content = (
      <div className="tm-poll">
        <strong>{message.poll?.question}</strong>
        <small>Poll</small>
        {message.poll?.options.map((option) => (
          <div className="tm-poll-option" key={option.id}>
            <i
              style={{
                width: `${clamp(option.votes / Math.max(1, message.poll?.totalVotes ?? 1)) * 100}%`,
              }}
            />
            <span>{option.text}</span>
            <b>
              {Math.round(
                clamp(
                  option.votes / Math.max(1, message.poll?.totalVotes ?? 1),
                ) * 100,
              )}
              %
            </b>
          </div>
        ))}
        <small>{message.poll?.totalVotes} votes</small>
      </div>
    );
  if (message.kind === "payment")
    content = (
      <div className="tm-payment">
        <span>{scene.platform === "imessage" ? "Cash" : "Payment"}</span>
        <strong>
          {new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: message.payment?.currency ?? "USD",
            maximumFractionDigits: 2,
          }).format(message.payment?.amount ?? 0)}
        </strong>
        {message.payment?.note && <small>{message.payment.note}</small>}
      </div>
    );
  return (
    <>
      {content}
      {message.text && (
        <span
          className="tm-bubble-text"
          data-ink={message.effect === "invisible-ink" || undefined}
          style={
            message.effect === "invisible-ink"
              ? {
                  backgroundPosition: `${Math.round(time * 19)}px ${Math.round(time * 11)}px`,
                }
              : undefined
          }
        >
          <slots.Text field="message" messageId={message.id} value={message.text}>
            {message.textRuns ? (
              <FormattedText
                runs={message.textRuns}
                time={Math.max(0, time - message.at)}
              />
            ) : (
              <EmojiText text={message.text} />
            )}
          </slots.Text>
          {/* A trailing line break keeps its empty line, as on the phone. */}
          {message.text.endsWith("\n") && "\u200b"}
        </span>
      )}
    </>
  );
}

// Emoji, or a clock time that a phone would detect and underline.
const EMOJI =
  /((?:\p{Extended_Pictographic}|\p{Regional_Indicator}{2})(?:\uFE0F|\p{Emoji_Modifier}|\u200D\p{Extended_Pictographic}\uFE0F?)*)|(?<![\d:])(?:[01]?\d|2[0-3]):[0-5]\d(?: ?[AaPp]\.?[Mm]\.?)?(?![\d:])/gu;

/** Emoji inside text, set apart so a platform can draw them at its own size, and detected times. */
function EmojiText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let index = 0;
  for (const match of text.matchAll(EMOJI)) {
    if (match.index > index) parts.push(text.slice(index, match.index));
    parts.push(
      <span
        key={match.index}
        className={match[1] ? "tm-emoji" : "tm-detected"}
      >
        {match[0]}
      </span>,
    );
    index = match.index + match[0].length;
  }
  if (!parts.length) return text;
  if (index < text.length) parts.push(text.slice(index));
  return <>{parts}</>;
}

function groupedReactions(message: Message, scene: Scene) {
  const groups = new Map<
    string,
    { emoji: string; names: string[]; self: boolean }
  >();
  for (const reaction of message.reactions) {
    const person = scene.participants.find(
      (person) => person.id === reaction.participantId,
    );
    const group = groups.get(reaction.emoji) ?? {
      emoji: reaction.emoji,
      names: [],
      self: false,
    };
    group.names.push(
      person?.isSelf ? "You" : (person?.name ?? "Unknown participant"),
    );
    group.self ||= !!person?.isSelf;
    groups.set(reaction.emoji, group);
  }
  return [...groups.values()];
}
function ReactionBadges({ slots,
  message,
  scene,
}: {
  slots: Slots;
  message: Message;
  scene: Scene;
}) {
  const groups = groupedReactions(message, scene);
  const label = groups
    .map((group) => `${group.emoji}: ${group.names.join(", ")}`)
    .join("; ");
  const overflow = groups
    .slice(3)
    .reduce((total, group) => total + group.names.length, 0);
  if (scene.platform === "instagram")
    return (
      <div
        className="tm-reactions tm-ig-reactions"
        role="img"
        aria-label={`Reactions — ${label}`}
        title={label}
        data-count={message.reactions.length}
      >
        <span className="tm-reaction">
          {groups.slice(0, 3).map((group) => (
            <span key={group.emoji}>{group.emoji}</span>
          ))}
          {message.reactions.length > 1 && (
            <b className="tm-reaction-count">{message.reactions.length}</b>
          )}
        </span>
      </div>
    );
  return (
    <div
      className="tm-reactions"
      data-count={message.reactions.length}
      role="img"
      aria-label={`Reactions — ${label}`}
      title={label}
    >
      {groups.slice(0, 3).map((group, index) =>
        scene.platform === "imessage" ? (
          <span
            key={group.emoji}
            className="tm-reaction tm-tapback"
            style={{ zIndex: 3 - index }}
            data-self={group.self || undefined}
            data-tapback={TAPBACKS[group.emoji]}
          >
            <i className="tm-tapback-ring" />
            <i className="tm-tapback-shape">
              <i className="tm-paint" />
            </i>
            <span className="tm-tapback-glyph">
              {TAPBACKS[group.emoji] ? (
                <TapbackGlyph kind={TAPBACKS[group.emoji]!} />
              ) : (
                group.emoji
              )}
            </span>
            {group.names.length > 1 && (
              <b className="tm-reaction-count">{group.names.length}</b>
            )}
          </span>
        ) : (
          <span
            key={group.emoji}
            className="tm-reaction"
            style={{ zIndex: index + 1 }}
            data-self={group.self || undefined}
          >
            <span>
              {group.emoji}
              {group.names.length > 1 && (
                <b className="tm-reaction-count">{group.names.length}</b>
              )}
            </span>
          </span>
        ),
      )}
      {overflow > 0 && (
        <span
          className="tm-reaction tm-reaction-count"
          title={groups
            .slice(3)
            .map((group) => `${group.emoji}: ${group.names.join(", ")}`)
            .join("; ")}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}

/** The hook that threads a reply: from the middle of the original down to the reply. */
function ReplyHook({
  from,
  to,
  drop,
  offset,
}: {
  from: "in" | "out";
  to: "in" | "out";
  drop: number;
  offset: number;
}) {
  // 14pt in from the reply's edge; across the thread when the original sits on the other side.
  const inset = 14 + offset;
  const across = `calc(var(--tm-thread-w) - ${inset + 36}px)`;
  return (
    <i
      className="tm-reply-hook"
      data-to={to}
      aria-hidden="true"
      style={{
        bottom: -drop,
        left: to === "in" ? (from === "in" ? inset : undefined) : from === "in" ? across : undefined,
        right: to === "out" ? (from === "out" ? inset : undefined) : from === "out" ? across : undefined,
      }}
    />
  );
}

// iOS 26 media, measured on the 17 Pro Max: a single photo or video fits 291.67 x 332.33pt.
const MEDIA_MAX: [number, number] = [291.67, 332.33];
function mediaBox(
  width: number,
  height: number,
  [maxWidth, maxHeight] = MEDIA_MAX,
): [number, number] {
  const aspect = width / height;
  const w = Math.min(maxWidth, maxHeight * aspect);
  return [Math.round(w * 100) / 100, Math.round((w / aspect) * 100) / 100];
}

// The text tail (24 x 12, 7pt below the bubble): a start point, then lines and cubics.
type Point = [number, number];
const TAIL_START: Point = [13.67, 0];
const TAIL: Point[][] = [
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
function mediaClip(w: number, h: number, side: "in" | "out", tail: boolean) {
  const r = 20;
  const n = (value: number) => Math.round(value * 100) / 100;
  const rect = `M${r} 0H${n(w - r)}A${r} ${r} 0 0 1 ${n(w)} ${r}V${n(h - r)}A${r} ${r} 0 0 1 ${n(w - r)} ${n(h)}H${r}A${r} ${r} 0 0 1 0 ${n(h - r)}V${r}A${r} ${r} 0 0 1 ${r} 0Z`;
  if (!tail) return rect;
  const at = ([x, y]: Point) =>
    `${n(side === "out" ? w - 24 + x : 24 - x)} ${n(h - 5 + y)}`;
  let start = TAIL_START;
  let segments = TAIL;
  if (side === "in") {
    // Mirroring flips the winding; walk the outline backwards so the shapes still unite.
    const ends = [TAIL_START, ...TAIL.map((segment) => segment.at(-1)!)];
    start = ends.at(-1)!;
    segments = TAIL.map((segment, index) =>
      segment.length === 3
        ? [segment[1]!, segment[0]!, ends[index]!]
        : [ends[index]!],
    ).reverse();
  }
  const path = segments
    .map((segment) => `${segment.length === 3 ? "C" : "L"}${segment.map(at).join(" ")}`)
    .join("");
  return `${rect}M${at(start)}${path}Z`;
}

/** The play button on a paused video: frosted glass with the triangle knocked out. */
function ImPlay({ size }: { size: number }) {
  return (
    <span className="tm-im-play" data-size={size > 36 ? "large" : undefined} aria-hidden="true">
      <i />
    </span>
  );
}

/** iOS 26 groups photos sent together: a few stagger down the thread, many stack. */
function ImGallery({
  slots,
  gallery,
}: {
  slots: Slots;
  gallery: NonNullable<Message["gallery"]>;
}) {
  const count = gallery.count ?? gallery.items.length;
  const picture = (item: (typeof gallery.items)[number]) =>
    item.url ? (
      <slots.Image src={item.url} alt="" referrerPolicy="no-referrer" draggable={false} />
    ) : (
      <Landscape />
    );
  if (count > 4) {
    const [front, ...rest] = gallery.items;
    const [width, height] = mediaBox(front!.width, front!.height);
    return (
      <div className="tm-im-deck">
        <div className="tm-im-deck-label">
          <svg width="10.33" height="10" viewBox="0 0 10.33 10" aria-hidden="true">
            <rect x="0" y="0" width="4.67" height="4.5" rx="1.2" />
            <rect x="5.67" y="0" width="4.67" height="4.5" rx="1.2" />
            <rect x="0" y="5.5" width="4.67" height="4.5" rx="1.2" />
            <rect x="5.67" y="5.5" width="4.67" height="4.5" rx="1.2" />
          </svg>
          <b>{count} Items</b>
          {gallery.saved && " Saved"}
        </div>
        <div className="tm-im-deck-cards" style={{ width, height }}>
          {[3, 2, 1].map((depth) => {
            const item = rest[depth - 1] ?? front!;
            return (
              <div key={depth} className="tm-im-card" data-depth={depth}>
                {picture(item)}
              </div>
            );
          })}
          <div className="tm-im-card">
            {picture(front!)}
            {front!.video && <ImPlay size={42} />}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="tm-im-collage">
      {gallery.items.slice(0, 4).map((item, index) => {
        const [width, height] = mediaBox(item.width, item.height, [220.67, 229]);
        return (
          <div
            key={index}
            className="tm-im-card"
            data-at={index % 2 ? "start" : "end"}
            // Each photo tucks under the one above, a taller one further.
            style={{
              width,
              height,
              marginTop: index ? -Math.round(Math.max(8, height * 0.173 - 14.9) * 3) / 3 : 0,
            }}
          >
            {picture(item)}
            {item.video && <ImPlay size={32} />}
            {item.live && <ImLive />}
          </div>
        );
      })}
      {!gallery.saved && (
        <span className="tm-im-save" aria-hidden="true">
          <svg width="16" height="17" viewBox="0 0 16 17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 5.5H3.5a2 2 0 0 0-2 2v6.5a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7.5a2 2 0 0 0-2-2H11M8 1v9.5M5 7.5l3 3 3-3" />
          </svg>
        </span>
      )}
    </div>
  );
}

/** The Live Photo badge: a dot inside a solid ring inside a dotted ring. */
function ImLive() {
  return (
    <svg className="tm-im-live" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#fff" aria-hidden="true">
      <circle cx="10" cy="10" r="2.4" fill="#fff" stroke="none" />
      <circle cx="10" cy="10" r="5.1" strokeWidth="1.7" />
      <circle cx="10" cy="10" r="8.8" strokeWidth="1.25" strokeDasharray="0.1 1.85" strokeLinecap="round" />
    </svg>
  );
}

/** iOS 26 message bar icons, traced from iPhone 17 Pro Max screenshots. */
function ComposerIcon({ name }: { name: "plus" | "mic" }) {
  return name === "plus" ? (
    <svg
      className="tm-im-plus"
      width="16"
      height="16"
      viewBox="-8 -8 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.67"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M0-6.83v13.66M-6.83 0h13.66" />
    </svg>
  ) : (
    <svg
      className="tm-im-mic"
      width="14"
      height="20"
      viewBox="-7 0 14 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <rect x="-2.63" y="0.67" width="5.26" height="11.66" rx="2.63" />
      <path d="M-6.03 8v.97a6.03 6.03 0 0 0 12.06 0V8M0 15v4.33M-4.33 19.33h8.66" />
    </svg>
  );
}

function GhostTail() {
  return (
    <svg className="tm-ghost-tail" viewBox="0 0 24 12" aria-hidden="true">
      <path
        d="M13.67 0V6.6C13.67 8.4 15.1 9.4 15.65 10.4 16.05 11.2 15.5 11.85 14.6 11.85 13.9 11.85 13.3 11.6 12.7 11.2L4.4 5.6C3.8 5.2 3.4 5 2.6 5H0V0Z"
        fill="var(--tm-screen)"
      />
      <path
        d="M13.67 2.4V6.6C13.67 8.4 15.1 9.4 15.65 10.4 16.05 11.2 15.5 11.85 14.6 11.85 13.9 11.85 13.3 11.6 12.7 11.2L4.4 5.6C3.8 5.2 3.4 5 2.6 5"
        fill="none"
        stroke="currentColor"
      />
    </svg>
  );
}

/** The six classic tapbacks draw as iOS 26's puffy glyphs; any other emoji draws as itself. */
const TAPBACKS: Record<string, TapbackKind | undefined> = {
  "❤️": "heart",
  "❤": "heart",
  "👍": "like",
  "👎": "dislike",
  "😂": "haha",
  "‼️": "emphasize",
  "‼": "emphasize",
  "❓": "question",
};
type TapbackKind = "heart" | "like" | "dislike" | "haha" | "emphasize" | "question";

function TapbackGlyph({ kind }: { kind: TapbackKind }) {
  if (kind === "heart")
    return (
      <svg viewBox="0 0 56 49" width="18.7" height="16.3" aria-hidden="true">
        <defs>
          <radialGradient id="tm-heart-body" cx="0.5" cy="0.32" r="0.72">
            <stop offset="0" stopColor="#ffc3dc" />
            <stop offset="0.45" stopColor="#ff92c4" />
            <stop offset="1" stopColor="#ff4f9f" />
          </radialGradient>
          <radialGradient id="tm-heart-shine" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path
          d="M28 48.2C21.6 43.4 1.4 30.6 1.4 15.4 1.4 7 7.4 1 15.2 1c5.8 0 10.2 3.2 12.8 7.6C30.6 4.2 35 1 40.8 1 48.6 1 54.6 7 54.6 15.4c0 15.2-20.2 28-26.6 32.8Z"
          fill="url(#tm-heart-body)"
        />
        <ellipse cx="16" cy="9.5" rx="9" ry="6" fill="url(#tm-heart-shine)" />
        <ellipse cx="40" cy="9.5" rx="9" ry="6" fill="url(#tm-heart-shine)" />
        <ellipse cx="28" cy="15" rx="7" ry="5" fill="url(#tm-heart-shine)" />
      </svg>
    );
  if (kind === "like" || kind === "dislike")
    return (
      <svg
        viewBox="0 0 20 20"
        width="20"
        height="20"
        aria-hidden="true"
        style={{ transform: kind === "dislike" ? "scale(-.9, -.9) rotate(10deg)" : "scale(.9) rotate(10deg)" }}
      >
        <defs>
          <linearGradient id="tm-glove" x1="0.2" y1="0" x2="0.8" y2="1">
            <stop offset="0" stopColor="var(--tm-puff-hi, currentColor)" />
            <stop offset="1" stopColor="var(--tm-puff-body, currentColor)" />
          </linearGradient>
        </defs>
        <g stroke="var(--tm-puff-edge, none)" strokeWidth="0.7" fill="url(#tm-glove)">
          <rect x="2.2" y="9.6" width="5.6" height="8.6" rx="2.8" />
          <path d="M7 9.4c1.4-.7 2.4-1.9 2.8-3.6l.6-2.6c.4-1.8 3.3-1.6 3.2.6-.1 1.3-.4 2.5-.9 3.6h3.6a1.9 1.9 0 0 1 .3 3.8 1.75 1.75 0 0 1-.2 3.4 1.65 1.65 0 0 1-.4 3.2 1.5 1.5 0 0 1-1.4 2H9.4C7.9 19.8 7 18.6 7 17Z" />
        </g>
        <path
          d="M13.4 11.1h3.2M13.6 14.4h2.8M13.6 17.5h2.2"
          fill="none"
          stroke="var(--tm-puff-edge, none)"
          strokeWidth="0.7"
          strokeLinecap="round"
        />
      </svg>
    );
  // iOS 26 draws the rest as puffy white letters, lit from the top left.
  const strokes: Record<Exclude<TapbackKind, "heart" | "like" | "dislike">, [string, string, number]> = {
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
  return (
    <svg viewBox={viewBox} width={boxWidth} height={boxHeight} aria-hidden="true">
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} stroke="var(--tm-puff-edge, currentColor)" strokeWidth={width + 0.7} />
        <path d={d} stroke="var(--tm-puff-body, currentColor)" strokeWidth={width} />
        <path
          d={d}
          stroke="var(--tm-puff-hi, currentColor)"
          strokeWidth={width * 0.5}
          transform="translate(-0.3 -0.4)"
        />
      </g>
    </svg>
  );
}

function VoiceMessage({ slots, message, scene }: {
  slots: Slots; message: Message; scene: Scene }) {
  const media = message.media!;
  const waveform = media.waveform.length
    ? media.waveform
    : Array.from(
        { length: 36 },
        (_, index) =>
          0.13 +
          0.8 * Math.abs(Math.sin(index * 1.73) * Math.cos(index * 0.41)),
      );
  const progress = media.duration ? clamp(media.playhead / media.duration) : 0;
  const person = scene.participants.find(
    (participant) => participant.id === message.senderId,
  )!;
  const displaySeconds = media.playing ? media.playhead : media.duration;
  const clock =
    scene.platform === "imessage"
      ? duration(displaySeconds).padStart(5, "0")
      : duration(displaySeconds);
  return (
    <>
      <div
        className="tm-voice"
        data-wa={scene.platform === "whatsapp" || undefined}
        data-playing={media.playing || undefined}
      >
        <span className="tm-voice-play">
          <Glyph
            name={media.playing ? "pause" : "play"}
            size={scene.platform === "imessage" ? 19 : 24}
          />
        </span>
        <div className="tm-voice-track">
          <div className="tm-waveform">
            {waveform.map((height, index) => (
              <i
                key={index}
                data-played={index / waveform.length < progress || undefined}
                style={{ height: 3 + height * 24 }}
              />
            ))}
            {scene.platform === "whatsapp" && (
              <b
                className="tm-voice-thumb"
                style={{ left: `${progress * 100}%` }}
              />
            )}
          </div>
          {scene.platform === "whatsapp" && (
            <span className="tm-voice-duration">{clock}</span>
          )}
        </div>
        {scene.platform === "whatsapp" ? (
          <span className="tm-voice-avatar">
            <Avatar slots={slots}
              name={person.name}
              url={person.avatar}
              color={person.color}
            />
            <Glyph name="mic" size={18} />
          </span>
        ) : (
          <span className="tm-voice-duration">{clock}</span>
        )}
        {media.playbackRate !== 1 && (
          <span className="tm-voice-rate">{media.playbackRate}×</span>
        )}
      </div>
      {media.transcript && (
        <span className="tm-audio-transcript">{media.transcript}</span>
      )}
    </>
  );
}

const textSegmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
function FormattedText({
  runs,
  time,
}: {
  runs: MessageTextRun[];
  time: number;
}) {
  return (
    <>
      {runs.map((run) => (
        <span
          key={run.id}
          className="tm-text-run"
          data-text-run={run.id}
          data-text-effect={run.effect}
          style={{
            fontWeight: run.bold ? 700 : undefined,
            fontStyle: run.italic ? "italic" : undefined,
            textDecoration:
              [
                run.underline ? "underline" : "",
                run.strikethrough ? "line-through" : "",
              ]
                .filter(Boolean)
                .join(" ") || undefined,
          }}
        >
          {run.effect === "none"
            ? run.text
            : run.text.split(/(\s+)/u).map((word, wordIndex) =>
                /^\s+$/u.test(word) ? (
                  word
                ) : (
                  <span className="tm-effect-word" key={wordIndex}>
                    {[...textSegmenter.segment(word)].map(
                      ({ segment }, letterIndex) => (
                        <span
                          key={letterIndex}
                          className="tm-effect-letter"
                          style={textEffectStyle(
                            run.effect,
                            time,
                            letterIndex + wordIndex * 3,
                          )}
                        >
                          {segment}
                        </span>
                      ),
                    )}
                  </span>
                ),
              )}
        </span>
      ))}
    </>
  );
}

function textEffectStyle(
  effect: MessageTextRun["effect"],
  seconds: number,
  index: number,
): CSSProperties {
  const cycle = seconds % 3.4;
  const active = clamp(1 - Math.max(0, cycle - 1.6) / 0.8);
  const phase = seconds * 8 - index * 0.48;
  let x = 0,
    y = 0,
    scale = 1,
    rotate = 0;
  if (effect === "big")
    scale = 1 + 0.25 * Math.sin(clamp(cycle / 2.4) * Math.PI);
  if (effect === "small")
    scale = 1 - 0.25 * Math.sin(clamp(cycle / 2.4) * Math.PI);
  if (effect === "shake") x = Math.sin(seconds * 35 + index) * 1.8 * active;
  if (effect === "nod") y = Math.sin(phase) * 2.5 * active;
  if (effect === "explode") {
    const burst = Math.sin(clamp(cycle / 2.4) * Math.PI);
    x = Math.sin(index * 2.3) * 5 * burst;
    y = Math.cos(index * 1.7) * 7 * burst;
    rotate = Math.sin(index * 4.1) * 15 * burst;
  }
  if (effect === "ripple") y = Math.sin(phase) * 3 * active;
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
  return (
    <svg
      className="tm-landscape"
      viewBox="0 0 600 450"
      role="img"
      aria-label="Illustrated alpine lake"
    >
      <defs>
        <linearGradient id="tm-sky" x2="0" y2="1">
          <stop stopColor="#b9d5de" />
          <stop offset="1" stopColor="#e8e5d9" />
        </linearGradient>
        <linearGradient id="tm-lake" x2="0" y2="1">
          <stop stopColor="#9bbec3" />
          <stop offset="1" stopColor="#486f79" />
        </linearGradient>
      </defs>
      <path fill="url(#tm-sky)" d="M0 0h600v450H0z" />
      <path
        fill="#94aeb0"
        d="m0 230 80-125 47 52L224 35l120 161L440 76l160 166v208H0"
      />
      <path fill="#dce5df" d="m139 143 85-108 72 97-52-20-24-30-25 51-25-12Z" />
      <path
        fill="#537577"
        d="m0 198 96 59 104-77 119 85 79-119 93 69 109-52v287H0"
      />
      <path
        fill="url(#tm-lake)"
        d="m0 305 130-36 96 17 102-13 120 30 152-15v162H0Z"
      />
      <path
        fill="#264f4d"
        d="m0 237 33 38 45 12 22 38-48 13L0 321Zm600 0-25 23-48 27-12 34 85 24Z"
      />
      <path
        stroke="#c4d6d3"
        opacity=".5"
        d="M94 337h230m55 18h160M190 375h207m-330 23h129m53 22h229"
      />
    </svg>
  );
}

function NativeIcon({
  name,
}: {
  name: "muted" | "moon" | "pin" | "edit" | "reply" | "trash";
}) {
  return (
    <svg
      className="tm-native-icon"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === "moon" ? (
        <path
          fill="currentColor"
          stroke="none"
          d="M19.7 15A8.3 8.3 0 0 1 9 4.3 8.5 8.5 0 1 0 19.7 15Z"
        />
      ) : name === "muted" ? (
        <>
          <path d="M7 6a6 6 0 0 1 11 3v5l2 4H4l2-4V9M10 21h4M3 3l18 18" />
        </>
      ) : name === "pin" ? (
        <path d="m9 3 8 3-3 4 1 6-5-2-5-1 4-4V3Zm1 11-4 8" />
      ) : name === "edit" ? (
        <path d="m15 3 6 6-12 12H3v-6L15 3Zm-10 13 3 3M12 6l6 6" />
      ) : name === "reply" ? (
        <path d="m10 5-7 6 7 6v-4c5-1 8 1 11 6 0-8-4-11-11-10V5Z" />
      ) : (
        <>
          <path d="M4 6h16M9 3h6M6 6l1 15h10l1-15M10 10v7M14 10v7" />
        </>
      )}
    </svg>
  );
}

function FocusStatus({ scene }: { scene: Scene }) {
  const focus = scene.conversation?.focus;
  if (scene.platform !== "imessage" || !focus?.visible) return null;
  return (
    <div className="tm-focus-status">
      <span>
        <NativeIcon name="moon" />
        {focus.name} has notifications silenced
      </span>
      {focus.notifyAnyway && <b>Notify Anyway</b>}
    </div>
  );
}

function PinnedBanner({ slots, scene }: {
  slots: Slots; scene: Scene }) {
  const pin = scene.conversation?.pinned;
  const message = scene.messages.find(
    (message) => message.id === pin?.messageId,
  );
  if (!pin || !message) return null;
  return (
    <div className="tm-pinned-banner">
      <NativeIcon name="pin" />
      <div>
        {scene.platform === "telegram" && <strong>{pin.label}</strong>}
        <span>
          {message.text ||
            message.file?.name ||
            message.link?.title ||
            message.kind}
        </span>
      </div>
      {message.media?.url && (
        <slots.Image
          src={message.media.poster ?? message.media.url}
          alt=""
          referrerPolicy="no-referrer"
        />
      )}
      <Glyph
        name={scene.platform === "telegram" ? "close" : "chevron"}
        size={15}
      />
    </div>
  );
}

function RecordingComposer({ scene }: { scene: Scene }) {
  const state = scene.composer.context!.recording;
  const waveform = state.waveform.length
    ? state.waveform
    : Array.from({ length: 40 }, () => 0.05);
  return (
    <div
      className="tm-recording"
      data-locked={state.locked || undefined}
      data-paused={state.paused || undefined}
      aria-hidden="true"
    >
      <div className="tm-recording-meter">
        <span className="tm-recording-dot" />
        <span className="tm-recording-time">{duration(state.duration)}</span>
        {state.locked || scene.platform === "imessage" ? (
          <div className="tm-recording-wave">
            {waveform.map((height, index) => (
              <i key={index} style={{ height: `${3 + height * 29}px` }} />
            ))}
          </div>
        ) : (
          <span className="tm-slide-cancel">‹ slide to cancel</span>
        )}
        {!state.locked && scene.platform !== "imessage" && (
          <span className="tm-recording-lock">
            <Glyph name="lock" size={16} />
            <Glyph name="chevron" size={12} />
          </span>
        )}
        <span className="tm-recording-stop">
          {state.locked ? (
            <Glyph name={state.paused ? "mic" : "pause"} size={22} />
          ) : scene.platform === "imessage" ? (
            <i />
          ) : (
            <Glyph name="mic" size={23} />
          )}
        </span>
      </div>
      {state.locked && (
        <div className="tm-recording-actions">
          <NativeIcon name="trash" />
          <span>{state.paused ? "Resume recording" : "Pause"}</span>
          <span className="tm-send">
            <Glyph
              name={scene.platform === "telegram" ? "send" : "arrow-up"}
              size={20}
            />
          </span>
        </div>
      )}
    </div>
  );
}

function NativeInteraction({ slots, scene, time }: {
  slots: Slots; scene: Scene; time: number }) {
  const picker = scene.interactions?.tapbackPicker;
  const message = scene.messages.find(
    (message) => message.id === picker?.messageId,
  );
  if (picker?.visible && message) {
    const outgoing = !!scene.participants.find(
      (person) => person.id === message.senderId,
    )?.isSelf;
    const groups = groupedReactions(message, scene);
    return (
      <div
        className="tm-native-overlay tm-reaction-overlay"
        data-native-interaction="tapback"
        aria-hidden="true"
      >
        {scene.platform === "imessage" && groups.length > 0 && (
          <div className="tm-reaction-attributions">
            {groups.slice(0, 3).map((group) => (
              <div
                key={group.emoji}
                title={`${group.emoji}: ${group.names.join(", ")}`}
              >
                <span>
                  {group.emoji}
                  {group.names.length > 1 && (
                    <small>{group.names.length}</small>
                  )}
                </span>
                <div>
                  {message.reactions
                    .filter((reaction) => reaction.emoji === group.emoji)
                    .slice(0, 3)
                    .map((reaction) => {
                      const person = scene.participants.find(
                        (person) => person.id === reaction.participantId,
                      );
                      return (
                        person && (
                          <Avatar slots={slots}
                            key={reaction.id}
                            name={person.name}
                            url={person.avatar}
                            color={person.color}
                          />
                        )
                      );
                    })}
                  {group.names.length > 3 && (
                    <small>+{group.names.length - 3}</small>
                  )}
                </div>
              </div>
            ))}
            {groups.length > 3 && (
              <small
                title={groups
                  .slice(3)
                  .map((group) => `${group.emoji}: ${group.names.join(", ")}`)
                  .join("; ")}
              >
                +
                {groups
                  .slice(3)
                  .reduce((total, group) => total + group.names.length, 0)}
              </small>
            )}
          </div>
        )}
        <div className="tm-message-context" data-side={outgoing ? "out" : "in"}>
          <div className="tm-tapback-picker">
            {picker.emojis.map((emoji, index) => (
              <span
                key={index}
                data-picked={picker.selectedEmoji === emoji || undefined}
              >
                {emoji}
              </span>
            ))}
            <Glyph name="plus" size={19} />
          </div>
          <div
            className="tm-bubble"
            data-side={outgoing ? "out" : "in"}
            data-kind={message.kind}
          >
            <MessageContent slots={slots} message={message} scene={scene} time={time} />
          </div>
          {picker.showMenu && (
            <div className="tm-message-menu">
              <span>
                Reply
                <NativeIcon name="reply" />
              </span>
              {scene.platform === "imessage" && (
                <span>
                  Add Sticker
                  <Glyph name="sticker" size={17} />
                </span>
              )}
              <span>
                Copy
                <Glyph name="file" size={17} />
              </span>
              {outgoing && (
                <span>
                  Edit
                  <NativeIcon name="edit" />
                </span>
              )}
              <span>
                More…
                <Glyph name="more" size={17} />
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  const tray = scene.interactions?.attachmentTray;
  if (!tray?.visible) return null;
  const items = tray.items ?? [];
  const apps =
    scene.platform === "imessage"
      ? ([
          ["Camera", "camera"],
          ["Photos", "camera"],
          ["Stickers", "sticker"],
          ["Apple Cash", "gift"],
          ["Audio", "wave"],
          ["Location", "pin"],
          ["More", "more"],
        ] as const)
      : scene.platform === "whatsapp"
        ? ([
            ["Camera", "camera"],
            ["Photos", "camera"],
            ["Document", "file"],
            ["Location", "pin"],
            ["Contact", "phone"],
            ["Poll", "more"],
          ] as const)
        : ([
            ["Gallery", "camera"],
            ["File", "file"],
            ["Location", "pin"],
            ["Contact", "phone"],
            ["Poll", "more"],
          ] as const);
  return (
    <div
      className="tm-native-overlay tm-attachment-overlay"
      data-native-interaction="attachment"
      data-tray-kind={tray.kind}
      aria-hidden="true"
    >
      <div className="tm-attachment-sheet">
        <div className="tm-sheet-grabber" />
        {tray.kind === "apps" ? (
          <div className="tm-app-tray">
            {apps.map(([label, icon], index) => (
              <div key={label}>
                <span
                  style={{
                    background: [
                      "#8b8b90",
                      "#faab50",
                      "#9269dc",
                      "#272a2b",
                      "#ee595d",
                      "#398af1",
                      "#85858c",
                    ][index],
                  }}
                >
                  <Glyph name={icon} size={24} />
                </span>
                <b>{label}</b>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="tm-tray-heading">
              <span>{tray.kind === "photos" ? "Photos" : "Stickers"}</span>
              <Glyph name="close" size={20} />
            </div>
            <div className="tm-tray-tabs">
              {tray.kind === "photos" ? (
                <>
                  <span>Library</span>
                  <span>Albums</span>
                </>
              ) : (
                <>
                  <Glyph name="clock" size={20} />
                  <Glyph name="sticker" size={20} />
                  <Glyph name="smile" size={20} />
                </>
              )}
            </div>
            {items.length ? (
              <div className="tm-asset-tray">
                {items.map((item) => (
                  <div key={item.id}>
                    {item.url ? (
                      <slots.Image
                        src={item.url}
                        alt={item.label}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span>{item.emoji}</span>
                    )}
                    {item.label && <small>{item.label}</small>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="tm-tray-empty">
                <Glyph
                  name={tray.kind === "photos" ? "camera" : "sticker"}
                  size={40}
                />
                <strong>
                  {tray.kind === "photos" ? "No Photos" : "No Recent Stickers"}
                </strong>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ComposerText({ scene, time }: { scene: Scene; time: number }) {
  const text = scene.composer.text;
  const selection =
    scene.composer.selection?.visible !== false
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
    ...[...textSegmenter.segment(text)].map(
      ({ index, segment }) => index + segment.length,
    ),
  ];
  const start = boundaries.findLast((value) => value <= rawStart) ?? 0;
  const end =
    rawEnd === rawStart
      ? start
      : (boundaries.find((value) => value >= rawEnd) ?? text.length);
  const marker = (
    <i
      className="tm-caret"
      style={{ opacity: Math.floor(time * 2) % 2 === 0 ? 1 : 0.2 }}
    />
  );
  if (start === end)
    return (
      <>
        {text.slice(0, start)}
        {caret && marker}
        {text.slice(start)}
      </>
    );
  return (
    <>
      {text.slice(0, start)}
      <mark
        className="tm-draft-selection"
        data-handles={selection?.showHandles || undefined}
      >
        {text.slice(start, end)}
      </mark>
      {text.slice(end)}
    </>
  );
}

function Composer({ scene, time }: { scene: Scene; time: number }) {
  const context = scene.composer.context;
  const mode = context?.mode ?? "normal";
  const nativeEdit = scene.platform === "imessage" && mode === "edit";
  const hasText = !nativeEdit && scene.composer.text.length > 0;
  const referenced = scene.messages.find(
    (message) => message.id === context?.messageId,
  );
  const person = scene.participants.find(
    (participant) => participant.id === referenced?.senderId,
  );
  const placeholder =
    mode === "reply" && scene.platform === "imessage"
      ? "Reply"
      : scene.platform === "imessage" &&
          scene.composer.placeholder === "iMessage" &&
          scene.header?.transport !== undefined &&
          scene.header.transport !== "imessage"
        ? `Text Message · ${scene.header.transport.toUpperCase()}`
        : scene.composer.placeholder;
  if (mode === "recording" && context)
    return <RecordingComposer scene={scene} />;
  if (scene.platform === "instagram")
    return (
      <div className="tm-composer-wrap" data-mode={mode} aria-hidden="true">
        {(mode === "reply" || mode === "edit") && (
          <div className="tm-compose-context">
            <NativeIcon name={mode === "edit" ? "edit" : "reply"} />
            <div>
              <strong>
                {mode === "edit"
                  ? "Edit message"
                  : `Replying to ${person?.isSelf ? "yourself" : (person?.name ?? "message")}`}
              </strong>
              <span>{referenced?.text || referenced?.kind}</span>
            </div>
            <Glyph name="close" size={18} />
          </div>
        )}
        {mode === "scheduled" && (
          <div className="tm-ig-scheduled">
            <Glyph name="clock" size={14} />
            {context?.scheduledAt}
          </div>
        )}
        <div className="tm-composer">
          <div className="tm-composer-field">
            <span className="tm-ig-camera">
              <Glyph name="camera" size={22} />
            </span>
            <span
              className={
                hasText ? "tm-composer-text" : "tm-composer-placeholder"
              }
            >
              {hasText ? (
                <ComposerText scene={scene} time={time} />
              ) : (
                <>
                  {placeholder === "iMessage" || placeholder === "Message"
                    ? "Message…"
                    : placeholder}
                  {scene.composer.focused && <i className="tm-caret" />}
                </>
              )}
            </span>
            {hasText ? (
              <span className="tm-ig-send">
                {mode === "edit" ? "Done" : "Send"}
              </span>
            ) : (
              <span className="tm-ig-input-actions">
                <Glyph name="mic" size={22} />
                <svg
                  width="23"
                  height="23"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <rect x="3" y="3" width="18" height="18" rx="4" />
                  <circle cx="8" cy="8" r="1.5" />
                  <path d="m4 17 5-6 4 4 3-3 5 5" />
                </svg>
                <Glyph name="sticker" size={23} />
              </span>
            )}
          </div>
        </div>
      </div>
    );
  if (sceneOs(scene) === "android")
    return <AndroidComposer scene={scene} time={time} />;
  return (
    <div className="tm-composer-wrap" data-mode={mode} aria-hidden="true">
      {scene.platform !== "imessage" &&
        (mode === "reply" || mode === "edit") && (
          <div className="tm-compose-context">
            <NativeIcon name={mode === "edit" ? "edit" : "reply"} />
            <div>
              <strong>
                {mode === "edit" ? "Edit Message" : (person?.name ?? "Reply")}
              </strong>
              <span>{referenced?.text || referenced?.kind}</span>
            </div>
            <Glyph name="close" size={18} />
          </div>
        )}
      <div className="tm-composer" data-native-edit={nativeEdit || undefined}>
        <span className="tm-add">
          {scene.platform === "imessage" ? (
            <ComposerIcon name="plus" />
          ) : (
            <Glyph
              name={scene.platform === "telegram" ? "paperclip" : "plus"}
              size={24}
            />
          )}
        </span>
        <div
          className="tm-composer-field"
          data-scheduled={mode === "scheduled" || undefined}
        >
          {mode === "scheduled" && (
            <div className="tm-schedule-chip">
              <Glyph name="clock" size={13} />
              <span>{context?.scheduledAt}</span>
              <Glyph name="chevron" size={12} />
              <Glyph name="close" size={15} />
            </div>
          )}
          <span
            className={hasText ? "tm-composer-text" : "tm-composer-placeholder"}
          >
            {hasText ? (
              <ComposerText scene={scene} time={time} />
            ) : (
              <>
                {placeholder}
                {!nativeEdit && scene.composer.focused && (
                  <i className="tm-caret" />
                )}
              </>
            )}
          </span>
          {!hasText && scene.platform === "telegram" && (
            <Glyph name="gift" size={20} />
          )}{" "}
          {!hasText &&
            (scene.platform === "imessage" ? (
              <ComposerIcon name="mic" />
            ) : (
              <Glyph name="sticker" size={20} />
            ))}{" "}
          {hasText && scene.platform === "imessage" && (
            <span className="tm-send">
              <Glyph name="arrow-up" size={20} />
            </span>
          )}
        </div>
        {scene.platform === "whatsapp" && !hasText && (
          <span className="tm-composer-mic" data-camera>
            <Glyph name="camera" size={22} />
          </span>
        )}
        {scene.platform !== "imessage" && (
          <span className={hasText ? "tm-send" : "tm-composer-mic"}>
            <Glyph
              name={
                hasText
                  ? mode === "edit"
                    ? "check"
                    : scene.platform === "telegram" ||
                        scene.platform === "whatsapp"
                      ? "send"
                      : "arrow-up"
                  : "mic"
              }
              size={22}
            />
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Android composers share a pill field plus a circular voice/send button;
 * each app arranges its own icons inside the field.
 */
function AndroidComposer({ scene, time }: { scene: Scene; time: number }) {
  const context = scene.composer.context;
  const mode = context?.mode ?? "normal";
  const platform = scene.platform;
  const hasText = scene.composer.text.length > 0;
  const referenced = scene.messages.find(
    (message) => message.id === context?.messageId,
  );
  const person = scene.participants.find(
    (participant) => participant.id === referenced?.senderId,
  );
  const placeholder =
    platform === "google-messages"
      ? scene.header?.transport === "sms"
        ? "Text message"
        : scene.composer.placeholder === "iMessage" ||
            scene.header?.transport === "rcs"
          ? "RCS message"
          : scene.composer.placeholder
      : scene.composer.placeholder === "iMessage"
        ? "Message"
        : scene.composer.placeholder;
  return (
    <div className="tm-composer-wrap" data-mode={mode} aria-hidden="true">
      {(mode === "reply" || mode === "edit") && (
        <div className="tm-compose-context">
          <MatIcon name={mode === "edit" ? "close" : "reply"} size={20} />
          <div>
            <strong>
              {mode === "edit"
                ? "Edit message"
                : (person?.name ?? "Reply")}
            </strong>
            <span>{referenced?.text || referenced?.kind}</span>
          </div>
          <MatIcon name="close" size={20} />
        </div>
      )}
      <div className="tm-composer">
        <div
          className="tm-composer-field"
          data-scheduled={mode === "scheduled" || undefined}
        >
          {mode === "scheduled" && (
            <div className="tm-schedule-chip">
              <MatIcon name="schedule" size={14} />
              <span>{context?.scheduledAt}</span>
              <MatIcon name="close" size={16} />
            </div>
          )}
          {platform === "google-messages" && mode !== "scheduled" && (
            <MatIcon name="add" size={24} className="tm-field-icon" />
          )}
          {(platform === "whatsapp" || platform === "telegram") && (
            <MatIcon name="mood" size={24} className="tm-field-icon" />
          )}
          <span
            className={hasText ? "tm-composer-text" : "tm-composer-placeholder"}
          >
            {hasText ? (
              <ComposerText scene={scene} time={time} />
            ) : (
              <>
                {placeholder}
                {scene.composer.focused && <i className="tm-caret" />}
              </>
            )}
          </span>
          {platform === "google-messages" && (
            <>
              <MatIcon name="mood" size={24} className="tm-field-icon" />
              {!hasText && (
                <MatIcon
                  name="photo_library"
                  size={24}
                  className="tm-field-icon"
                />
              )}
            </>
          )}
          {platform === "whatsapp" && !hasText && (
            <>
              <MatIcon name="attach_file" size={23} className="tm-field-icon" />
              <MatIcon name="photo_camera" size={23} className="tm-field-icon" />
            </>
          )}
          {platform === "whatsapp" && hasText && (
            <MatIcon name="photo_camera" size={23} className="tm-field-icon" />
          )}
          {platform === "telegram" && !hasText && (
            <MatIcon name="attach_file" size={23} className="tm-field-icon" />
          )}
        </div>
        <span className={hasText ? "tm-send" : "tm-composer-mic"}>
          <MatIcon
            name={
              hasText ? (mode === "edit" ? "check" : "send-fill") : "mic-fill"
            }
            size={hasText ? 19 : 24}
          />
        </span>
      </div>
    </div>
  );
}

function Keyboard({ scene }: { scene: Scene }) {
  if (sceneOs(scene) === "android") return <AndroidKeyboard scene={scene} />;
  if (scene.composer.keyboard === "emoji")
    return (
      <div className="tm-keyboard tm-emoji-keyboard" aria-hidden="true">
        <div className="tm-emoji-search">
          <Glyph name="smile" size={17} />
          <span>Search Emoji</span>
        </div>
        <span className="tm-emoji-heading">SMILEYS & PEOPLE</span>
        <div className="tm-emoji-grid">
          {[
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
          ].map((emoji) => (
            <span key={emoji}>{emoji}</span>
          ))}
        </div>
        <div className="tm-emoji-footer">
          <span>ABC</span>
          <Glyph name="clock" size={19} />
          <Glyph name="smile" size={20} />
          <span>♡</span>
          <span>♧</span>
          <span>⚑</span>
          <Glyph name="backspace" size={24} />
        </div>
      </div>
    );
  return (
    <div className="tm-keyboard tm-alphabetic-keyboard" aria-hidden="true">
      {["qwertyuiop", "asdfghjkl", "zxcvbnm"].map((row, index) => (
        <div className="tm-key-row" key={row}>
          {index === 2 && (
            <span className="tm-key tm-key-mod">
              <Glyph name="shift" size={19} />
            </span>
          )}
          {[...row].map((letter) => (
            <span className="tm-key" key={letter}>
              {letter}
            </span>
          ))}
          {index === 2 && (
            <span className="tm-key tm-key-mod">
              <Glyph name="backspace" size={22} />
            </span>
          )}
        </div>
      ))}
      <div className="tm-key-row tm-key-bottom">
        <span className="tm-key tm-key-mod">123</span>
        <span className="tm-key tm-key-space">space</span>
        <span className="tm-key tm-key-return">return</span>
      </div>
      <div className="tm-keyboard-bottom">
        <Glyph name="smile" size={27} />
        <Glyph name="mic" size={24} />
      </div>
    </div>
  );
}

function TypingDots({ time }: { time: number }) {
  return (
    <div className="tm-typing" aria-label="Typing">
      {[0, 1, 2].map((index) => (
        <i
          key={index}
          style={{
            opacity:
              0.35 + 0.65 * Math.max(0, Math.sin(time * 5 - index * 0.8)),
            transform: `translateY(${-1.5 * Math.max(0, Math.sin(time * 5 - index * 0.8))}px)`,
          }}
        />
      ))}
      <b />
      <b />
    </div>
  );
}

function ScreenEffect({
  effect,
  time,
}: {
  effect: Scene["appearance"]["screenEffect"];
  time: number;
}) {
  if (effect === "spotlight")
    return (
      <div
        className="tm-screen-effect tm-spotlight"
        style={{
          backgroundPosition: `${50 + Math.sin(time * 0.8) * 25}% ${50 + Math.cos(time * 0.6) * 20}%`,
        }}
      />
    );
  if (effect === "lasers")
    return (
      <div className="tm-screen-effect tm-lasers">
        {[0, 1, 2, 3].map((index) => (
          <i
            key={index}
            style={{
              transform: `rotate(${Math.sin(time + index * 1.7) * 60}deg)`,
              background: ["#ec387c", "#28b8e8", "#73eeaf", "#b084ff"][index],
            }}
          />
        ))}
      </div>
    );
  return (
    <div className="tm-screen-effect" data-screen-effect={effect}>
      {Array.from({ length: effect === "echo" ? 8 : 36 }, (_, index) => {
        const seed = Math.sin(index * 91.31 + 2.7) * 10000;
        const x = (seed - Math.floor(seed)) * 100;
        const phase =
          (time * (effect === "balloons" ? 0.1 : 0.16) + index * 0.083) % 1;
        return (
          <span
            key={index}
            className={`tm-particle tm-particle-${effect}`}
            style={{
              left: `${x}%`,
              top: `${effect === "balloons" || effect === "hearts" ? 105 - phase * 130 : phase * 115 - 10}%`,
              transform: `translateX(${Math.sin(time + index) * 26}px) rotate(${phase * 300 + index * 23}deg)`,
              color: ["#fc75a6", "#87ccec", "#f8ce73", "#9ce0c2", "#b39aef"][
                index % 5
              ],
              opacity: effect === "echo" ? 0.4 : 0.85,
            }}
          >
            {effect === "hearts"
              ? "♥"
              : effect === "balloons"
                ? "●"
                : effect === "fireworks"
                  ? "✦"
                  : effect === "echo"
                    ? "✧"
                    : ""}
          </span>
        );
      })}
    </div>
  );
}

function messageStyle(
  message: Message,
  time: number,
  animate: boolean,
): CSSProperties {
  const p = message.presentation;
  const age = Math.max(0, time - message.at);
  const enter = animate ? clamp(age / 0.32) : 1;
  const spring =
    enter === 1
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
    transform:
      x === 0 && y === 0 && scale === 1 && rotate === 0
        ? undefined
        : `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotate}deg)`,
  };
}

/** Relative luminance of a #rrggbb color, 0 to 1. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((at) => {
    const c = parseInt(hex.slice(at, at + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function emojiOnly(text: string): boolean {
  if (
    !text.trim() ||
    !/^[\p{Extended_Pictographic}\p{Emoji_Component}\u200d\ufe0f\s]+$/u.test(
      text,
    ) ||
    /[0-9#*]/u.test(text)
  )
    return false;
  return (
    [
      ...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(
        text.replace(/\s+/gu, ""),
      ),
    ].length <= 3
  );
}
function safeHostname(url?: string): string {
  try {
    return new URL(url ?? "").hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
function formatBytes(bytes: number): string {
  return bytes >= 1e6
    ? `${(bytes / 1e6).toFixed(1)} MB`
    : bytes >= 1e3
      ? `${Math.round(bytes / 1e3)} KB`
      : `${bytes} B`;
}
