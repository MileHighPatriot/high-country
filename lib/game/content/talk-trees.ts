import { CHARACTER_BY_ID } from "@/lib/game/content/characters";
import type { DialogueNode } from "@/lib/game/types";

function add(id: string, node: DialogueNode) {
  const person = CHARACTER_BY_ID[id];
  if (!person) return;
  if (person.nodes.some((n) => n.id === node.id)) return;
  person.nodes.push(node);
}

/** Longer authored chains, then a linger beat so every face can stay and talk. */
export function installTalkTrees() {
  add("eliza-ward", {
    id: "eliza-stove-talk",
    text: "The stove ticks. Eliza does not look at you while she talks, which is how you know it is real. “I came up here because the valley had too many names. A stove is a name I can keep. You planning to be weather, or a neighbor.”",
    choices: [
      {
        id: "neighbor",
        label: "Say you mean to winter in sight of this cabin",
        outcome: {
          text: "She snorts. “Then bring wood before you bring hunger. Neighbors split work. Drifters split lies.” She pours something that is almost coffee.",
          hours: 1,
          meters: { warmth: 8, hunger: 6 },
          standing: { id: "eliza-ward", delta: 1 },
          remember: { id: "eliza-ward", tag: "sat-at-fire" },
          nextDialogue: "eliza-offer",
        },
      },
      {
        id: "weather",
        label: "Admit you do not know if you will last the month",
        outcome: {
          text: "“Honest. Rare.” She points at the door with her chin. “The pass is still a coffin. If you freeze in my yard I have to drag you. Don’t.”",
          hours: 1,
          standing: { id: "eliza-ward", delta: 1 },
          nextDialogue: "eliza-offer",
        },
      },
      {
        id: "ask-pass",
        label: "Ask when she last saw the pass open",
        outcome: {
          text: "“Year before last, for a week that lied.” She wipes the table. “You want down, you wait for mud, not hope.”",
          hours: 1,
          nextDialogue: "eliza-offer",
        },
      },
    ],
  });

  add("eliza-ward", {
    id: "eliza-offer",
    text: "She sets the tin down like a gavel. “You can sleep by that stove tonight if you split tomorrow’s wood before you eat. Or you can walk. I am not collecting strays.”",
    choices: [
      {
        id: "stay",
        label: "Take the stove. Promise the wood.",
        outcome: {
          text: "She nods once. “If you snore I will know you are still alive. That is the whole of my charity.”",
          hours: 1,
          meters: { warmth: 10 },
          standing: { id: "eliza-ward", delta: 1 },
          invite: "stay",
          markDialogue: "eliza-stove-talk",
        },
      },
      {
        id: "walk",
        label: "Ask her to walk as far as timberline with you",
        outcome: {
          text: "A look like you have offered to borrow the stove. Then she takes the pistol down. “As far as the switchback. I have wood of my own.”",
          hours: 1,
          invite: "walk",
          markDialogue: "eliza-stove-talk",
        },
      },
      {
        id: "leave",
        label: "Thank her and take the cold",
        outcome: {
          text: "The door shuts on real heat. You carry the smell of it like a rumor.",
          hours: 1,
          presentCharacter: null,
          markDialogue: "eliza-stove-talk",
        },
      },
    ],
  });

  add("silas-crowe", {
    id: "silas-more",
    text: "Silas draws in the ash with a stick. “Wind saddle loads first. The chute after. Ruin well is honest if you don’t mind the taste of somebody’s last year. You writing this down in your head or are you decorative.”",
    choices: [
      {
        id: "file",
        label: "File it. Ask which man to avoid.",
        outcome: {
          text: "“Hennepin. Company man. He’ll sell you a winter you already own.” Silas spits, accurately. “Ned gets lost on purpose. Feed him or don’t, but don’t follow him.”",
          hours: 1,
          standing: { id: "silas-crowe", delta: 1 },
          nextDialogue: "silas-company",
        },
      },
      {
        id: "argue",
        label: "Say you have already walked the ice and lived",
        outcome: {
          text: "He laughs until it becomes a cough. “Lived is a big word for not-dead-yet. Sit still. The cup’s almost friendly.”",
          hours: 1,
          nextDialogue: "silas-company",
        },
      },
      {
        id: "cup",
        label: "Ask for another swallow",
        check: { trait: "grit", dc: 12 },
        success: {
          text: "Worse than the first. Warmer. He looks almost proud. “That’s the west, and it is not hiring.”",
          hours: 1,
          meters: { warmth: 8, energy: -6 },
          standing: { id: "silas-crowe", delta: 1 },
          nextDialogue: "silas-company",
        },
        fail: {
          text: "You lose the swallow and some pride. He does not help. He does watch, which is a kind of help.",
          hours: 1,
          meters: { health: -2 },
          nextDialogue: "silas-company",
        },
      },
    ],
  });

  add("silas-crowe", {
    id: "silas-company",
    text: "He stands like a man who has been leaving for ten years. “I can sit your fire tonight. Or I can walk a trail with you until I remember I don’t like company. Pick, greenhorn. The mountain is billing by the hour.”",
    choices: [
      {
        id: "fire",
        label: "Keep him on the fire tonight",
        outcome: {
          text: "He sits back down as if he had never offered to leave. “Don’t die stupid. I hate restocking stories.”",
          hours: 1,
          invite: "stay",
          remember: { id: "silas-crowe", tag: "sat-at-fire" },
          markDialogue: "silas-more",
        },
      },
      {
        id: "trail",
        label: "Walk with him as far as he will go",
        outcome: {
          text: "He takes the cup. “Until the saddle, then I evaporate. Try to keep up with a drunk. It’s educational.”",
          hours: 1,
          invite: "walk",
          markDialogue: "silas-more",
        },
      },
      {
        id: "alone",
        label: "Tell him you prefer the quiet",
        outcome: {
          text: "He salutes with the tin. “Pride’s a thin blanket.” He takes a split of wood on the way out anyway.",
          hours: 1,
          inventory: { firewood: -1 },
          presentCharacter: null,
          markDialogue: "silas-more",
        },
      },
    ],
  });

  add("two-crows", {
    id: "two-crows-sit",
    text: "Two Crows cuts another strip and does not offer it yet. “You eat like a man who thinks the next ridge is a town. It is not. Why are you still this high.”",
    choices: [
      {
        id: "honest",
        label: "Wintered too high. No plan that survived the snow.",
        outcome: {
          text: "He nods as if you have finally said a true thing. “Then you are not hunting. You are delaying. Different work.”",
          hours: 1,
          standing: { id: "two-crows", delta: 1 },
          nextDialogue: "two-crows-path",
        },
      },
      {
        id: "pelt",
        label: "Say you came for beaver that is already gone",
        outcome: {
          text: "“Everybody did.” He looks at the quarter. “The beaver left. The hunger did not. You want meat, you walk where the elk still believe in grass.”",
          hours: 1,
          unlockLocation: "elk-wallow",
          nextDialogue: "two-crows-path",
        },
      },
      {
        id: "quiet",
        label: "Sit without answering",
        outcome: {
          text: "He allows the silence. In this country that is a trade. The strip of meat lands near your knee without ceremony.",
          hours: 1,
          inventory: { rations: 1 },
          standing: { id: "two-crows", delta: 1 },
          nextDialogue: "two-crows-path",
        },
      },
    ],
  });

  add("two-crows", {
    id: "two-crows-path",
    text: "He stands. The deer quarter turns with him. “I go toward the wallows at first light. You can walk that far if you do not talk as if the mountain were listening for compliments. Or you sit my fire and learn how not to waste fat.”",
    choices: [
      {
        id: "walk",
        label: "Walk as far as the wallows with him",
        outcome: {
          text: "He does not wait to see if you meant it. He walks. You are either behind him or you are weather.",
          hours: 1,
          invite: "walk",
          remember: { id: "two-crows", tag: "shared-meat" },
          markDialogue: "two-crows-sit",
        },
      },
      {
        id: "fire",
        label: "Sit the fire. Learn the fat.",
        outcome: {
          text: "He shows you the knife angle without making a lesson of it. Grease on the thumb. The hour agrees to continue.",
          hours: 2,
          meters: { hunger: 8 },
          invite: "stay",
          skill: "hide",
          markDialogue: "two-crows-sit",
        },
      },
      {
        id: "leave",
        label: "Keep your own trail",
        outcome: {
          text: "He does not watch you go. The quarter keeps swinging. You are not in that sentence.",
          hours: 1,
          presentCharacter: null,
          markDialogue: "two-crows-sit",
        },
      },
    ],
  });

  for (const id of ["eliza-ward", "silas-crowe", "two-crows"] as const) {
    const person = CHARACTER_BY_ID[id];
    if (!person) continue;
    add(id, {
      id: `${id}-linger`,
      repeatable: true,
      text: `${person.name} is still here. Not a visit. A person using the same air. ${person.blurb}`,
      choices: [
        {
          id: "ask",
          label: "Ask what they are actually doing on this ground",
          outcome: {
            text:
              id === "eliza-ward"
                ? "“Keeping a stove that does not belong to the pass.” She wipes a tin. “You can help or you can be weather.”"
                : id === "silas-crowe"
                  ? "“Wasting a cup on a man who might die interesting.” He toasts the ridge. “Don’t make me bury a dull one.”"
                  : "“Hunting. You are delaying. Different work, same mountain.” He does not smile at the distinction.",
            hours: 1,
            standing: { id, delta: 1 },
            invite: "stay",
          },
        },
        {
          id: "walk",
          label: "Ask them to walk the next trail",
          outcome: {
            text:
              id === "two-crows"
                ? "He is already walking. You are included until the wallows, or until you talk too much."
                : id === "eliza-ward"
                  ? "“As far as timberline. Then I have a door to keep.” She takes the pistol without making a speech of it."
                  : "“Until I remember I drink alone.” He starts. The cup comes too.",
            hours: 1,
            invite: "walk",
          },
        },
        {
          id: "part",
          label: "Let them go",
          outcome: {
            text: `${person.name} leaves the way weather leaves: without owing you a shape.`,
            hours: 1,
            presentCharacter: null,
            invite: "part",
          },
        },
      ],
    });
  }
}

installTalkTrees();
