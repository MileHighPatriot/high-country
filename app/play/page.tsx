import { Suspense } from "react";
import { PlayScreen } from "@/components/game/play-screen";

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-black text-stone-300">
          The mountain is still deciding your weather…
        </div>
      }
    >
      <PlayScreen />
    </Suspense>
  );
}
