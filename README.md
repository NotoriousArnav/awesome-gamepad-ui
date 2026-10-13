# Awesome Gamepad UI

A couch-first, **gamepad-driven game launcher** — the goal is a standalone
Big-Picture-style interface for living-room PCs, with powerful per-game launch
options and a mod/theme platform.

> Status: **early scaffold.** Tauri v2 + React 19 + Tailwind v4 + shadcn are
> wired up. No gamepad input, library scanning, launch pipeline, themes or mods
> yet.

## Stack

| Layer    | Choice                                             |
| -------- | -------------------------------------------------- |
| Shell    | [Tauri](https://tauri.app) v2 (Rust backend)       |
| Frontend | React 19 + TypeScript + Vite 8                     |
| Styling  | Tailwind CSS v4                                    |
| UI kit   | [shadcn](https://ui.shadcn.com) (Radix base, Nova preset) |
| Icons    | lucide-react                                       |

## Prerequisites (Linux)

Tauri needs a few system libraries:

```sh
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file \
  libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

Node 20+ and a stable Rust toolchain are also required.

## Getting started

```sh
npm install
npm run tauri dev     # run the desktop app (starts Vite + builds Rust)
```

Other scripts:

```sh
npm run dev           # Vite dev server only (frontend in a browser)
npm run build         # typecheck + production frontend build
npm run tauri build   # bundle a desktop binary
```

## Project layout

```
src/                  React frontend
  components/ui/      shadcn components
  lib/                utilities
  App.tsx             app shell
src-tauri/            Rust backend
  src/lib.rs          Tauri builder + IPC commands
  tauri.conf.json     window / bundle config
```

## Adding shadcn components

```sh
npx shadcn@latest add <component>
```

## Planned (not yet built)

- Gamepad input layer + spatial navigation (ergonomic, remappable)
- Scalable 10-foot UI (720p → 4K)
- Art pipeline (SteamGridDB, IGDB, IGN, LaunchBox) + local caching
- Library providers (Lutris, Steam)
- Layered per-game **launch options** with a live resolved-command preview
- Themes and a WASM/JS mod platform

## Community

This project is built in the open and meant to grow with its community — see
[CONTRIBUTING.md](CONTRIBUTING.md) to get involved, and the
[Code of Conduct](CODE_OF_CONDUCT.md) for how we treat each other.

## License

Awesome Gamepad UI is licensed under **GPL-3.0-or-later** — see [LICENSE](LICENSE).

The application core is copyleft so the project can't be closed off and
improvements flow back to everyone. The planned **mod / theme SDK** will be
released under `MIT OR Apache-2.0` so anyone can build (or sell) mods and themes
without licensing friction.
