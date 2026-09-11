import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const workflow = readFileSync(process.argv[2] ?? '.github/workflows/commit-identity.yml', 'utf8');
const block = workflow.match(/^        run: \|\n((?:          .*\n|\n)+)/m);
assert.ok(block, 'Workflow check shell block must exist');
const shell = block[1].replace(/^          /gm, '');
const domain = 'utilicast.com';
const work = `nobody@${domain}`;
const personal = '51423378+dbeihl@users.noreply.github.com';
const outside = 'contributor@example.com';
const github = 'noreply@github.com';
mkdirSync('.work', { recursive: true });
const cwd = mkdtempSync(resolve('.work/identity-proof-'));
const env = { ...process.env, GIT_AUTHOR_NAME: 'Fixture', GIT_COMMITTER_NAME: 'Fixture',
  GIT_AUTHOR_EMAIL: personal, GIT_COMMITTER_EMAIL: personal };
function git(args, extra = {}, input) {
  const result = spawnSync('git', args, { cwd, env: { ...env, ...extra }, input, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}
function commit(parents, author = personal, committer = personal) {
  return git(['commit-tree', tree, ...parents.flatMap(parent => ['-p', parent]), '-m', 'Identity fixture'],
    { GIT_AUTHOR_EMAIL: author, GIT_COMMITTER_EMAIL: committer });
}
function check(label, event, head, before, failures, preamble = '') {
  const script = shell.replaceAll('${{ github.event_name }}', event)
    .replaceAll('${{ github.base_ref }}', 'main')
    .replaceAll('${{ github.event.pull_request.head.sha }}', head);
  const result = spawnSync('bash', ['--noprofile', '--norc', '-e', '-o', 'pipefail', '-c', script],
    { cwd, env: { ...env, BEFORE: before, AFTER: head }, encoding: 'utf8' });
  console.log(`${label} (${event}): exit ${result.status}`);
  if (result.stdout) process.stdout.write(result.stdout);
  assert.equal(result.status, failures.length ? 1 : 0, result.stderr);
  assert.equal(result.stdout, preamble + failures.map(([field, email]) =>
    `Commit ${head} has ${field} email '${email}' at the maintainer's work domain ${domain}\n`).join(''));
}
let tree;
try {
  git(['init', '--quiet']);
  tree = git(['mktree'], {}, '');
  const base = commit([]);
  const side = commit([base]);
  git(['update-ref', 'refs/remotes/origin/main', base]);
  const cases = [
    ['maintainer commit with the work address', [[work, personal]], [['author', work]]],
    ['work address as committer only', [[personal, work]], [['committer', work]]],
    ['work address in upper case', [[work.toUpperCase(), personal]], [['author', work.toUpperCase()]]],
    ['work address at a subdomain', [[`nobody@mail.${domain}`, personal]], [['author', `nobody@mail.${domain}`]]],
    ['contributor with their own address', [[outside, outside]]],
    ['address with the work domain inside another host', [[`nobody@${domain}.example.org`, personal]]],
    ['address at a look-alike domain', [[`nobody@not${domain}`, personal]]],
    ['GitHub merge', [[personal, github, true]]],
    ['contributor commit merged into main', [[outside, outside], [personal, github, true]]],
  ];
  for (const [label, commits, failures = []] of cases) {
    let head = side;
    for (const [author, committer, merge] of commits) head = commit(merge ? [base, head] : [head], author, committer);
    for (const event of ['pull_request', 'push']) check(label, event, head, base, failures);
  }
  check('first push with the work address', 'push', commit([side], work, personal), '0'.repeat(40), [['author', work]],
    "No usable 'before' commit (first push or force-push); checking only the pushed commit.\n");
} finally {
  rmSync(cwd, { recursive: true, force: true });
}
