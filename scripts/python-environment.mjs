import { accessSync, constants } from 'node:fs';
import { join } from 'node:path';

export const pythonSetupCommand =
  'python3.13 -m venv .venv && .venv/bin/pip install -r scripts/requirements.txt';

export function resolvePython(projectRoot) {
  const python = join(projectRoot, '.venv', 'bin', 'python');
  try {
    accessSync(python, constants.X_OK);
    return { python };
  } catch {
    return { message: `Python environment missing. Run: ${pythonSetupCommand}` };
  }
}
