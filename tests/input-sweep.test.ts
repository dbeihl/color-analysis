import { differenceCiede2000 } from 'culori';
import { expect, it } from 'vitest';
import { inputSwatches, swatchHex, toColoringInput } from '../src/input-swatches';
import { colorSeasons } from '../src/knowledge/load';
import { resolveColoring } from '../src/resolver';

it('characterises the known season collapse across every picker combination', () => {
  const distribution = Object.fromEntries(colorSeasons.map(({ id }) => [id, 0]));
  let total = 0;
  let lowConfidence = 0;
  let conflictingSignals = 0;

  for (const skin of inputSwatches.skin) {
    for (const hair of inputSwatches.hair) {
      for (const eye of inputSwatches.eye) {
        const result = resolveColoring(toColoringInput(skin, hair, eye, 0, 0.8));
        distribution[result.colorSeason.primary]!++;
        lowConfidence += Number(result.warnings.some(({ code }) => code === 'low-confidence'));
        conflictingSignals += Number(result.warnings.some(({ code }) => code === 'conflicting-signals'));
        total++;
      }
    }
  }

  // These numbers record a known defect, not a desired state; review the full sweep before updating them.
  expect(total).toBe(640);
  expect(distribution).toEqual({
    'light-spring': 0,
    'true-spring': 4,
    'bright-spring': 30,
    'light-summer': 0,
    'true-summer': 0,
    'soft-summer': 0,
    'soft-autumn': 91,
    'true-autumn': 18,
    'deep-autumn': 472,
    'deep-winter': 10,
    'true-winter': 15,
    'bright-winter': 0,
  });
  expect(lowConfidence).toBe(485);
  expect(conflictingSignals).toBe(147);
});

it('pins the closest pair of rendered hair swatches, which is below a useful distinguishability margin', () => {
  const difference = differenceCiede2000();
  const rendered = inputSwatches.hair.map((swatch) => ({ id: swatch.id, hex: swatchHex(swatch) }));
  const pairs = rendered.flatMap((a, index) => rendered.slice(index + 1).map((b) => ({
    pair: [a.id, b.id],
    delta: difference(a.hex, b.hex),
  })));
  const closest = pairs.reduce((a, b) => (b.delta < a.delta ? b : a));

  expect(closest.pair).toEqual(['light-brown', 'dark-blond']);
  expect(closest.delta).toBeCloseTo(1.67, 2);
});
