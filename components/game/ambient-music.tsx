"use client";

import { useEffect, useRef, useState } from "react";
import { withBase } from "@/lib/paths";

const MUTE_KEY = "hc-music-muted";

export function AmbientMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(false);

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
    el.volume = 0.34;
    const tryPlay = () => {
      void el.play().catch(() => {});
    };
    tryPlay();
    window.addEventListener("pointerdown", tryPlay);
    window.addEventListener("keydown", tryPlay);
    return () => {
      window.removeEventListener("pointerdown", tryPlay);
      window.removeEventListener("keydown", tryPlay);
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
