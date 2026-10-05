/**
 * Phone models the renderer can draw. Geometry is in logical points (iOS) or
 * density-independent pixels (Android), measured from current screenshots at
 * each phone's default display size.
 */
export declare const IOS_DEVICE_MODELS: readonly ["iphone-17-pro", "iphone-17-pro-max"];
export declare const ANDROID_DEVICE_MODELS: readonly ["pixel-11", "pixel-11-pro", "pixel-11-pro-xl", "galaxy-s26", "galaxy-s26-plus", "galaxy-s26-ultra"];
export declare const DEVICE_MODELS: readonly ["iphone-17-pro", "iphone-17-pro-max", "pixel-11", "pixel-11-pro", "pixel-11-pro-xl", "galaxy-s26", "galaxy-s26-plus", "galaxy-s26-ultra"];
export type DeviceModel = (typeof DEVICE_MODELS)[number];
export type DeviceOs = "ios" | "android";
/** The system interface a phone ships with: status bar, navigation, and keyboard. */
export type DeviceSystem = "ios" | "pixel" | "one-ui";
export type DeviceProfile = {
    model: DeviceModel;
    name: string;
    os: DeviceOs;
    system: DeviceSystem;
    /** Screen size at the default display size. */
    width: number;
    height: number;
    /** Frame thickness drawn around the screen when the hardware is shown. */
    bezel: number;
    /** Display corner radius. */
    radius: number;
    /** Dynamic Island or camera punch-hole, centered horizontally. */
    cutout: {
        width: number;
        height: number;
        top: number;
    };
    /** Status bar height and the vertical center of its contents. */
    statusBar: {
        height: number;
        center: number;
    };
    /** Gesture handle width, or zero for three-button navigation. */
    gestureHandle: number;
    /** Height reserved for system navigation below the app. */
    navigation: number;
};
/** Every model in display order, for pickers and galleries. */
export declare const deviceProfiles: readonly DeviceProfile[];
export declare function isDeviceModel(value: unknown): value is DeviceModel;
export declare function deviceProfile(model: DeviceModel): DeviceProfile;
export declare function deviceProfile(model: DeviceModel | undefined): DeviceProfile | undefined;
type DeviceFields = {
    device: {
        model?: DeviceModel;
        width: number;
        height: number;
        frame: string;
    };
};
/** The operating system a scene's phone runs. Scenes without a model draw the classic iPhone. */
export declare function sceneOs(scene: {
    device: {
        model?: DeviceModel;
    };
}): DeviceOs;
/**
 * The drawing's outer size. A classic scene's device size already includes its
 * frame; a modelled phone's size is its screen, and the frame adds its bezel.
 */
export declare function deviceStage(scene: DeviceFields): {
    width: number;
    height: number;
};
export {};
