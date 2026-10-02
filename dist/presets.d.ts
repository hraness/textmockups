import { type Scene } from "./schema.js";
export declare const defaultScene: Scene;
export interface Preset {
    id: string;
    name: string;
    description: string;
    scene: Scene;
}
export declare const presets: Preset[];
