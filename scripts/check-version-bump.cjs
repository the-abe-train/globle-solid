const { execSync } = require('node:child_process');

const fail = (message) => {
  console.error(`❌ ${message}`);
  process.exit(1);
};

const run = (command) => execSync(command, { encoding: 'utf8' }).trim();

const parseSemver = (version) => {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return null;
  return match.slice(1).map((value) => Number(value));
};

const compareSemver = (nextVersion, previousVersion) => {
  const next = parseSemver(nextVersion);
  const previous = parseSemver(previousVersion);

  if (!next || !previous) {
    return null;
  }

  for (let index = 0; index < 3; index += 1) {
    if (next[index] > previous[index]) return 1;
    if (next[index] < previous[index]) return -1;
  }

  return 0;
};

const getVersion = (packageJsonRaw, source) => {
  try {
    const parsed = JSON.parse(packageJsonRaw);
    if (typeof parsed.version !== 'string' || parsed.version.length === 0) {
      fail(`Missing or invalid version in ${source}.`);
    }

    return parsed.version;
  } catch {
    fail(`Unable to parse ${source}.`);
  }
};

let stagedFiles;
try {
  stagedFiles = run('git diff --cached --name-only --diff-filter=ACMR')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
} catch {
  fail('Unable to read staged files from git.');
}

if (!stagedFiles.includes('package.json')) {
  fail('package.json must be staged and its version must be incremented on every commit.');
}

let stagedPackageJsonRaw;
try {
  stagedPackageJsonRaw = run('git show :package.json');
} catch {
  fail('Unable to read staged package.json.');
}

const stagedVersion = getVersion(stagedPackageJsonRaw, 'staged package.json');

let previousPackageJsonRaw;
try {
  previousPackageJsonRaw = run('git show HEAD:package.json');
} catch {
  process.exit(0);
}

const previousVersion = getVersion(previousPackageJsonRaw, 'HEAD package.json');

const comparison = compareSemver(stagedVersion, previousVersion);

if (comparison === null) {
  if (stagedVersion === previousVersion) {
    fail(`Version must change from ${previousVersion}.`);
  }

  process.exit(0);
}

if (comparison <= 0) {
  fail(`Version must be incremented. HEAD is ${previousVersion}, staged is ${stagedVersion}.`);
}

process.exit(0);
