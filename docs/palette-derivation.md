# Palette derivation

These are original samples of declared Munsell regions, intended as a starting point for manual colour comparison.
The numeric source describes colours; it does not validate twelve personal colour categories or the suitability of a colour for a particular person.
The regions, axis positions, garment roles, neighbour relationships and near-face flags are project heuristics that can be challenged and retuned.
No commercial analyst's palette was sampled, digitised or used as a target.
Face-shape guidance is not part of this phase; it arrives with the line-and-face resolver, off by default and labelled a rule of thumb.

## Reproduce and validate

Use Node 22.12 or newer and Python 3.11 through 3.13.
Python is used only for offline generation and provenance tests; the application loads committed JSON and never runs Python.

```sh
npm ci
python3 -m venv .venv
.venv/bin/pip install -r scripts/requirements.txt
.venv/bin/ruff check scripts/
.venv/bin/mypy
npm run derive
npm run derive:check
npm test
npm run build
```

`npm test` generates the entire file twice, compares the bytes with the committed file and proves that an edited colour fails the reproduction check.
It also validates knowledge loading, checks palette statistics and prints the nonblocking neutral-pairing report.
`npm run derive:check` exits nonzero if any output differs, including provenance, roles, ordering or colour coordinates.
Generation is offline after dependency installation, has no random seed or timestamp, and writes UTF-8 JSON with LF line endings and six decimal places for CIELAB channels.
`--output PATH` writes or checks a separate file for experiments without overwriting the committed palette.

## Source and licence

