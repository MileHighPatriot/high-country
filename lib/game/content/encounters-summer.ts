import type { EncounterDef } from "@/lib/game/types";

export const SUMMER_ENCOUNTERS: EncounterDef[] = [
  {
    id: "sum-camp-flies",
    season: "summer",
    locations: ["high-camp"],
    text: "Horseflies have found the lean-to. They treat your neck like a claim staked in salt.",
    choices: [
      {
        id: "smoke",
        label: "Build a smudge",
        check: { trait: "hands", dc: 10 },
        success: {
          text: "Green spruce smokes them off. Your eyes water. The bites stop counting themselves.",
          hours: 1,
          inventory: { firewood: -1 },
          meters: { energy: -4, health: 2 },
        },
        fail: {
          text: "The smudge dies. You slap until your palms sting and still lose blood to the choir.",
          hours: 1,
          meters: { energy: -8, health: -3 },
        },
      },
      {
        id: "move",
        label: "Eat in the wind instead",
        outcome: { text: "The flies cannot follow a good breeze. Your meal tastes of dust and victory.", hours: 1, meters: { thirst: -6 } },
      },
      {
        id: "endure",
        label: "Endure them",
        outcome: { text: "You scratch until night. Sleep comes in pieces.", hours: 1, meters: { energy: -6, health: -2 } },
      },
    ],
  },
  {
    id: "sum-camp-jerky",
    season: "summer",
    locations: ["high-camp"],
    text: "The rack is working. Strips of meat hang like laundry, and the sun is doing the smoking for free.",
    choices: [
      {
        id: "tend",
        label: "Turn the strips and keep the ravens off",
        outcome: {
          text: "By late day you have jerky that will travel. The ravens file a minority report.",
          hours: 3,
          inventory: { rations: 2 },
          meters: { energy: -8, thirst: -8 },
        },
      },
      {
        id: "rush",
        label: "Pull it early and walk",
        check: { trait: "eye", dc: 11 },
        success: { text: "Dry enough. You pack it warm and leave before the afternoon storm builds.", hours: 1, inventory: { rations: 1 } },
        fail: {
          text: "The centers are still wet. By tomorrow it will have opinions. You eat what you dare.",
          hours: 1,
          inventory: { rations: 1 },
          meters: { health: -6 },
        },
      },
    ],
  },
  {
    id: "sum-creek-trout",
    season: "summer",
    locations: ["creek"],
    text: "Trout hold in the shade of a cutbank. The water is low, clear, and honest about where they are.",
    choices: [
      {
        id: "fish",
        label: "Fish the cutbank",
        check: { trait: "hands", dc: 10 },
        success: {
          text: "Three fish, cold and stupid. Summer makes this look like skill.",
          hours: 2,
          inventory: { rations: 2 },
          meters: { energy: -6 },
        },
        fail: {
          text: "Your shadow arrives first. They go under the bank like a rumor withdrawn.",
          hours: 2,
          meters: { energy: -8 },
        },
      },
      {
        id: "guddle",
        label: "Tickle one out by hand",
        check: { trait: "hands", dc: 13 },
        success: { text: "You lift a fat one as if the creek owed you. It did not. You take it anyway.", hours: 1, inventory: { rations: 1 }, meters: { warmth: -4 } },
        fail: { text: "The trout is a theologian. You are wet to the shoulder and empty-handed.", hours: 1, meters: { warmth: -6, energy: -6 } },
      },
      {
        id: "drink",
        label: "Just fill the skins",
        outcome: { text: "Cold water. No argument. The fish keep their appointments.", hours: 1, inventory: { water: 2 }, meters: { thirst: 16 } },
      },
    ],
  },
  {
    id: "sum-creek-false-dry",
    season: "summer",
    locations: ["creek"],
    text: "A side fork is white gravel and silence. It looks dead. Under the stones, water still talks if you listen wrong.",
    choices: [
      {
        id: "dig",
        label: "Dig a seepage hole",
        check: { trait: "savvy", dc: 11 },
        success: {
          text: "The hole clouds, then clears. You drink what the mountain was hiding.",
          hours: 2,
          inventory: { water: 2 },
          meters: { thirst: 14, energy: -8 },
        },
        fail: {
          text: "You dig to clay and a smell like old eggs. The sip you take is a mistake you will remember.",
          hours: 2,
          meters: { health: -8, thirst: 4, energy: -10 },
        },
      },
      {
        id: "follow",
        label: "Follow the gravel down",
        outcome: {
          text: "The fork returns to daylight a half-mile on, a thin braid you can trust.",
          hours: 2,
          meters: { energy: -8, thirst: -6 },
          unlockLocation: "beaver-meadow",
        },
      },
      {
        id: "leave",
        label: "Trust the look of it and leave",
        outcome: { text: "You walk thirsty past water that did not bother to show its face.", hours: 1, meters: { thirst: -8 } },
      },
    ],
  },
  {
    id: "sum-timber-serviceberry",
    season: "summer",
    locations: ["timberline"],
    text: "Serviceberries hang in the krummholz, dark as bruises. Birds have started. So can you.",
    choices: [
      {
        id: "pick",
        label: "Pick until the pail is heavy",
        check: { trait: "eye", dc: 10 },
        success: {
          text: "You take a hatful and leave the rest for whatever winters here. Fingers purple. Mouth honest.",
          hours: 2,
          inventory: { rations: 2 },
          meters: { thirst: 6, energy: -6 },
        },
        fail: {
          text: "You eat more than you keep. The birds win the rest. A stomach cramp files late paperwork.",
          hours: 2,
          inventory: { rations: 1 },
          meters: { health: -4, energy: -8 },
        },
      },
      {
        id: "mark",
        label: "Blaze the patch and move on",
        outcome: { text: "You will find it again, or a bear will, and you can argue then.", hours: 1 },
      },
    ],
  },
  {
    id: "sum-ute-dogs",
    season: "summer",
    locations: ["ute-camp"],
    text: "The hunting camp is up: lodges, meat racks, children, a dog politics you are not invited to. Shade is a kind of wealth.",
    choices: [
      {
        id: "edge",
        label: "Wait at the edge with empty hands",
        outcome: {
          text: "Two Crows finds you before the dogs finish voting. He looks at your powder horn first.",
          hours: 1,
          presentCharacter: "two-crows",
        },
      },
      {
        id: "shade",
        label: "Ask to sit in the lodge shade",
        check: { trait: "savvy", dc: 12 },
        success: {
          text: "An older man points you to a strip of shadow. Gray Elk is already there, not wasting English.",
          hours: 2,
          meters: { thirst: 4, energy: 8 },
          presentCharacter: "gray-elk",
          standing: { id: "gray-elk", delta: 1 },
        },
        fail: {
          text: "You are waved off, not cruelly. The sun continues its work on your hat.",
          hours: 1,
          meters: { thirst: -8 },
          standing: { id: "two-crows", delta: -1 },
        },
      },
      {
        id: "trade",
        label: "Offer a pelt at the meat rack",
        outcome: {
          text: "Someone takes the pelt and cuts you strips still warm from the smoke. Two Crows nods as if you had paid a known price.",
          hours: 1,
          inventory: { pelts: -1, rations: 2 },
          presentCharacter: "two-crows",
          standing: { id: "two-crows", delta: 1 },
        },
      },
    ],
  },
  {
    id: "sum-ute-shell",
    season: "summer",
    locations: ["ute-camp"],
    text: "White Shell is scraping a hide in the last honest shade. Little Star sits nearby naming plants as if the ground were a ledger.",
    choices: [
      {
        id: "watch",
        label: "Sit and watch the work",
        outcome: {
          text: "White Shell does not look up. After a while she flicks you a scrap of sinew thread as if you had earned it.",
          hours: 2,
          extraAdd: "sinew-thread",
          presentCharacter: "white-shell",
          standing: { id: "white-shell", delta: 1 },
        },
      },
      {
        id: "star",
        label: "Let the girl test what you know",
        check: { trait: "savvy", dc: 11 },
        success: {
          text: "You name two berries correctly and fail a third. Little Star is delighted by the failure. That is teaching.",
          hours: 1,
          presentCharacter: "little-star",
          standing: { id: "little-star", delta: 1 },
        },
        fail: {
          text: "You point at a bush that would make you sick. She takes your wrist, not unkindly, and puts it down.",
          hours: 1,
          presentCharacter: "little-star",
        },
      },
      {
        id: "pass",
        label: "Do not interrupt women’s work",
        outcome: { text: "You take the long way around the lodges. Dignity is a trail too.", hours: 1 },
      },
    ],
  },
  {
    id: "sum-cabin-heat",
    season: "summer",
    locations: ["abandoned-cabin"],
    text: "The cabin stove is a joke in July. Eliza has the door and both shutters open and still looks like she might shoot the weather.",
    choices: [
      {
        id: "hail",
        label: "Hail from the yard",
        outcome: {
          text: "“If you track in flies I will charge you.” She lets you sit on the step, which is all the hospitality the heat allows.",
          hours: 1,
          presentCharacter: "eliza-ward",
          meters: { energy: 4 },
        },
      },
      {
        id: "wood",
        label: "Split winter wood for her now",
        outcome: {
          text: "Sweat for a debt that will matter in November. She marks it with a look, not a paper.",
          hours: 3,
          inventory: { firewood: 1 },
          meters: { energy: -14, thirst: -12 },
          standing: { id: "eliza-ward", delta: 1 },
          presentCharacter: "eliza-ward",
        },
      },
      {
        id: "hannah",
        label: "Speak to the woman stitching in the shade",
        outcome: {
          text: "Hannah Briggs does not look up from the shirt. “If you’re bleeding, sit. If you’re lonely, walk.”",
          hours: 1,
          presentCharacter: "hannah-briggs",
        },
      },
    ],
  },
  {
    id: "sum-pass-dust",
    season: "summer",
    locations: ["south-pass"],
    text: "The overlook is a skillet. Below, a dust string that wants to be a caravan crawls toward Taos like a thought you cannot finish.",
    choices: [
      {
        id: "watch",
        label: "Watch until your mouth dries",
        outcome: {
          text: "Mules, two carts, a man in a straw hat. They will make the trail camp by dusk if the wheels hold.",
          hours: 2,
          meters: { thirst: -12, energy: -6 },
          unlockLocation: "mexican-trail-camp",
        },
      },
      {
        id: "signal",
        label: "Wave a cloth",
        outcome: {
          text: "Someone waves back, which costs you nothing and commits you to nothing. The dust keeps going.",
          hours: 1,
          meters: { thirst: -6 },
        },
      },
      {
        id: "shade",
        label: "Get off the skyline",
        outcome: { text: "You drop into a notch of shadow. The pass can have its theater without your head in it.", hours: 1, meters: { energy: 4 } },
      },
    ],
  },
  {
    id: "sum-beaver-mosquito",
    season: "summer",
    locations: ["beaver-meadow"],
    text: "The meadow is a church of mosquitoes. The pond holds still. Beaver work shows in fresh mud, bright as a wound.",
    choices: [
      {
        id: "mud",
        label: "Mud your face and sit it out",
        outcome: {
          text: "You look like a bad statue. The bites find less of you. An hour passes that you will not write home about.",
          hours: 2,
          meters: { energy: -4, health: -2 },
        },
      },
      {
        id: "smoke",
        label: "Light a smudge at the dam",
        check: { trait: "hands", dc: 11 },
        success: {
          text: "Smoke lies on the water. You take two fat kits’ worth of quiet and a stick of dry willow.",
          hours: 2,
          inventory: { firewood: 1 },
          meters: { energy: -6 },
          standing: { id: "otter-that-waits", delta: 1 },
        },
        fail: {
          text: "The smudge catches grass. You beat it dead with your hat and a new respect for July.",
          hours: 2,
          meters: { energy: -12, health: -4 },
        },
      },
      {
        id: "leave",
        label: "Get out before you are eaten standing",
        outcome: { text: "The willows let you go. The humming follows a little way, like gossip.", hours: 1, meters: { health: -3 } },
      },
    ],
  },
  {
    id: "sum-burn-currant",
    season: "summer",
    locations: ["burned-timber"],
    text: "Fireweed and currant have taken the old burn. Black spars, red fruit, a sweetness that does not care what killed the trees.",
    choices: [
      {
        id: "pick",
        label: "Strip the currant bushes",
        check: { trait: "eye", dc: 10 },
        success: {
          text: "A double handful, tart enough to make your jaw honest. The burn feeds you like an apology.",
          hours: 2,
          inventory: { rations: 2 },
          meters: { thirst: 4, energy: -6 },
        },
        fail: {
          text: "Charcoal on your hands, not much in the bag. You spit grit and call it jam.",
          hours: 2,
          inventory: { rations: 1 },
          meters: { energy: -8 },
        },
      },
      {
        id: "char",
        label: "Gather charcoal for later fires",
        outcome: { text: "Light, dirty, useful. You blacken the blanket and do not care.", hours: 1, inventory: { firewood: 1 }, extraAdd: "charcoal-ends" },
      },
    ],
  },
  {
    id: "sum-chute-scree",
    season: "summer",
    locations: ["avalanche-chute"],
    text: "The chute is a dry river of stone. Heat ticks in the rocks. A slide started recently: pale scars, no snow required.",
    choices: [
      {
        id: "cross",
        label: "Cross the edge on the big stones",
        check: { trait: "hands", dc: 13 },
        success: {
          text: "You make the far side with dust in your teeth and a new map in your legs.",
          hours: 2,
          meters: { energy: -12, thirst: -8 },
          unlockLocation: "grizzly-basin",
        },
        fail: {
          text: "Scree takes your ankle for a moment and gives it back uglier. You crawl to shade that is mostly theory.",
          hours: 3,
          meters: { health: -10, energy: -14, thirst: -10 },
        },
      },
      {
        id: "around",
        label: "Go the long way through timber",
        outcome: { text: "Pride can wait. The trees do not slide, which is their whole argument.", hours: 3, meters: { energy: -10 } },
      },
    ],
  },
  {
    id: "sum-spring-horsefly",
    season: "summer",
    locations: ["hot-spring"],
    text: "The spring is a stew of mineral and insects. A man could cook in it. A fly already is.",
    choices: [
      {
        id: "soak",
        label: "A short soak anyway",
        outcome: {
          text: "Heat unknots what June knotted. You come out pink and briefly kind to yourself.",
          hours: 2,
          meters: { warmth: 16, energy: 8, health: 6, thirst: -8 },
        },
      },
      {
        id: "drink",
        label: "Taste the water",
        check: { trait: "savvy", dc: 12 },
        success: {
          text: "You sip, spit, and fill from the cold seep beside it instead. Wisdom tastes like nothing, which is the point.",
          hours: 1,
          inventory: { water: 1 },
          meters: { thirst: 10 },
        },
        fail: {
          text: "Mineral and rot. Your gut files a complaint in a language you will hear all night.",
          hours: 1,
          meters: { health: -8, thirst: 4 },
        },
      },
      {
        id: "leave",
        label: "The flies can have it",
        outcome: { text: "You walk on smelling of sulfur and bad decisions you did not make.", hours: 1 },
      },
    ],
  },
  {
    id: "sum-wallow-wallow",
    season: "summer",
    locations: ["elk-wallow"],
    text: "Bulls have been here. The mud is churned, hair-stuck, sweet with rot. A cow watches from willow with her ears at an opinion.",
    choices: [
      {
        id: "read",
        label: "Read the tracks and back out",
        check: { trait: "eye", dc: 11 },
        success: {
          text: "A herd moved toward the basin at dawn. You know where meat will be if you want an argument with it.",
          hours: 1,
          unlockLocation: "grizzly-basin",
        },
        fail: {
          text: "You step in last night’s soup. The cow coughs a warning. You leave louder than you meant.",
          hours: 1,
          meters: { energy: -6 },
        },
      },
      {
        id: "mud",
        label: "Coat yourself against the flies",
        outcome: { text: "You become the wallow. The flies lose interest. Dignity files for a later date.", hours: 1, meters: { health: 2, energy: -4 } },
      },
    ],
  },
  {
    id: "sum-saddle-thirst",
    season: "summer",
    locations: ["wind-saddle"],
    text: "Nothing higher than your knee, and the sun has the whole saddle for a drum. Your water tastes like the inside of the skin.",
    choices: [
      {
        id: "rest",
        label: "Sit in the lee of a boulder",
        outcome: { text: "Shade the size of a coffin lid. You take it. The wind does the rest of the work.", hours: 2, meters: { energy: 6, thirst: -8 } },
      },
      {
        id: "push",
        label: "Cross before the afternoon builds",
        check: { trait: "grit", dc: 12 },
        success: {
          text: "You make the far drop with a mouth full of dust and the pass still ahead.",
          hours: 2,
          meters: { energy: -10, thirst: -14 },
          unlockLocation: "south-pass",
        },
        fail: {
          text: "Your legs go polite and then refuse. You sit hard. The sky keeps its appointment without you.",
          hours: 3,
          meters: { energy: -16, thirst: -16, health: -6 },
        },
      },
      {
        id: "drink",
        label: "Finish a skin now",
        outcome: { text: "Short-term mercy. The far side will collect the debt.", hours: 1, inventory: { water: -1 }, meters: { thirst: 18 } },
      },
    ],
  },
  {
    id: "sum-fall-open",
    season: "summer",
    locations: ["frozen-fall"],
    text: "The ice is gone. The fall is only water, loud and simple, beating a pool the color of bottle glass.",
    choices: [
      {
        id: "plunge",
        label: "Go in",
        outcome: {
          text: "Cold punches the heat out of you. You come up gasping like a convert. Trout scatter, then return.",
          hours: 1,
          meters: { warmth: -10, energy: 8, health: 4, thirst: 8 },
        },
      },
      {
        id: "fill",
        label: "Fill every skin",
        outcome: { text: "The best water on the mountain, and it does not charge you in flies.", hours: 1, inventory: { water: 3 }, meters: { thirst: 20 } },
      },
      {
        id: "fish",
        label: "Cast into the tailout",
        check: { trait: "hands", dc: 11 },
        success: { text: "One good fish, silver as a coin nobody mints anymore.", hours: 2, inventory: { rations: 1 }, meters: { energy: -6 } },
        fail: { text: "Spray soaks the line. The fish stay in their sermon.", hours: 2, meters: { energy: -8, warmth: -4 } },
      },
    ],
  },
  {
    id: "sum-pine-rags",
    season: "summer",
    locations: ["lightning-pine"],
    text: "The split pine wears new rags: a strip of red wool, a tin cup on a nail, a blaze recut so deep the sap still weeps.",
    choices: [
      {
        id: "cup",
        label: "Drink from the cup",
        outcome: {
          text: "Warm water, faintly of iron. Someone meant this for the next fool, which is you, gratefully.",
          hours: 1,
          meters: { thirst: 10 },
        },
      },
      {
        id: "add",
        label: "Leave a ration and recut the blaze",
        outcome: {
          text: "You pay a small tax to the trail. Peggy’s mark is under the new cut, like a signature that refuses to fade.",
          hours: 1,
          inventory: { rations: -1 },
          standing: { id: "peggy-dunne", delta: 1 },
        },
      },
      {
        id: "take",
        label: "Take the wool",
        outcome: { text: "It is a signal, not a gift. You take it anyway and feel the difference.", hours: 1, extraAdd: "trail-wool", standing: { id: "peggy-dunne", delta: -1 } },
      },
    ],
  },
  {
    id: "sum-trail-chile",
    season: "summer",
    locations: ["mexican-trail-camp"],
    text: "The trail camp is a town for a week: mule bells, chile on the wind, a ristra hung on a cart bow like a warning and a promise.",
    choices: [
      {
        id: "ramon",
        label: "Find Ramón at the scales",
        outcome: {
          text: "He is already quoting you a price you have not asked for. Summer is his season and he knows it.",
          hours: 1,
          presentCharacter: "ramon-salazar",
        },
      },
      {
        id: "chile",
        label: "Trade a pelt for chile and flour",
        outcome: {
          text: "Heat in the mouth, weight in the sack. The mountain will taste different for two days.",
          hours: 1,
          inventory: { pelts: -1, rations: 2 },
          extraAdd: "chile-ristra",
          standing: { id: "ramon-salazar", delta: 1 },
        },
      },
      {
        id: "vega",
        label: "Sit with the wounded man in the cart-shade",
        outcome: {
          text: "Alejandro Vega has a clean bandage and a dirty mood. He looks at you as if you might be useful or a thief.",
          hours: 1,
          presentCharacter: "alejandro-vega",
        },
      },
      {
        id: "water",
        label: "Beg water from the barrel",
        outcome: { text: "A boy dips you a gourd and grins. You do not ask what else has been in it.", hours: 1, inventory: { water: 1 }, meters: { thirst: 12 } },
      },
    ],
  },
  {
    id: "sum-arapaho-nawat",
    season: "summer",
    locations: ["arapaho-ground"],
    text: "Lodges on the park edge, horses fat on grass. You are seen for a long time before anyone bothers to become a person in front of you.",
    choices: [
      {
        id: "wait",
        label: "Wait to be approached",
        outcome: {
          text: "Nawat comes out of the grass as if the park assembled him. He does not waste a greeting on weather you can see.",
          hours: 1,
          presentCharacter: "nawat",
        },
      },
      {
        id: "gift",
        label: "Lay down powder and step back",
        outcome: {
          text: "The powder is taken. A woman sets a parfleche of dried meat where you can reach it without coming closer.",
          hours: 1,
          inventory: { powder: -1, rations: 2 },
          standing: { id: "nawat", delta: 1 },
        },
      },
      {
        id: "cut",
        label: "Cut across the park anyway",
        check: { trait: "savvy", dc: 14 },
        success: {
          text: "You keep to the old trail and do not look like a thief. A boy watches you past as if you were a slow cloud.",
          hours: 2,
          meters: { energy: -8 },
        },
        fail: {
          text: "You are turned with a hand and a look. The park is not a road. You learn it in your feet.",
          hours: 1,
          standing: { id: "nawat", delta: -2 },
        },
      },
    ],
  },
  {
    id: "sum-cache-blowfly",
    season: "summer",
    locations: ["cache-deadfall"],
    text: "The deadfall stinks of a cache that lost the argument with July. Blowflies work the hole like a mill.",
    choices: [
      {
        id: "salvage",
        label: "Salvage what has not turned",
        check: { trait: "eye", dc: 13 },
        success: {
          text: "One tin of hard bread, still sealed. You leave the meat to its new owners.",
          hours: 1,
          inventory: { rations: 1 },
        },
        fail: {
          text: "You guess wrong. The smell follows you into the next day like a relative.",
          hours: 1,
          inventory: { rations: 1 },
          meters: { health: -10 },
        },
      },
      {
        id: "burn",
        label: "Burn the hole out",
        outcome: {
          text: "Smoke, a few less flies, a cache that will not poison the next man. Peggy would call that maintenance.",
          hours: 2,
          inventory: { firewood: -1 },
          meters: { energy: -8 },
          standing: { id: "peggy-dunne", delta: 1 },
        },
      },
      {
        id: "leave",
        label: "Give it a wide berth",
        outcome: { text: "Some holes are finished. You let this one stay finished.", hours: 1 },
      },
    ],
  },
  {
    id: "sum-cave-last-ice",
    season: "summer",
    locations: ["talus-ice-cave"],
    text: "Last winter still lives in the talus throat: a tongue of ice, dirty, dripping, cold as a root cellar that forgot the house.",
    choices: [
      {
        id: "cache",
        label: "Pack meat against the ice",
        outcome: {
          text: "The cave takes a day’s ration and promises to keep it. Caves lie sometimes. This one feels sober.",
          hours: 2,
          meters: { warmth: -12, energy: -6 },
          extraAdd: "ice-cached-meat",
        },
      },
      {
        id: "melt",
        label: "Melt a skin of water",
        outcome: { text: "Slow work. Clean water. Your hands go stupid with cold and then forgive you.", hours: 2, inventory: { water: 2 }, meters: { warmth: -10, thirst: 12 } },
      },
      {
        id: "out",
        label: "The heat outside is honest, at least",
        outcome: { text: "Daylight slaps you. You take it as a kind of luck.", hours: 1, meters: { warmth: 8 } },
      },
    ],
  },
  {
    id: "sum-ruin-squash",
    season: "summer",
    locations: ["homesteader-ruin"],
    text: "Someone has a squash vine climbing the chimney stones. Martha is watering it from a bucket as if the ruin were still a farm.",
    choices: [
      {
        id: "help",
        label: "Carry the next bucket",
        outcome: {
          text: "She lets you. The well is mean in July. She pays in two small squash and a look that is almost thanks.",
          hours: 2,
          inventory: { rations: 1, water: -1 },
          meters: { energy: -10 },
          presentCharacter: "martha-keene",
          standing: { id: "martha-keene", delta: 1 },
        },
      },
      {
        id: "talk",
        label: "Ask how the well holds",
        outcome: {
          text: "“It holds if you don’t gossip it dry.” She talks anyway. You learn which fork still runs.",
          hours: 1,
          presentCharacter: "martha-keene",
          unlockLocation: "creek",
        },
      },
      {
        id: "steal",
        label: "Take a squash when she turns",
        outcome: {
          text: "It is the size of a fist and costs you more than food. You eat it later like a thief, which you are.",
          hours: 1,
          inventory: { rations: 1 },
          standing: { id: "martha-keene", delta: -2 },
        },
      },
    ],
  },
  {
    id: "sum-basin-huckle",
    season: "summer",
    locations: ["grizzly-basin"],
    text: "Huckleberry on the north slope, a dark stain under the willow. Bear sign is fresh enough to read with your throat.",
    choices: [
      {
        id: "pick",
        label: "Pick fast and keep your head up",
        check: { trait: "eye", dc: 12 },
        success: {
          text: "A pail of fruit and no visitors. You leave before the basin remembers it has owners.",
          hours: 2,
          inventory: { rations: 3 },
          meters: { energy: -8, thirst: 4 },
        },
        fail: {
          text: "A snort from the willow. You leave the pail and most of your dignity.",
          hours: 1,
          meters: { energy: -10 },
          inventory: { rations: 1 },
        },
      },
      {
        id: "hail",
        label: "Call out — someone is already here",
        outcome: {
          text: "Frost on Antler stands up from the berry slope with a basket and a look that asks whether you can share a mountain.",
          hours: 1,
          presentCharacter: "frost-on-antler",
        },
      },
      {
        id: "leave",
        label: "Leave the slope to the bears",
        outcome: { text: "Hunger can wait. A basin like this collects debts with interest.", hours: 1 },
      },
    ],
  },
  {
    id: "sum-rim-heat",
    season: "summer",
    locations: ["south-park-rim"],
    text: "The park is a pale ocean. Heat makes water where there is none. Antelope are a rumor with legs, too far for anything but wanting.",
    choices: [
      {
        id: "glass",
        label: "Study the park until your eyes water",
        check: { trait: "eye", dc: 12 },
        success: {
          text: "A spring shows as a darker stitch of willow. You mark it. Meat will come there at dusk, or you will.",
          hours: 2,
          meters: { thirst: -10, energy: -6 },
          unlockLocation: "arapaho-ground",
        },
        fail: {
          text: "Mirage and wish. You squint until the headache arrives and the park keeps its secrets.",
          hours: 2,
          meters: { thirst: -12, energy: -8, health: -3 },
        },
      },
      {
        id: "stalk",
        label: "Stalk anyway",
        check: { trait: "grit", dc: 14 },
        success: {
          text: "One antelope drops at a range you will brag about only to yourself. The pack gets heavy in a way you like.",
          hours: 4,
          inventory: { rations: 3, pelts: 1, powder: -1 },
          meters: { energy: -16, thirst: -12 },
        },
        fail: {
          text: "The park empties. Powder spent on air. You walk back lighter and louder in your own head.",
          hours: 4,
          inventory: { powder: -1 },
          meters: { energy: -16, thirst: -14 },
        },
      },
      {
        id: "shade",
        label: "Wait out the worst heat",
        outcome: { text: "You become a rock until the light tilts. Traveling at four is a kind of wisdom.", hours: 3, meters: { energy: 6, thirst: -8 } },
      },
    ],
  },
  {
    id: "sum-storm-split-pine",
    season: "summer",
    weather: ["storm"],
    locations: ["lightning-pine"],
    text: "The thunderhead arrives like a verdict. The split pine is the tallest thing on this bench, which is a kind of suicide with bark.",
    choices: [
      {
        id: "low",
        label: "Get off the rise and lie low",
        outcome: {
          text: "Rain like gravel. The pine takes a hit that lights the split like a window. You count, and keep counting.",
          hours: 3,
          meters: { warmth: -10, energy: -8, thirst: 6 },
        },
      },
      {
        id: "rifle",
        label: "Hold the rifle and wait it out by the tree",
        outcome: {
          text: "Metal and height. The mountain answers both.",
          hours: 1,
          meters: { health: -40 },
          death: { cause: "accident", detail: "Lightning found the rifle and the man holding it under the split pine." },
        },
      },
      {
        id: "push",
        label: "Run for timber",
        check: { trait: "grit", dc: 13 },
        success: {
          text: "You make the trees with hail in your collar and a smell of cooked air behind you.",
          hours: 1,
          meters: { energy: -10, warmth: -8 },
        },
        fail: {
          text: "A near strike puts you down in the duff. You taste copper until the rain finishes its work.",
          hours: 3,
          meters: { health: -14, energy: -16, warmth: -10 },
        },
      },
    ],
  },
  {
    id: "sum-storm-saddle",
    season: "summer",
    weather: ["storm"],
    locations: ["wind-saddle", "south-pass"],
    text: "There is no timber here to argue with the sky. Hail begins like thrown shot. The saddle is a drum and you are on it.",
    choices: [
      {
        id: "boulder",
        label: "Wedge under the lee boulder",
        outcome: {
          text: "Ice ticks off stone an inch from your eye. You wait in a crouch that will hurt tomorrow.",
          hours: 3,
          meters: { warmth: -12, energy: -10, health: -3 },
        },
      },
      {
        id: "walk",
        label: "Keep walking into it",
        check: { trait: "grit", dc: 14 },
        success: {
          text: "You come off the saddle ringing, soaked, and still your own man. The storm stays to argue with the pass.",
          hours: 2,
          meters: { energy: -12, warmth: -14, thirst: 4 },
        },
        fail: {
          text: "Hail finds your temple. You sit down without a motion to sit. Rain finishes the thought.",
          hours: 3,
          meters: { health: -12, energy: -16, warmth: -16 },
        },
      },
    ],
  },
  {
    id: "sum-storm-willow",
    season: "summer",
    weather: ["storm"],
    locations: ["creek", "beaver-meadow", "elk-wallow"],
    text: "The creek stands up. What was a ford becomes a brown argument. Willows thrash as if trying to leave.",
    choices: [
      {
        id: "high",
        label: "Get to higher ground",
        outcome: {
          text: "You watch a log pass like a battering ram. The water takes a bank you were standing on an hour ago.",
          hours: 2,
          meters: { energy: -8, warmth: -8 },
        },
      },
      {
        id: "cross",
        label: "Cross while you still can",
        check: { trait: "grit", dc: 14 },
        success: {
          text: "Current to the belt. You crawl out the far side with a skin still stoppered and a new respect for July rain.",
          hours: 1,
          meters: { warmth: -16, energy: -12, health: -4 },
        },
        fail: {
          text: "It takes you off your feet. You fetch up in willow with a mouth full of silt and one boot arguing with the other.",
          hours: 2,
          meters: { health: -12, warmth: -20, energy: -14, thirst: -6 },
          inventory: { water: -1 },
        },
      },
      {
        id: "wait",
        label: "Wait for the flood to think twice",
        outcome: { text: "It thinks for hours. You shiver in a thicket and drink rain off your hat.", hours: 4, meters: { warmth: -12, energy: -8, thirst: 8 } },
      },
    ],
  },
  {
    id: "sum-wolves-kill",
    season: "summer",
    locations: ["elk-wallow", "grizzly-basin", "burned-timber"],
    text: "An elk calf is open on the grass. Two wolves are still at it, stained to the eye, not finished, not in a mood to share a theology of leftovers.",
    choices: [
      {
        id: "back",
        label: "Back away and leave them the meat",
        outcome: { text: "They watch you until you are a smaller problem. The calf was never yours.", hours: 1 },
      },
      {
        id: "shot",
        label: "A shot to run them off",
        outcome: {
          text: "They go, cursing in their own language. You cut in a hurry. Powder is the tithe.",
          hours: 2,
          inventory: { powder: -1, rations: 2 },
          meters: { energy: -8 },
        },
      },
      {
        id: "close",
        label: "Move in on the kill",
        check: { trait: "grit", dc: 13 },
        success: {
          text: "You shout like a man who has done this. They yield a haunch and a look you will remember in the dark.",
          hours: 2,
          inventory: { rations: 2 },
          meters: { energy: -10 },
        },
        fail: {
          text: "They do not yield.",
          hours: 1,
          startSkirmish: {
            intro: "The wolves decide you are a third mouth, and they have already counted to two.",
            foes: [
              { id: "wolf-1", name: "Wolf", hp: 12, maxHp: 12, range: "near", damage: [3, 7] },
              { id: "wolf-2", name: "Wolf", hp: 11, maxHp: 11, range: "close", damage: [4, 8] },
            ],
          },
        },
      },
    ],
  },
  {
    id: "sum-drunk-knife",
    season: "summer",
    locations: ["mexican-trail-camp", "high-camp"],
    text: "A man with Taos lightning on his breath has a knife out for a mule that stepped on his foot. The mule is innocent. The man is not done deciding who else is guilty.",
    choices: [
      {
        id: "talk",
        label: "Talk the knife down",
        check: { trait: "savvy", dc: 13 },
        success: {
          text: "You give him a path that is not a killing. He sits. The mule goes on being a mule, which is the whole wisdom of mules.",
          hours: 1,
          standing: { id: "ygnacio-luna", delta: 1 },
        },
        fail: {
          text: "He decides you are in the way.",
          hours: 1,
          startSkirmish: {
            intro: "The drunk turns the knife from the mule toward a man who can bleed.",
            foes: [{ id: "drunk-knife", name: "Drunk with a knife", hp: 13, maxHp: 13, range: "close", damage: [3, 7] }],
          },
        },
      },
      {
        id: "walk",
        label: "Walk wide and let the camp handle it",
        outcome: { text: "A muleteer shouts in Spanish. You keep your skin. Someone else spends the hour.", hours: 1 },
      },
      {
        id: "flask",
        label: "Offer your own flask",
        outcome: {
          text: "He drinks, weeps about a woman in Taos, and sleeps with the knife still in his hand. You take the knife. That is the whole mercy.",
          hours: 1,
          extraAdd: "cheap-knife",
          meters: { energy: -4 },
        },
      },
    ],
  },
  {
    id: "sum-oneshot-sheepherder",
    season: "summer",
    locations: ["burned-timber", "south-park-rim", "wind-saddle"],
    text: "A Nuevomexicano sheepherder sits in the ash of a grass fire with his face cooked and his flock a smell on the wind. He asks for water in a voice that has already spent itself.",
    choices: [
      {
        id: "water",
        label: "Give him a skin and salve what you can",
        outcome: {
          text: "He drinks like a man returning from the dead, which he has not, quite. He presses a twist of wool into your hand and will not take it back.",
          hours: 2,
          inventory: { water: -1 },
          extraAdd: "burnt-wool",
          meters: { energy: -6 },
          standing: { id: "ygnacio-luna", delta: 1 },
        },
      },
      {
        id: "point",
        label: "Point him toward the trail camp",
        outcome: {
          text: "He nods and walks as if the ground were still burning. You do not watch him out of sight. That would be a kind of lying.",
          hours: 1,
        },
      },
      {
        id: "nothing",
        label: "You have nothing to spare",
        outcome: { text: "He believes you. The ash does not. You leave poorer in a way that will not show in the pack.", hours: 1, meters: { energy: -2 } },
      },
    ],
  },
  {
    id: "sum-oneshot-widow",
    season: "summer",
    locations: ["mexican-trail-camp", "south-pass", "homesteader-ruin"],
    text: "A woman in a black rebozo is asking in Spanish and then in careful English whether anyone has seen a man named Lucero, dead or otherwise. She holds a child’s shoe that is not a child’s any longer.",
    choices: [
      {
        id: "truth",
        label: "Tell her what the pass keeps",
        check: { trait: "savvy", dc: 12 },
        success: {
          text: "You describe a grave cairn on the saddle. She thanks you without tears, which is worse, and gives you a strip of dried apricot from Taos.",
          hours: 1,
          inventory: { rations: 1 },
          extraAdd: "widow-apricot",
          unlockLocation: "wind-saddle",
        },
        fail: {
          text: "Your comfort is clumsy. She closes her face and goes on asking the next stranger, which is you tomorrow.",
          hours: 1,
        },
      },
      {
        id: "ride",
        label: "Walk her as far as the rim",
        outcome: {
          text: "You spend the cool hours on someone else’s grief. She leaves you a blessing that sounds like a warning.",
          hours: 3,
          meters: { energy: -10, thirst: -8 },
          standing: { id: "padre-tomas", delta: 1 },
        },
      },
      {
        id: "busy",
        label: "You cannot help her",
        outcome: { text: "She already knew. The rebozo goes on down the trace.", hours: 1 },
      },
    ],
  },
  {
    id: "sum-oneshot-goat",
    season: "summer",
    locations: ["homesteader-ruin", "creek", "abandoned-cabin"],
    text: "Two boys and a nanny goat with a brand that is not theirs. The goat has opinions. The older boy has a knife too big for his hand and a story too small for the brand.",
    choices: [
      {
        id: "buy",
        label: "Buy the goat and ask no questions",
        outcome: {
          text: "They take a ration and run like men who have been paid to disappear. The goat stares at you with old yellow eyes. Milk, if you can argue with her.",
          hours: 1,
          inventory: { rations: -1 },
          extraAdd: "stolen-goat",
          meters: { thirst: 8 },
        },
      },
      {
        id: "martha",
        label: "March them toward Martha’s ruin",
        outcome: {
          text: "She knows the brand. The boys learn a word for thief that will last. You get no goat and a nod that counts.",
          hours: 2,
          meters: { energy: -8 },
          standing: { id: "martha-keene", delta: 1 },
          presentCharacter: "martha-keene",
        },
      },
      {
        id: "ignore",
        label: "It is not your court",
        outcome: { text: "The goat bleats you out of earshot. Summer makes thieves of hungry children. You keep your hours.", hours: 1 },
      },
    ],
  },
  {
    id: "sum-oneshot-fever",
    season: "summer",
    locations: ["abandoned-cabin", "cache-deadfall", "lightning-pine"],
    text: "A man is sitting against a log with his coat on in July. His eyes are too bright. He asks if you have seen Bent’s, as if Bent’s were a person who could still come.",
    choices: [
      {
        id: "tend",
        label: "Shade him, water him, stay the hour",
        outcome: {
          text: "He talks sense and then does not. You wet his mouth. By dusk he is quieter. You may have bought him a night. Your own head feels wrong.",
          hours: 3,
          inventory: { water: -1 },
          meters: { health: -8, energy: -10 },
          standing: { id: "padre-tomas", delta: 1 },
        },
      },
      {
        id: "flask",
        label: "Drink from the flask he offers",
        outcome: {
          text: "It is not whiskey. It is whatever is killing him. You understand this a mile too late.",
          hours: 2,
          meters: { health: -50 },
          death: { cause: "sickness", detail: "You drank from a fevered stranger’s flask in the July heat." },
        },
      },
      {
        id: "wide",
        label: "Leave a skin and do not touch him",
        outcome: {
          text: "Mercy at a distance. You will not know if it was enough. That is the bargain.",
          hours: 1,
          inventory: { water: -1 },
        },
      },
    ],
  },
  {
    id: "sum-oneshot-silent",
    season: "summer",
    locations: ["timberline", "lightning-pine", "high-camp"],
    text: "A woman sits in the krummholz with a bundled infant and does not speak when you hail her. The baby makes the small wet sounds of a creature that is still deciding to live.",
    choices: [
      {
        id: "food",
        label: "Set down food and water and back away",
        outcome: {
          text: "She takes both without looking at your face. That is thanks enough. The baby keeps its counsel.",
          hours: 1,
          inventory: { rations: -1, water: -1 },
          standing: { id: "hannah-briggs", delta: 1 },
        },
      },
      {
        id: "hannah",
        label: "Offer to walk them to Hannah",
        outcome: {
          text: "She stands as if pulled by a rope. You do not get a name. Hannah will get the rest, or no one will.",
          hours: 3,
          meters: { energy: -12, thirst: -8 },
          presentCharacter: "hannah-briggs",
          standing: { id: "hannah-briggs", delta: 1 },
        },
      },
      {
        id: "pass",
        label: "Pass by",
        outcome: { text: "Some silences are a locked door. You do not put your shoulder to it.", hours: 1 },
      },
    ],
  },
  {
    id: "sum-oneshot-keg",
    season: "summer",
    locations: ["mexican-trail-camp", "south-park-rim"],
    text: "A man is selling cups from a keg in the wagon-shade. He swears it is Taos lightning. It smells like rainwater that went to church and lost its faith.",
    choices: [
      {
        id: "sip",
        label: "Buy a cup",
        check: { trait: "grit", dc: 11 },
        success: {
          text: "It is bad and it is wet. You do not fall down. He looks disappointed.",
          hours: 1,
          inventory: { rations: -1 },
          meters: { thirst: 6, health: -3, warmth: 4 },
        },
        fail: {
          text: "Your knees resign. He laughs and does not refund the cup.",
          hours: 2,
          inventory: { rations: -1 },
          meters: { health: -8, energy: -12 },
        },
      },
      {
        id: "warn",
        label: "Tell the camp it is watered",
        outcome: {
          text: "Ramón hears you. The keg man finds his cart in a hurry. You have made a friend and an enemy in one sentence.",
          hours: 1,
          standing: { id: "ramon-salazar", delta: 1 },
        },
      },
      {
        id: "no",
        label: "Keep your money and your head",
        outcome: { text: "July is drunk enough without help.", hours: 1 },
      },
    ],
  },
  {
    id: "sum-oneshot-blind",
    season: "summer",
    locations: ["timberline", "beaver-meadow", "creek"],
    text: "An old trapper is feeling his way along a game trail with a stick. His eyes are milk. He asks if the beaver still work this water, as if you were a newspaper.",
    choices: [
      {
        id: "guide",
        label: "Put him on the meadow path",
        outcome: {
          text: "He pays you with a story about ’28 that may even be true, and a plew so dry it cracks. He knows Otter That Waits by a name you have not heard.",
          hours: 2,
          inventory: { pelts: 1 },
          meters: { energy: -8 },
          standing: { id: "otter-that-waits", delta: 1 },
          unlockLocation: "beaver-meadow",
        },
      },
      {
        id: "lie",
        label: "Tell him the dams are empty",
        outcome: {
          text: "He nods, believing the world has finished without him. You walk lighter and worse.",
          hours: 1,
          standing: { id: "otter-that-waits", delta: -1 },
        },
      },
      {
        id: "pass",
        label: "Let him find it himself",
        outcome: { text: "He has found worse with less. You tell yourself that twice.", hours: 1 },
      },
    ],
  },
  {
    id: "sum-oneshot-bell",
    season: "summer",
    locations: ["south-pass", "mexican-trail-camp", "wind-saddle"],
    text: "A carpenter from Taos is hauling a cracked church bell on a travois. He wants to know if there is a chapel yet. There is not. He seems prepared to wait until there is.",
    choices: [
      {
        id: "help",
        label: "Help him over the worst pitch",
        outcome: {
          text: "The bell talks when it bumps stone. Your shoulders pay the tithe. He gives you a biscuit that has seen the Camino.",
          hours: 3,
          inventory: { rations: 1 },
          meters: { energy: -14, thirst: -10 },
          standing: { id: "padre-tomas", delta: 1 },
        },
      },
      {
        id: "padre",
        label: "Send him to Padre Tomás",
        outcome: {
          text: "“Sí,” he says, as if you had opened a door. The travois goes on singing.",
          hours: 1,
          standing: { id: "padre-tomas", delta: 1 },
        },
      },
      {
        id: "no",
        label: "You are not in the chapel business",
        outcome: { text: "The bell goes on without you. Some cargos are other men’s theology.", hours: 1 },
      },
    ],
  },
  {
    id: "sum-oneshot-yarrow",
    season: "summer",
    locations: ["creek", "hot-spring", "elk-wallow"],
    text: "A woman is cutting yarrow and willow bark into a cloth with the concentration of a clerk. She does not startle. She has already decided you are not a bear.",
    choices: [
      {
        id: "ask",
        label: "Ask what she is making",
        check: { trait: "savvy", dc: 12 },
        success: {
          text: "Fever tea, she says, for a camp that will not last the week if the creek water is what she thinks it is. She gives you a twist of the same.",
          hours: 1,
          extraAdd: "yarrow-twist",
          meters: { health: 4 },
        },
        fail: {
          text: "She names nothing. Her knife keeps working. You are weather again.",
          hours: 1,
        },
      },
      {
        id: "help",
        label: "Cut where she points",
        outcome: {
          text: "An hour of other people’s medicine. She pays in a handful of dried berries and a warning about the fork that looks dry.",
          hours: 2,
          inventory: { rations: 1 },
          meters: { energy: -8 },
          unlockLocation: "creek",
        },
      },
      {
        id: "leave",
        label: "Leave her to her pharmacy",
        outcome: { text: "The smell of crushed yarrow follows you like a small church.", hours: 1 },
      },
    ],
  },
  {
    id: "sum-oneshot-sisters",
    season: "summer",
    locations: ["south-park-rim", "homesteader-ruin", "mexican-trail-camp"],
    text: "Two sisters stand over a dead horse in the heat. They are arguing in English about which way Taos is, which means neither of them knows, and the horse is past caring.",
    choices: [
      {
        id: "point",
        label: "Point them toward the trail camp",
        outcome: {
          text: "The older one believes you. The younger one believes the older one. They cut what meat they can and go, poorer and aimed.",
          hours: 1,
          standing: { id: "ramon-salazar", delta: 1 },
        },
      },
      {
        id: "meat",
        label: "Help them strip the horse",
        outcome: {
          text: "Ugly work in a skillet of sun. They give you a share you will eat only if July gets meaner.",
          hours: 3,
          inventory: { rations: 2 },
          meters: { energy: -14, thirst: -14, health: -3 },
        },
      },
      {
        id: "no",
        label: "You cannot steer the lost",
        outcome: { text: "They will find the rim or the rim will find them. You keep your water.", hours: 1 },
      },
    ],
  },
  {
    id: "sum-silas-siesta",
    season: "summer",
    locations: ["high-camp", "timberline", "lightning-pine"],
    text: "Silas Crowe is asleep sitting up in a scrap of shade with a hat over his face and a jug that has not been water in years. A yellowjacket is considering his nose.",
    choices: [
      {
        id: "wake",
        label: "Wake him before the wasp does",
        outcome: {
          text: "He swats you, then the air, then laughs until he coughs. “Summer,” he says, as if it were a man he owed.",
          hours: 1,
          presentCharacter: "silas-crowe",
          standing: { id: "silas-crowe", delta: 1 },
        },
      },
      {
        id: "jug",
        label: "Move the jug into shade",
        outcome: {
          text: "He wakes anyway and accuses you of temperance. Then he shares jerky that has seen the inside of a saddlebag since May.",
          hours: 1,
          inventory: { rations: 1 },
          presentCharacter: "silas-crowe",
        },
      },
      {
        id: "leave",
        label: "Let sleeping drunks lie",
        outcome: { text: "The yellowjacket will write the rest of the story. You do not need to read it.", hours: 1 },
      },
    ],
  },
  {
    id: "sum-padre-shade",
    season: "summer",
    locations: ["mexican-trail-camp", "hot-spring"],
    text: "Padre Tomás has hung a blanket for a porch and is hearing something that might be a confession or a complaint about mules. The line is short. The heat is not.",
    choices: [
      {
        id: "hail",
        label: "Wait your turn",
        outcome: {
          text: "He blesses you as if you had asked. Maybe you had. He looks glad to see a living sinner who can still stand.",
          hours: 1,
          presentCharacter: "padre-tomas",
          meters: { energy: 4 },
        },
      },
      {
        id: "water",
        label: "Fill his barrel from the seep",
        outcome: {
          text: "You work. He talks about a chapel that does not exist yet. The barrel gets heavier in a way that feels like standing.",
          hours: 2,
          inventory: { water: -1 },
          meters: { energy: -8, thirst: -6 },
          standing: { id: "padre-tomas", delta: 1 },
          presentCharacter: "padre-tomas",
        },
      },
      {
        id: "pass",
        label: "Do not get into heaven’s line",
        outcome: { text: "The blanket porch goes on without your sins. They will keep.", hours: 1 },
      },
    ],
  },
  {
    id: "sum-hennepin-ledger",
    season: "summer",
    locations: ["south-pass", "mexican-trail-camp", "abandoned-cabin"],
    text: "Hennepin has a ledger open on a crate and is counting other men’s summer as if it were already Company property. Ink in this heat is a kind of faith.",
    choices: [
      {
        id: "read",
        label: "Ask what the page wants",
        outcome: {
          text: "Licenses, bounties, a smile like a closed trap. He offers you work that would make you a clerk of pelts.",
          hours: 1,
          presentCharacter: "hennepin",
        },
      },
      {
        id: "lie",
        label: "Claim your plews are already spoken for",
        check: { trait: "savvy", dc: 13 },
        success: {
          text: "He makes a note that is not about you, which is the victory. You leave unlisted.",
          hours: 1,
          presentCharacter: "hennepin",
          standing: { id: "hennepin", delta: -1 },
        },
        fail: {
          text: "He writes your name anyway. Paper is a snare that works in any season.",
          hours: 1,
          presentCharacter: "hennepin",
          standing: { id: "hennepin", delta: -2 },
        },
      },
      {
        id: "walk",
        label: "Walk past the crate",
        outcome: { text: "Ledgers cannot chase. Men can. You keep that distinction for later.", hours: 1 },
      },
    ],
  },
  {
    id: "sum-ned-sunburn",
    season: "summer",
    locations: ["timberline", "creek", "high-camp"],
    text: "Ned Calhoun has taken his shirt off to be a man about the heat. He is the color of a boiled crawfish and trying not to admit it.",
    choices: [
      {
        id: "shade",
        label: "Put him in shade and make him drink",
        outcome: {
          text: "He argues, then obeys. You wet his hat. He thanks you too many times, which is how you know it worked.",
          hours: 1,
          inventory: { water: -1 },
          presentCharacter: "ned-calhoun",
          standing: { id: "ned-calhoun", delta: 1 },
        },
      },
      {
        id: "laugh",
        label: "Tell him the sun is not a stove you can outstare",
        outcome: {
          text: "He puts the shirt on like a surrender. He will remember the sentence longer than the burn.",
          hours: 1,
          presentCharacter: "ned-calhoun",
        },
      },
      {
        id: "leave",
        label: "He will learn or he will blister",
        outcome: { text: "Both, probably. You keep your water for a man who will ask less.", hours: 1 },
      },
    ],
  },
  {
    id: "sum-jb-trout",
    season: "summer",
    locations: ["beaver-meadow", "creek"],
    text: "Jean-Baptiste has a line in the pond and a song that is losing to the mosquitoes. He insists this is a river if you squint in French.",
    choices: [
      {
        id: "fish",
        label: "Fish beside him",
        check: { trait: "hands", dc: 10 },
        success: {
          text: "You both catch enough to argue about. He gives you the bigger one, which is a kind of treaty.",
          hours: 3,
          inventory: { rations: 2 },
          meters: { energy: -8 },
          presentCharacter: "jean-baptiste",
          standing: { id: "jean-baptiste", delta: 1 },
        },
        fail: {
          text: "He catches. You slap bugs. He is kind about it in two languages.",
          hours: 3,
          inventory: { rations: 1 },
          meters: { energy: -10 },
          presentCharacter: "jean-baptiste",
        },
      },
      {
        id: "canoe",
        label: "Ask how the bark canoe is",
        outcome: {
          text: "“It is a philosophy.” He shows you a rib that will never see current. You hold it anyway.",
          hours: 2,
          presentCharacter: "jean-baptiste",
          extraAdd: "canoe-rib",
        },
      },
      {
        id: "leave",
        label: "Leave him to his river",
        outcome: { text: "The song follows you through the willows and then gives up, which is also French.", hours: 1 },
      },
    ],
  },
  {
    id: "sum-dutch-lame",
    season: "summer",
    locations: ["homesteader-ruin", "cache-deadfall", "south-pass"],
    text: "Dutch Harrow’s horse is three-legged in the heat, head down, a shoe hanging like a bad sentence. Dutch is smoking as if smoke were a farrier.",
    choices: [
      {
        id: "hold",
        label: "Hold the horse while he works the shoe",
        check: { trait: "hands", dc: 12 },
        success: {
          text: "The animal trusts you more than him. The shoe goes back on. Dutch owes you in a currency he hates: thanks.",
          hours: 2,
          meters: { energy: -10, thirst: -8 },
          presentCharacter: "dutch-harrow",
          standing: { id: "dutch-harrow", delta: 1 },
        },
        fail: {
          text: "You take a hoof to the thigh. Dutch finishes alone and does not apologize, which is his apology.",
          hours: 2,
          meters: { health: -8, energy: -10 },
          presentCharacter: "dutch-harrow",
        },
      },
      {
        id: "accuse",
        label: "Ask whose horse it was last month",
        outcome: {
          text: "He smiles with too many teeth. The question sits between you like a third animal.",
          hours: 1,
          presentCharacter: "dutch-harrow",
          standing: { id: "dutch-harrow", delta: -1 },
        },
      },
      {
        id: "pass",
        label: "Keep walking",
        outcome: { text: "Lame horses and lame stories both travel. You decline the fare.", hours: 1 },
      },
    ],
  },
  {
    id: "sum-cyrus-scales",
    season: "summer",
    locations: ["south-pass", "mexican-trail-camp"],
    text: "Cyrus Pelt has a balance-beam out and is buying summer plews at winter prices. His smile is a tool. He keeps it oiled.",
    choices: [
      {
        id: "sell",
        label: "Sell him a pelt",
        check: { trait: "savvy", dc: 13 },
        success: {
          text: "You catch the thumb on the scale. He laughs, pays closer to honest, and writes you down as trouble.",
          hours: 1,
          inventory: { pelts: -1, rations: 2, powder: 1 },
          presentCharacter: "cyrus-pelt",
          standing: { id: "cyrus-pelt", delta: -1 },
        },
        fail: {
          text: "You take his number. The pelt looks smaller once it is his. That is the trick, and it worked.",
          hours: 1,
          inventory: { pelts: -1, rations: 1 },
          presentCharacter: "cyrus-pelt",
        },
      },
      {
        id: "warn",
        label: "Tell the next man the scale is light",
        outcome: {
          text: "Cyrus hears you. The next man does too. You have spent standing like coin.",
          hours: 1,
          presentCharacter: "cyrus-pelt",
          standing: { id: "cyrus-pelt", delta: -2 },
        },
      },
      {
        id: "no",
        label: "Your pelts are not that hungry",
        outcome: { text: "He calls after you that winter is coming, which is true and also his job.", hours: 1 },
      },
    ],
  },
  {
    id: "sum-caleb-hide",
    season: "summer",
    locations: ["timberline", "burned-timber", "elk-wallow"],
    text: "Caleb Briggs has an elk hide staked in a clearing. Amos is napping with his hat over his face, which is the whole division of labor.",
    choices: [
      {
        id: "help",
        label: "Help scrape",
        outcome: {
          text: "Caleb works like a clock. You match him until your wrists hum. He cuts you a strip and does not make a speech.",
          hours: 3,
          inventory: { rations: 1 },
          meters: { energy: -12, thirst: -10 },
          presentCharacter: "caleb-briggs",
          standing: { id: "caleb-briggs", delta: 1 },
        },
      },
      {
        id: "amos",
        label: "Kick Amos awake",
        outcome: {
          text: "He sits up grinning, unoffended, and offers you a pull of something that was never water. Caleb does not look up.",
          hours: 1,
          presentCharacter: "amos-briggs",
          meters: { warmth: 4, energy: -4 },
        },
      },
      {
        id: "walk",
        label: "Leave the brothers to their hide",
        outcome: { text: "Some work is a marriage. You do not insert yourself between it.", hours: 1 },
      },
    ],
  },
  {
    id: "sum-millicent-noon",
    season: "summer",
    locations: ["south-park-rim", "mexican-trail-camp"],
    text: "Millicent Voss has a sketchbook braced on her knee and is trying to make the park confess its distances before the heat erases the ink. Her assistant, if she had one, has already quit.",
    choices: [
      {
        id: "hold",
        label: "Hold the rod for pay",
        outcome: {
          text: "You become a stick with a shadow. She pays in hardtack and a lecture on why the maps are wrong. Both are useful.",
          hours: 4,
          inventory: { rations: 2 },
          meters: { energy: -14, thirst: -12 },
          presentCharacter: "millicent-voss",
          standing: { id: "millicent-voss", delta: 1 },
        },
      },
      {
        id: "shade",
        label: "Make her get out of the noon",
        outcome: {
          text: "She argues, then moves. The drawing is worse. She is not. She notices you noticed.",
          hours: 1,
          presentCharacter: "millicent-voss",
          standing: { id: "millicent-voss", delta: 1 },
        },
      },
      {
        id: "no",
        label: "Science can burn without you",
        outcome: { text: "She does not look up. The park goes on being unmeasured.", hours: 1 },
      },
    ],
  },
  {
    id: "sum-otter-shade",
    season: "summer",
    locations: ["beaver-meadow"],
    text: "Otter That Waits is sitting on a lodge in the one strip of shade the pond allows, watching a kit learn to be afraid of you.",
    choices: [
      {
        id: "sit",
        label: "Sit on the bank and be quiet",
        outcome: {
          text: "After a while he talks, not much, about a dam that will hold another winter if fools leave it. You are being measured for fool.",
          hours: 2,
          meters: { energy: 6 },
          presentCharacter: "otter-that-waits",
          standing: { id: "otter-that-waits", delta: 1 },
        },
      },
      {
        id: "pelt",
        label: "Ask what a plew is worth this year",
        outcome: {
          text: "He names a number that would have been a joke in ’28. The kit slaps water. That is also an answer.",
          hours: 1,
          presentCharacter: "otter-that-waits",
        },
      },
      {
        id: "leave",
        label: "Do not trouble the lodge",
        outcome: { text: "You back out through willow. The slapping follows, then stops, which you choose to read as permission.", hours: 1 },
      },
    ],
  },
  {
    id: "sum-ygnacio-cinch",
    season: "summer",
    locations: ["mexican-trail-camp", "wind-saddle"],
    text: "Ygnacio Luna is recinching a mule that has decided the saddle is an insult. He talks to it in Spanish the way some men pray, which may be the same motion.",
    choices: [
      {
        id: "hold",
        label: "Hold the headstall",
        outcome: {
          text: "The mule considers biting you and then does not. Ygnacio nods as if you had passed a small exam. He points you to a seep you would have walked past.",
          hours: 1,
          inventory: { water: 1 },
          presentCharacter: "ygnacio-luna",
          standing: { id: "ygnacio-luna", delta: 1 },
        },
      },
      {
        id: "ask",
        label: "Ask the trail toward Taos",
        check: { trait: "savvy", dc: 11 },
        success: {
          text: "He draws it in dust with a stick: which fork, which dry lie, which camp still has people in it.",
          hours: 1,
          presentCharacter: "ygnacio-luna",
          unlockLocation: "mexican-trail-camp",
        },
        fail: {
          text: "Your Spanish is a child. He smiles anyway and points downhill, which is not nothing.",
          hours: 1,
          presentCharacter: "ygnacio-luna",
        },
      },
      {
        id: "leave",
        label: "Leave a man to his mule",
        outcome: { text: "Some conversations are already full. You do not add yourself.", hours: 1 },
      },
    ],
  },
  {
    id: "sum-peggy-noon",
    season: "summer",
    locations: ["lightning-pine", "cache-deadfall", "high-camp"],
    text: "Peggy Dunne is recutting blazes in the noon heat as if the trees might forget her without constant instruction. Her canteen is already empty.",
    choices: [
      {
        id: "water",
        label: "Share a skin",
        outcome: {
          text: "She drinks, wipes the mouth, drinks again. “I marked a seep behind the deadfall. Don’t die stupid.”",
          hours: 1,
          inventory: { water: -1 },
          presentCharacter: "peggy-dunne",
          standing: { id: "peggy-dunne", delta: 1 },
          unlockLocation: "cache-deadfall",
        },
      },
      {
        id: "cut",
        label: "Take a turn with the knife",
        outcome: {
          text: "Your blaze is uglier than hers. She lets it stand. The trail gets one more letter in a language of scars.",
          hours: 2,
          meters: { energy: -8, thirst: -8 },
          presentCharacter: "peggy-dunne",
          standing: { id: "peggy-dunne", delta: 1 },
        },
      },
      {
        id: "pass",
        label: "She does not look like she wants company",
        outcome: { text: "The knife keeps talking to the bark. You keep your water and your distance.", hours: 1 },
      },
    ],
  },
  {
    id: "sum-star-berries",
    season: "summer",
    locations: ["ute-camp", "elk-wallow"],
    text: "Little Star has a basket of berries and a look that says you may have one if you can name the bush it came from. Dogs argue in the shade. The camp smells like fat and juniper.",
    choices: [
      {
        id: "name",
        label: "Name the bush",
        check: { trait: "savvy", dc: 11 },
        success: {
          text: "Serviceberry. She nods like a schoolmaster and lets you take a handful. Summer is a test with juice on it.",
          hours: 1,
          inventory: { rations: 1 },
          presentCharacter: "little-star",
          standing: { id: "little-star", delta: 1 },
        },
        fail: {
          text: "You guess currant. She eats one in front of you, unoffended, and puts the basket behind her feet.",
          hours: 1,
          presentCharacter: "little-star",
        },
      },
      {
        id: "trade",
        label: "Trade a shiny button for a share",
        outcome: {
          text: "She already has a raven’s button, but she takes yours. Children and magpies keep the same books.",
          hours: 1,
          extraRemove: "raven-button",
          inventory: { rations: 1 },
          presentCharacter: "little-star",
          standing: { id: "little-star", delta: 1 },
        },
      },
      {
        id: "leave",
        label: "Do not sit an exam you did not study for",
        outcome: { text: "She watches you go, already naming the next plant to someone more worthy.", hours: 1 },
      },
    ],
  },
  {
    id: "sum-arapaho-shade",
    season: "summer",
    locations: ["arapaho-ground"],
    text: "Noon on the park is a skillet. A strip of willow shade holds three horses and a boy who has already decided you are slow weather.",
    choices: [
      {
        id: "edge",
        label: "Sit the edge until you are spoken to",
        outcome: {
          text: "The boy fetches Nawat, or Nawat fetches himself. Shade is a kind of treaty if you do not walk into it unasked.",
          hours: 2,
          meters: { energy: 6, thirst: -6 },
          presentCharacter: "nawat",
        },
      },
      {
        id: "cut",
        label: "Cut across for time",
        check: { trait: "savvy", dc: 13 },
        success: {
          text: "You keep to the old trail and do not look like a thief. The park lets you be a cloud.",
          hours: 2,
          meters: { energy: -8, thirst: -10 },
        },
        fail: {
          text: "You are turned with a look. The park is not a road. You learn it in your feet.",
          hours: 1,
          standing: { id: "nawat", delta: -2 },
        },
      },
    ],
  },
  {
    id: "sum-chute-rattler",
    season: "summer",
    locations: ["avalanche-chute"],
    text: "The only shade on the chute is a boulder the size of a cabin. Under it, a sound like dry beans in a tin. The snake has the better claim.",
    choices: [
      {
        id: "wide",
        label: "Take the sun and leave the rock",
        outcome: { text: "Pride can burn. You still have a leg that works. The chute keeps its tenant.", hours: 1, meters: { thirst: -8 } },
      },
      {
        id: "stick",
        label: "Move it with a stick",
        check: { trait: "hands", dc: 13 },
        success: {
          text: "It goes, insulted. You take the shade for twenty minutes and call it medicine.",
          hours: 1,
          meters: { energy: 6, thirst: -4 },
        },
        fail: {
          text: "The stick is shorter than the argument. You jump wrong. The fangs find boot, not calf, which is the whole luck of the day.",
          hours: 1,
          meters: { energy: -8, health: -4 },
        },
      },
    ],
  },
  {
    id: "sum-fall-pack",
    season: "summer",
    locations: ["frozen-fall"],
    text: "A packsaddle is wedged in the rocks under the spray, leather black, one pannier still buckled. Whoever lost it went on or went under. The fall does not say which.",
    choices: [
      {
        id: "haul",
        label: "Haul it out",
        check: { trait: "grit", dc: 12 },
        success: {
          text: "Cornmeal gone to paste, a shoeing hammer, a letter addressed to Bent’s that the water has already read. You take the hammer and a handful that will still cook.",
          hours: 2,
          inventory: { rations: 1 },
          extraAdd: "shoeing-hammer",
          meters: { energy: -10, warmth: -6 },
        },
        fail: {
          text: "Spray and slick rock. You keep your bones and lose the hour. The saddle stays a monument.",
          hours: 2,
          meters: { energy: -10, warmth: -8 },
        },
      },
      {
        id: "leave",
        label: "Leave it to the fall",
        outcome: { text: "Someone’s luck is still in the rocks. You do not inherit it.", hours: 1 },
      },
    ],
  },
  {
    id: "sum-cave-cool",
    season: "summer",
    locations: ["talus-ice-cave"],
    text: "Bats stitch the mouth of the talus throat. Inside, last winter is a dirty tongue of ice. The heat outside is a fist. The dark is a root cellar that forgot the house.",
    choices: [
      {
        id: "sit",
        label: "Sit the cool an hour and do not sleep",
        outcome: {
          text: "Sweat dries. The bats ignore you. You come out able to walk the next pitch without seeing spots.",
          hours: 2,
          meters: { energy: 10, warmth: -6, thirst: 4 },
        },
      },
      {
        id: "ice",
        label: "Melt a skin off the ice",
        outcome: {
          text: "Slow work. Clean water. Your hands go stupid with cold and then forgive you.",
          hours: 2,
          inventory: { water: 2 },
          meters: { warmth: -10, thirst: 12 },
        },
      },
    ],
  },
];
