// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 The Awesome Gamepad UI Authors
//
// Type declarations for the React Bits Topography background component
// (plain JSX variant), so `tsc` can check its use sites without `allowJs`.

import type { CSSProperties } from "react";

export type TopographyDirection = "forward" | "backward" | "left" | "right";
export type TopographyHoverEffect = "lift" | "trace" | "light";
export type TopographyClickEffect = "pulse" | "peak" | "none";
export type TopographyMarkers = "none" | "plus" | "dots";

export interface TopographyProps {
  color?: string;
  lineCount?: number;
  lineWidth?: number;
  majorLines?: boolean;
  elevation?: number;
  foreground?: number;
  scale?: number;
  detail?: number;
  tilt?: number;
  speed?: number;
  direction?: TopographyDirection;
  morph?: number;
  glow?: number;
  depthOfField?: number;
  fog?: number;
  brightness?: number;
  opacity?: number;
  mouseInteraction?: boolean;
  hoverEffect?: TopographyHoverEffect;
  mouseRadius?: number;
  mouseStrength?: number;
  trail?: number;
  parallax?: number;
  clickEffect?: TopographyClickEffect;
  markers?: TopographyMarkers;
  glitch?: number;
  intro?: boolean;
  lightMode?: boolean;
  dpr?: number;
  className?: string;
  style?: CSSProperties;
}

declare const Topography: (props: TopographyProps) => React.JSX.Element;

export default Topography;
