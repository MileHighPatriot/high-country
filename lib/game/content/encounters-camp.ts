import type { EncounterDef, LocationId } from "@/lib/game/types";

const CAMP_LOCS: LocationId[] = [
  "high-camp",
  "timberline",
  "creek",
  "beaver-meadow",
  "burned-timber",
  "lightning-pine",
  "cache-deadfall",
  "elk-wallow",
  "wind-saddle",
  "grizzly-basin",
  "avalanche-chute",
  "south-park-rim",
];

/** Pitch, strike, cook smoke, ready jobs, theft, visitors, animals. Spare Front Range, 1835. */
export const CAMP_ENCOUNTERS: EncounterDef[] = [
  {
    id: "camp-pitch-stone",
    locations: CAMP_LOCS,
    triggers: ["camp"],
    weight: 4,
    text: "You pick the ground the way a man picks a grave: for drainage, for wind, for the lie that this will be temporary. Stones for a ring. The mountain does not object. It does not agree either.",
    choices: [
      {
        id: "sit",
        label: "Sit in the ring and let it be a camp",
        outcome: {
          text: "The ring is a room with no walls. You sit in it until your hands believe the claim. Smoke, when it comes, will be a letter.",
          hours: 0,
          meters: { energy: -4 },
        },
      },
      {
        id: "work",
        label: "Keep stacking stone until dusk notices",
        outcome: {
          text: "You build the ring higher than sense. Wind will still find you. The work is for your own argument.",
          hours: 1,
          meters: { energy: -8, warmth: 4 },
        },
      },
    ],
  },
  {
    id: "camp-strike-stakes",
    locations: CAMP_LOCS,
    triggers: ["camp"],
    weight: 3,
    text: "Pulling stakes is a smaller death. The ground remembers the poles a day, then it does not. Ash, a ring of stone, the smell of meat that was yours.",
    choices: [
      {
        id: "go",
        label: "Load what fits and do not look back long",
        outcome: {
          text: "The pack takes what the pack can. The rest is a gift to ravens and whoever walks this bench next. You were a resident. Now you are weather.",
          hours: 0,
        },
      },
      {
        id: "mark",
        label: "Blaze a tree so you can lie to yourself later",
        outcome: {
          text: "A mark that means nothing to anyone honest. You will come back or you will not. The tree will not keep your mail.",
          hours: 0,
          extraAdd: "old-camp-blaze",
        },
      },
    ],
  },
  {
    id: "camp-cook-smoke-road",
    locations: CAMP_LOCS,
    triggers: ["smoke", "eat", "fire"],
    timeBands: ["dusk", "night", "afternoon"],
    weight: 5,
    text: "Your pot makes a road of smoke. Someone uses it. A shape at the timber-edge, empty hands, a hunger that has learned manners or is pretending.",
    choices: [
      {
        id: "in",
        label: "Let them sit",
        outcome: {
          text: "They take the fire like wages. Talk is small: pass, meat, who froze. They leave a twist of tobacco and the feeling of being less alone, which you will pay for later.",
          hours: 1,
          presentCharacter: "silas-crowe",
          extraAdd: "willow-tobacco",
          standing: { id: "silas-crowe", delta: 1 },
          remember: { id: "silas-crowe", tag: "sat-at-fire" },
        },
      },
      {
        id: "out",
        label: "Keep them in the dark",
        outcome: {
          text: "A nod, as if they expected it. The dark takes them back. You listen a long time after the footsteps stop, which is also a kind of company.",
          hours: 1,
          presentCharacter: null,
        },
      },
    ],
  },
  {
    id: "camp-cook-coyote",
    locations: CAMP_LOCS,
    triggers: ["smoke", "eat"],
    timeBands: ["dusk", "night"],
    weight: 4,
    text: "Fat pops. A coyote sits just outside the light with the patience of a clerk. Yellow eyes. It has learned that men cook and then become stupid.",
    choices: [
      {
        id: "scrap",
        label: "Throw it a scrap",
        outcome: {
          text: "It takes the scrap like pay. You and the coyote have a treaty until hunger writes a new one. The night goes on being the night.",
          hours: 0,
          inventory: { rations: -1 },
        },
      },
      {
        id: "stone",
        label: "Heave a stone and keep the pot",
        check: { trait: "grit", dc: 11 },
        success: {
          text: "It skitters. You keep the meat. The night keeps the coyote. You eat standing, which is a kind of prayer.",
          hours: 0,
        },
        fail: {
          text: "The stone misses. The coyote does not. A strip of meat goes into the dark and does not come back.",
          hours: 0,
          inventory: { rations: -1 },
        },
      },
    ],
  },
  {
    id: "camp-ready-jerky",
    locations: CAMP_LOCS,
    triggers: ["arrive", "camp"],
    weight: 4,
    text: "The rack has done its ugly arithmetic. Meat stiff as a legal document. Flies have voted and lost. If you do not take it, the ravens will file an appeal.",
    choices: [
      {
        id: "take",
        label: "Bag the jerky",
        outcome: {
          text: "You pack it like coin. It will keep longer than wet meat, which on this range is a theology.",
          hours: 0,
          inventory: { rations: 2 },
          extraAdd: "jerky",
        },
      },
      {
        id: "wait",
        label: "Leave it — you have hours yet",
        outcome: {
          text: "The rack keeps. So do the ravens. You tell yourself you will remember. Men tell themselves a lot of things.",
          hours: 0,
        },
      },
    ],
  },
  {
    id: "camp-ready-snares",
    locations: CAMP_LOCS,
    locationTags: ["game"],
    triggers: ["arrive", "camp", "snares"],
    weight: 3,
    text: "The snare line has had a night to think. Wire, fur, or the suggestion of a joke. You walk it because leaving it is how meat becomes a story.",
    choices: [
      {
        id: "walk",
        label: "Walk the sets",
        check: { trait: "hands", dc: 11 },
        success: {
          text: "A hare, stiff, honest. You reset the wire without a speech. Camp eats. The line stays hungry.",
          hours: 1,
          inventory: { rations: 1 },
        },
        fail: {
          text: "Empty loops. A feather. You bait them again with hope, which is poor bait, and walk back to the ring.",
          hours: 1,
        },
      },
    ],
  },
  {
    id: "camp-cache-theft",
    locations: CAMP_LOCS,
    triggers: ["arrive", "camp"],
    weight: 4,
    text: "The rock you left meat under is a rock again. Tracks: dog, or man wearing the idea of a dog. The country collected a tithe while you were a traveler.",
    choices: [
      {
        id: "curse",
        label: "Curse and dig a real pit next time",
        outcome: {
          text: "Anger is warm for a minute. Then it is only the hole. You will dig, or you will keep paying this tax.",
          hours: 0,
          extraRemove: "rock-theft",
        },
      },
      {
        id: "follow",
        label: "Read the tracks a little way",
        check: { trait: "savvy", dc: 13 },
        success: {
          text: "Coyote. You find a scrap of gristle and the knowledge that the rock was never a house. You turn back before the tracks become a hunt you cannot afford.",
          hours: 1,
          extraRemove: "rock-theft",
        },
        fail: {
          text: "The ground unwrites itself. You learn only that you are still here and poorer.",
          hours: 1,
          extraRemove: "rock-theft",
        },
      },
    ],
  },
  {
    id: "camp-visitor-silas",
    locations: CAMP_LOCS,
    triggers: ["smoke", "fire", "arrive"],
    timeBands: ["dawn", "dusk", "night"],
    characterId: "silas-crowe",
    weight: 3,
    text: "Silas Crowe is in your ring as if rent were paid. He has already judged the woodpile. “You cook loud,” he says. “The whole saddle knows you have a pot.”",
    choices: [
      {
        id: "share",
        label: "Share the pot",
        outcome: {
          text: "He eats like a man who has been doing this since before your name. After, he tells you which saddle loads snow. Some of it is even true.",
          hours: 1,
          inventory: { rations: -1 },
          standing: { id: "silas-crowe", delta: 1 },
          remember: { id: "silas-crowe", tag: "shared-meat" },
          presentCharacter: "silas-crowe",
        },
      },
      {
        id: "move",
        label: "Tell him this is not his bench",
        outcome: {
          text: "He laughs until he has to spit. “None of it is yours either.” He stays or he goes; the difference is smaller than pride.",
          hours: 1,
          standing: { id: "silas-crowe", delta: -1 },
          presentCharacter: "silas-crowe",
        },
      },
    ],
  },
  {
    id: "camp-visitor-ned",
    locations: CAMP_LOCS,
    triggers: ["smoke", "arrive", "eat"],
    characterId: "ned-calhoun",
    weight: 3,
    text: "Ned Calhoun is at the edge of the light with that city coat and a look that has been asking the country for a parent. Your smoke brought him. He does not apologize. He does not know how.",
    choices: [
      {
        id: "in",
        label: "Let him sit and eat",
        outcome: {
          text: "He eats like the food might be taken back. After, he sleeps with his boots on, which is the only correct theology. You have a boy at your fire. The mountain has noticed.",
          hours: 1,
          inventory: { rations: -1 },
          standing: { id: "ned-calhoun", delta: 2 },
          remember: { id: "ned-calhoun", tag: "sat-at-fire" },
          presentCharacter: "ned-calhoun",
        },
      },
      {
        id: "send",
        label: "Point him at timber and keep the pot",
        outcome: {
          text: "He nods too fast. Weather is coming or it isn’t. You do not watch him go. That is a kind of leaving too.",
          hours: 0,
          standing: { id: "ned-calhoun", delta: -2 },
          remember: { id: "ned-calhoun", tag: "left-in-storm" },
          presentCharacter: null,
        },
      },
    ],
  },
  {
    id: "camp-visitor-peggy",
    locations: CAMP_LOCS,
    triggers: ["smoke", "arrive", "camp"],
    characterId: "peggy-dunne",
    weight: 3,
    text: "Peggy Dunne walks into your camp as if she blazed it. Maybe she did. She looks at the pit, the rack, the way you stack wood. “You live like a person,” she says, which is not quite praise.",
    choices: [
      {
        id: "coffee",
        label: "Offer the pot and ask nothing",
        outcome: {
          text: "She drinks. She does not sit long. Before she goes she tells you which deadfall is hers this month, which is a map if you are honest.",
          hours: 1,
          standing: { id: "peggy-dunne", delta: 1 },
          remember: { id: "peggy-dunne", tag: "sat-at-fire" },
          presentCharacter: "peggy-dunne",
          unlockLocation: "cache-deadfall",
        },
      },
      {
        id: "ask",
        label: "Ask if she has seen your meat walking",
        outcome: {
          text: "She looks at your boots, then at your face. “If I took it you’d know. If a coyote took it you’d also know. Don’t make me a thief because you’re lonely.”",
          hours: 1,
          standing: { id: "peggy-dunne", delta: -1 },
          presentCharacter: "peggy-dunne",
        },
      },
    ],
  },
  {
    id: "camp-elk-rack",
    locations: CAMP_LOCS,
    locationTags: ["game"],
    triggers: ["arrive", "camp", "smoke"],
    weight: 3,
    repeatable: true,
    text: "An elk is at the rack. Not feeding — looking. A bull with last year’s antler still in the velvet of a decision. Your camp has become a salt lick of smell.",
    choices: [
      {
        id: "still",
        label: "Hold still and let it own the minute",
        outcome: {
          text: "It blows, stamps, and takes the timber. You are left with the size of the country in your chest and no meat. That is still a kind of luck.",
          hours: 0,
          meters: { energy: -2 },
        },
      },
      {
        id: "hunt",
        label: "Reach for the rifle",
        check: { trait: "eye", dc: 13 },
        success: {
          text: "The shot takes. Echo walks the bench and comes back thinner. You have more meat than the rack was built for, and a mess that will occupy the afternoon.",
          hours: 2,
          inventory: { powder: -1, rations: 3, pelts: 1 },
          meters: { energy: -10 },
        },
        fail: {
          text: "The shot goes into timber. The elk is in the next county. You have announced your camp to everything with ears.",
          hours: 1,
          inventory: { powder: -1 },
          meters: { energy: -6 },
        },
      },
    ],
  },
  {
    id: "camp-mule-smoke",
    locations: CAMP_LOCS,
    triggers: ["smoke", "arrive"],
    weight: 3,
    repeatable: true,
    text: "A mule stands in your smoke as if it paid the tax. Pack-saddle empty, one ear gone. Mexican trail, or a dead man’s luck. It does not run. It is past running.",
    choices: [
      {
        id: "gentle",
        label: "Speak to it and take the rope",
        check: { trait: "savvy", dc: 12 },
        success: {
          text: "It follows as far as the next seep and no farther. You get a share of whatever was on it: a tin, a little flour, the idea of a road.",
          hours: 1,
          inventory: { rations: 1 },
          extraAdd: "tin-pot",
        },
        fail: {
          text: "It bolts. You are left with mule smell and a story you will not tell correctly.",
          hours: 1,
          meters: { energy: -4 },
        },
      },
      {
        id: "leave",
        label: "Let it go. You are not a wrangler",
        outcome: {
          text: "It picks its way into the krummholz like a man with debts. You watch until watching is a waste of firewood.",
          hours: 0,
        },
      },
    ],
  },
  {
    id: "camp-coyote-cache",
    locations: CAMP_LOCS,
    triggers: ["arrive", "sleep", "camp"],
    timeBands: ["dawn", "night"],
    weight: 3,
    repeatable: true,
    text: "Dawn. The cache has been investigated by a scholar with teeth. Dirt thrown. A ration gone or nearly. Yellow eyes already elsewhere.",
    choices: [
      {
        id: "reset",
        label: "Stack the rocks heavier and spit",
        outcome: {
          text: "You make the pit uglier and more honest. The coyote will try again. So will you. This is the whole arrangement.",
          hours: 1,
          meters: { energy: -4 },
        },
      },
      {
        id: "chase",
        label: "Follow the thief a little way",
        check: { trait: "eye", dc: 12 },
        success: {
          text: "You find the scrap and not the thief. Enough to know it was coyote, not man. You walk back poorer and correctly informed.",
          hours: 1,
          inventory: { rations: -1 },
        },
        fail: {
          text: "You follow nothing into more nothing. An hour spent on pride. The pit is still a pit.",
          hours: 1,
          meters: { energy: -6 },
        },
      },
    ],
  },
  {
    id: "camp-remember-eliza",
    locations: CAMP_LOCS,
    triggers: ["smoke", "arrive", "fire"],
    characterId: "eliza-ward",
    weight: 2,
    text: "Eliza Ward is in your camp as if she owned the stove you do not have. She looks at the lean-to the way she looks at weather. “You cook like a man who has been in my kitchen,” she says. “Don’t make it a habit of starving after.”",
    choices: [
      {
        id: "sit",
        label: "Pour her a cup and sit down",
        outcome: {
          text: "She stays an hour. She does not soften. She tells you the cabin door is still hers and the pass is still a coffin. You are less alone in a way that will cost you later.",
          hours: 1,
          standing: { id: "eliza-ward", delta: 1 },
          remember: { id: "eliza-ward", tag: "sat-at-fire" },
          presentCharacter: "eliza-ward",
        },
      },
      {
        id: "proud",
        label: "Tell her this bench is yours",
        outcome: {
          text: "She almost smiles. “Then keep it. I bury fools who freeze in other people’s yards. I don’t hike to yours.” She goes. The fire is smaller.",
          hours: 1,
          standing: { id: "eliza-ward", delta: -1 },
          presentCharacter: null,
        },
      },
    ],
  },
  {
    id: "camp-remember-crows",
    locations: CAMP_LOCS,
    triggers: ["smoke", "arrive"],
    timeBands: ["dawn", "morning"],
    characterId: "two-crows",
    weight: 2,
    text: "Two Crows stands at the edge of your smoke and does not come in until you see him. That is manners. He looks at the rack, the pit, the way your fire leans. “You feed the whole valley,” he says. “Then you are surprised who comes.”",
    choices: [
      {
        id: "meat",
        label: "Offer meat and say little",
        outcome: {
          text: "He takes a strip, nods, and tells you the wallow is busy. Powder would still be better. He does not stay to be company. He stays to be accurate.",
          hours: 1,
          inventory: { rations: -1 },
          standing: { id: "two-crows", delta: 1 },
          remember: { id: "two-crows", tag: "shared-meat" },
          presentCharacter: "two-crows",
          unlockLocation: "elk-wallow",
        },
      },
      {
        id: "nod",
        label: "Nod and keep the pot",
        outcome: {
          text: "He is already leaving. You are weather. Weather passes. The smoke keeps writing your name on the sky.",
          hours: 0,
          presentCharacter: "two-crows",
        },
      },
    ],
  },
  {
    id: "camp-jean-dusk",
    locations: CAMP_LOCS,
    triggers: ["smoke", "fire", "eat"],
    timeBands: ["dusk", "night"],
    characterId: "jean-baptiste",
    weight: 3,
    text: "Jean-Baptiste Leclair comes in on the smoke singing something that was a hymn before it was a drinking song. He stops when he sees your face. “Ah. A house. Almost.”",
    choices: [
      {
        id: "sing",
        label: "Let him finish the verse at your fire",
        outcome: {
          text: "The song is older than your name. He eats if you have it. He leaves a twist of tobacco and a warning about the ice on the beaver pond. You sleep with a tune stuck, which is not nothing.",
          hours: 1,
          standing: { id: "jean-baptiste", delta: 1 },
          remember: { id: "jean-baptiste", tag: "sat-at-fire" },
          presentCharacter: "jean-baptiste",
          extraAdd: "willow-tobacco",
        },
      },
      {
        id: "quiet",
        label: "Ask him to keep the night quiet",
        outcome: {
          text: "He shrugs, offended in a small French way, and goes to sing at the timber instead. The coyotes prefer him. You prefer the dark.",
          hours: 1,
          standing: { id: "jean-baptiste", delta: -1 },
          presentCharacter: null,
        },
      },
    ],
  },
  {
    id: "camp-raven-jerky",
    locations: CAMP_LOCS,
    triggers: ["arrive", "camp"],
    weight: 3,
    text: "Ravens have been at the rack. Black coats, legal minds. What was meat is now an argument you lost by being elsewhere.",
    choices: [
      {
        id: "shout",
        label: "Shout them off the rest",
        outcome: {
          text: "They lift, curse in raven, and wait in the next tree. You take what is left, which is less, and do not make a speech about it.",
          hours: 0,
          inventory: { rations: 1 },
        },
      },
      {
        id: "leave",
        label: "Let them finish. You were late",
        outcome: {
          text: "You watch a court adjourn. The rack is honest and unemployed. Next time you will collect when the work is done, like a person.",
          hours: 0,
        },
      },
    ],
  },
  {
    id: "camp-hide-smoke",
    locations: CAMP_LOCS,
    triggers: ["smoke", "fire", "camp"],
    weight: 3,
    text: "The hide on the poles is taking smoke the way a lung takes air. Fat pops. The smell is a letter to every nose on the divide. You can already hear the country considering a visit.",
    choices: [
      {
        id: "keep",
        label: "Keep the fire low and live with the smell",
        outcome: {
          text: "You bank it. The hide darkens. Something in the timber takes an interest and then, for this hour, does not collect.",
          hours: 1,
          meters: { warmth: 6 },
        },
      },
      {
        id: "douse",
        label: "Douse it — you do not want company",
        outcome: {
          text: "Steam, a hiss, a hide that will be worse for the interruption. The smell still travels. You have only made the letter shorter.",
          hours: 0,
          clearFire: true,
        },
      },
    ],
  },
  {
    id: "camp-arrive-occupied",
    locations: CAMP_LOCS,
    triggers: ["arrive"],
    weight: 4,
    text: "You come back to your own ring and it is not empty. A man — or the weather wearing a man — has been sitting in your smoke. He shows empty hands. The pot is still yours, if you say so.",
    choices: [
      {
        id: "hail",
        label: "Hail him and share the ground",
        outcome: {
          text: "Ned, or a man with Ned’s luck. He has been lost since yesterday’s weather. He sits. He eats if you have it. He talks if you don’t. Your camp has become a road.",
          hours: 1,
          presentCharacter: "ned-calhoun",
          remember: { id: "ned-calhoun", tag: "sat-at-fire" },
          standing: { id: "ned-calhoun", delta: 1 },
        },
      },
      {
        id: "off",
        label: "Tell him this fire is not a tavern",
        outcome: {
          text: "He goes. You get the ring and the quieter night and the feeling of having spent a coin you cannot name.",
          hours: 0,
          presentCharacter: null,
        },
      },
    ],
  },
  {
    id: "camp-banked-morning",
    locations: CAMP_LOCS,
    triggers: ["fire", "camp"],
    timeBands: ["dawn", "morning"],
    weight: 2,
    text: "The coals you banked have kept a red eye under the ash. Morning is less of a thief. You can have fire without begging the blizzard for a spark.",
    choices: [
      {
        id: "blow",
        label: "Blow them up and feed a split",
        outcome: {
          text: "Flame. Small. Honest. The hour steps closer to being survivable. You remember why men worship this particular orange.",
          hours: 0,
          meters: { warmth: 12 },
          extraAdd: "banked-coals",
        },
      },
      {
        id: "save",
        label: "Leave them — you may need a coal later",
        outcome: {
          text: "You cover them again like a miser. The warmth stays a rumor. The option stays a fact.",
          hours: 0,
          extraAdd: "banked-coals",
        },
      },
    ],
  },
];
