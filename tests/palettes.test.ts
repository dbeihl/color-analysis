import { converter, differenceCiede2000, displayable } from 'culori';
import { describe, expect, it, vi } from 'vitest';
import { COLOR_SEASON_IDS, PALETTE_ROLES, type ColorSeason, type PaletteEntry } from '../src/domain/types';
import { colorSeasons, loadSeasons } from '../src/knowledge/load';
import { colorSeasonSchema } from '../src/knowledge/schemas/seasons';
import malformed from './fixtures/malformed-seasons.json';

const lch65 = converter('lch65');
const rgb = converter('rgb');
const swatchDistance = differenceCiede2000();
const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
const stats = (entry: ColorSeason) => ({
  value: mean(entry.palette.map(({ lab }) => lab.l)),
  chroma: mean(entry.palette.map(({ lab }) => lch65(lab).c)),
  hue: mean(entry.palette.map(({ lab }) => Math.cos(((lch65(lab).h ?? 0) - 60) * Math.PI / 180))),
});

function assertAxes(entries: ColorSeason[]) {
  for (const entry of entries) {
    expect(Math.sign(stats(entry).hue), `${entry.id}: declared warmth`).toBe(Math.sign(entry.axes.hue));
    for (const other of entries) {
      if (entry.axes.value < other.axes.value) {
        expect(stats(entry).value, `${entry.id} should be darker than ${other.id}`).toBeLessThan(stats(other).value);
      }
      if (entry.family === other.family && entry.axes.chroma < other.axes.chroma) {
        expect(stats(entry).chroma, `${entry.id} should be less chromatic than ${other.id}`).toBeLessThan(stats(other).chroma);
      }
    }
  }
}

function reportNeutralPairings(palette: PaletteEntry[], label: string) {
  const neutrals = palette.filter((entry) => entry.role === 'base-neutral');
  const accents = palette.filter((entry) => entry.role === 'accent');
  const belowThree = accents.filter((accent) =>
    neutrals.filter((neutral) => swatchDistance(accent.lab, neutral.lab) >= 10).length < 3,
  ).length;
  const message = `${label}: ${neutrals.length} base neutrals; ${belowThree}/${accents.length} accents below three pairings (CIEDE2000 >= 10; folk heuristic only)`;
  if (belowThree) console.warn(message);
  else console.info(message);
}

describe('knowledge load contract', () => {
  it('loads exactly the twelve color seasons and validates every palette', () => {
    expect(colorSeasons.map((entry) => entry.id).sort()).toEqual([...COLOR_SEASON_IDS].sort());
    for (const entry of colorSeasons) {
      expect(colorSeasonSchema.parse(entry)).toEqual(entry);
      expect(entry.palette.length).toBeGreaterThanOrEqual(40);
      expect(new Set(entry.palette.map((swatch) => swatch.role))).toEqual(new Set(PALETTE_ROLES));
      const labs = entry.palette.map(({ lab }) => JSON.stringify(lab));
      expect(new Set(labs).size).toBe(labs.length);
      for (const swatch of entry.palette) {
        expect(displayable(swatch.lab)).toBe(true);
        for (const channel of ['r', 'g', 'b'] as const) {
          const value = rgb(swatch.lab)[channel];
          expect(Number.isFinite(value)).toBe(true);
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it('throws for a deliberately malformed knowledge file', () => {
    expect(() => loadSeasons(malformed)).toThrow();
  });

  it('fails at module import when the JSON is malformed', async () => {
    vi.resetModules();
    vi.doMock('../src/knowledge/seasons.json', () => ({ default: malformed }));
    try {
      await expect(import('../src/knowledge/load')).rejects.toThrow();
    } finally {
      vi.doUnmock('../src/knowledge/seasons.json');
      vi.resetModules();
    }
  });

  it.each(['duplicate', 'role', 'gamut', 'neighbor', 'extra-field'] as const)('rejects %s corruption', (kind) => {
    const changed = structuredClone(colorSeasons);
    const first = changed[0]!;
    if (kind === 'duplicate') first.palette[1]!.lab = first.palette[0]!.lab;
    if (kind === 'role') first.palette.forEach((entry) => { if (entry.role === 'metal') entry.role = 'accent'; });
    if (kind === 'gamut') first.palette[0]!.lab.a = 200;
    if (kind === 'neighbor') first.neighbors = [first.id];
    if (kind === 'extra-field') Object.assign(first, { unexpected: 'spring' });
    expect(() => loadSeasons(changed)).toThrow();
  });
});

it('reflects declared value, chroma and warmth axes across palettes', () => {
  assertAxes(colorSeasons);
});

it('detects substituted lightness, chroma and hue data', () => {
  for (const channel of ['value', 'chroma', 'hue'] as const) {
    const changed = structuredClone(colorSeasons);
    const low = changed.reduce((a, b) => a.axes[channel] < b.axes[channel] ? a : b);
    const high = changed.reduce((a, b) => a.axes[channel] > b.axes[channel] ? a : b);
    for (const entry of changed) {
      if (entry.axes[channel] < high.axes[channel]) entry.palette = structuredClone(high.palette);
    }
    expect(() => assertAxes(changed), `substituted ${channel} in ${low.id}`).toThrow();
  }
});

it('reports neutral pairing coverage without rejecting a palette', () => {
  for (const entry of colorSeasons) reportNeutralPairings(entry.palette, entry.id);
});

it('warns, without throwing, when the folk heuristic falls short', () => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const accentsOnly = colorSeasons[0]!.palette.filter((entry) => entry.role === 'accent');
    expect(accentsOnly.length).toBeGreaterThan(0);
    expect(() => reportNeutralPairings(accentsOnly, 'negative control')).not.toThrow();
    expect(warning).toHaveBeenCalledOnce();
    expect(warning.mock.calls[0]![0]).toContain('0 base neutrals; 24/24 accents below three pairings');
  } finally {
    warning.mockRestore();
  }
});
