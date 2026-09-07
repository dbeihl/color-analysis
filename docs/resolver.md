# Resolver decisions

`src/resolver.ts` turns one manual entry into a colour season, a ranked palette and a set of warnings.
It scores the person against every committed palette with OKLab Euclidean distance, then ranks the winning palette against the skin sample with CIEDE2000.
Nothing here estimates accuracy. No threshold below was fitted against labelled people, because no dataset is available to this project to check itself against (`DECISIONS.md`, decision 1).

## Chosen thresholds

Each number in this section was chosen. Each is a rule of thumb rather than a measurement, and none is derived from evidence.

`BOUNDARY_TOLERANCE = 0.005` is how far behind the winner a second season may score and still be offered for comparison, in mean OKLab distance.
Realistic manual entries produce margins between roughly 0.000 and 0.035, so this value sits inside the operating range and materially decides who is told they sit on a boundary.

`LOW_CONFIDENCE = 0.25` is where a reported confidence starts carrying the warning that the result is a suggestion.

`contrastLevel` cuts the skin-to-hair value contrast at 20 and 40 CIELAB lightness units.

The ITA depth bands keep the conventional cuts at 55, 41, 28, 10 and -30 degrees.

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

## Golden fixtures

`tests/fixtures/resolver-golden.json` holds 36 cases covering all twelve seasons and all ten Monk bands.
Skin samples are the Monk Skin Tone scale swatches. Hair and eye samples are natural human hair and iris colours, and a test asserts that none of them coincides with any committed palette swatch, so no case can be won by an exact match with the palette it expects.
The expected seasons are recorded from this implementation as regression pins rather than as ground truth, and the recorded `margin` is asserted against the boundary behaviour it should produce.

## Inputs recorded but not yet used

`skin.monkBand`, `hair.naturalLevel` and `hair.greyPercent` are validated and carried as deliberate seams for the later depth-banded makeup and hair-formula phases; version one records them without letting them move the answer.
