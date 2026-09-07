import { converter, differenceCiede2000 } from 'culori';
import { z } from 'zod';
import {
  type ColorSeason,
  type ColoringFeatures,
  type ColoringInput,
  type ItaDepthBand,
  type Lab,
  type PaletteEntry,
  type StyleProfile,
} from './domain/types';
import { colorSeasons } from './knowledge/load';
import { labSchema } from './knowledge/schemas/seasons';

const tenBandSchema = z.number().int().min(1).max(10);
const coloringInputSchema = z.strictObject({
  skin: z.strictObject({ lab: labSchema, monkBand: tenBandSchema }),
  hair: z.strictObject({
    lab: labSchema,
    naturalLevel: tenBandSchema,
    greyPercent: z.number().finite().min(0).max(100),
  }),
  eye: z.strictObject({ lab: labSchema }),
  source: z.literal('manual'),
  confidence: z.number().finite().min(0).max(1),
});

const oklab = converter('oklab');
const swatchDistance = differenceCiede2000();
const BOUNDARY_TOLERANCE = 0.005;

function depthBand(itaDegrees: number): ItaDepthBand {
  if (itaDegrees > 55) return 'very-light';
  if (itaDegrees > 41) return 'light';
  if (itaDegrees > 28) return 'intermediate';
  if (itaDegrees > 10) return 'tan';
  if (itaDegrees > -30) return 'brown';
  return 'dark';
}

function itaDegrees({ l, b }: Lab) {
  if (b === 0) return l === 50 ? 0 : Math.sign(l - 50) * 90;
  return Math.atan((l - 50) / b) * 180 / Math.PI;
}

function hueAngleDegrees({ a, b }: Lab) {
  return (Math.atan2(b, a) * 180 / Math.PI + 360) % 360;
}

function chroma({ a, b }: Lab) {
  return Math.hypot(a, b);
}

export function measureColoring(input: unknown): ColoringFeatures {
  const normalized = coloringInputSchema.parse(input) as ColoringInput;
  const samples = {
    skin: normalized.skin.lab,
    hair: normalized.hair.lab,
    eye: normalized.eye.lab,
  };
  const ita = itaDegrees(samples.skin);
  return {
    samples,
    depth: {
      itaDegrees: ita,
      band: depthBand(ita),
    },
    undertone: { hueAngleDegrees: hueAngleDegrees(samples.skin) },
    meanChroma: Object.values(samples).reduce((sum, sample) => sum + chroma(sample), 0) / 3,
    skinHairValueContrast: Math.abs(samples.skin.l - samples.hair.l),
    inputConfidence: normalized.confidence,
  };
}

function oklabDistance(left: Lab, right: Lab) {
  const a = oklab(left);
  const b = oklab(right);
  return Math.hypot(a.l - b.l, a.a - b.a, a.b - b.b);
}

function seasonScore(features: ColoringFeatures, season: ColorSeason) {
  return Object.values(features.samples).reduce((total, sample) => total + Math.min(
    ...season.palette.map((swatch) => oklabDistance(sample, swatch.lab)),
  ), 0) / 3;
}

export function classifyColorSeason(features: ColoringFeatures): Pick<StyleProfile, 'colorSeason' | 'warnings'> {
  const [primary, secondary] = colorSeasons
    .map((season) => ({ season, score: seasonScore(features, season) }))
    .sort((a, b) => a.score - b.score || a.season.id.localeCompare(b.season.id));
  if (!primary || !secondary) throw new Error('At least two color-season palettes are required');
  const margin = secondary.score - primary.score;
  const confidence = Math.min(features.inputConfidence, margin / Math.max(secondary.score, Number.EPSILON));
  const warnings: StyleProfile['warnings'] = [];
  if (margin <= BOUNDARY_TOLERANCE) {
    warnings.push({
      code: 'boundary',
      message: 'Two seasons are within the comparison tolerance; use the blind comparison to choose.',
    });
  }
  if (confidence < 0.25) {
    warnings.push({
      code: 'low-confidence',
      message: 'The palette scores are close or the manual inputs are uncertain; treat this as a suggestion.',
    });
  }
  return {
    colorSeason: {
      primary: primary.season.id,
      ...(margin <= BOUNDARY_TOLERANCE ? { secondary: secondary.season.id } : {}),
      dominantAxis: primary.season.dominant,
      confidence: { basis: 'relative-score-margin', value: confidence },
    },
    warnings,
  };
}

export function rankPalette(skin: Lab, season: ColorSeason): PaletteEntry[] {
  return [...season.palette].sort((a, b) =>
    Number(b.nearFace) - Number(a.nearFace)
      || swatchDistance(skin, a.lab) - swatchDistance(skin, b.lab)
      || a.name.localeCompare(b.name),
  );
}

export function resolveColoring(input: unknown): StyleProfile {
  const features = measureColoring(input);
  const classification = classifyColorSeason(features);
  const season = colorSeasons.find(({ id }) => id === classification.colorSeason.primary);
  if (!season) throw new Error(`Missing palette for ${classification.colorSeason.primary}`);
  const contrast = features.skinHairValueContrast;
  return {
    ...classification,
    contrastLevel: contrast < 20 ? 'low' : contrast < 40 ? 'medium' : 'high',
    palette: rankPalette(features.samples.skin, season),
  };
}
