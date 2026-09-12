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
import { characterOf, locationOf } from "@/lib/game/atlas";
import { CHARACTER_BY_ID } from "@/lib/game/content/characters";
import { interpretAct } from "@/lib/game/gm";
import { loadGmKey, overlayPolish, polishGmAct, saveGmKey } from "@/lib/game/gm-model";
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
import {
  deathCauseLabel,
  knownMap,
  METER_LABELS,
  placeName,
  skillStatusLine,
} from "@/lib/game/readout";
import type { Choice, GameAction, GameState, Kit, LogEntry } from "@/lib/game/types";
import { timeBand } from "@/lib/game/types";
import { cn } from "@/lib/utils";
import { livingTellFromState, livingTellFrostsChrome } from "@/lib/game/living-plate";
import { dwellingLine } from "@/lib/game/homestead";
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
  return Boolean(state.dead || state.skirmish || state.pendingRoll || state.activeEncounterId);
}

function JournalList({ log }: { log: LogEntry[] }) {
  return (
    <>
      {log.map((entry, i) => {
        const stamp = journalStamp(entry, log[i - 1]);
        return (
          <div key={entry.id}>
            {stamp && (
              <p className="mb-1 text-[10px] tracking-[0.2em] text-amber-100/45 uppercase">{stamp}</p>
            )}
            <p className="text-[15px] leading-relaxed sm:text-base">{entry.text}</p>
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
    </>
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
  const loc = locationOf(state, state.locationId);
  const person = state.presentCharacterId ? characterOf(state, state.presentCharacterId) : null;
  const [gmKey, setGmKey] = useState(loadGmKey);
  const meters = [
    [METER_LABELS.hunger, state.meters.hunger],
    [METER_LABELS.thirst, state.meters.thirst],
    [METER_LABELS.warmth, state.meters.warmth],
    [METER_LABELS.energy, state.meters.energy],
    [METER_LABELS.health, state.meters.health],
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
          <Meter key={label} label={label} value={value} warn={label === METER_LABELS.health && value < 40} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-stone-300">
        <span>Rations {state.inventory.rations}</span>
        <span>Water {state.inventory.water}</span>
        <span>Wood {state.inventory.firewood}</span>
        <span>Pelts {state.inventory.pelts}</span>
        <span>Powder {state.inventory.powder}</span>
        <span>Logs {state.inventory.logs ?? 0}</span>
        <span>Stone {state.inventory.stone ?? 0}</span>
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
      {skillStatusLine(state) && (
        <p className="text-[11px] leading-snug text-amber-100/70">{skillStatusLine(state)}</p>
      )}
      {state.companionId && characterOf(state, state.companionId) && (
        <p className="text-xs text-amber-100/90">Walking with {characterOf(state, state.companionId)!.name}</p>
      )}
      {person && !state.companionId && peopleAt(state).length === 0 && (
        <p className="text-xs text-amber-100/80">Here: {person.name}</p>
      )}
      {peopleAt(state).length > 0 && (
        <ul className="space-y-0.5 text-[11px] text-stone-400">
          {peopleAt(state).map((p) => {
            const n = characterOf(state, p.id)?.name ?? p.id;
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
          {dwellingLine(state.camp)} at {locationOf(state, state.camp.locationId)?.name ?? state.camp.locationId}
          {state.camp.locationId === state.locationId ? " · here" : ""}
          {state.camp.locked ? " · locked" : ""}
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
      {(state.storyFacts ?? []).length > 0 && (
        <p className="text-[11px] leading-snug text-amber-100/70">
          {(state.storyFacts ?? [])
            .filter((f) => f.status !== "gone")
            .slice(0, 4)
            .map((f) => f.name)
            .join(" · ")}
        </p>
      )}
      <label className="block space-y-1 border-t border-white/10 pt-2">
        <span className="text-[11px] tracking-[0.25em] text-amber-100/60 uppercase">Optional mountain key</span>
        <Input
          type="password"
          value={gmKey}
          onChange={(e) => {
            setGmKey(e.target.value);
            saveGmKey(e.target.value);
          }}
          placeholder="SpaceXAI key — off is fine"
          className="h-8 border-white/20 bg-black/40 text-xs text-stone-100"
        />
      </label>
      <details className="border-t border-white/10 pt-2">
        <summary className="cursor-pointer text-[11px] tracking-[0.25em] text-amber-100/60 uppercase">
          Country
        </summary>
        <div className="pt-2">
          <CountryMap state={state} />
        </div>
      </details>
    </aside>
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
  const person = personId ? characterOf(state, personId) : null;
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
    <div className="pointer-events-none absolute inset-0">
      {showLean && (
        <button
          type="button"
          className="hc-camp-piece pointer-events-auto"
          style={{ left: "3%", bottom: "6%", width: "min(22vw, 12rem)" }}
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
          style={{ left: "30%", bottom: "4%", width: "min(18vw, 10rem)" }}
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
          style={{ left: "50%", bottom: "6%", width: "min(20vw, 11rem)" }}
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
          style={{ left: "6%", bottom: "22%" }}
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
          style={{ right: "8%", left: "auto", bottom: "0" }}
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

  useEffect(() => {
    const steps: Array<"light" | "fire" | "arrival"> = ["light"];
    if (scene.fireLit) steps.push("fire");
    if (scene.arrivalId) steps.push("arrival");
    let i = 0;
    const tick = window.setInterval(() => {
      i += 1;
      if (i >= steps.length) {
        window.clearInterval(tick);
        if (!done.current) {
          done.current = true;
          onDoneRef.current();
        }
        return;
      }
      setPhase(steps[i]!);
    }, 2300);
    return () => window.clearInterval(tick);
  }, [scene]);

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
        className="pointer-events-auto rounded-md bg-black/60 px-4 py-2 text-sm tracking-wide text-amber-100/90 hover:bg-black/75"
        onClick={() => {
          if (done.current) return;
          done.current = true;
          onDoneRef.current();
        }}
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
    <div className="space-y-1.5">
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
  const [journalOpen, setJournalOpen] = useState(false);
  const [packOpen, setPackOpen] = useState(false);
  const [intent, setIntent] = useState("");
  const [listening, setListening] = useState(false);
  const holdTimer = useRef<number>(0);
  const journalEnd = useRef<HTMLDivElement>(null);
  const booted = useRef(false);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    const existing = loadGame();
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
    if (state) saveGame(state);
  }, [state]);

  useEffect(() => {
    return () => window.clearTimeout(holdTimer.current);
  }, []);

  useEffect(() => {
    journalEnd.current?.scrollIntoView({ block: "end" });
  }, [state?.log.length, state?.log.at(-1)?.id]);

  const choices = useMemo(() => (state ? getChoices(state) : []), [state]);
  const scene = useMemo(() => (state ? getScene(state, choices) : null), [state, choices]);
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
    setChoiceHold(false);
    if (action.type === "attempt" && loadGmKey() && !next.pendingRoll && !next.dead) {
      void polishTypedHour(prev, next, action.text);
    }
  }

  async function polishTypedHour(prev: GameState, applied: GameState, text: string) {
    const key = loadGmKey();
    if (!key) return;
    setListening(true);
    try {
      const draft = interpretAct(
        { ...prev, pendingRoll: null, activeEncounterId: null, waitScene: null },
        text,
        true,
      );
      const polished = await polishGmAct(draft, prev, key);
      if (!polished) return;
      const appliedId = applied.log.at(-1)?.id;
      setState((s) => {
        if (!s || s.log.at(-1)?.id !== appliedId) return s;
        return overlayPolish(s, polished);
      });
    } catch {
      /* offline GM already wrote the hour */
    } finally {
      setListening(false);
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
  const log = state.skirmish ? state.log.slice(-6) : state.log;
  const lastBeat = log.at(-1);
  const groundMoves = idle
    ? showHero.filter(
        (c) => c.action.type !== "wait" && c.action.type !== "travel" && c.action.type !== "finishWait",
      )
    : showHero;

  return (
    <div
      className={cn(
        "relative h-dvh overflow-hidden text-stone-100",
        (choiceHold || state.waitScene) && "hc-hour-play",
      )}
      data-living-tell={tell}
    >
      <CrossfadePlate src={art.location} ken />
      <CrossfadePlate src={atmosphere} className="mix-blend-multiply opacity-45" />
      <div className={`absolute inset-0 transition-colors duration-[1800ms] ${timeGrade(state.hour)}`} />
      <LivingPlate tell={tell} />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20" />
      <div className="hc-stage">
        <CampStage
          state={state}
          choices={choices}
          spots={spots}
          waiting={Boolean(state.waitScene)}
          onAct={act}
        />
      </div>
      {state.waitScene && (
        <WaitPlay
          scene={state.waitScene}
          onDone={() => {
            setState((s) => {
              if (!s?.waitScene) return s;
              let next = applyAction(s, { type: "finishWait" });
              if (next.waitScene) next = { ...s, waitScene: null };
              const seq = cinemaAfterAction(s, next);
              if (seq) window.setTimeout(() => setCinema(seq), 0);
              return next;
            });
          }}
        />
      )}

      <div className="hc-hud border-t border-white/10 bg-black/78 backdrop-blur-md">
        <div className="mx-auto grid h-full min-h-0 max-w-6xl gap-3 px-3 py-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] lg:grid-cols-[minmax(0,1fr)_16.5rem]">
          <div className="flex min-h-0 flex-col gap-2">
            <div className="grid grid-cols-5 gap-1 lg:hidden">
              {(
                [
                  [METER_LABELS.hunger, state.meters.hunger],
                  [METER_LABELS.thirst, state.meters.thirst],
                  [METER_LABELS.warmth, state.meters.warmth],
                  [METER_LABELS.energy, state.meters.energy],
                  [METER_LABELS.health, state.meters.health],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <p className="truncate text-[9px] tracking-wide text-stone-400 uppercase">{label}</p>
                  <Progress value={value} className={cn("h-1 bg-white/10", value < 25 && "[&>div]:bg-red-400")} />
                </div>
              ))}
            </div>
            <div className="hc-now rounded-lg bg-black/45 px-3 py-2">
              {lastBeat && (
                <div className="space-y-1">
                  {journalStamp(lastBeat, log.at(-2)) && (
                    <p className="text-[10px] tracking-[0.2em] text-amber-100/45 uppercase">
                      {journalStamp(lastBeat, log.at(-2))}
                    </p>
                  )}
                  <p className="text-[15px] leading-relaxed text-stone-100 sm:text-base">{lastBeat.text}</p>
                  {lastBeat.roll && (
                    <p className={`font-mono text-xs ${lastBeat.roll.success ? "text-amber-200" : "text-red-300"}`}>
                      d20 {lastBeat.roll.d20} + {lastBeat.roll.trait} {lastBeat.roll.modifier}
                      {lastBeat.roll.penalty ? ` − ${lastBeat.roll.penalty}` : ""} = {lastBeat.roll.total} vs DC{" "}
                      {lastBeat.roll.dc}
                      {lastBeat.roll.success ? " · success" : " · fail"}
                    </p>
                  )}
                </div>
              )}
              {idle && scene && scene.narration !== lastBeat?.text && (
                <p className="mt-2 text-sm leading-relaxed text-amber-50/90">{scene.narration}</p>
              )}
            </div>
            {!state.dead && !state.skirmish && (
              <form
                className="hc-try flex shrink-0 gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const text = intent.trim();
                  if (!text || !state || listening) return;
                  setIntent("");
                  commit(state, { type: "attempt", text });
                }}
              >
                <Input
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  placeholder="Type anything. The mountain answers."
                  maxLength={400}
                  autoComplete="off"
                  disabled={listening}
                  className="h-12 border-amber-200/35 bg-black/55 text-base text-stone-100"
                />
                <Button type="submit" className="h-12 px-5" disabled={!intent.trim() || listening}>
                  {listening ? "…" : "Do"}
                </Button>
              </form>
            )}
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
                  "hc-choices min-h-0 space-y-2 overflow-y-auto",
                  choiceHold && "is-held",
                  livingTellFrostsChrome(tell) && "hc-live-frost",
                )}
              >
                {!state.dead && !state.skirmish && (
                  <p className="text-[10px] tracking-[0.2em] text-amber-100/40 uppercase">Suggestions · typing is the hour</p>
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
                        className="h-11 w-full max-w-md px-4 text-base tracking-[0.12em] sm:h-12"
                      >
                        {c.label}
                      </Button>
                    ))}
                <div className="flex flex-wrap gap-2">
                  {groundMoves.map((c) => (
                    <Button
                      key={c.id}
                      size={idle ? "default" : "lg"}
                      variant={c.action.type === "skirmish" && c.id === "flee" ? "secondary" : "default"}
                      disabled={c.disabled}
                      title={c.hint}
                      onClick={() => act(c)}
                      className="hc-choice-btn"
                    >
                      {c.label}
                    </Button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Sheet open={journalOpen} onOpenChange={setJournalOpen}>
                    <SheetTrigger className="inline-flex h-8 items-center rounded-lg border border-white/20 bg-black/40 px-3 text-[0.8rem] tracking-[0.18em] text-amber-100/75 uppercase hover:border-amber-200/40 hover:text-amber-50">
                      Journal
                    </SheetTrigger>
                    <SheetContent side="bottom" className="max-h-[70dvh] border-white/15 bg-black/92 text-stone-100 sm:max-w-none">
                      <SheetHeader>
                        <SheetTitle className="text-amber-50">Journal</SheetTitle>
                        <SheetDescription className="text-stone-400">What the mountain already wrote.</SheetDescription>
                      </SheetHeader>
                      <div className="max-h-[50dvh] space-y-3 overflow-y-auto px-4 pb-6">
                        <JournalList log={state.log} />
                        <div ref={journalEnd} />
                      </div>
                    </SheetContent>
                  </Sheet>
                  {idle && routine.length > 0 && (
                    <Sheet open={tendOpen} onOpenChange={setTendOpen}>
                      <SheetTrigger className="inline-flex h-8 items-center rounded-lg border border-white/20 bg-black/40 px-3 text-[0.8rem] tracking-[0.18em] text-amber-100/75 uppercase hover:border-amber-200/40 hover:text-amber-50">
                        {atCamp ? "Your camp" : "Tend camp"}
                      </SheetTrigger>
                      <SheetContent
                        side="bottom"
                        className="max-h-[70dvh] border-white/15 bg-black/92 text-stone-100 sm:max-w-none"
                      >
                        <SheetHeader>
                          <SheetTitle className="text-amber-50">{atCamp ? "Your camp" : "Tend camp"}</SheetTitle>
                          <SheetDescription className="text-stone-400">
                            {atCamp ? "The work of this ground." : "Small work. The mountain keeps the hours."}
                          </SheetDescription>
                        </SheetHeader>
                        <div className={cn("flex flex-wrap gap-2 overflow-y-auto px-4 pb-6", atCamp && "sm:grid sm:grid-cols-2 sm:gap-2")}>
                          {routine.map((c) => (
                            <Button
                              key={c.id}
                              size="sm"
                              variant="secondary"
                              disabled={c.disabled}
                              title={c.hint}
                              className={cn("hc-choice-btn", atCamp && c.id === "camp-strike" ? "sm:col-span-2" : undefined)}
                              onClick={() => act(c)}
                            >
                              {c.label}
                            </Button>
                          ))}
                        </div>
                      </SheetContent>
                    </Sheet>
                  )}
                  <Sheet open={packOpen} onOpenChange={setPackOpen}>
                    <SheetTrigger className="inline-flex h-8 items-center rounded-lg border border-white/20 bg-black/40 px-3 text-[0.8rem] tracking-[0.18em] text-amber-100/75 uppercase hover:border-amber-200/40 hover:text-amber-50 lg:hidden">
                      Pack
                    </SheetTrigger>
                    <SheetContent side="bottom" className="max-h-[70dvh] overflow-y-auto border-white/15 bg-black/92 text-stone-100 sm:max-w-none">
                      <SheetHeader>
                        <SheetTitle className="text-amber-50">Pack</SheetTitle>
                        <SheetDescription className="text-stone-400">What you carry and who is here.</SheetDescription>
                      </SheetHeader>
                      <div className="px-4 pb-6">
                        <Status state={state} />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
                {travel.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] tracking-[0.25em] text-amber-100/60 uppercase">Trails</p>
                    <div className="flex flex-wrap gap-2">
                      {travel.map((c) => (
                        <Button
                          key={c.id}
                          size="sm"
                          variant="outline"
                          title={c.hint}
                          className="hc-choice-btn"
                          onClick={() => act(c)}
                        >
                          {c.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="hidden min-h-0 overflow-y-auto rounded-xl border border-white/15 bg-black/45 p-3 lg:block">
            <Status state={state} />
          </div>
        </div>
      </div>
      {cinema && <Cinema sequence={cinema} tell={tell} onDone={() => setCinema(null)} />}
    </div>
  );
}
