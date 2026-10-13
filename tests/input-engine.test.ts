// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 The Awesome Gamepad UI Authors

import assert from "node:assert/strict";
import { test } from "node:test";

import { InputEngine, type ActionEvent } from "../src/input/input-engine.ts";

const REPEAT = { delayMs: 400, intervalMs: 120 };

function collect(engine: InputEngine): ActionEvent[] {
  const events: ActionEvent[] = [];
  engine.on((event) => events.push(event));
  return events;
}

test("a bound button press and release becomes press then release", () => {
  const engine = new InputEngine({ repeat: REPEAT });
  const events = collect(engine);

  engine.buttonDown(1, "South", 0);
  engine.buttonUp(1, "South");

  assert.deepEqual(events, [
    { action: "confirm", phase: "press", player: 1 },
    { action: "confirm", phase: "release", player: 1 },
  ]);
});

test("unbound buttons are ignored", () => {
  const engine = new InputEngine({ repeat: REPEAT });
  const events = collect(engine);

  engine.buttonDown(1, "LeftThumb", 0);
  engine.buttonUp(1, "LeftThumb");

  assert.deepEqual(events, []);
});

test("held directions auto-repeat after the delay, then on an interval", () => {
  const engine = new InputEngine({ repeat: REPEAT });
  const events = collect(engine);

  engine.buttonDown(1, "DPadRight", 1000);
  engine.tick(1200); // before the 1400ms deadline
  engine.tick(1400); // first repeat
  engine.tick(1520); // second repeat
  engine.buttonUp(1, "DPadRight");

  assert.deepEqual(events, [
    { action: "right", phase: "press", player: 1 },
    { action: "right", phase: "repeat", player: 1 },
    { action: "right", phase: "repeat", player: 1 },
    { action: "right", phase: "release", player: 1 },
  ]);
});

test("non-direction actions do not auto-repeat", () => {
  const engine = new InputEngine({ repeat: REPEAT });
  const events = collect(engine);

  engine.buttonDown(1, "South", 0);
  engine.tick(10_000);

  assert.deepEqual(events, [{ action: "confirm", phase: "press", player: 1 }]);
});

test("the d-pad and the stick can both hold a direction without double-pressing", () => {
  const engine = new InputEngine({ repeat: REPEAT });
  const events = collect(engine);

  engine.buttonDown(1, "DPadUp", 0);
  engine.axis(1, "LeftStickY", -1, 10); // still up
  engine.axis(1, "LeftStickY", 0, 20); // stick released, d-pad still held
  engine.buttonUp(1, "DPadUp");

  assert.deepEqual(events, [
    { action: "up", phase: "press", player: 1 },
    { action: "up", phase: "release", player: 1 },
  ]);
});

test("the stick drives directions, using the dominant axis", () => {
  const engine = new InputEngine({ repeat: REPEAT });
  const events = collect(engine);

  engine.axis(1, "LeftStickX", 0.9, 0);
  engine.axis(1, "LeftStickX", 0, 10);

  assert.deepEqual(events, [
    { action: "right", phase: "press", player: 1 },
    { action: "right", phase: "release", player: 1 },
  ]);
});

test("a second pad takes over as active and releases the first pad's held input", () => {
  const engine = new InputEngine({ repeat: REPEAT });
  const events = collect(engine);

  engine.buttonDown(1, "DPadLeft", 0);
  engine.buttonDown(2, "South", 10); // pad 2 takes over

  assert.equal(engine.activePlayer, 2);
  assert.deepEqual(events, [
    { action: "left", phase: "press", player: 1 },
    { action: "left", phase: "release", player: 1 },
    { action: "confirm", phase: "press", player: 2 },
  ]);

  // Releases from the now-inactive pad are ignored.
  engine.buttonUp(1, "DPadLeft");
  engine.buttonUp(2, "South");

  assert.deepEqual(events[events.length - 1], { action: "confirm", phase: "release", player: 2 });
});

test("disconnecting the active pad releases everything it held", () => {
  const engine = new InputEngine({ repeat: REPEAT });
  const events = collect(engine);

  engine.buttonDown(1, "South", 0);
  engine.disconnect(1);

  assert.deepEqual(events, [
    { action: "confirm", phase: "press", player: 1 },
    { action: "confirm", phase: "release", player: 1 },
  ]);
});
