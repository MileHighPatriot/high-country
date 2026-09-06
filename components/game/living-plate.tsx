"use client";

import { useEffect, useState } from "react";
import type { LivingTell } from "@/lib/game/living-plate";
import { cn } from "@/lib/utils";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return reduced;
}

export function LivingPlate({
  tell,
  className,
}: {
  tell: LivingTell;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return null;

  return (
    <div className={cn("hc-live", className)} data-tell={tell} aria-hidden>
      {tell === "snow" && (
        <>
          <div className="hc-live-snow hc-live-snow-a" />
          <div className="hc-live-snow hc-live-snow-b" />
          <div className="hc-live-fog" />
        </>
      )}
      {tell === "ember" && (
        <>
          <div className="hc-live-firelight" />
          <div className="hc-live-embers" />
        </>
      )}
      {tell === "wind" && <div className="hc-live-sway" />}
      {tell === "water" && (
        <>
          <div className="hc-live-shimmer" />
          <div className="hc-live-mist" />
        </>
      )}
      {tell === "air" && <div className="hc-live-air" />}
    </div>
  );
}
