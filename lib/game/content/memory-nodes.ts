import { CHARACTER_BY_ID } from "@/lib/game/content/characters";
import type { DialogueNode } from "@/lib/game/types";

function add(id: string, node: DialogueNode) {
  const person = CHARACTER_BY_ID[id];
  if (!person) return;
  if (person.nodes.some((n) => n.id === node.id)) return;
  person.nodes.push(node);
}

/** Memory-gated talk. Installed at module load so talk() sees the nodes. */
export function installMemoryNodes() {
  add("eliza-ward", {
    id: "eliza-shared-meat",
    requiresMemory: "shared-meat",
    text: "Eliza looks at your bag the way she looks at a ledger. “You fed me once. Or I fed you. Don’t make a religion of it. Sit. The stove is still not a charity, but it remembers grease.”",
    choices: [
      {
        id: "sit",
        label: "Sit and eat what she puts down",
        outcome: {
          text: "Beans, a heel of bread, no speech. She lets you dry the coat. “Next time you bring meat or you bring wood. I am not a winter story.”",
          hours: 2,
          meters: { hunger: 14, warmth: 12 },
          standing: { id: "eliza-ward", delta: 1 },
          markDialogue: "eliza-shared-meat",
        },
      },
      {
        id: "go",
        label: "Thank her and keep moving",
        outcome: {
          text: "She nods once. The door shuts on real heat. You carry the meat between you like a third person.",
          hours: 1,
          markDialogue: "eliza-shared-meat",
        },
      },
    ],
  });

  add("eliza-ward", {
    id: "eliza-stole",
    requiresMemory: "stole",
    text: "Eliza’s pistol is not quite aimed. “I know a taking when it walks into my yard. You want the stove, you work. You want to steal, you find another mountain.”",
    choices: [
      {
        id: "work",
        label: "Put your hands on the axe without talking",
        outcome: {
          text: "You work until the debt is smaller. She does not forgive. She files. At dusk she lets you sit by the stove with the door in sight.",
          hours: 3,
          meters: { energy: -10, warmth: 10 },
          standing: { id: "eliza-ward", delta: 1 },
          markDialogue: "eliza-stole",
        },
      },
      {
        id: "leave",
        label: "Back out",
        outcome: {
          text: "She does not watch you go. That is worse than being watched.",
          hours: 1,
          standing: { id: "eliza-ward", delta: -1 },
          presentCharacter: null,
          markDialogue: "eliza-stole",
        },
      },
    ],
  });

  add("silas-crowe", {
    id: "silas-sat-fire",
    requiresMemory: "sat-at-fire",
    text: "Silas points at your hands as if they still held his cup. “I sat in your smoke. That makes us neighbors, which on this range is a threat. Don’t die stupid. I hate restocking stories.”",
    choices: [
      {
        id: "ask",
        label: "Ask which saddle loads first this week",
        outcome: {
          text: "He draws in ash again. Wind saddle, chute, the ruin well. Spite and survival in the same stick. You file it.",
          hours: 1,
          unlockLocation: "wind-saddle",
          standing: { id: "silas-crowe", delta: 1 },
          markDialogue: "silas-sat-fire",
        },
      },
      {
        id: "drink",
        label: "Share whatever is in the tin",
        outcome: {
          text: "Worse than last time. He laughs. You do not freeze for an hour, which is the whole medical science.",
          hours: 1,
          meters: { warmth: 8, energy: -6 },
          standing: { id: "silas-crowe", delta: 1 },
          markDialogue: "silas-sat-fire",
        },
      },
    ],
  });

  add("silas-crowe", {
    id: "silas-struck-camp",
    requiresMemory: "struck-camp",
    text: "Silas toecaps the empty ring of stones you left. “You pulled stakes. Fine. The mountain is not a lease. Just don’t come crying when the next bench is worse and the coals are someone else’s.”",
    choices: [
      {
        id: "own",
        label: "Say you had to move",
        outcome: {
          text: "He shrugs. “Everybody has to move. Some of us leave the ring where a man can find it in weather.” He spits and the subject is closed.",
          hours: 1,
          standing: { id: "silas-crowe", delta: 0 },
          markDialogue: "silas-struck-camp",
        },
      },
      {
        id: "offer",
        label: "Offer him a ration for the lecture",
        outcome: {
          text: "He takes it. “That’s rent on a speech.” He tells you where not to pitch in a chute year. You listen because the alternative is dying correctly.",
          hours: 1,
          inventory: { rations: -1 },
          standing: { id: "silas-crowe", delta: 1 },
          remember: { id: "silas-crowe", tag: "shared-meat" },
          markDialogue: "silas-struck-camp",
        },
      },
    ],
  });

  add("ned-calhoun", {
    id: "ned-shared-meat",
    requiresMemory: "shared-meat",
    text: "Ned looks at your pack the way a dog looks at a table, then remembers he has already been fed at it. “You gave me meat. I can carry something. I can. I’m stronger than I look.”",
    choices: [
      {
        id: "keep",
        label: "Let him walk with you an hour",
        outcome: {
          text: "He talks too much and then not enough. He points out a blaze you had walked past. The meat still sits between you like a third person.",
          hours: 1,
          unlockLocation: "cache-deadfall",
          standing: { id: "ned-calhoun", delta: 1 },
          presentCharacter: "ned-calhoun",
          markDialogue: "ned-shared-meat",
        },
      },
      {
        id: "send",
        label: "Send him toward a roof",
        outcome: {
          text: "He nods too fast. You have fed him and you are sending him. Both things can be true. The mountain will or it won’t.",
          hours: 1,
          standing: { id: "ned-calhoun", delta: -1 },
          presentCharacter: null,
          markDialogue: "ned-shared-meat",
        },
      },
    ],
  });

  add("ned-calhoun", {
    id: "ned-left-storm",
    requiresMemory: "left-in-storm",
    text: "Ned’s city coat is worse. He does not look at your face. “You pointed. I went. The weather was a mouth. I’m still here, which is not the same as you being right.”",
    choices: [
      {
        id: "sorry",
        label: "Give him fire and a ration and do not explain",
        outcome: {
          text: "He eats. He does not forgive in words. He sleeps with his boots on beside your ring. The storm you walked out of is still in his face.",
          hours: 2,
          inventory: { rations: -1 },
          standing: { id: "ned-calhoun", delta: 2 },
          remember: { id: "ned-calhoun", tag: "sat-at-fire" },
          presentCharacter: "ned-calhoun",
          markDialogue: "ned-left-storm",
        },
      },
      {
        id: "hard",
        label: "Tell him the mountain does not do apologies",
        outcome: {
          text: "He laughs once, ugly. “I know.” He is gone before you invent a kinder sentence.",
          hours: 1,
          standing: { id: "ned-calhoun", delta: -1 },
          presentCharacter: null,
          markDialogue: "ned-left-storm",
        },
      },
    ],
  });

  add("two-crows", {
    id: "two-crows-shared-meat",
    requiresMemory: "shared-meat",
    text: "Two Crows nods at your bag. “You fed a fire I sat at. Or you put meat in my hand. Either way you are not weather today.” He has water. He has a look that asks if you will stay honest.",
    choices: [
      {
        id: "trade",
        label: "Trade talk for the wallow",
        outcome: {
          text: "He tells you the wallow is busy and the basin is not for you. You leave with water and the feeling of being counted.",
          hours: 1,
          inventory: { water: 1 },
          standing: { id: "two-crows", delta: 1 },
          unlockLocation: "elk-wallow",
          markDialogue: "two-crows-shared-meat",
        },
      },
      {
        id: "quiet",
        label: "Stand quiet and let him go first",
        outcome: {
          text: "He almost smiles. Almost. The mountain is not a story. You both know it.",
          hours: 1,
          standing: { id: "two-crows", delta: 1 },
          markDialogue: "two-crows-shared-meat",
        },
      },
    ],
  });

  add("peggy-dunne", {
    id: "peggy-stole",
    requiresMemory: "stole",
    text: "Peggy looks at your boots a long time. “I know those. They stood in my hole and took. You want to be a thief, be a good one. You want to be a person, put something back.”",
    choices: [
      {
        id: "back",
        label: "Put a ration back in the deadfall",
        outcome: {
          text: "She watches. She does not thank. The blaze gets a new cut. Your name is smaller in her book, which is still a book.",
          hours: 1,
          inventory: { rations: -1 },
          standing: { id: "peggy-dunne", delta: 2 },
          extraAdd: "peggy-favor",
          markDialogue: "peggy-stole",
        },
      },
      {
        id: "own",
        label: "Own it and keep walking",
        outcome: {
          text: "She snorts. “Then I will know your boots in weather.” You feel the taking still on your hands.",
          hours: 1,
          standing: { id: "peggy-dunne", delta: -1 },
          markDialogue: "peggy-stole",
        },
      },
    ],
  });

  add("jean-baptiste", {
    id: "jb-sat-fire",
    requiresMemory: "sat-at-fire",
    text: "Jean-Baptiste touches his hat to your fire even if it is not the same fire. “I sang in your smoke. That is a kind of rent. Tonight I have a verse about ice that is not poetry.”",
    choices: [
      {
        id: "listen",
        label: "Listen to the ice verse",
        outcome: {
          text: "The beaver pond, the plate, the men who walk it. He is drunk and accurate. You file the accurate part.",
          hours: 1,
          standing: { id: "jean-baptiste", delta: 1 },
          unlockLocation: "beaver-meadow",
          markDialogue: "jb-sat-fire",
        },
      },
      {
        id: "feed",
        label: "Feed him and let the song happen",
        outcome: {
          text: "He eats, he sings, the coyotes vote. You are less alone. That is not free.",
          hours: 1,
          inventory: { rations: -1 },
          standing: { id: "jean-baptiste", delta: 1 },
          remember: { id: "jean-baptiste", tag: "shared-meat" },
          markDialogue: "jb-sat-fire",
        },
      },
    ],
  });

  add("martha-keene", {
    id: "martha-left-storm",
    requiresMemory: "left-in-storm",
    text: "Martha stands in the ruin’s chimney-shadow with a look that has already spent your name. “You walked out of weather and left a body in it. Mine, or the boy’s, or someone who looked like help. The well still works. You may not.”",
    choices: [
      {
        id: "water",
        label: "Ask for the seep and take the blame",
        outcome: {
          text: "She shows you the wet stone. She does not forgive. Water is still water. You drink it like a man who has been correctly accused.",
          hours: 1,
          inventory: { water: 2 },
          standing: { id: "martha-keene", delta: 1 },
          markDialogue: "martha-left-storm",
        },
      },
      {
        id: "go",
        label: "Leave the ruin to her",
        outcome: {
          text: "The storm you walked out of is still in her face. You take the fenceline. Pride is a coat that does not button.",
          hours: 1,
          standing: { id: "martha-keene", delta: -1 },
          presentCharacter: null,
          markDialogue: "martha-left-storm",
        },
      },
    ],
  });

  add("white-shell", {
    id: "shell-sat-fire",
    requiresMemory: "sat-at-fire",
    text: "White Shell’s hands are busy, then they are not. “You let a person sit in your smoke. That is not nothing. This water still does not heal stupid. Sit or go.”",
    choices: [
      {
        id: "sit",
        label: "Sit and let her work",
        outcome: {
          text: "She packs a cut. The heat and the quiet put an hour back. She does not mention your fire again. She does not need to.",
          hours: 2,
          meters: { health: 8, warmth: 10 },
          standing: { id: "white-shell", delta: 1 },
          markDialogue: "shell-sat-fire",
        },
      },
      {
        id: "go",
        label: "Leave her the spring",
        outcome: {
          text: "She grants you the courtesy of not watching you go.",
          hours: 1,
          markDialogue: "shell-sat-fire",
        },
      },
    ],
  });

  add("hannah-briggs", {
    id: "hannah-sat-fire",
    requiresMemory: "sat-at-fire",
    text: "Hannah’s needle pauses. “You had me at a fire that was yours. I still have the smoke in the wool. Sit. I can stitch a thing that will not split the first wet day.”",
    choices: [
      {
        id: "pay",
        label: "Sit and let her mend the coat",
        outcome: {
          text: "She talks while she works, which is how she does not think about the mountain. The seam holds. So does the hour.",
          hours: 2,
          meters: { warmth: 8 },
          extraAdd: "dry-boots",
          standing: { id: "hannah-briggs", delta: 1 },
          markDialogue: "hannah-sat-fire",
        },
      },
      {
        id: "talk",
        label: "Talk and do not make her a servant",
        outcome: {
          text: "She snorts, which is thanks. You leave with less cold in the hands and no new debt you can measure.",
          hours: 1,
          standing: { id: "hannah-briggs", delta: 1 },
          markDialogue: "hannah-sat-fire",
        },
      },
    ],
  });

  add("padre-tomas", {
    id: "tomas-shared-meat",
    requiresMemory: "shared-meat",
    text: "Padre Tomás smells the grease on you before he blesses anything. “You fed someone. That is a kind of prayer I did not order. I have chile. You have a soul that is still bargaining.”",
    choices: [
      {
        id: "eat",
        label: "Eat and let him talk",
        outcome: {
          text: "Chile and hard bread that tastes like a town. He does not take a letter back. He does not give you a new one. He feeds you. Amen is a word for men with churches.",
          hours: 2,
          meters: { hunger: 16, thirst: 6 },
          standing: { id: "padre-tomas", delta: 1 },
          markDialogue: "tomas-shared-meat",
        },
      },
      {
        id: "go",
        label: "Bless the air and keep moving",
        outcome: {
          text: "He nods without offense and still gives you water. “Then live, at least.”",
          hours: 1,
          inventory: { water: 1 },
          markDialogue: "tomas-shared-meat",
        },
      },
    ],
  });

  add("frost-on-antler", {
    id: "frost-shared-meat",
    requiresMemory: "shared-meat",
    text: "Frost on Antler holds up a palm, then lowers it. He has eaten at your fire or taken your meat in weather. The basin is still not a parlor. He drops a grouse anyway and is almost gone before you nod.",
    choices: [
      {
        id: "take",
        label: "Take the bird and say nothing",
        outcome: {
          text: "That is the whole speech. You have meat. He has the basin. The Front Range does not require minutes.",
          hours: 1,
          inventory: { rations: 1 },
          standing: { id: "frost-on-antler", delta: 1 },
          presentCharacter: null,
          markDialogue: "frost-shared-meat",
        },
      },
      {
        id: "follow",
        label: "Follow a little way — not into the willow",
        outcome: {
          text: "He lets you see the edge of what is moving down there. Then he is a track. You turn back with the grouse and a correct fear.",
          hours: 2,
          inventory: { rations: 1 },
          standing: { id: "frost-on-antler", delta: 1 },
          markDialogue: "frost-shared-meat",
        },
      },
    ],
  });
}

installMemoryNodes();
