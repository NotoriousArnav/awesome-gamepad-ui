// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 The Awesome Gamepad UI Authors

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

async function bootstrap() {
  // Install the native gamepad polyfill (gilrs-backed) when running inside
  // Tauri, so `navigator.getGamepads()` works reliably on Linux/WebKitGTK.
  if ("__TAURI_INTERNALS__" in window) {
    await import("tauri-plugin-gamepad-api");
  }

  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void bootstrap();

