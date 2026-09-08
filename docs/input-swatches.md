# Input swatches

The interface turns recognisable colour choices into the `ColoringInput` that `resolveColoring` already accepts. It does not measure a person, and changing this translation does not change the resolver, palettes, or scoring.

## Sources

The ten skin choices are the published Monk Skin Tone (MST) sRGB reference values: `#f6ede4`, `#f3e7db`, `#f7ead0`, `#eadaba`, `#d7bd96`, `#a07e56`, `#825c43`, `#604134`, `#3a312a`, and `#292420`, in order from MST 1 to MST 10. Google describes the scale and its MST-E reference dataset in [its announcement](https://blog.google/company-news/outreach-and-initiatives/diversity/why-inclusive-sets-of-images-help-us-make-better-products/); the exact public sRGB values are reproduced in Figure 6 of [Lee et al., ICLR 2026](https://openreview.net/pdf/4b1c21b0717fa587995085ca3165b24c23a4afa8.pdf).

The natural-hair choices use the published CIELAB means for black, brown, blond, and red hair in Table 1 of Bohnert et al., [*Farbmetrische Untersuchungen der menschlichen Kopfhaare*](https://www.researchgate.net/publication/226846016_Farbmetrische_Untersuchungen_der_menschlichen_Kopfhaare). The study measured 17 people with a 45 degree geometry and a barium-sulfate white reference. Its samples are useful measured anchors, not a comprehensive hair-colour scale. It does not state an illuminant or observer for those Lab triples, so version one treats them as D65 Lab solely to meet the engine's `lab65` contract. This is an uncalibrated approximation, and the page tells people to lower their match confidence when none is close.

The eye choices use the direct sRGB values from Table 1 of Jang et al., [*Classification of Iris Colors and Patterns in Koreans*](https://doi.org/10.4258/hir.2018.24.3.227). That open-access study clustered iris pixels from 100 Korean eyes and explicitly treats the captured RGB values as standard sRGB. The table is predominantly a set of brown-iris samples. It does not represent blue, green, grey, or mixed irises, and version one says so beside the choices rather than pretending that a brown reference can be a reliable match for every eye.

## Colour-space path

For skin and eye references, the value stored in `src/input-swatches.ts` is the source sRGB hex. Culori converts it from sRGB D65 to `lab65` for the resolver, and converts Lab back to sRGB to paint a swatch when needed. Hair arrives as the published CIELAB measurement described above, is treated as `lab65` for the resolver, and is converted with Culori to sRGB for display. The source-to-Lab test pins MST 1 to `L*=94.2109`, `a*=1.5031`, and `b*=5.4301`, and a round trip returns `#f6ede4`; these are the independent reference values already committed in the resolver fixtures.

## Inputs the resolver currently records only

Natural hair level and grey percentage are passed through exactly as selected. Neither changes the version-one result yet; the resolver records them as seams for later work. The page says this plainly. The confidence question is different: it asks how well the published swatches match the person, and a low answer caps the resolver's reported confidence.
