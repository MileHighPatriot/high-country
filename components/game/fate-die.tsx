"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import type { Choice, PendingRoll, Trait } from "@/lib/game/types";

const FACES: { n: number; ax: number; ay: number }[] = [
  { n: 1, ax: -69.095, ay: 0 },
  { n: 2, ax: -69.095, ay: 180 },
  { n: 3, ax: -35.264, ay: 45 },
  { n: 4, ax: -35.264, ay: -45 },
  { n: 5, ax: -35.264, ay: 135 },
  { n: 6, ax: -35.264, ay: -135 },
  { n: 7, ax: -20.905, ay: 90 },
  { n: 8, ax: -20.905, ay: -90 },
  { n: 9, ax: 0, ay: 20.905 },
  { n: 10, ax: 0, ay: -20.905 },
  { n: 11, ax: 0, ay: 159.095 },
  { n: 12, ax: 0, ay: -159.095 },
  { n: 13, ax: 20.905, ay: 90 },
  { n: 14, ax: 20.905, ay: -90 },
  { n: 15, ax: 35.264, ay: 45 },
  { n: 16, ax: 35.264, ay: -45 },
  { n: 17, ax: 35.264, ay: 135 },
  { n: 18, ax: 35.264, ay: -135 },
  { n: 19, ax: 69.095, ay: 0 },
  { n: 20, ax: 69.095, ay: 180 },
];

const TRAIT: Record<Trait, string> = {
  eye: "Eye",
  grit: "Grit",
  savvy: "Savvy",
  hands: "Hands",
};

function needOnDie(p: PendingRoll) {
  return Math.max(1, Math.min(20, p.dc - p.modifier + p.penalty));
}

export function FateDie({
  pending,
  retreats,
  scene,
  onCast,
  onSettled,
  onRetreat,
}: {
  pending: PendingRoll;
  retreats: Choice[];
  scene?: string;
  onCast: () => void;
  onSettled: () => void;
  onRetreat: (choice: Choice) => void;
}) {
  const [phase, setPhase] = useState<"idle" | "rolling" | "landed">(pending.d20 != null ? "landed" : "idle");
  const settled = useRef(false);
  const cast = useRef(pending.d20 != null);
  const onSettledRef = useRef(onSettled);
  const onCastRef = useRef(onCast);
  onSettledRef.current = onSettled;
  onCastRef.current = onCast;

  const face = FACES.find((f) => f.n === pending.d20) ?? FACES[0]!;
  const landX = -face.ax;
  const landY = -face.ay;
  const need = needOnDie(pending);

  useEffect(() => {
    if (pending.d20 != null && phase === "idle" && cast.current) {
      setPhase("rolling");
    }
  }, [pending.d20, phase]);

  useEffect(() => {
    if (phase !== "rolling" || pending.d20 == null) return;
    const t = window.setTimeout(() => setPhase("landed"), 2200);
    return () => window.clearTimeout(t);
  }, [phase, pending.d20]);

  useEffect(() => {
    if (phase !== "landed" || pending.d20 == null || settled.current) return;
    const wait = pending.d20 != null && !cast.current ? 900 : 1600;
    const t = window.setTimeout(() => {
      if (settled.current) return;
      settled.current = true;
      onSettledRef.current();
    }, wait);
    return () => window.clearTimeout(t);
  }, [phase, pending.d20]);

  function roll() {
    if (phase !== "idle") return;
    cast.current = true;
    if (pending.d20 == null) onCastRef.current();
    else setPhase("rolling");
  }

  const success = pending.success;
  const total = pending.total ?? (pending.d20 ?? 0) + pending.modifier - pending.penalty;

  return (
    <div className="fate-die-overlay" role="dialog" aria-label="The die">
      <div className="fate-die-panel">
        <p className="fate-die-kicker">The mountain waits</p>
        {scene && <p className="fate-die-scene">{scene}</p>}
        <h2 className="fate-die-title">{pending.label}</h2>
        <p className="fate-die-math">
          {TRAIT[pending.trait]} {pending.modifier >= 0 ? "+" : ""}
          {pending.modifier}
          {pending.penalty ? ` − weariness ${pending.penalty}` : ""} vs {pending.dc}
          <span className="fate-die-need"> · need {need} or better</span>
        </p>

        <div className="fate-die-stage">
          <div className={`fate-die-shadow ${phase === "rolling" ? "is-rolling" : ""}`} />
          <button
            type="button"
            className={`fate-die-hit ${phase}`}
            onClick={roll}
            disabled={phase !== "idle"}
            aria-label={phase === "idle" ? "Click the die to roll" : "The die is rolling"}
          >
            <div
              className={`fate-die ${phase}`}
              style={
                {
                  "--land-x": `${landX}deg`,
                  "--land-y": `${landY}deg`,
                } as CSSProperties
              }
            >
              {FACES.map((f) => (
                <div
                  key={f.n}
                  className="fate-die-face"
                  style={{ transform: `rotateY(${f.ay}deg) rotateX(${f.ax}deg) translateZ(var(--r))` }}
                >
                  <span>{f.n}</span>
                </div>
              ))}
            </div>
          </button>
        </div>

        {phase === "idle" && <p className="fate-die-prompt">Click the die</p>}
        {phase === "rolling" && <p className="fate-die-prompt is-mute">Rolling…</p>}
        {phase === "landed" && pending.d20 != null && (
          <div className={`fate-die-result ${success ? "is-success" : "is-fail"}`}>
            <p className="fate-die-number">{pending.d20}</p>
            <p className="fate-die-verdict">
              {pending.d20} + {pending.trait} {pending.modifier}
              {pending.penalty ? ` − ${pending.penalty}` : ""} = {total} vs {pending.dc}
              {success ? " — you hold." : " — it takes you."}
            </p>
          </div>
        )}

        {phase === "idle" && retreats.length > 0 && (
          <div className="fate-die-retreats">
            {retreats.map((c) => (
              <Button key={c.id} size="sm" variant="ghost" disabled={c.disabled} title={c.hint} onClick={() => onRetreat(c)}>
                {c.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
