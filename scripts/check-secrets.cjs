const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const { extname } = require('node:path');

const binaryExtensions = new Set([
  '.gif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.pdf',
  '.png',
  '.webp',
  '.woff',
  '.woff2',
  '.zip',
]);

const detectors = [
  {
    name: 'MongoDB URI containing credentials',
    pattern: /mongodb(?:\+srv)?:\/\/[^:\s/"']+:[^@\s/"']+@/gi,
  },
  {
    name: 'Google OAuth client secret',
    pattern: /GOCSPX-[A-Za-z0-9_-]{20,}/g,
  },
  {
    name: 'Google OAuth refresh token',
    pattern: /1\/\/[A-Za-z0-9_-]{30,}/g,
  },
  {
    name: 'private key',
    pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g,
  },
  {
    name: 'GitHub token',
    pattern: /gh[pousr]_[A-Za-z0-9_]{20,}/g,
  },
  {
    name: 'literal assigned to a sensitive variable',
    pattern:
      /(?:^|[\s,{])(?:[A-Z][A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|API_KEY|PRIVATE_KEY)|SECRET|TOKEN|PASSWORD|API_KEY|PRIVATE_KEY)[ \t]*[:=][ \t]*["'][^"'${}<][^"'\r\n]{7,}["']/gm,
  },
];

const files = execFileSync('git', ['ls-files', '-z'], {
  encoding: 'utf8',
})
  .split('\0')
  .filter(Boolean);

const findings = [];

for (const file of files) {
  if (binaryExtensions.has(extname(file).toLowerCase())) continue;

  let contents;
  try {
    contents = readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  if (contents.includes('\0')) continue;

  const lines = contents.split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    for (const detector of detectors) {
      if (/secret-scan:\s*allow/i.test(line)) continue;

      detector.pattern.lastIndex = 0;
      if (detector.pattern.test(line)) {
        findings.push(`${file}:${index + 1}: ${detector.name}`);
      }
    }
  }
}

if (findings.length) {
  console.error('Possible committed secrets detected (values suppressed):');
  for (const finding of findings) console.error(`- ${finding}`);
  console.error(
    'Remove the credential and rotate it. For a verified false positive, add "secret-scan: allow" on that line.',
  );
  process.exit(1);
}

console.log(`Secret check passed for ${files.length} tracked files.`);
