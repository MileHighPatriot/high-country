import type { CharacterId, PersonNeed } from "@/lib/game/types";

export type TalkTopic = "weather" | "trail" | "them" | "you" | "meat" | "leave";

export const TOPIC_LABEL: Record<TalkTopic, string> = {
  weather: "Talk about the weather",
  trail: "Ask about the trail",
  them: "Ask what they are doing",
  you: "Tell them how you are keeping",
  meat: "Share or ask about meat",
  leave: "Leave them to it",
};

/** Unique mouth. Two greets each so the same face is not a recording. */
export const GREET: Record<CharacterId, string[]> = {
  "eliza-ward": [
    "Eliza does not waste a hello. “If you are in my door you can work or you can go. Pick.”",
    "She wipes a cup like it offended her. “You again. The stove is not a church.”",
  ],
  "two-crows": [
    "Two Crows watches the park, not you. “You walk loud. The elk already know.”",
    "He nods once. That is the whole greeting. Then he waits to see if you have meat or only weather.",
  ],
  "silas-crowe": [
    "Silas grins with too few teeth. “Sit if you can stand the company. The cup is mean and honest.”",
    "He toasts the empty air. “The mountain is still trying to kill us. Drink to its failure.”",
  ],
  "padre-tomas": [
    "Padre Tomás crosses himself against a sky that has not asked. “Peace, if the pass allows it.”",
    "He looks older than the trail. “I carry names. Do you have one you want kept.”",
  ],
  "hennepin": [
    "Hennepin smiles like a ledger. “A man who lives this high is either independent or behind. Which are you.”",
    "He taps a paper that has outlived better weather. “Company still buys winter. Cheaply, if you are tired.”",
  ],
  "ned-calhoun": [
    "Ned looks like a man who took a wrong turn on purpose. “You seen a blaze I invented? I lost it honest.”",
    "He laughs, then does not. “Don’t follow me. I am not a map.”",
  ],
  "white-shell": [
    "White Shell’s hands are busy with something that will be medicine or supper. “Sit. The spring does not mind you.”",
    "She glances at your feet. “You have been walking like a man arguing with snow.”",
  ],
  nawat: [
    "Nawat does not offer his ground. He lets you stand on it. “Say what you came to say.”",
    "His rifle is not aimed. It does not need to be. “We remember who comes hungry and who comes counting.”",
  ],
  "ramon-salazar": [
    "Ramón hefts a pack that has seen Taos. “Flour, rumor, and the idea of coffee. I sell two of those.”",
    "He squints at your pelts. “The trail down is a rumor. The price is not.”",
  ],
  "jean-baptiste": [
    "Jean-Baptiste hums a line that is almost a country. “You have a face for a chorus. Or a warning.”",
    "He pats the canoe like a horse. “The water still knows French. The beaver do not care.”",
  ],
  "martha-keene": [
    "Martha keeps her well like a child. “Drink if you must. Don’t tell the ruin it is empty.”",
    "She looks past you for weather that is already here. “I buried better years in this dirt.”",
  ],
  "dutch-harrow": [
    "Dutch’s horse has opinions. Dutch has more. “You walking, or you buying a ride you will regret.”",
    "He grins. “I have been honest in three territories. It did not take.”",
  ],
  "alejandro-vega": [
    "Vega holds his side like it might stay. “Water, if you have it. I can pay in a story that is mostly true.”",
    "He nods at the pass. “I have been closer to Taos than this. It did not help.”",
  ],
  "cyrus-pelt": [
    "Cyrus smells like old debt. “You don’t know my name yet. That is a kindness I did not earn.”",
    "He watches your hands. “Men up here keep ledgers in their teeth.”",
  ],
  "caleb-briggs": [
    "Caleb has blood under the nails that is not all his. “Help me hang this or walk around it.”",
    "He jerks his chin at Amos if Amos is a rumor today. “We eat when the work is ugly.”",
  ],
  "amos-briggs": [
    "Amos looks lucky the way thin ice looks. “I found a thing. Or it found me. You coming.”",
    "He grins too fast. “Caleb says I am a fool. Caleb is often right and still hungry.”",
  ],
  "gray-elk": [
    "Gray Elk does not hurry a greeting. “Winter is a teacher. You have not finished the lesson.”",
    "He studies your pack. “Pride is heavy. Meat is heavier. Carry one.”",
  ],
  "hannah-briggs": [
    "Hannah’s needle does not stop. “Sit. If you bleed on the coat I will charge you in wood.”",
    "She looks at you like a seam. “The boys bring meat. You bring news or you bring silence.”",
  ],
  "little-star": [
    "Little Star names a ridge under her breath. “That one has a name you do not know yet. I might sell it.”",
    "She is younger than the rifle she is not holding. “Guns make the country smaller. Names make it larger.”",
  ],
  "millicent-voss": [
    "Millicent has a map that disagrees with the ground. “Stand there. No — there. The rim is lying.”",
    "She does not look up. “If you are not a surveyor you are weather. Weather can wait.”",
  ],
  "otter-that-waits": [
    "Otter That Waits stands where the dams are still working. “The water is a treaty. You trapping it or keeping it.”",
    "He watches the sticks. “Beaver keep their word. Men write theirs on paper that burns.”",
  ],
  "ygnacio-luna": [
    "Ygnacio checks a saddle that has crossed more than you have. “The wind saddle loads. Wait or be a story.”",
    "He offers no hand. “I have buried men who were in a hurry to see South Park.”",
  ],
  "peggy-dunne": [
    "Peggy’s blazes look like a language. “I mark so I can come back. You stealing the marks, or adding.”",
    "She spits, accurately. “The deadfall cache is not a church either.”",
  ],
  "frost-on-antler": [
    "Frost on Antler is more weather than company. “The basin does not want you. I am only telling you first.”",
    "He does not come closer. “Turn around while your feet still obey.”",
  ],
};

