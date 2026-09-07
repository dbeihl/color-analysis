import { displayable } from 'culori';
import { z } from 'zod';
import { COLOR_SEASON_IDS, PALETTE_ROLES } from '../../domain/types';

const axis = z.number().finite().min(-1).max(1);
const colorSeasonId = z.enum(COLOR_SEASON_IDS);
const hueFamily = z.enum(['R', 'YR', 'Y', 'GY', 'G', 'BG', 'B', 'PB', 'P', 'RP']);
const interval = z.tuple([z.number().finite(), z.number().finite()])
  .refine(([low, high]) => low <= high, 'Region interval is reversed');

export const labSchema = z.strictObject({
  mode: z.literal('lab65'),
  l: z.number().finite().min(0).max(100),
  a: z.number().finite(),
  b: z.number().finite(),
}).refine(displayable, 'CIELAB D65 value is outside sRGB gamut');

export const paletteEntrySchema = z.strictObject({
  lab: labSchema,
  role: z.enum(PALETTE_ROLES),
  nearFace: z.boolean(),
  name: z.string().trim().min(1),
  munsell: z.strictObject({
    hue: z.string().regex(/^(2\.5|5|7\.5|10)(R|YR|Y|GY|G|BG|B|PB|P|RP)$/),
    value: z.number().int().min(1).max(9),
    chroma: z.number().int().positive().multipleOf(2),
  }),
});

export const colorSeasonSchema = z.strictObject({
  id: colorSeasonId,
  family: z.enum(['spring', 'summer', 'autumn', 'winter']),
  dominant: z.enum(['hue', 'value', 'chroma']),
  axes: z.strictObject({ hue: axis, value: axis, chroma: axis }),
  region: z.strictObject({
    hueFamilies: z.array(hueFamily).min(1),
    value: interval.refine(([low, high]) => low >= 1 && high <= 9),
    chroma: interval.refine(([low]) => low > 0),
  }),
  neighbors: z.array(colorSeasonId).min(1),
  sources: z.array(z.string().trim().min(1)).min(1),
  palette: z.array(paletteEntrySchema).min(40),
}).superRefine((entry, ctx) => {
  const issue = (message: string) => ctx.addIssue({ code: 'custom', message });
  if (!entry.id.endsWith(`-${entry.family}`)) issue('ID and family disagree');
  if (entry.neighbors.includes(entry.id)) issue('Self neighbor');
  if (new Set(entry.neighbors).size !== entry.neighbors.length) issue('Duplicate neighbor');
  const roles = new Set(entry.palette.map((swatch) => swatch.role));
  if (PALETTE_ROLES.some((role) => !roles.has(role))) issue('Missing palette role');
  const colors = entry.palette.map(({ lab }) => JSON.stringify([lab.l, lab.a, lab.b]));
  if (new Set(colors).size !== colors.length) issue('Duplicate palette color');
});

export const seasonsSchema = z.array(colorSeasonSchema).length(12).superRefine((entries, ctx) => {
  if (new Set(entries.map((entry) => entry.id)).size !== COLOR_SEASON_IDS.length) {
    ctx.addIssue({ code: 'custom', message: 'Expected each of the twelve color seasons once' });
  }
  for (const entry of entries) {
    for (const neighbor of entry.neighbors) {
      if (!entries.find((candidate) => candidate.id === neighbor)?.neighbors.includes(entry.id)) {
        ctx.addIssue({ code: 'custom', message: `Nonreciprocal neighbor: ${entry.id}/${neighbor}` });
      }
    }
  }
});
