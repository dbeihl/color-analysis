import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { expect, it } from 'vitest';
import { resolvePython } from '../scripts/python-environment.mjs';

const setupMessage =
  'Python environment missing for the palette derivation. Run: python3 -m venv .venv && .venv/bin/pip install -r scripts/requirements.txt';

const importingInterpreter = `#!/bin/sh
[ "$1" = "-c" ] && [ "$2" = "import colour, numpy" ] && exit 0
exit 1
`;

const failingInterpreter = `#!/bin/sh
echo "ModuleNotFoundError: No module named 'colour'" >&2
exit 1
`;

function projectWithInterpreter(interpreter: string) {
  const root = mkdtempSync(resolve('.python-environment-'));
  const python = join(root, '.venv/bin/python');
  mkdirSync(join(root, '.venv/bin'), { recursive: true });
  writeFileSync(python, interpreter);
  chmodSync(python, 0o755);
  return { root, python };
}

it('returns the virtualenv interpreter when it can import the derivation modules', () => {
  const { root, python } = projectWithInterpreter(importingInterpreter);
  try {
    expect(resolvePython(root)).toEqual({ python });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it('names the setup command when the interpreter cannot import the derivation modules', () => {
  const { root } = projectWithInterpreter(failingInterpreter);
  try {
    expect(resolvePython(root, {})).toEqual({ message: setupMessage, fatal: false });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it('names the setup command when the project has no virtualenv interpreter', () => {
  const root = mkdtempSync(resolve('.python-environment-'));
  try {
    expect(resolvePython(root, {})).toEqual({ message: setupMessage, fatal: false });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it('makes the missing environment fatal in CI and skippable outside it', () => {
  const root = mkdtempSync(resolve('.python-environment-'));
  try {
    expect(resolvePython(root, { CI: 'true' })).toEqual({ message: setupMessage, fatal: true });
    expect(resolvePython(root, {})).toEqual({ message: setupMessage, fatal: false });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
