// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 The Awesome Gamepad UI Authors

/** The controller family, used for per-player labelling and (later) glyphs. */
export type GamepadType = "xbox" | "playstation" | "nintendo" | "unknown";

/** Human-readable labels for each family. */
export const GAMEPAD_TYPE_LABELS: Record<GamepadType, string> = {
  xbox: "Xbox",
  playstation: "PlayStation",
  nintendo: "Nintendo",
  unknown: "Unknown",
};

/** Name substrings that identify a family, checked in order. */
const NAME_PATTERNS: ReadonlyArray<readonly [RegExp, GamepadType]> = [
  [/xbox|x-box|xinput|microsoft/i, "xbox"],
  [/playstation|dualshock|dualsense|ps[345]\b|sony/i, "playstation"],
  [/nintendo|switch|joy-?con|pro controller/i, "nintendo"],
];

/** USB vendor ids we can identify, used when the name is inconclusive. */
const VENDOR_TYPES = new Map<number, GamepadType>([
  [0x045e, "xbox"], // Microsoft
  [0x054c, "playstation"], // Sony
  [0x057e, "nintendo"], // Nintendo
]);

/**
 * Recovers the USB vendor id from a gilrs UUID.
 *
 * On Linux, gilrs-core fills the UUID from the kernel `input_id` with every
 * field byte-swapped, so the vendor `u16` lands byte-reversed in the second
 * group (`5e04` rather than `045e`). Other platforms don't use this layout, so
 * a nonsense vendor simply won't match anything.
 */
function vendorFromUuid(uuid: string): number | null {
  const group = uuid.split("-")[1];
  if (group === undefined || group.length !== 4) return null;
  const swapped = group.slice(2) + group.slice(0, 2);
  const vendor = Number.parseInt(swapped, 16);
  return Number.isNaN(vendor) ? null : vendor;
}

/**
 * Best-effort detection of the controller family from its name and UUID.
 * An explicit name wins; otherwise the USB vendor is consulted.
 */
export function detectGamepadType(name: string, uuid: string): GamepadType {
  for (const [pattern, type] of NAME_PATTERNS) {
    if (pattern.test(name)) return type;
  }

  const vendor = vendorFromUuid(uuid);
  if (vendor !== null) {
    const byVendor = VENDOR_TYPES.get(vendor);
    if (byVendor !== undefined) return byVendor;
  }

  return "unknown";
}
