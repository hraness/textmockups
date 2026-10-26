import type { ComponentType, ReactNode } from "react";
/** The scene text a host can make editable in place. */
export type PhoneTextField = "message" | "contact" | "clock";
/** Props the renderer passes to the text slot. `children` is the default rendering of `value`. */
export type PhoneTextProps = {
    field: PhoneTextField;
    /** Set when `field` is `"message"`. */
    messageId?: string;
    value: string;
    children: ReactNode;
};
/** Plain text slot: the default rendering, unchanged. */
export declare function PhoneText({ children }: PhoneTextProps): ReactNode;
export type PhoneTextSlot = ComponentType<PhoneTextProps>;
