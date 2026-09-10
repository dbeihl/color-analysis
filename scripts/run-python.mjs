import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { resolvePython } from './python-environment.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const result = resolvePython(projectRoot);

if ('message' in result) {
  console.error(result.message);
  process.exitCode = 1;
} else {
  const child = spawnSync(result.python, process.argv.slice(2), {
    cwd: projectRoot,
    stdio: 'inherit',
  });
  process.exitCode = child.status ?? 1;
}
