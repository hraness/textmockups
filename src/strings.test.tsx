import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { Phone } from "./phone.js";
import { defaultScene } from "./presets.js";
import { parseScene } from "./schema.js";
import { matchLocale, STRING_LOCALES, stringsFor } from "./strings.js";

describe("strings", () => {
  test("matches BCP 47 tags to a supported language", () => {
    expect(matchLocale("pt-BR")).toBe("pt");
    expect(matchLocale("es_419")).toBe("es");
    expect(matchLocale("zh-TW")).toBe("zh-Hant");
    expect(matchLocale("zh-Hant-HK")).toBe("zh-Hant");
    expect(matchLocale("zh-CN")).toBe("zh-Hans");
    expect(matchLocale("zh")).toBe("zh-Hans");
    expect(matchLocale("sv-SE")).toBeUndefined();
    expect(stringsFor("sv").read).toBe("Read");
  });

  test("every language fills every word", () => {
    for (const [locale, words] of Object.entries(STRING_LOCALES)) {
      for (const [key, value] of Object.entries(words)) {
        const text = typeof value === "function" ? value(2) : value;
        expect(text, `${locale}.${key}`).not.toBe("");
      }
      expect(words.replies(3)).toContain("3");
    }
  });

  test("iMessage draws its receipt and composer in the scene's language", () => {
    const scene = (locale?: string) =>
      parseScene({
        ...defaultScene,
        platform: "imessage",
        ...(locale ? { locale } : {}),
        messages: [{ id: "m1", senderId: defaultScene.participants.find((p) => p.isSelf)!.id, kind: "text", text: "Hola", status: "delivered" }],
      });
    const es = renderToStaticMarkup(<Phone scene={scene("es-MX")} />);
    expect(es).toContain("Entregado");
    expect(es).not.toContain(">Delivered");
    expect(renderToStaticMarkup(<Phone scene={scene()} />)).toContain("Delivered");
  });

  test("rejects a locale that isn't a language tag", () => {
    expect(() => parseScene({ ...defaultScene, locale: "<script>" })).toThrow();
  });
});
