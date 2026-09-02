"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clearSave, loadBest, loadGame, loadLastDeath } from "@/lib/game/save";
import type { DeathRecord, Kit } from "@/lib/game/types";
import { withBase } from "@/lib/paths";

const KITS: { id: Kit; title: string; copy: string }[] = [
  {
    id: "rations",
    title: "Extra rations",
    copy: "Four more days of flour and pemmican. Grit +1. Hunger waits.",
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
];

export function TitleScreen() {
  const router = useRouter();
  const [name, setName] = useState("Ward");
  const [kit, setKit] = useState<Kit>("coat");
  const [hasSave, setHasSave] = useState(false);
  const [best, setBest] = useState(0);
  const [last, setLast] = useState<DeathRecord | null>(null);

  useEffect(() => {
    setHasSave(!!loadGame());
    setBest(loadBest());
    setLast(loadLastDeath());
  }, []);

  function start() {
    clearSave();
    const params = new URLSearchParams({ name: name.trim() || "Trapper", kit });
    router.push(`/play?${params.toString()}`);
  }

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
        {best > 0 && (
          <p className="text-sm text-amber-100/80">Longest run: {best} days</p>
        )}
        {last && (
          <p className="text-sm text-stone-300/80">
            Last death: day {last.daysSurvived}, {last.cause}. {last.detail}
          </p>
        )}

        <div className="space-y-3 rounded-xl border border-white/15 bg-black/45 p-4 backdrop-blur-sm">
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
          <div className="grid gap-2 sm:grid-cols-3">
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
          <div className="flex flex-col gap-2 sm:flex-row">
            {hasSave && (
              <Button
                size="lg"
                variant="secondary"
                className="flex-1"
                onClick={() => router.push("/play")}
              >
                Continue
              </Button>
            )}
            <Button size="lg" className="flex-1" onClick={start}>
              Walk into the weather
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
