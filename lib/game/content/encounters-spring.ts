import type { EncounterDef } from "@/lib/game/types";

export const SPRING_ENCOUNTERS: EncounterDef[] = [
  {
    id: "spr-camp-drip",
    season: "spring",
    locations: ["high-camp"],
    text: "Meltwater needles through the lean-to roof and finds your neck. The poles have shifted in the thaw.",
    choices: [
      {
        id: "fix",
        label: "Re-lash the poles",
        check: { trait: "hands", dc: 11 },
        success: {
          text: "You reset the frame. The drip becomes a polite leak. You will sleep less wet.",
          hours: 2,
          meters: { energy: -8, warmth: 6 },
        },
        fail: {
          text: "A pole kicks free and clips your brow. The lean-to looks worse, which you would not have thought possible.",
          hours: 2,
          meters: { health: -6, energy: -10 },
        },
      },
      {
        id: "move",
        label: "Shift your bed out of the drip",
        outcome: { text: "You sleep in a smaller dry island. The roof keeps its opinion.", hours: 1, meters: { warmth: -4 } },
      },
    ],
  },
  {
    id: "spr-creek-ice-shelf",
    season: "spring",
    locations: ["creek"],
    text: "An ice shelf still roofs the fastest water. A drowned doe is locked in it like a saint.",
    choices: [
      {
        id: "cut",
        label: "Cut meat from the ice",
        check: { trait: "hands", dc: 13 },
        success: {
          text: "You take a haunch before the creek takes you. It will smell. You will eat it anyway.",
          hours: 2,
          inventory: { rations: 2 },
          meters: { warmth: -12 },
        },
        fail: {
          text: "The shelf calved. You come out coughing creek. The doe keeps her dignity.",
          hours: 2,
          meters: { health: -10, warmth: -22, energy: -10 },
        },
      },
      { id: "leave", label: "Leave the dead to the water", outcome: { text: "You walk on. Hunger files a complaint.", hours: 1 } },
    ],
  },
  {
    id: "spr-timber-lost",
    season: "spring",
    locations: ["timberline"],
    text: "Fog sits in the krummholz. Your own tracks come back to you like a bad joke.",
    choices: [
      {
        id: "climb",
        label: "Climb a snag and read the country",
        check: { trait: "eye", dc: 12 },
        success: {
          text: "The Front Range lines up. You find the switchback you meant to be on.",
          hours: 2,
          meters: { energy: -8 },
        },
        fail: {
          text: "The snag is glassed with melt. You slide and eat bark. An hour becomes three.",
          hours: 3,
          meters: { health: -5, energy: -14 },
        },
      },
      {
        id: "wait",
        label: "Sit until the fog thins",
        outcome: { text: "Patience works. The trees remember their spacing.", hours: 3, meters: { warmth: -8 } },
      },
    ],
  },
  {
    id: "spr-cabin-smoke",
    season: "spring",
    locations: ["abandoned-cabin"],
    text: "Fresh smoke from the cabin stove. Someone is home who was not, last you heard.",
    choices: [
      {
        id: "knock",
        label: "Announce yourself",
        outcome: {
          text: "Eliza’s voice, or a voice like hers, tells you to come in with empty hands.",
          hours: 1,
          presentCharacter: "eliza-ward",
        },
      },
      {
        id: "watch",
        label: "Watch from the timber",
        check: { trait: "eye", dc: 12 },
        success: {
          text: "It is Eliza. She is counting charges on the sill. She has not seen you yet.",
          hours: 1,
          presentCharacter: "eliza-ward",
        },
        fail: {
          text: "A dog you did not know she had starts. You step out like a thief, which you are not, yet.",
          hours: 1,
          presentCharacter: "eliza-ward",
          standing: { id: "eliza-ward", delta: -1 },
        },
      },
    ],
  },
  {
    id: "spr-pass-caravan",
    season: "spring",
    locations: ["south-pass"],
    text: "Far below, a string of dots that want to be a caravan. Too early. The white still owns the cut.",
    choices: [
      {
        id: "watch",
        label: "Watch until your eyes water",
        outcome: {
          text: "They turn back. One animal does not. The pass keeps a mule like a tithe.",
          hours: 2,
          meters: { warmth: -10 },
        },
      },
      {
        id: "signal",
        label: "Fire a shot to warn them",
        outcome: {
          text: "The shot is a small thunder. They do not turn. Powder is a language they do not owe you.",
          hours: 1,
          inventory: { powder: -1 },
        },
      },
    ],
  },
  {
    id: "spr-beaver-kit",
    season: "spring",
    locations: ["beaver-meadow"],
    text: "A beaver kit is stranded on a collapsing lodge. The mother slaps water like a drum.",
    choices: [
      {
        id: "help",
        label: "Wade and lift it back",
        check: { trait: "grit", dc: 12 },
        success: {
          text: "Cold to the hip. The kit bites you and lives. Otter That Waits, if he hears, will know.",
          hours: 2,
          meters: { warmth: -18, health: -3 },
          standing: { id: "otter-that-waits", delta: 1 },
        },
        fail: {
          text: "You go in and come out with nothing but a cough. The lodge finishes falling.",
          hours: 2,
          meters: { warmth: -20, health: -6 },
        },
      },
      { id: "leave", label: "It is not your church", outcome: { text: "The slapping follows you out of the willows.", hours: 1 } },
    ],
  },
  {
    id: "spr-burn-morel",
    season: "spring",
    locations: ["burned-timber"],
    text: "Morels shoulder up through charcoal like a secret. A whole supper if you know them. A funeral if you do not.",
    choices: [
      {
        id: "pick",
        label: "Pick what you are sure of",
        check: { trait: "eye", dc: 13 },
        success: { text: "You take a hatful. They smell like the woods forgiving you.", hours: 2, inventory: { rations: 2 } },
        fail: {
          text: "One of them was a look-alike. Night will be educational.",
          hours: 2,
          inventory: { rations: 1 },
          meters: { health: -12 },
        },
      },
      { id: "skip", label: "Leave the mushrooms", outcome: { text: "Hunger stays honest.", hours: 1 } },
    ],
  },
  {
    id: "spr-chute-cornice",
    season: "spring",
    locations: ["avalanche-chute"],
    text: "A cornice hangs over the chute like a held breath. Your weight is a suggestion it does not like.",
    choices: [
      {
        id: "edge",
        label: "Cross the rocks at the edge",
        check: { trait: "hands", dc: 14 },
        success: { text: "You make the far side with your heart in your teeth.", hours: 2, meters: { energy: -12 }, unlockLocation: "grizzly-basin" },
        fail: {
          text: "Snow moves. Not the mountain — just your footing. You ride scree and live uglier.",
          hours: 3,
          meters: { health: -14, energy: -16 },
        },
      },
      { id: "back", label: "Turn back", outcome: { text: "Pride can starve. You still have knees.", hours: 1 } },
    ],
  },
  {
    id: "spr-spring-drunk",
    season: "spring",
    locations: ["hot-spring"],
    text: "A man is asleep in the hottest pool with his hat over his face. His mule is eating your patience.",
    choices: [
      {
        id: "wake",
        label: "Wake him before he cooks",
        outcome: {
          text: "Silas sits up like a resurrected debt. “I was praying.” He shares jerky that has seen things.",
          hours: 1,
          inventory: { rations: 1 },
          presentCharacter: "silas-crowe",
          standing: { id: "silas-crowe", delta: 1 },
        },
      },
      {
        id: "mule",
        label: "Search the mule",
        outcome: {
          text: "A flask and a moldy biscuit. Silas wakes anyway and calls you a relative of magpies.",
          hours: 1,
          inventory: { rations: 1 },
          standing: { id: "silas-crowe", delta: -2 },
          presentCharacter: "silas-crowe",
        },
      },
    ],
  },
  {
    id: "spr-wallow-calf",
    season: "spring",
    locations: ["elk-wallow"],
    text: "An elk cow stares from the willow. A calf is stuck in last night’s freeze-thaw mud.",
    choices: [
      {
        id: "free",
        label: "Free the calf and back away",
        check: { trait: "grit", dc: 13 },
        success: {
          text: "She lets you live, which is the whole payment. Mud to the belt. Tracks you can follow later.",
          hours: 2,
          meters: { energy: -10, warmth: -8 },
        },
        fail: {
          text: "She charges far enough to make the point. You limp. The calf stays a problem for God.",
          hours: 2,
          meters: { health: -12, energy: -10 },
        },
      },
      { id: "hunt", label: "Take the calf", outcome: { text: "You cannot bring yourself to. Or you can, and do not. Same hour either way.", hours: 1 } },
    ],
  },
  {
    id: "spr-saddle-hawk",
    season: "spring",
    locations: ["wind-saddle"],
    text: "A hawk hangs in the wind as if nailed there. Below, a scrap of blue cloth on a cairn.",
    choices: [
      {
        id: "cloth",
        label: "Take the cloth",
        outcome: {
          text: "A child’s bonnet, faded. You put it in your shirt. Some weights are not meat.",
          hours: 1,
          extraAdd: "blue-bonnet",
        },
      },
      { id: "leave", label: "Leave the cairn", outcome: { text: "The hawk does not care. That is its job.", hours: 1 } },
    ],
  },
  {
    id: "spr-fall-calve",
    season: "spring",
    locations: ["frozen-fall"],
    text: "The ice pillar groans. A slab the size of a wagon door leans toward the pool.",
    choices: [
      {
        id: "run",
        label: "Get off the ice",
        outcome: { text: "It falls where you were. The pool becomes a wound. You are not in it.", hours: 1, meters: { energy: -8 } },
      },
      {
        id: "watch",
        label: "Watch from too close",
        check: { trait: "eye", dc: 11 },
        success: { text: "You read the crack and step off a breath early. Spray soaks you. You live.", hours: 1, meters: { warmth: -14 } },
        fail: {
          text: "Spray and ice find you. A rib complains for days.",
          hours: 1,
          meters: { health: -10, warmth: -16 },
        },
      },
    ],
  },
  {
    id: "spr-pine-letter",
    season: "spring",
    locations: ["lightning-pine"],
    text: "Someone has nailed a folded paper to the split pine. The nail is newer than the tree’s wound.",
    choices: [
      {
        id: "read",
        label: "Read it",
        outcome: {
          text: "“If you are Hennepin’s, turn around. If you are hungry, the deadfall has one night of flour. — P.D.”",
          hours: 1,
          unlockLocation: "cache-deadfall",
          presentCharacter: null,
        },
      },
      {
        id: "leave",
        label: "Leave the nail its mail",
        outcome: { text: "You are not the only one who walks this goat trail.", hours: 1 },
      },
    ],
  },
  {
    id: "spr-trail-padre",
    season: "spring",
    locations: ["mexican-trail-camp"],
    text: "A mule bell. Then a cassock that has been mended with saddle thread.",
    choices: [
      {
        id: "hail",
        label: "Hail the padre",
        outcome: {
          text: "Padre Tomás raises two fingers. He looks glad to see a living sinner.",
          hours: 1,
          presentCharacter: "padre-tomas",
        },
      },
      { id: "hide", label: "Stay in the sage", outcome: { text: "He passes. The bell becomes weather.", hours: 1 } },
    ],
  },
  {
    id: "spr-arapaho-empty",
    season: "spring",
    locations: ["arapaho-ground"],
    text: "Lodge rings and a rack of drying poles. No people. A dog skull, painted, on a stick.",
    choices: [
      {
        id: "touch",
        label: "Touch nothing and leave a ration",
        outcome: {
          text: "You set food on a stone and back out. The park watches you do it.",
          hours: 1,
          inventory: { rations: -1 },
          standing: { id: "nawat", delta: 1 },
        },
      },
      {
        id: "take",
        label: "Look for what they left",
        outcome: {
          text: "A handful of dried squash. You feel observed from a long way off.",
          hours: 1,
          inventory: { rations: 1 },
          standing: { id: "nawat", delta: -2 },
        },
      },
    ],
  },
  {
    id: "spr-cache-open",
    season: "spring",
    locations: ["cache-deadfall"],
    text: "The deadfall has been dug. Fresh dirt. A boot print with a nick in the heel.",
    choices: [
      {
        id: "follow",
        label: "Follow the nicked heel",
        check: { trait: "eye", dc: 13 },
        success: {
          text: "The print walks toward the ruin and then forgets to be careful. You learn the way.",
          hours: 2,
          unlockLocation: "homesteader-ruin",
        },
        fail: { text: "Melt smears the rest. You know a thief exists. That is all.", hours: 2, meters: { energy: -8 } },
      },
      {
        id: "dig",
        label: "Dig anyway",
        outcome: { text: "A tin with two fingers of powder and a dead mouse.", hours: 1, inventory: { powder: 1 } },
      },
    ],
  },
  {
    id: "spr-cave-drip",
    season: "spring",
    locations: ["talus-ice-cave"],
    text: "The ice cave is weeping. Last fall’s elk cache is a wet suggestion and a smell.",
    choices: [
      {
        id: "salvage",
        label: "Salvage what has not turned",
        check: { trait: "eye", dc: 12 },
        success: { text: "You cut away the green and keep a day of meat. The cave keeps the rest.", hours: 2, inventory: { rations: 1 }, meters: { warmth: -10 } },
        fail: { text: "You guess wrong. By evening you are a furnace and a ditch.", hours: 2, meters: { health: -14 }, inventory: { rations: 1 } },
      },
      { id: "out", label: "Get out of the cold throat", outcome: { text: "Daylight feels invented.", hours: 1 } },
    ],
  },
  {
    id: "spr-ruin-shoe",
    season: "spring",
    locations: ["homesteader-ruin"],
    text: "Melt uncovers a child’s shoe in the chimney weeds. Martha is at the other well, not looking.",
    choices: [
      {
        id: "martha",
        label: "Take the shoe to Martha",
        outcome: {
          text: "She puts it in her apron without theater. “I know whose. Thank you for not making a speech.”",
          hours: 1,
          presentCharacter: "martha-keene",
          standing: { id: "martha-keene", delta: 1 },
        },
      },
      { id: "bury", label: "Bury it where you found it", outcome: { text: "The ground is still half frozen. You do a small correct thing.", hours: 2, meters: { energy: -8 } } },
    ],
  },
  {
    id: "spr-basin-wake",
    season: "spring",
    locations: ["grizzly-basin"],
    text: "A bear-shaped patch of last snow is not snow. It rolls over. Too early, too hungry.",
    choices: [
      {
        id: "back",
        label: "Back out slow",
        check: { trait: "grit", dc: 12 },
        success: { text: "You become landscape. It goes back to being tired.", hours: 2 },
        fail: {
          text: "A stick cracks under you. The basin gets loud.",
          hours: 1,
          startSkirmish: {
            intro: "The bear decides you are food that walks.",
            foes: [{ id: "bear", name: "Lean grizzly", hp: 28, maxHp: 28, range: "near", damage: [5, 11] }],
          },
        },
      },
      {
        id: "shot",
        label: "A warning shot",
        outcome: {
          text: "The shot startles it uphill. Powder gone. Your hands buzz.",
          hours: 1,
          inventory: { powder: -1 },
          meters: { energy: -6 },
        },
      },
    ],
  },
  {
    id: "spr-rim-antelope",
    season: "spring",
    locations: ["south-park-rim"],
    text: "Antelope like spilled grain on the park. Too far for a clean shot. Close enough to hurt your hope.",
    choices: [
      {
        id: "stalk",
        label: "Stalk the long way",
        check: { trait: "eye", dc: 14 },
        success: { text: "One animal drops. You will be heavy and glad for a day.", hours: 4, inventory: { rations: 3, pelts: 1 }, meters: { energy: -16 } },
        fail: { text: "The park empties as if you shouted. You walk back lighter.", hours: 4, meters: { energy: -16 } },
      },
      { id: "save", label: "Save the powder", outcome: { text: "Hunger and ammunition have a long marriage.", hours: 1 } },
    ],
  },
  {
    id: "spr-ute-return",
    season: "spring",
    locations: ["ute-camp"],
    text: "Lodge skins are going up. Dogs, children, smoke. The camp is a camp again.",
    choices: [
      {
        id: "edge",
        label: "Wait at the edge with empty hands",
        outcome: {
          text: "Two Crows finds you before the dogs finish the debate.",
          hours: 1,
          presentCharacter: "two-crows",
        },
      },
      {
        id: "walkin",
        label: "Walk straight in",
        check: { trait: "savvy", dc: 13 },
        success: { text: "Someone laughs at your nerve and points you to Two Crows.", hours: 1, presentCharacter: "two-crows" },
        fail: { text: "You are turned. Not unkindly. Very clearly.", hours: 1, standing: { id: "two-crows", delta: -1 } },
      },
    ],
  },
  {
    id: "spr-oneshot-funeral",
    season: "spring",
    locations: "any",
    text: "Three men and a wrapped body on a travois. They ask if the ground here is soft enough. It is not.",
    choices: [
      {
        id: "help",
        label: "Help them dig anyway",
        outcome: {
          text: "You spend hours on a grave the thaw barely permits. They leave you coffee that is mostly burnt grain.",
          hours: 4,
          meters: { energy: -18, warmth: -6 },
          inventory: { rations: 1 },
        },
      },
      { id: "point", label: "Point them toward lower country", outcome: { text: "They nod and take their dead downhill. You keep your hours.", hours: 1 } },
    ],
  },
  {
    id: "spr-oneshot-mule",
    season: "spring",
    locations: "any",
    text: "A mule stands in the willows with a broken pack saddle and no person attached.",
    choices: [
      {
        id: "catch",
        label: "Catch it",
        check: { trait: "hands", dc: 12 },
        success: {
          text: "You get a hand on the hackamore. In the pack: cornmeal, a shoeing hammer, a letter addressed to Bent’s.",
          hours: 2,
          inventory: { rations: 2 },
          extraAdd: "bents-letter",
        },
        fail: { text: "It runs like it has heard this story. You eat mud.", hours: 2, meters: { energy: -10 } },
      },
      { id: "leave", label: "Leave it", outcome: { text: "Someone’s luck is still walking around.", hours: 1 } },
    ],
  },
  {
    id: "spr-oneshot-deserter",
    season: "spring",
    locations: ["wind-saddle", "south-pass", "mexican-trail-camp"],
    text: "A man in a faded Mexican coat asks for powder and does not offer a name. His boots are army and his eyes are not.",
    choices: [
      {
        id: "share",
        label: "Give him a charge",
        outcome: { text: "He says a village name you do not know and is gone before gratitude can get dressed.", hours: 1, inventory: { powder: -1 } },
      },
      {
        id: "ask",
        label: "Ask who he ran from",
        check: { trait: "savvy", dc: 13 },
        success: { text: "“A captain who liked hanging more than maps.” He pays you with a warning about the chute.", hours: 1, unlockLocation: "avalanche-chute" },
        fail: { text: "He puts a hand on a knife and you both decide this is over.", hours: 1 },
      },
    ],
  },
  {
    id: "spr-camp-raven",
    season: "spring",
    locations: ["high-camp"],
    text: "A raven has learned the lean-to. It steals a strip of rawhide and lectures you from a pole.",
    choices: [
      { id: "ignore", label: "Let it have the hide", outcome: { text: "You are not going to win an argument with a raven.", hours: 1 } },
      {
        id: "throw",
        label: "Throw a stick",
        outcome: { text: "It drops a shiny button it had been keeping. Useless. Charming. Yours.", hours: 1, extraAdd: "raven-button" },
      },
    ],
  },
  {
    id: "spr-creek-mayfly",
    season: "spring",
    locations: ["creek"],
    text: "The first hatch. Trout dimple like rain that forgot the sky.",
    choices: [
      {
        id: "fish",
        label: "Fish with a bent pin and pride",
        check: { trait: "hands", dc: 12 },
        success: { text: "Two trout. You feel briefly like a person with a plan.", hours: 3, inventory: { rations: 2 }, meters: { energy: -8 } },
        fail: { text: "The trout are theologians. You are not convincing.", hours: 3, meters: { energy: -10 } },
      },
      { id: "watch", label: "Just watch", outcome: { text: "An hour that does not try to kill you. Rare.", hours: 1, meters: { energy: 4 } } },
    ],
  },
  {
    id: "spr-ned-tracks",
    season: "spring",
    locations: ["timberline", "lightning-pine"],
    text: "City-boot tracks, too small, wandering. A boy’s voice trying not to be a boy’s voice.",
    choices: [
      {
        id: "call",
        label: "Call out",
        outcome: { text: "Ned Calhoun comes out of the krummholz like a confession.", hours: 1, presentCharacter: "ned-calhoun" },
      },
      { id: "quiet", label: "Follow quiet", outcome: { text: "You find him anyway. He flinches as if you were weather.", hours: 1, presentCharacter: "ned-calhoun" } },
    ],
  },
  {
    id: "spr-hennepin-paper",
    season: "spring",
    locations: ["abandoned-cabin", "south-pass"],
    text: "A Company man is nailing a notice to a tree as if trees could read.",
    choices: [
      {
        id: "read",
        label: "Read the notice",
        outcome: {
          text: "Bounties on “unlicensed plews.” Hennepin smiles like a closed trap.",
          hours: 1,
          presentCharacter: "hennepin",
        },
      },
      { id: "pass", label: "Walk past", outcome: { text: "Paper is not weather. You can ignore it until you cannot.", hours: 1 } },
    ],
  },
  {
    id: "spr-jb-canoe",
    season: "spring",
    locations: ["beaver-meadow", "creek"],
    text: "A canoe, of all things, half-built from bark and optimism. Jean-Baptiste is arguing with a rib.",
    choices: [
      {
        id: "help",
        label: "Hold the rib",
        outcome: { text: "He sings. You hold. The canoe will never see a real river. He gives you tobacco anyway.", hours: 3, extraAdd: "willow-tobacco", presentCharacter: "jean-baptiste", standing: { id: "jean-baptiste", delta: 1 } },
      },
      { id: "mock", label: "Ask where he plans to paddle", outcome: { text: "“Downhill, always.” He does not invite you to hold anything.", hours: 1, presentCharacter: "jean-baptiste" } },
    ],
  },
  {
    id: "spr-storm-first",
    season: "spring",
    weather: ["storm"],
    locations: "any",
    text: "A spring storm arrives like a fist. Lightning chooses a ridge you were about to walk.",
    choices: [
      {
        id: "low",
        label: "Get low and wait",
        outcome: { text: "Thunder walks over you. You count between flashes like a child.", hours: 3, meters: { warmth: -12, energy: -8 } },
      },
      {
        id: "push",
        label: "Push through",
        check: { trait: "grit", dc: 14 },
        success: { text: "You come out the other side ringing. The ridge behind you is smoking.", hours: 2, meters: { energy: -12 } },
        fail: { text: "A near strike puts you down. You taste metal until dark.", hours: 3, meters: { health: -12, energy: -16 } },
      },
    ],
  },
  {
    id: "spr-wind-tent",
    season: "spring",
    weather: ["wind"],
    locations: ["high-camp", "wind-saddle", "south-pass"],
    text: "The wind finds a loose lashing and turns your tarp into a flag.",
    choices: [
      {
        id: "chase",
        label: "Chase it",
        check: { trait: "grit", dc: 11 },
        success: { text: "You catch canvas before the mountain files it. Fingers numb, tarp yours.", hours: 1, meters: { warmth: -8 } },
        fail: { text: "It leaves for Kansas. You will sleep harder.", hours: 1, meters: { warmth: -12 } },
      },
      { id: "let", label: "Let it go", outcome: { text: "You still have a coat. You tell yourself that twice.", hours: 1 } },
    ],
  },
  {
    id: "spr-oneshot-survey",
    season: "spring",
    locations: ["south-park-rim", "wind-saddle"],
    text: "A man with a theodolite is trying to make the park confess its miles. His assistant has already quit.",
    choices: [
      {
        id: "hold",
        label: "Hold the rod for pay",
        outcome: { text: "He pays in hardtack and a lecture on longitude. Millicent would have done it better.", hours: 4, inventory: { rations: 2 }, meters: { energy: -12 } },
      },
      { id: "no", label: "Keep your hours", outcome: { text: "Science can starve without you.", hours: 1 } },
    ],
  },
  {
    id: "spr-oneshot-midwife",
    season: "spring",
    locations: ["abandoned-cabin", "homesteader-ruin"],
    text: "A girl from nowhere is looking for “the woman who catches babies.” Her hands are shaking.",
    choices: [
      {
        id: "hannah",
        label: "Take her to Hannah",
        outcome: { text: "Hannah opens the door like a verdict. You are dismissed. That is success.", hours: 2, presentCharacter: "hannah-briggs", standing: { id: "hannah-briggs", delta: 1 } },
      },
      { id: "shrug", label: "Point vaguely west", outcome: { text: "She goes. You hope the west is populated.", hours: 1 } },
    ],
  },
  {
    id: "spr-oneshot-bible",
    season: "spring",
    locations: ["lightning-pine", "cache-deadfall"],
    text: "A soaked Bible, open to Job, weighted with a stone. No owner in sight.",
    choices: [
      { id: "take", label: "Take it to dry", outcome: { text: "The pages fuse. You have a brick of scripture and no answers.", hours: 1, extraAdd: "wet-bible" } },
      { id: "leave", label: "Leave Job to the weather", outcome: { text: "He has survived worse editors.", hours: 1 } },
    ],
  },
  {
    id: "spr-oneshot-trapline",
    season: "spring",
    locations: ["timberline", "burned-timber", "beaver-meadow"],
    text: "A trapline that is not yours, freshly baited. The owner will be back before the meat is.",
    choices: [
      {
        id: "rob",
        label: "Rob a trap",
        outcome: {
          text: "A marten. Also a feeling you will meet someone with a claim.",
          hours: 1,
          inventory: { pelts: 1, rations: 1 },
          standing: { id: "caleb-briggs", delta: -2 },
        },
      },
      { id: "leave", label: "Leave the line", outcome: { text: "You walk around another man’s hunger.", hours: 1 } },
    ],
  },
  {
    id: "spr-briggs-smoke",
    season: "spring",
    locations: ["timberline", "elk-wallow"],
    text: "Two columns of smoke, close together. Brothers, or a signal, or both.",
    choices: [
      { id: "hail", label: "Walk in openly", outcome: { text: "Caleb looks at your hands. Amos looks at your face. You are invited to the ugly work.", hours: 1, presentCharacter: "caleb-briggs" } },
      { id: "avoid", label: "Give the smoke room", outcome: { text: "Not every fire is a greeting.", hours: 1 } },
    ],
  },
  {
    id: "spr-peggy-mark",
    season: "spring",
    locations: ["lightning-pine"],
    text: "A woman is already at the pine with a knife, recutting a blaze that melt tried to erase.",
    choices: [
      { id: "hello", label: "Say you read her note", outcome: { text: "Peggy Dunne looks pleased and untrusting in equal measure.", hours: 1, presentCharacter: "peggy-dunne" } },
      { id: "by", label: "Pass by", outcome: { text: "She does not stop cutting.", hours: 1 } },
    ],
  },
  {
    id: "spr-oneshot-teeth",
    season: "spring",
    locations: ["grizzly-basin", "talus-ice-cave"],
    text: "A necklace of bear teeth hung on a willow. Still pink at the roots.",
    choices: [
      { id: "take", label: "Take it", outcome: { text: "It is heavier than jewelry. You feel watched by a profession.", hours: 1, extraAdd: "bear-teeth" } },
      { id: "leave", label: "Leave the offering", outcome: { text: "Some signs are not for you.", hours: 1 } },
    ],
  },
  {
    id: "spr-oneshot-wagon",
    season: "spring",
    locations: ["south-park-rim", "mexican-trail-camp"],
    text: "A wagon tongue, snapped, and a trunk of dresses no one should have hauled this high.",
    choices: [
      { id: "cloth", label: "Tear cloth for bandages", outcome: { text: "Silk makes poor bandages and good kindling. You take both truths.", hours: 1, extraAdd: "silk-rags", inventory: { firewood: 1 } } },
      { id: "leave", label: "Leave the trunk", outcome: { text: "Someone’s hope is already out of fashion.", hours: 1 } },
    ],
  },
  {
    id: "spr-snow-last",
    season: "spring",
    weather: ["snow"],
    locations: "any",
    text: "A last wet snow, heavy as laundry. Branches come down around you like bad news.",
    choices: [
      {
        id: "hunker",
        label: "Hunker under a ledge",
        outcome: { text: "You wait out the white. Wet to the bone, alive to the bone.", hours: 3, meters: { warmth: -16, energy: -8 } },
      },
      {
        id: "push",
        label: "Keep walking",
        check: { trait: "grit", dc: 13 },
        success: { text: "You bull through. The snow turns to insult and then to drip.", hours: 2, meters: { warmth: -12 } },
        fail: { text: "A branch finds your shoulder. You sit down without meaning to.", hours: 3, meters: { health: -8, warmth: -18 } },
      },
    ],
  },
  {
    id: "spr-camp-stars",
    season: "spring",
    locations: ["high-camp"],
    text: "The thaw wind dies after dark. The Milky Way is a road you cannot take.",
    choices: [
      { id: "watch", label: "Watch until you shake", outcome: { text: "Cold gets in. So does a kind of quiet you will miss in July.", hours: 2, meters: { warmth: -10, energy: 6 } } },
      { id: "sleep", label: "Bank the fire and sleep", outcome: { text: "You crawl into the bag while the sky does its work.", hours: 1, meters: { warmth: 6 } } },
    ],
  },
  {
    id: "spr-creek-boy",
    season: "spring",
    locations: ["creek"],
    text: "Ned is trying to drink from a place the current could take a horse. He does not know that.",
    choices: [
      { id: "yank", label: "Yank him back", outcome: { text: "He sputters and thanks you too many times. You show him melt, not current.", hours: 1, presentCharacter: "ned-calhoun", standing: { id: "ned-calhoun", delta: 1 } } },
      { id: "yell", label: "Yell from the bank", outcome: { text: "He hears you. Barely. He will pretend he was fine.", hours: 1, presentCharacter: "ned-calhoun" } },
    ],
  },
  {
    id: "spr-oneshot-priest-boy",
    season: "spring",
    locations: ["mexican-trail-camp", "hot-spring"],
    text: "A boy with a wooden cross asks if you have seen a priest with a lame mule.",
    choices: [
      { id: "yes", label: "Point him toward the trail camp", outcome: { text: "He runs. Faith has better knees than you do.", hours: 1, standing: { id: "padre-tomas", delta: 1 } } },
      { id: "no", label: "Shake your head", outcome: { text: "He believes you. That is on both of you.", hours: 1 } },
    ],
  },
  {
    id: "spr-oneshot-claim",
    season: "spring",
    locations: ["abandoned-cabin", "cache-deadfall"],
    text: "A stranger is pounding a stake by the cabin as if paper could hold timber.",
    choices: [
      {
        id: "talk",
        label: "Tell him the stove has an owner",
        check: { trait: "savvy", dc: 12 },
        success: { text: "He swears and pulls the stake. Eliza will hear you did this.", hours: 1, standing: { id: "eliza-ward", delta: 1 } },
        fail: {
          text: "He decides you are the obstacle.",
          hours: 1,
          startSkirmish: {
            intro: "The claim jumper would rather bury a witness than a stake.",
            foes: [{ id: "jumper", name: "Claim jumper", hp: 14, maxHp: 14, range: "near", damage: [3, 7] }],
          },
        },
      },
      { id: "geteliza", label: "Go find Eliza", outcome: { text: "If she is here, this becomes her problem. If not, it becomes worse.", hours: 1, presentCharacter: "eliza-ward" } },
    ],
  },
  {
    id: "spr-hot-mineral",
    season: "spring",
    locations: ["hot-spring"],
    text: "The spring is chalked with mineral. Sitting in it too long will unknit you and then refuse to knit you back.",
    choices: [
      { id: "short", label: "A short soak", outcome: { text: "Heat enters the places winter stored itself. You come out human.", hours: 2, meters: { warmth: 22, energy: 8, health: 6 } } },
      { id: "long", label: "Stay until you see spots", outcome: { text: "You crawl out cooked and foolish. The night will be worse.", hours: 3, meters: { warmth: 10, energy: -16, health: -6 } } },
    ],
  },
  {
    id: "spr-wood-pitch",
    season: "spring",
    locations: ["timberline", "lightning-pine", "burned-timber"],
    text: "A fatwood stump, gold at the heart. Enough pitch to start a fire in a baptism.",
    choices: [
      { id: "split", label: "Split it out", outcome: { text: "Your hatchet sings. You pocket gold that burns.", hours: 2, inventory: { firewood: 2 }, extraAdd: "fatwood", meters: { energy: -8 } } },
      { id: "mark", label: "Blaze it and come back", outcome: { text: "You will forget, or you will not. The stump stays.", hours: 1 } },
    ],
  },
  {
    id: "spr-oneshot-singer",
    season: "spring",
    locations: ["creek", "beaver-meadow"],
    text: "Someone is singing a hymn in a language you almost know. When you come around the willow, no one is there. A wet print. A tin cup.",
    choices: [
      { id: "cup", label: "Take the cup", outcome: { text: "It still holds coffee heat. You drink a ghost’s breakfast.", hours: 1, meters: { thirst: 8, warmth: 4 } } },
      { id: "call", label: "Call hello", outcome: { text: "The hymn does not answer. Birds do, badly.", hours: 1 } },
    ],
  },
  {
    id: "spr-oneshot-wolfbirds",
    season: "spring",
    locations: ["elk-wallow", "grizzly-basin"],
    text: "Ravens yelling over a gut pile. Wolves have eaten and left a ribcage like architecture.",
    choices: [
      { id: "bone", label: "Crack a bone for marrow", outcome: { text: "It is work. It is food. Your knife earns its keep.", hours: 1, inventory: { rations: 1 }, meters: { energy: -6 } } },
      { id: "go", label: "Leave before the owners return", outcome: { text: "Wisdom tastes like nothing. That is still a taste.", hours: 1 } },
    ],
  },
  {
    id: "spr-clear-laundry",
    season: "spring",
    weather: ["clear"],
    locations: ["high-camp", "abandoned-cabin"],
    text: "A rare still morning. You could dry everything you own if you trusted the sky.",
    choices: [
      { id: "dry", label: "Hang your kit", outcome: { text: "By noon you have dry wool and a slightly better smell. The sky holds.", hours: 3, meters: { warmth: 10, energy: 6 } } },
      { id: "move", label: "Don’t waste a travel day", outcome: { text: "You walk. Your socks remain a theology.", hours: 1 } },
    ],
  },
  {
    id: "spr-ramon-early",
    season: "spring",
    locations: ["mexican-trail-camp", "south-park-rim"],
    text: "Mules too early in the year, chile on the wind. Ramón is betting the thaw like a card.",
    choices: [
      { id: "hail", label: "Hail the trader", outcome: { text: "He looks you over for pelts you do not have yet.", hours: 1, presentCharacter: "ramon-salazar" } },
      { id: "avoid", label: "Avoid a price list", outcome: { text: "Your poverty remains private.", hours: 1 } },
    ],
  },
  {
    id: "spr-vega-blood",
    season: "spring",
    locations: ["south-pass", "mexican-trail-camp"],
    text: "Blood on a rock, not dry. A man has been dragging himself toward the trail camp.",
    choices: [
      { id: "follow", label: "Follow the drag", outcome: { text: "You find Alejandro sitting up with a pride that is leaking.", hours: 1, presentCharacter: "alejandro-vega" } },
      { id: "careful", label: "Go careful — it could be bait", outcome: { text: "It is not bait. It is worse: a real man. You find him anyway.", hours: 2, presentCharacter: "alejandro-vega" } },
    ],
  },
];
