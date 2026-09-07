# Resolver decisions

`src/resolver.ts` turns one manual entry into a colour season, a ranked palette and a set of warnings.
It scores the person against every committed palette with nearest-swatch OKLab Euclidean distance, then ranks the winning palette against the skin sample with CIEDE2000.
Nothing here estimates accuracy. No threshold below was fitted against labelled people, because no dataset is available to this project to check itself against (`DECISIONS.md`, decision 1).

## Chosen thresholds

Each number in this section was chosen. Each is a rule of thumb rather than a measurement, and none is derived from evidence.

`BOUNDARY_TOLERANCE = 0.005` is how far behind the winner a second season may score and still be offered for comparison, in mean OKLab distance.
The top-two margins recorded across the 36 committed fixtures in `tests/fixtures/resolver-golden.json` run from 0.0002 to 0.021, so this value sits inside the operating range and materially decides who is told they sit on a boundary.

`LOW_CONFIDENCE = 0.25` is where a reported confidence starts carrying the warning that the result is a suggestion.

`contrastLevel` cuts the skin-to-hair value contrast at 20 and 40 CIELAB lightness units.

The ITA depth bands keep the conventional cuts at 55, 41, 28, 10 and -30 degrees.

## Season scoring

A season's score is the mean OKLab distance from each of the three samples to its nearest swatch in that palette.
Nothing else enters it. The declared axes in `seasons.json` are not consulted, and a test pins that by zeroing them and asserting the classification does not move.

That metric leaves a season the winner does not declare as a neighbour inside the tolerance for 12 of the 36 fixtures, and it reports `low-confidence` for 31 of 36.
Twelve palettes of 48 swatches cover CIELAB densely enough that every palette holds something close to any sample, so the scores bunch.
Put plainly: for mid-lightness colouring the classifier on its own barely tells the seasons apart, and version one hands that honest uncertainty to the blind comparison test by design, because a person's own eyes beside their own face are the instrument this tool trusts to settle it.

### Palette-agreement terms, evaluated and rejected

An earlier revision added two terms measuring how far the person sits from statistics derived from each palette: the separation between the measured skin undertone hue angle and the palette's circular mean hue angle, and the gap between the person's mean sample chroma and the palette's mean swatch chroma.
Three variants were measured against that revision during development, on the 36 fixtures and on a larger unselected grid of skin, hair and iris combinations.
One row survives as evidence, because its scorer is the one in the tree and its fixtures are committed:

| variant | conflicting-signals | low-confidence | boundary | family split S/Su/A/W |
| --- | --- | --- | --- | --- |
| no agreement terms, nearest swatch only (shipped) | 12/36 | 31/36 | 17/36 | 9/9/9/9 |

The other rows have been removed rather than repeated.
Those alternative scorers were never committed and the grid had no committed generator, so every number measured against them is a one-time development measurement that was not preserved.
It is recollection, not reproducible evidence, and anyone who wants it must measure again.

The decision does not rest on it. Both terms were removed because each compares two quantities that are not on the same scale.
A palette's mean hue angle is an average over garment colours drawn from around the wheel, and those means run from 54.6 to 311.6 degrees across the twelve palettes, a figure recomputable from `src/knowledge/seasons.json`.
Human skin occupies a narrow warm band by comparison, so the separation between the two is mostly a fixed property of the palette, with only a small part of it responding to the person in front of it.
Chroma has the same defect: a person's mean sample chroma sits below every palette's mean swatch chroma, so the gap ranks palettes by how saturated their garments are rather than measuring the person.
A term whose value is mostly a property of the palette cannot be evidence about a person, and neither term bought a measurable improvement, so both are gone and the score is nearest-swatch distance alone.

`low-confidence` has a separate ceiling, because the reported confidence is a margin divided by the runner-up's absolute score, and any term that widens the margin raises that denominator by about as much.

## The uncertainty contract

`secondary` lists every season within `BOUNDARY_TOLERANCE` of the winner that the winner's own palette declares as a neighbour, so the blind comparison never asks a person to choose between two seasons the knowledge base treats as opposites.
Seasons that score equally are all listed rather than resolved by name order.

