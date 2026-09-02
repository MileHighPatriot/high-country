<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Grok Build (terminal)

MileHigh uses Grok Build as the **`grok` CLI in the terminal**, not the desktop app and not a Cursor Task stand-in.

- Binary: `$HOME/.grok/bin/grok` (already on PATH in `~/.bashrc`).
- Auth lives in `~/.grok/auth.json` on this machine. Do not commit it.
- When they ask to hand work to Grok Build, run from `/workspace`:

```bash
grok -p "<task>" --always-approve --max-turns 40
```

Write files in-repo. Do not silently do that job yourself unless `grok` is unsigned-in; then say so and give them a `grok login --device-code` URL.
