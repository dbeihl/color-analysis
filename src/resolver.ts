import { converter, differenceCiede2000 } from 'culori';
import { z } from 'zod';
import {
  type ColorSeason,
  type ColorSeasonId,
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
export const BOUNDARY_TOLERANCE = 0.005;
const LOW_CONFIDENCE = 0.25;
const paletteOklab = new Map(colorSeasons.map((season) => [
  season.id,
  season.palette.map(({ lab }) => oklab(lab)),
]));

function depthBand(itaDegrees: number): ItaDepthBand {
  if (itaDegrees > 55) return 'very-light';
  if (itaDegrees > 41) return 'light';
  if (itaDegrees > 28) return 'intermediate';
  if (itaDegrees > 10) return 'tan';
  if (itaDegrees > -30) return 'brown';
  return 'dark';
}

function itaDegrees({ l, b }: Lab) {
  return Math.atan2(l - 50, b) * 180 / Math.PI;
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

type Oklab = NonNullable<ReturnType<typeof oklab>>;

function oklabDistance(left: Oklab, right: Oklab) {
  return Math.hypot(left.l - right.l, left.a - right.a, left.b - right.b);
}

function seasonScore(samples: Oklab[], season: ColorSeason) {
  const swatches = paletteOklab.get(season.id)!;
  return samples.reduce((total, sample) => total + Math.min(
    ...swatches.map((swatch) => oklabDistance(sample, swatch)),
  ), 0) / samples.length;
}

export function classifyColorSeason(
  features: ColoringFeatures,
  tolerance = BOUNDARY_TOLERANCE,
): Pick<StyleProfile, 'colorSeason' | 'warnings'> {
  const samples = Object.values(features.samples).map((sample) => oklab(sample));
  const ranked = colorSeasons
    .map((season) => ({ season, score: seasonScore(samples, season) }))
    .sort((a, b) => a.score - b.score);
  const [primary, runnerUp] = ranked;
  if (!primary || !runnerUp) throw new Error('At least two color-season palettes are required');
  const contenders = ranked.slice(1).filter(({ score }) => score - primary.score <= tolerance);
  const declared = new Set<ColorSeasonId>(primary.season.neighbors);
  const secondary = contenders.filter(({ season }) => declared.has(season.id)).map(({ season }) => season.id);
  const contradicted = contenders.some(({ season }) => !declared.has(season.id));
  const marginRatio = contradicted
    ? 0
    : (runnerUp.score - primary.score) / Math.max(runnerUp.score, Number.EPSILON);
  const value = Math.min(marginRatio, features.inputConfidence);
  const warnings: StyleProfile['warnings'] = [];
  if (secondary.length > 0) {
    warnings.push({
      code: 'boundary',
      message: `${contenders.length + 1} seasons are within the comparison tolerance; use the blind comparison to choose.`,
    });
  }
  if (contradicted) {
    warnings.push({
      code: 'conflicting-signals',
      message: 'A season the palettes do not treat as adjacent scores just as well; this classification is unreliable.',
    });
  }
  if (value < LOW_CONFIDENCE) {
    warnings.push({
      code: 'low-confidence',
      message: 'The palette scores are close or the manual inputs are uncertain; treat this as a suggestion.',
    });
  }
  return {
    colorSeason: {
      primary: primary.season.id,
      secondary,
      dominantAxis: primary.season.dominant,
      confidence: {
        basis: marginRatio <= features.inputConfidence ? 'relative-score-margin' : 'self-reported-input-confidence',
        value,
      },
    },
    warnings,
  };
}

export function rankPalette(skin: Lab, season: ColorSeason): PaletteEntry[] {
  const entries = structuredClone(season.palette);
  const nearFace = entries.filter(({ nearFace: near }) => near).sort((a, b) =>
    swatchDistance(skin, b.lab) - swatchDistance(skin, a.lab) || a.name.localeCompare(b.name),
  );
  return [...nearFace, ...entries.filter(({ nearFace: near }) => !near)];
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
