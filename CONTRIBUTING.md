# Contributing to Awesome Gamepad UI

Thanks for wanting to help build this. It's a couch-first, gamepad-driven game
launcher, and it's meant to grow with its community. Every kind of contribution
is welcome: code, themes, mods, translations, docs, bug reports, and testing on
hardware we don't own.

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). By
participating you agree to uphold it.

## Ways to contribute

- **Report bugs** using the issue templates.
- **Request features** — tell us what your living-room setup needs.
- **Send pull requests** — see below.
- **Build themes and mods** once the extension APIs land.
- **Test hardware** — controllers, resolutions (720p → 4K), distros, Flatpaks.

## Development setup

Prerequisites: Node 20+ (22 recommended), a stable Rust toolchain, and the
[Tauri v2 Linux system dependencies](https://tauri.app/start/prerequisites/).

```sh
npm install
npm run tauri dev
```

Useful commands:

```sh
npm run dev       # frontend only, in a browser
npm run build     # typecheck + production frontend build
npm run tauri build
```

## Project layout

- `src/` — React frontend (components, input, navigation, screens)
- `src-tauri/` — Rust backend (providers, launch pipeline, IPC commands)

## Pull requests

1. Fork the repo and create a branch from `main`.
2. Keep changes focused; one concern per PR where possible.
3. Make sure `npm run build` and `cargo check` pass.
4. Write a clear description of **what** changed and **why**.
5. **Sign off your commits** (see below).

### Developer Certificate of Origin (DCO)

We use the DCO instead of a CLA: you keep your copyright and simply certify you
have the right to submit the work. Add a sign-off to every commit:

```sh
git commit -s -m "feat: add gamepad dead-zone handling"
```

That appends:

```
Signed-off-by: Your Name <you@example.com>
```

Using your real name and a reachable email. DCO text: <https://developercertificate.org/>.

## Commit style

Conventional Commits are appreciated but not enforced:

```
feat: …      a new feature
fix: …       a bug fix
docs: …      documentation only
refactor: …  no behaviour change
perf: …      performance
test: …      tests
chore: …     tooling / deps
```

## Coding conventions

- **TypeScript**: strict mode is on; prefer the `@/` import alias.
- **Rust**: run `cargo fmt` and keep `cargo clippy` clean.
- **Never hardcode colours or sizes** — use theme tokens / design tokens so
  themes and scaling keep working.
- **Everything must be reachable with a gamepad.** Keyboard/mouse is a fallback,
  never the only path.

## Licensing

By contributing you agree your contributions are licensed under the project's
license, **GPL-3.0-or-later** (see [LICENSE](LICENSE)). The future mod/theme SDK
is intended to ship under `MIT OR Apache-2.0` to keep modding frictionless.

## Questions?

Open a discussion or drop into the community chat. Be kind, be patient — this is
a hobby project built for the love of couch gaming.
