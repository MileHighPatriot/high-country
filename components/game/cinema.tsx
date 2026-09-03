"use client";

import { useEffect, useRef, useState } from "react";
import type { CinemaKen, CinemaSequence } from "@/lib/game/cinema";

function kenClass(ken?: CinemaKen) {
  if (ken === "push") return "hc-cinema-layer ken-push";
  if (ken === "pan") return "hc-cinema-layer ken-pan";
  if (ken === "breathe") return "hc-cinema-layer ken-breathe";
  return "hc-cinema-layer";
}

export function Cinema({
  sequence,
  onDone,
}: {
  sequence: CinemaSequence;
  onDone: () => void;
}) {
  const [beat, setBeat] = useState(0);
  const [showCard, setShowCard] = useState(false);
  const skippable = useRef(false);
  const done = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  function finish() {
    if (done.current) return;
    done.current = true;
    onDoneRef.current();
  }

  useEffect(() => {
    done.current = false;
    setBeat(0);
    setShowCard(false);
    skippable.current = false;
    const music = sequence.music ?? "swell";
    window.dispatchEvent(new CustomEvent("hc-cinema-music", { detail: { mode: music } }));
    const arm = window.setTimeout(() => {
      skippable.current = true;
    }, 350);
    const card = window.setTimeout(() => setShowCard(true), 900);
    const cap = window.setTimeout(finish, sequence.duration + 400);
    return () => {
      window.clearTimeout(arm);
      window.clearTimeout(card);
      window.clearTimeout(cap);
      window.dispatchEvent(new CustomEvent("hc-cinema-music", { detail: { mode: "restore" } }));
    };
    // sequence identity is enough; finish is stable via ref
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sequence]);

  useEffect(() => {
    const current = sequence.beats[beat];
    if (!current) {
      finish();
      return;
    }
    const t = window.setTimeout(() => {
      if (beat + 1 >= sequence.beats.length) finish();
      else setBeat((b) => b + 1);
    }, current.duration);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [beat, sequence]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        if (skippable.current) finish();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sequence]);

  return (
    <div
      className="hc-cinema"
      role="dialog"
      aria-label="Cinematic"
      onClick={() => {
        if (skippable.current) finish();
      }}
    >
      <div className="hc-cinema-stage">
        {sequence.beats.map((b, i) => {
          if (i > beat || i < beat - 1) return null;
          const on = i === beat;
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${i}-${b.src}`}
              src={b.src}
              alt=""
              className={`${kenClass(b.ken)} ${on ? "is-on" : "is-under"}`}
            />
          );
        })}
        <div className="hc-cinema-veil" />
      </div>
      {showCard && sequence.card && (
        <div className="hc-cinema-card">
          <p>{sequence.card}</p>
        </div>
      )}
      <button
        type="button"
        className="hc-cinema-skip"
        onClick={(e) => {
          e.stopPropagation();
          if (skippable.current) finish();
        }}
      >
        Skip
      </button>
    </div>
  );
}
