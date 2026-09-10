import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

export const pythonSetupCommand =
  'python3 -m venv .venv && .venv/bin/pip install -r scripts/requirements.txt';

export function resolvePython(projectRoot, env = process.env) {
  const python = join(projectRoot, '.venv', 'bin', 'python');
  const probe = spawnSync(python, ['-c', 'import colour, numpy'], { stdio: 'ignore' });
  if (probe.status === 0) {
    return { python };
  }
  return {
    message: `Python environment missing for the palette derivation. Run: ${pythonSetupCommand}`,
    fatal: Boolean(env.CI),
  };
}
