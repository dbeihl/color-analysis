import { differenceCiede2000 } from 'culori';
import { describe, expect, it } from 'vitest';
import { COLOR_SEASON_IDS, type ColoringInput } from '../src/domain/types';
import { colorSeasons } from '../src/knowledge/load';
import { classifyColorSeason, measureColoring, rankPalette, resolveColoring } from '../src/resolver';
import golden from './fixtures/resolver-golden.json';

describe('manual color measurement', () => {
  const input: ColoringInput = {
    skin: { lab: { mode: 'lab65', l: 60, a: 3, b: 4 }, monkBand: 5 },
    hair: { lab: { mode: 'lab65', l: 30, a: 2, b: 3 }, naturalLevel: 3, greyPercent: 0 },
    eye: { lab: { mode: 'lab65', l: 45, a: -2, b: 5 } },
    source: 'manual',
    confidence: 0.8,
  };

  it('keeps ITA depth separate from undertone hue', () => {
    const first = measureColoring(input);
    const shifted = measureColoring({
      ...input,
      skin: { ...input.skin, lab: { ...input.skin.lab, a: 12 } },
    });
    expect(first.depth).toEqual(shifted.depth);
    expect(first.depth.itaDegrees).toBeCloseTo(68.1986, 4);
    expect(first.depth.band).toBe('very-light');
    expect(first.undertone.hueAngleDegrees).toBeCloseTo(53.1301, 4);
    expect(first.undertone.hueAngleDegrees).not.toBe(shifted.undertone.hueAngleDegrees);
    expect(first.meanChroma).toBeCloseTo((5 + Math.sqrt(13) + Math.sqrt(29)) / 3);
    expect(first.skinHairValueContrast).toBe(30);
  });

  it('rejects manual values outside the domain contract', () => {
    expect(() => measureColoring({ ...input, confidence: 1.01 })).toThrow();
  });
});

it('scores palette swatches independently of declared season axes', () => {
  const features = measureColoring(golden[0]!.input);
  const before = classifyColorSeason(features).colorSeason;
  const axes = colorSeasons.map(({ axes }) => axes);
  try {
    for (const season of colorSeasons) season.axes = { hue: 0, value: 0, chroma: 0 };
    expect(classifyColorSeason(features).colorSeason).toEqual(before);
  } finally {
    colorSeasons.forEach((season, index) => { season.axes = axes[index]!; });
  }
});

it('matches all golden resolver cases across every season and Monk band', () => {
  const seasons = new Set<string>();
  const monkBands = new Set<number>();
  expect(golden).toHaveLength(36);
  for (const fixture of golden) {
    const result = resolveColoring(fixture.input);
    expect(result.colorSeason.primary, fixture.id).toBe(fixture.expected.primary);
    expect(result.colorSeason.secondary, fixture.id).toBeUndefined();
    seasons.add(fixture.expected.primary);
    monkBands.add(fixture.input.skin.monkBand);
  }
  expect(seasons).toEqual(new Set(COLOR_SEASON_IDS));
  expect(monkBands).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
});

it('returns both adjacent seasons inside the boundary tolerance', () => {
  const result = resolveColoring({
    skin: {
      lab: { mode: 'lab65', l: 55.14213021508124, a: 7.782267412276223, b: 26.744393855394655 },
      monkBand: 6,
    },
    hair: {
      lab: { mode: 'lab65', l: 65.606236176, a: -16.577053176, b: 3.245282912 },
      naturalLevel: 7,
      greyPercent: 0,
    },
    eye: {
      lab: { mode: 'lab65', l: 67.367900856, a: 23.208597232, b: 55.46818988 },
    },
    source: 'manual',
    confidence: 0.9,
  });
  expect(result.colorSeason.primary).toBe('true-spring');
  expect(result.colorSeason.secondary).toBe('bright-spring');
  expect(result.warnings.map(({ code }) => code)).toContain('boundary');
});

it('ranks near-face colors by CIEDE2000 distance without using display roles', () => {
  const season = structuredClone(colorSeasons[0]!);
  const skin = season.palette.find(({ nearFace }) => nearFace)!.lab;
  const distance = differenceCiede2000();
  const ranked = rankPalette(skin, season);
  const nearFace = ranked.filter((entry) => entry.nearFace);
  expect(ranked.slice(0, nearFace.length).every((entry) => entry.nearFace)).toBe(true);
  expect(nearFace.map((entry) => distance(skin, entry.lab))).toEqual(
    [...nearFace].map((entry) => distance(skin, entry.lab)).sort((a, b) => a - b),
  );
  const before = ranked.map(({ lab }) => lab);
  for (const entry of season.palette) {
    if (entry.role === 'metal') entry.role = 'denim';
    else if (entry.role === 'denim') entry.role = 'metal';
  }
  expect(rankPalette(skin, season).map(({ lab }) => lab)).toEqual(before);
});
