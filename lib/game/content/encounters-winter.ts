import type { EncounterDef } from "@/lib/game/types";

export const WINTER_ENCOUNTERS: EncounterDef[] = [
  {
    id: "win-camp-rime",
    season: "winter",
    locations: ["high-camp"],
    text: "Rime has armored the lean-to overnight. The poles are glass. Your bag is a board. Breath has made a white crust on the wool at your mouth.",
    choices: [
      {
        id: "knock",
        label: "Knock the ice off the frame",
        check: { trait: "hands", dc: 12 },
        success: {
          text: "Ice sheets fall and shatter. The roof remembers it is canvas. You will sleep less like a corpse.",
          hours: 2,
          meters: { energy: -10, warmth: 4 },
        },
        fail: {
          text: "A pole snaps with a sound like a bone. The roof sags onto your shoulder. You lash it worse than before.",
          hours: 2,
          meters: { health: -5, energy: -12, warmth: -8 },
        },
      },
      {
        id: "crawl",
        label: "Crawl in and wait for day",
        outcome: { text: "You lie still and hate the dark. Dawn is a rumor that arrives late.", hours: 3, meters: { warmth: -10, energy: 4 } },
      },
    ],
  },
  {
    id: "win-camp-silas",
    season: "winter",
    locations: ["high-camp"],
    text: "Someone is sitting on your woodpile as if rent were paid. A tin cup steams that is not tea. Silas Crowe has found you again.",
    choices: [
      {
        id: "share",
        label: "Share the fire and a ration",
        outcome: {
          text: "He talks about men who sat down in snow and looked comfortable. You keep your feet moving while you listen. He leaves you a twist of tobacco that is mostly willow.",
          hours: 2,
          inventory: { rations: -1 },
          extraAdd: "willow-tobacco",
          presentCharacter: "silas-crowe",
          standing: { id: "silas-crowe", delta: 1 },
        },
      },
      {
        id: "runoff",
        label: "Tell him to find his own sticks",
        outcome: {
          text: "He salutes with the cup. “Pride’s a thin blanket.” He takes a split of your wood on the way out.",
          hours: 1,
          inventory: { firewood: -1 },
          presentCharacter: "silas-crowe",
          standing: { id: "silas-crowe", delta: -1 },
        },
      },
    ],
  },
  {
    id: "win-creek-chop",
    season: "winter",
    locations: ["creek"],
    text: "The creek is a dirty window. Water moves under it like a trapped animal. You need a hole or you will eat snow until your guts cramp.",
    choices: [
      {
        id: "chop",
        label: "Chop a drinking hole",
        check: { trait: "hands", dc: 13 },
        success: {
          text: "The axe finds black water. You fill what you can before the hole skins over. Hands go stupid with cold.",
          hours: 2,
          inventory: { water: 2 },
          meters: { warmth: -14, energy: -8 },
        },
        fail: {
          text: "The bit glances. Ice dust in your eyes. You get a cup and a cut palm and a hatred of January.",
          hours: 2,
          inventory: { water: 1 },
          meters: { health: -4, warmth: -16, energy: -10 },
        },
      },
      {
        id: "snow",
        label: "Melt snow instead",
        outcome: { text: "It takes a fortune of wood to make a swallow. You do it anyway.", hours: 2, inventory: { firewood: -1, water: 1 }, meters: { energy: -6 } },
      },
    ],
  },
  {
    id: "win-creek-plate",
    season: "winter",
    locations: ["creek"],
    text: "A pale plate of ice roofs the fastest water. Crossing would save an hour. The ice ticks, like a clock that does not like you.",
    choices: [
      {
        id: "cross",
        label: "Cross the plate",
        check: { trait: "hands", dc: 14 },
        success: {
          text: "You keep your weight on the seams. The far bank arrives. Your heart takes a while to catch up.",
          hours: 1,
          meters: { energy: -8 },
        },
        fail: {
          text: "The plate opens its mouth. You go in to the chest. The current tries to keep you. You crawl out a different animal.",
          hours: 2,
          meters: { health: -12, warmth: -28, energy: -14 },
        },
      },
      {
        id: "bank",
        label: "Walk the long bank",
        outcome: { text: "An hour of willow and bad footing. You still have dry wool.", hours: 2, meters: { energy: -8 } },
      },
    ],
  },
  {
    id: "win-creek-ned",
    season: "winter",
    locations: ["creek"],
    text: "A city coat is kneeling at a thin place in the ice, licking melt. The boy from St. Louis does not know he is already dying of it.",
    choices: [
      {
        id: "haul",
        label: "Haul him back and make him melt snow",
        outcome: {
          text: "Ned shakes so hard his teeth argue. You put him by a twig fire until he can say thank you without biting it off.",
          hours: 2,
          inventory: { firewood: -1 },
          meters: { warmth: -8 },
          presentCharacter: "ned-calhoun",
          standing: { id: "ned-calhoun", delta: 2 },
        },
      },
      {
        id: "warn",
        label: "Yell from the bank and keep your wood",
        outcome: {
          text: "He hears you. He pretends he meant to stop. His lips are the wrong color.",
          hours: 1,
          presentCharacter: "ned-calhoun",
          standing: { id: "ned-calhoun", delta: -1 },
        },
      },
    ],
  },
  {
    id: "win-timber-circle",
    season: "winter",
    locations: ["timberline"],
    text: "Krummholz in a white bowl. Your tracks come back wearing your own boots. The pass, the camp, the creek — all the same direction, which means none.",
    choices: [
      {
        id: "read",
        label: "Read slope and wind until the country confesses",
        check: { trait: "eye", dc: 14 },
        success: {
          text: "The Front Range is a wall you can name. You find the switchback by the way the krummholz leans.",
          hours: 2,
          meters: { energy: -10, warmth: -8 },
          unlockLocation: "wind-saddle",
        },
        fail: {
          text: "You walk an hour that is a circle with opinions. Dusk comes early, as if it were helping.",
          hours: 3,
          meters: { energy: -16, warmth: -14 },
        },
      },
      {
        id: "sit",
        label: "Sit with your back to a snag and wait the light",
        outcome: { text: "Patience is a kind of navigation. The trees remember their spacing when the glare eases.", hours: 3, meters: { warmth: -12, energy: -6 } },
      },
    ],
  },
  {
    id: "win-timber-caleb",
    season: "winter",
    locations: ["timberline", "burned-timber"],
    text: "A trapline in deep snow, bait frozen to the pan. Caleb Briggs is breaking a marten out with his knife and counting shots under his breath.",
    choices: [
      {
        id: "help",
        label: "Help him reset the line",
        outcome: {
          text: "Your fingers stop being fingers. At the end he cuts you a strip that was going to be his supper. Amos, he says, is somewhere being lucky.",
          hours: 3,
          inventory: { rations: 1 },
          meters: { energy: -12, warmth: -10 },
          presentCharacter: "caleb-briggs",
          standing: { id: "caleb-briggs", delta: 1 },
        },
      },
      {
        id: "pass",
        label: "Give the line room",
        outcome: { text: "He does not look up. Winter is not a greeting season.", hours: 1 },
      },
    ],
  },
  {
    id: "win-ute-rings",
    season: "winter",
    locations: ["ute-camp"],
    text: "Lodge rings under a crust of snow. No dogs. No smoke. The band has gone to lower wintering ground and taken the year with them. The silence is an answer.",
    choices: [
      {
        id: "leave",
        label: "Leave a ration on a ring-stone and go",
        outcome: {
          text: "You set food where a door was. Wind takes the steam. You back out the way a guest backs out.",
          hours: 1,
          inventory: { rations: -1 },
        },
      },
      {
        id: "poke",
        label: "Poke the old hearths for what they forgot",
        outcome: {
          text: "A blackened awl, a twist of sinew. You feel watched by a camp that is not here.",
          hours: 1,
          extraAdd: "sinew-twist",
        },
      },
    ],
  },
  {
    id: "win-ute-hide",
    season: "winter",
    locations: ["ute-camp"],
    text: "A hide bundled in the crotch of a lodgepole, above the snow-line of last week’s blow. Tied with a knot that is not yours.",
    choices: [
      {
        id: "take",
        label: "Take the hide",
        outcome: {
          text: "Elk, smoked, heavy. You will eat. You will also be a story told in spring, if anyone comes back to tell it.",
          hours: 1,
          inventory: { pelts: 1, rations: 1 },
        },
      },
      {
        id: "leave",
        label: "Leave the cache",
        outcome: { text: "Someone counted on this tree. You walk around that fact.", hours: 1 },
      },
    ],
  },
  {
    id: "win-cabin-knock",
    season: "winter",
    locations: ["abandoned-cabin"],
    text: "Smoke from the stovepipe, thin as a lie. The door is barred. Someone is rationing heat the way other people ration powder.",
    choices: [
      {
        id: "talk",
        label: "Talk your way in",
        check: { trait: "savvy", dc: 13 },
        success: {
          text: "You name the wood you can cut and the hours you will not snore. Eliza unbars. The stove hits you like a verdict you won.",
          hours: 1,
          meters: { warmth: 18 },
          presentCharacter: "eliza-ward",
          standing: { id: "eliza-ward", delta: 1 },
        },
        fail: {
          text: "Your voice sounds like hunger with manners. The bar stays. She tells you the lean-to is east if you can find east.",
          hours: 1,
          meters: { warmth: -8 },
          presentCharacter: "eliza-ward",
          standing: { id: "eliza-ward", delta: -1 },
        },
      },
      {
        id: "wood",
        label: "Stack wood by the door and wait",
        outcome: {
          text: "You work until your hands shake. The door opens the width of a plate. “One night. You know where the axe lives.”",
          hours: 3,
          inventory: { firewood: -2 },
          meters: { energy: -12, warmth: 12 },
          presentCharacter: "eliza-ward",
          standing: { id: "eliza-ward", delta: 1 },
        },
      },
    ],
  },
  {
    id: "win-cabin-stove",
    season: "winter",
    locations: ["abandoned-cabin"],
    text: "Inside, the stove is a small red animal. Eliza watches how you feed it. Too much wood is theft. Too little is a funeral.",
    choices: [
      {
        id: "feed",
        label: "Feed it like she does, mean and even",
        check: { trait: "savvy", dc: 12 },
        success: {
          text: "She nods once. That is the whole hymn. She pushes a tin of beans where you can reach it and does not comment on your manners.",
          hours: 2,
          meters: { warmth: 16, hunger: 12 },
          presentCharacter: "eliza-ward",
          standing: { id: "eliza-ward", delta: 1 },
        },
        fail: {
          text: "You choke it. Smoke backs into the room. Eliza opens the door on purpose and you both freeze for a lesson.",
          hours: 2,
          meters: { warmth: -6, energy: -8 },
          presentCharacter: "eliza-ward",
          standing: { id: "eliza-ward", delta: -1 },
        },
      },
      {
        id: "pelt",
        label: "Offer a pelt for the right to sit",
        outcome: {
          text: "She sniffs it, files it, points at the floor. “You snore, you sleep in the snow.” The stove keeps its opinions to itself.",
          hours: 1,
          inventory: { pelts: -1 },
          meters: { warmth: 20 },
          presentCharacter: "eliza-ward",
        },
      },
    ],
  },
  {
    id: "win-cabin-thief",
    season: "winter",
    locations: ["abandoned-cabin", "cache-deadfall"],
    text: "A man is at your pack with a knife that has been sharpened past sense. His cheeks are gone to bone. He does not look like a villain. He looks like January.",
    choices: [
      {
        id: "fight",
        label: "Stop him",
        outcome: {
          text: "He comes anyway. Hunger has already decided.",
          hours: 1,
          startSkirmish: {
            intro: "The starving man would rather die with your rations than without them.",
            foes: [{ id: "thief", name: "Starving thief", hp: 10, maxHp: 10, range: "close", damage: [2, 6] }],
          },
        },
      },
      {
        id: "share",
        label: "Throw him a ration and step off",
        outcome: {
          text: "He eats on his knees in the snow. He does not thank you. He does not have the spare blood for it. He is gone before the grease cools.",
          hours: 1,
          inventory: { rations: -1 },
        },
      },
    ],
  },
  {
    id: "win-pass-hennepin",
    season: "winter",
    locations: ["south-pass"],
    text: "A Company man is nailing a notice to a snag the wind has already filed. The paper clatters. Hennepin’s ink has frozen in the pen and he is still smiling.",
    choices: [
      {
        id: "read",
        label: "Read the notice",
        outcome: {
          text: "Debts do not hibernate. Unlicensed plews. Provisions against a mark in a book. He offers you flour that tastes like a leash.",
          hours: 1,
          presentCharacter: "hennepin",
        },
      },
      {
        id: "walk",
        label: "Walk past the paper",
        outcome: { text: "January is not a contracting season unless you are already owned.", hours: 1 },
      },
    ],
  },
  {
    id: "win-pass-mule",
    season: "winter",
    locations: ["south-pass"],
    text: "A mule is kneeling in a drift as if it were praying. It is not. The pack is iced to the hide. No person is attached.",
    choices: [
      {
        id: "cut",
        label: "Cut meat before the wolves file a claim",
        check: { trait: "hands", dc: 13 },
        success: {
          text: "The work is ugly and honest. You take what will keep and a shoe that might be iron enough to strike spark.",
          hours: 3,
          inventory: { rations: 2 },
          extraAdd: "mule-shoe",
          meters: { energy: -12, warmth: -12 },
        },
        fail: {
          text: "The carcass is a rock. You dull the knife and come away with a handful of frozen fat and a hatred of tools.",
          hours: 3,
          inventory: { rations: 1 },
          meters: { energy: -14, warmth: -14 },
        },
      },
      {
        id: "leave",
        label: "Leave the tithe",
        outcome: { text: "The pass keeps what it is owed. You keep your hours.", hours: 1 },
      },
    ],
  },
  {
    id: "win-beaver-ice",
    season: "winter",
    locations: ["beaver-meadow"],
    text: "The pond is a lid. Lodge vents breathe faint heat. Walking it would be a shortcut. The ice is black at the channels, white where it lies.",
    choices: [
      {
        id: "walk",
        label: "Walk the lid",
        check: { trait: "eye", dc: 13 },
        success: {
          text: "You stay over the old ice, off the channels. The far willows arrive. A slap under the lid follows you out.",
          hours: 1,
          meters: { energy: -6 },
        },
        fail: {
          text: "A channel. You go in to the belt. The meadow tries to keep a boot. You give it the boot’s pride and crawl.",
          hours: 2,
          meters: { health: -8, warmth: -26, energy: -12 },
        },
      },
      {
        id: "around",
        label: "Flounder the drowned timber instead",
        outcome: { text: "Slower. Drier. The lodges keep their church.", hours: 2, meters: { energy: -10 } },
      },
    ],
  },
  {
    id: "win-beaver-trap",
    season: "winter",
    locations: ["beaver-meadow"],
    text: "A drowned set, frozen in. Something dark in the ice like a saint. Jean-Baptiste’s church, if he were here. He is not. The Company is not either.",
    choices: [
      {
        id: "chop",
        label: "Chop the animal out",
        check: { trait: "hands", dc: 14 },
        success: {
          text: "You take a pelt that will not dry until April and meat that will. Your axe-hand stops belonging to you for an hour.",
          hours: 3,
          inventory: { rations: 1, pelts: 1 },
          meters: { warmth: -16, energy: -12 },
        },
        fail: {
          text: "The ice holds. You hold less. You quit before the creek writes its name up your arm.",
          hours: 2,
          meters: { warmth: -18, energy: -10 },
        },
      },
      {
        id: "leave",
        label: "Leave the set",
        outcome: { text: "Some meat is priced in fingers. You still have yours.", hours: 1 },
      },
    ],
  },
  {
    id: "win-burn-wind",
    season: "winter",
    weather: ["wind"],
    locations: ["burned-timber"],
    text: "The burn has no wall. Wind comes through the black spars as if the mountain were breathing out. Charcoal grit in your teeth. No place to put a fire that will live.",
    choices: [
      {
        id: "char",
        label: "Scrape charcoal and get low behind a stump",
        outcome: {
          text: "You make a mean little heat that tastes like the old fire. It is not comfort. It is not dying quite yet.",
          hours: 2,
          inventory: { firewood: 1 },
          meters: { warmth: -8, energy: -8 },
        },
      },
      {
        id: "push",
        label: "Push for timberline without stopping",
        check: { trait: "grit", dc: 13 },
        success: { text: "You come out of the burn ringing. The living trees look like a country.", hours: 2, meters: { energy: -12, warmth: -10 }, unlockLocation: "timberline" },
        fail: { text: "The wind puts you down once. You get up slower. The spars keep their opinions.", hours: 3, meters: { health: -6, energy: -16, warmth: -16 } },
      },
    ],
  },
  {
    id: "win-chute-amos",
    season: "winter",
    locations: ["avalanche-chute"],
    text: "Amos Briggs is grinning at a loaded slope as if luck were a tool. The cornice hangs like a held breath. Caleb is not here to refuse for him.",
    choices: [
      {
        id: "pull",
        label: "Pull him off the break line",
        check: { trait: "grit", dc: 13 },
        success: {
          text: "You get a fist in his coat. He laughs too loud and then does not. You both live. He owes you the quiet kind of debt.",
          hours: 2,
          presentCharacter: "amos-briggs",
          standing: { id: "amos-briggs", delta: 2 },
        },
        fail: {
          text: "Snow moves. Not the mountain — a slab the size of a wagon door. You ride debris and come out uglier. Amos is very sorry.",
          hours: 3,
          meters: { health: -14, energy: -16, warmth: -18 },
          presentCharacter: "amos-briggs",
        },
      },
      {
        id: "no",
        label: "Refuse the chute and make him walk around",
        outcome: {
          text: "He looks briefly like a man who has been refused before. “Caleb said you’d say that.” You take the long way and keep your ribs.",
          hours: 2,
          presentCharacter: "amos-briggs",
          standing: { id: "amos-briggs", delta: 1 },
        },
      },
    ],
  },
  {
    id: "win-chute-runout",
    season: "winter",
    locations: ["avalanche-chute"],
    text: "The chute has already fired. A tongue of dirty snow, snapped trees, a boot that still has a foot’s opinion in it. The air smells like broken fir.",
    choices: [
      {
        id: "poke",
        label: "Poke the debris for what it took",
        outcome: {
          text: "A powder horn, cracked. A strip of blanket. No one answers when you call. You take the horn’s last charges and do not make a speech.",
          hours: 2,
          inventory: { powder: 1 },
          extraAdd: "torn-blanket",
          meters: { energy: -8, warmth: -8 },
        },
      },
      {
        id: "go",
        label: "Get off the runout",
        outcome: { text: "The slope can fire twice. You still have legs that work.", hours: 1 },
      },
    ],
  },
  {
    id: "win-spring-soak",
    season: "winter",
    locations: ["hot-spring"],
    text: "Steam stands in the cold like a building. The pools are a kindness that will undress you and then send you into January wet. The stones are slick with mineral.",
    choices: [
      {
        id: "short",
        label: "A short soak, then dry like your life depends on it",
        outcome: {
          text: "Heat enters the places winter stored itself. You dress before the steam finishes lying. For an hour you are a person.",
          hours: 2,
          meters: { warmth: 24, energy: 8, health: 6 },
        },
      },
      {
        id: "skip",
        label: "Only fill water and keep your wool dry",
        outcome: { text: "The spring shrugs. You leave with full skins and an unconvinced body.", hours: 1, inventory: { water: 2 } },
      },
    ],
  },
  {
    id: "win-spring-sleep",
    season: "winter",
    locations: ["hot-spring"],
    text: "Your eyes want to close in the hottest pool. Men have done it. Some of them are still here, in the way stories are still here. The mule-trail above is empty.",
    choices: [
      {
        id: "out",
        label: "Get out while you can still stand",
        outcome: { text: "The air is a slap. You dress cursing. Cursing is a sign of life.", hours: 1, meters: { warmth: 8, energy: -4 } },
      },
      {
        id: "stay",
        label: "Close your eyes in the steam",
        outcome: {
          text: "Warmth becomes a room with no door. You do not get up. January writes the rest.",
          hours: 1,
          death: { cause: "exposure", detail: "You slept in the hot spring and went into the cold already wet. The mountain kept you." },
        },
      },
    ],
  },
  {
    id: "win-wallow-yard",
    season: "winter",
    locations: ["elk-wallow"],
    text: "Elk have yarded in the willow, a dark herd packed for heat. Breath like a little factory. Too many eyes. One clean shot would be a winter. One bad shot would be a stampede.",
    choices: [
      {
        id: "stalk",
        label: "Stalk the edge for a standing shot",
        check: { trait: "eye", dc: 15 },
        success: {
          text: "A cow drops. The rest go like weather. You will be heavy and greasy and alive for days if you can keep the meat from freezing to the ground.",
          hours: 5,
          inventory: { rations: 4, pelts: 1, powder: -1 },
          meters: { energy: -20, warmth: -12 },
        },
        fail: {
          text: "The yard empties as if you had shouted. Powder gone into white. You walk back lighter.",
          hours: 4,
          inventory: { powder: -1 },
          meters: { energy: -16, warmth: -10 },
        },
      },
      {
        id: "leave",
        label: "Leave the yard its heat",
        outcome: { text: "Hunger files a complaint. You still have powder. The marriage continues.", hours: 1 },
      },
    ],
  },
  {
    id: "win-wallow-wolves",
    season: "winter",
    locations: ["elk-wallow", "grizzly-basin"],
    text: "Wolves have opened an elk. Ribs like a wrecked boat. They lift their heads as if you were a second course that walked in on purpose.",
    choices: [
      {
        id: "hold",
        label: "Hold the kill",
        outcome: {
          text: "They do not debate for long.",
          hours: 1,
          startSkirmish: {
            intro: "Two wolves decide you are meat that still argues.",
            foes: [
              { id: "wolf-1", name: "Lean wolf", hp: 11, maxHp: 11, range: "near", damage: [3, 7] },
              { id: "wolf-2", name: "Scarred wolf", hp: 12, maxHp: 12, range: "close", damage: [3, 8] },
            ],
          },
        },
      },
      {
        id: "cede",
        label: "Cede the carcass and back out",
        outcome: { text: "You become landscape. They go back to being hungry, which is their whole profession.", hours: 1, meters: { energy: -4 } },
      },
    ],
  },
  {
    id: "win-saddle-crawl",
    season: "winter",
    weather: ["wind"],
    locations: ["wind-saddle"],
    text: "Nothing grows higher than your knee. The wind has filed the snow into knives. Standing up is a way to get lost. The saddle wants you on all fours.",
    choices: [
      {
        id: "crawl",
        label: "Crawl the last hundred yards",
        check: { trait: "grit", dc: 14 },
        success: {
          text: "You eat rime and keep a bearing on a rock that looks like a rock. The far drop arrives. You still have a face.",
          hours: 2,
          meters: { energy: -14, warmth: -16 },
          unlockLocation: "south-pass",
        },
        fail: {
          text: "The wind puts you down and turns you. You crawl back the way you came with a mouth full of ice.",
          hours: 3,
          meters: { health: -8, energy: -16, warmth: -22 },
        },
      },
      {
        id: "wait",
        label: "Go to ground until the wind gets bored",
        outcome: { text: "Hours. You become a drift with a pulse. The wind does not get bored. It does get slightly less interested.", hours: 4, meters: { warmth: -18, energy: -8 } },
      },
    ],
  },
  {
    id: "win-fall-cross",
    season: "winter",
    locations: ["frozen-fall"],
    text: "The fall is a pillar. To pass behind it is a rumor of a cave. The ice is ribbed like a plow. One bad step is a story they will not find until June.",
    choices: [
      {
        id: "behind",
        label: "Work behind the pillar",
        check: { trait: "hands", dc: 15 },
        success: {
          text: "You keep three points on the ice. The talus throat opens. Cold air like a cellar that has never heard of spring.",
          hours: 2,
          meters: { energy: -12, warmth: -10 },
          unlockLocation: "talus-ice-cave",
        },
        fail: {
          text: "A rib of ice lets go. You drop to the pool’s lid and lie there until your breath decides to continue.",
          hours: 2,
          meters: { health: -12, warmth: -16, energy: -12 },
        },
      },
      {
        id: "around",
        label: "Take the long rocks",
        outcome: { text: "Slower. You keep your bones in their original arrangement.", hours: 2, meters: { energy: -8 } },
      },
    ],
  },
  {
    id: "win-fall-groan",
    season: "winter",
    locations: ["frozen-fall"],
    text: "The pillar groans. A slab the size of a cabin door leans toward the pool. You can hear water working inside the ice like a trapped mill.",
    choices: [
      {
        id: "off",
        label: "Get off the ice",
        outcome: { text: "It falls where you were. The pool becomes a wound. You are not in it.", hours: 1, meters: { energy: -6 } },
      },
      {
        id: "watch",
        label: "Watch from too close",
        check: { trait: "eye", dc: 12 },
        success: { text: "You read the crack and step off a breath early. Spray soaks you. January notices.", hours: 1, meters: { warmth: -18 } },
        fail: {
          text: "Spray and ice find you. A rib complains. So does the rest of you.",
          hours: 1,
          meters: { health: -10, warmth: -20 },
        },
      },
    ],
  },
  {
    id: "win-pine-peggy",
    season: "winter",
    locations: ["lightning-pine"],
    text: "The split pine wears a beard of rime. Someone has recut a blaze through four inches of ice. Peggy Dunne is already here, knife in a mitten, as if weather were an argument she intended to win.",
    choices: [
      {
        id: "hail",
        label: "Hail her and offer a ration for the deadfall’s news",
        outcome: {
          text: "She looks pleased and untrusting in equal measure. “Cache is under a drift a child could miss. Don’t miss it.”",
          hours: 1,
          inventory: { rations: -1 },
          presentCharacter: "peggy-dunne",
          standing: { id: "peggy-dunne", delta: 1 },
          unlockLocation: "cache-deadfall",
        },
      },
      {
        id: "by",
        label: "Pass by",
        outcome: { text: "She does not stop cutting. The pine keeps both of your names, or neither.", hours: 1 },
      },
    ],
  },
  {
    id: "win-pine-pitch",
    season: "winter",
    locations: ["lightning-pine"],
    text: "The dead top of the split pine is fat with pitch, gold under the rime. Enough to start a fire in a baptism. Your hatchet will hate you.",
    choices: [
      {
        id: "split",
        label: "Split it out",
        outcome: {
          text: "The steel sings and then dulls. You pocket gold that burns. Fingers come back from being wood.",
          hours: 2,
          inventory: { firewood: 2 },
          extraAdd: "fatwood",
          meters: { energy: -10, warmth: -8 },
        },
      },
      {
        id: "mark",
        label: "Blaze it and come back",
        outcome: { text: "You will forget, or you will not. The stump stays. So does January.", hours: 1 },
      },
    ],
  },
  {
    id: "win-trail-empty",
    season: "winter",
    locations: ["mexican-trail-camp"],
    text: "Cart ruts under crust. A stone ring filled with snow. No mules, no chile, no bell. The Taos trace is a theory until the passes remember how to be roads.",
    choices: [
      {
        id: "dig",
        label: "Dig the ring for what the traders left",
        outcome: {
          text: "A broken cinch ring and a twist of chile stem that smells like a town you cannot walk to. You chew it anyway.",
          hours: 2,
          meters: { hunger: 4, energy: -8 },
          extraAdd: "chile-stem",
        },
      },
      {
        id: "go",
        label: "Do not waste the daylight",
        outcome: { text: "Empty camps are a kind of weather. You keep moving.", hours: 1 },
      },
    ],
  },
  {
    id: "win-trail-bag",
    season: "winter",
    locations: ["mexican-trail-camp"],
    text: "A saddlebag iced to a sage stump, mule-gnawed. Whoever owned it went toward the rim or toward a grave. The leather cracks when you touch it.",
    choices: [
      {
        id: "open",
        label: "Open it",
        outcome: {
          text: "Weevily flour frozen into a brick, a letter in Spanish you can only guess at, and a saint’s medal worn smooth.",
          hours: 1,
          inventory: { rations: 1 },
          extraAdd: "taos-medal",
        },
      },
      {
        id: "leave",
        label: "Leave the bag",
        outcome: { text: "Someone’s luck is still sitting there. You do not inherit it.", hours: 1 },
      },
    ],
  },
  {
    id: "win-arapaho-empty",
    season: "winter",
    locations: ["arapaho-ground"],
    text: "The park is a white plate to the horizon. Lodge poles gone. A dog skull on a stick wears a cap of rime. You are a guest on ground that has not invited you this season.",
    choices: [
      {
        id: "gift",
        label: "Leave a ration and keep to the edge",
        outcome: {
          text: "You set food on a stone and do not linger. The park watches you do it, or it does not. Either way you behave.",
          hours: 1,
          inventory: { rations: -1 },
        },
      },
      {
        id: "cross",
        label: "Cut the park for time",
        check: { trait: "eye", dc: 13 },
        success: {
          text: "You keep a bearing on a far snag. The rim arrives like a rumor that turned out true.",
          hours: 3,
          meters: { energy: -12, warmth: -12 },
          unlockLocation: "south-park-rim",
        },
        fail: {
          text: "White on white. An hour becomes three. You find your own tracks and call it a pilgrimage.",
          hours: 4,
          meters: { energy: -16, warmth: -16 },
        },
      },
    ],
  },
  {
    id: "win-cache-dig",
    season: "winter",
    locations: ["cache-deadfall"],
    text: "The deadfall is a drift with a rumor inside. Peggy’s knot, or last fall’s, or a magpie’s idea of a joke. The ground is iron.",
    choices: [
      {
        id: "dig",
        label: "Dig",
        check: { trait: "grit", dc: 13 },
        success: {
          text: "A tin. Two fingers of powder, a cake that could break a tooth, and a note: If you take, replace. — P.D.",
          hours: 3,
          inventory: { powder: 1, rations: 1 },
          meters: { energy: -14, warmth: -10 },
        },
        fail: {
          text: "You dig a hole that is only a hole. Fingers go wooden. The cache keeps its counsel.",
          hours: 3,
          meters: { energy: -14, warmth: -14 },
        },
      },
      {
        id: "mark",
        label: "Mark it and come back with a better tool",
        outcome: { text: "You blaze a snag you will see if the next blow does not eat it.", hours: 1 },
      },
    ],
  },
  {
    id: "win-cache-dutch",
    season: "winter",
    locations: ["cache-deadfall", "homesteader-ruin"],
    text: "A bay horse is standing three-legged in a draw, head down, iced at the whiskers. Dutch Harrow is trying to kick life into it and smiling like a man whose lies have frozen too.",
    choices: [
      {
        id: "mercy",
        label: "Tell him the horse is already gone",
        check: { trait: "savvy", dc: 12 },
        success: {
          text: "The smile thins. He cuts the saddlebags and tosses you jerky that may have been someone else’s. “Forget my face.” He walks. The horse does not.",
          hours: 1,
          inventory: { rations: 1 },
          presentCharacter: "dutch-harrow",
          standing: { id: "dutch-harrow", delta: 1 },
        },
        fail: {
          text: "He tells you to mind your sermons. The pistol is not a joke. You mind them.",
          hours: 1,
          presentCharacter: "dutch-harrow",
          standing: { id: "dutch-harrow", delta: -1 },
        },
      },
      {
        id: "walk",
        label: "Walk wide",
        outcome: { text: "A thief and a dying horse are a kind of weather. You do not need to stand in it.", hours: 1 },
      },
    ],
  },
  {
    id: "win-cave-meat",
    season: "winter",
    locations: ["talus-ice-cave"],
    text: "The throat holds last year’s ice and last autumn’s elk, stacked like lumber. Frozen through. A gift if you have an axe. A tomb if you linger.",
    choices: [
      {
        id: "cut",
        label: "Cut what you can carry",
        check: { trait: "hands", dc: 13 },
        success: {
          text: "You take a day’s meat and leave the rest to the dark. Your breath is a flag you follow out.",
          hours: 2,
          inventory: { rations: 2 },
          meters: { warmth: -14, energy: -10 },
        },
        fail: {
          text: "The axe bounces. You nicked frozen hide and a finger. The cave keeps the roast.",
          hours: 2,
          meters: { health: -5, warmth: -16, energy: -10 },
        },
      },
      {
        id: "out",
        label: "Get out of the cold throat",
        outcome: { text: "Daylight feels invented. You take the feeling and go.", hours: 1 },
      },
    ],
  },
  {
    id: "win-cave-sleep",
    season: "winter",
    locations: ["talus-ice-cave"],
    text: "The cave is still. No wind. A man could sleep here and call it shelter. The ice would not argue. It would only wait.",
    choices: [
      {
        id: "fire",
        label: "Build a small fire near the mouth and do not lie down deep",
        outcome: {
          text: "Smoke finds the crack. Heat finds your hands. You doze sitting up like a soldier. Dawn is a gray coin.",
          hours: 4,
          inventory: { firewood: -1 },
          meters: { warmth: 6, energy: 8 },
        },
      },
      {
        id: "deep",
        label: "Crawl into the ice and sleep",
        outcome: {
          text: "The dark is a blanket that does not give heat back. You do not wake as a person who can walk.",
          hours: 2,
          death: { cause: "exposure", detail: "You slept in the talus ice cave. The cold there does not negotiate." },
        },
      },
    ],
  },
  {
    id: "win-ruin-hannah",
    season: "winter",
    locations: ["homesteader-ruin", "abandoned-cabin"],
    text: "Hannah Briggs has a man’s feet in a pan of snowmelt and a look that could stitch a lie shut. “Frostbite. If you are not bleeding, wait. If you are, sit still and do not make a speech.”",
    choices: [
      {
        id: "wood",
        label: "Pay in firewood and sit still",
        outcome: {
          text: "She works fast and mean and good. The feet will hurt later, which means they are still in the conversation.",
          hours: 2,
          inventory: { firewood: -2 },
          meters: { health: 14, warmth: 10 },
          presentCharacter: "hannah-briggs",
          standing: { id: "hannah-briggs", delta: 1 },
        },
      },
      {
        id: "talk",
        label: "Try to talk your way into free care",
        check: { trait: "savvy", dc: 15 },
        success: {
          text: "She snorts, then wraps the blackening toes anyway. “You can owe me a birth I will never ask you to attend.”",
          hours: 2,
          meters: { health: 10, warmth: 6 },
          presentCharacter: "hannah-briggs",
          standing: { id: "hannah-briggs", delta: 1 },
        },
        fail: {
          text: "“Speeches.” She points at the weather. The mountain will be your surgeon.",
          hours: 1,
          presentCharacter: "hannah-briggs",
          standing: { id: "hannah-briggs", delta: -1 },
        },
      },
    ],
  },
  {
    id: "win-ruin-martha",
    season: "winter",
    locations: ["homesteader-ruin"],
    text: "Martha Keene is chopping at a well that has become a plug of ice. Her hands are red past sense. “Not that one even if you get through. Sheep died. The other seep still moves if you listen.”",
    choices: [
      {
        id: "heed",
        label: "Follow her to the seep",
        outcome: {
          text: "A thread of iron water under a shelf of snow. You fill. She accepts no pay but your attention.",
          hours: 2,
          inventory: { water: 2 },
          presentCharacter: "martha-keene",
          standing: { id: "martha-keene", delta: 1 },
        },
      },
      {
        id: "chop",
        label: "Chop the well anyway",
        outcome: {
          text: "You get a swallow that tastes of old wool and worse. By night your guts are a war. Martha does not say she told you so.",
          hours: 3,
          inventory: { water: 1 },
          meters: { health: -16, energy: -12 },
          presentCharacter: "martha-keene",
          standing: { id: "martha-keene", delta: -1 },
        },
      },
    ],
  },
  {
    id: "win-basin-frost",
    season: "winter",
    locations: ["grizzly-basin"],
    text: "A palm, held up: stop. Frost on Antler is a dark cut in the willow. Down-slope, a hole in the snow breathes. Something large is sleeping with one ear open.",
    choices: [
      {
        id: "back",
        label: "Back out the way he indicates",
        outcome: {
          text: "You both leave the basin to whatever owns it today. Later a grouse hits the snow at your feet and he is already gone.",
          hours: 2,
          inventory: { rations: 1 },
          standing: { id: "frost-on-antler", delta: 1 },
          presentCharacter: null,
        },
      },
      {
        id: "look",
        label: "Look anyway",
        check: { trait: "eye", dc: 13 },
        success: {
          text: "You see the shoulder in the hole and choose life. His mouth twitches. Respect, maybe. Or contempt that you needed to see it.",
          hours: 2,
          presentCharacter: "frost-on-antler",
          standing: { id: "frost-on-antler", delta: 1 },
        },
        fail: {
          text: "Snow dumps from a willow. The hole goes quiet in a way that is not sleep. You leave faster than dignity prefers.",
          hours: 2,
          meters: { energy: -16, warmth: -10 },
          presentCharacter: "frost-on-antler",
        },
      },
    ],
  },
  {
    id: "win-basin-quiet",
    season: "winter",
    locations: ["grizzly-basin"],
    text: "The basin is a white bowl that swallows sound. No elk. No bird. Your own breath is loud enough to be a fool. Starvation country with a pretty name.",
    choices: [
      {
        id: "glass",
        label: "Glass the willow for a long time",
        check: { trait: "eye", dc: 14 },
        success: {
          text: "A snowshoe hare, white on white. You take it with a stick and shame. Meat is meat.",
          hours: 3,
          inventory: { rations: 1 },
          meters: { energy: -10, warmth: -10 },
        },
        fail: {
          text: "Nothing moves that is food. The bowl keeps its emptiness. You leave lighter.",
          hours: 3,
          meters: { energy: -12, warmth: -12 },
        },
      },
      {
        id: "go",
        label: "Do not spend the day on a pretty grave",
        outcome: { text: "Wisdom tastes like nothing. You walk while you still can.", hours: 1 },
      },
    ],
  },
  {
    id: "win-rim-shot",
    season: "winter",
    locations: ["south-park-rim"],
    weather: ["clear"],
    text: "A rare hard blue. The park is a rumor of easier country. Antelope like spilled grain, too far. The glare off the snow is a kind of knife.",
    choices: [
      {
        id: "stalk",
        label: "Stalk the long way",
        check: { trait: "eye", dc: 15 },
        success: {
          text: "One animal drops. You will be heavy and glad and snow-blind around the edges. You squint home with meat.",
          hours: 5,
          inventory: { rations: 3, pelts: 1, powder: -1 },
          meters: { energy: -18, warmth: -8, health: -3 },
        },
        fail: {
          text: "The park empties. The glare stays. Your eyes water and then burn. Powder gone into distance.",
          hours: 4,
          inventory: { powder: -1 },
          meters: { energy: -14, health: -4 },
        },
      },
      {
        id: "save",
        label: "Save the powder and shade your eyes",
        outcome: { text: "Hunger and ammunition have a long marriage. You keep both arguments for another day.", hours: 1 },
      },
    ],
  },
  {
    id: "win-blizzard-whiteout",
    season: "winter",
    weather: ["blizzard"],
    locations: "any",
    text: "The world erases itself. Up and down swap. Your tracks fill as you make them. Travel now is how stories end.",
    choices: [
      {
        id: "bear",
        label: "Take a bearing off the wind and crawl",
        check: { trait: "eye", dc: 15 },
        success: {
          text: "The wind has a direction even when the land does not. You come out in timber you can name, shaking, alive.",
          hours: 3,
          meters: { energy: -16, warmth: -18 },
        },
        fail: {
          text: "You walk in a circle that does not admit it. When the white thins you are nowhere you meant, poorer by hours and heat.",
          hours: 5,
          meters: { energy: -20, warmth: -24, health: -6 },
        },
      },
      {
        id: "hole",
        label: "Dig a snow hole and wait it out",
        outcome: {
          text: "You bury yourself like a sane animal. Time becomes a rumor. You come out stiff and still numbered among the living.",
          hours: 6,
          meters: { warmth: -14, energy: -8, hunger: -8 },
        },
      },
    ],
  },
  {
    id: "win-blizzard-camp",
    season: "winter",
    weather: ["blizzard"],
    locations: ["high-camp"],
    text: "The blizzard finds the lean-to and tries to file it. Canvas drums. Poles work in their lashings. The fire is a coin you can spend or lose.",
    choices: [
      {
        id: "bank",
        label: "Bank the fire and hold the canvas",
        check: { trait: "hands", dc: 13 },
        success: {
          text: "You keep a red eye in the ashes and a roof that is still a roof. Dawn is a gray insult you are glad to see.",
          hours: 5,
          inventory: { firewood: -2 },
          meters: { warmth: 4, energy: -14 },
        },
        fail: {
          text: "A lashing goes. Snow comes in like a thief. You spend the night as a drift with a pulse.",
          hours: 5,
          meters: { warmth: -20, energy: -16, health: -6 },
        },
      },
      {
        id: "fatwood",
        label: "Burn the last of the fatwood to keep a flame",
        outcome: {
          text: "Pitch light, mean and holy. The blizzard does not care. You do. The fatwood is a memory.",
          hours: 4,
          inventory: { firewood: -1 },
          extraRemove: "fatwood",
          meters: { warmth: 8, energy: -10 },
        },
      },
    ],
  },
  {
    id: "win-blizzard-saddle",
    season: "winter",
    weather: ["blizzard"],
    locations: ["wind-saddle"],
    text: "On the saddle the blizzard is not weather. It is the whole occupation of the air. You cannot see your gloves. You can hear the pass, or you imagine you can.",
    choices: [
      {
        id: "down",
        label: "Turn downhill before you lose the idea of downhill",
        check: { trait: "grit", dc: 14 },
        success: {
          text: "You fall more than you walk. Timber catches you like a rude kindness.",
          hours: 3,
          meters: { energy: -16, warmth: -20, health: -4 },
          unlockLocation: "timberline",
        },
        fail: {
          text: "You go sideways into a chute of crust and come out with a knee that will complain until thaw.",
          hours: 4,
          meters: { health: -12, energy: -18, warmth: -22 },
        },
      },
      {
        id: "bury",
        label: "Bury yourself in the lee of a boulder",
        outcome: { text: "The wind hunts above. You count breaths because counting is a job. Hours go. You remain.", hours: 6, meters: { warmth: -16, energy: -10 } },
      },
    ],
  },
  {
    id: "win-blizzard-pass",
    season: "winter",
    weather: ["blizzard"],
    locations: ["south-pass", "south-park-rim"],
    text: "The overlook has no overlook. The idea of Taos is a white roar. A cairn you used for a bearing is gone, or you are.",
    choices: [
      {
        id: "cairn",
        label: "Find the cairn by memory and sit it out",
        check: { trait: "eye", dc: 14 },
        success: {
          text: "Your shin finds rock. You huddle on the lee side and wait for the world to have edges again.",
          hours: 4,
          meters: { warmth: -14, energy: -10 },
        },
        fail: {
          text: "No cairn. You sit anyway, which is how men become landmarks. When it thins you are a mile wrong and still here.",
          hours: 5,
          meters: { warmth: -20, energy: -14, health: -6 },
        },
      },
      {
        id: "back",
        label: "Turn back into whatever you last knew",
        outcome: { text: "Pride can starve. You crawl toward a memory of timber.", hours: 3, meters: { energy: -12, warmth: -16 } },
      },
    ],
  },
  {
    id: "win-oneshot-frozen",
    season: "winter",
    locations: "any",
    text: "A man sits against a lodgepole with his hat on and his eyes open. He looks rested. The snow has begun to make him a part of the trunk. His coat is better than yours.",
    choices: [
      {
        id: "coat",
        label: "Take the coat",
        outcome: {
          text: "It comes off like a board. You put it on over your own. Warmth is a theft you will not apologize to the weather for.",
          hours: 1,
          meters: { warmth: 12 },
          extraAdd: "dead-mans-coat",
        },
      },
      {
        id: "bury",
        label: "Cover his face and leave the coat",
        outcome: {
          text: "You do a small correct thing with numb hands. The tree keeps him. You keep the hour.",
          hours: 2,
          meters: { energy: -8, warmth: -6 },
        },
      },
    ],
  },
  {
    id: "win-oneshot-snowblind",
    season: "winter",
    weather: ["clear"],
    locations: ["wind-saddle", "south-pass", "south-park-rim"],
    text: "A man is walking with a rag on his eyes, calling for a mule that is not answering. Snow-glare has cooked him. He turns toward your voice like a plant.",
    choices: [
      {
        id: "lead",
        label: "Lead him to timber and shade",
        outcome: {
          text: "He holds your sleeve and talks to a wife who is in Missouri. In the trees he sits and shakes. He gives you a strip of jerky he can no longer see to eat.",
          hours: 3,
          inventory: { rations: 1 },
          extraAdd: "snow-rag",
          meters: { energy: -10 },
        },
      },
      {
        id: "point",
        label: "Point him downhill and keep your hours",
        outcome: { text: "He thanks a direction. You do not watch him go. That is on both of you.", hours: 1 },
      },
    ],
  },
  {
    id: "win-oneshot-kettle",
    season: "winter",
    locations: ["homesteader-ruin", "abandoned-cabin", "high-camp"],
    text: "A woman with an empty kettle is standing in the snow as if a door might appear. She asks if you have meal. She does not ask as if she expects yes.",
    choices: [
      {
        id: "give",
        label: "Give her a ration",
        outcome: {
          text: "She puts it in the kettle like a sacrament and does not cry. She tells you the ruin’s chimney still draws if you block the west crack.",
          hours: 1,
          inventory: { rations: -1 },
          unlockLocation: "homesteader-ruin",
        },
      },
      {
        id: "none",
        label: "Show empty hands",
        outcome: { text: "She nods as if you had confirmed a weather report. She goes on with the kettle.", hours: 1 },
      },
    ],
  },
  {
    id: "win-oneshot-mute",
    season: "winter",
    locations: ["timberline", "lightning-pine", "burned-timber"],
    text: "A trapper with no ears to speak of — frost took them — holds up a marten and two fingers. Trade. His mouth works. No sound comes. He seems used to that.",
    choices: [
      {
        id: "powder",
        label: "Trade powder for the pelt",
        outcome: {
          text: "He nods like a gavel. The marten is poor and real. He points at the chute and shakes his head hard enough to be a map.",
          hours: 1,
          inventory: { powder: -1, pelts: 1 },
          unlockLocation: "avalanche-chute",
        },
      },
      {
        id: "no",
        label: "Keep your powder",
        outcome: { text: "He shrugs with his whole ruined face and goes back to being weather.", hours: 1 },
      },
    ],
  },
  {
    id: "win-oneshot-rosary",
    season: "winter",
    locations: ["mexican-trail-camp", "south-pass", "frozen-fall"],
    text: "A man on his knees has frozen that way, beads in a fist. Mexican wool. No mule. The Taos trail does not come up here to collect its dead until the snow allows.",
    choices: [
      {
        id: "beads",
        label: "Take the rosary and say you will carry word",
        outcome: {
          text: "The beads come free like ice. You put them in your shirt. Word, if you live, is a kind of debt.",
          hours: 1,
          extraAdd: "ice-rosary",
        },
      },
      {
        id: "leave",
        label: "Leave him his prayer",
        outcome: { text: "You cap his hat lower and go. The wind continues the service.", hours: 1 },
      },
    ],
  },
  {
    id: "win-oneshot-quilt",
    season: "winter",
    locations: ["homesteader-ruin", "cache-deadfall"],
    text: "A quilt frozen over a sage clump, child’s stitching, blood in one corner gone brown. No child. The wind lifts a corner and puts it back.",
    choices: [
      {
        id: "take",
        label: "Take it for wrap",
        outcome: {
          text: "It cracks, then drapes. Warmth that belonged to someone else. You tell yourself that is what winter is.",
          hours: 1,
          meters: { warmth: 8 },
          extraAdd: "child-quilt",
        },
      },
      {
        id: "bury",
        label: "Weight it with stones and leave it",
        outcome: { text: "The ground will not take a grave. You make a small correct pile anyway.", hours: 2, meters: { energy: -8, warmth: -6 } },
      },
    ],
  },
  {
    id: "win-oneshot-boots",
    season: "winter",
    locations: ["creek", "beaver-meadow", "elk-wallow"],
    text: "A stranger sits in the willow trying to cut his boots off. The feet inside have finished being feet. He asks, quite calmly, if you have a spare pair.",
    choices: [
      {
        id: "wrap",
        label: "Wrap what is left and get him toward the cabin",
        outcome: {
          text: "He walks on rags and will. You point him at Eliza’s smoke. He may arrive. You give him the last of your dry socks because the mountain is watching.",
          hours: 2,
          extraRemove: "silk-rags",
          meters: { energy: -8, warmth: -6 },
          unlockLocation: "abandoned-cabin",
        },
      },
      {
        id: "no",
        label: "You have no spare and you say so",
        outcome: { text: "He nods, still calm. He goes back to the knife. You leave while you can still leave.", hours: 1 },
      },
    ],
  },
  {
    id: "win-oneshot-sister",
    season: "winter",
    locations: ["timberline", "high-camp", "wind-saddle"],
    text: "A girl in a man’s cap asks if you have seen a brother who “sat down to rest his eyes.” She describes a coat you passed an hour ago, or will.",
    choices: [
      {
        id: "truth",
        label: "Tell her what sitting down means in this cold",
        outcome: {
          text: "She already knew. She wanted a witness. You walk her as far as the lightning pine and show her the blaze. She does not thank you. She does not have it to spend.",
          hours: 2,
          meters: { energy: -8, warmth: -8 },
          unlockLocation: "lightning-pine",
        },
      },
      {
        id: "lie",
        label: "Say he went downhill",
        outcome: { text: "She believes you, or pretends. She goes downhill. The lie keeps you warmer than the truth would have.", hours: 1, meters: { warmth: 2 } },
      },
    ],
  },
  {
    id: "win-arapaho-cairn",
    season: "winter",
    locations: ["arapaho-ground"],
    text: "The park is a white plate. A cairn you used for a bearing is a rumor under drift. Wind writes the same sentence in every direction.",
    choices: [
      {
        id: "dig",
        label: "Dig for the cairn and sit its lee",
        check: { trait: "eye", dc: 13 },
        success: {
          text: "Your shin finds rock. You huddle until the world has edges. The rim is a dark stitch you can still name.",
          hours: 3,
          meters: { warmth: -12, energy: -8 },
          unlockLocation: "south-park-rim",
        },
        fail: {
          text: "No cairn. You sit anyway. When it thins you are a mile wrong and still here.",
          hours: 4,
          meters: { warmth: -18, energy: -12, health: -4 },
        },
      },
      {
        id: "back",
        label: "Turn back toward timber while you still know timber",
        outcome: { text: "Pride can freeze. You crawl toward a memory of trees.", hours: 2, meters: { energy: -10, warmth: -12 } },
      },
    ],
  },
  {
    id: "win-ute-sinew",
    season: "winter",
    locations: ["ute-camp"],
    text: "Under a lodge ring, a cache of sinew and a fire-drill kit wrapped in hide, set above last week’s blow. Tied with a knot that is not yours.",
    choices: [
      {
        id: "take",
        label: "Take the kit",
        outcome: {
          text: "You will start fires with it. You will also be a story in spring, if anyone comes back to tell it.",
          hours: 1,
          extraAdd: "fire-drill",
          inventory: { firewood: 1 },
          standing: { id: "two-crows", delta: -2 },
        },
      },
      {
        id: "leave",
        label: "Leave the cache",
        outcome: { text: "Someone counted on this ring. You walk around that fact.", hours: 1, standing: { id: "two-crows", delta: 1 } },
      },
    ],
  },
  {
    id: "win-trail-ring",
    season: "winter",
    locations: ["mexican-trail-camp"],
    text: "The stone ring still holds a bed of charcoal under the crust. Someone tried a fire here after the carts left and did not stay to see it through.",
    choices: [
      {
        id: "rebuild",
        label: "Rebuild the fire in their ring",
        outcome: {
          text: "The stones remember heat. You get a mean little flame and an hour that does not try to kill you.",
          hours: 2,
          inventory: { firewood: -1 },
          meters: { warmth: 16, energy: 4 },
        },
      },
      {
        id: "char",
        label: "Bag the charcoal and go",
        outcome: {
          text: "Light, dirty, useful. You blacken the blanket and do not care.",
          hours: 1,
          inventory: { firewood: 1 },
          extraAdd: "charcoal-ends",
        },
      },
    ],
  },
];
