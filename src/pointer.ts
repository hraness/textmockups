// Zod-free scene helpers. The renderer path (Phone, evaluateScene) imports
// only this module, so drawing a scene never constructs a Zod schema: Zod
// probes \`new Function\` when it builds an object schema, which a strict
// Content-Security-Policy reports as a violation.

export const MAX_MESSAGES = 160;

export const FORBIDDEN_KEYS: ReadonlySet<string> = new Set(["__proto__", "prototype", "constructor"]);
/** Standard RFC 6901 pointers, own-properties only; prototype traversal is never permitted. */
export function pointerSegments(path: string): string[] {
  if (!path.startsWith("/") || /~(?![01])/u.test(path))
    throw new Error("Invalid JSON pointer");
  const parts = path
    .slice(1)
    .split("/")
    .map((part) => part.replace(/~1/g, "/").replace(/~0/g, "~"));
  if (parts.some((part) => !part || FORBIDDEN_KEYS.has(part)))
    throw new Error("Unsafe JSON pointer");
  return parts;
}
export function readPointer(root: unknown, path: string): unknown {
  let value: unknown = root;
  for (const part of pointerSegments(path)) {
    if (!value || typeof value !== "object" || !Object.hasOwn(value, part))
      throw new Error(`Unknown animation path: ${path}`);
    if (Array.isArray(value) && !/^(?:0|[1-9]\d*)$/.test(part))
      throw new Error("Invalid array index");
    value = (value as Record<string, unknown>)[part];
  }
  return value;
}
export function writePointer(root: unknown, path: string, next: unknown): void {
  const parts = pointerSegments(path);
  const key = parts.pop()!;
  const parent = parts.length
    ? readPointer(
        root,
        "/" +
          parts
            .map((part) => part.replace(/~/g, "~0").replace(/\//g, "~1"))
            .join("/"),
      )
    : root;
  if (!parent || typeof parent !== "object" || !Object.hasOwn(parent, key))
    throw new Error(`Unknown animation path: ${path}`);
  (parent as Record<string, unknown>)[key] = next;
}


/**
 * Integer scene fields, as JSON pointers with \`*\` for array indices. A test
 * derives the same list from the Zod schema, so the two cannot drift.
 */
export const INTEGER_FIELD_PATTERNS: readonly string[] = [
  "/device/width",
  "/device/height",
  "/statusBar/battery",
  "/statusBar/wifi",
  "/statusBar/cellular",
  "/header/backCount",
  "/conversation/unread/count",
  "/messages/*/stickers/*/zIndex",
  "/messages/*/media/width",
  "/messages/*/media/height",
  "/messages/*/file/size",
  "/messages/*/poll/options/*/votes",
  "/messages/*/poll/totalVotes",
  "/composer/selection/start",
  "/composer/selection/end",
  "/timeline/fps",
];
const integerFields = new Set(INTEGER_FIELD_PATTERNS);

/** Whether an animated value at this pointer is rounded to a whole number. */
export function isIntegerField(path: string): boolean {
  return integerFields.has(
    "/" +
      pointerSegments(path)
        .map((part) => (/^(?:0|[1-9]\d*)$/.test(part) ? "*" : part))
        .join("/"),
  );
}
