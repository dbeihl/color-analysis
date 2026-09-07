import { readFileSync } from 'node:fs';
import { converter, displayable } from 'culori';

const lab65 = converter('lab65');
const rgb = converter('rgb');
const samples = JSON.parse(readFileSync(0, 'utf8'));
const converted = samples.map(({ munsell, xyz }) => {
  const color = lab65({ mode: 'xyz65', x: xyz[0], y: xyz[1], z: xyz[2] });
  const lab = Object.fromEntries(Object.entries(color).map(([key, value]) =>
    [key, typeof value === 'number' ? Number(value.toFixed(6)) : value],
  ));
  return { munsell, lab, inGamut: displayable(rgb(lab)) };
});
process.stdout.write(JSON.stringify(converted));
