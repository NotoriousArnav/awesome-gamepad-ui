// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 The Awesome Gamepad UI Authors

import { invoke } from "@tauri-apps/api/core";

export type LogLevel = "info" | "debug";

/**
 * Mirrors a line to the terminal and the current run's log file.
 *
 * The WebView's console doesn't reach the terminal, so this hops through the
 * Rust `log_gamepad` command, which prints the line and appends it to the log
 * file created at startup.
 */
export function logLine(level: LogLevel, message: string): void {
  const time = new Date().toTimeString().slice(0, 8);
  // Logging must never break input handling.
  void invoke("log_gamepad", {
    level,
    message: `${time}  ${message}`,
  }).catch(() => {});
}
