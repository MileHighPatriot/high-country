"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  campaignLine,
  clearSave,
  exportFilename,
  loadBest,
  loadCampaignMeta,
  loadGame,
  loadLastDeath,
  parseGame,
  saveGame,
  serializeGame,
  type CampaignMeta,
} from "@/lib/game/save";
import type { DeathRecord, Kit } from "@/lib/game/types";
import { deathCauseLabel, placeName, TRAIT_LINE } from "@/lib/game/readout";
import { withBase } from "@/lib/paths";

const KITS: { id: Kit; title: string; copy: string }[] = [
  {
    id: "rations",
    title: "Extra rations",
    copy: "Four more days of flour and pemmican. Grit +1. Belly waits.",
  },
  {
    id: "powder",
    title: "Extra powder",
    copy: "Four charges and a cleaner pan. Eye +1. The rifle becomes an argument.",
  },
  {
    id: "coat",
    title: "Wool coat",
    copy: "A coat that has already outlived a man. Grit +1. The wind notices you less.",
  },
  {
    id: "snowshoes",
    title: "Snowshoes",
    copy: "Ash frames and babiche. Savvy +1. Snow takes an hour less of you.",
  },
  {
    id: "pot",
    title: "Tin pot",
    copy: "Black tin that has boiled other names. Hands +1. Steam becomes a plan.",
  },
  {
    id: "fatwood",
    title: "Fatwood",
    copy: "A stick of pitch, mean and holy. Hands +1. The blizzard does not get the first spark.",
  },
];

export function TitleScreen() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("Ward");
  const [kit, setKit] = useState<Kit>("coat");
  const [meta, setMeta] = useState<CampaignMeta | null>(null);
  const [best, setBest] = useState(0);
  const [last, setLast] = useState<DeathRecord | null>(null);
  const [confirmNew, setConfirmNew] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  function refresh() {
    setMeta(loadCampaignMeta());
    setBest(loadBest());
    setLast(loadLastDeath());
  }

  useEffect(() => {
    refresh();
  }, []);

  function continueRun() {
    router.push("/play");
  }

  function startFresh() {
    clearSave();
    const params = new URLSearchParams({ name: name.trim() || "Trapper", kit });
    router.push(`/play?${params.toString()}`);
  }

  function onNewWalk() {
    if (meta && !confirmNew) {
      setConfirmNew(true);
      return;
    }
    startFresh();
  }

  function downloadRun() {
    const game = loadGame();
    if (!game) return;
    const blob = new Blob([serializeGame(game)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportFilename(game);
    a.click();
    URL.revokeObjectURL(url);
  }

  function onPickFile(file: File | undefined) {
    if (!file) return;
    setLoadError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const raw = typeof reader.result === "string" ? reader.result : "";
      const game = parseGame(raw);
      if (!game) {
        setLoadError("That file is not a live High Country run.");
        return;
      }
      saveGame(game);
      setConfirmNew(false);
      refresh();
    };
    reader.readAsText(file);
  }

  const hasSave = Boolean(meta);

  return (
    <div className="relative min-h-dvh overflow-hidden text-stone-100">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${withBase("/art/title.jpg")})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/30" />
      <div className="relative z-10 mx-auto flex min-h-dvh max-w-3xl flex-col justify-end gap-6 px-5 py-10 sm:justify-center">
        <p className="text-xs tracking-[0.35em] text-amber-200/80 uppercase">Colorado Front Range · 1835</p>
        <h1 className="font-heading text-4xl leading-tight sm:text-6xl">High Country</h1>
        <p className="max-w-xl text-base leading-relaxed text-stone-200/90 sm:text-lg">
          You wintered too high. Spring is late. There is no town coming and no last day.
          Eat. Drink. Keep a fire. Meet who the mountain still allows. Live until you do not.
        </p>
        <p className="text-xs tracking-wide text-stone-400">{TRAIT_LINE}</p>
        {best > 0 && (
          <p className="text-sm text-amber-100/80">Longest run: {best} days</p>
        )}
        {last && (
          <p className="text-sm text-stone-300/80">
            Last death: day {last.daysSurvived}, {deathCauseLabel(last.cause)}
            {last.locationId ? ` at ${placeName(last.locationId)}` : ""}. {last.detail}
          </p>
        )}

        {hasSave && meta && (
          <div className="space-y-3 rounded-xl border border-amber-200/25 bg-black/50 p-4 backdrop-blur-sm">
            <p className="text-xs tracking-[0.25em] text-amber-100/70 uppercase">This walk is still going</p>
            <p className="font-heading text-2xl text-amber-50">{campaignLine(meta)}</p>
            <p className="text-sm text-stone-300">
              {meta.season} · kit {meta.kit}. It saves itself. Close the page. Come back.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button size="lg" className="flex-1" onClick={continueRun}>
                Continue
              </Button>
              <Button size="lg" variant="secondary" className="flex-1" onClick={downloadRun}>
                Download save
              </Button>
            </div>
            <p className="text-[11px] leading-snug text-stone-500">
              Local play and the GitHub page keep separate saves. Download a copy if you move.
            </p>
          </div>
        )}

        <div className="space-y-3 rounded-xl border border-white/15 bg-black/45 p-4 backdrop-blur-sm">
          <p className="text-xs tracking-[0.25em] text-stone-300 uppercase">
            {hasSave ? "Or begin a new walk" : "Begin a walk"}
          </p>
          <label className="block text-xs tracking-widest text-stone-300 uppercase">
            Your name
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 border-white/20 bg-black/40 text-stone-100"
              maxLength={24}
            />
          </label>
          <p className="text-xs tracking-widest text-stone-300 uppercase">Starting kit</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {KITS.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => setKit(k.id)}
                className={`rounded-lg border p-3 text-left text-sm transition ${
                  kit === k.id
                    ? "border-amber-200/70 bg-amber-200/15"
                    : "border-white/15 bg-black/30 hover:border-white/30"
                }`}
              >
                <span className="block font-medium text-amber-50">{k.title}</span>
                <span className="mt-1 block text-xs leading-snug text-stone-300">{k.copy}</span>
              </button>
            ))}
          </div>
          {confirmNew && meta && (
            <p className="text-sm text-red-200/90">
              This ends {campaignLine(meta)}. The mountain will not keep that fire.
            </p>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              size="lg"
              className="flex-1"
              variant={hasSave ? "secondary" : "default"}
              onClick={onNewWalk}
            >
              {confirmNew && meta
                ? `End ${meta.name}’s day ${meta.daysSurvived}`
                : "Walk into the weather"}
            </Button>
            <Button size="lg" variant="secondary" className="flex-1" onClick={() => fileRef.current?.click()}>
              Load save
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              onPickFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          {loadError && <p className="text-sm text-red-200/90">{loadError}</p>}
        </div>
      </div>
    </div>
  );
}
