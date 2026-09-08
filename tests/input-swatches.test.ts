import { describe, expect, it } from 'vitest';
import { inputSwatches, swatchHex, swatchLab } from '../src/input-swatches';

describe('input swatch translation', () => {
  it('converts the published MST 1 reference to the committed Lab value', () => {
    const skin = inputSwatches.skin[0]!;
    const lab = swatchLab(skin);
    expect(lab.l).toBeCloseTo(94.2109182, 5);
    expect(lab.a).toBeCloseTo(1.5031056, 5);
    expect(lab.b).toBeCloseTo(5.4301448, 5);
  });

  it('round-trips the known MST 1 sRGB reference through Lab', () => {
    const skin = inputSwatches.skin[0]!;
    expect(swatchHex({ ...skin, hex: undefined, lab: swatchLab(skin) })).toBe('#f6ede4');
  });
});

describe('hair reference levels', () => {
  it('orders naturalLevel by measured lightness', () => {
    const byLightness = [...inputSwatches.hair].sort((a, b) => swatchLab(a).l - swatchLab(b).l);
    const levels = byLightness.map(({ naturalLevel }) => naturalLevel);
    expect(levels).toEqual([...levels].sort((a, b) => a - b));
    expect(new Set(levels).size).toBe(levels.length);
  });
});
