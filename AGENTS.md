# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- This is the captain's personal project on his personal GitHub account `dbeihl`. Every GitHub call passes `GH_TOKEN=$(gh auth token --user dbeihl)` explicitly and never switches the active account, which is the shared work account. Nothing crosses between this repository and any work repository in either direction.
- **This repository is public by deliberate choice, made twice. Everything committed to it is readable by anyone.** Do not paste anything here you would not want public.
- Every commit made on a branch in this repository must be authored as `dbeihl <51423378+dbeihl@users.noreply.github.com>`. The machine's global git identity is the captain's work one and will silently win unless set locally with `git config user.email` in this checkout, because the identity-switch rule only fires for paths under `~/personal/` and this is not one. A work address committed to a public personal repository is not something that can be quietly undone. The commit identity guard rejects only addresses at the employer's email domain, so a personal address other than the noreply one passes it; set the local config anyway.
- `DECISIONS.md` is the authoritative record of what version one is. Read it before proposing scope.
- `docs/spec-corrections.md` records which parts of the original source documents are superseded. Anyone who reads the build prompt alone will build the wrong thing in several places.
- Colour is easy to get subtly wrong and hard to notice. Where a result depends on colour space, gamut, white point, or perceptual versus numeric distance, state the choice rather than leaving it implicit, and prefer a test against a known reference value over a result that merely looks right.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
