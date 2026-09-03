"use client";

import { useEffect, useRef, useState } from "react";
import { withBase } from "@/lib/paths";

const MUTE_KEY = "hc-music-muted";
const BASE_VOLUME = 0.34;

export function AmbientMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(false);
  const targetRef = useRef(BASE_VOLUME);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (localStorage.getItem(MUTE_KEY) === "1") setMuted(true);
  }, []);

  useEffect(() => {
    const el = audioRef.current;
    if (el) el.muted = muted;
  }, [muted]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = BASE_VOLUME;
    const tryPlay = () => {
      void el.play().catch(() => {});
    };
    tryPlay();
    window.addEventListener("pointerdown", tryPlay);
    window.addEventListener("keydown", tryPlay);

    const rampTo = (target: number) => {
      targetRef.current = target;
      window.cancelAnimationFrame(rafRef.current);
      const step = () => {
        const node = audioRef.current;
        if (!node) return;
        const next = node.volume + (targetRef.current - node.volume) * 0.08;
        if (Math.abs(next - targetRef.current) < 0.008) {
          node.volume = targetRef.current;
          return;
        }
        node.volume = next;
        rafRef.current = window.requestAnimationFrame(step);
      };
      rafRef.current = window.requestAnimationFrame(step);
    };

    const onCinema = (event: Event) => {
      const mode = (event as CustomEvent<{ mode?: string }>).detail?.mode;
      if (mode === "swell") rampTo(0.52);
      else if (mode === "dip") rampTo(0.1);
      else rampTo(BASE_VOLUME);
    };
    window.addEventListener("hc-cinema-music", onCinema);

    return () => {
      window.removeEventListener("pointerdown", tryPlay);
      window.removeEventListener("keydown", tryPlay);
      window.removeEventListener("hc-cinema-music", onCinema);
      window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function toggle() {
    const next = !muted;
    setMuted(next);
    localStorage.setItem(MUTE_KEY, next ? "1" : "0");
    const el = audioRef.current;
    if (!el) return;
    el.muted = next;
    if (!next) void el.play().catch(() => {});
  }

  return (
    <>
      <audio ref={audioRef} loop preload="auto" playsInline>
        <source src={withBase("/music/high-country.ogg")} type="audio/ogg" />
        <source src={withBase("/music/high-country.mp3")} type="audio/mpeg" />
      </audio>
      <button
        type="button"
        onClick={toggle}
        className="fixed bottom-3 left-3 z-50 rounded-full border border-white/20 bg-black/55 px-3 py-1.5 text-[11px] tracking-widest text-amber-100/80 uppercase backdrop-blur-sm hover:border-amber-200/50 hover:text-amber-50"
      >
        {muted ? "Music off" : "Music"}
      </button>
    </>
  );
}
