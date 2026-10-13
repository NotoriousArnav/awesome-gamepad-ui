// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 The Awesome Gamepad UI Authors

import { type RefObject, useEffect, useRef, useSyncExternalStore } from "react";

import { type ActionEvent, type ActionId, isDirection } from "./input-engine";
import { emitAction, startGamepadInput, subscribeActions } from "./gamepad-input";
import { logLine } from "./log";
import { focusStore } from "./focus/focus-store";

/** Keyboard fallback so the UI is usable (and testable) without a gamepad. */
const KEY_ACTIONS: Record<string, ActionId> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  Enter: "confirm",
  " ": "confirm",
  Escape: "back",
  Backspace: "back",
};

/**
 * Starts the input pipeline: gamepad events, the per-frame repeat clock, the
 * keyboard fallback, and direction → focus routing.
 *
 * Call once, near the root. Safe under React's StrictMode double-mount.
 */
export function useInput(): void {
  useEffect(() => {
    // The gamepad pipeline is app-global and intentionally never torn down
    // here: under StrictMode's double-mount, the first cleanup would otherwise
    // kill the shared subscription out from under the second mount.
    void startGamepadInput();

    const unsubscribe = subscribeActions((event) => {
      // Auto-repeat re-sends "press", so reacting to press covers both.
      if (isDirection(event.action) && event.phase !== "release") {
        focusStore.move(event.action);
      }
    });

    // Narrate focus moves in dev, so the log reads as intent → result.
    let stopFocusLog: (() => void) | undefined;
    if (import.meta.env.DEV || import.meta.env.VITE_DEBUG_GAMEPAD) {
      stopFocusLog = focusStore.subscribe(() => {
        const id = focusStore.currentId;
        if (id !== null) logLine("debug", `focus → ${id}`);
      });
    }

    const route = (event: KeyboardEvent, phase: "press" | "release") => {
      const action = KEY_ACTIONS[event.key];
      if (action === undefined) return;
      event.preventDefault();
      emitAction(action, phase);
    };
    const onKeyDown = (event: KeyboardEvent) => route(event, "press");
    const onKeyUp = (event: KeyboardEvent) => route(event, "release");

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      unsubscribe();
      stopFocusLog?.();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);
}

/** Subscribes to one action; `handler` may change without re-subscribing. */
export function useAction(
  action: ActionId,
  handler: (event: ActionEvent) => void,
): void {
  const latest = useRef(handler);
  latest.current = handler;

  useEffect(
    () =>
      subscribeActions((event) => {
        if (event.action === action) latest.current(event);
      }),
    [action],
  );
}

/** The id of the currently focused element, or null. */
export function useFocus(): string | null {
  return useSyncExternalStore(
    (listener) => focusStore.subscribe(listener),
    () => focusStore.currentId,
  );
}

/**
 * Registers the returned ref's element as focusable under `id`, and reports
 * whether it currently holds focus.
 */
export function useFocusable<T extends HTMLElement>(
  id: string,
): { ref: RefObject<T | null>; focused: boolean } {
  const ref = useRef<T>(null);

  useEffect(
    () =>
      focusStore.register(id, () => {
        const element = ref.current;
        if (element === null) return null;
        const rect = element.getBoundingClientRect();
        return {
          id,
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        };
      }),
    [id],
  );

  const focused = useSyncExternalStore(
    (listener) => focusStore.subscribe(listener),
    () => focusStore.currentId === id,
  );

  return { ref, focused };
}
