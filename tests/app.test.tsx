import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App, Result } from '../src/app';
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
    expect(html).toContain('Use this as a starting point');
    expect(html).toContain(result.warnings.find(({ code }) => code === 'low-confidence')!.message);
  });

  it('renders every unreliable-result warning instead of burying it', () => {
    const result = resolveColoring(fixtureWith('conflicting-signals').input);
    const html = renderToStaticMarkup(<Result result={result} />);
    expect(html).toContain('This is not a reliable answer');
    for (const warning of result.warnings) expect(html).toContain(warning.message);
    expect(html).toContain('What would settle this');
    expect(html).toContain('A contradiction produced this percentage: a palette the system treats as incompatible scored just as well, so this is an unreliable answer. It is not a chance of being right about you.');
    expect(html).not.toMatch(/confidence/i);
  });
});

describe('result honesty for a capped but unwarned answer', () => {
  it('offers the side-by-side next step when the self-reported cap is the only limit', () => {
    const result = resolveColoring(chosenInput('monk-8', 'blond', 'iris-chestnut', 0.45));
    expect(result.warnings).toEqual([]);
    const html = renderToStaticMarkup(<Result result={result} />);
    expect(html).toContain('What would settle this');
    expect(html).toContain('Your own stated certainty about the swatch matches produced this percentage. It is not a measurement of the palettes or a chance of being right about you.');
    expect(html).not.toMatch(/confidence/i);
  });
});

describe('score separation reporting', () => {
  it('explains score separation when the closest palette scores determine it', () => {
    const result = resolveColoring(golden.find(({ id }) => id === 'monk-6-dark-red-green')!.input);
    const html = renderToStaticMarkup(<Result result={result} />);

    expect(html).toContain('Score separation');
    expect(html).toContain('The gap between the two closest palette scores produced this percentage. It is not a chance of being right about you.');
    expect(html).not.toMatch(/confidence/i);
  });
});

describe('skin-to-hair contrast reporting', () => {
  it('describes numeric contrast and limits the season claim without promising repairs', () => {
    const result = resolveColoring(chosenInput('monk-1', 'blond', 'iris-chestnut', 0.8));
    expect(result.contrastLevel).toBe('high');
    const html = renderToStaticMarkup(<Result result={result} />);
    expect(html).toContain('Skin-to-hair contrast');
    expect(html).toContain('This is the numeric lightness gap between the two references you chose, and it is not a reading of how you look.');
    expect(html).toContain('The result is the nearest match among twelve designed palette recipes. The recipes are a widely taught convention, not twelve natural kinds of people.');
    expect(html).not.toContain('being worked on');
    expect(html).not.toContain('measured under a different geometry');
  });
});

describe('swatch to engine input wiring', () => {
  it('carries each chosen swatch into its own field of the engine input', () => {
    const input = chosenInput('monk-4', 'red', 'iris-golden-brown', 0.45, 15);

    expect(input.skin.lab.mode).toBe('lab65');
    expect(input.skin.lab.l).toBeCloseTo(87.5728906, 5);
    expect(input.skin.lab.a).toBeCloseTo(0.4587482, 5);
    expect(input.skin.lab.b).toBeCloseTo(17.7549651, 5);
    expect(input.skin.monkBand).toBe(4);

    expect(input.hair.lab.mode).toBe('lab65');
    expect(input.hair.lab.l).toBeCloseTo(22.49, 5);
    expect(input.hair.lab.a).toBeCloseTo(9.6, 5);
    expect(input.hair.lab.b).toBeCloseTo(12.13, 5);
    expect(input.hair.naturalLevel).toBe(4);
    expect(input.hair.greyPercent).toBe(15);

    expect(input.eye.lab.mode).toBe('lab65');
    expect(input.eye.lab.l).toBeCloseTo(36.5824913, 5);
    expect(input.eye.lab.a).toBeCloseTo(17.9701220, 5);
    expect(input.eye.lab.b).toBeCloseTo(24.7306649, 5);

    expect(input.source).toBe('manual');
    expect(input.confidence).toBe(0.45);
  });
});

describe('the settle-this next step', () => {
  it('offers the next step at an unwarned result that previously reached the threshold', () => {
    const result = resolveColoring(chosenInput('monk-8', 'blond', 'iris-chestnut', 0.5));
    expect(result.warnings).toEqual([]);
    const html = renderToStaticMarkup(<Result result={result} />);
    expect(html).toContain('50%');
    expect(html).toContain('What would settle this');
  });

});

describe('form framing', () => {
  it('describes the result as a palette-recipe match rather than a season someone has', () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain('The resolver will find the nearest match among twelve designed palette recipes, show its score separation honestly, and put its palette in comparison order.');
  });
});
