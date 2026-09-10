import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { expect, it } from 'vitest';
import { resolvePython } from '../scripts/python-environment.mjs';

const setupMessage =
  'Python environment missing for the palette derivation. Run: python3 -m venv .venv && .venv/bin/pip install -r scripts/requirements.txt';

it('returns the virtualenv interpreter when the project has one', () => {
  const root = mkdtempSync(resolve('.python-environment-'));
  const python = join(root, '.venv/bin/python');
  try {
    mkdirSync(join(root, '.venv/bin'), { recursive: true });
    writeFileSync(python, '');
    chmodSync(python, 0o755);

    expect(resolvePython(root)).toEqual({ python });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it('names the setup command when the project has no virtualenv interpreter', () => {
  const root = mkdtempSync(resolve('.python-environment-'));
  try {
    expect(resolvePython(root)).toEqual({ message: setupMessage });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
