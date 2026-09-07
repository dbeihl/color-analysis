# Resolver decisions

`src/resolver.ts` turns one manual entry into a colour season, a ranked palette and a set of warnings.
It scores the person against every committed palette with nearest-swatch OKLab Euclidean distance plus two palette-agreement terms, then ranks the winning palette against the skin sample with CIEDE2000.
Nothing here estimates accuracy. No threshold below was fitted against labelled people, because no dataset is available to this project to check itself against (`DECISIONS.md`, decision 1).

## Chosen thresholds

Each number in this section was chosen. Each is a rule of thumb rather than a measurement, and none is derived from evidence.

`BOUNDARY_TOLERANCE = 0.005` is how far behind the winner a second season may score and still be offered for comparison, in mean OKLab distance.
Realistic manual entries produce margins between roughly 0.000 and 0.035, so this value sits inside the operating range and materially decides who is told they sit on a boundary.

`LOW_CONFIDENCE = 0.25` is where a reported confidence starts carrying the warning that the result is a suggestion.

`HUE_AGREEMENT = 0.005` and `CHROMA_AGREEMENT = 0.01` weight the two palette-agreement terms described below.
Both were chosen as the largest values that leave all twelve seasons reachable across the 3,300 combinations of Monk skin swatch, natural hair colour and iris colour that generated the fixtures.

`contrastLevel` cuts the skin-to-hair value contrast at 20 and 40 CIELAB lightness units.

The ITA depth bands keep the conventional cuts at 55, 41, 28, 10 and -30 degrees.

## Season scoring

A season's score is the mean OKLab distance from each of the three samples to its nearest swatch in that palette, plus two terms measuring how far the person sits from statistics derived from the palette itself.
The first is the separation between the measured skin undertone hue angle and the palette's circular mean hue angle, as a fraction of the 180 degrees that is the largest separation possible.
The second is the gap between the person's mean sample chroma and the palette's mean swatch chroma, as a fraction of 100 CIELAB chroma units.
The declared axes in `seasons.json` are not consulted, and a test pins that by zeroing them and asserting the classification does not move.

The nearest-swatch term alone put a season the winner does not declare as a neighbour inside the tolerance for 12 of the 36 fixtures and 44.2 percent of the 3,300 combinations, because twelve palettes of 48 swatches cover CIELAB densely enough that every palette holds something close to any sample.
Adding the two agreement terms lowers that to 9 of 36 and 41.5 percent. It does not improve `low-confidence`, which stayed at 32 of 36 against a baseline of 31 and moved from 91.7 to 91.1 percent across the combinations.

That is a real but small gain, and it is worth recording why the ceiling is where it is.
Human skin occupies a narrow hue band: across those 3,300 combinations the measured undertone hue angle spans 48.8 to 89.1 degrees, while palette mean hue angles span 54.6 to 311.6 degrees, so the hue term is close to a fixed per-season offset rather than a discriminator between people.
`low-confidence` is bounded by a different thing again, because the reported confidence is a margin divided by the runner-up's absolute score, and the agreement terms raise that denominator by roughly as much as they widen the margin.

## The uncertainty contract

`secondary` lists every season within `BOUNDARY_TOLERANCE` of the winner that the winner's own palette declares as a neighbour, so the blind comparison never asks a person to choose between two seasons the knowledge base treats as opposites.
Seasons that score equally are all listed rather than resolved by name order.

A season within the tolerance that the winner does not declare as a neighbour is a contradiction between the score ranking and the declared adjacency ring, so it is never offered for comparison.
It instead sets the reported confidence to zero and raises `conflicting-signals`, because a margin over a season that should not be close carries no information about how sure the answer is.

`confidence.basis` names whichever of the two limits actually bound the value: `relative-score-margin` for the gap between the top two palettes, and `self-reported-input-confidence` for the certainty the person entered about their own colour readings.
Neither is a calibrated probability that the season is correct.

## ITA for a negative b*

Skin depth uses `atan2(L* - 50, b*)` rather than `atan((L* - 50) / b*)`.
The two agree on every sample with a positive b*, which is the range the ITA literature works in, and the sRGB gamut also admits skin values with a negative b* that the single-argument form maps to the opposite depth band.

## Near-face ranking direction

`rankPalette` puts the near-face swatches first and orders them by descending CIEDE2000 distance from the person's skin, so the colour least like their own skin leads.
This is a practitioner rule of thumb with no evidential basis: the craft holds that a colour close to skin flattens a face rather than lifting it.
The blind comparison test settles it for a given person, and this ordering only decides what that test shows first.

## Golden fixtures

`tests/fixtures/resolver-golden.json` holds 36 cases covering all twelve seasons and all ten Monk bands.
Skin samples are the Monk Skin Tone scale swatches. Hair and eye samples are natural human hair and iris colours, and a test asserts that none of them coincides with any committed palette swatch, so no case can be won by an exact match with the palette it expects.
The expected seasons are recorded from this implementation as regression pins rather than as ground truth.
Each recorded `margin` is the exact tolerance at which that case starts contending, found by bisection through the public `tolerance` parameter, and a test pins it from both sides: no rival inside `margin - 1e-6`, and a rival inside `margin + 1e-6`.

## Inputs recorded but not yet used

`skin.monkBand`, `hair.naturalLevel` and `hair.greyPercent` are validated and carried as deliberate seams for the later depth-banded makeup and hair-formula phases; version one records them without letting them move the answer.
