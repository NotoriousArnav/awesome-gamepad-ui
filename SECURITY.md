# Security Policy

## Reporting a vulnerability

Please **do not** open a public issue for security problems. Instead, report
privately using GitHub's [private vulnerability reporting](../../security/advisories/new)
or email the maintainers.

Include:

- what the issue is and its impact,
- steps to reproduce,
- affected version / commit,
- any suggested fix.

We'll acknowledge as soon as we can and keep you updated on the fix.

## What we consider in scope

This is a launcher that (eventually) does several sensitive things, so these are
all security-relevant:

- **Mods and themes are untrusted code.** The mod platform must sandbox backend
  mods (WASM) and gate host capabilities behind declared, user-approved
  permissions. A sandbox escape or permission bypass is a real vulnerability.
- **Process launching.** The launch pipeline spawns arbitrary commands and
  wrappers. Command/argument injection via game metadata, launch profiles, or
  mods is in scope.
- **Local file access.** Library scanning, art caching, and config storage read
  and write files. Path traversal or arbitrary write is in scope.
- **Credential handling.** API keys (SteamGridDB, IGDB) are stored locally and
  must be protected and never leaked (e.g. into logs or shared profiles).
- **Network sources.** Art/metadata providers are third-party; unsafe
  deserialization or untrusted responses are in scope.

## Out of scope

- Vulnerabilities in third-party launchers, runners, or compositors we call out
  to (e.g. Lutris, Steam, gamescope) — report those upstream.
- Issues that require an already-compromised machine or root access.
- The content/licensing terms of third-party art and metadata APIs.

## Supported versions

The project is pre-1.0 and moving fast; only the latest `main` is supported.
