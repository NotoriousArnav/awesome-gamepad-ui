// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 The Awesome Gamepad UI Authors

import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { type GamepadEvent, parseVariant } from "./gamepad-event";
import { logLine } from "./log";
import {
  GAMEPAD_TYPE_LABELS,
  type GamepadType,
  detectGamepadType,
} from "./gamepad-type";

/** Axes are treated as centred below this magnitude, to suppress idle drift. */
const AXIS_DEADZONE = 0.15;
/** Decimals an axis is rounded to before duplicate suppression. */
const AXIS_PRECISION = 2;
/** Decimals an analog button (trigger) is rounded to before duplicate suppression. */
const BUTTON_PRECISION = 1;

/** Identity and per-pad throttle state for one controller. */
interface Pad {
  /** Player number, 1-based (the plugin's gamepad ids are 0-based). */
  player: number;
  type: GamepadType;
  name: string;
  /** Last logged value per axis, for duplicate suppression. */
  axes: Map<string, number>;
  /** Last logged value per analog button, for duplicate suppression. */
  buttons: Map<string, number>;
}

/** One connected gamepad, as returned by the `list_gamepads` command. */
interface GamepadSummary {
  id: number;
  name: string;
  uuid: string;
  vendor_id: number | null;
  product_id: number | null;
  mapping: string;
}

function round(value: number, precision: number): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

/** Short per-pad prefix identifying the sender, e.g. `P1 Xbox "Xbox One Controller"`. */
function tag(pad: Pad): string {
  return `P${pad.player} ${GAMEPAD_TYPE_LABELS[pad.type]} "${pad.name}"`;
}

function makePad(id: number, name: string, uuid: string): Pad {
  return {
    player: id + 1,
    type: detectGamepadType(name, uuid),
    name,
    axes: new Map(),
    buttons: new Map(),
  };
}

function hex(value: number | null): string {
  return value === null ? "----" : value.toString(16).padStart(4, "0");
}

/**
 * Logs the pads that were already attached when the app launched.
 *
 * The plugin only reports pads on their first input event, so without this a
 * freshly launched app shows no controller at all until you touch it. Pads are
 * registered here so their first real event reuses this identity rather than
 * announcing itself again.
 */
async function logAttachedPads(pads: Map<number, Pad>): Promise<void> {
  let summaries: GamepadSummary[];
  try {
    summaries = await invoke<GamepadSummary[]>("list_gamepads");
  } catch {
    // Enumeration is best-effort; never let it break startup.
    return;
  }

  for (const summary of summaries) {
    if (pads.has(summary.id)) continue;
    const pad = makePad(summary.id, summary.name, summary.uuid);
    pads.set(summary.id, pad);
    logLine(
      "info",
      `${tag(pad)}  connected  uuid=${summary.uuid}` +
        `  vendor=${hex(summary.vendor_id)} product=${hex(summary.product_id)}` +
        `  mapping=${summary.mapping || "none"}`,
    );
  }
}

/**
 * Subscribes to the gamepad plugin's raw events and mirrors a compact,
 * de-noised, per-player version to the terminal and the run's log file.
 *
 * Raw events arrive for every axis delta and button change. This collapses
 * idle axis drift (deadzone), rounds analog values, and drops repeats, so the
 * log stays readable while still showing real input and which pad sent it.
 *
 * @returns a function that removes the listener.
 */
export async function installGamepadDebugLogger(): Promise<UnlistenFn> {
  /** Connected controllers, keyed by the plugin's gamepad id. */
  const pads = new Map<number, Pad>();

  const unlisten = await listen<GamepadEvent>("event", ({ payload }) => {
    const variant = parseVariant(payload.event);
    if (variant === null) return;

    if (variant.name === "Disconnected") {
      const pad = pads.get(payload.id);
      pads.delete(payload.id);
      if (pad !== undefined) logLine("info", `${tag(pad)}  disconnected`);
      return;
    }

    // gilrs does not reliably announce pads that were already attached when the
    // app launched, so a pad's first event also counts as its connection.
    let pad = pads.get(payload.id);
    if (pad === undefined) {
      pad = makePad(payload.id, payload.name, payload.uuid);
      pads.set(payload.id, pad);
      logLine(
        "info",
        `${tag(pad)}  connected  uuid=${payload.uuid}  mapping=${payload.mapping || "none"}`,
      );
    }

    const prefix = tag(pad);

    switch (variant.name) {
      case "Connected":
        // Already announced above via the first-event path.
        break;

      case "ButtonPressed":
        logLine("debug", `${prefix}  press   ${String(variant.args[0])}`);
        break;

      case "ButtonReleased":
        logLine("debug", `${prefix}  release ${String(variant.args[0])}`);
        break;

      case "AxisChanged": {
        const axis = String(variant.args[0]);
        const value = Number(variant.args[1]);
        const snapped =
          Math.abs(value) < AXIS_DEADZONE ? 0 : round(value, AXIS_PRECISION);
        // Ignore the initial all-zero state gilrs reports for untouched axes.
        if (snapped === 0 && !pad.axes.has(axis)) return;
        if (pad.axes.get(axis) === snapped) return;
        pad.axes.set(axis, snapped);
        logLine(
          "debug",
          `${prefix}  axis    ${axis.padEnd(12)} ${snapped.toFixed(AXIS_PRECISION)}`,
        );
        break;
      }

      case "ButtonChanged": {
        const button = String(variant.args[0]);
        const value = Number(variant.args[1]);
        const snapped = round(value, BUTTON_PRECISION);
        // Digital buttons also emit ButtonChanged, but only at exactly 0.0/1.0,
        // which their press/release lines already cover. Keep genuine analog
        // ramps (triggers, sticks-as-buttons) and drop the rounded endpoints.
        if (snapped <= 0 || snapped >= 1) return;
        if (pad.buttons.get(button) === snapped) return;
        pad.buttons.set(button, snapped);
        logLine(
          "debug",
          `${prefix}  analog  ${button.padEnd(12)} ${snapped.toFixed(BUTTON_PRECISION)}`,
        );
        break;
      }

      default:
        break;
    }
  });

  await logAttachedPads(pads);

  return unlisten;
}
