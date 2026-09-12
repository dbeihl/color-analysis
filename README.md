# color-analysis

A personal colour analysis tool.
It compares candidate colours composited against a photo of your own face, side by side in the same shot, and tells you which one actually suits you better.

What is live today is the manual-entry page: choose the closest published skin, hair and eye references, say how well they matched you, and read back the nearest match among twelve designed palette recipes, with its score separation and palette.
The blind colour-comparison test is the intended next step and is not built yet, so the page says so on every result.
Face shape guidance is still to come as well, and it arrives off by default, labelled as a rule of thumb rather than a finding.
No photo measurement, no wardrobe cataloguing, no Korean tone lens.
See `DECISIONS.md` for the full scope record and reasoning.

The recipes are a widely taught convention, not twelve natural kinds of people. Score separation is not a probability or confidence band.

Read `DECISIONS.md` before proposing scope changes.
Read `docs/spec-corrections.md` before building anything from the original source documents. It records where they're wrong.

It deploys to GitHub Pages as a project page from this public repository, at https://dbeihl.github.io/color-analysis/.

**This repository is public by deliberate choice, made twice. Everything committed to it is readable by anyone.** Do not paste anything here you would not want public.

## Setup

Use Node.js 22.12 or newer (not 23 or 25, which the Vitest test runner does not support) and Python 3.11 through 3.13, then run:

```sh
npm ci
python3 -m venv .venv
.venv/bin/pip install -r scripts/requirements.txt
npm test
```

The palette derivation test runs when the Python environment is present. To regenerate or check the committed palette data, use `npm run derive` or `npm run derive:check` after the same setup.

Stood up 2026-09-07. Personal repository under the dbeihl account, not the Utilicast work account.
