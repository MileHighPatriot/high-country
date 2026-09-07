import { GREET, NEED_ASK, TOPIC_LABEL, TOPIC_LINES, type TalkTopic } from "@/lib/game/content/voices";
import { CHARACTER_BY_ID } from "@/lib/game/content/characters";
import { LOCATION_BY_ID } from "@/lib/game/content/locations";
import type {
  CharacterId,
  EncounterChoice,
  EncounterDef,
  GameState,
  Outcome,
  PersonLife,
} from "@/lib/game/types";
import { peopleAt } from "@/lib/game/world";

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function locHash(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length) % arr.length]!;
}

function lifeOf(state: GameState, id: CharacterId): PersonLife | null {
  return state.world?.people[id] ?? peopleAt(state).find((p) => p.id === id) ?? null;
}

function rngFor(state: GameState, id: CharacterId, salt: string) {
  return mulberry32(locHash(id) ^ locHash(salt) ^ locHash(state.locationId) ^ (state.dayOfYear * 1009 + state.hour * 17));
}

export function composeGreet(state: GameState, id: CharacterId): string {
  const person = CHARACTER_BY_ID[id];
  const life = lifeOf(state, id);
  const rng = rngFor(state, id, "greet");
  const greets = GREET[id];
  let line = greets?.length ? pick(rng, greets) : (person?.fallback ?? "They look at you and wait.");
  if (life?.need) {
    const ask = NEED_ASK[life.need];
    if (ask && rng() < 0.7) line = `${line} ${pick(rng, ask)}`;
  }
  const tags = state.memories?.[id] ?? [];
  if (tags.includes("shared-meat") && rng() < 0.5) {
    line = `${line} The meat you shared still sits between you.`;
  } else if (tags.includes("left-in-storm") && rng() < 0.6) {
    line = `${line} The storm you walked out of is still in their face.`;
  } else if (tags.includes("stole") && rng() < 0.6) {
    line = `${line} They look at your hands.`;
  } else if (tags.includes("sat-at-fire") && rng() < 0.4) {
    line = `${line} They nod at the idea of your fire.`;
  }
  const stand = state.standing[id] ?? 0;
  if (stand <= -2) line = `${line} They have not forgiven you.`;
  else if (stand >= 2) line = `${line} Something in them has decided you are not weather.`;
  return line;
}

function topicReply(state: GameState, id: CharacterId, topic: TalkTopic): string {
  const rng = rngFor(state, id, topic);
  let line = pick(rng, TOPIC_LINES[topic]);
  const life = lifeOf(state, id);
  if (topic === "them" && life?.errand) {
    line = `${line} Today: ${life.errand}.`;
  }
  if (topic === "trail") {
    const loc = LOCATION_BY_ID[state.locationId];
    const edge = loc?.connections[Math.floor(rng() * (loc.connections.length || 1))];
    if (edge) {
      const dest = LOCATION_BY_ID[edge.to]?.name ?? edge.to;
      line = `${line} They mention ${dest} like a dare.`;
    }
  }
  if (topic === "meat" && (state.inventory.rations <= 0)) {
    line = "They see the empty bag. No speech. Hunger has already spoken.";
  }
  return line;
}

function topicOutcome(state: GameState, id: CharacterId, topic: TalkTopic): Outcome {
  const text = topicReply(state, id, topic);
  if (topic === "leave") {
    return { text, hours: 1 };
  }
  if (topic === "meat" && state.inventory.rations > 0) {
    return {
      text,
      hours: 1,
      inventory: { rations: -1 },
      meters: { hunger: 4 },
      standing: { id, delta: 1 },
      remember: { id, tag: "shared-meat" },
    };
  }
  if (topic === "you") {
    return { text, hours: 1, standing: { id, delta: 1 } };
  }
  if (topic === "them") {
    return { text, hours: 1, standing: { id, delta: 1 } };
  }
  return { text, hours: 1 };
}

export function liveTalkId(id: CharacterId) {
  return `dlg-live-${id}`;
}

export function isLiveTalk(encounterId: string | null | undefined) {
  return Boolean(encounterId && encounterId.startsWith("dlg-live-"));
}

export function liveTalkEncounter(state: GameState, id: CharacterId): EncounterDef {
  const topics: TalkTopic[] = ["weather", "trail", "them", "you", "leave"];
  if (state.inventory.rations > 0 || lifeOf(state, id)?.need === "food") {
    topics.splice(4, 0, "meat");
  }
  const choices: EncounterChoice[] = topics.map((topic) => ({
    id: topic,
    label: TOPIC_LABEL[topic],
    outcome: topicOutcome(state, id, topic),
  }));
  return {
    id: liveTalkId(id),
    characterId: id,
    repeatable: true,
    text: composeGreet(state, id),
    choices,
  };
}
