import type { EncounterDef } from "@/lib/game/types";

export const FALL_ENCOUNTERS: EncounterDef[] = [
  {
    id: "fal-camp-quarters",
    season: "fall",
    locations: ["high-camp"],
    text: "A magpie has found the quarter you hung in the lean-to. It works the fat with a jeweler’s patience.",
    choices: [
      {
        id: "shoo",
        label: "Drive it off and raise the meat",
        check: { trait: "hands", dc: 11 },
        success: {
          text: "You lash the quarter higher. The magpie lectures from a snag. The meat will freeze instead of vanish.",
          hours: 1,
          meters: { energy: -4 },
        },
        fail: {
          text: "The lashing slips. You eat dirt and the bird takes a strip for the trouble.",
          hours: 1,
          inventory: { rations: -1 },
          meters: { energy: -6 },
        },
      },
      {
        id: "share",
        label: "Let it work. You will cut around the holes",
        outcome: { text: "A tax paid in grease. The rest will keep if the nights stay honest.", hours: 1 },
      },
    ],
  },
  {
    id: "fal-creek-skin-ice",
    season: "fall",
    locations: ["creek"],
    text: "A skin of ice has formed in the eddies overnight. The main current still talks. By next week it may not.",
    choices: [
      {
        id: "fill",
        label: "Fill every skin before the creek locks",
        outcome: {
          text: "You break the skim with a heel and dip until your wrists ache. Water now is a winter argument won.",
          hours: 2,
          inventory: { water: 3 },
          meters: { warmth: -10 },
        },
      },
      {
        id: "fish",
        label: "Chop a hole and try for trout",
        check: { trait: "hands", dc: 13 },
        success: {
          text: "One dark fish comes up like a secret. You will eat it before the ice takes the rest of the idea.",
          hours: 3,
          inventory: { rations: 1, water: 1 },
          meters: { warmth: -14, energy: -8 },
        },
        fail: {
          text: "The hatchet glances. Cold water finds your boot. No fish, a wet foot, a shorter day.",
          hours: 3,
          meters: { warmth: -18, energy: -10, health: -3 },
        },
      },
    ],
  },
  {
    id: "fal-timber-mast",
    season: "fall",
    locations: ["timberline"],
    text: "Pine squirrels have been stuffing cones under a krummholz skirt. A winter larder, not yours, and perfectly mapped.",
    choices: [
      {
        id: "rob",
        label: "Rob the middens",
        check: { trait: "eye", dc: 12 },
        success: {
          text: "You take a hatful of nuts and leave the rest. The squirrels will hate you in a language you already understand.",
          hours: 2,
          inventory: { rations: 1 },
          meters: { energy: -6 },
        },
        fail: {
          text: "You dig up mold and a mouse nest. The cones you wanted were two trees over.",
          hours: 2,
          meters: { energy: -8 },
        },
      },
      {
        id: "wood",
        label: "Ignore the nuts. Cut deadwood instead",
        outcome: {
          text: "Fatwood and dry limbs. Heat is a kind of food. You stack what you can carry.",
          hours: 3,
          inventory: { firewood: 2 },
          meters: { energy: -12 },
        },
      },
    ],
  },
  {
    id: "fal-ute-strike",
    season: "fall",
    locations: ["ute-camp"],
    text: "Lodge covers coming down. Dogs already nervous. The band is going to lower country before the passes forget how to be passes.",
    choices: [
      {
        id: "edge",
        label: "Wait at the timber with empty hands",
        outcome: {
          text: "Two Crows finds you among the packed travois. He has the look of a man doing arithmetic with weather.",
          hours: 1,
          presentCharacter: "two-crows",
        },
      },
      {
        id: "help",
        label: "Help strike a lodge",
        check: { trait: "hands", dc: 12 },
        success: {
          text: "You fold hide the way you are shown. A woman throws you a strip of dried chokecherry that is more memory than fruit.",
          hours: 2,
          inventory: { rations: 1 },
          standing: { id: "two-crows", delta: 1 },
          presentCharacter: "two-crows",
        },
        fail: {
          text: "You pull the wrong lashing. Poles clatter. You are set aside without a speech.",
          hours: 2,
          standing: { id: "two-crows", delta: -1 },
        },
      },
    ],
  },
  {
    id: "fal-cabin-smokehouse",
    season: "fall",
    locations: ["abandoned-cabin"],
    text: "Smoke from a barrel behind the cabin, not the stove. Someone is turning elk into a winter that can sit on a hook.",
    choices: [
      {
        id: "hail",
        label: "Announce yourself downwind",
        outcome: {
          text: "Eliza steps out with a fork and a look that inventories your hands. “If you’re here to steal smoke, keep walking.”",
          hours: 1,
          presentCharacter: "eliza-ward",
        },
      },
      {
        id: "trade",
        label: "Offer a pelt for a day’s jerky",
        outcome: {
          text: "She weighs the pelt, then cuts you strips that will last if you are not a fool about breakfast.",
          hours: 1,
          inventory: { pelts: -1, rations: 2 },
          standing: { id: "eliza-ward", delta: 1 },
          presentCharacter: "eliza-ward",
        },
      },
    ],
  },
  {
    id: "fal-pass-southbound",
    season: "fall",
    locations: ["south-pass"],
    text: "Below the overlook, a string of mules and a cart are already small. The last sensible people are going toward Taos while the cut is still a cut.",
    choices: [
      {
        id: "watch",
        label: "Watch until they are weather",
        outcome: {
          text: "You count them out of the country. The pass keeps the wind and gives you a clearer idea of how alone you mean to be.",
          hours: 2,
          meters: { warmth: -8 },
        },
      },
      {
        id: "dutch",
        label: "The grin on the last horse looks like Dutch",
        outcome: {
          text: "It is. He salutes with two fingers and a pack that rides too light. You can talk or you can let a thief become weather.",
          hours: 1,
          presentCharacter: "dutch-harrow",
        },
      },
    ],
  },
  {
    id: "fal-beaver-prime",
    season: "fall",
    locations: ["beaver-meadow"],
    text: "A beaver on the dam in a coat that would have paid a clerk’s year, ten years ago. The ponds are glassing at the edges. Otter That Waits is not here to argue the theology.",
    choices: [
      {
        id: "set",
        label: "Set a trap at the slide",
        check: { trait: "hands", dc: 13 },
        success: {
          text: "You take one. The pelt is winter-thick. The meadow feels the absence immediately.",
          hours: 4,
          inventory: { pelts: 1, rations: 1 },
          meters: { energy: -14, warmth: -8 },
          standing: { id: "otter-that-waits", delta: -1 },
        },
        fail: {
          text: "You go in to the knee. The trap takes nothing but your patience and a piece of warmth you needed.",
          hours: 4,
          meters: { warmth: -20, energy: -12 },
        },
      },
      {
        id: "leave",
        label: "Leave the dam its architect",
        outcome: {
          text: "The slap follows you into the willows. You keep a pelt you do not have and a meadow that still works.",
          hours: 1,
          standing: { id: "otter-that-waits", delta: 1 },
        },
      },
    ],
  },
  {
    id: "fal-burn-char",
    season: "fall",
    locations: ["burned-timber"],
    text: "The burn is a black pantry. Charcoal underfoot, and a spike-horn feeding on what fireweed became after the purple left.",
    choices: [
      {
        id: "char",
        label: "Bag charcoal for winter fires",
        outcome: {
          text: "Your hands come away tattooed. The bag will light when snow makes kindling a rumor.",
          hours: 2,
          inventory: { firewood: 2 },
          extraAdd: "char-bag",
          meters: { energy: -8 },
        },
      },
      {
        id: "stalk",
        label: "Stalk the spike",
        check: { trait: "eye", dc: 14 },
        success: {
          text: "A clean shot. Not much fat, but meat is meat, and the burn hides the work from the wind.",
          hours: 3,
          inventory: { rations: 2, powder: -1, pelts: 1 },
          meters: { energy: -12 },
        },
        fail: {
          text: "It reads you against the spars and is gone. Powder spent on a ghost with hooves.",
          hours: 3,
          inventory: { powder: -1 },
          meters: { energy: -10 },
        },
      },
    ],
  },
  {
    id: "fal-chute-load",
    season: "fall",
    locations: ["avalanche-chute"],
    text: "Last night’s snow is a thin white gun laid along the chute. It would not bury a horse yet. It is practicing.",
    choices: [
      {
        id: "edge",
        label: "Cross the rock rib at the margin",
        check: { trait: "grit", dc: 13 },
        success: {
          text: "You make the far side without teaching the slope your name. A basin opens beyond like a held secret.",
          hours: 2,
          meters: { energy: -10, warmth: -8 },
          unlockLocation: "grizzly-basin",
        },
        fail: {
          text: "A slab the size of a door lets go. You ride scree, lose a ration, keep your bones.",
          hours: 3,
          inventory: { rations: -1 },
          meters: { health: -10, energy: -14, warmth: -12 },
        },
      },
      { id: "back", label: "Turn around", outcome: { text: "The chute can finish loading without you. You still have a winter to spend.", hours: 1 } },
    ],
  },
  {
    id: "fal-spring-last-soak",
    season: "fall",
    locations: ["hot-spring"],
    text: "Snowmelt beads on the stones and runs back into steam. White Shell is rolling roots in a hide. The pools will still work in January. The path to them may not.",
    choices: [
      {
        id: "soak",
        label: "A short soak, then go",
        outcome: {
          text: "Heat unknots what the last week tied. You dress before stupidity sets in.",
          hours: 2,
          meters: { warmth: 20, health: 6, energy: 6 },
          presentCharacter: "white-shell",
        },
      },
      {
        id: "ask",
        label: "Ask what she is packing",
        check: { trait: "savvy", dc: 13 },
        success: {
          text: "Kinnikinnick and a root she will not name in English. She lets you take a twist. “For the cough that comes with first ice.”",
          hours: 1,
          extraAdd: "cough-root",
          standing: { id: "white-shell", delta: 1 },
          presentCharacter: "white-shell",
        },
        fail: {
          text: "She ties the hide and does not look up. Steam is the only conversation you are offered.",
          hours: 1,
          presentCharacter: "white-shell",
        },
      },
    ],
  },
  {
    id: "fal-wallow-rut",
    season: "fall",
    locations: ["elk-wallow"],
    text: "Bugling from the next park. The wallow is churned to soup. A bull the color of old blood is raking a willow to death for an audience of cows.",
    choices: [
      {
        id: "stalk",
        label: "Stalk for a quarter, stay off his cows",
        check: { trait: "eye", dc: 14 },
        success: {
          text: "You take a dry cow at the edge. The bull never turns his head. Fat along the backstrap like a saved argument.",
          hours: 4,
          inventory: { rations: 4, pelts: 1, powder: -1 },
          meters: { energy: -16, warmth: -6 },
        },
        fail: {
          text: "A twig. He comes. The world narrows to tines and the smell of rut.",
          hours: 1,
          startSkirmish: {
            intro: "The bull decides you are a rival that walks on two legs.",
            foes: [{ id: "rut-bull", name: "Rutting bull elk", hp: 24, maxHp: 24, range: "near", damage: [5, 11] }],
          },
        },
      },
      {
        id: "around",
        label: "Give the wallow a wide berth",
        outcome: { text: "You smell them for a mile. Hunger files a note. You keep your ribs unhooked.", hours: 1 },
      },
    ],
  },
  {
    id: "fal-saddle-honkers",
    season: "fall",
    locations: ["wind-saddle"],
    weather: ["wind", "clear"],
    text: "Geese go over the saddle in a ragged V, talking the whole way south. Their shadows run uphill across your boots.",
    choices: [
      {
        id: "shot",
        label: "Try a goose on the wing",
        check: { trait: "eye", dc: 15 },
        success: {
          text: "One folds. You climb down to a bird that has already seen more country than you have. Fat. Dark meat. Worth the powder.",
          hours: 2,
          inventory: { rations: 2, powder: -1 },
          meters: { energy: -10, warmth: -8 },
        },
        fail: {
          text: "The V does not notice. Powder becomes noise. You watch dinner become a rumor over South Park.",
          hours: 1,
          inventory: { powder: -1 },
        },
      },
      {
        id: "watch",
        label: "Watch them go",
        outcome: { text: "A compass that does not lie. You turn your collar up and take the hint in your own time.", hours: 1, meters: { warmth: -6 } },
      },
    ],
  },
  {
    id: "fal-fall-lock",
    season: "fall",
    locations: ["frozen-fall"],
    text: "The fall is growing a beard. Water still threads the ice, but the pillar is remembering how to be a door.",
    choices: [
      {
        id: "behind",
        label: "Work behind the ice toward the talus throat",
        check: { trait: "hands", dc: 13 },
        success: {
          text: "You squeeze through wet dark and come out knowing the cave is a day’s pack from here if you mark it.",
          hours: 2,
          meters: { warmth: -14, energy: -8 },
          unlockLocation: "talus-ice-cave",
        },
        fail: {
          text: "A pane lets go and soaks you to the belt. You crawl back tasting mineral and bad decisions.",
          hours: 2,
          meters: { warmth: -22, health: -6, energy: -10 },
        },
      },
      {
        id: "fill",
        label: "Chip ice for the kettle and leave",
        outcome: {
          text: "Clean ice, no silt. You pack it like coin. It will be water by the fire and not before.",
          hours: 1,
          inventory: { water: 2 },
          meters: { warmth: -8 },
        },
      },
    ],
  },
  {
    id: "fal-pine-tallow",
    season: "fall",
    locations: ["lightning-pine"],
    text: "A bladder of tallow hangs from a peg in the split. Peggy’s blaze is recut. The gift is either a share or a test.",
    choices: [
      {
        id: "take",
        label: "Take the tallow and leave a ration",
        outcome: {
          text: "Fair trade, if she sees it that way. Grease for biscuits. Grease for boots. Grease for a night that will need both.",
          hours: 1,
          inventory: { rations: -1 },
          extraAdd: "elk-tallow",
          standing: { id: "peggy-dunne", delta: 1 },
        },
      },
      {
        id: "wait",
        label: "Wait. She may be near",
        outcome: {
          text: "Peggy steps out of the goat trail as if the pine grew her. She looks at your hands first.",
          hours: 1,
          presentCharacter: "peggy-dunne",
        },
      },
    ],
  },
  {
    id: "fal-trail-pack",
    season: "fall",
    locations: ["mexican-trail-camp"],
    text: "Carts being loaded. Chile, hides, a crate of something that clinks. The Taos trace is pulling its people downhill like a rope.",
    choices: [
      {
        id: "ramon",
        label: "Find the man with the fat mules",
        outcome: {
          text: "Ramón is selling the last of his flour at a price that knows you cannot go to town.",
          hours: 1,
          presentCharacter: "ramon-salazar",
        },
      },
      {
        id: "padre",
        label: "Look for the cassock",
        outcome: {
          text: "Padre Tomás is blessing a mule that does not require it. He looks glad and already elsewhere.",
          hours: 1,
          presentCharacter: "padre-tomas",
        },
      },
    ],
  },
  {
    id: "fal-arapaho-racks",
    season: "fall",
    locations: ["arapaho-ground"],
    text: "Meat racks in the park, black with flies that have not yet learned the season is over. Lodges still up. You are on someone else’s harvest.",
    choices: [
      {
        id: "wait",
        label: "Sit in the open until you are noticed",
        outcome: {
          text: "Nawat comes out of the grass as if he had been invented for this errand. He does not ask if you are hungry. He asks why you are here.",
          hours: 1,
          presentCharacter: "nawat",
        },
      },
      {
        id: "steal",
        label: "Cut a strip from the downwind rack",
        outcome: {
          text: "Jerky in the shirt. A feeling like wearing a bell. The park keeps your name now.",
          hours: 1,
          inventory: { rations: 1 },
          standing: { id: "nawat", delta: -3 },
        },
      },
    ],
  },
  {
    id: "fal-deadfall-fill",
    season: "fall",
    locations: ["cache-deadfall"],
    text: "The hole under the deadfall is empty enough to be useful. This is the week to put meat where January cannot argue with you.",
    choices: [
      {
        id: "cache",
        label: "Cache two rations under stone and spruce",
        outcome: {
          text: "You mark the blaze the way Peggy would. The mountain is a poor bank. It is still a bank.",
          hours: 2,
          inventory: { rations: -2 },
          extraAdd: "deadfall-ticket",
          meters: { energy: -6 },
        },
      },
      {
        id: "dig",
        label: "Dig for what the last user left",
        check: { trait: "eye", dc: 12 },
        success: {
          text: "A twist of powder in oiled cloth and a strip of jerky hard as harness.",
          hours: 1,
          inventory: { powder: 1, rations: 1 },
        },
        fail: {
          text: "Dirt, a rusty awl, the particular disappointment of other people’s winters.",
          hours: 1,
          meters: { energy: -6 },
        },
      },
    ],
  },
  {
    id: "fal-cave-put-up",
    season: "fall",
    locations: ["talus-ice-cave"],
    text: "Last year’s ice is still a floor. Cold comes up through your soles like a fact. You could hang a winter here if you had the meat and the hours.",
    choices: [
      {
        id: "hang",
        label: "Hang what meat you have on the ice",
        outcome: {
          text: "The cave takes it without comment. You stack stone against the throat against things that also know this place.",
          hours: 3,
          inventory: { rations: -2 },
          extraAdd: "ice-cache",
          meters: { warmth: -16, energy: -10 },
        },
      },
      {
        id: "salvage",
        label: "See if anyone else’s elk is still honest",
        check: { trait: "eye", dc: 13 },
        success: {
          text: "A haunch, frozen through, no green. You take a day of it and leave the rest to whoever marked the wall.",
          hours: 2,
          inventory: { rations: 2 },
          meters: { warmth: -12 },
        },
        fail: {
          text: "You guess wrong. The taste will teach you later. For now it is only cold and a full bag.",
          hours: 2,
          inventory: { rations: 1 },
          meters: { health: -10, warmth: -12 },
        },
      },
    ],
  },
  {
    id: "fal-ruin-cellar",
    season: "fall",
    locations: ["homesteader-ruin"],
    text: "Martha is lifting a puncheon. Under it, a hole that still holds potatoes and a smell of earth that has not given up.",
    choices: [
      {
        id: "help",
        label: "Help her fill the cellar",
        outcome: {
          text: "You pass roots in the dark. She pays you in three potatoes and a warning about the well you already should know.",
          hours: 3,
          inventory: { rations: 2 },
          meters: { energy: -10 },
          standing: { id: "martha-keene", delta: 1 },
          presentCharacter: "martha-keene",
        },
      },
      {
        id: "ask",
        label: "Ask if any are for sale",
        outcome: {
          text: "“Sale.” She almost smiles. “Work or walk. I don’t run a store in a grave.”",
          hours: 1,
          presentCharacter: "martha-keene",
        },
      },
    ],
  },
  {
    id: "fal-basin-den",
    season: "fall",
    locations: ["grizzly-basin"],
    text: "The berry bushes are sticks. Bear scat, purple once, now just hair and seed. A drag trail of bedding toward a hole under the rim. Fat enough to sleep. Not asleep yet.",
    choices: [
      {
        id: "back",
        label: "Leave the basin to its owner",
        outcome: {
          text: "Frost on Antler’s tracks overlay the bear’s, going the same wise direction. You take the hint without needing the man.",
          hours: 2,
          unlockLocation: "avalanche-chute",
        },
      },
      {
        id: "glass",
        label: "Glass the den from the talus",
        check: { trait: "eye", dc: 13 },
        success: {
          text: "You see a shoulder, then nothing. Knowledge. Not a pelt. You back out with your hide still fitted.",
          hours: 2,
          meters: { energy: -8 },
        },
        fail: {
          text: "Scree talks. Something in the hole answers by existing louder. You leave faster than pride prefers.",
          hours: 2,
          meters: { energy: -14, warmth: -8 },
        },
      },
    ],
  },
  {
    id: "fal-rim-fat",
    season: "fall",
    locations: ["south-park-rim"],
    text: "Elk on the park like a dark tide, feeding on grass that still has sugar. Fat for the drop. The wind is in your face if you are willing to crawl.",
    choices: [
      {
        id: "crawl",
        label: "Crawl the long hour",
        check: { trait: "grit", dc: 13 },
        success: {
          text: "A dry cow drops. You will be two days butchering and packing if you are greedy, one if you are wise.",
          hours: 5,
          inventory: { rations: 4, pelts: 1, powder: -1 },
          meters: { energy: -20, warmth: -8 },
        },
        fail: {
          text: "Heads come up as one animal. The park empties into the next drainage. You stand in chewed grass with a cold knee.",
          hours: 4,
          meters: { energy: -16 },
        },
      },
      { id: "save", label: "Save the powder for closer country", outcome: { text: "The herd keeps its fat. You keep your horn. Both of you may need it.", hours: 1 } },
    ],
  },
  {
    id: "fal-snow-first",
    season: "fall",
    weather: ["snow"],
    locations: "any",
    text: "The first snow that means it. Not a dusting. A quiet that lands on your hat and stays. Tracks you made an hour ago are already a theory.",
    choices: [
      {
        id: "hunker",
        label: "Get under a spruce and wait it out",
        outcome: {
          text: "You become a dark lump in a white country. When it eases, the world has been rewritten in a language you will have to relearn.",
          hours: 3,
          meters: { warmth: -14, energy: -6 },
        },
      },
      {
        id: "push",
        label: "Keep moving while you can still see the next tree",
        check: { trait: "grit", dc: 12 },
        success: {
          text: "You bull through to a place that still has a name. Wet, colder, not lost.",
          hours: 2,
          meters: { warmth: -12, energy: -10 },
        },
        fail: {
          text: "The country turns the same in every direction. You sit down to think and nearly forget to stand up.",
          hours: 3,
          meters: { warmth: -20, energy: -12, health: -4 },
        },
      },
    ],
  },
  {
    id: "fal-wind-knife",
    season: "fall",
    weather: ["wind"],
    locations: ["high-camp", "wind-saddle", "south-pass", "timberline"],
    text: "A wind comes off the divide that has no interest in you except as something it can take apart. The aspens roar. Your fire lies down and dies.",
    choices: [
      {
        id: "lash",
        label: "Lash everything and sit on the tarp",
        outcome: {
          text: "You spend the hours as ballast. The wind gets bored. You have a camp that still resembles a camp.",
          hours: 3,
          meters: { warmth: -12, energy: -8 },
        },
      },
      {
        id: "lee",
        label: "Find a lee and start the fire over",
        check: { trait: "hands", dc: 12 },
        success: {
          text: "A rock elbow, a handful of pitch, a flame that agrees to live. You get heat back by arguing for it.",
          hours: 2,
          inventory: { firewood: -1 },
          meters: { warmth: 8, energy: -6 },
        },
        fail: {
          text: "Matches, then none. You eat cold and call it character.",
          hours: 2,
          meters: { warmth: -16, energy: -6 },
        },
      },
    ],
  },
  {
    id: "fal-blizzard-early",
    season: "fall",
    weather: ["blizzard"],
    locations: "any",
    text: "An early blizzard, the kind that kills the unready and educates the rest. You cannot see a trail. You can see the idea of dying of stubbornness.",
    choices: [
      {
        id: "dig",
        label: "Dig a hole in the lee and wait",
        outcome: {
          text: "Snow becomes a wall. You become a badger. Hours go by that do not belong to you.",
          hours: 5,
          meters: { warmth: -10, energy: -8, hunger: -8 },
        },
      },
      {
        id: "walk",
        label: "Walk anyway",
        check: { trait: "grit", dc: 16 },
        success: {
          text: "You come out of it at a place you recognize by smell. That is luck wearing work clothes.",
          hours: 4,
          meters: { warmth: -18, energy: -16, health: -4 },
        },
        fail: {
          text: "You walk in a circle until your legs file a petition. You dig the hole you should have dug first.",
          hours: 5,
          meters: { warmth: -24, energy: -18, health: -10 },
        },
      },
    ],
  },
  {
    id: "fal-storm-aspen",
    season: "fall",
    weather: ["storm"],
    locations: ["timberline", "burned-timber", "creek", "beaver-meadow"],
    text: "A fall storm rips the gold off the aspens and throws it in your face. Lightning works a ridge you do not need to be on.",
    choices: [
      {
        id: "low",
        label: "Get off the ridge and wait",
        outcome: {
          text: "Thunder walks the divide. Wet leaves plaster your coat. You count the gap until the count gets kind.",
          hours: 3,
          meters: { warmth: -14, energy: -8 },
        },
      },
      {
        id: "push",
        label: "Push for shelter",
        check: { trait: "grit", dc: 13 },
        success: {
          text: "You reach a thicket that takes the worst of it. The ridge behind you is a different country.",
          hours: 2,
          meters: { warmth: -10, energy: -10 },
        },
        fail: {
          text: "A branch finds your cheek. You taste copper and keep walking because sitting down looks like a decision you would not wake from.",
          hours: 3,
          meters: { health: -8, warmth: -16, energy: -12 },
        },
      },
    ],
  },
  {
    id: "fal-silas-winter-talk",
    season: "fall",
    locations: ["high-camp", "lightning-pine", "timberline"],
    text: "Silas Crowe has a scrawny spike hanging too close to a fire that is eating it instead of drying it. Grease pops. He is singing the wrong verses on purpose.",
    choices: [
      {
        id: "rescue",
        label: "Pull the meat before it is charcoal",
        check: { trait: "hands", dc: 11 },
        success: {
          text: "You get it off, slice the burnt, hang the rest higher. He pretends he meant that. You each eat a piece that is only slightly a crime.",
          hours: 2,
          inventory: { rations: 1 },
          standing: { id: "silas-crowe", delta: 1 },
          presentCharacter: "silas-crowe",
        },
        fail: {
          text: "It falls in. The fire makes a feast of your supper. Silas laughs until he has to sit. You go to bed on smoke and irritation.",
          hours: 2,
          meters: { hunger: -8, energy: -6 },
          presentCharacter: "silas-crowe",
        },
      },
      {
        id: "leave",
        label: "Leave him to his method",
        outcome: {
          text: "He toasts you with the cup. Tomorrow he will remember a different version in which he taught you everything.",
          hours: 1,
          presentCharacter: "silas-crowe",
        },
      },
    ],
  },
  {
    id: "fal-ned-wool",
    season: "fall",
    locations: ["timberline", "creek", "high-camp"],
    text: "Ned Calhoun is wearing the same city coat the spring tried to ruin. His teeth are starting a conversation of their own.",
    choices: [
      {
        id: "pelt",
        label: "Cut him a vest from a spare pelt",
        check: { trait: "hands", dc: 12 },
        success: {
          text: "It is ugly and it works. He looks at you as if you had invented kindness. He will carry wood until you tell him to stop.",
          hours: 2,
          inventory: { pelts: -1 },
          standing: { id: "ned-calhoun", delta: 2 },
          presentCharacter: "ned-calhoun",
        },
        fail: {
          text: "The hide goes on crooked. He wears it anyway and thanks you too many times.",
          hours: 2,
          inventory: { pelts: -1 },
          standing: { id: "ned-calhoun", delta: 1 },
          presentCharacter: "ned-calhoun",
        },
      },
      {
        id: "send",
        label: "Tell him to go down with the last mules",
        outcome: {
          text: "He argues, then doesn’t. A boy in a bad coat becomes a speck on the trace. You keep the pelt and the quieter camp.",
          hours: 1,
          standing: { id: "ned-calhoun", delta: -2 },
          presentCharacter: null,
        },
      },
    ],
  },
  {
    id: "fal-two-crows-quarter",
    season: "fall",
    locations: ["ute-camp", "elk-wallow", "beaver-meadow"],
    text: "Two Crows has a bull quarter on a rack and a knife that has already done the long work. “Powder,” he says. “Or you hunt your own winter.”",
    choices: [
      {
        id: "trade",
        label: "Trade two powder for meat and fat",
        outcome: {
          text: "He cuts you a piece with the suet still on. That fat is the real coin. He does not smile. He does not need to.",
          hours: 1,
          inventory: { powder: -2, rations: 3 },
          extraAdd: "suet-cake",
          standing: { id: "two-crows", delta: 1 },
          presentCharacter: "two-crows",
        },
      },
      {
        id: "news",
        label: "Ask where the cows are feeding at dusk",
        check: { trait: "savvy", dc: 12 },
        success: {
          text: "He names a park the maps do not have, downwind of the wallows. “After the bugling. Not during. You are not a bull.”",
          hours: 1,
          unlockLocation: "elk-wallow",
          standing: { id: "two-crows", delta: 1 },
          presentCharacter: "two-crows",
        },
        fail: {
          text: "He goes back to the quarter. You are a question he has already answered.",
          hours: 1,
          presentCharacter: "two-crows",
        },
      },
    ],
  },
  {
    id: "fal-ramon-trade",
    season: "fall",
    locations: ["mexican-trail-camp", "south-park-rim"],
    text: "Ramón’s mules are packed for the trace. He is buying winter pelts like a man who knows the price in Taos and the hunger here.",
    choices: [
      {
        id: "sell",
        label: "Sell two pelts for flour and chile",
        outcome: {
          text: "He weighs, sniffs, nods. The flour has weevils. The chile will make poor meat into a meal. You eat better than you deserve.",
          hours: 1,
          inventory: { pelts: -2, rations: 3 },
          standing: { id: "ramon-salazar", delta: 1 },
          presentCharacter: "ramon-salazar",
        },
      },
      {
        id: "hold",
        label: "Hold the pelts for a hungrier buyer",
        outcome: {
          text: "He shrugs. “Then freeze stylish.” He is gone down the ruts before your pride finishes its sentence.",
          hours: 1,
          presentCharacter: "ramon-salazar",
        },
      },
    ],
  },
  {
    id: "fal-hennepin-buy",
    season: "fall",
    locations: ["south-pass", "mexican-trail-camp", "abandoned-cabin"],
    text: "Hennepin has a packhorse and a smile that counts. “Prime season. The Company will take your take. We’ll even pretend the price is fair.”",
    choices: [
      {
        id: "sell",
        label: "Sell three pelts to the Company",
        outcome: {
          text: "Powder, flour, a note in a book you will never read. You walk lighter and more owned.",
          hours: 1,
          inventory: { pelts: -3, powder: 2, rations: 2 },
          extraAdd: "company-ticket",
          standing: { id: "hennepin", delta: 1 },
          presentCharacter: "hennepin",
        },
      },
      {
        id: "clerk",
        label: "Talk to the clerk with the book instead",
        outcome: {
          text: "Cyrus Pelt does not look up until the sentence has a number in it. Hennepin hates being skipped. The ledger does not.",
          hours: 1,
          presentCharacter: "cyrus-pelt",
          standing: { id: "hennepin", delta: -1 },
        },
      },
    ],
  },
  {
    id: "fal-frost-stalk",
    season: "fall",
    locations: ["grizzly-basin", "avalanche-chute", "wind-saddle"],
    text: "Frost on Antler holds up a palm. Below, in the willow, elk are moving like a single slow thought. He looks at you once: quiet, or leave.",
    choices: [
      {
        id: "quiet",
        label: "Hunt as he hunts",
        check: { trait: "eye", dc: 13 },
        success: {
          text: "You take the wind he takes. A cow drops. He cuts you a share without making it a speech, then is gone into the next weather.",
          hours: 4,
          inventory: { rations: 2, powder: -1 },
          standing: { id: "frost-on-antler", delta: 2 },
          presentCharacter: null,
        },
        fail: {
          text: "Your sleeve kisses brush. The park empties. He does not look at you again. That is the whole review.",
          hours: 3,
          meters: { energy: -12 },
          standing: { id: "frost-on-antler", delta: -1 },
        },
      },
      {
        id: "leave",
        label: "Leave him the basin",
        outcome: {
          text: "You back out. Later a grouse, still warm, is hanging on a snag at the chute mouth. Payment for an absence.",
          hours: 2,
          inventory: { rations: 1 },
          standing: { id: "frost-on-antler", delta: 1 },
        },
      },
    ],
  },
  {
    id: "fal-padre-going",
    season: "fall",
    locations: ["mexican-trail-camp", "south-park-rim", "hot-spring"],
    text: "Padre Tomás has set a crate for an altar. Three men who are staying the winter kneel in dirt. He is saying the words as if weather were listening.",
    choices: [
      {
        id: "kneel",
        label: "Kneel and take the bread after",
        outcome: {
          text: "The bread is hard and the chile after it is not. He does not ask if you believe. He asks if you have wood.",
          hours: 2,
          meters: { hunger: 18, warmth: 6 },
          standing: { id: "padre-tomas", delta: 1 },
          presentCharacter: "padre-tomas",
        },
      },
      {
        id: "watch",
        label: "Keep watch while they pray",
        outcome: {
          text: "Nothing comes but a raven. He thanks you with water from the mule keg and a look that files you under still-alive.",
          hours: 1,
          inventory: { water: 1 },
          presentCharacter: "padre-tomas",
        },
      },
    ],
  },
  {
    id: "fal-ygnacio-mules",
    season: "fall",
    locations: ["mexican-trail-camp", "wind-saddle"],
    text: "Ygnacio Luna’s near mule is down on first ice, eyes rolling. The cinch is tight and the animal has decided the ground is a traitor.",
    choices: [
      {
        id: "up",
        label: "Help get the mule up",
        check: { trait: "hands", dc: 13 },
        success: {
          text: "You strip the pack, talk nonsense, haul. The mule stands like a bad miracle. Ygnacio pays you in jerky and a look that ranks you above the other mule.",
          hours: 2,
          inventory: { rations: 1 },
          meters: { energy: -12 },
          standing: { id: "ygnacio-luna", delta: 1 },
          presentCharacter: "ygnacio-luna",
        },
        fail: {
          text: "A hoof finds your shin. The mule stands anyway, no thanks to you. Ygnacio wraps the shin without making it a story.",
          hours: 2,
          meters: { health: -8, energy: -10 },
          presentCharacter: "ygnacio-luna",
        },
      },
      {
        id: "pass",
        label: "This is his animal and his hour",
        outcome: {
          text: "He gets it up without you. You keep your shin. You also keep the knowledge that you walked around a man in trouble.",
          hours: 1,
          standing: { id: "ygnacio-luna", delta: -1 },
        },
      },
    ],
  },
  {
    id: "fal-martha-salt",
    season: "fall",
    locations: ["homesteader-ruin", "abandoned-cabin"],
    text: "Martha Keene is boiling brine in a kettle that has seen better metal. “Meat without salt is a dare. I can spare a handful if you cut wood.”",
    choices: [
      {
        id: "wood",
        label: "Cut wood for the brine",
        outcome: {
          text: "Your hands remember the axe. She wraps salt in a rag as if it were shot. In a way it is.",
          hours: 3,
          inventory: { firewood: 1 },
          extraAdd: "salt-pouch",
          meters: { energy: -12 },
          standing: { id: "martha-keene", delta: 1 },
          presentCharacter: "martha-keene",
        },
      },
      {
        id: "no",
        label: "Keep the day for your own meat",
        outcome: { text: "She goes back to the kettle. The smell of salt follows you like a lecture.", hours: 1, presentCharacter: "martha-keene" },
      },
    ],
  },
  {
    id: "fal-briggs-bull",
    season: "fall",
    locations: ["timberline", "burned-timber", "elk-wallow"],
    text: "A bull is down in the krummholz. Caleb has the knife. Amos has the opinions. They both look at you as if you might be a third pair of hands or a problem.",
    choices: [
      {
        id: "help",
        label: "Help them skin before the meat sours",
        outcome: {
          text: "Hours in gore and cooling fat. At the end Caleb gives you a roast. Amos gives you a story you did not ask for.",
          hours: 4,
          inventory: { rations: 2 },
          meters: { energy: -14, warmth: -8 },
          standing: { id: "caleb-briggs", delta: 1 },
          presentCharacter: "caleb-briggs",
        },
      },
      {
        id: "amos",
        label: "Side with Amos: take the ivory canines for luck",
        outcome: {
          text: "Caleb’s mouth goes thin. Amos saws the teeth out anyway and presses one on you. It is heavy and slightly ridiculous. He looks delighted.",
          hours: 1,
          extraAdd: "elk-ivory",
          standing: { id: "amos-briggs", delta: 1 },
          presentCharacter: "amos-briggs",
        },
      },
    ],
  },
  {
    id: "fal-gray-down",
    season: "fall",
    locations: ["ute-camp", "arapaho-ground"],
    text: "Gray Elk is rendering marrow in a small pot while the lodges come down around him. He does not look up. “Fat now, or bones later. The elk will not wait for a proud camp.”",
    choices: [
      {
        id: "watch",
        label: "Watch how he saves the grease",
        outcome: {
          text: "He shows you the simmer, not the speech. A spoonful goes into a bladder you can keep. The rest is for people who already know winter.",
          hours: 2,
          extraAdd: "marrow-grease",
          standing: { id: "gray-elk", delta: 1 },
          presentCharacter: "gray-elk",
        },
      },
      {
        id: "ask",
        label: "Ask when the basin bear dens",
        outcome: {
          text: "“When the berries are sticks.” He names the chute as a door you should not use after the next snow. Then the pot takes his attention back.",
          hours: 1,
          unlockLocation: "grizzly-basin",
          presentCharacter: "gray-elk",
        },
      },
    ],
  },
  {
    id: "fal-hannah-hands",
    season: "fall",
    locations: ["abandoned-cabin", "homesteader-ruin"],
    text: "Hannah Briggs has a kettle of tallow on and a row of cracked hands waiting — not yours, a herder’s. She points at the bellows as if you had asked for work.",
    choices: [
      {
        id: "bellows",
        label: "Work the fire while she salves",
        outcome: {
          text: "You keep the heat even. She wraps the herder, then throws you a rag of grease for your own splits. “Don’t make me stitch stupidity.”",
          hours: 2,
          extraAdd: "tallow-salve",
          meters: { health: 8, warmth: 6 },
          standing: { id: "hannah-briggs", delta: 1 },
          presentCharacter: "hannah-briggs",
        },
      },
      {
        id: "queue",
        label: "Put your own hands in the line",
        check: { trait: "savvy", dc: 12 },
        success: {
          text: "She glances, then works you in. The splits sting and then quit arguing. You leave able to hold an axe without bleeding into the haft.",
          hours: 1,
          meters: { health: 10 },
          standing: { id: "hannah-briggs", delta: 1 },
          presentCharacter: "hannah-briggs",
        },
        fail: {
          text: "She does not look up. “I have a living patient. Come back when you are one.”",
          hours: 1,
          presentCharacter: "hannah-briggs",
        },
      },
    ],
  },
  {
    id: "fal-little-star-fat",
    season: "fall",
    locations: ["ute-camp", "elk-wallow"],
    text: "Little Star is blowing a grass blade into a bad imitation of a bull. The cows in the next park have opinions. So will the real bull, if she keeps it up.",
    choices: [
      {
        id: "stop",
        label: "Get her to quit before he comes",
        outcome: {
          text: "She laughs once, then does. In trade she shows you the cow trail that stays in timber. Two Crows would have opinions about all of this.",
          hours: 1,
          unlockLocation: "elk-wallow",
          standing: { id: "little-star", delta: 1 },
          presentCharacter: "little-star",
        },
      },
      {
        id: "join",
        label: "Bugle with her, quieter",
        check: { trait: "savvy", dc: 13 },
        success: {
          text: "A spike answers from too close and then thinks better of it. She is delighted. You leave with your pulse up and a better idea of where the cows bed.",
          hours: 2,
          standing: { id: "little-star", delta: 1 },
          presentCharacter: "little-star",
        },
        fail: {
          text: "A real bugle answers, nearer than pride. You both become stumps until the timber goes quiet again.",
          hours: 2,
          meters: { energy: -8 },
          presentCharacter: "little-star",
        },
      },
    ],
  },
  {
    id: "fal-millicent-ink",
    season: "fall",
    locations: ["south-park-rim", "mexican-trail-camp"],
    text: "Millicent Voss’s ink is skinning over in the cold. She wants the date the creek locked and whether the fall has grown a beard. “I pay in apples. I do not pay in conversation.”",
    choices: [
      {
        id: "report",
        label: "Give her what you have seen of first ice",
        outcome: {
          text: "She writes it as if the mountain had confessed. The apples are wrinkled and still a town. She traces a line to the ice cave you had only heard of.",
          hours: 1,
          inventory: { rations: 1 },
          unlockLocation: "talus-ice-cave",
          standing: { id: "millicent-voss", delta: 1 },
          presentCharacter: "millicent-voss",
        },
      },
      {
        id: "guess",
        label: "Invent a date to sound useful",
        check: { trait: "savvy", dc: 14 },
        success: {
          text: "She believes you, or her paper needs a number. You get the apple. Sleep poorly about maps.",
          hours: 1,
          inventory: { rations: 1 },
          presentCharacter: "millicent-voss",
        },
        fail: {
          text: "She looks at you the way she looks at a crooked contour. No apple. A small professional disgust.",
          hours: 1,
          standing: { id: "millicent-voss", delta: -1 },
          presentCharacter: "millicent-voss",
        },
      },
    ],
  },
  {
    id: "fal-jb-last-set",
    season: "fall",
    locations: ["beaver-meadow", "creek", "timberline"],
    text: "Jean-Baptiste’s last trap is frozen into the pond’s new skin, chain standing like a wick. He is arguing with ice in French that has forgotten Paris.",
    choices: [
      {
        id: "chop",
        label: "Chop it free before the pond finishes",
        check: { trait: "hands", dc: 13 },
        success: {
          text: "The trap comes up empty and intact. He gives you a twist of willow tobacco and half a smoked fish he had been saving for a worse day.",
          hours: 2,
          inventory: { rations: 1 },
          extraAdd: "willow-tobacco",
          meters: { warmth: -10, energy: -8 },
          standing: { id: "jean-baptiste", delta: 1 },
          presentCharacter: "jean-baptiste",
        },
        fail: {
          text: "The hatchet glances. You sit down harder than you meant to. He hauls you back by the collar, still singing, which is unkind.",
          hours: 2,
          meters: { warmth: -16, health: -5, energy: -10 },
          presentCharacter: "jean-baptiste",
        },
      },
      {
        id: "leave",
        label: "Tell him spring can have it",
        outcome: {
          text: "He looks personally betrayed by the calendar. The song gets sadder, which you would not have thought possible.",
          hours: 1,
          presentCharacter: "jean-baptiste",
        },
      },
    ],
  },
  {
    id: "fal-alejandro-late",
    season: "fall",
    locations: ["south-pass", "mexican-trail-camp", "talus-ice-cave"],
    text: "Alejandro Vega should have gone down in August. He is recinching a mule with a wound that has opinions about lifting. The pass is already thinking about snow.",
    choices: [
      {
        id: "lash",
        label: "Lash the packs for him",
        outcome: {
          text: "He lets you work without pride getting in the knots. Before he goes he tells you which talus throat still holds last year’s ice. He will remember the hour.",
          hours: 2,
          meters: { energy: -8 },
          unlockLocation: "talus-ice-cave",
          standing: { id: "alejandro-vega", delta: 2 },
          presentCharacter: "alejandro-vega",
        },
      },
      {
        id: "pelt",
        label: "Give him a pelt for the road",
        outcome: {
          text: "He takes it, not as charity if you both pretend. The mule looks better dressed than either of you.",
          hours: 1,
          inventory: { pelts: -1 },
          standing: { id: "alejandro-vega", delta: 1 },
          presentCharacter: "alejandro-vega",
        },
      },
    ],
  },
  {
    id: "fal-oneshot-hidebuyer",
    season: "fall",
    locations: ["south-park-rim", "mexican-trail-camp", "south-pass"],
    text: "A man in a Taos hat is buying elk hides off anyone still standing. He does not want beaver. He wants robes for the trail south.",
    choices: [
      {
        id: "sell",
        label: "Sell a pelt at his price",
        outcome: {
          text: "He pays in hard bread and a twist of powder. “Be down before the cut closes,” he says, as if you had asked for a father.",
          hours: 1,
          inventory: { pelts: -1, rations: 1, powder: 1 },
        },
      },
      { id: "no", label: "Keep the hide for your own back", outcome: { text: "He moves on to the next fool or the next wise man. Hard to tell which you are.", hours: 1 } },
    ],
  },
  {
    id: "fal-oneshot-widow-down",
    season: "fall",
    locations: ["homesteader-ruin", "abandoned-cabin", "lightning-pine"],
    text: "A woman with two children and a cart that wants to be a wagon. She is going to the settlements and the cart is already a debate.",
    choices: [
      {
        id: "push",
        label: "Help her over the next rut",
        outcome: {
          text: "You put your back into it. She pays you with a jar of fat she cannot spare and a look that does not do gratitude as theater.",
          hours: 3,
          extraAdd: "jar-fat",
          meters: { energy: -12 },
        },
      },
      { id: "point", label: "Point her at the Taos ruts and keep your hours", outcome: { text: "She goes. The children look at your rifle as if it were a door.", hours: 1 } },
    ],
  },
  {
    id: "fal-oneshot-schoolmaster",
    season: "fall",
    locations: ["south-park-rim", "arapaho-ground", "mexican-trail-camp"],
    text: "A schoolmaster from the Missouri settlements is walking out before the pass forgets him. He has a primer, no meat, and the particular hunger of a man who thought Latin was a coat.",
    choices: [
      {
        id: "feed",
        label: "Trade a ration for a written letter home",
        outcome: {
          text: "He writes in a hand that belongs to a stove and a street. You may never send it. Having it is a kind of south.",
          hours: 1,
          inventory: { rations: -1 },
          extraAdd: "unsent-letter",
        },
      },
      {
        id: "book",
        label: "Buy the primer for a strip of jerky",
        outcome: {
          text: "He eats as if the alphabet had failed him. You own a book that will not start a fire unless you are desperate, which you may be.",
          hours: 1,
          inventory: { rations: -1 },
          extraAdd: "primer",
        },
      },
    ],
  },
  {
    id: "fal-oneshot-cook",
    season: "fall",
    locations: ["beaver-meadow", "creek", "burned-timber"],
    text: "A brigade cook sits on a kettle that has no brigade. “They went down. I was fetching salt. The river they meant is a rumor from here.”",
    choices: [
      {
        id: "share",
        label: "Share a fire and a way south",
        outcome: {
          text: "He cooks what you both have and it becomes better than the sum. He leaves you beans and a grievance aimed at Missouri.",
          hours: 2,
          inventory: { rations: 1 },
          meters: { hunger: 12, warmth: 8 },
        },
      },
      { id: "salt", label: "Ask if any salt is left", outcome: { text: "A pinch, offered like shot. You take it. He takes your silence as company.", hours: 1, extraAdd: "salt-pouch" } },
    ],
  },
  {
    id: "fal-oneshot-smith",
    season: "fall",
    locations: ["lightning-pine", "cache-deadfall", "high-camp"],
    text: "A traveling smith has unpacked a tiny forge by the split pine. He will reset a trap spring or a knife tang if you have anything that looks like pay.",
    choices: [
      {
        id: "knife",
        label: "Pay a pelt to have the knife true",
        outcome: {
          text: "He works the tang until the blade sits honest. Your next deer will come apart as if it agreed.",
          hours: 2,
          inventory: { pelts: -1 },
          extraAdd: "true-edge",
          meters: { energy: -4 },
        },
      },
      { id: "watch", label: "Watch the forge and move on", outcome: { text: "Heat is a kind of homesickness. You leave it with him.", hours: 1, meters: { warmth: 4 } } },
    ],
  },
  {
    id: "fal-oneshot-tallow",
    season: "fall",
    locations: ["timberline", "abandoned-cabin", "elk-wallow"],
    text: "A man is rendering a whole elk into tallow in a kettle black as a sermon. Candles for Taos, he says. Grease for anyone who understands winter.",
    choices: [
      {
        id: "trade",
        label: "Trade a pelt for a bladder of tallow",
        outcome: {
          text: "Warm fat in a gut. It will start fires, fry lean meat, and keep your boots from turning to board.",
          hours: 1,
          inventory: { pelts: -1 },
          extraAdd: "elk-tallow",
        },
      },
      {
        id: "help",
        label: "Stir until it clears, take the cracklings",
        check: { trait: "hands", dc: 11 },
        success: {
          text: "You keep the heat honest. He pays you in the browned bits that are almost meat and almost fuel.",
          hours: 3,
          inventory: { rations: 1 },
          extraAdd: "cracklings",
          meters: { energy: -8, warmth: 8 },
        },
        fail: {
          text: "It scorches. The smell follows you into next week. He is not a man who shares ruined work.",
          hours: 3,
          meters: { energy: -10, warmth: 4 },
        },
      },
    ],
  },
  {
    id: "fal-oneshot-snowshoe",
    season: "fall",
    locations: ["wind-saddle", "timberline", "high-camp"],
    weather: ["snow", "wind"],
    text: "A man is finishing a pair of snowshoes with rawhide that is still damp. “Early,” he says. “Not wrong.” He will trade a pair for meat, or a lesson for watching.",
    choices: [
      {
        id: "buy",
        label: "Pay a ration for the finished pair",
        outcome: {
          text: "They are ugly and they will keep you on top of the next storm instead of in it. You carry them like an argument you intend to win.",
          hours: 1,
          inventory: { rations: -1 },
          extraAdd: "snowshoes",
        },
      },
      {
        id: "watch",
        label: "Watch how the lacing runs",
        check: { trait: "eye", dc: 12 },
        success: {
          text: "You steal the pattern with your eyes. He knows. He does not mind, which is a kind of pay.",
          hours: 2,
          extraAdd: "snowshoe-pattern",
        },
        fail: {
          text: "The lacing looks like a language. You leave literate in hunger and nothing else.",
          hours: 2,
        },
      },
    ],
  },
  {
    id: "fal-oneshot-buffalo",
    season: "fall",
    locations: ["south-park-rim", "arapaho-ground"],
    text: "A plains hunter in a buffalo coat is looking at the park as if it were a poor cousin of the real grass. “Elk will do,” he says. “I missed the herds east.”",
    choices: [
      {
        id: "trade",
        label: "Trade a pelt for a strip of buffalo jerky",
        outcome: {
          text: "The jerky is better than yours and he knows it. He takes your elk hide without unkindness.",
          hours: 1,
          inventory: { pelts: -1, rations: 2 },
        },
      },
      {
        id: "ask",
        label: "Ask how the park hunts if you stay high",
        check: { trait: "savvy", dc: 12 },
        success: {
          text: "He sketches a wind and a crawl with a stick. You will remember it when the fat cows feed at dusk.",
          hours: 1,
          extraAdd: "park-crawl",
        },
        fail: {
          text: "He looks at your boots and decides you are not a student. The lesson stays in the coat.",
          hours: 1,
        },
      },
    ],
  },
  {
    id: "fal-oneshot-ivory",
    season: "fall",
    locations: ["elk-wallow", "south-park-rim", "burned-timber"],
    text: "A stranger is working the canines out of a bull skull with an awl. “Eastern men pay for luck,” he says. “I pay for fat. I am out of fat.”",
    choices: [
      {
        id: "trade",
        label: "Trade a ration for two ivories",
        outcome: {
          text: "They sit in your palm like small arguments. Useless until they are not. He eats like a man who has been waiting for permission.",
          hours: 1,
          inventory: { rations: -1 },
          extraAdd: "elk-ivory",
        },
      },
      {
        id: "show",
        label: "Show him a carcass you passed",
        check: { trait: "eye", dc: 12 },
        success: {
          text: "He follows your pointing and later leaves a haunch hung where you will find it. Payment in the only coin that matters.",
          hours: 2,
          inventory: { rations: 2 },
        },
        fail: {
          text: "The skull you remembered is already a magpie church. He shrugs and goes back to the awl.",
          hours: 2,
          meters: { energy: -6 },
        },
      },
    ],
  },
  {
    id: "fal-oneshot-bents-boy",
    season: "fall",
    locations: ["lightning-pine", "creek", "high-camp"],
    text: "A boy from Bent’s Fort, too young for the coat he stole, asks if this is the way to Taos. It is not. He has a sack of green coffee and no sense of ridges.",
    choices: [
      {
        id: "set",
        label: "Set him on the trace and take a handful of beans",
        outcome: {
          text: "You draw the line in dirt. He repeats it wrong, then less wrong. The coffee will be a morale you can boil.",
          hours: 2,
          extraAdd: "green-coffee",
          unlockLocation: "mexican-trail-camp",
        },
      },
      { id: "keep", label: "Tell him to go back to the Arkansas", outcome: { text: "He looks at the mountains as if they had insulted him, and turns. Maybe he lives.", hours: 1 } },
    ],
  },
  {
    id: "fal-cache-dispute",
    season: "fall",
    locations: ["talus-ice-cave", "cache-deadfall"],
    text: "A stranger is standing over the ice as if it were a deed. “I hung meat here in September. That’s my mark. That’s my winter. You’re a thief or you’re leaving.”",
    choices: [
      {
        id: "talk",
        label: "Show him your own mark and keep your voice level",
        check: { trait: "savvy", dc: 13 },
        success: {
          text: "He looks longer than pride wants. Then he splits the difference: you each take a day of someone else’s elk and stack the rest for January.",
          hours: 2,
          inventory: { rations: 1 },
          meters: { warmth: -8 },
        },
        fail: {
          text: "He decides your mouth is the problem.",
          hours: 1,
          startSkirmish: {
            intro: "The man would rather settle a cache with a knife than with arithmetic.",
            foes: [{ id: "cache-claim", name: "Cache claimant", hp: 16, maxHp: 16, range: "near", damage: [3, 8] }],
          },
        },
      },
      {
        id: "leave",
        label: "Back out. Meat is not worth this man",
        outcome: { text: "He watches you go like a door closing. The cave keeps whatever story is true.", hours: 1, meters: { warmth: -4 } },
      },
    ],
  },
];
