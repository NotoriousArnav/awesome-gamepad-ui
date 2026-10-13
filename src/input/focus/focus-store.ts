// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 The Awesome Gamepad UI Authors

import type { Direction } from "../input-engine";
import { findNext, type FocusRect } from "./navigation";

/** Supplies the current on-screen rectangle of a focusable element. */
export type RectProvider = () => FocusRect | null;

/**
 * Tracks which element has focus and moves it around in response to direction
 * actions. Framework-free: React subscribes via `useSyncExternalStore`.
 */
export class FocusStore {
  private readonly rects = new Map<string, RectProvider>();
  private readonly listeners = new Set<() => void>();
  private current: string | null = null;

  get currentId(): string | null {
    return this.current;
  }

  /** Registers a focusable; returns a function that removes it again. */
  register(id: string, rect: RectProvider): () => void {
    this.rects.set(id, rect);
    if (this.current === null) this.setCurrent(id);
    return () => {
      this.rects.delete(id);
      if (this.current === id) {
        const fallback = this.rects.keys().next();
        this.setCurrent(fallback.done ? null : fallback.value);
      }
    };
  }

  setCurrent(id: string | null): void {
    if (this.current === id) return;
    this.current = id;
    this.notify();
  }

  /**
   * Moves focus in a direction. If nothing is focused yet, focuses the first
   * registered element. Returns whether focus landed on something.
   */
  move(direction: Direction): boolean {
    const rects = this.snapshot();
    if (rects.length === 0) return false;

    const from =
      this.current !== null && rects.some((rect) => rect.id === this.current)
        ? this.current
        : rects[0].id;

    const next = findNext(rects, from, direction);
    if (next === null) {
      // Nothing that way: at least make sure *something* is focused.
      if (this.current !== from) this.setCurrent(from);
      return this.current !== null;
    }

    this.setCurrent(next);
    return true;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private snapshot(): FocusRect[] {
    const rects: FocusRect[] = [];
    for (const provider of this.rects.values()) {
      const rect = provider();
      if (rect !== null) rects.push(rect);
    }
    return rects;
  }

  private notify(): void {
    for (const listener of [...this.listeners]) listener();
  }
}

/** Shared instance the UI layer reads and the input layer moves. */
export const focusStore = new FocusStore();
