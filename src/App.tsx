// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 The Awesome Gamepad UI Authors

import { useRef } from "react";
import { useInput } from "@/input/input-react";

import Topography from "./components/Topography";

function App() {
  useInput();

  const rootRef = useRef<HTMLDivElement | null>(null);

  return (
    <div ref={rootRef} className="bg-black relative overflow-hidden" style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <div className="absolute inset-0">
        <Topography
    color="#033508"
    lineCount={24}
    lineWidth={1.8}
    elevation={1.6}
    foreground={0.2}
    tilt={24}
    speed={0.25}
    direction="forward"
    glow={0.6}
    depthOfField={0.56}
    fog={0.7}
    hoverEffect="lift"
    clickEffect="peak"
    majorLines
    scale={0.7}
    detail={0.35}
    morph={0.67}
    brightness={1}
    markers="plus"
    glitch={0.8}
    opacity={1}
    mouseInteraction
    mouseRadius={0.75}
    mouseStrength={0.6}
    trail={0.65}
    parallax={0.66}
    intro
    lightMode={false}
  />
      </div>
        <div className="min-h-0 overflow-hidden flex items-center absolute-center">
          <p className="text-white text-4xl">Hello, World! Modals will be here</p>
        </div>
      <div className="relative z-10 h-full grid grid-rows-[5%_35%_10%_45%_5%] text-left items-center text-3xl">
          <p className="text-white">Navigation Bar will go here</p>
          <p className="text-white">Hero Section will go here</p>
          <p className="text-white">Small Stats Section will go here</p>
          <p className="text-white">Game Cards will go here</p>
          <p className="text-white">Gamepad Buttons and their use will be here</p>
      </div>
    </div>
  );
}

export default App;
