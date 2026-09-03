"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Cinema } from "@/components/game/cinema";
import { FateDie } from "@/components/game/fate-die";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { campHotspots } from "@/lib/game/camp";
import { cinemaAfterAction, type CinemaSequence } from "@/lib/game/cinema";
import { CHARACTER_BY_ID } from "@/lib/game/content/characters";
import { LOCATION_BY_ID } from "@/lib/game/content/locations";
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
import { loadGame, saveGame } from "@/lib/game/save";
import type { Choice, GameAction, GameState, Kit } from "@/lib/game/types";
import { timeBand } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import { withBase } from "@/lib/paths";

function timeAtmosphere(state: GameState, fallback: string) {
  if (state.weather === "blizzard" || state.weather === "storm") return fallback;
  const band = timeBand(state.hour);
  if (band === "night") return withBase("/art/atmosphere/night.jpg");
  if (band === "dawn") return withBase("/art/atmosphere/dawn.jpg");
  if (band === "dusk") return withBase("/art/atmosphere/dusk.jpg");
  return fallback;
}

function timeGrade(hour: number) {
  switch (timeBand(hour)) {
    case "night":
      return "bg-indigo-950/55";
    case "dawn":
      return "bg-rose-900/20";
    case "morning":
      return "bg-sky-900/10";
    case "afternoon":
      return "bg-transparent";
    case "dusk":
      return "bg-amber-950/30";
  }
}

function choiceTier(choice: Choice): NonNullable<Choice["tier"]> {
  if (choice.tier) return choice.tier;
  if (choice.action.type === "travel") return "travel";
  return "hero";
}

function actionKey(choice: Choice) {
  return JSON.stringify(choice.action);
}

function isUrgentBeat(state: GameState) {
  return Boolean(state.dead || state.skirmish || state.pendingRoll || state.activeEncounterId);
}

