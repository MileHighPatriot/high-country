# High Country

Open-ended survival in the Colorado Rockies, around 1835 — after the beaver boom, before the gold rush. You wintered too high on the Front Range. There is no last day. Seasons cycle. You play until you die.

Read the ground, pick a choice, keep a fire. Hunger, thirst, warmth, energy, and health all run out. Risky acts show an open d20 (Eye, Grit, Savvy, Hands). Violence is a short skirmish, not a dungeon.

## Play

**Live:** [https://milehighpatriot.github.io/high-country/](https://milehighpatriot.github.io/high-country/)

Your run saves in the browser. Death ends it. The title screen keeps your longest days survived.

Locally:

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127). GitHub Pages publishes a static build of the same game.

## What is here

- Twenty-one connected places, from high camp to the South Park rim
- Twenty-four recurring people and a book of one-shot strangers
- About two hundred unique seasonal encounters that do not repeat in a run
- Photoreal location plates, portraits, and weather

No account. No server. No way out except the mountain.

## Grok Build

This repo is set up so a Cursor agent can hand content and engine work to **Grok Build on the terminal** (`grok`), not the app.

On this cloud machine the CLI is installed at `~/.grok/bin/grok` and signed in. A new machine needs `grok login --device-code` (or `XAI_API_KEY`) once. Then:

```bash
grok -p "add ten unique winter encounters to lib/game/content/encounters-winter.ts" --always-approve --max-turns 40
```
