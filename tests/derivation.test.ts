import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { expect, it } from 'vitest';
import { colorSeasons } from '../src/knowledge/load';
import references from './fixtures/colour-reference.json';

const python = resolve('.venv/bin/python');
const script = resolve('scripts/derive-palettes.py');

it('matches independent Colour C-to-D65 CIELAB reference fixtures', () => {
  for (const reference of references) {
    const swatch = colorSeasons.flatMap((entry) => entry.palette).find((entry) =>
      entry.munsell.hue === reference.munsell.hue &&
      entry.munsell.value === reference.munsell.value &&
      entry.munsell.chroma === reference.munsell.chroma,
    );
    expect(swatch).toBeDefined();
    for (const [index, channel] of ['l', 'a', 'b'].entries()) {
      expect(swatch!.lab[channel as 'l' | 'a' | 'b']).toBeCloseTo(reference.lab65[index]!, 4);
    }
  }
});

it('reproduces every swatch twice from the pinned source and detects edited output', () => {
  const directory = mkdtempSync(resolve('.palette-test-'));
  const output = join(directory, 'seasons.json');
  try {
    execFileSync(python, [script, '--output', output], { encoding: 'utf8' });
    const first = readFileSync(output);
    expect(first.equals(readFileSync(resolve('src/knowledge/seasons.json')))).toBe(true);
    execFileSync(python, [script, '--output', output], { encoding: 'utf8' });
    expect(readFileSync(output).equals(first)).toBe(true);
    const corrupted = JSON.parse(first.toString());
    corrupted[0].palette[0].lab.l += 0.01;
    writeFileSync(output, JSON.stringify(corrupted, null, 2) + '\n');
    expect(() => execFileSync(python, [script, '--check', '--output', output], {
      encoding: 'utf8', stdio: 'pipe',
    })).toThrow('seasons.json differs from pinned Munsell derivation');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}, 180_000);