The source is the base [RIT Munsell renotation data](https://www.rit.edu/science/munsell-color-science-lab-educational-resources), using its real-colour subset as distributed in [Colour 0.4.6](https://github.com/colour-science/colour/blob/v0.4.6/colour/notation/datasets/munsell/real.py).
The unmodified distribution is vendored at `scripts/data/real.py` and contains 2,734 rows of Munsell hue, value, chroma and CIE xyY coordinates.
The script checks SHA-256 `e3656c76f164d6e124d2c56a8449274ac3605390862066a5ab12a46a9cfdde1e` before reading it.
The distributor identifies this module as BSD-3-Clause; the full copyright, conditions and disclaimer are retained in [the bundled licence](../public/third-party/colour-LICENSE.txt).
Vite copies that licence into the built site at `third-party/colour-LICENSE.txt` so the generated distribution retains the notice too.

This project uses the original renotation, with its known limitations.
It does not use IEEE DataPort's Munsell Re-renotation: Revised, the `mrr-revised` repository, or their NonCommercial data.
Reproduction does not download a replacement dataset from a moving URL.

## Colour coordinates and metrics

The source module documents Illuminant C and a 0.975 luminance correction for direct use of these xyY records.
The generator multiplies the source Y by `0.975 / 100`, giving relative luminance against a perfect reflecting diffuser.
It uses Colour's `xyY_to_XYZ` and `chromatic_adaptation_VonKries(..., transform="Bradford")` to prepare XYZ under D65, using the CIE 1931 2-degree observer for both white points.
This is the offline source-import step: Culori's built-in XYZ modes cover D50 and D65, so Colour supplies the library implementation of the Illuminant C adaptation.
No conversion or chromatic-adaptation matrix is handwritten in this project.

`scripts/convert-munsell.mjs` then uses [Culori](https://culorijs.org/color-spaces/) to convert D65 XYZ to `lab65` and sRGB.
Every stored Lab value explicitly includes `mode: "lab65"`; Culori's plain `lab` mode means D50 and must not be substituted.
Samples outside sRGB after rounding are discarded, with no clipping, gamut mapping or invented replacements.
Only the Lab value is stored as the application colour; Munsell notation stays beside it as provenance and as its precise name.
Hex may be computed later at render time.

The next phase uses OKLab Euclidean distance for coarse person-to-colour-season scoring and CIEDE2000 for fine swatch-to-swatch matching.
Those metrics have different purposes and are not interchangeable.
This phase contains no classifier or palette resolver.
The audit's mean CIELAB lightness, mean CIELCh D65 chroma and circular hue projection describe palette distributions; none estimates classification accuracy.
`tests/fixtures/colour-reference.json` pins three source rows converted independently using Colour's XYZ-to-Lab implementation, covering a warm light sample, a blue sample and a high-chroma red-purple sample.
The Culori output must agree with these references to four decimal places.

## Declared regions

All intervals include their endpoints.
Each listed hue family includes its dataset steps 2.5, 5, 7.5 and 10.
Warm regions span R, YR, Y, GY and G; stronger warm regions concentrate on YR, Y, GY and G.
Cool regions span G, BG, B, PB, P and RP; stronger cool regions concentrate on G, B, PB and P.
Green is deliberately drawn by both spans because it is the temperature-neutral divider between them, so each colour season samples green at its own value and chroma instead of one side owning the family.
Excluding it from both, as a strict warm/cool split would, would leave every one of the twelve palettes with no green at all.
These choices give each family a direction in hue space while allowing boundary overlap.
The continuous axis positions express qualitative design intent on [-1, 1]; they are not fitted measurements of people.
Value increases toward lightness, chroma increases toward saturation, and hue increases toward warmth.

| Colour season | Dominant | Axes: hue, value, chroma | Core hue families | Munsell value | Core chroma |
|---|---|---|---|---|---|
| Light Spring | value | 0.5, 0.7, -0.2 | R, YR, Y, GY, G | 7–9 | 6–8 |
| True Spring | hue | 1, 0.3, 0.3 | YR, Y, GY, G | 5–7 | 6–10 |
| Bright Spring | chroma | 0.5, 0, 0.8 | R, YR, Y, GY, G | 4–6 | 10–16 |
| Light Summer | value | -0.5, 0.7, -0.2 | G, BG, B, PB, P, RP | 7–9 | 6–8 |
| True Summer | hue | -1, 0.3, 0.3 | G, B, PB, P | 5–7 | 6–10 |
| Soft Summer | chroma | -0.5, 0, -0.7 | G, BG, B, PB, P, RP | 4–6 | 4–8 |
| Soft Autumn | chroma | 0.5, 0, -0.7 | R, YR, Y, GY, G | 4–6 | 4–8 |
| True Autumn | hue | 1, 0, 0.3 | YR, Y, GY, G | 4–6 | 6–10 |
| Deep Autumn | value | 0.5, -0.7, 0.3 | R, YR, Y, GY, G | 2–4 | 6–10 |
| Deep Winter | value | -0.5, -0.7, 0.3 | G, BG, B, PB, P, RP | 2–4 | 6–10 |
| True Winter | hue | -1, -0.3, 0.3 | G, B, PB, P | 3–5 | 6–10 |
| Bright Winter | chroma | -0.5, 0, 0.8 | G, BG, B, PB, P, RP | 4–6 | 10–16 |

Light regions use high values, deep regions low values, soft regions low chroma and bright regions high chroma, subject to the open limitation recorded below for the soft and light pair.
The midrange True Spring and True Summer regions sit above True Autumn and True Winter in value so their palettes remain distinct.
The core regions are joined by the support regions below; every support swatch retains the same value interval as its colour season.
Each colour season serialises this core as `coreRegion`, which describes the core hue families and core chroma rather than the full extent of the palette beside it.
The metal and denim support roles are drawn from outside it deliberately, and the base neutrals and secondary neutrals sit at or below its chroma floor, so `coreRegion` must not be read as the set of every swatch a colour season carries.
These deliberately overlapping regions support comparison across boundaries rather than claiming twelve disjoint natural classes.

## Open limitation: soft and light share a chroma ladder

The soft and light colour seasons are currently generated from an identical chroma ladder of 2, 4, 6 and 8, across base neutrals, secondary neutrals, accents and statements.
Their measured mean CIELAB chroma differs by well under one unit, so the declared chroma axis of -0.7 against -0.2 is not independently supported by the generated data for that pair.
In practice the soft and light palettes are separated by their value interval alone, and the cross-season chroma assertion passes on the incidental margin that value difference produces.
Munsell chroma in this dataset moves in even integers, so there is no step available between 4 and 6 that would separate the two ladders as they currently stand.
Whether the twelve colour seasons should be separated by chroma at all, or by value alone for this pair, is an open decision rather than a settled design, and it is recorded here so the next phase does not read the chroma axis as a property the data pins.

The metal role has the same shape of limitation.
It currently draws from a strict subset of the base-neutral pool, at the same chroma and within the same value interval, so the metal label records a naming convention rather than a colorimetric distinction that the data supports.
Denim carries the same limitation in the six cool colour seasons, where it draws from a strict subset of the secondary-neutral pool at the same chroma and within the same value interval, so the claim that denim is an explicit blue support region holds for the warm colour seasons only.
Whether metal and denim should get their own separable bands is part of this same open decision, and it is left unanswered here for the same reason.

## Sampling and roles

The generator takes 48 distinct dataset rows per colour season.
It sorts eligible rows by hue-circle position (R, YR, Y, GY, G, BG, B, PB, P, RP), then value, then chroma.
For a role requiring n rows from N candidates it takes index `floor(i * (N - 1) / (n - 1))` for i from 0 through n - 1.
This spreads samples through the eligible rows without matching a published palette or optimising against a desired test result.
Already selected rows are excluded from later roles, and generation throws if a role lacks enough candidates.

| Assignment order | Role | Count | Region within the value interval |
|---|---|---|---|
| 1 | metal | 2 | YR/Y for positive hue; B/PB for negative hue; chroma 2 |
| 2 | denim | 2 | B/PB; chroma 4 |
| 3 | base-neutral | 8 | Core hue families; chroma 2 |
| 4 | secondary-neutral | 4 | Core hue families; chroma 4 |
| 5 | accent | 24 | Core hue families; chroma 6 for soft and light, 6–8 for true/deep, 10–12 for bright |
| 6 | statement | 8 | Core hue families; chroma 8 for soft and light, 10 for true/deep, 14–16 for bright |

A metal entry is a flat colour approximation; a Lab triple cannot model gloss, reflectance geometry or a metallic finish.
Denim is an explicit blue support region even for warm palettes.
A neutral here means a low-Munsell-chroma support colour, which can still have a visible tint.
Every colour season draws its secondary neutrals from a strictly lower chroma than its accents, so the two labels stay separable rather than naming whichever rows the picker consumed first.
The soft regions have the least room for that separation, so their statements reach chroma 8 while their accents stay at 6 and their secondary neutrals at 4.
Accents and secondary neutrals have `nearFace: true` as a starting styling suggestion; other roles default to false.
Import-time validation rejects a knowledge file whose `nearFace` disagrees with that rule, so the flag cannot be edited away from its role.
No flag claims a measured effect on a face.
The counts provide data coverage and do not prescribe wardrobe ratios.

Boundary neighbours form a reciprocal ring: Light Spring, True Spring, Bright Spring, Bright Winter, True Winter, Deep Winter, Deep Autumn, True Autumn, Soft Autumn, Soft Summer, True Summer, Light Summer, then back to Light Spring.
The ring places paired light, bright, soft and deep types beside each other and keeps each true type beside its family variants.
It is a navigational convention for the next comparison phase, with no fitted decision thresholds.

## Checks and limits

Import-time Zod validation rejects malformed fields, nonfinite or out-of-gamut Lab values, missing roles, duplicate colours, missing colour seasons and invalid neighbour relationships.
It also rejects a `dominant` label that is not the axis with the largest absolute value in `axes`, and treats a tie between two axes at that maximum as a hard failure rather than picking one, because tied axes do not support a dominant label at all.
The browser entry imports the validated knowledge module before mounting its empty React root.
Tests replace the JSON module with a deliberately malformed fixture to prove import itself rejects it.

Cross-palette tests derive comparisons from the declared axes, with no list of selected pairwise examples.
Every palette with a lower declared value must have lower mean Lab lightness than every palette with a higher value.
Within each family, lower declared chroma must mean lower mean CIELCh D65 chroma.
The family restriction accounts for the different Lab chroma scales reached by different Munsell hues and prevents treating Munsell chroma as a universal Lab distance.
Warmth is the mean circular projection `cos(h - 60 degrees)` of the CIELCh D65 hue angle, so 360-degree wraparound cannot corrupt an arithmetic mean of angles.
Every palette's projected warmth must have the sign of its declared hue axis, putting positive-axis palettes on the warm side of negative-axis palettes.
This projection and its 60-degree pole are explicit audit heuristics, not skin-undertone measurements.
Substitution controls prove the value and chroma checks reject palettes whose colours contradict their metadata, and a separate control that swaps the Light Spring and Light Summer palettes proves the warmth check does too.
Further tests assert that every swatch falls inside its `coreRegion` on hue family, on chroma and on value.
The value interval admits no exceptions, because every role including the support roles is sampled from its colour season's value interval; the hue and chroma checks name four exempt roles between them and have no general escape hatch.
Denim and metal are the named hue exceptions, because they are drawn as support regions from outside the core families, and the chroma check exempts them as well, because their fixed chroma of 2 for metal and 4 for denim sits at or below every core chroma floor.
Base neutrals and secondary neutrals are the named chroma exceptions, because they sit at or below the core chroma floor by design.
Negative controls prove each of these rejects a deliberately corrupted knowledge file rather than passing vacuously.

The printed neutral report counts base neutrals and accents with fewer than three candidate pairings.
For this report only, a candidate pairing means CIEDE2000 at least 10 between the accent and base neutral, as a rough distinction check.
That threshold says nothing established about aesthetic harmony.
Both the threshold and the three-neutral rule are folk heuristics; shortfalls print warnings and never invalidate a knowledge file or fail the suite.
A dedicated control with zero base neutrals proves the warning is emitted without throwing.
