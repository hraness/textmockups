/**
 * The words iMessage draws around a conversation (receipts, menus, the composer), in the
 * languages iOS shows them. A scene picks one with `locale`; other platforms draw English.
 */
export type Strings = {
    read: string;
    delivered: string;
    notDelivered: string;
    sending: string;
    sent: string;
    edited: string;
    hideEdits: string;
    youUnsent: string;
    /** `{name}` is the sender. */
    theyUnsent: string;
    sendLater: string;
    edit: string;
    /** `{n}` is the count. */
    replies: (n: number) => string;
    keep: string;
    kept: string;
    you: string;
    poll: string;
    votes: (n: number) => string;
    /** `{name}` is the person in Focus. */
    silenced: string;
    notifyAnyway: string;
    reply: string;
    attachSticker: string;
    undoSend: string;
    copy: string;
    translate: string;
    select: string;
    more: string;
    cut: string;
    paste: string;
    replace: string;
    camera: string;
    photos: string;
    stickers: string;
    audio: string;
    store: string;
    location: string;
    library: string;
    albums: string;
    noPhotos: string;
    noStickers: string;
    /** The empty composer of an iMessage conversation. */
    placeholder: string;
    /** The empty composer of a text message conversation; `{transport}` is SMS or RCS. */
    textMessage: string;
    searchEmoji: string;
};
/** The languages iMessage strings come in, by BCP 47 tag. */
export declare const STRING_LOCALES: {
    readonly en: Strings;
    readonly es: Strings;
    readonly fr: Strings;
    readonly de: Strings;
    readonly it: Strings;
    readonly pt: Strings;
    readonly ja: Strings;
    readonly ko: Strings;
    readonly "zh-Hans": Strings;
    readonly "zh-Hant": Strings;
};
export type StringLocale = keyof typeof STRING_LOCALES;
/**
 * The supported language closest to a BCP 47 tag, such as "pt-BR" → "pt" or "zh-TW" → "zh-Hant",
 * or undefined when none is.
 */
export declare function matchLocale(tag: string | undefined): StringLocale | undefined;
/** The iMessage words for a locale, falling back to English. */
export declare function stringsFor(locale: string | undefined): Strings;
/** Fills `{name}`-style holes. */
export declare function fill(template: string, values: Record<string, string>): string;
