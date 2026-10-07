import { execFileSync } from 'node:child_process';
import { accessSync, constants } from 'node:fs';
import { join } from 'node:path';

const pythonSetupCommand =
  'python3 -m venv .venv && .venv/bin/pip install -r scripts/requirements.txt';

const scipyDlopenFailure =
  /ImportError: dlopen\([^\n]*scipy[^\n]*__thread_bss' has a zero-fill section type, but offset field is not zero/;

export function resolvePython(projectRoot) {
  const python = join(projectRoot, '.venv', 'bin', 'python');
  try {
    accessSync(python, constants.X_OK);
    return { python };
  } catch {
    return {
      message: `Python environment missing for the palette derivation. Run: ${pythonSetupCommand}`,
    };
  }
}

function macosProductVersion() {
  return execFileSync('sw_vers', ['-productVersion'], { encoding: 'utf8' }).trim();
}

export function macosScipyLoadGap(
  error,
  {
    platform = process.platform,
    ci = Boolean(process.env.CI),
    productVersion = macosProductVersion,
  } = {},
) {
  if (platform !== 'darwin' || ci) {
    return undefined;
  }
  const output = `${error?.stderr ?? ''}\n${error?.message ?? ''}`;
  if (!scipyDlopenFailure.test(output)) {
    return undefined;
  }
  const major = Number.parseInt(productVersion(), 10);
  if (!(major >= 27)) {
    return undefined;
  }
  return 'SciPy cannot load on macOS 27 and later (dlopen fails: __DATA/__thread_bss has a zero-fill section type, but offset field is not zero); known upstream gap, CI still runs this test.';
}
