# Decisions

Durable record of scope decisions for version one, made before any code was written.
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
Measuring a person from pixels needs colour-profile handling, image segmentation with a known open iOS defect, illuminant estimation with a per-phone calibration step, and multi-shot consensus, and it buys an input capped near 55%.
Comparing two candidate colours composited beside the same face in the same photograph needs almost none of that, because both colours sit in the same light and the illuminant error largely cancels.
It only needs the photograph to be internally consistent.
The comparison is also what a professional colour analyst actually does, and it is the half the research most strongly endorses.
So version one ships the comparison and defers the measurement.

Forecloses: the "just take a selfie and get an answer" moment, until version two.

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

## 4. The Korean tone lens defers

Decided by: the captain.
Date: 2026-09-07.
His words: none beyond the approval.

Reasoning: the tone system is genuinely the better lens for neutral undertones and it maps onto how cosmetics are actually merchandised, but its colour data is proprietary and its numeric coordinates are effectively not publicly available, while the Western twelve-season palette has a clean openly-licensed source.
Version one drives makeup off the Western season and accepts coarser matching for neutral undertones.

Forecloses: nothing permanently.

## 5. OPEN — the captain's call, not yet made: repository visibility and where version one is hosted

Free GitHub Pages hosting requires a public repository.
The repository is private today.
The captain said deliberately that it should be private.
Turning a private repository public exposes its whole history in a way that making it private again does not undo.

Options on the table:

- keep it private and pay for hosting
- keep it private and host free elsewhere, such as Cloudflare Pages or Netlify, which can also send response headers GitHub Pages cannot, removing a known ceiling later
- keep it private with no hosting yet and run it locally
- make it public on free GitHub hosting

Nothing is being designed around this while it stands open.
What waits on it, specifically: the deployment workflow, the site base path in the build configuration, and the routing choice between a hash router and a copied `404.html`.
Everything else in version one proceeds.

## Settled by the research, not open to reinterpretation

- Palette colours are derived from the openly licensed Munsell renotation data, defining each season as a region in Munsell hue/value/chroma space, and are never copied from any commercial colour system. Colours themselves cannot be owned; a curated arrangement may be.
- No image ever leaves the device and the application never holds or transmits the data. The 2026 appellate ruling that helps here turned on possession and control, not on on-device processing as such, so a sync tier would forfeit it.
- No copy anywhere claims to determine a season. Results are probabilistic, confidence-banded, and tested against the user's own eyes.
- No universal colour-emotion mappings are hardcoded. The application learns the individual's own associations.
- The capsule neutral-to-accent ratios are folk heuristics with no derivation and are adjustable defaults, never invariants.
