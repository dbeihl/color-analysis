export const COLOR_SEASON_IDS = [
  'light-spring', 'true-spring', 'bright-spring',
  'light-summer', 'true-summer', 'soft-summer',
  'soft-autumn', 'true-autumn', 'deep-autumn',
  'deep-winter', 'true-winter', 'bright-winter',
] as const;

export const PALETTE_ROLES = [
  'base-neutral', 'secondary-neutral', 'accent', 'statement', 'metal', 'denim',
] as const;

export type ColorSeasonId = typeof COLOR_SEASON_IDS[number];
export type CalendarSeason = 'spring' | 'summer' | 'autumn' | 'winter';
export type Axis = 'hue' | 'value' | 'chroma';
export type TenBand = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/** CIELAB, D65 white, CIE 1931 2-degree observer; Culori's lab65 mode. */
export interface Lab {
  mode: 'lab65';
  l: number;
  a: number;
  b: number;
}

export interface ColoringInput {
  skin: { lab: Lab; monkBand: TenBand };
  hair: { lab: Lab; naturalLevel: TenBand; greyPercent: number };
  eye: { lab: Lab };
  source: 'manual';
  /** Self-reported certainty in [0, 1], never a calibrated accuracy probability. */
  confidence: number;
}

export interface PaletteEntry {
  lab: Lab;
  role: typeof PALETTE_ROLES[number];
  nearFace: boolean;
  name: string;
  munsell: { hue: string; value: number; chroma: number };
}

export interface ColorSeason {
  id: ColorSeasonId;
  family: 'spring' | 'summer' | 'autumn' | 'winter';
  dominant: Axis;
  axes: Record<Axis, number>;
  coreRegion: {
    hueFamilies: string[];
    value: [number, number];
    chroma: [number, number];
  };
  neighbors: ColorSeasonId[];
  sources: string[];
  palette: PaletteEntry[];
}

export interface Warning {
  code: 'low-confidence' | 'boundary' | 'conflicting-signals';
  message: string;
}

export interface StyleProfile {
  colorSeason: {
    primary: ColorSeasonId;
    secondary?: ColorSeasonId;
    dominantAxis: Axis;
  };
  contrastLevel: 'low' | 'medium' | 'high';
  palette: PaletteEntry[];
  warnings: Warning[];
}
