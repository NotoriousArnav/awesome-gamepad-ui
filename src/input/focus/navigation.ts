// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 The Awesome Gamepad UI Authors

import type { Direction } from "../input-engine";

/**
 * Pure spatial navigation: given the rectangles of every focusable thing and
 * the one currently focused, pick the best neighbour in a direction.
 *
 * Framework-free (the only import is a type, which is erased) so it can be
 * unit tested with `node --test`.
 */

export interface FocusRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Minimum travel along the direction axis for a candidate to count. */
const MIN_TRAVEL = 1;
/** Perpendicular drift is punished this much relative to forward distance. */
const DRIFT_PENALTY = 3;
/** Additional factor when the candidate doesn't overlap on the other axis. */
const NON_OVERLAP_PENALTY = 2;
/** Tolerance for treating two scores as equal, for deterministic tie-breaks. */
const EPSILON = 1e-9;

type AxisKey = "x" | "y";
type SizeKey = "width" | "height";

/**
 * Returns the id of the focusable to move to, or `null` when there's nothing
 * in that direction. Straight-line neighbours beat diagonals: candidates that
 * overlap the current one on the perpendicular axis are strongly preferred.
 */
export function findNext(
  rects: readonly FocusRect[],
  fromId: string,
  direction: Direction,
): string | null {
  const from = rects.find((rect) => rect.id === fromId);
  if (from === undefined) return null;

  const horizontal = direction === "left" || direction === "right";
  const sign = direction === "right" || direction === "down" ? 1 : -1;

  // The axis we travel along, and the one we must stay aligned on.
  const travelKey: AxisKey = horizontal ? "x" : "y";
  const driftKey: AxisKey = horizontal ? "y" : "x";
  const driftSize: SizeKey = horizontal ? "height" : "width";

  const fromTravel = center(from, travelKey);
  const fromDriftStart = from[driftKey];
  const fromDriftEnd = fromDriftStart + from[driftSize];

  let best: string | null = null;
  let bestScore = Infinity;

  for (const candidate of rects) {
    if (candidate.id === from.id) continue;

    const travel = (center(candidate, travelKey) - fromTravel) * sign;
    if (travel < MIN_TRAVEL) continue;

    const drift = center(candidate, driftKey) - center(from, driftKey);
    const candidateStart = candidate[driftKey];
    const overlaps =
      candidateStart < fromDriftEnd &&
      candidateStart + candidate[driftSize] > fromDriftStart;

    const score =
      travel + Math.abs(drift) * DRIFT_PENALTY * (overlaps ? 1 : NON_OVERLAP_PENALTY);

    const closer = score < bestScore - EPSILON;
    const tiedButEarlier =
      Math.abs(score - bestScore) <= EPSILON && best !== null && candidate.id < best;
    if (closer || tiedButEarlier) {
      best = candidate.id;
      bestScore = score;
    }
  }

  return best;
}

function center(rect: FocusRect, axis: AxisKey): number {
  return axis === "x" ? rect.x + rect.width / 2 : rect.y + rect.height / 2;
}
