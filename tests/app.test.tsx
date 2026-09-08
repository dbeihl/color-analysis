import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Result } from '../src/app';
import { inputSwatches, toColoringInput } from '../src/input-swatches';
import { resolveColoring } from '../src/resolver';
import golden from './fixtures/resolver-golden.json';

function chosenInput(skinId: string, hairId: string, eyeId: string, confidence: number, greyPercent = 0) {
  return toColoringInput(
    inputSwatches.skin.find(({ id }) => id === skinId)!,
    inputSwatches.hair.find(({ id }) => id === hairId)!,
    inputSwatches.eye.find(({ id }) => id === eyeId)!,
    greyPercent,
    confidence,
  );
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

describe('swatch to engine input wiring', () => {
  it('carries each chosen swatch into its own field of the engine input', () => {
    expect(chosenInput('monk-4', 'red', 'iris-golden-brown', 0.45, 15)).toEqual({
      skin: {
        lab: { mode: 'lab65', l: 87.57289058219384, a: 0.45874815480295705, b: 17.754965146835477 },
        monkBand: 4,
      },
      hair: {
        lab: { mode: 'lab65', l: 22.49, a: 9.6, b: 12.13 },
        naturalLevel: 4,
        greyPercent: 15,
      },
      eye: {
        lab: { mode: 'lab65', l: 36.582491318844475, a: 17.97012199365902, b: 24.730664922635846 },
      },
      source: 'manual',
      confidence: 0.45,
    });
  });
});

describe('the settle-this threshold', () => {
  it('withholds the next step once an unwarned answer reaches the threshold', () => {
    const result = resolveColoring(chosenInput('monk-8', 'blond', 'iris-chestnut', 0.5));
    expect(result.warnings).toEqual([]);
    expect(result.colorSeason.confidence.value).toBe(0.5);
    expect(renderToStaticMarkup(<Result result={result} />)).not.toContain('What would settle this');
  });

  it('offers the next step just below the threshold', () => {
    const result = resolveColoring(chosenInput('monk-8', 'blond', 'iris-chestnut', 0.49));
    expect(result.warnings).toEqual([]);
    expect(result.colorSeason.confidence.value).toBe(0.49);
    expect(renderToStaticMarkup(<Result result={result} />)).toContain('What would settle this');
  });

  it('offers the next step for a confident answer that still carries a warning', () => {
    const result = resolveColoring(fixtureWith('conflicting-signals').input);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(renderToStaticMarkup(<Result result={result} />)).toContain('What would settle this');
  });
});
