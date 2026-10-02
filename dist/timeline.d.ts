import { type Scene } from "./schema.js";
/** Exported so scrubbers, effects, and exporters share the exact same clock. */
export declare function sceneTime(scene: Scene, seconds: number): number;
/**
 * Pure, deterministic evaluation. The caller validates foreign input with parseScene once.
 * Apply tracks before filtering so JSON pointer array indexes refer to the authored document.
 */
export declare function evaluateScene(scene: Scene, seconds: number): Scene;
/**
 * Reconcile structural edits without rejecting an unfinished text/URL field mid-keystroke.
 * Export and sharing still validate the complete document with parseScene.
 */
export declare function reconcileSceneEdit(previous: Scene, draft: Scene): Scene;
