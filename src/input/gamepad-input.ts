// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 The Awesome Gamepad UI Authors

import { listen } from "@tauri-apps/api/event";
import { type GamepadEvent, parseVariant } from "./gamepad-event";
import { type ActionEvent, InputEngine } from "./input-engine";
import { logLine } from "./log";

/**
 * Wires the gamepad plugin's raw events into the {@link InputEngine} and
 * publishes the resulting action events to whoever subscribes.
 *
 * Keeping the bus here (rather than in the engine) lets the keyboard fallback
 * inject the same kind of events, so the rest of the app doesn't care whether
 * an action came from a controller or a key.
 */
export const engine = new InputEngine();

const listeners = new Set<(event: ActionEvent) => void>();

/** Subscribes to every action event; returns an unsubscribe function. */
export function subscribeActions(
  listener: (event: ActionEvent) => void,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Injects an action event, e.g. from the keyboard fallback. */
export function emitAction(
  action: ActionEvent["action"],
  phase: ActionEvent["phase"],
  player = 1,
): void {
  publish({ action, phase, player });
}

let started: Promise<() => void> | null = null;

/**
 * Starts listening to the gamepad plugin. Safe to call repeatedly — the
 * underlying subscription is created once.
 *
 * @returns a function that tears everything down.
 */
export function startGamepadInput(): Promise<() => void> {
  started ??= start();
  return started;
}

async function start(): Promise<() => void> {
  if (!("__TAURI_INTERNALS__" in window)) {
    // Plain browser dev (`npm run dev`): no plugin, so gamepad input is idle
    // but the keyboard fallback still works through the same action bus.
    return () => {};
  }

  const stopEngine = engine.on(publish);

  // Log actions alongside raw input, so the log reads as intent, not just
  // mechanical button names. Dev-only, like the debug logger.
  let stopLogging: () => void = () => {};
  if (import.meta.env.DEV || import.meta.env.VITE_DEBUG_GAMEPAD) {
    stopLogging = subscribeActions((event) => {
      if (event.phase === "release") return;
      logLine("debug", `P${event.player}  action  ${event.action} (${event.phase})`);
    });
  }

  const unlisten = await listen<GamepadEvent>("event", ({ payload }) => {
    const variant = parseVariant(payload.event);
    if (variant === null) return;

    const player = payload.id + 1;
    switch (variant.name) {
      case "ButtonPressed":
        engine.buttonDown(player, String(variant.args[0]), performance.now());
        break;
      case "ButtonReleased":
        engine.buttonUp(player, String(variant.args[0]));
        break;
      case "AxisChanged":
        engine.axis(
          player,
          String(variant.args[0]),
          Number(variant.args[1]),
          performance.now(),
        );
        break;
      case "Disconnected":
        engine.disconnect(player);
        break;
      default:
        break;
    }
  });

  let handle = 0;
  const frame = () => {
    engine.tick(performance.now());
    handle = requestAnimationFrame(frame);
  };
  handle = requestAnimationFrame(frame);

  return () => {
    stopEngine();
    stopLogging();
    unlisten();
    cancelAnimationFrame(handle);
  };
}

function publish(event: ActionEvent): void {
  for (const listener of [...listeners]) listener(event);
}
