import { clipIntent, distinctiveWords, intentSeed, type AttemptPlan } from "@/lib/game/attempt";
import { CHARACTER_BY_ID } from "@/lib/game/content/characters";
import { LOCATION_BY_ID } from "@/lib/game/content/locations";
import type {
  AttemptVector,
  EncounterChoice,
  EncounterDef,
  GameState,
  Outcome,
  Season,
  StoryBeat,
  Weather,
} from "@/lib/game/types";
import { addRumor } from "@/lib/game/world";

function seasonWords(season: Season): string {
  return {
    spring: "late spring thaw",
    summer: "high summer",
    fall: "the fall hunt",
    winter: "deep winter",
  }[season];
}

function weatherWords(weather: Weather): string {
  return {
    clear: "clear air",
    wind: "hard wind",
    snow: "snow",
    blizzard: "blizzard",
    storm: "summer storm",
  }[weather];
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length) % arr.length]!;
}

function hashId(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

interface Ctx {
  intent: string;
  subject: string;
  ground: string;
  weather: string;
  season: string;
  who: string;
  name: string;
  word: string;
}

function fill(template: string, ctx: Ctx): string {
  return template
    .replace(/\{intent\}/g, ctx.intent)
    .replace(/\{subject\}/g, ctx.subject)
    .replace(/\{ground\}/g, ctx.ground)
    .replace(/\{weather\}/g, ctx.weather)
    .replace(/\{season\}/g, ctx.season)
    .replace(/\{who\}/g, ctx.who)
    .replace(/\{name\}/g, ctx.name)
    .replace(/\{word\}/g, ctx.word);
}

function ctxFor(state: GameState, plan: AttemptPlan): Ctx {
  const loc = LOCATION_BY_ID[state.locationId];
  const whoId = plan.personId ?? state.presentCharacterId;
  const person = whoId ? CHARACTER_BY_ID[whoId] : undefined;
  const words = distinctiveWords(plan.intent);
  return {
    intent: clipIntent(plan.intent, 110),
    subject: plan.subject || "the thing you named",
    ground: loc?.name ?? "this ground",
    weather: weatherWords(state.weather),
    season: seasonWords(state.season),
    who: person ? `${person.name} is here for it.` : "Nobody else claims this hour.",
    name: person?.name ?? "the empty air",
    word: words[0] ?? "try",
  };
}

const OPEN_OK = [
  "You put it in motion: {intent}.",
  "You said you would {intent}, and the hour takes you at your word.",
  "The act is yours: {intent}.",
  "You go at it the way you named it — {intent}.",
];

const OPEN_FAIL = [
  "You put it in motion: {intent}. The country has another idea.",
  "You said you would {intent}. The hour does not sign.",
  "You go at it: {intent}. Something in the ground refuses the contract.",
];

const BODY: Record<AttemptVector, { ok: string[]; no: string[] }> = {
  hunt: {
    ok: [
      "Sign turns into an animal. Blood on snow, or dust, depending on the mercy of {season}. You take meat because that is the whole argument.",
      "The shot or the still-hunt holds. {ground} gives you a body that used to run. You will smell like it until the next weather.",
      "You read the wind right. The country pays in meat, which is the only currency it honors.",
    ],
    no: [
      "The game is a rumor that does not agree to be meat. You spend the hour becoming a worse hunter and a hungrier one.",
      "A miss, or a trail that dies in talus. {ground} keeps its animals. You keep the empty.",
    ],
  },
  watch: {
    ok: [
      "You look until the country admits a shape. {season}. {weather}. A thing you would have walked through becomes a fact.",
      "The ground tells on itself. You see the next trouble before it finishes arriving.",
    ],
    no: [
      "You look until your eyes water. {ground} stays a picture. Whatever mattered already moved.",
      "Watching does not make you a hawk. The hour is spent on sky that will not be a map.",
    ],
  },
  scout: {
    ok: [
      "Tracks, ash, a broken twig that is a sentence. You know who passed, or what, and which way the story went.",
      "The trail is a conversation and you catch the last line. {ground} opens a little.",
    ],
    no: [
      "The sign is older than your hope. You follow it into a circle and call the circle work.",
      "Whatever made the track has already spent it. You are late to a country that does not wait.",
    ],
  },
  talk: {
    ok: [
      "{name} hears the thing you meant. Not all of it. Enough. Words change the standing between two animals who can lie.",
      "You say it in a way that does not waste their fire. {who} The talk leaves a mark that is not quite friendship and not weather.",
    ],
    no: [
      "The words come out like wet powder. {name} files you under weather and looks at something else.",
      "You talk. They do not agree that talking is the work. The silence after is a verdict.",
    ],
  },
  trade: {
    ok: [
      "Hands change what they hold. Not fair. Fair is a lowland word. You both walk away less empty.",
      "The bargain holds long enough to count. {name} will remember the weight, not the speech.",
    ],
    no: [
      "Nobody here is selling what you named, or the price is a joke with teeth. You keep your goods and your hunger.",
    ],
  },
  craft: {
    ok: [
      "The hands remember a trick the mind had misplaced. Lash, splice, edge. {ground} does not applaud. The work stays done.",
      "You make the thing you said you would make, or close enough that the hour cannot call you a liar.",
    ],
    no: [
      "A knot fails, a blade skips, a pole kicks. The work teaches you the old lesson: wanting is not a tool.",
      "You spend the hour making a worse version of what you had. The mountain is not a workshop. It is a critic.",
    ],
  },
  endure: {
    ok: [
      "You hold. That is the whole trick. {weather} chews and does not finish you. The next hour is still available.",
      "Grit is just refusing to become a story someone else tells. You refuse. It holds.",
    ],
    no: [
      "You hold until holding is just shaking. The weather writes its name on you and walks on.",
      "The country is longer than your stubbornness today. You come out of it smaller.",
    ],
  },
  sneak: {
    ok: [
      "You become a quieter animal. {ground} lets you pass like a rumor it has already heard.",
      "No twig files a complaint. You get to the place you named without being the news.",
    ],
    no: [
      "A stone, a breath, a coat that sounds like a flag. The country looks up. You are seen.",
    ],
  },
  pray: {
    ok: [
      "You put a scrap of speech into {weather} and do not ask it to write back. The hour is less sharp. That is all you are owed.",
      "Whatever listens up here does not keep office hours. Still: you said it. Something in the chest unclenches.",
    ],
    no: [
      "The words go up and come back as weather. You feel foolish, which is also a kind of prayer.",
    ],
  },
  travel: {
    ok: [
      "You leave {ground} the way you said you would. The trail is a fact. The next place has not agreed to be kind.",
      "Boots, hours, the idea of a destination. You make the miles you named.",
    ],
    no: [
      "The trail you wanted is a rumor, or the weather eats the line. You spend yourself and stay nearer than pride wanted.",
      "Wrong draw, bad snow, a circle. {ground} keeps you. The other place remains a story.",
    ],
  },
  eat: {
    ok: [
      "You eat. Grease, salt if you are lucky, the postponement of dying. Hunger takes one step back.",
    ],
    no: [
      "There is less in the bag than the sentence implied. You chew on the idea of supper.",
    ],
  },
  drink: {
    ok: [
      "Water. Granite taste. Thirst stops yelling and starts muttering.",
    ],
    no: [
      "The canteen talks like a drum. You wet your mouth on snow or spit and call it a plan.",
    ],
  },
  sleep: {
    ok: [
      "You lie down like a man who has decided the next danger can wait one watch. It might even be true.",
    ],
    no: [
      "Sleep does not come. The country keeps tapping the window of your skull.",
    ],
  },
  fire: {
    ok: [
      "Spark, breath, the first honest orange. {weather} argues and loses a round. Warmth is a country you can stand in.",
    ],
    no: [
      "The spark dies of exposure, same as people. You have smoke-smell and cold fingers and a lecture.",
    ],
  },
  water: {
    ok: [
      "You take water from this ground like a thief with permission. The canteens get heavy in the useful way.",
    ],
    no: [
      "Ice, silt, a dunk you did not budget for. You get less water than the hour cost.",
    ],
  },
  wood: {
    ok: [
      "Dead limbs, a shoulder argument, two armfuls if the country is in a mood. Fire tomorrow is a rumor you can hold.",
    ],
    no: [
      "Frozen knots, a slip, a poor take. You come back with less wood and more opinion about January.",
    ],
  },
  fish: {
    ok: [
      "The water agrees to be food. Not often. Today. You take what the hole offers and do not make a speech.",
    ],
    no: [
      "The hole is a mirror that refuses to be supper. You freeze for the privilege of learning that again.",
    ],
  },
  fight: {
    ok: [
      "It becomes a problem with blood in it. You are still standing, which is the only score that matters in the first minute.",
      "You make the violence you named. The other animal — man or not — has to answer.",
    ],
    no: [
      "You start it. The other side finishes a sentence you did not like. Distance closes the wrong way.",
    ],
  },
  help: {
    ok: [
      "You spend strength on someone who is not you. {name} will remember the spending, or they will not. The work is done anyway.",
      "Hands, lift, a share of warmth. For an hour you are not only a survival problem.",
    ],
    no: [
      "Help that does not land is just another way to get tired. {name} is not saved. You are not a story they needed.",
    ],
  },
  steal: {
    ok: [
      "You take it. The mountain does not keep a sheriff. People do. The thing is in your pack and the debt is in the air.",
    ],
    no: [
      "Caught, or almost, which is the same as caught in a country this small. Hands seen. Standing spent.",
    ],
  },
  give: {
    ok: [
      "You hand over what you named. Lighter pack, heavier standing. {name} looks at you like you might be a person.",
    ],
    no: [
      "The gift sits wrong, or there is nothing to give that matches the sentence. Charity with empty hands is just talk.",
    ],
  },
  search: {
    ok: [
      "You turn the ground until it admits a thing: meat, sign, a cache, a fact. {word} was the right word.",
      "Looking becomes finding. Not treasure. Treasure is a lowland story. A useful scrap.",
    ],
    no: [
      "You search a country that has already been searched by weather. Nothing new agrees to be yours.",
    ],
  },
  climb: {
    ok: [
      "Hands, smear, a height that turns {ground} into a map. You see the line you meant to be on.",
    ],
    no: [
      "The hold lies. You slide, eat bark or ice, and learn the elevation the hard way.",
    ],
  },
  hide: {
    ok: [
      "You get small. The thing that wanted you wants a larger animal. It goes. You remember how to breathe.",
    ],
    no: [
      "Hiding is a skill and today you are an amateur. You are still the most interesting shape in the draw.",
    ],
  },
  wait: {
    ok: [
      "You let the hours do the walking. {weather}. Something in the country rearranges itself without asking you to help.",
    ],
    no: [
      "Waiting spends you the same as work and pays less. The thing you waited for does not arrive on your clock.",
    ],
  },
  flee: {
    ok: [
      "You leave the beat. Pride files a complaint and is overruled. Distance is a kind of winning.",
    ],
    no: [
      "You try to leave and the country holds your coat. The moment is not done with you.",
    ],
  },
  follow: {
    ok: [
      "You keep them in the world. Sign, smoke, a shape that is still a person. The next place is theirs, then yours.",
    ],
    no: [
      "They are already a rumor. You follow a trail that wanted to be alone.",
    ],
  },
  threaten: {
    ok: [
      "You put iron or voice in the space between you. {name} recalculates. Fear is a tool. It cuts the user too, later.",
    ],
    no: [
      "The threat lands like a wet match. They have been threatened by worse weather than you.",
    ],
  },
  shelter: {
    ok: [
      "You make a hole or a wall the wind has to argue with. Not a house. A postponement of dying that you can sit in.",
    ],
    no: [
      "The shelter is a theory. The weather marks it unreadable. You are still the outside.",
    ],
  },
  cook: {
    ok: [
      "Heat makes the meat honest. For a little while hunger is a solved problem and not a religion.",
    ],
    no: [
      "The pot, the fire, the plan — one of them is a liar. You eat less well than the sentence promised.",
    ],
  },
  camp: {
    ok: [
      "Canvas or boughs or the idea of a ring of stones. You claim {ground} for a night. The mountain does not sign the deed. It allows the rumor.",
    ],
    no: [
      "Camp does not take. Wind, slope, a bad hour. You are still a visitor with a pack.",
    ],
  },
  inspect: {
    ok: [
      "You look at {ground} until it is not a backdrop. {season}. {weather}. A detail that will matter, or at least a truth: you are still here.",
      "The place has an opinion and you finally hear it. Not magic. Attention.",
    ],
    no: [
      "You look. The country looks like itself. No secret committee. Just rock, timber, and the next problem.",
    ],
  },
  weather: {
    ok: [
      "You meet {weather} on purpose. It does not love you. It also does not finish you. That is a kind of treaty.",
    ],
    no: [
      "{weather} writes on you in a hand you will wear for days. You called it. It came.",
    ],
  },
  other: {
    ok: [
      "You do the thing you named, as far as this country will let a sentence become an act. {who}",
      "The mountain is not a stage with cues. It still has to answer a person who has decided. You decided: {intent}. It answers yes, with fees.",
      "Against likelihood, it works. Not clean. Not a story you would tell in a warm room. It works.",
    ],
    no: [
      "The thing you named does not fit this hour. {ground} has its own plot and you are between pages.",
      "You try {subject}. The country files it under weather and moves on. You are left with the trying.",
      "No. Not a moral no. A physical one. Rock, cold, a person who will not, an animal that isn't there.",
    ],
  },
};

const TWIST_OK = [
  "The act is not the end of the hour. Something in the timber has noticed.",
  "You have changed the plot. The next fact is already walking toward {ground}.",
  "A consequence sits down beside you like a third person.",
  "The country rearranges. You get a new problem for having solved the last one.",
];

const TWIST_NO = [
  "Failure is also a plot. What happens next is not a menu. It is a result.",
  "The miss has a child. You will meet it before the light changes.",
  "You did not get what you named. You got the world's answer, which is a scene.",
];

const LOOK_EXTRA = [
  "{ground} in {season}: {weather}. The next trail is a dare, not a gift.",
  "You take the inventory of the hour: fire {fire}, belly, the people who are here, the ones who are not.",
  "A neighbor place still exists. The mountain has not eaten the map. Not yet.",
];

function mechanicOutcome(state: GameState, plan: AttemptPlan, success: boolean): Partial<Outcome> {
  const who = plan.personId ?? state.presentCharacterId ?? undefined;
  const v = plan.vector;
  const base: Partial<Outcome> = { hours: plan.hours };
  if (v === "hunt") {
    return success
      ? { ...base, inventory: { rations: 1, powder: state.inventory.rifle && state.inventory.powder > 0 ? -1 : 0 }, meters: { energy: -8 }, skill: "rifle" }
      : { ...base, meters: { energy: -10 } };
  }
  if (v === "fish") {
    return success ? { ...base, inventory: { rations: 1 }, meters: { warmth: -6, energy: -6 } } : { ...base, meters: { warmth: -8, energy: -8 } };
  }
  if (v === "talk" || v === "give" || v === "help") {
    const standing = who ? { id: who, delta: success ? 1 : v === "talk" ? 0 : -1 } : undefined;
    const inv = v === "give" && success && state.inventory.rations > 0 ? { rations: -1 } : undefined;
    const remember = who && v === "give" && success ? { id: who, tag: "shared-meat" } : who && v === "help" && success ? { id: who, tag: "sat-at-fire" } : undefined;
    return { ...base, hours: 1, standing, inventory: inv, remember, meters: v === "help" ? { energy: success ? -8 : -10 } : { energy: -4 } };
  }
  if (v === "steal") {
    return success
      ? { ...base, hours: 1, inventory: { rations: 1 }, standing: who ? { id: who, delta: -2 } : undefined, remember: who ? { id: who, tag: "stole" } : undefined }
      : { ...base, hours: 1, standing: who ? { id: who, delta: -2 } : undefined, remember: who ? { id: who, tag: "stole" } : undefined, meters: { health: -4 } };
  }
  if (v === "fight" || v === "threaten") {
    if (success && v === "threaten") {
      return { ...base, hours: 1, standing: who ? { id: who, delta: -1 } : undefined, meters: { energy: -6 } };
    }
    return {
      ...base,
      hours: 0,
      startSkirmish: {
        intro: success ? "You made it a fight. It agrees." : "You made it a fight. It was already one.",
        foes: [
          {
            id: "improv-foe",
            name: who && CHARACTER_BY_ID[who] ? CHARACTER_BY_ID[who]!.name : "A shape that will not yield",
            hp: 14,
            maxHp: 14,
            range: "near",
            damage: [3, 7],
            art: who && CHARACTER_BY_ID[who] ? CHARACTER_BY_ID[who]!.art : undefined,
          },
        ],
      },
    };
  }
  if (v === "travel" && plan.locationId && plan.locationId !== state.locationId) {
    return success
      ? { ...base, relocate: plan.locationId, unlockLocation: plan.locationId, meters: { energy: -8 } }
      : { ...base, meters: { energy: -12, warmth: -6 } };
  }
  if (v === "follow" && plan.locationId && plan.locationId !== state.locationId) {
    return success
      ? { ...base, relocate: plan.locationId, presentCharacter: plan.personId ?? undefined, meters: { energy: -8 } }
      : { ...base, meters: { energy: -10 } };
  }
  if (v === "fire") {
    return success ? { ...base, hours: 1, meters: { warmth: 12, energy: -6 } } : { ...base, hours: 1, meters: { warmth: -4, energy: -8 } };
  }
  if (v === "water") {
    return success ? { ...base, inventory: { water: 1 }, meters: { warmth: -4 } } : { ...base, meters: { warmth: -8, health: -3 } };
  }
  if (v === "wood") {
    return success ? { ...base, inventory: { firewood: 1 }, meters: { energy: -8 } } : { ...base, meters: { energy: -10 } };
  }
  if (v === "eat") {
    return success && state.inventory.rations > 0
      ? { ...base, hours: 1, inventory: { rations: -1 }, meters: { hunger: 16 } }
      : { ...base, hours: 1, meters: { hunger: 0, energy: -4 } };
  }
  if (v === "drink") {
    return success && state.inventory.water > 0
      ? { ...base, hours: 1, inventory: { water: -1 }, meters: { thirst: 18 } }
      : { ...base, hours: 1, meters: { thirst: 0 } };
  }
  if (v === "shelter") {
    return success
      ? { ...base, extraAdd: "snow-hole", meters: { warmth: 10, energy: -10 }, skill: "camp" }
      : { ...base, meters: { warmth: -8, energy: -10 } };
  }
  if (v === "endure" || v === "weather") {
    return success
      ? { ...base, meters: { warmth: -4, energy: -8 }, weather: state.weather === "blizzard" ? "snow" : undefined }
      : { ...base, meters: { warmth: -14, energy: -10, health: -4 } };
  }
  if (v === "climb") {
    return success ? { ...base, meters: { energy: -8 }, skill: "sign" } : { ...base, meters: { health: -6, energy: -10 } };
  }
  if (v === "sneak" || v === "hide") {
    return success ? { ...base, hours: 1, meters: { energy: -4 }, skill: "hide" } : { ...base, hours: 1, meters: { energy: -6 } };
  }
  if (v === "search" || v === "scout" || v === "inspect") {
    const loc = LOCATION_BY_ID[state.locationId];
    const neighbor = loc?.connections[0]?.to;
    return success
      ? { ...base, meters: { energy: -6 }, unlockLocation: neighbor, skill: v === "scout" ? "sign" : undefined }
      : { ...base, meters: { energy: -8 } };
  }
  if (v === "flee") {
    const loc = LOCATION_BY_ID[state.locationId];
    const neighbor = loc?.connections[0]?.to;
    return success
      ? { ...base, hours: 1, relocate: neighbor, presentCharacter: null, meters: { energy: -6 } }
      : { ...base, hours: 1, meters: { energy: -8 } };
  }
  if (v === "cook") {
    return success && state.inventory.rations > 0
      ? { ...base, hours: 1, meters: { hunger: 10, warmth: 6 } }
      : { ...base, hours: 1, meters: { energy: -4 } };
  }
  if (v === "pray" || v === "wait") {
    return { ...base, meters: { energy: v === "pray" ? 4 : -4, warmth: state.campfire ? 4 : -4 } };
  }
  if (v === "craft" || v === "camp") {
    return success ? { ...base, meters: { energy: -8 }, skill: "camp" } : { ...base, meters: { energy: -10, health: -3 } };
  }
  return success ? { ...base, meters: { energy: -6 } } : { ...base, meters: { energy: -10 } };
}

function fromChoiceFrame(plan: AttemptPlan, success: boolean): Partial<Outcome> | null {
  const choice = plan.choiceFrame;
  if (!choice) return null;
  const branch = choice.check ? (success ? choice.success : choice.fail) : choice.outcome;
  if (!branch) return null;
  const { text: _t, scene: _s, ...rest } = branch;
  return rest;
}

function composeText(state: GameState, plan: AttemptPlan, success: boolean, rng: () => number): string {
  const ctx = ctxFor(state, plan);
  const open = fill(pick(rng, success ? OPEN_OK : OPEN_FAIL), ctx);
  const bank = BODY[plan.vector] ?? BODY.other;
  const body = fill(pick(rng, success ? bank.ok : bank.no), ctx);
  const extraBits: string[] = [];
  if (plan.vector === "inspect" || plan.vector === "watch") {
    extraBits.push(
      fill(pick(rng, LOOK_EXTRA), ctx).replace("{fire}", state.campfire ? "going" : "dead"),
    );
    const loc = LOCATION_BY_ID[state.locationId];
    if (loc?.blurb) extraBits.push(loc.blurb.split(".")[0] + ".");
  }
  const who = plan.personId ? CHARACTER_BY_ID[plan.personId] : state.presentCharacterId ? CHARACTER_BY_ID[state.presentCharacterId] : undefined;
  if (who && plan.vector !== "talk") extraBits.push(`${who.name} is witness enough.`);
  const rumor = state.world?.rumors.at(-1);
  if (rumor && rng() < 0.25) extraBits.push(`A thing already loose on the range: ${rumor}`);
  return [open, body, ...extraBits].filter(Boolean).join(" ");
}

export function attemptOutcome(state: GameState, plan: AttemptPlan, success: boolean): Outcome {
  const rng = mulberry32(intentSeed(state, plan.intent + String(success)));
  const text = composeText(state, plan, success, rng);
  const framed = fromChoiceFrame(plan, success);
  const mech = mechanicOutcome(state, plan, success);
  const merged: Outcome = {
    text,
    hours: framed?.hours ?? mech.hours ?? plan.hours,
    meters: framed?.meters ?? mech.meters,
    inventory: framed?.inventory ?? mech.inventory,
    extraAdd: framed?.extraAdd ?? mech.extraAdd,
    extraRemove: framed?.extraRemove,
    standing: framed?.standing ?? mech.standing,
    startSkirmish: framed?.startSkirmish ?? mech.startSkirmish,
    unlockLocation: framed?.unlockLocation ?? mech.unlockLocation,
    presentCharacter: framed?.presentCharacter ?? (plan.personId && (plan.vector === "talk" || plan.vector === "help" || plan.vector === "give") ? plan.personId : mech.presentCharacter),
    death: framed?.death,
    markDialogue: framed?.markDialogue,
    weather: framed?.weather ?? mech.weather,
    relocate: framed?.relocate ?? mech.relocate,
    followUpEncounter: framed?.followUpEncounter,
    nextDialogue: framed?.nextDialogue,
    invite: framed?.invite,
    skill: framed?.skill ?? mech.skill,
    clearFire: framed?.clearFire,
    remember: framed?.remember ?? mech.remember,
  };
  if (plan.vector === "fight" && framed?.startSkirmish) {
    merged.startSkirmish = framed.startSkirmish;
  }
  if (success && plan.locationId && plan.locationId !== state.locationId && !merged.relocate && !merged.startSkirmish) {
    merged.relocate = plan.locationId;
    merged.unlockLocation = merged.unlockLocation ?? plan.locationId;
  }
  return merged;
}

const FOLLOW: Record<string, { text: string[]; choices: Array<{ id: string; label: string; vector: AttemptVector }> }> = {
  hunt: {
    text: [
      "The kill is not private. Ravens take the news downhill. Something else can read a sky.",
      "Blood on this ground is an invitation. You have meat. You also have a clock.",
    ],
    choices: [
      { id: "keep", label: "Dress it and get off this ground", vector: "craft" },
      { id: "share", label: "Leave a share for whoever follows the birds", vector: "give" },
      { id: "watch", label: "Hold still and see what claims the rest", vector: "watch" },
    ],
  },
  talk: {
    text: [
      "The talk does not end when the sentence does. {name} is still deciding what you are.",
      "A silence arrives that wants a second act. {name} has not walked yet.",
    ],
    choices: [
      { id: "push", label: "Say the rest of it", vector: "talk" },
      { id: "gift", label: "Put food or fire between you", vector: "give" },
      { id: "leave", label: "Leave them the last word", vector: "flee" },
    ],
  },
  steal: {
    text: [
      "Taking is fast. Being a person who took is slow. The range is not wide enough to hide a new name.",
    ],
    choices: [
      { id: "go", label: "Put miles on it before a mouth does", vector: "travel" },
      { id: "hide", label: "Cache what you took and look innocent", vector: "hide" },
      { id: "face", label: "Stay and see if they already know", vector: "endure" },
    ],
  },
  fight: {
    text: [
      "Violence has a leftover. The ground is not done. Neither are you.",
    ],
    choices: [
      { id: "press", label: "Finish what you started", vector: "fight" },
      { id: "back", label: "Take the distance while it is still for sale", vector: "flee" },
      { id: "talk", label: "Try to make it words again", vector: "talk" },
    ],
  },
  search: {
    text: [
      "Looking turned up a fact that wants handling. Not later. This hour.",
    ],
    choices: [
      { id: "take", label: "Take it and own the consequence", vector: "craft" },
      { id: "read", label: "Study it until it is a map", vector: "inspect" },
      { id: "leave", label: "Leave it for the next fool", vector: "flee" },
    ],
  },
  travel: {
    text: [
      "The new ground has its own plot. Arrival is not safety. It is a different set of teeth.",
    ],
    choices: [
      { id: "scout", label: "Read this place before it reads you", vector: "scout" },
      { id: "fire", label: "Make a claim with smoke", vector: "fire" },
      { id: "wait", label: "Sit until the place admits you", vector: "wait" },
    ],
  },
  weather: {
    text: [
      "The weather you met is still writing. Shelter, motion, or stubbornness: pick one while you can still pick.",
    ],
    choices: [
      { id: "hole", label: "Dig in and let it spend itself", vector: "shelter" },
      { id: "move", label: "Walk while walking is still a choice", vector: "travel" },
      { id: "hold", label: "Hold and pay in heat", vector: "endure" },
    ],
  },
  other: {
    text: [
      "What you did has a child. {ground} is not the same hour it was. The next act is yours if you take it.",
      "The mountain answers a made-up act with a made-up consequence. That is the whole game. It is sitting in front of you.",
    ],
    choices: [
      { id: "lean", label: "Lean into what you started", vector: "other" },
      { id: "look", label: "Look harder at what you made", vector: "inspect" },
      { id: "off", label: "Step off and let the hour cool", vector: "flee" },
    ],
  },
};

function followBank(vector: AttemptVector) {
  return FOLLOW[vector] ?? FOLLOW.other;
}

function choiceOutcome(label: string, vector: AttemptVector): Outcome {
  const hours = vector === "travel" || vector === "hunt" || vector === "shelter" ? 2 : 1;
  const energy = vector === "flee" ? -4 : -6;
  return {
    text: `You take the obvious next: ${label.toLowerCase()}. The hour spends itself on that.`,
    hours,
    meters: { energy },
  };
}

export function followUpScene(state: GameState, plan: AttemptPlan, success: boolean): EncounterDef | null {
  if (plan.choiceFrame?.outcome?.nextDialogue || plan.choiceFrame?.success?.nextDialogue || plan.choiceFrame?.fail?.nextDialogue) {
    return null;
  }
  if (plan.choiceFrame && !plan.complex) return null;
  const recent = (state.story ?? []).filter((b) => b.dayOfYear === state.dayOfYear).length;
  const rng = mulberry32(intentSeed(state, plan.intent + "follow"));
  const novelty = distinctiveWords(plan.intent).length;
  let chance = 0.28 + Math.min(0.35, novelty * 0.05);
  if (["hunt", "steal", "fight", "travel", "weather", "search"].includes(plan.vector)) chance += 0.18;
  if (plan.complex) chance += 0.12;
  if (!success) chance += 0.08;
  if (recent >= 3) chance *= 0.35;
  if (rng() > chance) return null;

  const ctx = ctxFor(state, plan);
  const bank = followBank(plan.vector);
  const twist = fill(pick(rng, success ? TWIST_OK : TWIST_NO), ctx);
  const setup = fill(pick(rng, bank.text), ctx);
  const id = `improv-${hashId(plan.intent + String(state.dayOfYear) + String(state.hour) + String(state.rngSeed))}`;
  const choices: EncounterChoice[] = bank.choices.map((c) => ({
    id: c.id,
    label: c.label,
    outcome: choiceOutcome(c.label, c.vector),
  }));
  return {
    id,
    text: `${twist} ${setup}`,
    choices,
    characterId: plan.personId ?? state.presentCharacterId ?? undefined,
    repeatable: true,
  };
}

export function rememberStory(state: GameState, plan: AttemptPlan, success: boolean, summary: string): GameState {
  const beat: StoryBeat = {
    intent: clipIntent(plan.intent, 100),
    vector: plan.vector,
    locationId: state.locationId,
    dayOfYear: state.dayOfYear,
    hour: state.hour,
    success,
    summary: clipIntent(summary, 160),
  };
  const story = [...(state.story ?? []), beat].slice(-12);
  let next: GameState = { ...state, story };
  const loc = LOCATION_BY_ID[state.locationId]?.name ?? state.locationId;
  next = addRumor(next, `Someone tried to ${clipIntent(plan.intent, 80)} at ${loc}.`);
  return next;
}

export function storyLine(state: GameState): string | null {
  const tale = (state.story ?? []).filter((b) => b.locationId === state.locationId).at(-1);
  if (!tale) return null;
  const age = Math.abs(state.dayOfYear - tale.dayOfYear);
  if (age > 1) return null;
  if (tale.hour === state.hour && tale.dayOfYear === state.dayOfYear) return null;
  return `This ground still holds what you tried: ${tale.intent}.`;
}
