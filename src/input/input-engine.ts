// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 The Awesome Gamepad UI Authors

/**
 * The vocabulary of things a controller can trigger, plus the engine that turns
 * physical controls into a stream of press/repeat/release events.
 *
 * This module is deliberately free of imports so it can be unit tested
 * directly with `node --test`.
 */

/** A spatial direction, used for focus navigation. */
export type Direction = "up" | "down" | "left" | "right";

/** Everything a controller can trigger. Grows as screens need more. */
export type ActionId =
  | Direction
  | "confirm"
  | "back"
  | "menu"
  | "home"
  | "pagePrev"
  | "pageNext";

export type ActionPhase = "press" | "repeat" | "release";

export interface ActionEvent {
  action: ActionId;
  phase: ActionPhase;
  /** Player number, 1-based. */
  player: number;
}

export const DIRECTIONS: readonly Direction[] = ["up", "down", "left", "right"];

export function isDirection(action: ActionId): action is Direction {
  return (DIRECTIONS as readonly string[]).includes(action);
}

export const ACTION_LABELS: Record<ActionId, string> = {
  up: "Up",
  down: "Down",
  left: "Left",
  right: "Right",
  confirm: "Confirm",
  back: "Back",
  menu: "Menu",
  home: "Home",
  pagePrev: "Previous",
  pageNext: "Next",
};

/**
 * Default mapping from gilrs button names to actions.
 *
 * gilrs names face buttons by *position* (South is A on an Xbox pad, Cross on a
 * PlayStation pad), so a single binding covers all three families. Users will
 * be able to remap these once a settings screen exists.
 */
export const DEFAULT_BUTTON_BINDINGS: ReadonlyArray<readonly [string, ActionId]> = [
  ["South", "confirm"],
  ["East", "back"],
  ["Start", "menu"],
  ["Mode", "home"],
  ["LeftTrigger", "pagePrev"],
  ["RightTrigger", "pageNext"],
  ["DPadUp", "up"],
  ["DPadDown", "down"],
  ["DPadLeft", "left"],
  ["DPadRight", "right"],
];

export interface RepeatTiming {
  /** How long a direction must be held before it starts auto-repeating. */
  delayMs: number;
  /** Gap between repeats once auto-repeat has started. */
  intervalMs: number;
}

export const DEFAULT_REPEAT: RepeatTiming = { delayMs: 400, intervalMs: 120 };

/** Stick deflection needed to register a direction. */
const STICK_THRESHOLD = 0.5;

/** Which physical control currently holds an action, so sources can overlap. */
type Source = string;

export interface InputEngineOptions {
  bindings?: ReadonlyArray<readonly [string, ActionId]>;
  repeat?: RepeatTiming;
}

/**
 * Turns button/axis input from any number of pads into action events.
 *
 * Holds no timers of its own: call {@link tick} with a monotonic clock (the
 * app uses `requestAnimationFrame`) to drive auto-repeat. One pad is "active"
 * at a time — the last one to press something — so a shared living-room
 * controller doesn't fight over the UI.
 */
export class InputEngine {
  private readonly bindings: Map<string, ActionId>;
  private readonly repeat: RepeatTiming;
  private readonly sources = new Map<ActionId, Set<Source>>();
  private readonly listeners = new Set<(event: ActionEvent) => void>();
  private readonly repeatAt = new Map<ActionId, number>();
  private stickX = 0;
  private stickY = 0;
  private player = 1;

  constructor(options: InputEngineOptions = {}) {
    this.bindings = new Map(options.bindings ?? DEFAULT_BUTTON_BINDINGS);
    this.repeat = options.repeat ?? DEFAULT_REPEAT;
  }

  /** Player number whose input is currently driving the UI. */
  get activePlayer(): number {
    return this.player;
  }

