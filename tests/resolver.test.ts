import { converter, differenceCiede2000 } from 'culori';
import { describe, expect, it } from 'vitest';
import { COLOR_SEASON_IDS, type ColoringInput } from '../src/domain/types';
import { colorSeasons } from '../src/knowledge/load';
import {
  BOUNDARY_TOLERANCE,
  classifyColorSeason,
  measureColoring,
  rankPalette,
  resolveColoring,
} from '../src/resolver';
import golden from './fixtures/resolver-golden.json';

const toOklab = converter('oklab');

function contenderCount(input: unknown) {
  const { samples } = measureColoring(input);
  const scores = colorSeasons.map((season) => Object.values(samples).reduce((total, sample) => {
    const from = toOklab(sample)!;
    return total + Math.min(...season.palette.map(({ lab }) => {
      const to = toOklab(lab)!;
      return Math.hypot(from.l - to.l, from.a - to.a, from.b - to.b);
    }));
  }, 0) / 3);
  const best = Math.min(...scores);
  return scores.filter((score) => score - best <= BOUNDARY_TOLERANCE).length;
}

const committedSwatches = new Set(
  colorSeasons.flatMap(({ palette }) => palette.map(({ lab }) => `${lab.l},${lab.a},${lab.b}`)),
);

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

  it('accepts a negative skin b* and still bands a light sample as light', () => {
    const cool = measureColoring({
      ...input,
      skin: { ...input.skin, lab: { mode: 'lab65', l: 80, a: 0, b: -5 } },
    });
    expect(cool.depth.itaDegrees).toBeCloseTo(99.4623, 4);
    expect(cool.depth.band).toBe('very-light');
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

function contended(features: ReturnType<typeof measureColoring>, tolerance: number) {
  const result = classifyColorSeason(features, tolerance);
  return result.colorSeason.secondary.length > 0
    || result.warnings.some(({ code }) => code === 'conflicting-signals');
}

describe('golden resolver cases', () => {
  it('draws every case from colours no palette contains', () => {
    expect(golden).toHaveLength(36);
    for (const { id, input } of golden) {
      for (const { lab } of [input.hair, input.eye]) {
        expect(`${lab.l},${lab.a},${lab.b}`, id).not.toBeOneOf([...committedSwatches]);
      }
    }
  });

  it('matches all golden resolver cases across every season and Monk band', () => {
    const seasons = new Set<string>();
    const monkBands = new Set<number>();
    for (const fixture of golden) {
      const result = resolveColoring(fixture.input);
      expect(result.colorSeason.primary, fixture.id).toBe(fixture.expected.primary);
      expect(result.colorSeason.secondary, fixture.id).toEqual(fixture.expected.secondary);
      expect(result.warnings.map(({ code }) => code), fixture.id).toEqual(fixture.expected.warnings);
      seasons.add(fixture.expected.primary);
      monkBands.add(fixture.input.skin.monkBand);
    }
    expect(seasons).toEqual(new Set(COLOR_SEASON_IDS));
    expect(monkBands).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]));
  });

  it('pins every recorded margin on both sides of the tolerance it needs', () => {
    for (const fixture of golden) {
      const features = measureColoring(fixture.input);
      expect(contended(features, fixture.margin - 1e-6), fixture.id).toBe(false);
      expect(contended(features, fixture.margin + 1e-6), fixture.id).toBe(true);
    }
  });

  it('measures at least ten cases inside the boundary regime', () => {
    const regime = golden.filter(({ input }) => {
      const features = measureColoring(input);
      return contended(features, 0.017) && !contended(features, 0.002);
    });
    expect(regime.length).toBeGreaterThanOrEqual(10);
  });

  it('offers a second season exactly when a rival scores inside the tolerance', () => {
    for (const fixture of golden) {
      const features = measureColoring(fixture.input);
      expect(contended(features, BOUNDARY_TOLERANCE), fixture.id)
        .toBe(fixture.margin <= BOUNDARY_TOLERANCE);
    }
  });

  it('states the tolerance count and the seasons the blind comparison will offer', () => {
    const contested = golden.filter(({ expected }) => expected.warnings.includes('boundary'));
    const equal = contested.filter(({ input, expected }) => contenderCount(input) === expected.secondary.length + 1);
    expect(equal.length).toBeGreaterThan(0);
    expect(contested.length - equal.length).toBeGreaterThan(0);
    for (const fixture of contested) {
      const { colorSeason, warnings } = resolveColoring(fixture.input);
      const { message } = warnings.find(({ code }) => code === 'boundary')!;
      const withinTolerance = contenderCount(fixture.input);
      const offered = [colorSeason.primary, ...colorSeason.secondary];
      expect(message, fixture.id).toContain(`${withinTolerance} seasons are within the comparison tolerance.`);
      expect(message, fixture.id).toContain(`: ${offered.join(', ')}.`);
      expect(message.includes(`offers all ${withinTolerance}`), fixture.id)
        .toBe(withinTolerance === offered.length);
      expect(message.includes(`offers ${offered.length} of them`), fixture.id)
        .toBe(withinTolerance !== offered.length);
    }
  });

  it('names only seasons the primary declares as neighbours', () => {
    for (const fixture of golden) {
      const { primary, secondary } = resolveColoring(fixture.input).colorSeason;
      const neighbors = colorSeasons.find(({ id }) => id === primary)!.neighbors;
      expect(secondary.every((id) => neighbors.includes(id)), fixture.id).toBe(true);
    }
  });

  it('fails a golden case whose expected season is wrong', () => {
    const fixture = golden[0]!;
    const wrong = COLOR_SEASON_IDS.find((id) => id !== fixture.expected.primary)!;
    expect(() => expect(resolveColoring(fixture.input).colorSeason.primary).toBe(wrong)).toThrow();
  });

  it('drops every boundary case when the tolerance is zero', () => {
    const fixture = golden.find(({ expected, margin }) => expected.secondary.length > 0 && margin > 0)!;
    const result = classifyColorSeason(measureColoring(fixture.input), 0);
    expect(result.colorSeason.secondary).toEqual([]);
    expect(result.warnings.map(({ code }) => code)).not.toContain('boundary');
  });
});

