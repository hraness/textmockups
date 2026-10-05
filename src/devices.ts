/**
 * Phone models the renderer can draw. Geometry is in logical points (iOS) or
 * density-independent pixels (Android), measured from current screenshots at
 * each phone's default display size.
 */
export const IOS_DEVICE_MODELS = ["iphone-17-pro", "iphone-17-pro-max"] as const;
export const ANDROID_DEVICE_MODELS = [
  "pixel-11",
  "pixel-11-pro",
  "pixel-11-pro-xl",
  "galaxy-s26",
  "galaxy-s26-plus",
  "galaxy-s26-ultra",
] as const;
export const DEVICE_MODELS = [...IOS_DEVICE_MODELS, ...ANDROID_DEVICE_MODELS] as const;

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
  cutout: { width: number; height: number; top: number };
  /** Status bar height and the vertical center of its contents. */
  statusBar: { height: number; center: number };
  /** Gesture handle width, or zero for three-button navigation. */
  gestureHandle: number;
  /** Height reserved for system navigation below the app. */
  navigation: number;
};

const profiles: Record<DeviceModel, DeviceProfile> = {
  "iphone-17-pro": {
    model: "iphone-17-pro",
    name: "iPhone 17 Pro",
    os: "ios",
    system: "ios",
    width: 402,
    height: 874,
    bezel: 15,
    radius: 62,
    cutout: { width: 125, height: 37, top: 11 },
    statusBar: { height: 62, center: 30 },
    gestureHandle: 139,
    navigation: 34,
  },
  "iphone-17-pro-max": {
    model: "iphone-17-pro-max",
    name: "iPhone 17 Pro Max",
    os: "ios",
    system: "ios",
    width: 440,
    height: 956,
    bezel: 15,
    radius: 62,
    cutout: { width: 125, height: 37, top: 11 },
    statusBar: { height: 62, center: 30 },
    gestureHandle: 146,
    navigation: 34,
  },
  "pixel-11": {
    model: "pixel-11",
    name: "Pixel 11",
    os: "android",
    system: "pixel",
    width: 412,
    height: 924,
    bezel: 17,
    radius: 46,
    cutout: { width: 24, height: 24, top: 21 },
    statusBar: { height: 62, center: 33 },
    gestureHandle: 104,
    navigation: 42,
  },
  "pixel-11-pro": {
    model: "pixel-11-pro",
    name: "Pixel 11 Pro",
    os: "android",
    system: "pixel",
    width: 410,
    height: 914,
    bezel: 16,
    radius: 50,
    cutout: { width: 23, height: 23, top: 21.5 },
    statusBar: { height: 62, center: 33 },
    gestureHandle: 104,
    navigation: 42,
  },
  "pixel-11-pro-xl": {
    model: "pixel-11-pro-xl",
    name: "Pixel 11 Pro XL",
    os: "android",
    system: "pixel",
    width: 448,
    height: 997,
    bezel: 16,
    radius: 54,
    cutout: { width: 23, height: 23, top: 13.5 },
    statusBar: { height: 54, center: 25 },
    gestureHandle: 112,
    navigation: 42,
  },
  "galaxy-s26": {
    model: "galaxy-s26",
    name: "Galaxy S26",
    os: "android",
    system: "one-ui",
    width: 360,
    height: 780,
    bezel: 12,
    radius: 38,
    cutout: { width: 21, height: 21, top: 10 },
    statusBar: { height: 41, center: 20.5 },
    gestureHandle: 0,
    navigation: 48,
  },
  "galaxy-s26-plus": {
    model: "galaxy-s26-plus",
    name: "Galaxy S26+",
    os: "android",
    system: "one-ui",
    width: 384,
    height: 832,
    bezel: 12,
    radius: 40,
    cutout: { width: 21, height: 21, top: 10 },
    statusBar: { height: 41, center: 20.5 },
    gestureHandle: 0,
    navigation: 48,
  },
  "galaxy-s26-ultra": {
    model: "galaxy-s26-ultra",
    name: "Galaxy S26 Ultra",
    os: "android",
    system: "one-ui",
    width: 384,
    height: 832,
    bezel: 11,
    radius: 32,
    cutout: { width: 22, height: 22, top: 11 },
    statusBar: { height: 44, center: 22 },
    gestureHandle: 0,
    navigation: 48,
  },
};

/** Every model in display order, for pickers and galleries. */
export const deviceProfiles: readonly DeviceProfile[] = DEVICE_MODELS.map((model) => profiles[model]);

export function isDeviceModel(value: unknown): value is DeviceModel {
  return typeof value === "string" && Object.hasOwn(profiles, value);
}

export function deviceProfile(model: DeviceModel): DeviceProfile;
export function deviceProfile(model: DeviceModel | undefined): DeviceProfile | undefined;
export function deviceProfile(model: DeviceModel | undefined) {
  return model === undefined ? undefined : profiles[model];
}

type DeviceFields = {
  device: { model?: DeviceModel; width: number; height: number; frame: string };
};

/** The operating system a scene's phone runs. Scenes without a model draw the classic iPhone. */
export function sceneOs(scene: { device: { model?: DeviceModel } }): DeviceOs {
  return deviceProfile(scene.device.model)?.os ?? "ios";
}

/**
 * The drawing's outer size. A classic scene's device size already includes its
 * frame; a modelled phone's size is its screen, and the frame adds its bezel.
 */
export function deviceStage(scene: DeviceFields): { width: number; height: number } {
  const { width, height, frame, model } = scene.device;
  const profile = deviceProfile(model);
  const bezel = profile && frame !== "none" ? profile.bezel : 0;
  return { width: width + 2 * bezel, height: height + 2 * bezel };
}
