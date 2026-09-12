# Decisions

Durable record of scope decisions for version one.
Every entry is dated: the first ones were taken before any code was written, and later ones record decisions taken against evidence produced by the shipped product.
Quotes marked "relayed" are the captain's words as relayed through the fleet, not a verbatim transcript.
Where no words of his exist, the reasoning is the fleet's own.

## 1. Version one is manual entry plus the blind colour-comparison test, with no photo measurement

Decided by: the captain.
Date: 2026-09-07.
His words (relayed): "That is the honest scope given the accuracy ceiling and I agree with your reasoning."

Reasoning: the best documented automated accuracy for classifying a face into one of four colour seasons is 0.554, and this tool works with twelve, so it is worse than that.
No dataset is available to this project to check itself against.
The one the research cites is research-use-only and behind a request form, so the accuracy of a measurement pipeline would be not merely uncertain but unmeasured.
"Use a photo" is two features with completely different evidence behind them.
Measuring a person from pixels needs colour-profile handling, image segmentation with a known open defect (the MediaPipe selfie-segmentation category-scramble on iOS Safari with the GPU delegate, issue 6142, still open), illuminant estimation with a per-phone calibration step, and multi-shot consensus.
It buys an input capped near 55%.
Comparing two candidate colours composited beside the same face in the same photograph needs almost none of that, because both colours sit in the same light and the illuminant error largely cancels.
It only needs the photograph to be internally consistent.
The comparison is also what a professional colour analyst actually does, and it is the half the research most strongly endorses.
So version one ships the comparison and defers the measurement.

Forecloses: nothing permanently. Automated selfie-based classification is deferred to version two.

## 2. Comparing the generated capsule against clothes already owned defers to version two

Decided by: the captain.
Date: 2026-09-07.
His words: none beyond the approval.

Reasoning: the source documents themselves call this the largest single scope lever in the set, and cataloguing a wardrobe up front is what makes every existing wardrobe app heavy to use.
Version one produces the target capsule and the shopping list.

Forecloses: nothing structurally. The comparison drops in later without redesign.

## 3. Face shape stays in, off by default, labelled as a rule of thumb rather than a finding

Decided by: the captain.
Date: 2026-09-07.
His words: none beyond the approval.

Reasoning: the seven face-shape categories are a convention rather than a measured taxonomy, face shape is a continuum, and no evidence surfaced that face-shape-based hair or style advice improves any outcome.
It is one of the weakest-evidence features in the whole specification.
It is kept because necklines, collars, eyewear and earring guidance is a real part of what people want, but it does not sit in the sign-up path and its copy must not present it as established.

Forecloses: nothing.

## 4. The Korean tone lens is deferred

Decided by: the captain.
Date: 2026-09-07.
His words: none beyond the approval.

The Korean tone lens is a tone-based classification system used in Korean personal-colour practice.
Reasoning: the tone system is genuinely the better lens for neutral undertones and it maps onto how cosmetics are actually merchandised, but its colour data is proprietary and its numeric coordinates are effectively not publicly available, while the Western twelve-season palette has a clean openly-licensed source.
Version one drives makeup off the Western season and accepts coarser matching for neutral undertones.

Forecloses: nothing permanently.

## 5. Repository is public, version one hosts on GitHub Pages

Decided by: the captain. Final.
Date: 2026-09-07.
His words: "Public on GitHub Pages."

This supersedes an earlier provisional recording in this same entry that had the repository staying private on Cloudflare Pages.
That reading came from a relay that had not yet caught up with a choice the captain had already made on a decision board.
This is his own plain statement and is not another provisional reading.

Reasoning for the timing being in our favour, because he asked for this to be said plainly: the repository held nothing but a README when the choice was made, so publishing its history published almost nothing.
Every commit from here is public from the first one, so there is never a moment where something private has to be scrubbed out of history later.

**This repository is public by deliberate choice, made twice, and everything committed to it is readable by anyone.**
Anyone working in it later needs to know that before they paste anything in.

Build consequence: the build targets a project page path, at `dbeihl.github.io/color-analysis/`, not a user page.
The build configuration itself is not created in this task; only the decision is recorded here.

What this costs, accepted rather than disputed: GitHub Pages cannot send the cross-origin isolation headers, so multi-threaded WebAssembly is unavailable to the deferred photo work without a service-worker workaround.
Its bandwidth allowance is a soft ceiling rather than unmetered.
Both are accepted consequences of his choice.

## 6. Version one ships on the existing hair and eye references, with the repair parked

Decided by: the captain.
Date: 2026-09-09.
His words: paraphrased rather than quoted. He read the provenance audit and told the fleet to store it in this repository and pick the repair up later, because it is not a priority now.

What ships: the hair and eye reference sets already in the code, failing in two different ways. The hair swatches display colours that disagree with the labels they carry. The eye swatches match their labels, but every one of them is a shade of brown taken from a single example iris, so there is no blue, green, grey, hazel or mixed option and one iris stands in for a population.

This is a deliberate decision rather than an oversight. The gap was measured before it was accepted.

The evidence, the two provenance corrections (the hair anchors are eight individual participants rather than category means, and the eye values come from ten clusters of a single example iris rather than a hundred Korean eyes), the exact missing coverage and the sweep results are recorded in [docs/input-swatches.md](docs/input-swatches.md).

## Settled by the research, not open to reinterpretation

- Palette colours are derived from the openly licensed Munsell renotation data, defining each season as a region in Munsell hue/value/chroma space, and are never copied from any commercial colour system. Colours themselves cannot be owned; a curated arrangement may be.
- No image ever leaves the device and the application never holds or transmits the data. The 2026 appellate ruling that helps here turned on possession and control, not on on-device processing as such, so a sync tier would forfeit it.
- No copy anywhere claims to determine a season. Results are the nearest match among twelve designed palette recipes; the recipes are a widely taught convention, not twelve natural kinds of people, and their qualitative design intent is documented in [docs/palette-derivation.md](docs/palette-derivation.md). Score separation is not a probability or confidence band. The blind colour-comparison test is the intended route by which a result is settled against the user's own eyes. The commissioned 2026 colour-seasons research report found no published empirical support for twelve discrete whole-person colour categories or validation that season assignment predicts which colours suit someone.
- No universal colour-emotion mappings are hardcoded. The application learns the individual's own associations.
- The capsule neutral-to-accent ratios are folk heuristics with no derivation and are adjustable defaults, never invariants.
