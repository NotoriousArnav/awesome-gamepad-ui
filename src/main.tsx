// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 The Awesome Gamepad UI Authors

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

async function bootstrap() {
  if ("__TAURI_INTERNALS__" in window) {
    // Register the debug logger before the polyfill starts the native gilrs
    // loop, so no early events are missed.
    // Set VITE_DEBUG_GAMEPAD=1 to force it on outside dev builds.
    if (import.meta.env.DEV || import.meta.env.VITE_DEBUG_GAMEPAD) {
      const { installGamepadDebugLogger } = await import("./input/debug-logger");
      await installGamepadDebugLogger();
    }

    // Install the native gamepad polyfill (gilrs-backed) so
    // `navigator.getGamepads()` works reliably on Linux/WebKitGTK.
    await import("tauri-plugin-gamepad-api");
  }

  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void bootstrap();

