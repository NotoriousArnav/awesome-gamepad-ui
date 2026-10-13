// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (C) 2026 The Awesome Gamepad UI Authors

import { useEffect, useState } from "react";

import { CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { useAction, useFocus, useFocusable, useInput } from "@/input/input-react";

interface Game {
  id: string;
  title: string;
  subtitle: string;
  provider: "Lutris" | "Steam";
}

const GAMES: readonly Game[] = [
  { id: "game-1", title: "Hollow Knight", subtitle: "Lutris", provider: "Lutris" },
  { id: "game-2", title: "Elden Ring", subtitle: "Steam", provider: "Steam" },
  { id: "game-3", title: "Celeste", subtitle: "Lutris", provider: "Lutris" },
  { id: "game-4", title: "Baldur's Gate 3", subtitle: "Steam", provider: "Steam" },
  { id: "game-5", title: "Factorio", subtitle: "Steam", provider: "Steam" },
  { id: "game-6", title: "Path of Exile", subtitle: "Lutris", provider: "Lutris" },
  { id: "game-7", title: "Dead Cells", subtitle: "Lutris", provider: "Lutris" },
  { id: "game-8", title: "Outer Wilds", subtitle: "Steam", provider: "Steam" },
];

function Tile({ game }: { game: Game }) {
  const { ref, focused } = useFocusable<HTMLButtonElement>(game.id);

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "group relative flex aspect-[3/4] w-full flex-col justify-end overflow-hidden rounded-xl border p-3 text-left transition-all duration-150 outline-none",
        "hover:border-primary/60",
        focused
          ? "border-primary ring-2 ring-primary scale-[1.02] shadow-lg"
          : "border-border bg-card",
      )}
    >
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-80",
          game.provider === "Lutris"
            ? "from-violet-900/50 to-background"
            : "from-blue-900/50 to-background",
        )}
      />
      <div className="relative space-y-1">
        <CardTitle className="text-sm font-semibold leading-tight">
          {game.title}
        </CardTitle>
        <CardDescription className="text-xs">{game.subtitle}</CardDescription>
      </div>
    </button>
  );
}

function App() {
  useInput();

  const focused = useFocus();
  const [message, setMessage] = useState<string>(
    "Ready: arrows / DPad / stick to move, confirm to play.",
  );

  useAction("confirm", (event) => {
    if (event.phase !== "press") return;
    const game = GAMES.find((g) => g.id === focused);
    setMessage(
      game ? `Launching ${game.title} (${game.subtitle})` : "Nothing focused.",
    );
  });
  useAction("back", (event) => {
    if (event.phase !== "press") return;
    setMessage("Back.");
  });
  useAction("menu", (event) => {
    if (event.phase !== "press") return;
    setMessage("Menu opened.");
  });
  useAction("home", (event) => {
    if (event.phase !== "press") return;
    setMessage("Home.");
  });
  useAction("pagePrev", (event) => {
    if (event.phase !== "press") return;
    setMessage("Previous page.");
  });
  useAction("pageNext", (event) => {
    if (event.phase !== "press") return;
    setMessage("Next page.");
  });

  useEffect(() => {
    if (focused !== null) {
      const game = GAMES.find((g) => g.id === focused);
      if (game) setMessage(`Focused: ${game.title}`);
    }
  }, [focused]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between gap-3 border-b border-border/60 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <span className="text-lg">🎮</span>
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight">
              Awesome Gamepad UI
            </h1>
            <p className="text-xs text-muted-foreground">
              Couch-first gamepad launcher
            </p>
          </div>
        </div>
        <span className="rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground">
          Focus: {focused ?? "—"}
        </span>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Library</h2>
          <span className="text-xs text-muted-foreground">
            Player 1 · directions move · South confirms
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {GAMES.map((game) => (
            <Tile key={game.id} game={game} />
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-border/60 bg-card/40 px-4 py-3 text-sm text-muted-foreground">
          {message}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <KeyHint label="DPad / Stick" value="Move focus" />
          <KeyHint label="South (A)" value="Confirm" />
          <KeyHint label="East (B)" value="Back" />
          <KeyHint label="LB / RB" value="Page" />
          <KeyHint label="Arrows / Enter / Esc" value="Keyboard fallback" />
        </div>
      </main>
    </div>
  );
}

function KeyHint({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-md border border-border/60 bg-card px-2 py-1">
      <span className="font-medium text-foreground/80">{label}</span>
      <span className="mx-1 opacity-50">→</span>
      {value}
    </span>
  );
}

export default App;
