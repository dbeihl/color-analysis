# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- This is the captain's personal project on his personal GitHub account `dbeihl`. Every GitHub call passes `GH_TOKEN=$(gh auth token --user dbeihl)` explicitly and never switches the active account, which is the shared work account. Nothing crosses between this repository and any work repository in either direction.
- `DECISIONS.md` is the authoritative record of what version one is. Read it before proposing scope.
- `docs/spec-corrections.md` records which parts of the original source documents are superseded. Anyone who reads the build prompt alone will build the wrong thing in several places.
- Colour is easy to get subtly wrong and hard to notice. Where a result depends on colour space, gamut, white point, or perceptual versus numeric distance, state the choice rather than leaving it implicit, and prefer a test against a known reference value over a result that merely looks right.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
