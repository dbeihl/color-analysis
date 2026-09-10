import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { expect, it } from 'vitest';
import { resolvePython } from '../scripts/python-environment.mjs';

const setupMessage =
  'Python environment missing. Run: python3.13 -m venv .venv && .venv/bin/pip install -r scripts/requirements.txt';

function projectWithInterpreter(interpreter: string) {
  const root = mkdtempSync(resolve('.python-environment-'));
  const python = join(root, '.venv/bin/python');
  mkdirSync(join(root, '.venv/bin'), { recursive: true });
  writeFileSync(python, interpreter);
  chmodSync(python, 0o755);
  return { root, python };
}

it('returns the virtualenv interpreter when it can import the derivation modules', () => {
  const { root, python } = projectWithInterpreter('#!/bin/sh\nexit 0\n');
  try {
    expect(resolvePython(root)).toEqual({ python });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

it('names the setup command when the interpreter cannot import the derivation modules', () => {
  const { root } = projectWithInterpreter(
    '#!/bin/sh\necho "ModuleNotFoundError: No module named \'colour\'" >&2\nexit 1\n',
  );
  try {
    expect(resolvePython(root)).toEqual({ message: setupMessage });
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
