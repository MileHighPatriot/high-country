"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Cinema } from "@/components/game/cinema";
import { FateDie } from "@/components/game/fate-die";
import { LivingPlate } from "@/components/game/living-plate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { clearSave, downloadGame, loadGame, saveGame } from "@/lib/game/save";
import {
  deathCauseLabel,
  knownMap,
  METER_LABELS,
  placeName,
  skillStatusLine,
  TRAIT_LINE,
} from "@/lib/game/readout";
import type { Choice, GameAction, GameState, Kit, LogEntry } from "@/lib/game/types";
import { timeBand } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import { livingTellFromState, livingTellFrostsChrome } from "@/lib/game/living-plate";
import { getScene } from "@/lib/game/scene";
import { peopleAt } from "@/lib/game/world";
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
  return Boolean(
    state.dead || state.skirmish || state.pendingRoll || state.activeEncounterId || state.waitScene,
  );
}

function journalStamp(entry: LogEntry, prev?: LogEntry) {
  if (entry.daysSurvived == null && !entry.locationId) return null;
  const same =
    prev &&
    prev.daysSurvived === entry.daysSurvived &&
    prev.locationId === entry.locationId &&
    prev.hour === entry.hour;
  if (same) return null;
  const day = entry.daysSurvived != null ? `Day ${entry.daysSurvived}` : null;
  const when = entry.hour != null ? hourLabel(entry.hour) : null;
  const here = entry.locationId ? placeName(entry.locationId) : null;
  return [day, when, here].filter(Boolean).join(" · ");
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

function meterList(state: GameState) {
  return [
    [METER_LABELS.hunger, state.meters.hunger],
    [METER_LABELS.thirst, state.meters.thirst],
    [METER_LABELS.warmth, state.meters.warmth],
    [METER_LABELS.energy, state.meters.energy],
    [METER_LABELS.health, state.meters.health],
  ] as const;
}

function YouBody({ state }: { state: GameState }) {
  const person = state.presentCharacterId ? CHARACTER_BY_ID[state.presentCharacterId] : null;
  const skill = skillStatusLine(state);
  return (
    <div className="space-y-4 overflow-y-auto px-4 pb-6 text-sm">
      <p className="text-xs text-stone-300">
        {state.name} · {dateLabel(state)}
      </p>
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
      <p className="text-[11px] leading-snug text-stone-500">{TRAIT_LINE}</p>
      {skill && <p className="text-[11px] leading-snug text-amber-100/70">{skill}</p>}
      {state.companionId && CHARACTER_BY_ID[state.companionId] && (
        <p className="text-xs text-amber-100/90">Walking with {CHARACTER_BY_ID[state.companionId]!.name}</p>
      )}
      {person && !state.companionId && peopleAt(state).length === 0 && (
        <p className="text-xs text-amber-100/80">Here: {person.name}</p>
      )}
      {peopleAt(state).length > 0 && (
        <ul className="space-y-0.5 text-[11px] text-stone-400">
          {peopleAt(state).map((p) => {
            const n = CHARACTER_BY_ID[p.id]?.name ?? p.id;
            const stand = state.standing[p.id] ?? 0;
            return (
              <li key={p.id}>
                {n}
                {stand ? ` · standing ${stand > 0 ? "+" : ""}${stand}` : ""}
                {p.errand ? ` · ${p.errand}` : ""}
              </li>
            );
          })}
        </ul>
      )}
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
      <CountryMap state={state} />
    </div>
  );
}

function JournalBody({ log }: { log: LogEntry[] }) {
  return (
    <div className="max-h-[min(70vh,32rem)] space-y-3 overflow-y-auto px-4 pb-6 text-[15px] leading-relaxed">
      {log.map((entry, i) => {
        const stamp = journalStamp(entry, log[i - 1]);
        return (
          <div key={entry.id}>
            {stamp && (
              <p className="mb-1 text-[10px] tracking-[0.2em] text-amber-100/45 uppercase">{stamp}</p>
            )}
            <p>{entry.text}</p>
            {entry.roll && (
              <p className={`mt-1 font-mono text-xs ${entry.roll.success ? "text-amber-200" : "text-red-300"}`}>
                d20 {entry.roll.d20} + {entry.roll.trait} {entry.roll.modifier}
                {entry.roll.penalty ? ` − ${entry.roll.penalty}` : ""} = {entry.roll.total} vs DC {entry.roll.dc}
                {entry.roll.success ? " · success" : " · fail"}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function findChoice(choices: Choice[], pred: (c: Choice) => boolean) {
  return choices.find(pred);
}

function CampStage({
  state,
  choices,
  spots,
  waiting,
  onAct,
}: {
  state: GameState;
  choices: Choice[];
  spots: Choice[];
  waiting: boolean;
  onAct: (c: Choice) => void;
}) {
  const pool = [...choices, ...spots];
  const atCamp = Boolean(state.camp && state.camp.locationId === state.locationId);
  const scene = state.waitScene;
  const personId = state.presentCharacterId ?? (waiting ? scene?.arrivalId : null) ?? null;
  const person = personId ? CHARACTER_BY_ID[personId] : null;
  const talk = findChoice(pool, (c) => c.action.type === "talk");
  const fireChoice = findChoice(
    pool,
    (c) => c.action.type === "makeFire" || c.action.type === "tendFire" || c.id === "camp-fire",
  );
  const woodChoice = findChoice(pool, (c) => c.id === "camp-wood" || c.action.type === "gatherWood");
  const leanChoice = findChoice(
    pool,
    (c) => c.id === "camp-lean" || (c.action.type === "build" && c.action.piece === "leanTo"),
  );
  const showLean = atCamp && (Boolean(state.camp?.leanTo) || Boolean(leanChoice));
  const showPile = atCamp && (Boolean(state.camp?.woodpile) || Boolean(woodChoice));
  const showFire = state.campfire || (atCamp && (Boolean(state.camp?.fireRing) || Boolean(fireChoice)));
  const fireDying = waiting && scene?.fireDies;
  const arrivalIn = waiting && scene?.arrivalId && !state.presentCharacterId;
  const waterChoice = findChoice(pool, (c) => c.action.type === "gatherWater");

  return (
    <div className="pointer-events-none absolute inset-0 z-[8]">
      {showLean && (
        <button
          type="button"
          className="hc-camp-piece pointer-events-auto"
          style={{ left: "6%", bottom: "50%", width: "min(22vw, 13rem)" }}
          disabled={!leanChoice || waiting}
          onClick={() => leanChoice && onAct(leanChoice)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={withBase("/art/camp/lean-to.png")} alt="" className={cn("hc-camp-img", !state.camp?.leanTo && "hc-camp-ghost")} />
          <span className="hc-camp-name">{leanChoice?.label ?? "Lean-to"}</span>
        </button>
      )}
      {showFire && (
        <button
          type="button"
          className={cn("hc-camp-piece pointer-events-auto", fireDying && "hc-fire-dying")}
          style={{ left: "38%", bottom: "46%", width: "min(18vw, 11rem)" }}
          disabled={!fireChoice || waiting}
          onClick={() => fireChoice && onAct(fireChoice)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={withBase("/art/camp/fire.png")} alt="" className="hc-camp-img hc-camp-fire" />
          <span className="hc-camp-name">{fireChoice?.label ?? (state.campfire ? "Fire" : "Fire ring")}</span>
        </button>
      )}
      {showPile && (
        <button
          type="button"
          className="hc-camp-piece pointer-events-auto"
          style={{ left: "58%", bottom: "48%", width: "min(20vw, 12rem)" }}
          disabled={!woodChoice || waiting}
          onClick={() => woodChoice && onAct(woodChoice)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={withBase("/art/camp/woodpile.png")} alt="" className={cn("hc-camp-img", !state.camp?.woodpile && "hc-camp-ghost")} />
          <span className="hc-camp-name">{woodChoice?.label ?? "Woodpile"}</span>
        </button>
      )}
      {waterChoice && (
        <button
          type="button"
          className="hc-camp-hit pointer-events-auto"
          style={{ left: "10%", bottom: "42%" }}
          disabled={waterChoice.disabled || waiting}
          onClick={() => onAct(waterChoice)}
        >
          {waterChoice.label}
        </button>
      )}
      {person?.art && (
        <button
          type="button"
          className={cn("hc-camp-figure pointer-events-auto", arrivalIn && "hc-figure-in")}
          style={{ right: "4%", left: "auto", bottom: "44%" }}
          disabled={!talk || waiting}
          onClick={() => talk && onAct(talk)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={withBase(person.art)} alt="" />
          <span className="hc-camp-name">{person.name}</span>
        </button>
      )}
    </div>
  );
}

function WaitPlay({
  scene,
  onDone,
}: {
  scene: NonNullable<GameState["waitScene"]>;
  onDone: () => void;
}) {
  const [phase, setPhase] = useState<"light" | "fire" | "arrival">("light");
  const done = useRef(false);

  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  function skip() {
    done.current = true;
    onDoneRef.current();
  }

  useEffect(() => {
    done.current = false;
    const steps: Array<"light" | "fire" | "arrival"> = ["light"];
    if (scene.fireLit) steps.push("fire");
    if (scene.arrivalId) steps.push("arrival");
    let i = 0;
    const tick = window.setInterval(() => {
      i += 1;
      if (i >= steps.length) {
        window.clearInterval(tick);
        if (!done.current) skip();
        return;
      }
      setPhase(steps[i]!);
    }, 2300);
    const cap = window.setTimeout(() => {
      if (!done.current) skip();
    }, steps.length * 2300 + 1200);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        skip();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(cap);
      window.removeEventListener("keydown", onKey);
    };
    // Primitive fields so a new object with the same wait does not reset the hour.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene.hours, scene.fireLit, scene.arrivalId, scene.fireDies]);

  const line =
    phase === "light"
      ? "The light changes."
      : phase === "fire"
        ? scene.fireDies
          ? "The coals go thin."
          : "The fire holds."
        : CHARACTER_BY_ID[scene.arrivalId ?? ""]?.name
          ? `${CHARACTER_BY_ID[scene.arrivalId!]?.name} is on the ground now.`
          : "Someone uses the hour.";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-36 z-[35] flex justify-center px-4 sm:bottom-40">
      <button
        type="button"
        className="pointer-events-auto rounded-md border border-amber-100/25 bg-black/75 px-4 py-2 text-sm tracking-wide text-amber-100/90 hover:bg-black/85"
        onClick={skip}
      >
        {line} <span className="text-stone-400">· skip</span>
      </button>
    </div>
  );
}

function CountryMap({ state }: { state: GameState }) {
  const nodes = knownMap(state);
  if (nodes.length === 0) return null;
  return (
    <div className="space-y-1.5 border-t border-white/10 pt-3">
      <p className="text-[11px] tracking-[0.25em] text-amber-100/60 uppercase">Country</p>
      <ul className="space-y-1 text-xs">
        {nodes.map((n) => (
          <li key={n.id}>
            <p className={n.here ? "text-amber-100" : "text-stone-300"}>
              {n.name}
              {n.here ? " · here" : ""}
              {n.camp ? " · camp" : ""}
            </p>
            {n.here && n.trails.length > 0 && (
              <p className="pl-2 text-[11px] leading-snug text-stone-500">
                {n.trails
                  .map((t) => (t.known ? `${t.name} ${t.hours} hr` : t.trailName))
                  .join(" · ")}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PlayScreen() {
  const router = useRouter();
  const params = useSearchParams();
  const [state, setState] = useState<GameState | null>(null);
  const [cinema, setCinema] = useState<CinemaSequence | null>(null);
  const [choiceHold, setChoiceHold] = useState(false);
  const [tendOpen, setTendOpen] = useState(false);
  const [youOpen, setYouOpen] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const [saveNote, setSaveNote] = useState<string | null>(null);
  const [intent, setIntent] = useState("");
  const holdTimer = useRef<number>(0);
  const booted = useRef(false);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    const wantsFresh = params.get("fresh") === "1";
    if (wantsFresh) clearSave();
    const existing = wantsFresh ? null : loadGame();
    if (existing && !existing.dead) {
      setState(existing);
      if (params.toString()) router.replace("/play");
      return;
    }
    const name = params.get("name") || "Trapper";
    const kit = (params.get("kit") as Kit) || "coat";
    const fresh = createGame(name, kit);
    saveGame(fresh);
    setState(fresh);
    if (params.toString()) router.replace("/play");
  }, [params, router]);

  useEffect(() => {
    if (!state) return;
    saveGame(state);
  }, [state]);

  useEffect(() => {
    return () => window.clearTimeout(holdTimer.current);
  }, []);

  const choices = useMemo(() => (state ? getChoices(state) : []), [state]);
  const scene = useMemo(() => (state ? getScene(state, choices) : null), [state, choices]);
  const art = state ? artFor(state) : null;

  function commit(prev: GameState, action: GameAction) {
    let next: GameState = prev;
    try {
      next = applyAction(prev, action) ?? prev;
    } catch {
      next = prev.waitScene ? { ...prev, waitScene: null } : prev;
    }
    const seq = cinemaAfterAction(prev, next);
    setState(next);
    window.clearTimeout(holdTimer.current);
    if (seq) {
      setCinema(seq);
      setChoiceHold(false);
      setTendOpen(false);
      return;
    }
    setChoiceHold(false);
  }

  function act(choice: Choice) {
    if (!state || choice.disabled) return;
    setTendOpen(false);
    commit(state, choice.action);
  }

  function keepNow() {
    if (!state) return;
    if (saveGame(state)) {
      setSaveNote("Kept this walk.");
      return;
    }
    const downloaded = downloadGame(state);
    setSaveNote(downloaded ? "Could not keep it here. A file downloaded." : "Could not keep this walk.");
  }

  function goTitle() {
    if (state) saveGame(state);
    router.push("/");
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
            {deathCauseLabel(state.dead.cause)} · {placeName(state.dead.locationId)} · {seasonLabel(state.dead.season)}
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
  const onPlate = (c: Choice) =>
    c.action.type === "talk" ||
    c.action.type === "makeFire" ||
    c.action.type === "tendFire" ||
    c.action.type === "gatherWood" ||
    c.action.type === "gatherWater" ||
    c.action.type === "travel" ||
    c.id === "camp-fire" ||
    c.id === "camp-wood" ||
    c.id === "camp-lean";
  const routine = [...routineFromChoices, ...routineSpots].filter((c) => !onPlate(c));
  const idle = !isUrgentBeat(state);
  const showHero = idle ? hero : hero.filter((c) => c.action.type !== "travel");
  const atmosphere = timeAtmosphere(state, art.atmosphere);
  const tell = livingTellFromState(state);
  const atCamp = Boolean(state.camp && state.camp.locationId === state.locationId);
  const loc = LOCATION_BY_ID[state.locationId];
  const log = state.skirmish ? state.log.slice(-6) : state.log;
  const recent = log.slice(-2);

  return (
    <div
      className={cn(
        "relative min-h-dvh text-stone-100",
        (choiceHold || state.waitScene) && "hc-hour-play",
      )}
      data-living-tell={tell}
    >
      <div className="pointer-events-none absolute inset-0">
        <CrossfadePlate src={art.location} ken />
        <CrossfadePlate src={atmosphere} className="mix-blend-multiply opacity-45" />
        <div className={`absolute inset-0 transition-colors duration-[1800ms] ${timeGrade(state.hour)}`} />
        <LivingPlate tell={tell} />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/25" />
      </div>
      <CampStage
        state={state}
        choices={choices}
        spots={spots}
        waiting={Boolean(state.waitScene)}
        onAct={act}
      />
      {state.waitScene && (
        <WaitPlay
          scene={state.waitScene}
          onDone={() => {
            setState((s) => {
              if (!s?.waitScene) return s;
              let next: GameState = s;
              try {
                next = applyAction(s, { type: "finishWait" }) ?? { ...s, waitScene: null };
              } catch {
                next = { ...s, waitScene: null };
              }
              const seq = cinemaAfterAction(s, next);
              if (seq) window.setTimeout(() => setCinema(seq), 0);
              return next;
            });
          }}
        />
      )}

      <div className="relative z-10 flex min-h-dvh flex-col pointer-events-none">
        <header className="pointer-events-auto border-b border-white/10 bg-black/55 px-3 py-2 pr-24 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="truncate font-heading text-lg text-amber-50">{loc?.name ?? state.locationId}</h2>
              <p className="truncate text-[11px] text-stone-300">
                Day {state.daysSurvived} · {hourLabel(state.hour)} · {seasonLabel(state.season)} · {weatherLabel(state.weather)}
                {state.campfire ? " · fire" : ""}
              </p>
            </div>
            <div className="flex min-w-0 flex-wrap gap-x-3 gap-y-1">
              {meterList(state).map(([label, value]) => (
                <div key={label} className="w-[4.6rem] space-y-0.5">
                  <div className="flex justify-between text-[10px] tracking-wide text-stone-300 uppercase">
                    <span>{label}</span>
                    <span className={value < 25 || (label === METER_LABELS.health && value < 40) ? "text-red-300" : ""}>
                      {Math.round(value)}
                    </span>
                  </div>
                  <Progress value={value} className="h-1 bg-white/10" />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Button size="xs" variant="secondary" onClick={() => setYouOpen(true)}>
                You
              </Button>
              <Button size="xs" variant="secondary" onClick={() => setJournalOpen(true)}>
                Journal
              </Button>
              <Button size="xs" onClick={keepNow}>
                Keep
              </Button>
              <Button size="xs" variant="ghost" onClick={goTitle}>
                Title
              </Button>
            </div>
          </div>
          <p className="mx-auto mt-1 max-w-6xl text-[11px] text-stone-400">
            Rations {state.inventory.rations} · Water {state.inventory.water} · Wood {state.inventory.firewood} · Pelts{" "}
            {state.inventory.pelts} · Powder {state.inventory.powder}
            {state.inventory.coat ? " · coat" : ""}
          </p>
          {saveNote && (
            <p className="mx-auto mt-1 max-w-6xl text-[11px] text-amber-100/85">{saveNote}</p>
          )}
        </header>

        <div className="min-h-[8rem] flex-1" />

        <div className="pointer-events-auto mx-auto w-full max-w-3xl space-y-3 px-3 pb-4">
          {state.skirmish && (
            <div className="rounded-md border border-red-300/30 bg-red-950/55 p-2 text-xs text-red-100">
              <p className="font-medium">Skirmish</p>
              {state.skirmish.foes.map((f) => (
                <p key={f.id}>
                  {f.name} · {f.range} · {f.hp}/{f.maxHp}
                </p>
              ))}
            </div>
          )}
          <button
            type="button"
            className="w-full rounded-lg bg-black/45 px-3 py-2 text-left text-[15px] leading-relaxed backdrop-blur-sm"
            onClick={() => setJournalOpen(true)}
          >
            {recent.map((entry) => (
              <p key={entry.id} className="line-clamp-2 text-stone-100">
                {entry.text}
              </p>
            ))}
          </button>
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
            <div
              className={cn(
                "hc-choices space-y-3 rounded-lg bg-black/40 px-3 py-3 backdrop-blur-sm",
                choiceHold && "is-held",
                livingTellFrostsChrome(tell) && "hc-live-frost",
              )}
            >
              {idle && scene && (
                <p className="max-w-xl text-sm leading-relaxed text-amber-50/90">{scene.narration}</p>
              )}
              {idle && scene?.attemptHint && (
                <form
                  className="flex max-w-xl gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const text = intent.trim();
                    if (!text || !state) return;
                    setIntent("");
                    commit(state, { type: "attempt", text });
                  }}
                >
                  <Input
                    value={intent}
                    onChange={(e) => setIntent(e.target.value)}
                    placeholder="I try…"
                    maxLength={80}
                    className="border-white/20 bg-black/40 text-stone-100"
                  />
                  <Button type="submit" variant="secondary" disabled={!intent.trim()}>
                    Try
                  </Button>
                </form>
              )}
              {(idle || state.waitScene) &&
                showHero
                  .filter((c) => c.action.type === "wait" || c.action.type === "finishWait")
                  .map((c) => (
                    <Button
                      key={c.id}
                      disabled={c.disabled}
                      title={c.hint}
                      onClick={() => act(c)}
                      className="h-12 min-w-[16rem] px-6 text-base tracking-[0.14em] sm:h-14 sm:min-w-[20rem] sm:text-lg"
                    >
                      {c.label}
                    </Button>
                  ))}
              <div className="flex flex-wrap gap-2">
                {(idle
                  ? showHero.filter(
                      (c) =>
                        c.action.type !== "wait" &&
                        c.action.type !== "talk" &&
                        c.action.type !== "travel" &&
                        c.action.type !== "gatherWater" &&
                        c.action.type !== "gatherWood" &&
                        c.action.type !== "makeFire" &&
                        c.action.type !== "tendFire",
                    )
                  : showHero.filter((c) => c.action.type !== "finishWait")
                ).map((c) => (
                  <Button
                    key={c.id}
                    size={idle ? "default" : "lg"}
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
                    {atCamp ? "Your camp" : "Tend camp"}
                  </SheetTrigger>
                  <SheetContent
                    side="bottom"
                    className="border-white/15 bg-black/92 text-stone-100 sm:max-w-none"
                  >
                    <SheetHeader>
                      <SheetTitle className="text-amber-50">{atCamp ? "Your camp" : "Tend camp"}</SheetTitle>
                      <SheetDescription className="text-stone-400">
                        {atCamp ? "The work of this ground." : "Small work. The mountain keeps the hours."}
                      </SheetDescription>
                    </SheetHeader>
                    <div className={cn("flex flex-wrap gap-2 px-4 pb-6", atCamp && "sm:grid sm:grid-cols-2 sm:gap-2")}>
                      {routine.map((c) => (
                        <Button
                          key={c.id}
                          size="sm"
                          variant="secondary"
                          disabled={c.disabled}
                          title={c.hint}
                          className={atCamp && c.id === "camp-strike" ? "sm:col-span-2" : undefined}
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
                <div className="space-y-2">
                  <p className="text-[11px] tracking-[0.25em] text-amber-100/60 uppercase">Trails</p>
                  <div className="flex flex-wrap gap-2">
                    {travel.map((c) => (
                      <Button key={c.id} size="sm" variant="outline" title={c.hint} onClick={() => act(c)}>
                        {c.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Sheet open={youOpen} onOpenChange={setYouOpen}>
        <SheetContent side="right" className="border-white/15 bg-black/94 text-stone-100">
          <SheetHeader>
            <SheetTitle className="text-amber-50">{state.name}</SheetTitle>
            <SheetDescription className="text-stone-400">Pack, people, and country you have named.</SheetDescription>
          </SheetHeader>
          <YouBody state={state} />
        </SheetContent>
      </Sheet>
      <Sheet open={journalOpen} onOpenChange={setJournalOpen}>
        <SheetContent side="bottom" className="border-white/15 bg-black/94 text-stone-100 sm:max-w-none">
          <SheetHeader>
            <SheetTitle className="text-amber-50">Journal</SheetTitle>
            <SheetDescription className="text-stone-400">What this walk has already spent.</SheetDescription>
          </SheetHeader>
          <JournalBody log={log} />
        </SheetContent>
      </Sheet>
      {cinema && <Cinema sequence={cinema} tell={tell} onDone={() => setCinema(null)} />}
    </div>
  );
}
