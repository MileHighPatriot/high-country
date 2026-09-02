import type { LocationDef } from "@/lib/game/types";

export const LOCATIONS: LocationDef[] = [
  {
    id: "high-camp",
    name: "High Camp",
    art: "/art/locations/high-camp.jpg",
    blurb:
      "Your lean-to on a wind-scoured bench of lodgepole. The Front Range hangs over it like a wall. This is home only because you have nothing else.",
    tags: ["shelter", "wood"],
    connections: [
      { to: "creek", hours: 2, trailName: "the melt path down to water" },
      { to: "timberline", hours: 2, trailName: "the timberline switchback" },
      { to: "lightning-pine", hours: 3, trailName: "a goat trail toward a split snag" },
    ],
  },
  {
    id: "creek",
    name: "Frozen Creek",
    art: "/art/locations/creek.jpg",
    blurb:
      "A black-water creek that remembers winter. In thaw it runs loud. In January it is a plate of glass you can die on.",
    tags: ["water", "game"],
    connections: [
      { to: "high-camp", hours: 2, trailName: "back up to the lean-to" },
      { to: "beaver-meadow", hours: 3, trailName: "downstream through willows" },
      { to: "frozen-fall", hours: 3, trailName: "upstream toward the ice fall" },
    ],
  },
  {
    id: "timberline",
    name: "Timberline",
    art: "/art/locations/timberline.jpg",
    blurb:
      "Where the trees give up. Krummholz like clenched fists. Firewood if you have the hours. Easy to walk in a circle and call it a journey.",
    tags: ["wood", "game"],
    connections: [
      { to: "high-camp", hours: 2, trailName: "down to high camp" },
      { to: "burned-timber", hours: 3, trailName: "into the old burn" },
      { to: "elk-wallow", hours: 3, trailName: "a game trail toward wallows" },
      { to: "wind-saddle", hours: 4, trailName: "the wind-scoured saddle" },
      { to: "abandoned-cabin", hours: 3, trailName: "a wagon rut that dies in the trees" },
    ],
  },
  {
    id: "ute-camp",
    name: "Ute Hunting Camp",
    art: "/art/locations/ute-camp.jpg",
    blurb:
      "Hide lodges in a sheltered park when the band is here. In deep winter the rings of stone are all that remain, and the silence is a kind of answer.",
    tags: ["trade", "shelter"],
    connections: [
      { to: "elk-wallow", hours: 2, trailName: "the meat trail" },
      { to: "arapaho-ground", hours: 4, trailName: "across the park to Arapaho ground" },
      { to: "beaver-meadow", hours: 3, trailName: "down to the beaver works" },
    ],
  },
  {
    id: "abandoned-cabin",
    name: "Abandoned Cabin",
    art: "/art/locations/abandoned-cabin.jpg",
    blurb:
      "Peeled-log walls, a stove that still draws if you treat it right. Someone claimed this. Someone may still.",
    tags: ["shelter"],
    connections: [
      { to: "timberline", hours: 3, trailName: "back to timberline" },
      { to: "homesteader-ruin", hours: 3, trailName: "a fenceline gone to rot" },
      { to: "cache-deadfall", hours: 2, trailName: "a blazed tree toward a cache" },
    ],
  },
  {
    id: "south-pass",
    name: "South Pass Overlook",
    art: "/art/locations/south-pass.jpg",
    blurb:
      "You can see the idea of the world from here: a pale suggestion of the trail toward Taos. The pass does not care that you are looking.",
    tags: [],
    connections: [
      { to: "wind-saddle", hours: 3, trailName: "back through the saddle" },
      { to: "south-park-rim", hours: 4, trailName: "the rim toward South Park" },
    ],
  },
  {
    id: "beaver-meadow",
    name: "Beaver Meadow",
    art: "/art/locations/beaver-meadow.jpg",
    blurb:
      "Drowned timber and a pond the color of tea. Plews were a fortune here ten years ago. The dams are still working. The money is not.",
    tags: ["water", "game"],
    connections: [
      { to: "creek", hours: 3, trailName: "upstream to the creek" },
      { to: "ute-camp", hours: 3, trailName: "the lodge trail" },
      { to: "hot-spring", hours: 3, trailName: "a sulfur smell on the wind" },
    ],
  },
  {
    id: "burned-timber",
    name: "Burned Timber",
    art: "/art/locations/burned-timber.jpg",
    blurb:
      "A fire ran through here some summer past. Black spars, fireweed in season, charcoal that will light if you are desperate enough to taste it.",
    tags: ["wood"],
    connections: [
      { to: "timberline", hours: 3, trailName: "out of the burn" },
      { to: "avalanche-chute", hours: 3, trailName: "toward the white chute" },
      { to: "lightning-pine", hours: 2, trailName: "to the split pine" },
    ],
  },
  {
    id: "avalanche-chute",
    name: "Avalanche Chute",
    art: "/art/locations/avalanche-chute.jpg",
    blurb:
      "A raw stripe down the mountain. In winter it is a loaded gun. In summer it is scree and smashed trees and a shortcut if you are a fool.",
    tags: [],
    connections: [
      { to: "burned-timber", hours: 3, trailName: "down into the burn" },
      { to: "wind-saddle", hours: 3, trailName: "up to the saddle" },
      { to: "grizzly-basin", hours: 4, trailName: "a basin that holds afternoon shadow" },
    ],
  },
  {
    id: "hot-spring",
    name: "Hot Spring",
    art: "/art/locations/hot-spring.jpg",
    blurb:
      "Mineral water breathing steam even in January. The stones are slick. The heat is a kindness that will make you stupid if you sleep in it.",
    tags: ["water", "shelter"],
    connections: [
      { to: "beaver-meadow", hours: 3, trailName: "back through the meadow" },
      { to: "talus-ice-cave", hours: 3, trailName: "into the talus" },
    ],
  },
  {
    id: "elk-wallow",
    name: "Elk Wallow",
    art: "/art/locations/elk-wallow.jpg",
    blurb:
      "Mud and hair and the sweet rot of a place animals trust. Tracks tell you more than most men will.",
    tags: ["game", "water"],
    connections: [
      { to: "timberline", hours: 3, trailName: "up to timberline" },
      { to: "ute-camp", hours: 2, trailName: "toward the hunting camp" },
      { to: "grizzly-basin", hours: 3, trailName: "the dark basin" },
    ],
  },
  {
    id: "wind-saddle",
    name: "Wind Saddle",
    art: "/art/locations/wind-saddle.jpg",
    blurb:
      "Nothing grows higher than your knee. The wind has opinions. Crossing it in a blizzard is how stories end.",
    tags: [],
    connections: [
      { to: "timberline", hours: 4, trailName: "down to timberline" },
      { to: "south-pass", hours: 3, trailName: "the overlook trail" },
      { to: "avalanche-chute", hours: 3, trailName: "the chute" },
    ],
  },
  {
    id: "frozen-fall",
    name: "Frozen Fall",
    art: "/art/locations/frozen-fall.jpg",
    blurb:
      "A waterfall that spends half the year as a pillar. In spring it calved ice the size of oxen. You can hear it work even when you cannot see the water.",
    tags: ["water"],
    connections: [
      { to: "creek", hours: 3, trailName: "down the creek" },
      { to: "talus-ice-cave", hours: 2, trailName: "behind the ice into talus" },
    ],
  },
  {
    id: "lightning-pine",
    name: "Lightning Pine",
    art: "/art/locations/lightning-pine.jpg",
    blurb:
      "A ponderosa split to the root and still standing. Travelers blaze it. Some leave things. Some take them.",
    tags: ["wood"],
    connections: [
      { to: "high-camp", hours: 3, trailName: "the goat trail home" },
      { to: "burned-timber", hours: 2, trailName: "into the burn" },
      { to: "cache-deadfall", hours: 2, trailName: "a deadfall cache" },
    ],
  },
  {
    id: "mexican-trail-camp",
    name: "Mexican Trail Camp",
    art: "/art/locations/mexican-trail-camp.jpg",
    blurb:
      "A seasonal camp on the old Taos trace: cart ruts, a stone ring, the ghost of chile and mule. People in summer. Wind in winter.",
    tags: ["trade", "shelter"],
    connections: [
      { to: "south-park-rim", hours: 3, trailName: "up to the rim" },
      { to: "homesteader-ruin", hours: 3, trailName: "toward the ruin" },
    ],
  },
  {
    id: "arapaho-ground",
    name: "Arapaho Hunting Ground",
    art: "/art/locations/arapaho-ground.jpg",
    blurb:
      "Open park and distant lodges when the season is right. You are a guest here whether you know it or not.",
    tags: ["game", "trade"],
    connections: [
      { to: "ute-camp", hours: 4, trailName: "west toward the Ute camp" },
      { to: "south-park-rim", hours: 4, trailName: "south to the rim" },
    ],
  },
  {
    id: "cache-deadfall",
    name: "Cache Deadfall",
    art: "/art/locations/cache-deadfall.jpg",
    blurb:
      "A sprung deadfall and a hole that has been dug more than once. Someone believed this ground would keep a secret.",
    tags: [],
    connections: [
      { to: "abandoned-cabin", hours: 2, trailName: "to the cabin" },
      { to: "lightning-pine", hours: 2, trailName: "to the split pine" },
    ],
  },
  {
    id: "talus-ice-cave",
    name: "Talus Ice Cave",
    art: "/art/locations/talus-ice-cave.jpg",
    blurb:
      "A throat of rock that holds last year’s ice. Cold as a root cellar. You can cache meat here. You can also not come out.",
    tags: ["shelter"],
    connections: [
      { to: "hot-spring", hours: 3, trailName: "out to the spring" },
      { to: "frozen-fall", hours: 2, trailName: "to the fall" },
      { to: "grizzly-basin", hours: 3, trailName: "the basin mouth" },
    ],
  },
  {
    id: "homesteader-ruin",
    name: "Homesteader Ruin",
    art: "/art/locations/homesteader-ruin.jpg",
    blurb:
      "A foundation and a chimney that outlived the people. A child’s shoe in the weeds if you look too long.",
    tags: ["shelter"],
    connections: [
      { to: "abandoned-cabin", hours: 3, trailName: "the fenceline to the cabin" },
      { to: "mexican-trail-camp", hours: 3, trailName: "the Taos trace" },
    ],
  },
  {
    id: "grizzly-basin",
    name: "Grizzly Basin",
    art: "/art/locations/grizzly-basin.jpg",
    blurb:
      "A hanging basin of willow and old snow. The bears come through in berry months. In winter it is a white bowl that swallows sound.",
    tags: ["game"],
    connections: [
      { to: "avalanche-chute", hours: 4, trailName: "the chute" },
      { to: "elk-wallow", hours: 3, trailName: "to the wallows" },
      { to: "talus-ice-cave", hours: 3, trailName: "into the talus" },
    ],
  },
  {
    id: "south-park-rim",
    name: "South Park Rim",
    art: "/art/locations/south-park-rim.jpg",
    blurb:
      "The park opens like a rumor of easier country. Antelope weather. You can see weather coming for half a day.",
    tags: ["game"],
    connections: [
      { to: "south-pass", hours: 4, trailName: "back to the overlook" },
      { to: "mexican-trail-camp", hours: 3, trailName: "down to the trail camp" },
      { to: "arapaho-ground", hours: 4, trailName: "north along the park edge" },
    ],
  },
];

export const LOCATION_BY_ID: Record<string, LocationDef> = Object.fromEntries(
  LOCATIONS.map((l) => [l.id, l]),
);
