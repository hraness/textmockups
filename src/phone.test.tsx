import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Phone, PhoneFit, type PhoneImageProps } from "./phone.js";
import type { PhoneTextProps } from "./text.js";
import { defaultScene, presets } from "./presets.js";
import { parseScene } from "./schema.js";

const withAvatar = (avatar: string) =>
  parseScene({
    ...defaultScene,
    contact: { ...defaultScene.contact, avatar },
  });

describe("Phone", () => {
  test("renders every preset on the server without scripts", () => {
    for (const preset of presets) {
      const html = renderToStaticMarkup(<Phone scene={preset.scene} />);
      expect(html).toContain("data-textmock-phone");
      expect(html).toContain(`data-platform="${preset.scene.platform}"`);
    }
  });
  test("iMessage quotes a reply run's original once and threads a spine past the run", () => {
    const me = "me";
    const ben = "ben";
    const scene = parseScene({
      ...defaultScene,
      platform: "imessage",
      participants: [
        { id: me, name: "Me", isSelf: true },
        { id: ben, name: "Ben" },
      ],
      contact: { kind: "direct", name: "Ben", participantIds: [ben] },
      messages: [
        { id: "o", senderId: me, text: "Original" },
        { id: "x", senderId: ben, text: "Between" },
        { id: "r1", senderId: ben, text: "First", replyTo: "o" },
        { id: "r2", senderId: me, text: "Second", replyTo: "o" },
        { id: "r3", senderId: ben, text: "Third", replyTo: "o", dateLabel: "Today 4:08 PM" },
        { id: "r4", senderId: me, text: "Fourth", replyTo: "o" },
        { id: "l", senderId: ben, text: "", kind: "link", link: { url: "https://example.com", title: "Example" } },
        { id: "y", senderId: me, text: "Between" },
        { id: "lr", senderId: me, text: "On the link", replyTo: "l" },
      ],
    });
    const html = renderToStaticMarkup(<Phone scene={scene} />);
    // One compact quote for the text run, a full ghost for the link.
    expect(html.match(/tm-reply-ghost"/g)).toHaveLength(2);
    expect(html.match(/data-compact="true"/g)).toHaveLength(1);
    expect(html).toContain("4 Replies");
    expect(html.match(/tm-thread-loop/g)).toHaveLength(1);
    expect(html.match(/tm-thread-end/g)).toHaveLength(2);
    expect(html).toContain('data-at="date"');
  });
  test("the iOS keyboard suggests words for what is typed and starts sentences fresh", () => {
    const bar = (text: string) => {
      const scene = parseScene({
        ...defaultScene,
        platform: "imessage",
        composer: { ...defaultScene.composer, text, focused: true, keyboard: "alphabetic" },
      });
      const html = renderToStaticMarkup(<Phone scene={scene} />);
      return [...(/<div class="tm-kb-predict">(.*?)<\/div>/.exec(html)?.[1] ?? "").matchAll(/<span>(.*?)<\/span>/g)].map((m) => m[1]);
    };
    expect(bar("")).toEqual(["I", "The", "I&#x27;m"]);
    expect(bar("Help with?")).toEqual(["I", "The", "I&#x27;m"]);
    expect(bar("see you ")).toEqual(["I", "the", "and"]);
    expect(bar("see you th")[0]).toBe("“th”");
  });
  test("iMessage holds the send button down while it sends", () => {
    const send = (pressedKey?: string) =>
      renderToStaticMarkup(
        <Phone scene={parseScene({ ...defaultScene, platform: "imessage", composer: { ...defaultScene.composer, text: "On my way", ...(pressedKey ? { pressedKey } : {}) } })} />,
      ).match(/<span class="tm-send"[^>]*>/)?.[0];
    expect(send("send")).toContain("data-pressed");
    expect(send()).not.toContain("data-pressed");
    expect(send("a")).not.toContain("data-pressed");
  });
  test("is deterministic for a fixed playhead", () => {
    const render = () =>
      renderToStaticMarkup(<Phone scene={defaultScene} time={2.5} />);
    expect(render()).toBe(render());
  });
  test("the default image slot renders HTTPS assets and leaves browser-local references empty", () => {
    const https = renderToStaticMarkup(
      <Phone scene={withAvatar("https://example.com/a.png")} />,
    );
    expect(https).toContain('src="https://example.com/a.png"');
    const local = renderToStaticMarkup(
      <Phone scene={withAvatar(`local:${"a".repeat(64)}`)} />,
    );
    expect(local).not.toContain("local:");
  });
  test("the default text slot leaves the markup unchanged apart from message ids", () => {
    const html = renderToStaticMarkup(<Phone scene={defaultScene} />);
    expect(html).toContain(`data-message-id="${defaultScene.messages[0]!.id}"`);
    for (const message of defaultScene.messages)
      if (message.text && !message.textRuns) expect(html).toContain(message.text.replaceAll("'", "&#x27;"));
  });
  test("a custom text slot wraps message text, the contact name, and the clock", () => {
    const seen = new Set<string>();
    const Text = ({ field, messageId, children }: PhoneTextProps) => {
      seen.add(messageId ? `${field}:${messageId}` : field);
      return <b data-edit={field}>{children}</b>;
    };
    for (const preset of presets) {
      seen.clear();
      renderToStaticMarkup(<Phone scene={preset.scene} text={Text} />);
      expect(seen.has("contact")).toBe(true);
      if (preset.scene.statusBar.visible) expect(seen.has("clock")).toBe(true);
      const texted = preset.scene.messages.find((message) => message.text);
      if (texted) expect(seen.has(`message:${texted.id}`)).toBe(true);
    }
  });
  test("a custom image slot receives the authored reference", () => {
    const seen: unknown[] = [];
    const Image = (props: PhoneImageProps) => {
      seen.push(props.src);
      return <img data-custom alt="" />;
    };
    const ref = `local:${"b".repeat(64)}`;
    const html = renderToStaticMarkup(
      <Phone scene={withAvatar(ref)} media={{ Image }} />,
    );
    expect(seen).toContain(ref);
    expect(html).toContain("data-custom");
  });
  test("watermark is on by default and can be turned off", () => {
    expect(renderToStaticMarkup(<Phone scene={defaultScene} />)).toContain(
      "data-textmock-watermark",
    );
    expect(
      renderToStaticMarkup(<Phone scene={defaultScene} watermark={false} />),
    ).not.toContain("data-textmock-watermark");
  });
  test("PhoneFit keeps the device ratio and scales by CSS", () => {
    const html = renderToStaticMarkup(<PhoneFit scene={defaultScene} />);
    expect(html).toContain('class="tm-fit"');
    expect(html).toContain("aspect-ratio:393 / 852");
    expect(html).toContain("--tm-fit-width:393px");
  });
  test("Android scenes draw Android chrome and no iPhone hardware", () => {
    const scene = presets.find((preset) => preset.id === "pixel-late")!.scene;
    const html = renderToStaticMarkup(<Phone scene={scene} />);
    expect(html).toContain('data-os="android"');
    expect(html).toContain('data-model="pixel-11-pro"');
    expect(html).toContain('data-system="pixel"');
    expect(html).toContain("tm-status-android");
    expect(html).toContain("tm-nav-bar");
    expect(html).toContain('class="tm-cutout"');
    expect(html).toContain("tm-gm-receipt");
    expect(html).not.toContain("tm-island");
    expect(html).not.toContain("tm-home-indicator");
    expect(html).not.toContain("tm-side-button");
  });
  test("Galaxy scenes draw One UI three-button navigation", () => {
    const scene = presets.find((preset) => preset.id === "galaxy-dinner")!
      .scene;
    const html = renderToStaticMarkup(<Phone scene={scene} />);
    expect(html).toContain('data-system="one-ui"');
    expect(html).toContain("tm-nav-recents");
  });
  test("a frameless device model draws no hardware chrome", () => {
    const scene = parseScene({
      ...defaultScene,
      platform: "whatsapp",
      device: { model: "pixel-11", frame: "none" },
    });
    const html = renderToStaticMarkup(<Phone scene={scene} />);
    expect(html).toContain('data-frame="none"');
    expect(html).toContain("tm-status-android");
    expect(html).not.toContain('class="tm-cutout"');
    expect(html).not.toContain("tm-side-key");
  });
  test("PhoneFit sizes a modelled phone by its framed stage", () => {
    const scene = presets.find((preset) => preset.id === "pixel-late")!.scene;
    const html = renderToStaticMarkup(<PhoneFit scene={scene} />);
    expect(html).toContain("aspect-ratio:442 / 946");
  });
  test("iMessage sets the day of a date label in semibold", () => {
    const scene = parseScene({
      ...defaultScene,
      messages: [{ ...defaultScene.messages[0], dateLabel: "Today 9:41 AM" }],
    });
    expect(renderToStaticMarkup(<Phone scene={scene} />)).toContain(
      "<b>Today</b> 9:41\u202fAM",
    );
    const plain = parseScene({
      ...scene,
      messages: [{ ...scene.messages[0], dateLabel: "Yesterday" }],
    });
    expect(renderToStaticMarkup(<Phone scene={plain} />)).toContain(
      "<span>Yesterday</span>",
    );
  });
  test("iMessage sets emoji apart and underlines a detected time", () => {
    const scene = parseScene({
      ...defaultScene,
      messages: [{ ...defaultScene.messages[0], text: "the drop at 3:17 😆" }],
    });
    const html = renderToStaticMarkup(<Phone scene={scene} />);
    expect(html).toContain('<span class="tm-detected">3:17</span>');
    expect(html).toContain('<span class="tm-emoji">😆</span>');
  });
  test("a pause starts a new bubble group from the same sender", () => {
    const first = { ...defaultScene.messages[0], id: "a", text: "one", dateLabel: "" };
    const tails = (pause: boolean) =>
      renderToStaticMarkup(
        <Phone
          scene={parseScene({
            ...defaultScene,
            messages: [first, { ...first, id: "b", text: "two", pause }],
          })}
        />,
      ).match(/data-tail="true"/g)?.length;
    expect(tails(false)).toBe(1);
    expect(tails(true)).toBe(2);
  });
  test("iMessage staggers two or three photos and stacks four or more", () => {
    const gallery = (count: number, video = [false, false]) =>
      renderToStaticMarkup(
        <Phone
          scene={parseScene({
            ...defaultScene,
            messages: [
              {
                ...defaultScene.messages[0],
                kind: "image",
                text: "",
                gallery: {
                  items: [
                    { width: 800, height: 600, video: video[0] },
                    { width: 600, height: 800, video: video[1] },
                  ],
                  count,
                },
              },
            ],
          })}
        />,
      );
    expect(gallery(3)).toContain("tm-im-collage");
    expect(gallery(4)).toContain("tm-im-deck");
    expect(gallery(4)).toContain("4 Photos");
    expect(gallery(15, [true, true])).toContain("15 Videos");
    expect(gallery(5, [false, true])).toContain("5 Items");
    // A square photo crops to the same 4:3 tile as a wide one; a deck card is always 3:4.
    expect(gallery(2)).toContain("width:217.33px;height:166.67px");
    expect(gallery(2)).toContain("width:174.67px;height:228.33px");
    expect(gallery(4)).toContain("width:250px;height:333.33px");
  });
  test("the typing dots pulse like ChatKit's: 0.2 to 0.45 opacity, each 0.25 s behind the last, never moving", () => {
    const dots = (time: number) => {
      const html = renderToStaticMarkup(
        <Phone
          scene={parseScene({ ...defaultScene, composer: { ...defaultScene.composer, typing: { visible: true, participantId: "jamie" } } })}
          time={time}
        />,
      );
      const typing = html.slice(html.indexOf('class="tm-typing"'));
      expect(typing).not.toContain("transform");
      return [...typing.matchAll(/<i style="opacity:([\d.]+)"/g)].slice(0, 3).map((match) => Number(match[1]));
    };
    expect(dots(0)).toEqual([0.2, 0.2, 0.2]);
    // Dot one peaks at 0.5 s, when dot two is a quarter-cycle in and dot three just starting.
    const peak = dots(0.5);
    expect(peak[0]).toBe(0.45);
    expect(peak[1]!).toBeGreaterThan(0.2);
    expect(peak[1]!).toBeLessThan(0.45);
    expect(peak[2]).toBe(0.2);
    // Autoreversing: back to rest a full second after each dot starts.
    expect(dots(1)[0]).toBe(0.2);
    expect(dots(1.25)[1]).toBe(0.2);
  });
  test("iMessage draws a link it hasn't loaded as Tap to Load Preview, whatever its preview", () => {
    const tap = (link: Record<string, unknown>) =>
      renderToStaticMarkup(
        <Phone
          scene={parseScene({
            ...defaultScene,
            messages: [{ ...defaultScene.messages[0], kind: "link", text: "", link: { title: "Example", ...link } }],
          })}
        />,
      );
    const html = tap({ url: "https://www.example.com/page", tapToLoad: true, tint: "#336699" });
    expect(html).toContain("tm-link-tap");
    expect(html).toContain("Tap to Load Preview");
    expect(html).toContain("<small>example.com</small>");
    expect(html).not.toContain("data-tint");
    expect(html).not.toContain("tm-link-compact");
    expect(tap({ url: "https://www.example.com/page" })).not.toContain("tm-link-tap");
  });
  test("iMessage draws a shared pin as a map with the Maps marker, over a supplied map", () => {
    const pin = (map?: string) =>
      renderToStaticMarkup(
        <Phone
          scene={parseScene({
            ...defaultScene,
            messages: [
              {
                ...defaultScene.messages[0],
                kind: "location",
                text: "",
                location: { latitude: 40.7851, longitude: -73.9683, label: "Location from 11/5/26", ...(map ? { map } : {}) },
              },
            ],
          })}
        />,
      );
    expect(pin()).toContain("tm-im-pin");
    expect(pin()).toContain("Location from 11/5/26");
    expect(pin()).toContain("tm-map-marker");
    expect(pin()).toContain("tm-map-art");
    const map = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    expect(pin(map)).toContain(`src="${map}"`);
    expect(pin(map)).not.toContain("tm-map-art");
    const link = (url: string) =>
      renderToStaticMarkup(
        <Phone
          scene={parseScene({
            ...defaultScene,
            messages: [{ ...defaultScene.messages[0], kind: "link", text: url, link: { url, title: "" } }],
          })}
        />,
      );
    // Coordinates draw a dropped pin even beside a search; a named place or a search keeps its card.
    expect(link("https://maps.apple.com/?ll=40.7851,-73.9683&q=Great%20Lawn")).toContain("tm-im-pin");
    expect(link("https://maps.apple.com/?address=1%20Main%20St")).toContain('data-maps="place"');
    expect(link("https://maps.apple.com/?q=coffee")).toContain('data-maps="search"');
  });
  test("a link with words and an icon is a text post", () => {
    const scene = parseScene({
      ...defaultScene,
      messages: [
        {
          ...defaultScene.messages[0],
          kind: "link",
          text: "",
          link: {
            url: "https://example.com/post",
            title: "Sam (@sam)",
            description: "A thought worth sharing.",
            icon: "https://example.com/sam.png",
          },
        },
      ],
    });
    const html = renderToStaticMarkup(<Phone scene={scene} />);
    expect(html).toContain("tm-link-post");
    expect(html).toContain("<p>A thought worth sharing.</p>");
  });
  test("a video link draws a play button and a post-style footer; an App Store link its app footer", () => {
    const link = (extra: Record<string, unknown>) =>
      renderToStaticMarkup(
        <Phone
          scene={parseScene({
            ...defaultScene,
            messages: [{
              ...defaultScene.messages[0],
              kind: "link",
              text: "",
              link: {
                url: "https://video.example.com/watch",
                title: "sam",
                description: "A slow walk",
                image: "https://example.com/frame.jpg",
                icon: "https://example.com/icon.png",
                ...extra,
              },
            }],
          })}
        />,
      );
    const video = link({ video: true });
    expect(video).toContain("tm-link-media");
    expect(video).toContain('aria-label="Play"');
    expect(video).toContain("<p>A slow walk</p>");
    expect(video).toContain("<small>video.example.com</small>");
    const app = link({ app: true });
    expect(app).toContain("tm-link-app");
    expect(app).toContain("<small>A slow walk</small>");
    expect(app).not.toContain("video.example.com</small>");
    // Without either flag the card stays the plain image card.
    const plain = link({});
    expect(plain).not.toContain("tm-link-media");
    expect(plain).not.toContain("tm-link-app");
    // A video without a caption keeps the plain footer but still shows its play button.
    expect(link({ video: true, description: "" })).toContain('aria-label="Play"');
  });
  test("iMessage keeps a set receipt above their reply and sets its time in regular weight", () => {
    const base = { ...defaultScene.messages[0], dateLabel: "", statusText: "" };
    const scene = (statusText: string) =>
      parseScene({
        ...defaultScene,
        messages: [
          { ...base, id: "a", senderId: "me", text: "on my way", status: "read", statusText },
          { ...base, id: "b", senderId: "jamie", text: "see you" },
        ],
      });
    expect(renderToStaticMarkup(<Phone scene={scene("")} />)).not.toContain("tm-receipt");
    expect(renderToStaticMarkup(<Phone scene={scene("Read 11:38 AM")} />)).toContain(
      "Read<span> 11:38\u202fAM</span>",
    );
  });
  test("an iMessage tapback ends the group above it", () => {
    const base = { ...defaultScene.messages[0], senderId: "me", dateLabel: "", reactions: [] };
    const html = renderToStaticMarkup(
      <Phone
        scene={parseScene({
          ...defaultScene,
          messages: [
            { ...base, id: "a", text: "one" },
            { ...base, id: "b", text: "two", reactions: [{ id: "r", emoji: "HAHA", participantId: "jamie", at: base.at }] },
          ],
        })}
      />,
    );
    expect(html.match(/data-tail="true"/g)?.length).toBe(2);
    expect(html).toContain("data-tapback");
  });
  test("a second line's signal draws the dual SIM indicator", () => {
    const scene = parseScene({
      ...defaultScene,
      statusBar: { ...defaultScene.statusBar, cellular2: 2 },
    });
    expect(renderToStaticMarkup(<Phone scene={scene} />)).toContain(
      'viewBox="0 0 65 45"',
    );
  });
  test("non-iMessage link tints retain their v1 midtone and alpha classification", () => {
    for (const platform of ["whatsapp", "telegram", "instagram", "google-messages"] as const) {
      for (const [tint, tone] of [["#ff0000", "dark"], ["#777777", "dark"], ["#ffffff00", "light"], ["#00000000", "dark"]]) {
        const scene = parseScene({
          ...defaultScene,
          platform,
          device: { model: "pixel-11-pro" },
          messages: [{ id: "one", senderId: "me", kind: "link", link: { url: "https://example.com", title: "A link", tint } }],
        });
        const html = renderToStaticMarkup(<Phone scene={scene} />);
        expect(html).toContain(`data-tint="${tone}"`);
        expect(html).not.toContain("--tm-link-surface");
        expect(html).not.toContain("--tm-link-domain");
        const preview = renderToStaticMarkup(<Phone scene={parseScene({ ...scene, interactions: { tapbackPicker: { messageId: "one" } } })} />);
        expect(preview.slice(preview.indexOf('class="tm-message-context"'))).not.toContain("data-tint=");
      }
    }
  });
});

describe("iMessage bubble paint", () => {
  const renderMessage = (message: Record<string, unknown>, interactions?: Record<string, unknown>) =>
    renderToStaticMarkup(
      <Phone scene={parseScene({
        ...defaultScene,
        messages: [{ id: "one", senderId: "me", ...message }],
        ...(interactions ? { interactions } : {}),
      })} />,
    );

  test("enlarged emoji, standalone stickers, and photos stay free of bubble paint", () => {
    for (const message of [
      { text: "🎉" },
      { text: "❤️ 👍" },
      { kind: "sticker", sticker: { emoji: "🌻" } },
      { kind: "image", media: { width: 800, height: 600 } },
    ]) {
      expect(renderMessage(message)).not.toContain('class="tm-bubble-paint"');
    }
  });

  test("ordinary text, including inline emoji and four emoji, keeps its paint", () => {
    for (const text of ["See you soon", "Coffee later? ☕", "🎉🎉🎉🎉"])
      expect(renderMessage({ text })).toContain('class="tm-bubble-paint"');
  });

  test("Send Later has an unfilled bubble with an outlined dashed tail", () => {
    const html = renderMessage({ text: "Good morning", scheduledAt: "Tomorrow, 9:00 AM" });
    expect(html).not.toContain('class="tm-bubble-paint"');
    expect(html).toContain('class="tm-ghost-tail tm-scheduled-tail"');
    expect(html).toContain('stroke-dasharray="4 4"');
  });

  test("Tapback preview carries the message's paint and tail in both directions", () => {
    for (const senderId of ["me", "jamie"]) {
      const html = renderMessage({ senderId, text: "The usual spot?" }, { tapbackPicker: { messageId: "one" } });
      const preview = html.slice(html.indexOf('class="tm-message-context"'));
      expect(preview).toContain(`data-side="${senderId === "me" ? "out" : "in"}"`);
      expect(preview).toContain('class="tm-bubble-paint"');
      expect(preview).toContain('class="tm-tail"');
    }
  });

  test("iMessage long-press lifts the message with the iOS 26 bar and menu", () => {
    const html = renderMessage({ text: "The usual spot?" }, { tapbackPicker: { messageId: "one" } });
    const preview = html.slice(html.indexOf('class="tm-message-context"'));
    expect(html).toContain('data-lifted="true"');
    expect(preview.match(/data-tapback="haha"/g)).toHaveLength(1);
    expect(preview.match(/data-recent="true"/g)).toHaveLength(2);
    expect(preview).toContain('class="tm-emoji-button"');
    const menu = /class="tm-message-menu">(.*?)<\/div>/.exec(preview)?.[1] ?? "";
    expect(menu.replace(/<[^>]+>/g, "|").split("|").filter(Boolean)).toEqual(["Reply", "Attach Sticker", "Copy", "Translate", "Select", "More…"]);
    expect(menu).toContain("<hr/>");
  });

  test("iMessage long-press on a just-sent message offers Edit and Undo Send", () => {
    const labels = (html: string) => {
      const preview = html.slice(html.indexOf('class="tm-message-context"'));
      const menu = /class="tm-message-menu">(.*?)<\/div>/.exec(preview)?.[1] ?? "";
      return menu.replace(/<hr\/>/g, "|—|").replace(/<[^>]+>/g, "|").split("|").filter(Boolean);
    };
    expect(labels(renderMessage({ text: "Running late" }, { tapbackPicker: { messageId: "one", undoable: true } }))).toEqual([
      "Reply", "Attach Sticker", "—", "Edit", "Undo Send", "—", "Copy", "Translate", "Select", "More…",
    ]);
    expect(labels(renderMessage({ senderId: "jamie", text: "Running late" }, { tapbackPicker: { messageId: "one", undoable: true } }))).not.toContain("Edit");
  });

  test("Tapback keeps an emoji preview transparent", () => {
    const html = renderMessage({ text: "🎉" }, { tapbackPicker: { messageId: "one" } });
    const preview = html.slice(html.indexOf('class="tm-message-context"'));
    expect(preview).toContain('data-emoji="true"');
    expect(preview).not.toContain('class="tm-bubble-paint"');
    expect(preview).not.toContain('class="tm-tail"');
  });

  test("an incoming edit gets its own label without an outgoing delivery receipt", () => {
    const html = renderMessage({ senderId: "jamie", text: "Tomorrow at nine", edited: true, editedAt: "9:42 AM" });
    expect(html).toContain('class="tm-receipt tm-incoming-edit"');
    expect(html).toContain("Edited 9:42 AM");
    expect(html).not.toContain("Delivered");
    expect(html).not.toContain("· Edited");
    expect(renderMessage({ senderId: "jamie", text: "Tomorrow at nine" })).not.toContain("tm-incoming-edit");
  });

  test("an incoming edit preserves the audio Keep action in the same metadata row", () => {
    const html = renderMessage({ senderId: "jamie", kind: "voice", media: { duration: 5 }, edited: true });
    expect(html).toContain('class="tm-receipt tm-incoming-edit"');
    expect(html).toContain('class="tm-audio-keep"');
    expect(html.match(/class="tm-receipt-row"/g)).toHaveLength(1);
    expect(html).not.toContain("Delivered");
  });

  test("Edited has its own link class while the outgoing receipt separator stays outside it", () => {
    const outgoing = renderMessage({ text: "Tomorrow at nine", edited: true, status: "read", statusText: "Read 9:42 AM" });
    expect(outgoing).toContain('· <span class="tm-edited">Edited</span>');
    expect(outgoing).toContain('Read<span> 9:42\u202fAM</span>');
    const incoming = renderMessage({ senderId: "jamie", text: "Tomorrow at nine", edited: true });
    expect(incoming).toContain('<span class="tm-edited">Edited</span>');
  });

  test("their thumbs are native emoji; yours are the white glove; skin tones stay emoji", () => {
    for (const emoji of ["👍", "👎", "👍🏽", "👎🏻"]) {
      const theirs = renderMessage({ text: "A reaction", reactions: [{ id: "r", emoji, participantId: "jamie" }] });
      expect(theirs).toContain(`<span class="tm-tapback-glyph">${emoji}</span>`);
      expect(theirs).not.toContain("tm-glove");
    }
    for (const emoji of ["👍", "👎"]) {
      const mine = renderMessage({ text: "A reaction", reactions: [{ id: "r", emoji, participantId: "me" }] });
      expect(mine).toContain('class="tm-glove"');
      expect(mine).not.toContain(`>${emoji}<`);
    }
    const toned = renderMessage({ text: "A reaction", reactions: [{ id: "r", emoji: "👍🏽", participantId: "me" }] });
    expect(toned).toContain('<span class="tm-tapback-glyph">👍🏽</span>');
  });

  test("the iMessage picker shares the badge symbols and keeps HA HA distinct from 😂", () => {
    const html = renderMessage({ text: "A reaction" }, {
      tapbackPicker: { messageId: "one", emojis: ["❤️", "👍", "👎", "HAHA", "‼️", "❓", "😂", "👍🏽"] },
    });
    const start = html.indexOf('class="tm-tapback-picker"');
    const picker = html.slice(start, html.indexOf('<div class="tm-bubble"', start));
    for (const kind of ["heart", "like", "dislike", "haha", "emphasize", "question"])
      expect(picker).toContain(`data-tapback="${kind}"`);
    expect(picker).toContain('<span class="tm-tapback-glyph">😂</span>');
    expect(picker).toContain('<span class="tm-tapback-glyph">👍🏽</span>');
    expect(picker).not.toContain("tm-glove");
  });
});