it('names contradicted adjacency when that is what zeroed the confidence', () => {
  const fixture = golden.find(({ expected }) => expected.warnings.includes('conflicting-signals'))!;
  const { confidence } = classifyColorSeason(
    measureColoring({ ...fixture.input, confidence: 1 }),
  ).colorSeason;
  expect(confidence.basis).toBe('contradicted-adjacency');
  expect(confidence.value).toBe(0);
});

it('labels confidence with whichever of the two limits actually bound it', () => {
  const fixture = golden
    .filter(({ expected }) => !expected.warnings.includes('conflicting-signals'))
    .reduce((widest, entry) => (entry.margin > widest.margin ? entry : widest));
  const certain = classifyColorSeason(measureColoring({ ...fixture.input, confidence: 1 })).colorSeason;
  expect(certain.confidence.basis).toBe('relative-score-margin');
  expect(certain.confidence.value).toBeGreaterThan(0.01);
  const unsure = classifyColorSeason(measureColoring({ ...fixture.input, confidence: 0.01 })).colorSeason;
  expect(unsure.confidence.basis).toBe('self-reported-input-confidence');
  expect(unsure.confidence.value).toBe(0.01);
});

it('ranks near-face colors by descending CIEDE2000 distance without using display roles', () => {
  const season = structuredClone(colorSeasons[0]!);
  const skin = season.palette.find(({ nearFace }) => nearFace)!.lab;
  const distance = differenceCiede2000();
  const ranked = rankPalette(skin, season);
  const nearFace = ranked.filter((entry) => entry.nearFace);
  expect(ranked.slice(0, nearFace.length).every((entry) => entry.nearFace)).toBe(true);
  expect(nearFace.map((entry) => distance(skin, entry.lab))).toEqual(
    [...nearFace].map((entry) => distance(skin, entry.lab)).sort((a, b) => b - a),
  );
  const before = ranked.map(({ lab }) => lab);
  for (const entry of season.palette) {
    if (entry.role === 'metal') entry.role = 'denim';
    else if (entry.role === 'denim') entry.role = 'metal';
  }
  expect(rankPalette(skin, season).map(({ lab }) => lab)).toEqual(before);
});

it('leaves every non-near-face swatch in committed palette order', () => {
  const season = colorSeasons[0]!;
  const committed = season.palette.filter(({ nearFace }) => !nearFace).map(({ name }) => name);
  expect(committed.length).toBeGreaterThan(1);
  for (const skin of [season.palette[0]!.lab, { mode: 'lab65' as const, l: 20, a: 30, b: -10 }]) {
    expect(rankPalette(skin, season).filter(({ nearFace }) => !nearFace).map(({ name }) => name))
      .toEqual(committed);
  }
});

it('hands back palette entries a caller cannot use to corrupt the knowledge base', () => {
  const season = colorSeasons[0]!;
  const entry = rankPalette(season.palette[0]!.lab, season)[0]!;
  const original = structuredClone(season.palette);
  entry.name = 'renamed';
  entry.lab.l = -1;
  expect(season.palette).toEqual(original);
});
