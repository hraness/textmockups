import type { ComponentType, ReactNode } from "react";

/**
 * The scene text a host can make editable in place: a message, the contact's name, the status
 * bar clock, the date above a message, and the receipt below one.
 */
export type PhoneTextField = "message" | "contact" | "clock" | "date" | "receipt";

/** Props the renderer passes to the text slot. `children` is the default rendering of `value`. */
export type PhoneTextProps = {
  field: PhoneTextField;
  /** Set when `field` is `"message"`, `"date"`, or `"receipt"`. */
  messageId?: string;
  value: string;
  children: ReactNode;
};

/** Plain text slot: the default rendering, unchanged. */
export function PhoneText({ children }: PhoneTextProps) {
  return children;
}

export type PhoneTextSlot = ComponentType<PhoneTextProps>;
