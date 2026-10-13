// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 The Awesome Gamepad UI Authors

/**
 * Payload emitted by `tauri-plugin-gamepad` on the Tauri `"event"` channel.
 *
 * Mirrors the plugin's Rust `gamepad_to_json` output. `event` is a serialized
 * gilrs `EventType`: unit variants arrive as strings (`"Connected"`), while
 * tuple variants arrive as single-key objects
 * (`{ AxisChanged: ["LeftStickX", -0.7, 304] }`).
 */
export interface GamepadEvent {
  id: number;
  uuid: string;
  connected: boolean;
  vibration: boolean;
  event: string | Record<string, unknown>;
  timestamp: number;
  name: string;
  buttons: ReadonlyArray<number>;
  axes: ReadonlyArray<number>;
  mapping: string;
  power_info: string;
}

/** A gilrs event variant, unwrapped from its serde representation. */
export interface EventVariant {
  /** Variant name, e.g. `ButtonPressed`, `AxisChanged`, `Connected`. */
  name: string;
  /** Tuple/struct arguments, e.g. `["South", 304]`. */
  args: ReadonlyArray<unknown>;
}

/**
 * Unwraps gilrs' serde representation of an `EventType`:
 *
 * ```text
 * "Connected"                            -> { name: "Connected", args: [] }
 * { AxisChanged: ["LeftStickX", -0.7, 304] }
 *                                        -> { name: "AxisChanged", args: ["LeftStickX", -0.7, 304] }
 * ```
 *
 * Returns `null` for anything that does not match (e.g. an unknown shape).
 */
export function parseVariant(event: GamepadEvent["event"]): EventVariant | null {
  if (typeof event === "string") {
    return { name: event, args: [] };
  }
  if (event !== null && typeof event === "object") {
    const entries = Object.entries(event);
    if (entries.length === 1) {
      const [name, payload] = entries[0];
      return { name, args: Array.isArray(payload) ? payload : [payload] };
    }
  }
  return null;
}
