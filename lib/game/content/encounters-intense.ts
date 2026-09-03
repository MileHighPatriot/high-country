import type { EncounterDef } from "@/lib/game/types";

/** High-stakes beats. The bone d20 comes out when these begin. */
export const INTENSE_ENCOUNTERS: EncounterDef[] = [
  {
    id: "int-chute-loaded",
    intense: true,
    season: ["winter", "spring"],
    weather: ["snow", "blizzard"],
    locations: ["avalanche-chute"],
    triggers: ["arrive", "scout", "wait"],
    weight: 6,
    text: "The chute talks. A deep, wet crack, then a silence that is not peace. A slab the size of a cabin roof has decided it is tired of being a mountain. The runout is a white throat. You are in it.",
    choices: [
      {
        id: "cut",
        label: "Cut for the timber on the rib",
        check: { trait: "grit", dc: 15 },
        success: {
          text: "Snow takes your knees and then your belt. You claw the rib like a man climbing out of a grave that is still being dug. The slab goes by with a sound you will hear in ordinary rooms.",
          hours: 2,
          meters: { energy: -16, warmth: -12, health: -4 },
        },
        fail: {
          text: "It has you. The world is a dark packed weight. You find air with your mouth and a rib that does not agree. Digging out is a theology you invent on the spot.",
          hours: 3,
          meters: { health: -22, warmth: -20, energy: -20 },
        },
      },
      {
        id: "low",
        label: "Drop behind the nearest boulder and pray",
        outcome: {
          text: "Ice and timber hammer the stone an inch from your ear. You live by being smaller than the problem. The chute is a new country when you stand up.",
          hours: 2,
          meters: { warmth: -14, energy: -12, health: -6 },
        },
      },
    ],
  },
  {
    id: "int-grizz-sow",
    intense: true,
    season: ["summer", "fall"],
    locations: ["grizzly-basin", "elk-wallow"],
    triggers: ["hunt", "arrive", "search", "scout"],
    timeBands: ["dawn", "morning", "afternoon", "dusk"],
    weight: 5,
    text: "She stands up out of the willow like a door opening. A sow, close enough that you can see the old split in her nose. Two cubs the color of last year’s grass. She woofs once. The basin gets very small.",
    choices: [
      {
        id: "hold",
        label: "Hold still and talk her down",
        check: { trait: "grit", dc: 15 },
        success: {
          text: "You become a stump that knows words. She drops, woofs the cubs upslope, and leaves you a strip of ground that still belongs to you. Your hands remember how to shake later.",
          hours: 1,
          meters: { energy: -10 },
        },
        fail: {
          text: "She decides you are the problem.",
          hours: 0,
          startSkirmish: {
            intro: "A sow with cubs does not file appeals. She comes.",
            foes: [{ id: "sow", name: "Grizzly sow", hp: 28, maxHp: 28, range: "close", damage: [6, 12], art: "/art/locations/grizzly-basin.jpg" }],
          },
        },
      },
      {
        id: "back",
        label: "Give her the basin without looking like meat",
        outcome: {
          text: "You back out the way you came, talking to the willows. She watches until you are a smaller idea. The hunt is over. The day is not.",
          hours: 2,
          meters: { energy: -8 },
        },
      },
    ],
  },
  {
    id: "int-ice-mouth",
    intense: true,
    season: "winter",
    locations: ["creek", "frozen-fall"],
    triggers: ["arrive", "fish", "drink"],
    weight: 5,
    text: "The ice under you sounds like a plate being asked a question. Black water shows in a seam the width of a finger, then a hand. The creek has been waiting for a fool with dry wool.",
    choices: [
      {
        id: "crawl",
        label: "Crawl for the bank before it opens",
        check: { trait: "hands", dc: 14 },
        success: {
          text: "You distribute yourself like a rumor. The plate lets go behind your heels. You roll onto gravel with a sound in your chest that is not language.",
          hours: 1,
          meters: { warmth: -8, energy: -10 },
        },
        fail: {
          text: "The mouth opens. The cold is a nail through both lungs. You find the hole from underneath and come up changed.",
          hours: 2,
          meters: { health: -16, warmth: -28, energy: -16 },
          extraRemove: "dry-boots",
        },
      },
      {
        id: "still",
        label: "Go still and wait for it to think twice",
        outcome: {
          text: "You become weightless on purpose. The seam holds. You ease back the way a man leaves a church he has no right to be in.",
          hours: 1,
          meters: { warmth: -10, energy: -6 },
        },
      },
    ],
  },
  {
    id: "int-cornice",
    intense: true,
    season: ["winter", "spring"],
    locations: ["wind-saddle", "south-pass"],
    weather: ["snow", "wind", "blizzard", "clear"],
    triggers: ["scout", "arrive"],
    weight: 5,
    text: "The cornice is a white lip over nothing. You are already on it. The wind has been carving a room underneath your boots. One step will tell you whether the room is finished.",
    choices: [
      {
        id: "ease",
        label: "Ease back off the lip",
        check: { trait: "savvy", dc: 14 },
        success: {
          text: "You make yourself long and slow. The lip sighs. A chunk the size of a mule goes into the chute without you. You sit down on honest rock and hate heights in a new key.",
          hours: 1,
          meters: { energy: -8 },
        },
        fail: {
          text: "The room was finished. You and a ton of snow go looking for the basin.",
          hours: 3,
          meters: { health: -18, energy: -16, warmth: -14 },
          relocate: "avalanche-chute",
        },
      },
      {
        id: "belly",
        label: "Drop to your belly and crawl",
        outcome: {
          text: "Dignity is for lower country. You worm back until the mountain is under you in the old way. The lip calved anyway, later, for someone else.",
          hours: 1,
          meters: { energy: -6, warmth: -6 },
        },
      },
    ],
  },
  {
    id: "int-night-hands",
    intense: true,
    timeBands: ["night"],
    triggers: ["sleep", "camp", "fire"],
    weight: 5,
    text: "Hands at the edge of the light. Not animals. Men who have decided your fire is a kind of invitation they did not ask for. Steel shows. Someone is breathing through his mouth.",
    choices: [
      {
        id: "stand",
        label: "Stand up into it",
        check: { trait: "grit", dc: 14 },
        success: {
          text: "You make yourself tall and ugly. The mouth-breather looks at the rifle and discovers an errand elsewhere. They take nothing you will miss except an hour of sleep.",
          hours: 1,
          meters: { energy: -8 },
        },
        fail: {
          text: "They do not discover an errand.",
          hours: 0,
          startSkirmish: {
            intro: "Night men with knives have come for what you have.",
            foes: [
              { id: "night-1", name: "Night man", hp: 14, maxHp: 14, range: "close", damage: [3, 8], art: "/art/people/dutch-harrow.jpg" },
              { id: "night-2", name: "The other", hp: 12, maxHp: 12, range: "near", damage: [2, 7] },
            ],
          },
        },
      },
      {
        id: "bag",
        label: "Kick the bag toward them and back into the dark",
        outcome: {
          text: "They take a ration and the idea of you. You take your skin. The fire keeps talking to empty ground.",
          hours: 1,
          inventory: { rations: -1 },
          meters: { energy: -6 },
          presentCharacter: null,
        },
      },
    ],
  },
  {
    id: "int-lion-circle",
    intense: true,
    locations: ["timberline", "elk-wallow", "burned-timber"],
    timeBands: ["dusk", "night"],
    triggers: ["arrive", "scout", "hunt"],
    weight: 5,
    text: "A mountain lion has been walking the same circle you have, a little farther out, a little closer in. You see the tail first, then the shoulders. Yellow glass for eyes. It is deciding whether you are elk enough.",
    choices: [
      {
        id: "eye",
        label: "Meet its eyes and do not run",
        check: { trait: "eye", dc: 14 },
        success: {
          text: "You become the larger animal by an act of fraud. It looks through you, then around you, then is gone the way smoke is gone. The dark keeps the rest of the sentence.",
          hours: 1,
          meters: { energy: -8 },
        },
        fail: {
          text: "It comes in high and fast. Fur, heat, a red line from collar to ribs. You keep the rifle because you never got to use it.",
          hours: 1,
          meters: { health: -18, energy: -12 },
        },
      },
      {
        id: "shot",
        label: "Spend the powder now",
        outcome: {
          text: "The shot goes into timber. The cat is not there to receive it. You reload with fingers that have their own opinions.",
          hours: 1,
          inventory: { powder: -1 },
          meters: { energy: -6 },
        },
      },
    ],
  },
  {
    id: "int-white-room",
    intense: true,
    season: "winter",
    weather: ["blizzard"],
    locations: ["wind-saddle", "south-pass", "avalanche-chute"],
    triggers: ["arrive", "wait", "scout"],
    weight: 6,
    text: "The world has been erased. Wind and grit in a room with no walls. Your tracks fill as you make them. The next step is a theology. The one after that is a guess.",
    choices: [
      {
        id: "cairn",
        label: "Hold a line by wind and bone",
        check: { trait: "savvy", dc: 15 },
        success: {
          text: "You keep the wind on one cheek like a commandment. Timber arrives as a darker rumor, then as trees. You sit down in the first lee and do not speak, even to yourself.",
          hours: 3,
          meters: { warmth: -16, energy: -14 },
          relocate: "timberline",
        },
        fail: {
          text: "The line was a wish. You walk in a circle that tightens. When you stop, the stopping is the last useful idea you have. Dawn, if it comes, finds you by accident.",
          hours: 4,
          meters: { warmth: -24, energy: -18, health: -16 },
        },
      },
      {
        id: "hole",
        label: "Dig a hole and wait the storm out",
        outcome: {
          text: "You bury yourself like a secret. Hours go by that do not count as living. When it thins you are still a man, which is more than the saddle promised.",
          hours: 5,
          meters: { warmth: -10, energy: -8 },
          extraAdd: "snow-hole",
        },
      },
    ],
  },
  {
    id: "int-elk-run",
    intense: true,
    season: "fall",
    locations: ["elk-wallow", "south-park-rim", "grizzly-basin"],
    triggers: ["hunt", "arrive", "scout"],
    weight: 5,
    text: "The willows explode. A bull first, then the cows, then the idea of a herd, all of it aimed at the gap you are standing in. Antlers like wreckage. The ground becomes a drum.",
    choices: [
      {
        id: "climb",
        label: "Get up the deadfall",
        check: { trait: "hands", dc: 14 },
        success: {
          text: "You are in the wood when the first cow goes under you. Hair, heat, a horn that takes a piece of your sleeve. They pass. You climb down into a country that has been rearranged.",
          hours: 1,
          meters: { energy: -12, health: -3 },
        },
        fail: {
          text: "The deadfall is ice. A shoulder finds your hip. You go down among legs and come up later, which is a kind of luck that hurts.",
          hours: 2,
          meters: { health: -16, energy: -14 },
        },
      },
      {
        id: "flat",
        label: "Go flat and let them split around you",
        outcome: {
          text: "You become ground. Hooves miss you the way weather misses a stone. Mud in your mouth. The bull never knew you were a problem.",
          hours: 1,
          meters: { energy: -8, health: -4 },
        },
      },
    ],
  },
  {
    id: "int-cache-knife",
    intense: true,
    locations: ["cache-deadfall"],
    triggers: ["search", "arrive"],
    weight: 5,
    text: "Someone is already in the hole. A man with a knife in the dirt and eyes that have not slept. He has your same idea about this cache. He has had it longer. The knife comes up.",
    choices: [
      {
        id: "talk",
        label: "Talk the knife back into the dirt",
        check: { trait: "savvy", dc: 14 },
        success: {
          text: "You give him a share and a way to keep his name. He puts the iron down like it burned him. You both leave poorer and upright.",
          hours: 1,
          inventory: { rations: -1 },
          presentCharacter: "cyrus-pelt",
          standing: { id: "cyrus-pelt", delta: 1 },
        },
        fail: {
          text: "He does not want a share. He wants the hole.",
          hours: 0,
          startSkirmish: {
            intro: "A hungry man and a hole in the ground. Only one of you is leaving with both.",
            foes: [{ id: "cache-man", name: "The man in the hole", hp: 16, maxHp: 16, range: "close", damage: [4, 9], art: "/art/people/cyrus-pelt.jpg" }],
          },
        },
      },
      {
        id: "leave",
        label: "Show empty hands and walk",
        outcome: {
          text: "You leave him the hole and the story of being robbed by a ghost. He watches until the timber takes you.",
          hours: 1,
          presentCharacter: null,
        },
      },
    ],
  },
  {
    id: "int-scree-go",
    intense: true,
    season: "summer",
    locations: ["avalanche-chute"],
    triggers: ["arrive", "scout"],
    weight: 4,
    text: "The scree starts moving while you are on it. A river of plate-rock, slow at first, then interested. Above you a boulder the size of a stove decides to join. There is no trail. There is only down.",
    choices: [
      {
        id: "ride",
        label: "Ride it and stay upright",
        check: { trait: "hands", dc: 14 },
        success: {
          text: "You ski on broken stone. The stove-boulder misses you by a theology. You come off the tongue bleeding at the palms and still your own shape.",
          hours: 2,
          meters: { energy: -14, health: -6 },
          relocate: "burned-timber",
        },
        fail: {
          text: "The slope takes your feet, then your hip, then a minute you will not get back. You stop against a spar with a new argument in the ribs.",
          hours: 3,
          meters: { health: -16, energy: -16 },
          relocate: "burned-timber",
        },
      },
      {
        id: "dive",
        label: "Dive for the rib of dirt",
        outcome: {
          text: "You crawl into a seam of old root and let the chute empty itself. Rock ticks off your pack. When it stops you are higher than you wanted and alive, which is the whole list.",
          hours: 2,
          meters: { energy: -10, health: -4 },
        },
      },
    ],
  },
  {
    id: "int-flood-bank",
    intense: true,
    season: "summer",
    weather: ["storm"],
    locations: ["creek", "beaver-meadow"],
    triggers: ["arrive", "wait", "fish"],
    weight: 5,
    text: "The creek stands up in a single brown shoulder. A dead pine comes end-on like a ram. The bank you are on is becoming the creek. There is a count of seconds, not minutes.",
    choices: [
      {
        id: "high",
        label: "Climb for the terrace",
        check: { trait: "grit", dc: 15 },
        success: {
          text: "Water to the thigh, then the knee, then gravel that holds. The pine takes the place you were standing. You spit silt and keep moving up.",
          hours: 1,
          meters: { energy: -12, warmth: -10, health: -4 },
        },
        fail: {
          text: "It takes you off your feet and decides where you live now.",
          hours: 3,
          meters: { health: -14, warmth: -18, energy: -16 },
          inventory: { water: -1 },
          relocate: "beaver-meadow",
        },
      },
      {
        id: "tree",
        label: "Get up the nearest willow",
        outcome: {
          text: "You become a bird with poor judgment. The flood argues with the roots for an hour. You climb down into a different map.",
          hours: 2,
          meters: { energy: -10, warmth: -8 },
        },
      },
    ],
  },
  {
    id: "int-cabin-bolt",
    intense: true,
    locations: ["abandoned-cabin"],
    timeBands: ["dusk", "night"],
    triggers: ["arrive", "sleep", "search"],
    weight: 5,
    text: "The latch is already thrown from inside. A voice you do not know tells you to keep walking. The stove pipe is warm. Someone has decided this ruin is a fort, and you are the weather against it.",
    choices: [
      {
        id: "word",
        label: "Talk through the door",
        check: { trait: "savvy", dc: 14 },
        success: {
          text: "You give him the password of being tired and not a thief. The bolt slides. A kid with a dead man’s coat and a cocked rifle lets you have the floor. He will not sleep while you do.",
          hours: 1,
          presentCharacter: "ned-calhoun",
          standing: { id: "ned-calhoun", delta: 1 },
        },
        fail: {
          text: "He answers the talking with the rifle.",
          hours: 0,
          startSkirmish: {
            intro: "The cabin has one door and a man who thinks that is enough.",
            foes: [{ id: "cabin-man", name: "The man inside", hp: 15, maxHp: 15, range: "near", damage: [4, 9], art: "/art/people/ned-calhoun.jpg" }],
          },
        },
      },
      {
        id: "walk",
        label: "Keep walking",
        outcome: {
          text: "You leave him the ruin and the night. Some forts are not worth the powder.",
          hours: 1,
          presentCharacter: null,
        },
      },
    ],
  },
  {
    id: "int-cave-shift",
    intense: true,
    season: "winter",
    locations: ["talus-ice-cave"],
    triggers: ["arrive", "sleep", "shelter"],
    weight: 4,
    text: "The ice tongue shifts. A slab the size of a table lets go in the dark and the mouth of the cave becomes a smaller mouth. Rock dust. A sound like a ship grounding. The way out is a question.",
    choices: [
      {
        id: "dig",
        label: "Dig for the star you remember",
        check: { trait: "hands", dc: 15 },
        success: {
          text: "You move stone that does not want to be moved. A slit of weather. You worm through with a pack that hates you and a shoulder that will write this down for a week.",
          hours: 3,
          meters: { energy: -16, health: -8, warmth: -10 },
        },
        fail: {
          text: "The slit is a rumor. You work until the hands stop being hands. Cold does the rest of the thinking. A seam opens later, or you do not notice when it does.",
          hours: 4,
          meters: { energy: -18, warmth: -20, health: -16 },
        },
      },
      {
        id: "wait",
        label: "Sit still and save the air",
        outcome: {
          text: "You make a small life in the dark. Hours. Then a seam you can get a shoulder through. You come out older than the morning.",
          hours: 5,
          meters: { warmth: -14, energy: -12, health: -4 },
        },
      },
    ],
  },
  {
    id: "int-draw-down",
    intense: true,
    locations: ["mexican-trail-camp", "south-park-rim", "homesteader-ruin"],
    triggers: ["arrive", "scout", "hunt"],
    timeBands: ["afternoon", "dusk"],
    weight: 4,
    text: "A man on the trace has already drawn. Not all the way. Enough. He has the sun behind him and a look that has done this before. The mule behind him is loaded with someone else’s winter.",
    choices: [
      {
        id: "empty",
        label: "Show him empty hands and hold the line",
        check: { trait: "grit", dc: 14 },
        success: {
          text: "You do not flinch and you do not reach. He reads that as a kind of literacy. The iron goes back. He takes the mule around you like you were a stump he decided not to hate.",
          hours: 1,
          presentCharacter: "dutch-harrow",
        },
        fail: {
          text: "He finishes the draw.",
          hours: 0,
          startSkirmish: {
            intro: "The man on the trace has decided you are in the way of a loaded mule.",
            foes: [{ id: "trace-man", name: "The man on the trace", hp: 16, maxHp: 16, range: "near", damage: [4, 10], art: "/art/people/dutch-harrow.jpg" }],
          },
        },
      },
      {
        id: "off",
        label: "Step off the trace and let him pass",
        outcome: {
          text: "Pride is a thin blanket and you are not cold enough to need it. He goes by. The mule looks at you with honest contempt.",
          hours: 1,
          presentCharacter: null,
        },
      },
    ],
  },
];
