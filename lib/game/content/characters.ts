import type { CharacterDef } from "@/lib/game/types";

export const CHARACTERS: CharacterDef[] = [
  {
    id: "eliza-ward",
    name: "Eliza Ward",
    art: "/art/people/eliza-ward.jpg",
    home: ["abandoned-cabin"],
    seasons: "all",
    blurb: "Holds the cabin like a claim. Will share a stove for work or pelts.",
    fallback:
      "Eliza looks you over the way she looks at weather. “You know where the woodpile is. Don’t track mud on my floor.”",
    nodes: [
      {
        id: "eliza-first",
        text: "A woman in a man’s wool coat stands in the cabin door with a pistol not quite aimed. “This stove is mine. The roof is mine. If you’re starving I am not a charity, but I am not a grave either.”",
        choices: [
          {
            id: "work",
            label: "Offer to cut wood for a night inside",
            outcome: {
              text: "She jerks her chin at the axe. You work until your hands shake. At dusk she lets you sleep by the stove and puts a tin of beans where you can reach it.",
              hours: 4,
              meters: { energy: -15, warmth: 20, hunger: 15 },
              inventory: { firewood: 1 },
              standing: { id: "eliza-ward", delta: 1 },
              presentCharacter: "eliza-ward",
              markDialogue: "eliza-first",
            },
          },
          {
            id: "pelt",
            label: "Offer a pelt for the stove",
            outcome: {
              text: "She takes the pelt, sniffs it, and nods once. “One night. You snore, you sleep in the lean-to.”",
              hours: 1,
              meters: { warmth: 25 },
              inventory: { pelts: -1 },
              standing: { id: "eliza-ward", delta: 1 },
              presentCharacter: "eliza-ward",
              markDialogue: "eliza-first",
            },
          },
          {
            id: "leave",
            label: "Back out and keep moving",
            outcome: {
              text: "She does not watch you go. The door shuts on the smell of real heat.",
              hours: 1,
              standing: { id: "eliza-ward", delta: -1 },
              presentCharacter: null,
              markDialogue: "eliza-first",
            },
          },
        ],
      },
      {
        id: "eliza-winter",
        seasons: ["winter"],
        minStanding: 1,
        text: "Eliza’s breath smokes in the cabin. “If you freeze in my yard I have to drag you. Sit. Tell me if the pass is still a coffin.”",
        choices: [
          {
            id: "honest",
            label: "Tell her the truth about the weather",
            outcome: {
              text: "She listens like a clerk taking inventory. Then she splits a biscuit and pushes half across the table. “Don’t make me bury a fool.”",
              hours: 2,
              meters: { hunger: 12, warmth: 15 },
              standing: { id: "eliza-ward", delta: 1 },
              markDialogue: "eliza-winter",
            },
          },
          {
            id: "ask",
            label: "Ask if she has spare powder",
            check: { trait: "savvy", dc: 13 },
            success: {
              text: "She slides two charges across. “Bring meat or don’t come begging twice.”",
              hours: 1,
              inventory: { powder: 2 },
              standing: { id: "eliza-ward", delta: -1 },
              markDialogue: "eliza-winter",
            },
            fail: {
              text: "“Powder is how I keep this door mine.” She does not raise her voice. She does not need to.",
              hours: 1,
              markDialogue: "eliza-winter",
            },
          },
        ],
      },
    ],
  },
  {
    id: "two-crows",
    name: "Two Crows",
    art: "/art/people/two-crows.jpg",
    home: ["ute-camp", "elk-wallow", "beaver-meadow"],
    seasons: ["spring", "summer", "fall"],
    blurb: "Ute hunter. Trades meat and water for powder or honesty.",
    fallback:
      "Two Crows nods as if he expected you. He does not waste English on weather you can see.",
    nodes: [
      {
        id: "two-crows-trade",
        text: "Two Crows has a deer quarter hanging and a look that asks what you are worth. “Powder,” he says. “Or you keep walking hungry.”",
        choices: [
          {
            id: "trade",
            label: "Trade two powder for meat and water",
            outcome: {
              text: "He takes the horn without smiling and cuts you a piece that will last two days if you are not greedy.",
              hours: 1,
              inventory: { powder: -2, rations: 2, water: 1 },
              standing: { id: "two-crows", delta: 1 },
              presentCharacter: "two-crows",
              markDialogue: "two-crows-trade",
            },
          },
          {
            id: "honest",
            label: "Admit you have almost nothing",
            check: { trait: "savvy", dc: 12 },
            success: {
              text: "He studies your face, then tosses you a strip of dried meat. “Next time you bring something. The mountain is not a story.”",
              hours: 1,
              inventory: { rations: 1 },
              standing: { id: "two-crows", delta: 1 },
              markDialogue: "two-crows-trade",
            },
            fail: {
              text: "He turns back to the quarter. You are weather. Weather passes.",
              hours: 1,
              markDialogue: "two-crows-trade",
            },
          },
        ],
      },
      {
        id: "two-crows-warn",
        seasons: ["fall"],
        text: "“Grizzly basin is not for you when the berries go,” Two Crows says. “The old one is still walking.”",
        choices: [
          {
            id: "heed",
            label: "Thank him and mark it",
            outcome: {
              text: "He almost smiles. Almost. You will remember the basin differently now.",
              hours: 1,
              standing: { id: "two-crows", delta: 1 },
              unlockLocation: "grizzly-basin",
              markDialogue: "two-crows-warn",
            },
          },
          {
            id: "boast",
            label: "Say you have a rifle",
            outcome: {
              text: "He looks at your rifle the way a man looks at a child’s stick. “Then you will die holding it.”",
              hours: 1,
              standing: { id: "two-crows", delta: -1 },
              markDialogue: "two-crows-warn",
            },
          },
        ],
      },
    ],
  },
  {
    id: "silas-crowe",
    name: "Silas Crowe",
    art: "/art/people/silas-crowe.jpg",
    home: ["high-camp", "lightning-pine", "timberline", "mexican-trail-camp"],
    seasons: "all",
    blurb: "Old mountain man. Good advice. Bad company. Drunk more often than not.",
    fallback:
      "Silas lifts a tin cup that is not tea. “You still alive? Wasteful.”",
    nodes: [
      {
        id: "silas-advice",
        text: "Silas Crowe is sitting on your firewood like he paid for it. “Greenhorn. The creek will kill you faster than a Ute will. Melt it. Don’t walk it.”",
        choices: [
          {
            id: "listen",
            label: "Listen and share a ration",
            outcome: {
              text: "He talks for an hour: which saddle loads snow, which ruin has a well, which man will sell you a dead horse. Some of it is even true.",
              hours: 2,
              inventory: { rations: -1 },
              meters: { hunger: -10 },
              standing: { id: "silas-crowe", delta: 1 },
              unlockLocation: "homesteader-ruin",
              presentCharacter: "silas-crowe",
              markDialogue: "silas-advice",
            },
          },
          {
            id: "drink",
            label: "Ask what is in the cup",
            check: { trait: "grit", dc: 11 },
            success: {
              text: "Trade whiskey that could strip paint. You see two of him and one of them is useful.",
              hours: 2,
              meters: { warmth: 10, energy: -10, health: -4 },
              standing: { id: "silas-crowe", delta: 1 },
              markDialogue: "silas-advice",
            },
            fail: {
              text: "You cough until your eyes water. Silas laughs until he has to sit down. “That’s the west, boy.”",
              hours: 2,
              meters: { health: -8, energy: -15 },
              markDialogue: "silas-advice",
            },
          },
        ],
      },
    ],
  },
  {
    id: "padre-tomas",
    name: "Padre Tomás",
    art: "/art/people/padre-tomas.jpg",
    home: ["mexican-trail-camp", "south-park-rim", "hot-spring"],
    seasons: ["spring", "summer", "fall"],
    blurb: "Itinerant from the Taos trail. Food, confession, and a letter he wants carried.",
    fallback:
      "The padre blesses the air between you as if it needed it. “Still walking. That is a kind of prayer.”",
    nodes: [
      {
        id: "tomas-letter",
        text: "Padre Tomás has a mule that looks wiser than most men. “I have a letter for a woman in Taos. I cannot go down yet. You look like a man who might live long enough.”",
        choices: [
          {
            id: "take",
            label: "Take the letter",
            outcome: {
              text: "He feeds you first — chile and hard bread that tastes like a town. The letter goes inside your shirt. It is heavier than paper.",
              hours: 2,
              meters: { hunger: 25, thirst: 10 },
              extraAdd: "letter-to-taos",
              standing: { id: "padre-tomas", delta: 2 },
              presentCharacter: "padre-tomas",
              markDialogue: "tomas-letter",
            },
          },
          {
            id: "refuse",
            label: "Refuse — you are not a courier",
            outcome: {
              text: "He nods without offense and still gives you water. “Then live, at least.”",
              hours: 1,
              inventory: { water: 1 },
              standing: { id: "padre-tomas", delta: 0 },
              markDialogue: "tomas-letter",
            },
          },
        ],
      },
    ],
  },
  {
    id: "hennepin",
    name: "Hennepin",
    art: "/art/people/hennepin.jpg",
    home: ["south-pass", "mexican-trail-camp", "abandoned-cabin"],
    seasons: "all",
    blurb: "American Fur remnant. Wants your traps. Offers a safe contract that is not safe.",
    fallback:
      "Hennepin smiles with too many teeth. “The Company still has a use for a man who isn’t particular.”",
    nodes: [
      {
        id: "hennepin-contract",
        text: "Hennepin smells like ink and wet wool. “Sign over the last of your traps. We’ll provision you. You’ll owe us a season. That’s how men stop dying up here.”",
        choices: [
          {
            id: "sign",
            label: "Sign the paper",
            outcome: {
              text: "The paper is real. The provisions are real. The feeling that you have sold a year of your life is also real. He leaves you flour and a look of ownership.",
              hours: 1,
              inventory: { rations: 4, powder: 2 },
              extraAdd: "company-debt",
              standing: { id: "hennepin", delta: 2 },
              presentCharacter: "hennepin",
              markDialogue: "hennepin-contract",
            },
          },
          {
            id: "refuse",
            label: "Tell him to keep his paper",
            check: { trait: "grit", dc: 12 },
            success: {
              text: "He folds the contract slowly. “Pride is a winter coat that doesn’t button.” He leaves you alone, which is what you asked for.",
              hours: 1,
              standing: { id: "hennepin", delta: -2 },
              markDialogue: "hennepin-contract",
            },
            fail: {
              text: "He laughs. You sound hungrier than you meant to. He walks off humming.",
              hours: 1,
              standing: { id: "hennepin", delta: -1 },
              markDialogue: "hennepin-contract",
            },
          },
        ],
      },
    ],
  },
  {
    id: "ned-calhoun",
    name: "Ned Calhoun",
    art: "/art/people/ned-calhoun.jpg",
    home: ["timberline", "creek", "high-camp", "lightning-pine"],
    seasons: "all",
    blurb: "The boy from St. Louis. Lost. Eats your rations. May save you later.",
    fallback:
      "Ned looks at your pack the way a dog looks at a table. “I can carry something. I’m stronger than I look.”",
    nodes: [
      {
        id: "ned-lost",
        text: "A boy in a ruined city coat is crying without sound beside the trail. “I came with an uncle. The uncle is a creek now. I don’t know the names of anything.”",
        choices: [
          {
            id: "feed",
            label: "Give him a ration and your fire",
            outcome: {
              text: "He eats like the food might be taken back. After, he tells you where he saw a cache blaze — and he means to stay near you.",
              hours: 2,
              inventory: { rations: -1 },
              unlockLocation: "cache-deadfall",
              standing: { id: "ned-calhoun", delta: 2 },
              presentCharacter: "ned-calhoun",
              markDialogue: "ned-lost",
            },
          },
          {
            id: "send",
            label: "Point him toward the cabin and walk on",
            outcome: {
              text: "He nods too fast. You do not watch him go. The mountain will or it won’t.",
              hours: 1,
              standing: { id: "ned-calhoun", delta: -2 },
              presentCharacter: null,
              markDialogue: "ned-lost",
            },
          },
        ],
      },
    ],
  },
  {
    id: "white-shell",
    name: "White Shell",
    art: "/art/people/white-shell.jpg",
    home: ["ute-camp", "hot-spring"],
    seasons: ["spring", "summer", "fall"],
    blurb: "Ute woman who knows the spring and who should not be at it.",
    fallback: "White Shell’s hands are busy. She grants you the courtesy of not pretending you are invisible.",
    nodes: [
      {
        id: "shell-spring",
        text: "White Shell is packing mud and herbs at the spring. “This water heals skin. It does not heal stupid. Sit or go.”",
        choices: [
          {
            id: "sit",
            label: "Sit and let her work",
            outcome: {
              text: "She packs a cut you had been ignoring. The heat and the quiet put an hour back into your body.",
              hours: 2,
              meters: { health: 12, warmth: 15 },
              standing: { id: "white-shell", delta: 1 },
              presentCharacter: "white-shell",
              markDialogue: "shell-spring",
            },
          },
          {
            id: "ask",
            label: "Ask what the herbs are",
            check: { trait: "savvy", dc: 14 },
            success: {
              text: "She names two plants you will actually find again. Knowledge that does not come from a Boston book.",
              hours: 1,
              extraAdd: "herb-lore",
              standing: { id: "white-shell", delta: 1 },
              markDialogue: "shell-spring",
            },
            fail: {
              text: "She gives you a look that closes the subject. You sit in steam and ignorance.",
              hours: 1,
              markDialogue: "shell-spring",
            },
          },
        ],
      },
    ],
  },
  {
    id: "nawat",
    name: "Nawat",
    art: "/art/people/nawat.jpg",
    home: ["arapaho-ground", "south-park-rim", "elk-wallow"],
    seasons: ["summer", "fall"],
    blurb: "Arapaho scout. Measures you by how you walk on someone else’s ground.",
    fallback: "Nawat’s eyes do the talking. You are still a question.",
    nodes: [
      {
        id: "nawat-ground",
        text: "Nawat steps out of the grass as if the park made him. “This is not a road. Why are you on it?”",
        choices: [
          {
            id: "honest",
            label: "Say you are trying not to die",
            check: { trait: "savvy", dc: 12 },
            success: {
              text: "He almost laughs. “Then do it somewhere else after you eat.” He shows you a spring the maps do not have.",
              hours: 2,
              inventory: { water: 2 },
              standing: { id: "nawat", delta: 1 },
              presentCharacter: "nawat",
              markDialogue: "nawat-ground",
            },
            fail: {
              text: "Your English sounds like an excuse. He points you back the way you came.",
              hours: 1,
              standing: { id: "nawat", delta: -1 },
              markDialogue: "nawat-ground",
            },
          },
          {
            id: "rifle",
            label: "Keep the rifle in your hands",
            outcome: {
              text: "He is gone before you decide whether that was courage. The grass does not tell you.",
              hours: 1,
              standing: { id: "nawat", delta: -2 },
              presentCharacter: null,
              markDialogue: "nawat-ground",
            },
          },
        ],
      },
    ],
  },
  {
    id: "ramon-salazar",
    name: "Ramón Salazar",
    art: "/art/people/ramon-salazar.jpg",
    home: ["mexican-trail-camp", "south-park-rim"],
    seasons: ["spring", "summer", "fall"],
    blurb: "Nuevomexicano trader. Mules, chile, gossip, and a price for everything.",
    fallback: "Ramón tips a hat that has seen better vice-royalties. “Silver or pelts. I do not eat promises.”",
    nodes: [
      {
        id: "ramon-trade",
        text: "Ramón’s mules are fat in a country that starves men. “I can sell you flour. I can sell you rumors. The rumors are cheaper and sometimes truer.”",
        choices: [
          {
            id: "flour",
            label: "Buy flour with two pelts",
            outcome: {
              text: "He weighs the pelts like a priest. The flour is weevily and still a miracle.",
              hours: 1,
              inventory: { pelts: -2, rations: 3 },
              standing: { id: "ramon-salazar", delta: 1 },
              presentCharacter: "ramon-salazar",
              markDialogue: "ramon-trade",
            },
          },
          {
            id: "rumor",
            label: "Pay one pelt for a rumor",
            outcome: {
              text: "“A man named Dutch is lifting horses off the ruin trail. And the ice cave still holds last autumn’s elk if the bears have not voted.”",
              hours: 1,
              inventory: { pelts: -1 },
              unlockLocation: "talus-ice-cave",
              standing: { id: "ramon-salazar", delta: 1 },
              markDialogue: "ramon-trade",
            },
          },
        ],
      },
    ],
  },
  {
    id: "jean-baptiste",
    name: "Jean-Baptiste Leclair",
    art: "/art/people/jean-baptiste.jpg",
    home: ["beaver-meadow", "creek", "timberline"],
    seasons: ["spring", "fall", "winter"],
    blurb: "Voyageur leftover. Sings to beaver houses. Owes the Company and does not care.",
    fallback: "Jean-Baptiste offers you tobacco that is mostly willow. “Still no sea. Still no sense.”",
    nodes: [
      {
        id: "jb-song",
        text: "You hear him before you see him — a paddling song with no river under it. “The dams are a church,” he says. “I am a bad parishioner.”",
        choices: [
          {
            id: "help",
            label: "Help him pull a drowned trap",
            check: { trait: "hands", dc: 12 },
            success: {
              text: "The trap comes up with a drowned beaver and a finger’s worth of your blood. He splits the meat and the blame.",
              hours: 3,
              inventory: { rations: 2, pelts: 1 },
              meters: { health: -3, energy: -10 },
              standing: { id: "jean-baptiste", delta: 1 },
              presentCharacter: "jean-baptiste",
              markDialogue: "jb-song",
            },
            fail: {
              text: "You go in to the waist. The cold writes its name on your bones. He hauls you out cursing in two languages.",
              hours: 3,
              meters: { warmth: -25, energy: -15 },
              markDialogue: "jb-song",
            },
          },
          {
            id: "leave",
            label: "Leave him to his church",
            outcome: {
              text: "The song follows you a quarter mile and then the wind takes it.",
              hours: 1,
              markDialogue: "jb-song",
            },
          },
        ],
      },
    ],
  },
  {
    id: "martha-keene",
    name: "Martha Keene",
    art: "/art/people/martha-keene.jpg",
    home: ["homesteader-ruin", "abandoned-cabin"],
    seasons: "all",
    blurb: "Neighbor to the cabin claim. Knows which well is poison.",
    fallback: "Martha’s hands are always red from water. “If Eliza sent you, say so. If she didn’t, say that too.”",
    nodes: [
      {
        id: "martha-well",
        text: "Martha Keene is hauling a bucket from a hole you would have drunk from. “Not that one. Sheep died. I buried the smell and it came back.”",
        choices: [
          {
            id: "heed",
            label: "Fill from the other seep she shows you",
            outcome: {
              text: "The water tastes of iron and is still a gift. She accepts no pay but your attention.",
              hours: 1,
              inventory: { water: 2 },
              standing: { id: "martha-keene", delta: 1 },
              presentCharacter: "martha-keene",
              markDialogue: "martha-well",
            },
          },
          {
            id: "doubt",
            label: "Drink from the first well anyway",
            outcome: {
              text: "By night your guts are a war. Martha does not say she told you so. She does not have to.",
              hours: 4,
              meters: { health: -18, thirst: -10, energy: -20 },
              standing: { id: "martha-keene", delta: -1 },
              markDialogue: "martha-well",
            },
          },
        ],
      },
    ],
  },
  {
    id: "dutch-harrow",
    name: "Dutch Harrow",
    art: "/art/people/dutch-harrow.jpg",
    home: ["homesteader-ruin", "cache-deadfall", "south-pass"],
    seasons: "all",
    blurb: "Horse thief. Charm you can see the seams in.",
    fallback: "Dutch grins. “You look like a man who could use a horse he does not own.”",
    nodes: [
      {
        id: "dutch-horse",
        text: "Dutch Harrow has a bay that is not his — you can tell by how the horse looks at him. “I can let you ride as far as the rim. Or you can forget my face.”",
        choices: [
          {
            id: "ride",
            label: "Ride and don’t ask questions",
            outcome: {
              text: "The horse is better company than Dutch. He dumps you at the rim and is gone before gratitude becomes a witness.",
              hours: 2,
              meters: { energy: 10 },
              unlockLocation: "south-park-rim",
              standing: { id: "dutch-harrow", delta: 1 },
              presentCharacter: null,
              markDialogue: "dutch-horse",
            },
          },
          {
            id: "accuse",
            label: "Call him a thief",
            check: { trait: "grit", dc: 13 },
            success: {
              text: "His smile thins. He leaves the horse’s extra saddlebag — jerky and a curse — and rides without you.",
              hours: 1,
              inventory: { rations: 1 },
              standing: { id: "dutch-harrow", delta: -2 },
              startSkirmish: {
                intro: "Dutch decides a witness is a problem he can settle here.",
                foes: [
                  {
                    id: "dutch",
                    name: "Dutch Harrow",
                    hp: 16,
                    maxHp: 16,
                    range: "near",
                    damage: [3, 8],
                    art: "/art/people/dutch-harrow.jpg",
                  },
                ],
              },
              markDialogue: "dutch-horse",
            },
            fail: {
              text: "He laughs it off and you let him, because the pistol is not a joke.",
              hours: 1,
              standing: { id: "dutch-harrow", delta: -1 },
              markDialogue: "dutch-horse",
            },
          },
        ],
      },
    ],
  },
  {
    id: "alejandro-vega",
    name: "Alejandro Vega",
    art: "/art/people/alejandro-vega.jpg",
    home: ["mexican-trail-camp", "talus-ice-cave", "south-pass"],
    seasons: ["spring", "summer"],
    blurb: "Wounded man off the Spanish trail. Needs water more than pride.",
    fallback: "Alejandro’s bandage has been a bandage too long. He still stands when you approach.",
    nodes: [
      {
        id: "vega-wound",
        text: "Alejandro Vega is gray around the mouth. “A rock, a horse, a man who wanted the horse. I need water and a day that does not move.”",
        choices: [
          {
            id: "water",
            label: "Give him water and sit watch",
            outcome: {
              text: "He sleeps like a man who has not. Before dusk he tells you a safe line along the ice cave. He will remember this.",
              hours: 4,
              inventory: { water: -1 },
              unlockLocation: "talus-ice-cave",
              standing: { id: "alejandro-vega", delta: 2 },
              presentCharacter: "alejandro-vega",
              markDialogue: "vega-wound",
            },
          },
          {
            id: "pass",
            label: "Wish him luck and keep your water",
            outcome: {
              text: "He does not curse you. That is worse.",
              hours: 1,
              standing: { id: "alejandro-vega", delta: -2 },
              markDialogue: "vega-wound",
            },
          },
        ],
      },
    ],
  },
  {
    id: "cyrus-pelt",
    name: "Cyrus Pelt",
    art: "/art/people/cyrus-pelt.jpg",
    home: ["south-pass", "mexican-trail-camp"],
    seasons: ["summer", "fall"],
    blurb: "Company clerk with a ledger that outranks mercy.",
    fallback: "Cyrus inks a number you will never see. “Do you have a name the Company would recognize?”",
    nodes: [
      {
        id: "cyrus-debt",
        text: "Cyrus Pelt opens a book as if it were a weapon. “If you signed with Hennepin, you are already late. If you did not, you could be useful.”",
        choices: [
          {
            id: "lie",
            label: "Claim you owe nothing",
            check: { trait: "savvy", dc: 14 },
            success: {
              text: "He believes you, or pretends. He sells you powder at a price that is only slightly theft.",
              hours: 1,
              inventory: { powder: 2, rations: -1 },
              standing: { id: "cyrus-pelt", delta: 1 },
              presentCharacter: "cyrus-pelt",
              markDialogue: "cyrus-debt",
            },
            fail: {
              text: "He writes something you cannot read. “We will speak again when you are hungrier.”",
              hours: 1,
              standing: { id: "cyrus-pelt", delta: -1 },
              markDialogue: "cyrus-debt",
            },
          },
          {
            id: "walk",
            label: "Walk away from the book",
            outcome: {
              text: "Ledgers do not chase men. Men who carry ledgers sometimes do.",
              hours: 1,
              markDialogue: "cyrus-debt",
            },
          },
        ],
      },
    ],
  },
  {
    id: "caleb-briggs",
    name: "Caleb Briggs",
    art: "/art/people/caleb-briggs.jpg",
    home: ["timberline", "burned-timber", "elk-wallow"],
    seasons: "all",
    blurb: "The older trapping brother. Quiet. Counts cartridges out loud.",
    fallback: "Caleb nods once. Amos will do the talking if talking is required.",
    nodes: [
      {
        id: "caleb-meat",
        text: "Caleb Briggs has an elk down and a look that says the work is not done. “Hold a leg or keep walking. I don’t feed spectators.”",
        choices: [
          {
            id: "help",
            label: "Help butcher",
            outcome: {
              text: "Your hands freeze to the work. At the end he gives you a roast that would have been his breakfast.",
              hours: 3,
              inventory: { rations: 2 },
              meters: { energy: -12, warmth: -8 },
              standing: { id: "caleb-briggs", delta: 1 },
              presentCharacter: "caleb-briggs",
              markDialogue: "caleb-meat",
            },
          },
          {
            id: "walk",
            label: "Keep walking",
            outcome: {
              text: "The smell of fresh elk follows you and does not become yours.",
              hours: 1,
              markDialogue: "caleb-meat",
            },
          },
        ],
      },
    ],
  },
  {
    id: "amos-briggs",
    name: "Amos Briggs",
    art: "/art/people/amos-briggs.jpg",
    home: ["timberline", "burned-timber", "elk-wallow"],
    seasons: "all",
    blurb: "The younger brother. Talks enough for two. Believes in luck.",
    fallback: "Amos waves like you are late for a reunion you did not schedule.",
    nodes: [
      {
        id: "amos-luck",
        text: "Amos Briggs wants to show you a “sure” trail through the chute. Caleb, somewhere out of earshot, would not.",
        choices: [
          {
            id: "follow",
            label: "Follow Amos’s shortcut",
            check: { trait: "eye", dc: 13 },
            success: {
              text: "You see the loaded slope before he does and pull him off it. He laughs too loud. You both live. He owes you that laugh.",
              hours: 2,
              standing: { id: "amos-briggs", delta: 2 },
              unlockLocation: "avalanche-chute",
              presentCharacter: "amos-briggs",
              markDialogue: "amos-luck",
            },
            fail: {
              text: "Snow moves. Not the whole chute — just enough to bury your pack and your dignity. Amos is very sorry.",
              hours: 3,
              meters: { warmth: -20, energy: -15, health: -6 },
              inventory: { rations: -1 },
              markDialogue: "amos-luck",
            },
          },
          {
            id: "no",
            label: "Refuse the shortcut",
            outcome: {
              text: "Amos looks briefly like a man who has been refused before. “Caleb said you’d say that.”",
              hours: 1,
              standing: { id: "amos-briggs", delta: 1 },
              markDialogue: "amos-luck",
            },
          },
        ],
      },
    ],
  },
  {
    id: "gray-elk",
    name: "Gray Elk",
    art: "/art/people/gray-elk.jpg",
    home: ["ute-camp", "arapaho-ground"],
    seasons: ["summer", "fall"],
    blurb: "Elder. Speaks when the young men have finished being certain.",
    fallback: "Gray Elk’s silence is not empty. You wait in it or you leave it.",
    nodes: [
      {
        id: "gray-winter",
        text: "Gray Elk sits with a robe that has outlived three winters. “The high camp you chose is a proud place. Pride is cold.”",
        choices: [
          {
            id: "ask",
            label: "Ask where a wiser camp would be",
            outcome: {
              text: "He describes a bench above the beaver meadow you had walked past. Not charity. A correction.",
              hours: 2,
              unlockLocation: "beaver-meadow",
              standing: { id: "gray-elk", delta: 1 },
              presentCharacter: "gray-elk",
              markDialogue: "gray-winter",
            },
          },
          {
            id: "pride",
            label: "Say the high camp is enough",
            outcome: {
              text: "He nods, which is not agreement. “Then keep your fire small.”",
              hours: 1,
              markDialogue: "gray-winter",
            },
          },
        ],
      },
    ],
  },
  {
    id: "hannah-briggs",
    name: "Hannah Briggs",
    art: "/art/people/hannah-briggs.jpg",
    home: ["abandoned-cabin", "homesteader-ruin"],
    seasons: "all",
    blurb: "Midwife. Will stitch a man if he does not waste her thread on pride.",
    fallback: "Hannah wipes her hands. “If you are not bleeding, I have other work.”",
    nodes: [
      {
        id: "hannah-stitch",
        text: "Hannah Briggs looks at your hands like they are a bad job. “I can put you back together. I want firewood and no speeches.”",
        choices: [
          {
            id: "pay",
            label: "Pay in firewood and sit still",
            outcome: {
              text: "She works fast and mean and good. You leave with fewer ways to die this week.",
              hours: 2,
              inventory: { firewood: -2 },
              meters: { health: 18 },
              standing: { id: "hannah-briggs", delta: 1 },
              presentCharacter: "hannah-briggs",
              markDialogue: "hannah-stitch",
            },
          },
          {
            id: "talk",
            label: "Try to talk your way into free care",
            check: { trait: "savvy", dc: 15 },
            success: {
              text: "She snorts, then threads the needle anyway. “You can owe me a birth I will never ask you to attend.”",
              hours: 2,
              meters: { health: 12 },
              standing: { id: "hannah-briggs", delta: 1 },
              markDialogue: "hannah-stitch",
            },
            fail: {
              text: "“Speeches.” She points at the door. The mountain will be your surgeon.",
              hours: 1,
              standing: { id: "hannah-briggs", delta: -1 },
              markDialogue: "hannah-stitch",
            },
          },
        ],
      },
    ],
  },
  {
    id: "little-star",
    name: "Little Star",
    art: "/art/people/little-star.jpg",
    home: ["ute-camp", "elk-wallow"],
    seasons: ["summer", "fall"],
    blurb: "Two Crows’ younger kin. Curious about your rifle and your ignorance.",
    fallback: "Little Star circles you once, like a question that has legs.",
    nodes: [
      {
        id: "star-names",
        text: "Little Star wants the English names for things you barely have names for. She will trade a trail for a word.",
        choices: [
          {
            id: "teach",
            label: "Trade words for a trail",
            outcome: {
              text: "She laughs at “timberline” and shows you a way to the wallows that does not skyline you.",
              hours: 2,
              unlockLocation: "elk-wallow",
              standing: { id: "little-star", delta: 1 },
              presentCharacter: "little-star",
              markDialogue: "star-names",
            },
          },
          {
            id: "gun",
            label: "Let her hold the rifle",
            check: { trait: "savvy", dc: 11 },
            success: {
              text: "She checks the pan like she was born to it and hands it back. Two Crows, if he saw, would have opinions.",
              hours: 1,
              standing: { id: "little-star", delta: 1 },
              markDialogue: "star-names",
            },
            fail: {
              text: "The rifle is heavier than she expected. No harm. Much embarrassment. Yours.",
              hours: 1,
              markDialogue: "star-names",
            },
          },
        ],
      },
    ],
  },
  {
    id: "millicent-voss",
    name: "Millicent Voss",
    art: "/art/people/millicent-voss.jpg",
    home: ["south-park-rim", "mexican-trail-camp"],
    seasons: ["summer", "fall"],
    blurb: "A widow drawing maps no government asked for. Ink-stained and armed.",
    fallback: "Millicent does not look up from the paper until you block her light.",
    nodes: [
      {
        id: "mill-map",
        text: "Millicent Voss has the rim on paper better than it exists in dirt. “I need a man to stand on that knob and not fall off. I can pay in dried apples.”",
        choices: [
          {
            id: "stand",
            label: "Stand on the knob",
            check: { trait: "grit", dc: 12 },
            success: {
              text: "The wind tries to evict you. You stay. The apples are real. So is a copy of a trail she did not have to share.",
              hours: 3,
              inventory: { rations: 1 },
              unlockLocation: "south-pass",
              standing: { id: "millicent-voss", delta: 1 },
              presentCharacter: "millicent-voss",
              markDialogue: "mill-map",
            },
            fail: {
              text: "You crawl back with your dignity in your teeth. She gives you an apple anyway, which is almost pity.",
              hours: 3,
              meters: { energy: -15 },
              inventory: { rations: 1 },
              markDialogue: "mill-map",
            },
          },
          {
            id: "no",
            label: "Decline",
            outcome: {
              text: "She is already drawing the next line. You were a convenience, not a plot.",
              hours: 1,
              markDialogue: "mill-map",
            },
          },
        ],
      },
    ],
  },
  {
    id: "otter-that-waits",
    name: "Otter That Waits",
    art: "/art/people/otter-that-waits.jpg",
    home: ["beaver-meadow", "creek"],
    seasons: ["spring", "summer"],
    blurb: "Watches the dams. Does not like men who think beaver are only money.",
    fallback: "Otter That Waits is already looking at the water, which is the point.",
    nodes: [
      {
        id: "otter-dam",
        text: "Otter That Waits blocks the game trail with nothing but standing there. “If you break a dam for a pelt, the meadow floods the wrong way. Including you.”",
        choices: [
          {
            id: "swear",
            label: "Swear you are only passing",
            outcome: {
              text: "He lets you pass and later you find a fish on a stick where you will camp. Payment for a promise.",
              hours: 1,
              inventory: { rations: 1 },
              standing: { id: "otter-that-waits", delta: 1 },
              presentCharacter: "otter-that-waits",
              markDialogue: "otter-dam",
            },
          },
          {
            id: "trap",
            label: "Say trapping is how you live",
            outcome: {
              text: "He looks at you a long time. “Then live somewhere the water does not remember.”",
              hours: 1,
              standing: { id: "otter-that-waits", delta: -2 },
              markDialogue: "otter-dam",
            },
          },
        ],
      },
    ],
  },
  {
    id: "ygnacio-luna",
    name: "Ygnacio Luna",
    art: "/art/people/ygnacio-luna.jpg",
    home: ["mexican-trail-camp", "wind-saddle"],
    seasons: ["summer", "fall"],
    blurb: "Muleteer. Knows which saddle will kill a mule and which will only ruin a man.",
    fallback: "Ygnacio clicks his tongue at a mule, then at you, ranking the two of you honestly.",
    nodes: [
      {
        id: "ygnacio-saddle",
        text: "Ygnacio Luna shakes his head at the wind saddle. “Not today. Tomorrow if the sky apologizes. I can spare jerky if you wait with us.”",
        choices: [
          {
            id: "wait",
            label: "Wait out the wind with the mules",
            outcome: {
              text: "The mules are better at waiting than you are. You eat, you doze, the wind gets bored.",
              hours: 5,
              inventory: { rations: 1 },
              meters: { energy: 10, warmth: -5 },
              standing: { id: "ygnacio-luna", delta: 1 },
              presentCharacter: "ygnacio-luna",
              markDialogue: "ygnacio-saddle",
            },
          },
          {
            id: "cross",
            label: "Cross anyway",
            check: { trait: "grit", dc: 14 },
            success: {
              text: "You crawl the last hundred yards. Ygnacio watches like a man watching a bet he did not take.",
              hours: 3,
              meters: { warmth: -15, energy: -12 },
              unlockLocation: "wind-saddle",
              markDialogue: "ygnacio-saddle",
            },
            fail: {
              text: "The wind puts you down. You crawl back to the mules with a mouth full of grit. He does not mock you. That is kindness.",
              hours: 3,
              meters: { health: -8, warmth: -20, energy: -15 },
              markDialogue: "ygnacio-saddle",
            },
          },
        ],
      },
    ],
  },
  {
    id: "peggy-dunne",
    name: "Peggy Dunne",
    art: "/art/people/peggy-dunne.jpg",
    home: ["lightning-pine", "high-camp", "cache-deadfall"],
    seasons: "all",
    blurb: "Leaves marks on the lightning pine. Maybe a cache. Maybe a warning.",
    fallback: "Peggy is always arriving from a direction you did not watch.",
    nodes: [
      {
        id: "peggy-blaze",
        text: "Peggy Dunne is recarving a blaze on the split pine. “If you rob my cache I will know your boots. If you add to it I will know your name.”",
        choices: [
          {
            id: "add",
            label: "Leave a ration in the deadfall",
            outcome: {
              text: "She watches you do it. Next week, or some week, the deadfall may remember you.",
              hours: 1,
              inventory: { rations: -1 },
              extraAdd: "peggy-favor",
              standing: { id: "peggy-dunne", delta: 2 },
              presentCharacter: "peggy-dunne",
              markDialogue: "peggy-blaze",
            },
          },
          {
            id: "take",
            label: "Take what is in the cache",
            outcome: {
              text: "A twist of powder and a moldy cake. She sees. Of course she sees.",
              hours: 1,
              inventory: { powder: 1, rations: 1 },
              standing: { id: "peggy-dunne", delta: -3 },
              markDialogue: "peggy-blaze",
            },
          },
        ],
      },
    ],
  },
  {
    id: "frost-on-antler",
    name: "Frost on Antler",
    art: "/art/people/frost-on-antler.jpg",
    home: ["grizzly-basin", "avalanche-chute", "wind-saddle"],
    seasons: ["fall", "winter"],
    blurb: "Hunts the basin when others will not. Speaks little. Leaves tracks like signatures.",
    fallback: "Frost on Antler acknowledges you by not vanishing. That is the whole speech.",
    nodes: [
      {
        id: "frost-basin",
        text: "Frost on Antler holds up a palm: stop. Down in the willow, something large is moving that is not elk.",
        choices: [
          {
            id: "back",
            label: "Back out the way he indicates",
            outcome: {
              text: "You both leave the basin to whatever owns it today. Later he drops a grouse at your feet and is gone.",
              hours: 2,
              inventory: { rations: 1 },
              standing: { id: "frost-on-antler", delta: 1 },
              presentCharacter: null,
              markDialogue: "frost-basin",
            },
          },
          {
            id: "look",
            label: "Look anyway",
            check: { trait: "eye", dc: 13 },
            success: {
              text: "You see the grizzly’s shoulder in the willow and choose life. Frost on Antler’s mouth twitches. Respect, maybe.",
              hours: 2,
              standing: { id: "frost-on-antler", delta: 1 },
              markDialogue: "frost-basin",
            },
            fail: {
              text: "The bear stands. The world becomes simple. You run. He does not run with you, and still you both live.",
              hours: 2,
              meters: { energy: -20, warmth: -10 },
              markDialogue: "frost-basin",
            },
          },
        ],
      },
    ],
  },
];

export const CHARACTER_BY_ID: Record<string, CharacterDef> = Object.fromEntries(
  CHARACTERS.map((c) => [c.id, c]),
);
