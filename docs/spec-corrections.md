# Spec corrections

Anyone who reads the original build prompt, addendum, or research report alone will build the wrong thing in several places.
This file records exactly which parts of those documents are superseded and by what, so version one gets built correctly the first time.
The source documents themselves are not in this repository. This is the reference that stands in for them.

## Corrections

### 1. Palette source

Superseded text: the build prompt asks for at least forty palette entries per season and never says where the colours come from, and schedules that file as the opening move of its first build phase.

Correction: derive the palette from the openly licensed Munsell renotation data, with the derivation documented.

Note: deriving roughly five hundred colours with roles, near-face flags and names is real work that the original build order does not budget for.

### 2. Calibration reference

Superseded text: the addendum recommends a printable grey/white/black card as the primary way to work out the lighting, repeats that recommendation in six places, and its own open-questions list still asks whether to build it.

Correction: a home-printed patch is untrustworthy, because consumer printers, paper optical brighteners and metamerism corrupt it.
The primary method becomes a flash-on/flash-off image pair with ambient subtraction, with a signal-quality gate below which the user is asked to retake, and a purchased grey card as the fallback.

Flag loudly:

- the addendum's camera guidance still says "Do not use flash," which directly contradicts this and must be deleted when the photo path is eventually built.
- the cited method has a second half nobody has carried anywhere: a one-time per-phone calibration to get from that device's colour response to a device-independent one. Without that half it is not the method the paper validated, and no document assigns it an owner, a place in the interface, or a fallback for a phone model with no profile.

This whole correction is deferred material for version two, since version one ships no measurement.

### 3. Colour library

Superseded text: the build prompt names `culori`. A correction in the research says to switch to `colorjs.io`, because the application needs two specific colour-appearance techniques that `culori` lacks.

That reason does not hold as stated. This was checked directly: `colorjs.io`'s chromatic-adaptation support for the newer transforms lives in an optional module whose own documentation says integration is incomplete, and it does not offer the specific perceptually-uniform space the research recommends for scoring.
`culori` does lack those, which is true, but it has OKLab, which the research itself names as an acceptable alternative for the same job.

Decision recorded here as an engineering call: version one stays on `culori` and uses OKLab for person-to-season scoring and CIEDE2000 for fine swatch matching.
Revisit if and when the measurement pipeline lands.
Do not present the library switch as settled research.

### 4. Accuracy ceiling and confidence

Superseded text: the addendum's confidence bands are unchanged, and a correction says only that they "should be recalibrated downward" without supplying numbers.

Correction, sharper version: the 0.554 figure is for four seasons and this tool has twelve, so twelve-class accuracy is necessarily worse.
The recalibration is not shading numbers down.
On a photo-derived result the top confidence band should be unreachable by construction, and the honest default outcome of a photo analysis is two adjacent seasons plus a comparison test.

### 5. Honesty labels

Superseded text: face-shape styling advice and the capsule neutral-to-accent ratios have no evidential basis, yet the ratios are currently written as a hard rejection ("reject palettes that fail this") and as a release-blocking test asserting that every accent pairs with at least three neutrals.
That is the strongest possible encoding of a claim nothing supports.

Correction: the rule warns rather than rejects, and the test asserts that the warning fires rather than that the heuristic holds.

Also record: the one rigorous foundation available for capsule construction is a submodular coverage formulation from the 2018 computer-vision literature, which appears nowhere in the original documents.

### 6. Privacy posture

Superseded text: the build prompt says "No image leaves the device by default," a hedge the correction does not permit, and separately proposes a later sync tier targeting a cloud database.

Correction: both sentences are superseded. A sync tier is the precise event that would forfeit the legal position, because it turned on possession rather than on-device processing.

### 7. Deployment target

Superseded text: the addendum's GitHub Pages deployment guidance, including its base-path instruction, its `404.html` routing workaround, its public-repository assumption, and its advice on avoiding the need for cross-origin isolation.

Correction: version one hosts on Cloudflare Pages from the private repository, per `DECISIONS.md` entry 5.
The site base path is the domain root, ordinary SPA routing works because the host supports rewrites, and cross-origin isolation is available without a service-worker hack.
This decision is provisional pending the captain's confirmation; see `DECISIONS.md` entry 5 for the caveat.

## What was checked in the research, and what did not survive

- Eleven of thirteen citations were verified at source, including the accuracy figure, the calibration paper's quality-gate threshold, the capsule-wardrobe paper's submodularity claim, and the appellate ruling's own words verbatim.
- Two claims did not survive: the colour-library justification above, and an accuracy figure expressed as a colour-difference value credited to a paper that reports no such measure. It reports a chromaticity distance and a classification accuracy instead. The number may be right from elsewhere; as attributed it is unsupported, and it is the number that makes the flash-pair method look decisively better than the alternatives.
- One unverified claim is load-bearing and must be tested before engine work rather than after: the research states plainly that its budget ran out before it could confirm current browser support for reading embedded colour profiles, decoding HEIC images, and requesting a wide-gamut canvas. Every colour value the tool produces sits on top of those assumptions. This needs an afternoon of testing on the actual target devices, not a rebuild later.

## Smaller fixes

- The build prompt recommends reading a reference open-source project that does not exist. The account exists with dozens of repositories and no repository by that name. Drop the reference.
- The climate field is typed as a free string naming two different geographic standards, while the document's own recommendation is a simple three-band selector. Use the three-band selector.
- The lifestyle mix must sum to 1.0 in the type and to 100 points in the interface. Pick one. Percent is the friendlier one to show.
- The capture protocol makes an inner-forearm reading the reference for baseline skin colour, then says to prefer the forearm for depth and the face for warmth, but the input type carries exactly one skin colour value with nowhere to keep the two readings separately and no record of which was preferred for which axis. The type needs both.
- The set's own README names the three source documents by filenames that do not match the actual files, which breaks the one workflow it is written for.
