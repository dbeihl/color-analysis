# Input swatches

The interface turns recognisable colour choices into the `ColoringInput` that `resolveColoring` already accepts. It does not measure a person, and changing this translation does not change the resolver, palettes, or scoring.

## Sources

The ten skin choices are the published Monk Skin Tone (MST) sRGB reference values: `#f6ede4`, `#f3e7db`, `#f7ead0`, `#eadaba`, `#d7bd96`, `#a07e56`, `#825c43`, `#604134`, `#3a312a`, and `#292420`, in order from MST 1 to MST 10. Google describes the scale and its MST-E reference dataset in [its announcement](https://blog.google/company-news/outreach-and-initiatives/diversity/why-inclusive-sets-of-images-help-us-make-better-products/); the exact public sRGB values are reproduced in Figure 6 of [Lee et al., ICLR 2026](https://openreview.net/pdf/4b1c21b0717fa587995085ca3165b24c23a4afa8.pdf).

### Existing hair values, audited 2026-09-09

[Bohnert, Vogt and Weinmann (1998), Table 1](https://doi.org/10.1007/s001940050061) reports each person's mean of five measurements at the back of the head. Participants: 17 Caucasian adults, 22–56, with unbleached, undyed hair. An MCS 400 spectrophotometer used a halogen lamp, 45°/45° geometry, a 4 mm spot and pressed barium sulfate as white reference. Lab white and observer are unspecified. [Author-hosted full text](https://www.researchgate.net/publication/226846016_Farbmetrische_Untersuchungen_der_menschlichen_Kopfhaare).

| Current picker label | Participant | Published L*, a*, b* | Source description |
|---|---:|---|---|
| Black | 2 | 11.50, 4.08, −0.19 | Black |
| Dark brown | 4 | 14.55, 2.52, 3.66 | Dark brown mixed with grey |
| Medium brown | 9 | 18.58, 4.02, 6.75 | Medium brown |
| Light brown | 12 | 24.87, 3.21, 7.38 | Light brown |
| Dark blond | 14 | 25.84, 4.22, 5.98 | Dark blond |
| Blond | 15 | 42.06, 5.28, 12.70 | Blond |
| Strawberry blond | 16 | 37.80, 7.71, 17.09 | Red-blond |
| Red | 17 | 22.49, 9.60, 12.13 | Red |

Correction to what this project claimed: these eight anchors were shipped as if they were colours for the eight labels. They are eight individual people out of the study's seventeen participants, each row one person's own measurement, and they are not category means. Their displayed colours disagree with their labels. No appearance conversion is provided; the current D65 assumption remains unvalidated.

### Existing eye values, audited 2026-09-09

Correction to what this project claimed: the repository described these values as coming from a hundred Korean eyes. They are Table 1 of [Jang et al. (2018)](https://doi.org/10.4258/hir.2018.24.3.227), which is ten representative colour clusters extracted from **one example iris**. The project named eight of those ten clusters and shipped them as the eye references. They are not population means and they are not a sample of a hundred eyes.

| Current picker label | Table row | Published R, G, B | Stored sRGB |
|---|---:|---|---|
| Near-black brown | 2 | 27, 18, 11 | #1b120b |
| Dark brown | 4 | 40, 27, 18 | #281b12 |
| Brown | 5 | 57, 38, 26 | #39261a |
| Warm brown | 6 | 81, 48, 32 | #513020 |
| Golden brown | 7 | 123, 74, 47 | #7b4a2f |
| Light brown | 8 | 146, 94, 66 | #925e42 |
| Chestnut | 9 | 104, 59, 34 | #683b22 |
| Muted brown | 10 | 98, 74, 70 | #624a46 |

The wider study analysed 100 valid Korean iris photographs from 145 ophthalmology patients, which is where the hundred-eye claim came from. The shipped values come from the single example iris of Table 1 rather than from a sample across that cohort. Capture used a BQ-900 slit lamp about 10 cm away in a dark environment; JPEG RGB was assumed to be sRGB. The representative-colour method excluded L* ≥ 50 highlights. It lacks both non-brown coverage and any demonstrated appearance calibration to MST.

## Colour-space path

For skin and eye references, the value stored in `src/input-swatches.ts` is the source sRGB hex. Culori converts it from sRGB D65 to `lab65` for the resolver, and converts Lab back to sRGB to paint a swatch when needed. Hair arrives as the published CIELAB measurement described above, is treated as `lab65` for the resolver, and is converted with Culori to sRGB for display. The source-to-Lab test pins MST 1 to `L*=94.2109`, `a*=1.5031`, and `b*=5.4301`, and a round trip returns `#f6ede4`; these are the independent reference values already committed in the resolver fixtures.

## Inputs the resolver currently records only

Natural hair level and grey percentage are passed through exactly as selected. `naturalLevel` orders the eight hair references by their own measured lightness and is not a colorist level scale, so it should not be read as one; `tests/input-swatches.test.ts` pins that ordering. Neither changes the version-one result yet; the resolver records them as seams for later work. The page says this plainly. The confidence question is different: it asks how well the published swatches match the person, and a low answer caps the resolver's reported confidence.

## When the page offers the side-by-side next step

The result shows "What would settle this" when the resolver raises any warning at all, or when the reported confidence is below 0.5. A result at or above 0.5 with no warning is the only case that omits it. `tests/app.test.tsx` pins both sides of that boundary.

## Reaching the result without a mouse

Submitting the form moves focus to the result heading, which carries `tabIndex={-1}` for that purpose. The result mounts below a long form, so without this a keyboard or screen-reader user gets no signal that anything happened. Focus is the single mechanism the page uses: a live region inserted at the same moment as its own content is not reliably announced, and moving focus reads the heading, the confidence, and the uncertainty copy in their written order rather than lifting one fragment out of it. `tests/result-focus.test.tsx` pins it across the first submission and every resubmission.

## Provenance audit and re-sourcing investigation, 2026-09-09

**This change ships the provenance audit and characterises the known season collapse. No new colour is shipped, the page is untouched, and the distribution is unchanged. Replacement values remain unresolved.** This is a bounded literature search result, not a claim that suitable data cannot exist.

The work followed three checks: reproduce the existing picker through its actual translator and resolver; inspect published measurements for comparable appearance and population coverage; adopt only traceable values, then repeat the same sweep and inspect the rendered picker. No values passed the source checks, so nothing was adopted; the repeated sweep and the rendered-picker measurement below record the unchanged state rather than a repair. Resolver scoring and season records remain unchanged.

### Source decisions

| Decision | Reason | Cost |
|---|---|---|
| Retain the current data while reporting the gap | No replacement set below passed both source checks | The live picker remains misleading |
| Reject arbitrary brightening, plotted-point estimates and interpolation | They would introduce values without the required evidence | No immediate visual repair |
| Pin the current sweep as a passing characterisation test | The audit can ship while changes to the measured distribution require review | Passing records a known defect; it does not establish a repaired picker |
| Do not choose values to make seasons reachable | The sweep checks consequences; it cannot establish biological colour validity | All twelve seasons may still require investigation after valid inputs are available |

### What was examined

| Source | Measurement and conditions | Population / coverage | Disposition |
|---|---|---|---|
| [Gerrard, *The measurement of hair colour* (1989)](https://doi.org/10.1111/j.1467-2494.1989.tb00499.x) | Minolta CR200; accessible abstract describes hue, lightness and chroma. | 65 subjects; demographic detail unavailable in the inspected abstract. | Abstract only inspected. No verified numeric appearance references obtained. |
| [Vaughn, *Blonde Hair Colour* (2010), chapters 3–4 and Appendix 1](https://vuir.vu.edu.au/15540/8/VAUGHN%20Michelle-thesis_nosignature.pdf) | CR300, D65, white tile, 15 readings per head; paired Casio QV-R40 photographs, flash off, sunlight white balance, varying ambient light. White-paper Lab offsets attempted colour correction. | 202 natural-hair subjects, principally European; chapter 4 compares 196 Europeans. Includes blond, brown, black and red. | Raw paired values exist, but chapter 4 reports mean DI-versus-RS ΔE 34.16 and moderate axis correlations. Its camera correction does not validate appearance matching. No per-person correction for the Bohnert measurements follows from these data. |
| [Norton et al., *Quantitative assessment of skin, hair, and iris variation* (2015 online)](https://www.researchgate.net/publication/281708116_Quantitative_assessment_of_skin_hair_and_iris_variation_in_a_diverse_sample_of_individuals_and_associated_genetic_variation) | DSM II dermaspectrometer for hair, three scalp readings. Iris images use D55 coaxial lighting and two different cameras; authors analyse sites separately because camera values may not be comparable. | Reports 1,450 participants aged 18–35 across five ancestry groups; excludes recent hair dye and reported pigmentary disorders. Hair categories combine light blond with red and dark blond with light brown. | Broader population, but group means and instrument pigmentation coordinates do not provide the requested named appearance anchors. The grouped categories cannot fill separate blond/red entries honestly. |
| [Kips et al., *Hair Color Digitization through Imaging and Deep Inverse Graphics* (2022)](https://arxiv.org/abs/2202.03723) | Fixed camera and three-light capture of stretched hair tresses, followed by fitted physical rendering. Appearance depends on lighting, shape and scattering. | Real tresses and synthetic samples; no demographic cohort defining eight natural colour categories. | Relevant appearance method, but no table of calibrated sRGB values for the required labels. Renderer parameter ranges are not measured reference colours. |
| [Edwards et al., *Quantitative measures of iris color using high resolution photographs* (2012)](https://doi.org/10.1002/ajpa.21637), [author-hosted text](https://www.researchgate.net/publication/51816028_Technical_note_Quantitative_measures_of_iris_color_using_high_resolution_photographs) | D55 coaxial flash; Fujifilm S3 Pro, f/19, ISO 200, 1/60 s. ColorChecker/Imatest check, followed by screen-blend brightening of underexposed images. Mean RGB from a 256×256 ciliary-zone patch becomes Lab under D55/2°. | 205 people: 66 East Asian, 72 European, 67 South Asian; mixed ancestry excluded. Figure 1 illustrates two blue, one green and three brown irises. | Stronger capture documentation and some missing colours, but processed patch means omit central mixed patterns. No exact, verified set covering grey, hazel and mixed irises was obtained. The six-example figure could not be retrieved at readable resolution in this run, so no numeric points were transcribed or guessed. |
| [Paparazzo et al., *A new approach to broaden the range of eye colour identifiable by IrisPlex* (2022)](https://www.nature.com/articles/s41598-022-17208-w) | D55 coaxial illumination, Nikon P300, approximately 10 cm, ISO 800. Mean RGB/Lab from a 60° wedge, with ciliary and pupillary zones separated. | 238 Southern Italian university participants: 29 blue (including three blue-grey), 21 green, 34 chestnut-green, 154 brown. | Good candidate for mixed-colour coverage. Participant colour data are not public because of ethical concerns; reasonable-request access is required. The published aggregate tables do not supply the replacement triples. No request was sent. |
| [Vilaseca et al., *Measuring and Analyzing the Colour of the Iris with a Multispectral Imaging System* (2008)](https://library.imaging.org/admin/apis/public/api/ist/website/downloadArticle/cgiv/4/1/art00091) | Halogen at 45° incidence; flat-field correction; reference white plate; spectral measurement of two approximately 1×1 mm iris areas over 380–780 nm. | 100 human irises from 50 subjects; also 68 prostheses and 17 contact lenses, which must be kept separate. Demographic representativeness and named-colour counts are not established. | Measurement route could support a defined conversion if exact spectra were obtained. The paper supplies spectral plots and reconstruction-error statistics, rather than a verified table of named appearance swatches. No curves were digitised into invented coordinates. |
| [Bunker et al., *Colour stability during production of printed ocular prostheses* (2023), Table 2](https://doi.org/10.1111/cote.12674) | Datacolour Spectraflash SP600 Plus, four readings per location, before and after polymerisation. Lab table has blue, green and brown measurements; no D65/observer declaration was found. | 30 printed prosthesis samples, ten per colour group. This is a material-production sample, not a population of 30 natural irises. | Rejected for natural-iris reference use. Neither the printed substrate nor polymerisation-stage colour is interchangeable with the original iris appearance; grey and hazel are also absent. |

The search covered instrument measurements, paired photographs, controlled appearance rendering, multispectral iris measurements, quantitative iris phenotype studies and prosthesis colour reproduction. Search terms included “hair colour measurement digital image reflective spectrophotometry”, “hair colour CIELAB D65 blond red”, “hair color appearance sRGB measurements”, “iris colour CIELAB blue green grey hazel calibrated”, and the named papers above. Search snippets were used to locate papers; adopted findings above come from the inspected primary text except the explicitly identified Gerrard abstract. An accessible table is insufficient when its samples or capture conditions describe a different thing.

### Commensurability decision

The current MST references are display colours. [ICC's sRGB definition](https://registry.color.org/rgb-registry/srgb) specifies the encoding and a D65 reference display white. Encoding instrument values as CSS sRGB does not establish an appearance match to that reference set.

The existing conversion remains source sRGB → Culori `lab65` → resolver, or, for hair, an unverified Lab-as-D65 assumption → resolver and Culori sRGB display. No new conversion was adopted. For a future known-white Lab source, the reviewable route is source Lab → XYZ under its stated white → documented chromatic adaptation to D65 → sRGB, with gamut checked before display and the corresponding D65 Lab sent to the resolver. Spectral data instead permit integration under a specified illuminant and observer before that display path. Both routes need source conditions and visual-reference validation; neither reconstructs missing directional scattering or camera exposure information.

Engineering inference from the inspected studies: the legacy mismatch cannot be repaired honestly by adding a constant to L*, treating D55 Lab as D65, or applying a display-only brightness change while passing the old dark numbers to the resolver. No inspected source validates such a transformation for these samples. The page copy attributes the darkness to measurement geometry alone. That is stronger than the evidence: geometry is one mismatch, alongside unspecified white/observer, sampling and appearance validation. The page is left as it stands under the decision recorded below, so it still carries the geometry-only wording this audit corrects.

### Exact gaps

| Required values | Missing evidence |
|---|---|
| Black, Dark brown, Medium brown, Light brown, Dark blond, Blond, Strawberry blond and Red hair | A verified appearance reference for each label, with source measurement/capture conditions and a justified comparison to MST. Existing numeric triples are traceable but unsuitable for the requested repair. |
| Blue, Green, Grey, Hazel and mixed iris options | Exact values with verified capture/colour-space provenance covering these appearances. Blue/green examples exist in the literature; they do not close the complete reference set. Mixed iris coverage additionally needs the source's spatial sampling described. |
| A decision on `naturalLevel` for any replacement hair set | Each hair reference carries a second field alongside its Lab triple: `naturalLevel`, currently assigned 1 to 8 in measured-lightness order, passed to the resolver by `toColoringInput` and validated by its schema, but never scored on. `tests/input-swatches.test.ts` pins the ordering against measured lightness, so a replacement set whose lightness ranking differs will fail that test with no hint that the field is a separate reference value rather than a derived one. A correctly sourced set will very likely reorder it: Red sits at level 4 today with `L*=22.49`, between Medium brown at 18.58 and Light brown at 24.87. The repair has to decide whether to re-derive the ordering from the new measurements or take it from a source that defines those levels. |
| Population-representative brown iris options | The current example-iris clusters cannot stand in for a sampled range of brown eyes. |
| A validated appearance interpretation of skin-to-hair contrast | No re-sourcing occurred, and the page is unchanged. Its result copy still attributes the contrast mismatch to geometry alone; the correction lives here rather than on the page. Measured reach of the defect, so it need not be recomputed: `contrastLevel` cuts at 40 CIELAB lightness units (`docs/resolver.md`), and against Blond, the palest hair reference at `L*=42.06`, the four lightest skin references sit at gaps of 52.15, 50.21, 51.03 and 45.51, so all four read high whichever hair reference is chosen. Monk 5 gives 35.84 and does not, so the reach is exactly four. |

A concrete next research step is to obtain the labelled colour-only records, capture/profile/exposure metadata and reuse terms for an appropriate iris cohort such as Paparazzo's, and a calibrated natural-hair appearance dataset or measurement study covering the eight labels. Requesting restricted data or commissioning measurements requires a decision beyond this implementation pass. Replacing these with an explicitly illustrative picker is a different product choice, not an evidence-based repair under this brief.

### Sweep: before and after

Reproduction: `npm test -- tests/input-sweep.test.ts`. This runs the actual `toColoringInput` → `resolveColoring` path for all 10 skin × 8 hair × 8 eye choices at the most generous interface confidence of 0.8 and grey percentage 0. It is the same 640-colour-combination sweep as the original finding. The grey slider is recorded only; the other confidence answers cap confidence without changing the primary season. The sweep is a diagnostic distribution over equally weighted picker combinations, not a population-frequency estimate or an accuracy study.

| Season | Before: main 327b77b | After: no accepted replacement |
|---|---:|---:|
| Light Spring | 0 | 0 |
| True Spring | 4 | 4 |
| Bright Spring | 30 | 30 |
| Light Summer | 0 | 0 |
| True Summer | 0 | 0 |
| Soft Summer | 0 | 0 |
| Soft Autumn | 91 | 91 |
| True Autumn | 18 | 18 |
| Deep Autumn | 472 | 472 |
| Deep Winter | 10 | 10 |
| True Winter | 15 | 15 |
| Bright Winter | 0 | 0 |
| Total | 640 | 640 |

Deep Autumn is 73.75%; low-confidence is 485/640 (75.78125%); conflicting-signals is 147/640 (22.96875%). All are unchanged. Five seasons remain unreachable. The characterisation test asserts the entire current distribution, total and warning counts against the actual picker, without mocks, bypass flags, skips or expected-failure annotations. Its comment identifies these numbers as a known defect. A distribution change fails the test and requires inspection of the full sweep before updating the baseline. The goals of all twelve seasons being reachable, a useful spread and warnings caused by personal ambiguity remain unmet; a passing characterisation test does not establish accurate seasons or calibrated confidence.

The original improvement assertions failed before the test was changed to characterise the defect (exit 1, unreachable list condensed). This evidence remains valid:

```text
unreachable: light-spring, light-summer, true-summer, soft-summer, bright-winter
AssertionError: expected 0.7375 to be less than 0.7375
AssertionError: expected 0.7578125 to be less than 0.7578125
```

### Measured check of the rendered swatches

The unchanged app was run locally in Chrome, and the claim it was run to settle is answered by measurement rather than by eye, because an audit about values that look right and are not cannot rest a distinguishability question on an impression. Each hair reference is rendered through the same path the page uses, `swatchHex` converting the stored `lab65` value to sRGB with Culori, and every pair is compared with Culori's `differenceCiede2000`. Distances below are ΔE00 rounded to two decimals.

| Hair reference | Rendered sRGB |
|---|---|
| Black | `#241d1f` |
| Dark brown | `#2a2320` |
| Medium brown | `#372b24` |
| Light brown | `#443930` |
| Dark blond | `#473b34` |
| Blond | `#74604f` |
| Strawberry blond | `#6e543e` |
| Red | `#493024` |

The three closest pairs of the twenty-eight are Light brown against Dark blond at 1.67, Black against Dark brown at 3.91, and Dark brown against Medium brown at 4.26. Blond renders `#74604f` and reads as mid brown; Red renders `#493024` and reads as dark brown. The pair reported from the live site, Black against Dark blond, measures 11.26 between the rendered swatches, so the reported impression of that pair is not reproduced by the distance between them. Both are very dark patches, and the reported swatch size, surround and display calibration are unknown, which is where a measured distance and a lived impression can honestly part company. The closest pair in the data is a different one: Light brown and Dark blond, two adjacent options in the picker, are effectively the same patch.

The criterion for "effectively the same" is Mahy, Van Eycken and Oosterlinck, *Evaluation of uniform color spaces developed after the adoption of CIELAB and CIELUV* (Color Research & Application 19(2), 1994), whose mean measured just-noticeable difference was 2.3 ΔE\*ab under their controlled viewing conditions. That is a different metric from ΔE00 and was measured on a specific setup, so it is a reference point rather than a universal threshold, and a numeric distance is not proof of what any particular observer sees on any particular display: the page's swatch size, surround and display calibration are all unknown here. Read 1.67, like every distance in this section, as a measurement of the rendered swatches rather than of what anyone sees; the reference values behind them are where the repair has to happen. All eight eye choices remain brown. No new swatches exist to approve, and no improvement is claimed.

Stated precisely, because the aggregate version of this sentence is wrong: seven of the eight hair swatches render markedly darker than the colours their labels name. Black is the exception. Its stored `L*=11.50`, `a*=4.08`, `b*=-0.19` renders `#241d1f`, a near-black grey that is slightly lighter than the colour the label "Black" names. Writing this as "every swatch renders darker" would repeat the class of mistake this audit documents: a colour claim that looks right and is not.

### Validation of this audit

The sweep passes only while its measured distribution matches the recorded defect. Temporarily omitting one eye reference from the test loop produced exit 1 with `AssertionError: expected 560 to be 640`; restoring the loop returned the suite to green. A future repair must provide sourced values and new before/after evidence rather than treating this baseline as a target. The shipped diff is three files: this document, the new `tests/input-sweep.test.ts`, and `DECISIONS.md`, which gains both the park entry and a preamble note saying entries are dated and later ones record decisions taken against evidence from the shipped product. No colour value, resolver behaviour, season record, existing test or page changes.

### Parked by decision, 2026-09-09

The repository owner read this audit and parked the reference repair as low priority, to be picked up later. The gap is therefore known and deliberate rather than unnoticed. The picker still asks for a choice against hair references whose displayed colours do not match their labels, and against eye references that are all brown from a single example iris with no blue, green, grey, hazel or mixed option, and the sweep above records what that produces. The page also still tells every visitor that the collapse "is known and is being worked on", which this decision makes inaccurate: the repair is parked, not under way. The page is left as it stands, so that sentence and the geometry-only contrast wording are both recorded here rather than corrected there. Whoever picks this up next starts from the source table, the exact gaps and the commensurability decision recorded here rather than repeating the search; one of the open routes is a restricted-data request that only the captain can send in his own name.
