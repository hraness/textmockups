export declare const MAX_MESSAGES = 160;
export declare const FORBIDDEN_KEYS: ReadonlySet<string>;
/** Standard RFC 6901 pointers, own-properties only; prototype traversal is never permitted. */
export declare function pointerSegments(path: string): string[];
export declare function readPointer(root: unknown, path: string): unknown;
export declare function writePointer(root: unknown, path: string, next: unknown): void;
/**
 * Integer scene fields, as JSON pointers with \`*\` for array indices. A test
 * derives the same list from the Zod schema, so the two cannot drift.
 */
export declare const INTEGER_FIELD_PATTERNS: readonly string[];
/** Whether an animated value at this pointer is rounded to a whole number. */
export declare function isIntegerField(path: string): boolean;
