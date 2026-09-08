import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const workflow = readFileSync(process.argv[2] ?? '.github/workflows/commit-identity.yml', 'utf8');
const block = workflow.match(/^        run: \|\n((?:          .*\n|\n)+)/m);
assert.ok(block, 'Workflow check shell block must exist');
const shell = block[1].replace(/^          /gm, '');
const allowed = '51423378+dbeihl@users.noreply.github.com';
const wrong = 'developer@work.example';
mkdirSync('.work', { recursive: true });
const cwd = mkdtempSync(resolve('.work/identity-proof-'));
const env = { ...process.env, GIT_AUTHOR_NAME: 'Fixture', GIT_COMMITTER_NAME: 'Fixture',
  GIT_AUTHOR_EMAIL: allowed, GIT_COMMITTER_EMAIL: allowed };
function git(args, extra = {}, input) {
  const result = spawnSync('git', args, { cwd, env: { ...env, ...extra }, input, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}
function commit(parents, author = allowed, committer = allowed) {
  return git(['commit-tree', tree, ...parents.flatMap(parent => ['-p', parent]), '-m', 'Identity fixture'],
    { GIT_AUTHOR_EMAIL: author, GIT_COMMITTER_EMAIL: committer });
}
let tree;
try {
  git(['init', '--quiet']);
  tree = git(['mktree'], {}, '');
  const base = commit([]);
  const side = commit([base]);
  git(['update-ref', 'refs/remotes/origin/main', base]);
  const cases = [
    ['ordinary personal commit', [side], allowed, allowed, 0],
    ['GitHub merge', [base, side], allowed, 'noreply@github.com', 0],
    ['wrong ordinary author', [side], wrong, allowed, 1, 'author', wrong],
    ['wrong merge author', [base, side], wrong, 'noreply@github.com', 1, 'author', wrong],
    ['ordinary GitHub committer', [side], allowed, 'noreply@github.com', 1, 'committer', 'noreply@github.com'],
    ['wrong merge committer', [base, side], allowed, wrong, 1, 'committer', wrong],
  ];
  for (const [label, parents, author, committer, expected, field, email] of cases) {
    const sha = commit(parents, author, committer);
    for (const event of ['push', 'pull_request']) {
      const script = shell.replaceAll('${{ github.event_name }}', event)
        .replaceAll('${{ github.base_ref }}', 'main')
        .replaceAll('${{ github.event.pull_request.head.sha }}', sha);
      const result = spawnSync('bash', ['--noprofile', '--norc', '-e', '-o', 'pipefail', '-c', script],
        { cwd, env: { ...env, BEFORE: base, AFTER: sha }, encoding: 'utf8' });
      console.log(`${label} (${event}): exit ${result.status}`);
      if (result.stdout) process.stdout.write(result.stdout);
      assert.equal(result.status, expected, result.stderr);
      assert.equal(result.stdout, expected === 0 ? '' :
        `Commit ${sha} has ${field} email '${email}', expected '${allowed}'\n`);
    }
  }
} finally {
  rmSync(cwd, { recursive: true, force: true });
}