export const NEED_ASK: Record<PersonNeed, string[]> = {
  food: [
    "They glance at your bag. Hunger is doing the talking.",
    "“You eating, or just carrying the idea of it.”",
  ],
  warmth: [
    "They stand too close to where a fire would be.",
    "“I would trade news for a coal that lasts.”",
  ],
  trade: [
    "Their pack has a mouth. It wants yours to answer.",
    "“Pelts, powder, flour. I am not particular. I am not free.”",
  ],
  shelter: [
    "They look at whatever roof you have like it might be convinced.",
    "“Wind has been chewing me. A wall would be a kindness.”",
  ],
  news: [
    "They want a name more than a meal.",
    "“Who has come through. Who has not. I collect that.”",
  ],
  company: [
    "They are tired of their own voice and trying not to say so.",
    "“Sit. I will not make it a treaty.”",
  ],
};

export const TOPIC_LINES: Record<TalkTopic, string[]> = {
  weather: [
    "They spit toward the sky. “It will turn. It always turns. That is not comfort.”",
    "“This wind has a name in my country. You would not like the translation.”",
    "They shrug at the light. “Clear is a trick the pass uses.”",
    "“Blizzard or not, you dress for the one that is coming, not the one you like.”",
  ],
  trail: [
    "They draw in the dirt with a stick. “That way lies a lie with a pretty view.”",
    "“The hours printed on your legs are longer than the map.”",
    "They name a bench you have not stood on. “If you see smoke that is not yours, decide before you walk in.”",
    "“South is a rumor of easier country. Rumor is how men die facing the park.”",
  ],
  them: [
    "They tell you just enough. The rest is theirs.",
    "“I am doing the work that keeps me from becoming a story.”",
    "A look like you asked for the deed to their morning.",
    "“Same as yesterday. Survive it in a different order.”",
  ],
  you: [
    "They take your measure and do not flinch. “You look like a person who has not picked a grave yet.”",
    "“Keep your fire. Keep your water. The rest is decoration.”",
    "They nod at your pack. “Heavy is honest. Empty is a speech.”",
    "“If you are starving, say so. I hate theater.”",
  ],
  meat: [
    "The idea of grease sits between you like a third person.",
    "They do not thank you with their mouth. Their shoulders do.",
    "“Meat is a language. You just spoke it.”",
    "They decline with dignity, or accept without making it a hymn.",
  ],
  leave: [
    "They are already looking where you are not.",
    "A nod. The country takes the rest of the sentence.",
    "“Go on. I was not finished being alone.”",
    "They do not watch you leave. That is a kind of respect.",
  ],
};
