import { createGame } from "@/lib/game/engine";
import { livingTellFromContext, livingTellFromState } from "@/lib/game/living-plate";
import type { GameState, Season, Weather } from "@/lib/game/types";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function tell(partial: {
  season: Season;
  weather: Weather;
  locationId: string;
  campfire?: boolean;
}) {
  return livingTellFromContext({
    season: partial.season,
    weather: partial.weather,
    locationId: partial.locationId,
    campfire: partial.campfire ?? false,
  });
}

function withState(partial: {
  season: Season;
  weather: Weather;
  locationId: string;
  campfire?: boolean;
}): GameState {
  return {
    ...createGame("Tell Test", "coat"),
    season: partial.season,
    weather: partial.weather,
    locationId: partial.locationId,
    campfire: partial.campfire ?? false,
  };
}

const seasons: Season[] = ["spring", "summer", "fall", "winter"];
const fireLocations = ["high-camp", "creek", "timberline", "wind-saddle", "abandoned-cabin"];

assert(
  tell({ season: "winter", weather: "clear", locationId: "high-camp" }) === "snow",
  "high-camp winter, no fire → snow",
);
assert(
  livingTellFromState(withState({ season: "winter", weather: "clear", locationId: "high-camp" })) === "snow",
  "fromState high-camp winter, no fire → snow",
);
console.log("high-camp winter no fire", "snow");

for (const locationId of fireLocations) {
  for (const season of seasons) {
    assert(
      tell({ season, weather: "clear", locationId, campfire: true }) === "ember",
      `${locationId} ${season} clear + fire → ember`,
    );
    assert(
      tell({ season, weather: "wind", locationId, campfire: true }) === "ember",
      `${locationId} ${season} wind + fire → ember`,
    );
    assert(
      tell({ season, weather: "storm", locationId, campfire: true }) === "ember",
      `${locationId} ${season} storm + fire → ember`,
    );
    assert(
      tell({ season, weather: "snow", locationId, campfire: true }) === "snow",
      `${locationId} ${season} snow + fire stays snow`,
    );
    assert(
      tell({ season, weather: "blizzard", locationId, campfire: true }) === "snow",
      `${locationId} ${season} blizzard + fire stays snow`,
    );
  }
}
assert(
  livingTellFromState(withState({ season: "summer", weather: "clear", locationId: "creek", campfire: true })) ===
    "ember",
  "fromState creek summer fire → ember",
);
assert(
  livingTellFromState(
    withState({ season: "summer", weather: "blizzard", locationId: "high-camp", campfire: true }),
  ) === "snow",
  "fromState high-camp blizzard fire stays snow",
);
console.log("campfire ember unless snow/blizzard");

for (const locationId of fireLocations) {
  for (const season of seasons) {
    assert(
      tell({ season, weather: "snow", locationId }) === "snow",
      `${locationId} ${season} snow weather → snow`,
    );
    assert(
      tell({ season, weather: "blizzard", locationId }) === "snow",
      `${locationId} ${season} blizzard → snow`,
    );
  }
}
console.log("blizzard or snow weather", "snow");

assert(
  tell({ season: "summer", weather: "clear", locationId: "timberline" }) === "wind",
  "timberline summer, clear, no fire → wind",
);
assert(
  tell({ season: "summer", weather: "clear", locationId: "wind-saddle" }) === "wind",
  "wind-saddle summer, clear, no fire → wind",
);
assert(
  livingTellFromState(withState({ season: "summer", weather: "clear", locationId: "timberline" })) === "wind",
  "fromState timberline summer → wind",
);
console.log("timberline / wind-saddle summer clear", "wind");

assert(
  tell({ season: "spring", weather: "clear", locationId: "creek" }) === "water",
  "creek spring, clear, no fire → water",
);
assert(
  tell({ season: "summer", weather: "clear", locationId: "creek" }) === "water",
  "creek summer, clear, no fire → water",
);
assert(
  livingTellFromState(withState({ season: "spring", weather: "clear", locationId: "creek" })) === "water",
  "fromState creek spring → water",
);
console.log("creek spring/summer clear", "water");

assert(
  tell({ season: "summer", weather: "clear", locationId: "high-camp" }) === "air",
  "high-camp summer, clear, no fire → air",
);
assert(
  livingTellFromState(withState({ season: "summer", weather: "clear", locationId: "high-camp" })) === "air",
  "fromState high-camp summer → air",
);
console.log("high-camp summer clear", "air");

const baseline = tell({ season: "summer", weather: "clear", locationId: "high-camp" });
assert(baseline === "air", "baseline high-camp summer clear is air");
const seasonSwitch = tell({ season: "winter", weather: "clear", locationId: "high-camp" });
assert(seasonSwitch === "snow", "season switch winter → snow");
assert(seasonSwitch !== baseline, "switching season changes the tell");
const weatherSwitch = tell({ season: "summer", weather: "blizzard", locationId: "high-camp" });
assert(weatherSwitch === "snow", "weather switch blizzard → snow");
assert(weatherSwitch !== baseline, "switching weather changes the tell");
const creekSwitch = tell({ season: "summer", weather: "clear", locationId: "creek" });
assert(creekSwitch === "water", "location switch creek → water");
assert(creekSwitch !== baseline, "switching location changes the tell");
const timberSwitch = tell({ season: "summer", weather: "clear", locationId: "timberline" });
assert(timberSwitch === "wind", "location switch timberline → wind");
assert(timberSwitch !== baseline, "switching location to timberline changes the tell");

let s = withState({ season: "summer", weather: "clear", locationId: "high-camp" });
assert(livingTellFromState(s) === "air", "fromState baseline air");
s = { ...s, season: "winter" };
assert(livingTellFromState(s) === "snow", "fromState season switch → snow");
s = { ...s, season: "summer", weather: "snow" };
assert(livingTellFromState(s) === "snow", "fromState weather switch → snow");
s = { ...s, weather: "clear", locationId: "creek" };
assert(livingTellFromState(s) === "water", "fromState location switch → water");
console.log("switching season, weather, or location changes the tell");

console.log("ok");
