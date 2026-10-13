// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 The Awesome Gamepad UI Authors

use std::fs::{self, File, OpenOptions};
use std::io::Write;
use std::path::PathBuf;
use std::sync::Mutex;

use serde::Serialize;
use tauri::{Manager, State};

/// Basic application metadata, exposed to the frontend as an IPC smoke test.
#[derive(Serialize)]
pub struct AppInfo {
    name: &'static str,
    version: &'static str,
}

#[tauri::command]
fn app_info() -> AppInfo {
    AppInfo {
        name: "Awesome Gamepad UI",
        version: env!("CARGO_PKG_VERSION"),
    }
}

/// Append-only log file that gamepad debug lines are mirrored to.
struct GamepadLog {
    file: Mutex<File>,
}

/// Directory gamepad logs are written to.
fn log_dir() -> PathBuf {
    // Hardwired to `/tmp/awesome-gamepad-ui` on Unix (as requested); other
    // platforms fall back to the system temp directory.
    #[cfg(unix)]
    {
        PathBuf::from("/tmp/awesome-gamepad-ui")
    }
    #[cfg(not(unix))]
    {
        std::env::temp_dir().join("awesome-gamepad-ui")
    }
}

/// Creates a fresh, timestamped log file for this run.
fn create_log_file() -> std::io::Result<(PathBuf, File)> {
    let dir = log_dir();
    fs::create_dir_all(&dir)?;
    let stamp = chrono::Local::now().format("%Y-%m-%d_%H-%M-%S");
    let path = dir.join(format!("log-{stamp}.log"));
    let mut file = OpenOptions::new().create(true).append(true).open(&path)?;
    writeln!(
        file,
        "# Awesome Gamepad UI — gamepad debug log — {stamp} (v{})",
        env!("CARGO_PKG_VERSION")
    )?;
    Ok((path, file))
}

/// Prints a gamepad debug line to the terminal and mirrors it to the log file.
#[tauri::command]
fn log_gamepad(level: String, message: String, log: State<'_, GamepadLog>) {
    println!("[gamepad][{level}] {message}");
    if let Ok(mut file) = log.file.lock() {
        let _ = writeln!(file, "[{level}] {message}");
    }
}

/// One connected gamepad, as seen by a one-off snapshot enumeration.
#[derive(Serialize)]
struct GamepadSummary {
    /// 0-based id; lines up with the plugin's event ids.
    id: usize,
    name: String,
    uuid: String,
    vendor_id: Option<u16>,
    product_id: Option<u16>,
    mapping: String,
}

/// Formats gilrs' raw UUID bytes in the canonical hyphenated form.
fn format_uuid(bytes: [u8; 16]) -> String {
    let hex: String = bytes.iter().map(|byte| format!("{byte:02x}")).collect();
    format!(
        "{}-{}-{}-{}-{}",
        &hex[0..8],
        &hex[8..12],
        &hex[12..16],
        &hex[16..20],
        &hex[20..32]
    )
}

/// Enumerates the gamepads currently attached.
///
/// `tauri-plugin-gamepad` never reports pads that were already connected when
/// it started, so the frontend calls this once to give the debug log a startup
/// snapshot. gilrs assigns ids in a stable enumeration order, so they line up
/// with the ids it later reports on events.
#[tauri::command]
fn list_gamepads() -> Result<Vec<GamepadSummary>, String> {
    let gilrs = gilrs::Gilrs::new().map_err(|err| err.to_string())?;
    let pads = gilrs
        .gamepads()
        .map(|(id, gamepad)| GamepadSummary {
            id: usize::from(id),
            name: gamepad.name().to_owned(),
            uuid: format_uuid(gamepad.uuid()),
            vendor_id: gamepad.vendor_id(),
            product_id: gamepad.product_id(),
            mapping: match gamepad.mapping_source() {
                gilrs::MappingSource::SdlMappings => "standard".to_owned(),
                _ => String::new(),
            },
        })
        .collect();
    Ok(pads)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_gamepad::init())
        .setup(|app| {
            let (path, file) = create_log_file()?;
            println!("[gamepad] debug log: {}", path.display());
            app.manage(GamepadLog {
                file: Mutex::new(file),
            });

            // Raw, unfiltered event dump straight from the gamepad plugin's own
            // logger. It fires for every axis delta and button change, so it is
            // extremely verbose and therefore opt-in.
            if std::env::var_os("AWP_DEBUG_GAMEPAD_RAW").is_some() {
                app.state::<tauri_plugin_gamepad::GamepadState>()
                    .set_logging(true);
                println!(
                    "[gamepad] raw logging enabled (AWP_DEBUG_GAMEPAD_RAW) — expect heavy output"
                );
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            app_info,
            log_gamepad,
            list_gamepads
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
