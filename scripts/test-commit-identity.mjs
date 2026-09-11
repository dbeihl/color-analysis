import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const workflow = readFileSync(process.argv[2] ?? '.github/workflows/commit-identity.yml', 'utf8');
const block = workflow.match(/^        run: \|\n((?:          .*\n|\n)+)/m);
assert.ok(block, 'Workflow check shell block must exist');
const shell = block[1].replace(/^          /gm, '');
const allowed = '51423378+dbeihl@users.noreply.github.com';
const wrong = 'developer@work.example';
const outside = 'contributor@example.com';
const github = 'noreply@github.com';
const maintainer = 'dbeihl';
const contributor = 'outside-contributor';
const hint = "Commits in a pull request from a fork pass when GitHub links their author and committer to the fork owner's account. See CONTRIBUTING.md.\n";
mkdirSync('.work', { recursive: true });
const cwd = mkdtempSync(resolve('.work/identity-proof-'));
const fixture = resolve(cwd, 'pull-commits.json');
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
  mkdirSync(resolve(cwd, 'bin'));
  writeFileSync(resolve(cwd, 'bin/gh'),
    '#!/bin/sh\nwhile [ "$#" -gt 0 ]; do\n  [ "$1" = --jq ] && exec jq -r "$2" "$GH_FIXTURE"\n  shift\ndone\nexit 1\n',
    { mode: 0o755 });
  const cases = [
    ['ordinary personal commit', maintainer, [[allowed, allowed, maintainer, maintainer]]],
    ['GitHub merge', maintainer, [[allowed, github, maintainer, 'web-flow', true]]],
    ['wrong ordinary author', maintainer, [[wrong, allowed, null, maintainer]], [['author', wrong]]],
    ['wrong merge author', maintainer, [[wrong, github, null, 'web-flow', true]], [['author', wrong]]],
    ['ordinary GitHub committer', maintainer, [[allowed, github, maintainer, 'web-flow']], [['committer', github]]],
    ['wrong merge committer', maintainer, [[allowed, wrong, maintainer, null, true]], [['committer', wrong]]],
    ['fork contributor with linked email', contributor, [[outside, outside, contributor, contributor]]],
    ['fork contributor editing on GitHub', contributor, [[outside, github, contributor, 'web-flow']]],
    ['maintainer commit rebased by fork contributor', contributor, [[wrong, outside, null, contributor]],
      [['author', wrong], ['committer', outside]]],
    ['maintainer rebase of fork contributor commit', contributor, [[outside, wrong, contributor, null]],
      [['author', outside], ['committer', wrong]]],
    ['fork committer login that only starts with the owner login', contributor,
      [[outside, wrong, contributor, `${contributor}-work`]], [['author', outside], ['committer', wrong]]],
    ['maintainer fixup on fork contributor branch', contributor,
      [[outside, outside, contributor, contributor], [wrong, wrong, null, null]], [['author', wrong], ['committer', wrong]]],
    ['maintainer-opened fork from another account, work email not linked', 'maintainer-other-account',
      [[wrong, wrong, null, null]], [['author', wrong], ['committer', wrong]]],
  ];
  for (const [label, owner, commits, failures = []] of cases) {
    let head = side;
    const pulled = commits.map(([author, committer, authorLogin, committerLogin, merge]) => {
      head = commit(merge ? [base, head] : [head], author, committer);
      return { sha: head, author: authorLogin && { login: authorLogin }, committer: committerLogin && { login: committerLogin } };
    });
    writeFileSync(fixture, JSON.stringify(pulled));
    const script = shell.replaceAll('${{ github.base_ref }}', 'main')
      .replaceAll('${{ github.repository }}', 'dbeihl/color-analysis')
      .replaceAll('${{ github.event.pull_request.number }}', '1')
      .replaceAll('${{ github.event.pull_request.head.sha }}', head)
      .replaceAll('${{ github.event.pull_request.head.repo.owner.login }}', owner);
    const result = spawnSync('bash', ['--noprofile', '--norc', '-e', '-o', 'pipefail', '-c', script],
      { cwd, env: { ...env, PATH: `${cwd}/bin:${env.PATH}`, GH_FIXTURE: fixture }, encoding: 'utf8' });
    console.log(`${label}: exit ${result.status}`);
    if (result.stdout) process.stdout.write(result.stdout);
    assert.equal(result.status, failures.length ? 1 : 0, result.stderr);
    assert.equal(result.stdout, failures.length ? failures.map(([field, email]) =>
      `Commit ${head} has ${field} email '${email}', expected '${allowed}'\n`).join('') + hint : '');
  }
} finally {
  rmSync(cwd, { recursive: true, force: true });
}
