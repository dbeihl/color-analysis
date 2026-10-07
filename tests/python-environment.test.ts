import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { expect, it } from 'vitest';
import { macosScipyLoadGap, resolvePython } from '../scripts/python-environment.mjs';

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

const dlopenFailure = {
  stderr:
    "ImportError: dlopen(/venv/lib/python3.12/site-packages/scipy/sparse/linalg/_propack/_spropack.cpython-312-darwin.so, 0x0002): tried: '/venv/lib/python3.12/site-packages/scipy/sparse/linalg/_propack/_spropack.cpython-312-darwin.so' (section '__DATA/__thread_bss' has a zero-fill section type, but offset field is not zero)",
};

const macos = (productVersion: string) => ({
  platform: 'darwin',
  ci: false,
  productVersion: () => productVersion,
});

it('reports the SciPy dlopen gap on macOS 27 and later, naming the failure and CI', () => {
  for (const version of ['27.0', '28.1']) {
    const reason = macosScipyLoadGap(dlopenFailure, macos(version));
    expect(reason).toContain('dlopen');
    expect(reason).toContain('zero-fill section type');
    expect(reason).toContain('CI still runs this test');
  }
});

it('does not report a gap below macOS 27, off macOS, or in CI', () => {
  expect(macosScipyLoadGap(dlopenFailure, macos('26.4'))).toBeUndefined();
  expect(macosScipyLoadGap(dlopenFailure, { ...macos('27.0'), platform: 'linux' })).toBeUndefined();
  expect(macosScipyLoadGap(dlopenFailure, { ...macos('27.0'), ci: true })).toBeUndefined();
});

it('does not report a gap for any other failure on macOS 27', () => {
  const other = [
    new Error('seasons.json differs from pinned Munsell derivation'),
    { stderr: "ImportError: dlopen(/venv/scipy/x.so): Library not loaded: libgfortran.5.dylib" },
    { stderr: "ImportError: dlopen(/venv/numpy/x.so): (section '__DATA/__thread_bss' has a zero-fill section type, but offset field is not zero)" },
    undefined,
  ];
  for (const error of other) {
    expect(macosScipyLoadGap(error, macos('27.0'))).toBeUndefined();
  }
});
