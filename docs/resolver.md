# Resolver decisions

`src/resolver.ts` turns one manual entry into a colour season, a ranked palette and a set of warnings.
It scores the person against every committed palette with nearest-swatch OKLab Euclidean distance, then ranks the winning palette against the skin sample with CIEDE2000.
Nothing here estimates accuracy. No threshold below was fitted against labelled people, because no dataset is available to this project to check itself against (`DECISIONS.md`, decision 1).

## Chosen thresholds

Each number in this section was chosen. Each is a rule of thumb rather than a measurement, and none is derived from evidence.

`BOUNDARY_TOLERANCE = 0.005` is how far behind the winner a second season may score and still be offered for comparison, in mean OKLab distance.
Realistic manual entries produce margins between roughly 0.000 and 0.035, so this value sits inside the operating range and materially decides who is told they sit on a boundary.

`LOW_CONFIDENCE = 0.25` is where a reported confidence starts carrying the warning that the result is a suggestion.

`contrastLevel` cuts the skin-to-hair value contrast at 20 and 40 CIELAB lightness units.

The ITA depth bands keep the conventional cuts at 55, 41, 28, 10 and -30 degrees.

## Season scoring

A season's score is the mean OKLab distance from each of the three samples to its nearest swatch in that palette.
Nothing else enters it. The declared axes in `seasons.json` are not consulted, and a test pins that by zeroing them and asserting the classification does not move.

That metric leaves a season the winner does not declare as a neighbour inside the tolerance for 12 of the 36 fixtures and 44.2 percent of the 3,300 combinations of Monk skin swatch, natural hair colour and iris colour that generated them, and it reports `low-confidence` for 31 of 36.
Twelve palettes of 48 swatches cover CIELAB densely enough that every palette holds something close to any sample, so the scores bunch.
Put plainly: for mid-lightness colouring the classifier on its own barely tells the seasons apart, and version one hands that honest uncertainty to the blind comparison test by design, because a person's own eyes beside their own face are the instrument this tool trusts to settle it.

### Palette-agreement terms, evaluated and rejected

An earlier revision added two terms measuring how far the person sits from statistics derived from each palette: the separation between the measured skin undertone hue angle and the palette's circular mean hue angle, and the gap between the person's mean sample chroma and the palette's mean swatch chroma.
Three variants were then measured against that shipped version on the 36 fixtures, with the unselected 3,300-combination grid alongside as a check that the fixtures were not driving the answer.
Every variant reached all twelve seasons.

| variant | conflicting-signals | low-confidence | boundary | family split S/Su/A/W |
| --- | --- | --- | --- | --- |
| shipped: raw hue angle plus chroma | 9/36 | 32/36 | 15/36 | 10/7/11/8 |
| V1: normalized-position hue plus chroma | 10/36 | 29/36 | 12/36 | 9/10/9/8 |
| V2: no agreement terms, nearest swatch only | 12/36 | 31/36 | 12/36 | 9/9/9/9 |
| V3: chroma agreement alone | 12/36 | 31/36 | 14/36 | 9/11/9/7 |

| variant, 3,300-combination grid | conflicting-signals | low-confidence | family split S/Su/A/W |
| --- | --- | --- | --- |
| shipped: raw hue angle plus chroma | 41.5% | 91.1% | 32.3/8.7/50.8/8.2 |
| V1: normalized-position hue plus chroma | 42.6% | 92.5% | 24.1/20.2/45.8/10.0 |
| V2: no agreement terms, nearest swatch only | 44.2% | 91.7% | 37.9/14.5/37.6/10.1 |
| V3: chroma agreement alone | 43.0% | 92.1% | 26.7/16.9/46.2/10.2 |

V1 places the person inside the observed human undertone range of 48.8 to 89.1 degrees and each palette inside the observed palette mean-hue range of 54.6 to 311.6 degrees, then compares those two positions directly, with no correction applied to either.

None of the three meaningfully separates the seasons.
Across all four rows the whole spread is three cases of 36 on `conflicting-signals`, three on `low-confidence`, and under three percentage points on either metric across the grid, which is the size of the difference one fixture makes.
Whichever variant leads on one measure trails on another, and no variant leads on both sets.

V2 was chosen, so both terms are gone and the score is nearest-swatch distance alone.
The reason is not that V2 won on the numbers, because nothing won: it is that both agreement terms move answers without earning it.
Human skin occupies a narrow hue band, 48.8 to 89.1 degrees, while palette mean hues span 54.6 to 311.6, so the hue term is a per-season constant with a small person-driven swing on top; the same holds for chroma, because a person's mean sample chroma sits below every palette's mean swatch chroma, making the term a ranking of palettes by chroma rather than a measurement of the person.
The shipped raw-hue version reassigned the seasonal family of four of the 36 fixtures on that basis.
A term that changes the answer for a reason unrelated to the person, and buys nothing measurable, is worse than no term.

The grid family splits are worth reading as their own finding: the nearest-swatch metric assigns autumn to 37.6 percent of combinations and summer to 14.5 percent, so the family imbalance belongs to the distance metric and the palettes rather than to anything that was added or removed here.
`low-confidence` has a separate ceiling, because the reported confidence is a margin divided by the runner-up's absolute score, and any term that widens the margin raises that denominator by about as much.

## The uncertainty contract

`secondary` lists every season within `BOUNDARY_TOLERANCE` of the winner that the winner's own palette declares as a neighbour, so the blind comparison never asks a person to choose between two seasons the knowledge base treats as opposites.
Seasons that score equally are all listed rather than resolved by name order.

A season within the tolerance that the winner does not declare as a neighbour is a contradiction between the score ranking and the declared adjacency ring, so it is never offered for comparison.
It instead sets the reported confidence to zero and raises `conflicting-signals`, because a margin over a season that should not be close carries no information about how sure the answer is.

The `boundary` warning counts every season inside the tolerance, neighbours and non-neighbours alike, because its sentence claims to describe everything that close.
Only the neighbours are offered for comparison, and `conflicting-signals` remains the separate warning that says a non-adjacent season is among them.
A test recomputes the contender count from `seasons.json` independently of the classifier and asserts the emitted number matches; counting only the neighbours, which is what an earlier revision did, fails it with `monk-2-dark-red-brown: expected 2 to be 3`, and overcounting by one fails it as well.

`confidence.basis` names whichever of the two limits actually bound the value: `relative-score-margin` for the gap between the top two palettes, and `self-reported-input-confidence` for the certainty the person entered about their own colour readings.
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
