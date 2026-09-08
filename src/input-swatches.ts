import { converter, formatHex } from 'culori';
import type { Lab } from './domain/types';

export interface InputSwatch {
  id: string;
  name: string;
  hex?: string;
  lab?: Lab;
  monkBand?: number;
  naturalLevel?: number;
}

const toLab65 = converter('lab65');
const toRgb = converter('rgb');

const skinReferences: Array<[string, string, string]> = [
  ['monk-1', 'Monk 1', '#f6ede4'],
  ['monk-2', 'Monk 2', '#f3e7db'],
  ['monk-3', 'Monk 3', '#f7ead0'],
  ['monk-4', 'Monk 4', '#eadaba'],
  ['monk-5', 'Monk 5', '#d7bd96'],
  ['monk-6', 'Monk 6', '#a07e56'],
  ['monk-7', 'Monk 7', '#825c43'],
  ['monk-8', 'Monk 8', '#604134'],
  ['monk-9', 'Monk 9', '#3a312a'],
  ['monk-10', 'Monk 10', '#292420'],
];

const hairReferences: Array<[string, string, number, number, number, number]> = [
  ['black', 'Black', 11.5, 4.08, -0.19, 1],
  ['dark-brown', 'Dark brown', 14.55, 2.52, 3.66, 2],
  ['medium-brown', 'Medium brown', 18.58, 4.02, 6.75, 3],
  ['light-brown', 'Light brown', 24.87, 3.21, 7.38, 5],
  ['dark-blond', 'Dark blond', 25.84, 4.22, 5.98, 6],
  ['blond', 'Blond', 42.06, 5.28, 12.7, 8],
  ['strawberry-blond', 'Strawberry blond', 37.8, 7.71, 17.09, 7],
  ['red', 'Red', 22.49, 9.6, 12.13, 4],
];

const eyeReferences: Array<[string, string, string]> = [
  ['iris-near-black', 'Near-black brown', '#1b120b'],
  ['iris-dark-brown', 'Dark brown', '#281b12'],
  ['iris-brown', 'Brown', '#39261a'],
  ['iris-warm-brown', 'Warm brown', '#513020'],
  ['iris-golden-brown', 'Golden brown', '#7b4a2f'],
  ['iris-light-brown', 'Light brown', '#925e42'],
  ['iris-chestnut', 'Chestnut', '#683b22'],
  ['iris-muted-brown', 'Muted brown', '#624a46'],
];

export const inputSwatches = {
  skin: skinReferences.map(([id, name, hex], index) => ({ id, name, hex, monkBand: index + 1 })),
  hair: hairReferences.map(([id, name, l, a, b, naturalLevel]) => ({
    id,
    name,
    lab: { mode: 'lab65' as const, l, a, b },
    naturalLevel,
  })),
  eye: eyeReferences.map(([id, name, hex]) => ({ id, name, hex })),
} satisfies Record<'skin' | 'hair' | 'eye', InputSwatch[]>;

export function swatchLab(swatch: InputSwatch): Lab {
  if (swatch.lab) return swatch.lab;
  const color = swatch.hex ? toLab65(swatch.hex) : undefined;
  if (!color || color.mode !== 'lab65') throw new Error(`Missing Lab value for ${swatch.id}`);
  return { mode: 'lab65', l: color.l, a: color.a, b: color.b };
}

export function swatchHex(swatch: InputSwatch) {
  if (swatch.hex) return swatch.hex;
  const color = swatch.lab ? toRgb(swatch.lab) : undefined;
  if (!color) throw new Error(`Missing display value for ${swatch.id}`);
  return formatHex(color);
}
