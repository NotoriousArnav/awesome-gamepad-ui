// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 The Awesome Gamepad UI Authors

import assert from "node:assert/strict";
import { test } from "node:test";

import { findNext, type FocusRect } from "../src/input/focus/navigation.ts";

/** A 3x3 grid of 100x100 tiles with a 10px gutter. */
const GRID: FocusRect[] = [];
for (let row = 0; row < 3; row++) {
  for (let col = 0; col < 3; col++) {
    GRID.push({
      id: `r${row}c${col}`,
      x: col * 110,
      y: row * 110,
      width: 100,
      height: 100,
    });
  }
}

test("moving right from a middle cell picks the straight neighbour, not a diagonal", () => {
  assert.equal(findNext(GRID, "r1c1", "right"), "r1c2");
});

test("moving down from a corner picks the cell directly below", () => {
  assert.equal(findNext(GRID, "r0c0", "down"), "r1c0");
});

test("there is nothing past the edge of the grid", () => {
  assert.equal(findNext(GRID, "r1c2", "right"), null);
  assert.equal(findNext(GRID, "r2c1", "down"), null);
  assert.equal(findNext(GRID, "r0c0", "up"), null);
  assert.equal(findNext(GRID, "r0c0", "left"), null);
});

test("a wide banner is chosen over an off-axis cell further away", () => {
  // Focused cell at the left; a banner aligned with it, and a nearer cell that
  // is off to the side. The aligned banner should win despite the extra width.
  const rects: FocusRect[] = [
    { id: "focus", x: 0, y: 100, width: 100, height: 100 },
    { id: "near-off-axis", x: 120, y: 260, width: 100, height: 100 },
    { id: "aligned-wide", x: 400, y: 100, width: 300, height: 100 },
  ];
  assert.equal(findNext(rects, "focus", "right"), "aligned-wide");
});

test("an unknown starting id yields null", () => {
  assert.equal(findNext(GRID, "nope", "right"), null);
});
