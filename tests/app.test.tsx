import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Result } from '../src/app';
import { resolveColoring } from '../src/resolver';
import golden from './fixtures/resolver-golden.json';

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
