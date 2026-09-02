"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  applyAction,
  artFor,
  createGame,
  dateLabel,
  getChoices,
  hourLabel,
  seasonLabel,
  weatherLabel,
} from "@/lib/game/engine";
import { CHARACTER_BY_ID } from "@/lib/game/content/characters";
import { LOCATION_BY_ID } from "@/lib/game/content/locations";
import { loadGame, saveGame } from "@/lib/game/save";
import type { Choice, GameState, Kit } from "@/lib/game/types";
import { withBase } from "@/lib/paths";

function Meter({ label, value, warn }: { label: string; value: number; warn?: boolean }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px] tracking-wide text-stone-300 uppercase">
        <span>{label}</span>
        <span className={value < 25 || warn ? "text-red-300" : ""}>{Math.round(value)}</span>
      </div>
      <Progress value={value} className="h-1.5 bg-white/10" />
    </div>
  );
}

function Status({ state }: { state: GameState }) {
  const loc = LOCATION_BY_ID[state.locationId];
  const person = state.presentCharacterId ? CHARACTER_BY_ID[state.presentCharacterId] : null;
  const meters = [
    ["Hunger", state.meters.hunger],
    ["Thirst", state.meters.thirst],
    ["Warmth", state.meters.warmth],
    ["Energy", state.meters.energy],
    ["Health", state.meters.health],
  ] as const;
  return (
    <aside className="space-y-4 text-sm">
      <div>
        <p className="text-[11px] tracking-[0.25em] text-amber-100/70 uppercase">{dateLabel(state)}</p>
        <h2 className="font-heading text-xl text-amber-50">{loc?.name ?? state.locationId}</h2>
        <p className="text-stone-300">
          {hourLabel(state.hour)} · {seasonLabel(state.season)} · {weatherLabel(state.weather)}
          {state.campfire ? " · fire" : ""}
        </p>
        <p className="mt-1 text-stone-400">Day {state.daysSurvived} · {state.name}</p>
      </div>
      <div className="space-y-2">
        {meters.map(([label, value]) => (
          <Meter key={label} label={label} value={value} warn={label === "Health" && value < 40} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-stone-300">
        <span>Rations {state.inventory.rations}</span>
        <span>Water {state.inventory.water}</span>
        <span>Wood {state.inventory.firewood}</span>
        <span>Pelts {state.inventory.pelts}</span>
        <span>Powder {state.inventory.powder}</span>
        <span>{state.inventory.coat ? "Wool coat" : "No coat"}</span>
      </div>
      {state.inventory.extras.length > 0 && (
        <p className="text-[11px] leading-snug text-stone-400">
          {state.inventory.extras.map((e) => e.replace(/-/g, " ")).join(" · ")}
        </p>
      )}
      <p className="text-xs text-stone-400">
        Eye {state.traits.eye} · Grit {state.traits.grit} · Savvy {state.traits.savvy} · Hands {state.traits.hands}
      </p>
      {person && <p className="text-xs text-amber-100/80">Here: {person.name}</p>}
      {state.skirmish && (
        <div className="rounded-md border border-red-300/30 bg-red-950/40 p-2 text-xs text-red-100">
          <p className="font-medium">Skirmish</p>
          {state.skirmish.foes.map((f) => (
            <p key={f.id}>
              {f.name} · {f.range} · {f.hp}/{f.maxHp}
            </p>
          ))}
        </div>
      )}
    </aside>
  );
}

export function PlayScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const [state, setState] = useState<GameState | null>(null);

  useEffect(() => {
    const existing = loadGame();
    if (existing && !existing.dead) {
      setState(existing);
      return;
    }
    const name = params.get("name") || "Trapper";
    const kit = (params.get("kit") as Kit) || "coat";
    const fresh = createGame(name, kit);
    saveGame(fresh);
    setState(fresh);
  }, [params]);

  useEffect(() => {
    if (state) saveGame(state);
  }, [state]);

  const choices = useMemo(() => (state ? getChoices(state) : []), [state]);
  const art = state ? artFor(state) : null;

  function act(choice: Choice) {
    if (!state || choice.disabled) return;
    setState(applyAction(state, choice.action));
  }

  if (!state || !art) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-black text-stone-300">
        The mountain is still deciding your weather…
      </div>
    );
  }

  if (state.dead) {
    return (
      <div className="relative min-h-dvh text-stone-100">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${withBase("/art/death.jpg")})` }} />
        <div className="absolute inset-0 bg-black/65" />
        <div className="relative z-10 mx-auto flex min-h-dvh max-w-xl flex-col justify-end gap-4 px-5 py-12">
          <p className="text-xs tracking-[0.3em] text-red-200/80 uppercase">You died</p>
          <h1 className="font-heading text-4xl">Day {state.dead.daysSurvived}</h1>
          <p className="text-stone-200">{state.dead.detail}</p>
          <p className="text-sm text-stone-400">
            {state.dead.cause} · {seasonLabel(state.dead.season)}
          </p>
          <Button size="lg" onClick={() => router.push("/")}>
            Begin again
          </Button>
        </div>
      </div>
    );
  }

  const travel = choices.filter((c) => c.action.type === "travel");
  const rest = choices.filter((c) => c.action.type !== "travel");

  return (
    <div className="relative min-h-dvh overflow-hidden text-stone-100">
      <div
        className="absolute inset-0 bg-cover bg-center transition-[background-image] duration-700"
        style={{ backgroundImage: `url(${art.location})` }}
      />
      <div
        className="absolute inset-0 bg-cover bg-center mix-blend-multiply opacity-40"
        style={{ backgroundImage: `url(${art.atmosphere})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/25" />

      <div className="relative z-10 mx-auto grid min-h-dvh max-w-6xl gap-6 px-4 py-4 lg:grid-cols-[1fr_280px] lg:items-end">
        <div className="flex flex-col justify-end gap-4 pb-4">
          {art.portrait && (
            <div className="h-40 w-28 overflow-hidden rounded-md border border-white/20 shadow-lg sm:h-52 sm:w-36">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={art.portrait} alt="" className="h-full w-full object-cover" />
            </div>
          )}
          <div className="max-h-[40vh] space-y-3 overflow-y-auto pr-1 text-[15px] leading-relaxed sm:max-h-[46vh] sm:text-base">
            {(state.skirmish ? state.log.slice(-6) : state.log.slice(-2)).map((entry) => (
              <div key={entry.id}>
                <p>{entry.text}</p>
                {entry.roll && (
                  <p className={`mt-1 font-mono text-xs ${entry.roll.success ? "text-amber-200" : "text-red-300"}`}>
                    d20 {entry.roll.d20} + {entry.roll.trait} {entry.roll.modifier}
                    {entry.roll.penalty ? ` − ${entry.roll.penalty}` : ""} = {entry.roll.total} vs DC {entry.roll.dc}
                    {entry.roll.success ? " · success" : " · fail"}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {rest.map((c) => (
              <Button
                key={c.id}
                size="lg"
                variant={c.action.type === "skirmish" && c.id === "flee" ? "secondary" : "default"}
                disabled={c.disabled}
                title={c.hint}
                onClick={() => act(c)}
              >
                {c.label}
              </Button>
            ))}
          </div>
          {travel.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {travel.map((c) => (
                <Button key={c.id} size="sm" variant="outline" title={c.hint} onClick={() => act(c)}>
                  {c.label}
                </Button>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-xl border border-white/15 bg-black/50 p-4 backdrop-blur-md">
          <Status state={state} />
        </div>
      </div>
    </div>
  );
}
