import type { EncounterDef } from "@/lib/game/types";

/** Conditional beats fired from camp actions and ripples. Spare Front Range, 1835. */
export const CONDITION_ENCOUNTERS: EncounterDef[] = [
  {
    id: "cond-dusk-smoke-guest",
    timeBands: ["dusk", "night"],
    locationTags: ["shelter", "wood"],
    triggers: ["fire", "eat", "camp"],
    weight: 3,
    text: "Someone comes in on your smoke as if it were a road. A man you half-know, or the weather wearing a man’s shape. He stops at the edge of the light and shows empty hands.",
    choices: [
      {
        id: "in",
        label: "Let him sit",
        outcome: {
          text: "He takes the fire like a sacrament. Talk is small: pass, meat, who froze last week. He leaves a twist of tobacco and the feeling of being less alone, which you will pay for later.",
          hours: 1,
          presentCharacter: "silas-crowe",
          extraAdd: "willow-tobacco",
          standing: { id: "silas-crowe", delta: 1 },
        },
      },
      {
        id: "out",
        label: "Keep him in the dark",
        outcome: {
          text: "He nods as if he expected it. The dark takes him back. You listen a long time after the footsteps stop.",
          hours: 1,
          presentCharacter: null,
        },
      },
    ],
  },
  {
    id: "cond-eat-bag-thief",
    timeBands: ["dusk", "night"],
    triggers: ["eat", "sleep"],
    weight: 3,
    text: "While you chew, something tests the bag with a patience that is not human. Yellow eyes. A coyote that has learned men sleep beside their suppers.",
    choices: [
      {
        id: "kick",
        label: "Kick the bag in and shout",
        check: { trait: "grit", dc: 11 },
        success: {
          text: "It skitters. You keep the meat. The night keeps the coyote. You eat the rest standing.",
          hours: 0,
        },
        fail: {
          text: "It has the bag a heartbeat and is gone. You are left with grease on your mouth and a hole in the arithmetic.",
          hours: 0,
          inventory: { rations: -1 },
        },
      },
      {
        id: "share",
        label: "Throw it a scrap and watch",
        outcome: {
          text: "It takes the scrap like wages. You and the coyote have a treaty until hunger writes a new one.",
          hours: 1,
          inventory: { rations: -1 },
          meters: { energy: -2 },
        },
      },
    ],
  },
  {
    id: "cond-hunt-echo",
    locationTags: ["game"],
    triggers: ["hunt"],
    timeBands: ["dawn", "morning", "dusk"],
    weight: 3,
    text: "The shot is still walking the timber when a voice answers it. Not an echo. A man. He comes through the krummholz with his own rifle at half-cock, trying to decide if you are meat or company.",
    choices: [
      {
        id: "hail",
        label: "Hail him with empty hands",
        outcome: {
          text: "Ned Calhoun, or a man with Ned’s luck. He has been lost since yesterday’s weather. He sits. He eats if you have it. He talks if you don’t.",
          hours: 1,
          presentCharacter: "ned-calhoun",
        },
      },
      {
        id: "cover",
        label: "Keep the rifle and say nothing",
        check: { trait: "grit", dc: 12 },
        success: {
          text: "He reads the barrel and the silence and goes around. Powder unspent. Pride intact. You will wonder which of you was the fool.",
          hours: 1,
          presentCharacter: null,
        },
        fail: {
          text: "He takes the silence wrong. The timber gets small.",
          hours: 0,
          startSkirmish: {
            intro: "A hungry man with a rifle has decided you are the problem.",
            foes: [
              {
                id: "stranger",
                name: "A man from the timber",
                hp: 12,
                maxHp: 12,
                range: "near",
                damage: [3, 7],
              },
            ],
          },
        },
      },
    ],
  },
  {
    id: "cond-hunt-elk-blood",
    locations: ["elk-wallow", "grizzly-basin", "timberline"],
    triggers: ["hunt", "scout"],
    timeBands: ["dawn", "morning", "dusk"],
    weight: 3,
    text: "Blood on the hair-mud, still wet. An elk went through wounded. The trail is a red sentence you can still read.",
    choices: [
      {
        id: "follow",
        label: "Follow it",
        check: { trait: "eye", dc: 13 },
        success: {
          text: "You find it down in the wallows, finished. Heavy work. Heavy meat. The basin will smell you for a day.",
          hours: 2,
          inventory: { rations: 3, pelts: 1 },
          meters: { energy: -14 },
          relocate: "elk-wallow",
        },
        fail: {
          text: "The blood thins into snowmelt and opinion. You follow it into a stand of willow and come out with a scratched face and no elk.",
          hours: 2,
          meters: { energy: -12, health: -4 },
        },
      },
      {
        id: "leave",
        label: "Leave a wounded animal to the country",
        outcome: {
          text: "You tell yourself it is mercy. It is powder you did not spend. The ravens will file the rest.",
          hours: 1,
        },
      },
    ],
  },
  {
    id: "cond-scout-new-trail",
    triggers: ["scout", "search"],
    timeBands: ["dawn", "morning"],
    weight: 3,
    text: "A goat-track you have walked past like a blind man. Today the light picks out a blaze older than your claim on this country. It goes somewhere you have only smelled.",
    choices: [
      {
        id: "take",
        label: "Follow the blaze",
        outcome: {
          text: "The track dumps you onto ground you can use. You mark it in the part of your head that keeps you alive.",
          hours: 2,
          meters: { energy: -8 },
          unlockLocation: "lightning-pine",
        },
      },
      {
        id: "mark",
        label: "Blaze it your way and go back",
        outcome: {
          text: "You cut your own mark over the old one. The trail will wait. Trails always wait.",
          hours: 1,
          unlockLocation: "lightning-pine",
        },
      },
    ],
  },
  {
    id: "cond-scout-ute-sign",
    locations: ["elk-wallow", "ute-camp", "beaver-meadow", "timberline"],
    triggers: ["scout", "hunt", "search"],
    timeBands: ["dawn", "morning", "dusk"],
    weight: 3,
    text: "Unshod tracks, a turned stone, a snare set with a patience that is not yours. Someone is using this park who does not owe you a greeting.",
    choices: [
      {
        id: "sit",
        label: "Sit in the open and wait to be seen",
        outcome: {
          text: "Two Crows finds you like weather finds a ridge. He does not smile. He does not shoot. That is the whole welcome.",
          hours: 1,
          presentCharacter: "two-crows",
        },
      },
      {
        id: "go",
        label: "Leave their ground cleaner than you found it",
        outcome: {
          text: "You back off the sign. Pride objects. Savvy overrules.",
          hours: 1,
        },
      },
    ],
  },
  {
    id: "cond-sleep-drift",
    triggers: ["sleep"],
    weather: ["snow", "wind", "blizzard"],
    weight: 2,
    text: "You wake and the country has been rearranged. Your pack is where you left it. The rest of the world has taken a step downhill. The lean of the ground is not the lean you lay down on.",
    choices: [
      {
        id: "read",
        label: "Read the new ground",
        check: { trait: "savvy", dc: 12 },
        success: {
          text: "Snow-creep. You slept while the slab moved a rod. You are still you. The trail home is a different sentence.",
          hours: 1,
          meters: { energy: 8, warmth: -6 },
        },
        fail: {
          text: "You walk the wrong draw for an hour before the Front Range lines up. Pride and warmth both thinner.",
          hours: 2,
          meters: { energy: -6, warmth: -10 },
          relocate: "timberline",
        },
      },
      {
        id: "stay",
        label: "Sit until the light makes a map",
        outcome: {
          text: "Patience works. You are not as lost as the first minute claimed. Only colder.",
          hours: 2,
          meters: { warmth: -8, energy: 6 },
        },
      },
    ],
  },
  {
    id: "cond-sleep-theft",
    triggers: ["sleep"],
    timeBands: ["night", "dawn"],
    weight: 2,
    text: "Dawn. The bag is lighter. A ration gone, or a hand that was not a coyote. Tracks mix with your own until they are an argument.",
    choices: [
      {
        id: "follow",
        label: "Follow the thief",
        check: { trait: "eye", dc: 13 },
        success: {
          text: "A boy or a small man, already far. You do not catch him. You find the wrapper and a fear you can use. The meat is gone.",
          hours: 2,
          meters: { energy: -8 },
          presentCharacter: null,
        },
        fail: {
          text: "The tracks go into wind-crust and die. You have walked for nothing and breakfast is a memory.",
          hours: 2,
          meters: { energy: -10, hunger: -4 },
        },
      },
      {
        id: "count",
        label: "Count what is left and say nothing",
        outcome: {
          text: "You cinch the bag tighter. The mountain does not care who ate. You will.",
          hours: 0,
        },
      },
    ],
  },
  {
    id: "cond-blizzard-breathe",
    weather: ["blizzard"],
    triggers: ["wait", "shelter", "sleep", "camp"],
    weight: 3,
    text: "The white has no up. Your breath comes back as ice on the wool. For a long minute you cannot tell if you are standing.",
    choices: [
      {
        id: "hole",
        label: "Dig and go to ground",
        check: { trait: "hands", dc: 12 },
        success: {
          text: "A hole. A dark. The blizzard goes over like a river. You live in a pocket of your own air.",
          hours: 2,
          meters: { warmth: 8, energy: -10 },
          extraAdd: "snow-hole",
          clearFire: true,
        },
        fail: {
          text: "The snow you throw comes back in your mouth. You get a scrape and a cough and no roof.",
          hours: 2,
          meters: { warmth: -12, health: -6, energy: -10 },
        },
      },
      {
        id: "bear",
        label: "Keep your feet and wait for an edge",
        outcome: {
          text: "You become a dark lump and count. The world grows a tree, then another. You are still here, which will have to do.",
          hours: 3,
          meters: { warmth: -10, energy: -8 },
        },
      },
    ],
  },
  {
    id: "cond-blizzard-smell",
    weather: ["blizzard"],
    triggers: ["fire", "eat"],
    weight: 3,
    text: "Even in this white, smoke is a bell. Someone has followed it. A shape at the limit of seeing, calling a name that might be yours and might be God’s.",
    choices: [
      {
        id: "call",
        label: "Call them in",
        outcome: {
          text: "Caleb Briggs stumbles the last yards with a brother behind his eyes. He does not ask. He sits. The fire has to do for both of you.",
          hours: 1,
          presentCharacter: "caleb-briggs",
          meters: { warmth: -4 },
        },
      },
      {
        id: "quiet",
        label: "Bank the fire and be a stone",
        outcome: {
          text: "The calling moves off, or dies. You will not know which. The coals sulk. You sulk with them.",
          hours: 1,
          presentCharacter: null,
          meters: { warmth: -6 },
        },
      },
    ],
  },
  {
    id: "cond-creek-night-hole",
    locations: ["creek", "frozen-fall"],
    timeBands: ["night", "dusk"],
    triggers: ["scout", "wait", "search"],
    weight: 3,
    text: "The creek at night is a black muscle under ice or a loud animal in thaw. Something heavy drinks downstream. Not a man. Not not a man.",
    choices: [
      {
        id: "glass",
        label: "Ease closer",
        check: { trait: "eye", dc: 13 },
        success: {
          text: "Elk. A bull with last year’s patience. You could try for him. You could also keep your night. The wallows will remember the tracks.",
          hours: 1,
          meters: { energy: -4 },
          unlockLocation: "elk-wallow",
        },
        fail: {
          text: "Ice talks under you. The drinker is gone. You are left with a louder heart and wet mittens.",
          hours: 1,
          meters: { warmth: -8, energy: -4 },
        },
      },
      {
        id: "leave",
        label: "Let the dark keep its business",
        outcome: { text: "You back to camp without turning your head like prey.", hours: 1 },
      },
    ],
  },
  {
    id: "cond-fish-lodge",
    locations: ["beaver-meadow"],
    triggers: ["fish", "search"],
    timeBands: ["morning", "afternoon", "dawn"],
    weight: 3,
    text: "A lodge is leaking sticks into the current. On the roof, a man you have seen with a trap in his hands sits as if he paid rent. Otter That Waits looks at your line like it is a joke told badly.",
    choices: [
      {
        id: "pull",
        label: "Pull the line in",
        outcome: {
          text: "You take the hint. He nods once. Later he shows you a run that is not on any American map.",
          hours: 1,
          presentCharacter: "otter-that-waits",
          standing: { id: "otter-that-waits", delta: 1 },
        },
      },
      {
        id: "keep",
        label: "Keep fishing",
        outcome: {
          text: "He watches you catch nothing with a patience that is worse than a speech. You leave poorer in more than fish.",
          hours: 2,
          presentCharacter: "otter-that-waits",
          standing: { id: "otter-that-waits", delta: -1 },
          meters: { energy: -6 },
        },
      },
    ],
  },
  {
    id: "cond-mend-watcher",
    locationTags: ["shelter"],
    triggers: ["mend", "fire"],
    timeBands: ["afternoon", "dusk"],
    weight: 2,
    text: "You are greasing boots when you feel the yard change. Someone has been watching the needle instead of the rifle. When you look up, Hannah Briggs is in the doorlight with a bundle of wool.",
    choices: [
      {
        id: "yes",
        label: "Let her stitch what you cannot",
        outcome: {
          text: "She talks while she works, which is to say she talks at the cloth. The seam will hold. You owe her a story or a pelt.",
          hours: 1,
          presentCharacter: "hannah-briggs",
          extraAdd: "dry-boots",
          standing: { id: "hannah-briggs", delta: 1 },
        },
      },
      {
        id: "no",
        label: "Keep your own clumsy work",
        outcome: {
          text: "She shrugs. Pride is a coat that does not shed water. You finish the stitch yourself.",
          hours: 1,
          presentCharacter: "hannah-briggs",
        },
      },
    ],
  },
  {
    id: "cond-snares-cut",
    locationTags: ["game"],
    triggers: ["snares", "hunt", "search"],
    timeBands: ["morning", "dawn"],
    weight: 3,
    text: "The snare line has been walked by someone who knows snares. Two sets cut. One left as a message: a twist of grass in the loop, neat as a clerk’s knot.",
    choices: [
      {
        id: "reset",
        label: "Reset them farther off the trail",
        check: { trait: "savvy", dc: 12 },
        success: {
          text: "You take the hint and the lesson. Afternoon, a hare that did not read the message.",
          hours: 2,
          inventory: { rations: 1 },
          meters: { energy: -8 },
        },
        fail: {
          text: "You reset them like a stubborn man. They will be cut again. You know it while you do it.",
          hours: 2,
          meters: { energy: -8 },
        },
      },
      {
        id: "leave",
        label: "Leave this line to whoever claimed it",
        outcome: {
          text: "You coil your wire. The park is not as empty as the maps.",
          hours: 1,
        },
      },
    ],
  },
  {
    id: "cond-cache-visited",
    locations: ["cache-deadfall", "talus-ice-cave"],
    triggers: ["search", "camp"],
    weight: 3,
    text: "The stones have been moved by a hand that was not weather. Your mark is still there. Beside it, another: a D burned into bark, or a cross that wants to be a name. Dutch, or a liar using Dutch’s letter.",
    choices: [
      {
        id: "wait",
        label: "Wait to see who comes back",
        outcome: {
          text: "You wait. The one who comes is Dutch Harrow with a look like a man who has already spent your meat in his head.",
          hours: 2,
          presentCharacter: "dutch-harrow",
          meters: { energy: -6 },
        },
      },
      {
        id: "move",
        label: "Move what is left tonight",
        outcome: {
          text: "You take your own cache for a walk. Heavier. Safer. You sleep worse, which is the tax on keeping things.",
          hours: 2,
          meters: { energy: -10 },
          extraAdd: "deadfall-ticket",
        },
      },
    ],
  },
  {
    id: "cond-dawn-pass-glass",
    locations: ["south-pass", "wind-saddle", "south-park-rim"],
    triggers: ["scout", "wait", "arrive"],
    timeBands: ["dawn", "morning"],
    weight: 3,
    text: "First light on the pass. Weather is a wall moving in from the west, the color of a bruise. You have maybe half a day of being a man who can still choose.",
    choices: [
      {
        id: "down",
        label: "Get off the high ground",
        outcome: {
          text: "You take the hint the sky is giving. Timber takes you in. The wind arrives later, insulted.",
          hours: 3,
          relocate: "timberline",
          weather: "wind",
          meters: { energy: -10 },
        },
      },
      {
        id: "stay",
        label: "Watch it come",
        outcome: {
          text: "Pride. The wall arrives on time. Snow in the mouth. The pass becomes a rumor of itself.",
          hours: 2,
          weather: "blizzard",
          meters: { warmth: -16, energy: -8 },
          clearFire: true,
        },
      },
    ],
  },
  {
    id: "cond-storm-split-pine",
    locations: ["lightning-pine"],
    weather: ["storm"],
    triggers: ["wait", "search", "arrive", "scout"],
    weight: 3,
    text: "The split pine takes another vote from the sky. Hair on your arms. The air smells like a gun that has not been fired yet.",
    choices: [
      {
        id: "off",
        label: "Get out from under it",
        outcome: {
          text: "You leave the snag its argument with God. A bolt finds it anyway. Pitch and steam. You are not the lesson.",
          hours: 1,
          meters: { energy: -4 },
          extraAdd: "fatwood",
        },
      },
      {
        id: "watch",
        label: "Watch from too close",
        check: { trait: "grit", dc: 13 },
        success: {
          text: "The strike is a white idea. You keep your feet. After, the snag weeps pitch you can steal.",
          hours: 1,
          extraAdd: "fatwood",
          meters: { energy: -6 },
        },
        fail: {
          text: "Light, noise, the ground coming up. You wake with a bitten tongue and a ringing that will last the day.",
          hours: 2,
          meters: { health: -10, energy: -12 },
        },
      },
    ],
  },
  {
    id: "cond-night-circle",
    triggers: ["scout", "wait", "search"],
    timeBands: ["night"],
    weight: 2,
    text: "You watch the dark until it organizes. Wolves or dogs or men who want to be wolves: a circle that does not close, not yet. Eyes like wet coins.",
    choices: [
      {
        id: "fire",
        label: "Build the fire up, if you can",
        outcome: {
          text: "Light. The circle becomes a suggestion. You spend wood like a drunk spends coin and do not regret it.",
          hours: 1,
          inventory: { firewood: -1 },
          meters: { warmth: 10 },
        },
      },
      {
        id: "hold",
        label: "Hold still and be landscape",
        check: { trait: "grit", dc: 12 },
        success: {
          text: "They test the idea of you and file it under later. Dawn is a long clerk.",
          hours: 2,
          meters: { energy: -6, warmth: -8 },
        },
        fail: {
          text: "One comes in close enough to smell. You shout. It does not care. Teeth find wool, then skin.",
          hours: 1,
          meters: { health: -10, energy: -8 },
        },
      },
    ],
  },
  {
    id: "cond-spring-voices",
    locations: ["hot-spring"],
    timeBands: ["night", "dusk"],
    triggers: ["wait", "scout", "arrive"],
    weight: 3,
    text: "Steam makes a room. In it, voices that might be the water and might be Spanish. A man is soaking who should not be this high, this late, this unguarded.",
    choices: [
      {
        id: "hail",
        label: "Announce yourself",
        outcome: {
          text: "Padre Tomás surfaces like a thought. He blesses the water, or you, or his own luck. He has a letter he should not be carrying.",
          hours: 1,
          presentCharacter: "padre-tomas",
        },
      },
      {
        id: "leave",
        label: "Back into the cold",
        outcome: {
          text: "You leave him his steam. Some meetings are better in daylight, when rifles look like tools.",
          hours: 1,
        },
      },
    ],
  },
  {
    id: "cond-pray-beads",
    triggers: ["pray"],
    timeBands: ["dusk", "night"],
    weight: 3,
    text: "You are still talking to whatever listens when a man answers from the dark, which is poor manners in any church. Padre Tomás has a rosary and a cough and the look of someone who took a wrong pass on purpose.",
    choices: [
      {
        id: "sit",
        label: "Make room at the fire",
        outcome: {
          text: "He prays in Latin you do not owe. You feed him. He leaves beads in your palm that are warmer than they should be.",
          hours: 1,
          presentCharacter: "padre-tomas",
          standing: { id: "padre-tomas", delta: 1 },
          extraAdd: "rosary",
          inventory: { rations: -1 },
        },
      },
      {
        id: "alone",
        label: "Tell him the hour is yours",
        outcome: {
          text: "He goes. The prayer, such as it was, goes with him. You finish the night in a thinner silence.",
          hours: 1,
          presentCharacter: "padre-tomas",
          standing: { id: "padre-tomas", delta: -1 },
        },
      },
    ],
  },
  {
    id: "cond-timber-corpse-bird",
    locations: ["timberline", "burned-timber"],
    triggers: ["scout", "search", "wait"],
    timeBands: ["afternoon", "morning"],
    weight: 2,
    text: "Ravens arguing over a thing in the krummholz. Not an elk. Cloth. A man who sat down to rest and was accepted.",
    choices: [
      {
        id: "look",
        label: "See what he still owes the living",
        check: { trait: "grit", dc: 11 },
        success: {
          text: "A coat that is not yours until it is. You take it and leave him the rest of his name, which you do not know.",
          hours: 1,
          extraAdd: "dead-mans-coat",
          meters: { warmth: 8, energy: -4 },
        },
        fail: {
          text: "The ravens have been at the face. You get nothing but a taste in your mouth that water will not move.",
          hours: 1,
          meters: { energy: -6 },
        },
      },
      {
        id: "pass",
        label: "Give him a wide berth",
        outcome: {
          text: "You walk around the argument. The timber keeps its dead. You keep your appetite.",
          hours: 1,
        },
      },
    ],
  },
  {
    id: "cond-wallow-dawn",
    locations: ["elk-wallow"],
    triggers: ["hunt", "scout", "arrive"],
    timeBands: ["dawn"],
    weight: 3,
    text: "Dawn at the wallow is a steam of breath and mud. Cows, a bull too far, a calf that does not know you are a problem yet. Frost on Antler is already here, still as a snag, and has seen you.",
    choices: [
      {
        id: "back",
        label: "Back out of his hunt",
        outcome: {
          text: "You become timber. He does not thank you. Later, at a decent distance, he leaves you a strip of jerky on a stick like a receipt.",
          hours: 1,
          presentCharacter: "frost-on-antler",
          inventory: { rations: 1 },
          standing: { id: "frost-on-antler", delta: 1 },
        },
      },
      {
        id: "shoot",
        label: "Take the shot anyway",
        outcome: {
          text: "The herd empties the park. His look is a winter. You have meat if the ball flew true, and a name on the wrong list if it did not.",
          hours: 1,
          inventory: { powder: -1, rations: 1 },
          presentCharacter: "frost-on-antler",
          standing: { id: "frost-on-antler", delta: -2 },
        },
      },
    ],
  },
  {
    id: "cond-cabin-boards",
    locations: ["abandoned-cabin"],
    timeBands: ["night"],
    triggers: ["sleep", "wait", "scout"],
    weight: 3,
    text: "The cabin talks at night: stove-tick, a mouse, then a board that is not a mouse. Under the bunk, or in the wall, something that was hidden by a person who expected to come back.",
    choices: [
      {
        id: "pry",
        label: "Pry the board",
        check: { trait: "hands", dc: 12 },
        success: {
          text: "A tin of powder, a letter gone to pulp, a woman’s hair ribbon. Eliza’s, or not. You put the ribbon back and take the powder because living is rude.",
          hours: 1,
          inventory: { powder: 2 },
          presentCharacter: "eliza-ward",
        },
        fail: {
          text: "The board shrieks. Eliza is in the door with the pistol that is never quite aimed. You explain. It takes a while.",
          hours: 1,
          presentCharacter: "eliza-ward",
          standing: { id: "eliza-ward", delta: -1 },
        },
      },
      {
        id: "leave",
        label: "Leave another person’s hiding place",
        outcome: {
          text: "You roll over. The board ticks once more, satisfied.",
          hours: 0,
        },
      },
    ],
  },
  {
    id: "cond-saddle-stone",
    locations: ["wind-saddle"],
    weather: ["wind", "clear"],
    triggers: ["scout", "arrive", "wait"],
    weight: 2,
    text: "On the saddle a cairn has grown a new stone overnight, or you never looked. Under it, a scrap of paper held with a thorn: a hand pointing down-canyon, and a word that might be water.",
    choices: [
      {
        id: "heed",
        label: "Follow the hand",
        outcome: {
          text: "The canyon holds a seep you would have walked past. You drink like a forgiven man. Ygnacio’s trail-craft, or luck wearing his shape.",
          hours: 2,
          inventory: { water: 2 },
          meters: { thirst: 20, energy: -6 },
          presentCharacter: "ygnacio-luna",
          unlockLocation: "creek",
        },
      },
      {
        id: "add",
        label: "Add a stone and keep your own counsel",
        outcome: {
          text: "The cairn is taller. The wind does not care. You do, a little.",
          hours: 1,
          meters: { energy: -4 },
        },
      },
    ],
  },
  {
    id: "cond-burn-coal",
    locations: ["burned-timber"],
    triggers: ["search", "scout", "hunt"],
    timeBands: ["morning", "afternoon"],
    weight: 2,
    text: "Charcoal that will light if you are desperate enough to taste it. Under a black spar, a cache of pitch-wood someone meant to fetch before the fire ran. They did not.",
    choices: [
      {
        id: "take",
        label: "Take the pitch",
        outcome: {
          text: "Fatwood, black at the edges. The burn keeps giving, which is a kind of joke.",
          hours: 1,
          extraAdd: "fatwood",
          inventory: { firewood: 2 },
          meters: { energy: -6 },
        },
      },
      {
        id: "leave",
        label: "Leave a dead man’s kindling",
        outcome: {
          text: "You walk on. Superstition is heavier than pitch, some days.",
          hours: 1,
        },
      },
    ],
  },
  {
    id: "cond-rim-dust",
    locations: ["south-park-rim"],
    triggers: ["hunt", "scout", "arrive"],
    timeBands: ["morning", "afternoon"],
    weather: ["clear", "wind"],
    weight: 3,
    text: "Dust on the park that wants to be antelope. Millicent Voss is on the rim with a glass and a ledger, counting animals as if they were already hides.",
    choices: [
      {
        id: "talk",
        label: "Share the glass",
        outcome: {
          text: "She lets you look. The park is a rumor of meat. She wants a man who can walk it. You are, unfortunately, a man.",
          hours: 1,
          presentCharacter: "millicent-voss",
        },
      },
      {
        id: "hunt",
        label: "Go down after meat",
        check: { trait: "eye", dc: 14 },
        success: {
          text: "One animal drops. You will be heavy and glad. She makes a note as if she invented you.",
          hours: 4,
          inventory: { rations: 2, pelts: 1, powder: -1 },
          meters: { energy: -16 },
          presentCharacter: "millicent-voss",
        },
        fail: {
          text: "The park empties. She does not say I told you so. She writes it down instead.",
          hours: 3,
          inventory: { powder: -1 },
          meters: { energy: -14 },
          presentCharacter: "millicent-voss",
        },
      },
    ],
  },
  {
    id: "cond-cave-breath",
    locations: ["talus-ice-cave"],
    triggers: ["arrive", "sleep", "search", "scout"],
    weight: 3,
    text: "The cave breathes: a warm push, then a cold that has kept last year on a hook. At the back, a shape that is meat or a man who became meat. The ice has opinions about which.",
    choices: [
      {
        id: "cut",
        label: "Cut what will still feed you",
        check: { trait: "savvy", dc: 12 },
        success: {
          text: "Elk, frozen honest. You take a day and leave the rest to the dark, which is the only landlord here.",
          hours: 2,
          inventory: { rations: 2 },
          meters: { warmth: -12, energy: -8 },
          extraAdd: "ice-cache",
        },
        fail: {
          text: "You guess wrong. By evening you are a furnace. The cave keeps its joke.",
          hours: 2,
          meters: { health: -12, warmth: -10 },
        },
      },
      {
        id: "out",
        label: "Get out of the throat",
        outcome: {
          text: "Daylight feels invented. You take the lesson and leave the meat.",
          hours: 1,
          meters: { warmth: 6 },
        },
      },
    ],
  },
  {
    id: "cond-trail-mule",
    locations: ["mexican-trail-camp"],
    triggers: ["arrive", "search", "wait"],
    timeBands: ["afternoon", "morning", "dusk"],
    weight: 3,
    text: "A mule in the stone ring, still saddled, eating last year’s grass. No man. Blood on the pommel that is not the mule’s. Ramón Salazar’s rig, or a thief’s idea of it.",
    choices: [
      {
        id: "hold",
        label: "Hold the mule and wait",
        outcome: {
          text: "Ramón comes in on foot with a story about a gully and a man who will not need the mule. He looks at your hands on the reins and decides what kind of person you are.",
          hours: 2,
          presentCharacter: "ramon-salazar",
          standing: { id: "ramon-salazar", delta: 1 },
        },
      },
      {
        id: "take",
        label: "Take the animal",
        outcome: {
          text: "You take the mule. It is not yours. It is faster than guilt. Guilt is patient.",
          hours: 1,
          extraAdd: "borrowed-mule",
          presentCharacter: null,
        },
      },
    ],
  },
  {
    id: "cond-ruin-bucket",
    locations: ["homesteader-ruin"],
    triggers: ["search", "arrive", "scout"],
    timeBands: ["morning", "afternoon"],
    weight: 2,
    text: "The well-bucket is down. The rope is new. Martha Keene’s knot. She is not in sight, which means she is in earshot, which on this ground is the same as a loaded thing.",
    choices: [
      {
        id: "call",
        label: "Call her name",
        outcome: {
          text: "She comes from the weeds with a look like weather. “If you’re here to steal water, steal it honest.” She shows you the seep that does not fail in January.",
          hours: 1,
          presentCharacter: "martha-keene",
          inventory: { water: 1 },
          standing: { id: "martha-keene", delta: 1 },
        },
      },
      {
        id: "haul",
        label: "Haul the bucket like it is yours",
        outcome: {
          text: "Water. Then Martha. Then a silence you will wear for a day.",
          hours: 1,
          inventory: { water: 1 },
          presentCharacter: "martha-keene",
          standing: { id: "martha-keene", delta: -1 },
        },
      },
    ],
  },
  {
    id: "cond-camp-noon-shade",
    locations: ["high-camp"],
    triggers: ["wait", "eat", "mend", "scout"],
    timeBands: ["afternoon"],
    weather: ["clear", "wind"],
    weight: 2,
    text: "Noon on the bench. A hawk hangs as if nailed. In the lean-to shade, a man is already sitting on your woodpile with a tin that is not tea. Silas Crowe has the hour, and he knows it.",
    choices: [
      {
        id: "share",
        label: "Share the shade",
        outcome: {
          text: "He talks about men who sat down in snow and looked comfortable. You keep your feet on the ground while you listen. He leaves you a warning dressed as a joke.",
          hours: 1,
          presentCharacter: "silas-crowe",
          standing: { id: "silas-crowe", delta: 1 },
        },
      },
      {
        id: "work",
        label: "Put him to splitting wood",
        outcome: {
          text: "He laughs, then splits three sticks badly, then one well. “Pride’s a thin blanket,” he says, and takes nothing.",
          hours: 1,
          inventory: { firewood: 1 },
          presentCharacter: "silas-crowe",
        },
      },
    ],
  },
  {
    id: "cond-fire-bank-coal",
    triggers: ["fire"],
    timeBands: ["dusk", "night"],
    weather: ["wind", "snow", "clear"],
    weight: 2,
    text: "You have a coal. The wind wants it. A gust lays the flame over and the dark comes in like a claim jumper.",
    choices: [
      {
        id: "save",
        label: "Cup it and start again",
        check: { trait: "hands", dc: 11 },
        success: {
          text: "You keep the coal in punk and breath. The fire comes back smaller and meaner, which is still a fire.",
          hours: 1,
          meters: { warmth: 12, energy: -6 },
        },
        fail: {
          text: "The coal dies in your palm. You have smoke-smell and no heat. Night notices.",
          hours: 1,
          meters: { warmth: -10, energy: -6 },
          clearFire: true,
        },
      },
      {
        id: "wood",
        label: "Spend the last dry wood at once",
        outcome: {
          text: "A bigger fire, brief as a sermon. You are warm in a way that has a bill attached.",
          hours: 1,
          inventory: { firewood: -1 },
          meters: { warmth: 18 },
        },
      },
    ],
  },
  {
    id: "cond-drink-seep",
    locationTags: ["water"],
    triggers: ["drink", "search"],
    timeBands: ["morning", "afternoon"],
    weight: 2,
    text: "The canteen was not as empty as it sounded, or the seep you knelt at was not as clean. Mineral. A slick on the tongue. By the next hour your guts have an opinion.",
    choices: [
      {
        id: "boil",
        label: "Boil what is left, if you have a fire",
        outcome: {
          text: "You spend an hour making water into water. The gut eases. Pride does not, having been wrong about the creek.",
          hours: 1,
          meters: { health: 4, energy: -4 },
        },
      },
      {
        id: "push",
        label: "Walk it off",
        outcome: {
          text: "You walk. The country jostles the sickness. Sometimes that is medicine. Sometimes it is how men lie down.",
          hours: 2,
          meters: { health: -6, energy: -8, thirst: -8 },
        },
      },
    ],
  },
];