function CrossfadePlate({
  src,
  className,
  ken,
}: {
  src: string;
  className?: string;
  ken?: boolean;
}) {
  const [current, setCurrent] = useState(src);
  const [prev, setPrev] = useState<string | null>(null);

  useEffect(() => {
    if (src === current) return;
    setPrev(current);
    setCurrent(src);
    const t = window.setTimeout(() => setPrev(null), 1900);
    return () => window.clearTimeout(t);
  }, [src, current]);

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      {prev && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={prev} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={current}
        src={current}
        alt=""
        className={cn("absolute inset-0 h-full w-full object-cover", prev && "hc-plate-fade-in", ken && "hc-plate-breathe")}
      />
    </div>
  );
}

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
      {state.camp && (
        <p className="text-xs text-amber-100/70">
          Camp at {LOCATION_BY_ID[state.camp.locationId]?.name ?? state.camp.locationId}
          {state.camp.locationId === state.locationId ? " · here" : ""}
          {state.camp.smoke > 0 ? ` · smoke ${state.camp.smoke}` : ""}
          {state.camp.jobs.some((j) => j.hoursLeft <= 0) ? " · work ready" : ""}
        </p>
      )}
      {state.camp && state.camp.locationId === state.locationId && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-stone-400">
          <span>Cache meat {state.camp.cache.rations}</span>
          <span>Cache water {state.camp.cache.water}</span>
          <span>Cache wood {state.camp.cache.firewood}</span>
          <span>Cache pelts {state.camp.cache.pelts}</span>
        </div>
      )}
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
  const [cinema, setCinema] = useState<CinemaSequence | null>(null);
  const [choiceHold, setChoiceHold] = useState(false);
  const [tendOpen, setTendOpen] = useState(false);
  const holdTimer = useRef<number>(0);

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

  useEffect(() => {
    return () => window.clearTimeout(holdTimer.current);
  }, []);

  const choices = useMemo(() => (state ? getChoices(state) : []), [state]);
  const art = state ? artFor(state) : null;

  function commit(prev: GameState, action: GameAction) {
    const next = applyAction(prev, action);
    const seq = cinemaAfterAction(prev, next);
    setState(next);
    window.clearTimeout(holdTimer.current);
    if (seq) {
      setCinema(seq);
      setChoiceHold(false);
      setTendOpen(false);
      return;
    }
    if (action.type === "wait" && !isUrgentBeat(next) && !next.dead) {
      setChoiceHold(true);
      holdTimer.current = window.setTimeout(() => setChoiceHold(false), 1400);
    } else {
      setChoiceHold(false);
    }
  }

  function act(choice: Choice) {
    if (!state || choice.disabled) return;
    setTendOpen(false);
    commit(state, choice.action);
  }

  if (!state || !art) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-black text-stone-300">
        The mountain is still deciding your weather…
      </div>
    );
  }

  if (state.dead && !cinema) {
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

  const spots = !state.activeEncounterId && !state.skirmish ? campHotspots(state) : [];
  const knownKeys = new Set(choices.map(actionKey));
  const hero = choices.filter((c) => choiceTier(c) === "hero");
  const travel = choices.filter((c) => choiceTier(c) === "travel" || c.action.type === "travel");
  const routineFromChoices = choices.filter((c) => choiceTier(c) === "routine");
  const routineSpots = spots.filter((s) => s.action.type !== "pitchCamp" && !knownKeys.has(actionKey(s)));
  const routine = [...routineFromChoices, ...routineSpots];
  const idle = !isUrgentBeat(state);
  const showHero = idle ? hero : hero.filter((c) => c.action.type !== "travel");
  const atmosphere = timeAtmosphere(state, art.atmosphere);

  return (
    <div className="relative min-h-dvh overflow-hidden text-stone-100">
      <CrossfadePlate src={art.location} ken />
      <CrossfadePlate src={atmosphere} className="mix-blend-multiply opacity-45" />
      <div className={`absolute inset-0 transition-colors duration-[1800ms] ${timeGrade(state.hour)}`} />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/25" />

      <div className="relative z-10 mx-auto grid min-h-dvh max-w-6xl gap-6 px-4 py-4 lg:grid-cols-[1fr_280px] lg:items-end">
        <div className="relative flex flex-col justify-end gap-4 pb-4">
          {art.portrait && (
            <div className="h-40 w-28 overflow-hidden rounded-md border border-white/20 shadow-lg sm:h-52 sm:w-36">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={art.portrait} alt="" className="h-full w-full object-cover" />
            </div>
          )}
          <div className="relative z-20 max-h-[40vh] space-y-3 overflow-y-auto rounded-lg bg-black/40 px-3 py-3 pr-2 text-[15px] leading-relaxed backdrop-blur-sm sm:max-h-[46vh] sm:text-base">
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
          {state.pendingRoll ? (
            <FateDie
              pending={state.pendingRoll}
              retreats={showHero}
              scene={state.log[state.log.length - 1]?.text}
              onCast={() => setState((s) => (s ? applyAction(s, { type: "castDie" }) : s))}
              onSettled={() => {
                setState((s) => {
                  if (!s) return s;
                  const next = applyAction(s, { type: "finishDie" });
                  const seq = cinemaAfterAction(s, next);
                  if (seq) {
                    window.setTimeout(() => setCinema(seq), 0);
                  }
                  return next;
                });
              }}
              onRetreat={act}
            />
          ) : (
            <div className={cn("hc-choices space-y-3", choiceHold && "is-held")}>
              <div className="flex flex-wrap gap-2">
                {showHero.map((c) => (
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
              {idle && routine.length > 0 && (
                <Sheet open={tendOpen} onOpenChange={setTendOpen}>
                  <SheetTrigger className="inline-flex h-8 items-center rounded-lg border border-white/20 bg-black/40 px-3 text-[0.8rem] tracking-[0.18em] text-amber-100/75 uppercase hover:border-amber-200/40 hover:text-amber-50">
                    Tend camp
                  </SheetTrigger>
                  <SheetContent
                    side="bottom"
                    className="border-white/15 bg-black/92 text-stone-100 sm:max-w-none"
                  >
                    <SheetHeader>
                      <SheetTitle className="text-amber-50">Tend camp</SheetTitle>
                      <SheetDescription className="text-stone-400">
                        Small work. The mountain keeps the hours.
                      </SheetDescription>
                    </SheetHeader>
                    <div className="flex flex-wrap gap-2 px-4 pb-6">
                      {routine.map((c) => (
                        <Button
                          key={c.id}
                          size="sm"
                          variant="secondary"
                          disabled={c.disabled}
                          title={c.hint}
                          onClick={() => act(c)}
                        >
                          {c.label}
                        </Button>
                      ))}
                    </div>
                  </SheetContent>
                </Sheet>
              )}
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
          )}
        </div>
        <div className="rounded-xl border border-white/15 bg-black/50 p-4 backdrop-blur-md">
          <Status state={state} />
        </div>
      </div>
      {cinema && <Cinema sequence={cinema} onDone={() => setCinema(null)} />}
    </div>
  );
}
