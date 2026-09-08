import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Result } from '../src/app';
import { inputSwatches, swatchLab } from '../src/input-swatches';
import { resolveColoring } from '../src/resolver';
import golden from './fixtures/resolver-golden.json';

function chosenInput(skinId: string, hairId: string, eyeId: string, confidence: number) {
  const skin = inputSwatches.skin.find(({ id }) => id === skinId)!;
  const hair = inputSwatches.hair.find(({ id }) => id === hairId)!;
  const eye = inputSwatches.eye.find(({ id }) => id === eyeId)!;
  return {
    skin: { lab: swatchLab(skin), monkBand: skin.monkBand },
    hair: { lab: swatchLab(hair), naturalLevel: hair.naturalLevel, greyPercent: 0 },
    eye: { lab: swatchLab(eye) },
    source: 'manual' as const,
    confidence,
  };
}

function fixtureWith(warning: 'low-confidence' | 'conflicting-signals') {
  const fixture = golden.find(({ expected }) => expected.warnings.includes(warning));
  if (!fixture) throw new Error(`Missing ${warning} fixture`);
  return fixture;
}

describe('result uncertainty', () => {
  it('renders the low-confidence warning as prominent result text', () => {
    const result = resolveColoring(fixtureWith('low-confidence').input);
    const html = renderToStaticMarkup(<Result result={result} />);
    expect(html).toContain('This is not a reliable answer');
    expect(html).toContain('This is only a suggestion');
    expect(html).toContain(result.warnings.find(({ code }) => code === 'low-confidence')!.message);
  });

  it('renders every unreliable-result warning instead of burying it', () => {
    const result = resolveColoring(fixtureWith('conflicting-signals').input);
    const html = renderToStaticMarkup(<Result result={result} />);
    expect(html).toContain('This is not a reliable answer');
    for (const warning of result.warnings) expect(html).toContain(warning.message);
    expect(html).toContain('What would settle this');
  });
});

describe('result honesty for a capped but unwarned answer', () => {
  it('offers the side-by-side next step when the self-reported cap is the only limit', () => {
    const result = resolveColoring(chosenInput('monk-8', 'blond', 'iris-chestnut', 0.45));
    expect(result.warnings).toEqual([]);
    expect(result.colorSeason.confidence).toEqual({ basis: 'self-reported-input-confidence', value: 0.45 });
    const html = renderToStaticMarkup(<Result result={result} />);
    expect(html).toContain('What would settle this');
  });
});

describe('skin-to-hair contrast reporting', () => {
  it('qualifies the contrast level with the reference mismatch that produces it', () => {
    const result = resolveColoring(chosenInput('monk-1', 'blond', 'iris-chestnut', 0.8));
    expect(result.contrastLevel).toBe('high');
    const html = renderToStaticMarkup(<Result result={result} />);
    expect(html).toContain('Skin-to-hair contrast');
    expect(html).toContain('measured under a different geometry than the skin references');
  });
});