  /** Subscribes to action events; returns an unsubscribe function. */
  on(listener: (event: ActionEvent) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** A button went down on a pad. `now` is a monotonic millisecond clock. */
  buttonDown(player: number, button: string, now: number): void {
    const action = this.bindings.get(button);
    if (action === undefined) return;
    if (!this.claim(player, true)) return;
    this.setSource(action, `button:${button}`, true, now);
  }

  /** A button came up. Releases from a non-active pad are ignored. */
  buttonUp(player: number, button: string): void {
    const action = this.bindings.get(button);
    if (action === undefined) return;
    if (!this.claim(player, false)) return;
    this.setSource(action, `button:${button}`, false, 0);
  }

  /** Feeds a left-stick axis; the stick also drives the direction actions. */
  axis(player: number, axis: string, value: number, now: number): void {
    if (axis !== "LeftStickX" && axis !== "LeftStickY") return;
    const deflected = Math.abs(value) >= STICK_THRESHOLD;
    if (!this.claim(player, deflected)) return;
    if (axis === "LeftStickX") this.stickX = value;
    else this.stickY = value;
    this.updateStick(now);
  }

  /** Drops any held state, e.g. when the active pad disconnects. */
  disconnect(player: number): void {
    if (player !== this.player) return;
    this.releaseAll();
  }

  /** Drives auto-repeat. Call once per frame with a monotonic clock. */
  tick(now: number): void {
    if (this.repeatAt.size === 0) return;
    const due: ActionId[] = [];
    for (const [action, at] of this.repeatAt) {
      if (now >= at) due.push(action);
    }
    for (const action of due) {
      if ((this.sources.get(action)?.size ?? 0) === 0) {
        this.repeatAt.delete(action);
        continue;
      }
      this.emit({ action, phase: "repeat", player: this.player });
      this.repeatAt.set(action, now + this.repeat.intervalMs);
    }
  }

  /**
   * Decides whether input from `player` counts: the active pad always does,
   * another pad only when it presses something (which makes it active).
   */
  private claim(player: number, isPress: boolean): boolean {
    if (player === this.player) return true;
    if (!isPress) return false;
    this.releaseAll();
    this.player = player;
    return true;
  }

  private releaseAll(): void {
    for (const [action, sources] of this.sources) {
      if (sources.size === 0) continue;
      sources.clear();
      this.repeatAt.delete(action);
      this.emit({ action, phase: "release", player: this.player });
    }
    this.stickX = 0;
    this.stickY = 0;
  }

  private setSource(
    action: ActionId,
    source: Source,
    active: boolean,
    now: number,
  ): void {
    let sources = this.sources.get(action);
    if (sources === undefined) {
      sources = new Set();
      this.sources.set(action, sources);
    }

    const wasHeld = sources.size > 0;
    if (active) sources.add(source);
    else sources.delete(source);
    const isHeld = sources.size > 0;
    if (wasHeld === isHeld) return;

    if (isHeld) {
      this.emit({ action, phase: "press", player: this.player });
      if (isDirection(action)) {
        this.repeatAt.set(action, now + this.repeat.delayMs);
      }
      return;
    }

    this.repeatAt.delete(action);
    this.emit({ action, phase: "release", player: this.player });
  }

  private updateStick(now: number): void {
    // gilrs reports sticks in SDL orientation: +x is right, +y is down.
    const { stickX: x, stickY: y } = this;
    const horizontal =
      Math.abs(x) >= STICK_THRESHOLD && Math.abs(x) >= Math.abs(y);
    const vertical =
      Math.abs(y) >= STICK_THRESHOLD && Math.abs(y) > Math.abs(x);

    this.setSource("left", "stick", horizontal && x < 0, now);
    this.setSource("right", "stick", horizontal && x > 0, now);
    this.setSource("up", "stick", vertical && y < 0, now);
    this.setSource("down", "stick", vertical && y > 0, now);
  }

  private emit(event: ActionEvent): void {
    for (const listener of [...this.listeners]) listener(event);
  }
}
