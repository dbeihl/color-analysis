import { spawnSync } from 'node:child_process';
import { accessSync, constants } from 'node:fs';
import { join } from 'node:path';

export const pythonSetupCommand =
  'python3.13 -m venv .venv && .venv/bin/pip install -r scripts/requirements.txt';

export function resolvePython(projectRoot) {
  const python = join(projectRoot, '.venv', 'bin', 'python');
  const missing = {
    message: `Python environment missing for the palette derivation. Run: ${pythonSetupCommand}`,
  };
  try {
    accessSync(python, constants.X_OK);
  } catch {
    return missing;
  }
  const probe = spawnSync(python, ['-c', 'import colour, numpy'], { stdio: 'ignore' });
  return probe.status === 0 ? { python } : missing;
}