A season within the tolerance that the winner does not declare as a neighbour is a contradiction between the score ranking and the declared adjacency ring, so it is never offered for comparison.
It instead sets the reported confidence to zero and raises `conflicting-signals`, because a margin over a season that should not be close carries no information about how sure the answer is.

The `boundary` warning fires whenever any season at all scores inside the tolerance of the winner, whether or not the winner declares it a neighbour, because how close the field is remains true and worth telling regardless of what can be offered.
It makes two separate statements rather than one that overreaches.
It counts every season inside the tolerance, neighbours and non-neighbours alike, and then names the seasons the blind comparison will actually put in front of the person, which is the winner plus its declared neighbours.
When those two counts differ, the difference is exactly the non-adjacent contenders, and `conflicting-signals` is the warning that explains them.
When no season inside the tolerance is a declared neighbour, the second statement says so plainly and that nothing is offered for comparison.
A test recomputes the contender count from `seasons.json` independently of the classifier, asserts the emitted count and the offered list against it, and requires the fixtures to exercise both the equal-count and the differing-count wording.
A second test pins the no-neighbour wording exactly, and a third asserts the warning is present for exactly the fixtures with a rival inside the tolerance.
Three mutations were run against them: counting only the neighbours fails the count assertion, gating the warning on a neighbour existing fails with `monk-3-chestnut-vivid-blue: expected [ 'conflicting-signals', …(1) ] to deeply equal [ 'boundary', …(2) ]`, and claiming the no-neighbour case offers the rivals fails the wording pin.

`confidence.basis` names what actually determined the value: `relative-score-margin` for the gap between the top two palettes, `self-reported-input-confidence` for the certainty the person entered about their own colour readings, and `contradicted-adjacency` when a non-adjacent contender forced the value to zero regardless of either of those.
Neither is a calibrated probability that the season is correct.

## ITA for a negative b*

Skin depth uses `atan2(L* - 50, b*)` rather than `atan((L* - 50) / b*)`.
The two agree on every sample with a positive b*, which is the range the ITA literature works in, and the sRGB gamut also admits skin values with a negative b* that the single-argument form maps to the opposite depth band.

## Near-face ranking direction

`rankPalette` puts the near-face swatches first and orders those by descending CIEDE2000 distance from the person's skin, so the colour least like their own skin leads.
This is a practitioner rule of thumb with no evidential basis: the craft holds that a colour close to skin flattens a face rather than lifting it.
The blind comparison test settles it for a given person, and this ordering only decides what that test shows first.

The rule of thumb is about what sits beside a face, so it is applied to the near-face swatches and nowhere else.
Every remaining swatch keeps the order the derivation script emits, which groups by role: the two metals, then the two denims, then the eight base neutrals, then the eight statements.
That tail does not move when the skin sample changes, and a test pins its complete order against the committed palette.

## Golden fixtures

`tests/fixtures/resolver-golden.json` holds 36 cases covering all twelve seasons and all ten Monk bands.
Skin samples are the Monk Skin Tone scale swatches. Hair and eye samples are natural human hair and iris colours, and a test asserts that none of them coincides with any committed palette swatch, so no case can be won by an exact match with the palette it expects.
The expected seasons are recorded from this implementation as regression pins rather than as ground truth.
Each recorded `margin` is the exact tolerance at which that case starts contending, found by bisection through the public `tolerance` parameter, and a test pins it from both sides: no rival inside `margin - 1e-6`, and a rival inside `margin + 1e-6`.

## Inputs recorded but not yet used

`skin.monkBand`, `hair.naturalLevel` and `hair.greyPercent` are validated and carried as deliberate seams for the later depth-banded makeup and hair-formula phases; version one records them without letting them move the answer.
`ColoringFeatures` carries two measurements in the same position: `undertone.hueAngleDegrees` and `meanChroma` are computed on every call and nothing in the result reads them, since the palette-agreement terms that once did were evaluated and removed.
