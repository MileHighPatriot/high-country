import type { EncounterDef, GameState } from "@/lib/game/types";

export function choreEncounter(state: GameState, kind: "search" | "arrive" | "wait"): EncounterDef {
  const id = `chore-${state.locationId}-${state.season}-${kind}`;
  if (kind === "wait") {
    return {
      id,
      text: `The ${state.weather} keeps its own counsel. You hunker and spend hours you will not get back.`,
      choices: [
        {
          id: "ok",
          label: "Sit it out",
          outcome: { text: "Time moves. You are still here.", hours: 1 },
        },
      ],
    };
  }
  if (kind === "arrive") {
    return {
      id,
      text: "The place is only itself. No one calls your name. That is not always mercy.",
      choices: [
        {
          id: "ok",
          label: "Take it in",
          outcome: { text: "You set your pack down and listen to your own breath.", hours: 0 },
        },
      ],
    };
  }
  const scraps = [
    "You turn over a stone and find only another stone.",
    "A rusted trap, sprung and useless, like a mouth that already ate.",
    "Rabbit tracks, yesterday’s. The rabbit is in someone else’s fire.",
    "You find enough dry punk for tinder and call it a victory.",
  ];
  const i = state.daysSurvived % scraps.length;
  return {
    id: `${id}-${i}`,
    text: scraps[i]!,
    choices: [
      {
        id: "take",
        label: "Take the small luck",
        outcome: {
          text: "You pocket what little the ground allowed.",
          hours: 1,
          inventory: { firewood: i === 3 ? 1 : 0, rations: i === 2 ? 0 : 0 },
        },
      },
      {
        id: "leave",
        label: "Leave it",
        outcome: { text: "You keep moving. The ground keeps its secrets.", hours: 0 },
      },
    ],
  };
}
