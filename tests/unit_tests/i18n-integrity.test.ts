import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';
import { describe, expect, test } from 'vitest';
import countryData from '../../src/data/country_data.json';
import { langMap } from '../../src/i18n';

type TranslationResource = Record<string, string>;

const projectRoot = process.cwd();
const sourceRoot = join(projectRoot, 'src');
const english = langMap.find(({ locale }) => locale === 'en-CA')!.resource as TranslationResource;

function expectNoFailures(failures: string[]) {
  expect(failures, failures.join('\n')).toEqual([]);
}

function getInterpolationTokens(message: string) {
  return [...message.matchAll(/\{\{\s*([\w.-]+)\s*\}\}/g)].map((match) => match[1]).sort();
}

function getSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return getSourceFiles(path);
    return /\.[cm]?[jt]sx?$/.test(entry.name) ? [path] : [];
  });
}

function getLocation(sourceFile: ts.SourceFile, node: ts.Node) {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return `${relative(projectRoot, sourceFile.fileName)}:${line + 1}:${character + 1}`;
}

const richTextContracts = {
  help1: { allowedTags: ['b'], elementCount: 1 },
  help2: { allowedTags: ['b'], elementCount: 1 },
  a2: { allowedTags: ['a', 'button'], elementCount: 1 },
  a3: { allowedTags: ['a'], elementCount: 1 },
} as const;

function validateRichText(locale: string, key: string, message: string) {
  const failures: string[] = [];
  const contract = richTextContracts[key as keyof typeof richTextContracts];
  const tagPattern = /<\/?([a-z][\w-]*)(?:\s[^>]*)?>/gi;
  const tags = [...message.matchAll(tagPattern)];

  if (!contract) {
    if (tags.length > 0) {
      failures.push(`${locale}.${key} contains unexpected rich-text markup`);
    }
    return failures;
  }

  const allowedTags: readonly string[] = contract.allowedTags;
  const stack: string[] = [];
  let elementCount = 0;

  for (const match of tags) {
    const tag = match[1].toLowerCase();
    const isClosingTag = match[0].startsWith('</');

    if (!allowedTags.includes(tag)) {
      failures.push(`${locale}.${key} uses unsupported <${tag}> markup`);
    }

    if (isClosingTag) {
      const openingTag = stack.pop();
      if (openingTag !== tag) {
        failures.push(`${locale}.${key} has unbalanced <${tag}> markup`);
      }
    } else {
      stack.push(tag);
      elementCount += 1;
    }
  }

  if (stack.length > 0) {
    failures.push(`${locale}.${key} has unclosed <${stack.at(-1)}> markup`);
  }
  if (elementCount !== contract.elementCount) {
    failures.push(
      `${locale}.${key} must contain ${contract.elementCount} rich-text element, found ${elementCount}`,
    );
  }

  const document = new DOMParser().parseFromString(message, 'text/html');
  for (const element of document.body.querySelectorAll('*')) {
    const tag = element.tagName.toLowerCase();
    const allowedAttributes = tag === 'a' ? new Set(['class', 'href']) : new Set<string>();

    for (const attribute of element.getAttributeNames()) {
      if (!allowedAttributes.has(attribute)) {
        failures.push(`${locale}.${key} uses unsupported ${attribute} attribute on <${tag}>`);
      }
    }

    if (tag === 'a') {
      const href = element.getAttribute('href');
      if (href && !href.startsWith('/') && !href.startsWith('https://')) {
        failures.push(`${locale}.${key} contains an unsafe link target: ${href}`);
      }
    }
  }

  return failures;
}

describe('translation integrity', () => {
  test('registered locales only use canonical English keys', () => {
    const expectedKeys = Object.keys(english).sort();
    const failures: string[] = [];

    for (const { locale, resource } of langMap) {
      const actualKeys = Object.keys(resource).sort();
      const unknown = actualKeys.filter((key) => !expectedKeys.includes(key));

      if (unknown.length > 0) failures.push(`${locale} has unknown keys: ${unknown.join(', ')}`);
    }

    expectNoFailures(failures);
  });

  test('translations preserve English interpolation placeholders', () => {
    const failures: string[] = [];

    for (const { locale, resource } of langMap) {
      const translations = resource as TranslationResource;
      for (const key of Object.keys(translations)) {
        const expected = getInterpolationTokens(english[key]);
        const actual = getInterpolationTokens(translations[key]);
        if (expected.join('\0') !== actual.join('\0')) {
          failures.push(
            `${locale}.${key} placeholders are [${actual.join(', ')}], expected [${expected.join(', ')}]`,
          );
        }
      }
    }

    expectNoFailures(failures);
  });

  test('rich translations satisfy their rendering contracts', () => {
    const failures = langMap.flatMap(({ locale, resource }) => {
      const translations = resource as TranslationResource;
      return Object.entries(translations).flatMap(([key, message]) =>
        validateRichText(locale, key, message),
      );
    });

    expectNoFailures(failures);
  });

  test('country data contains a localized name for every registered locale', () => {
    const failures: string[] = [];

    for (const { langKey, locale } of langMap) {
      for (const country of countryData.features) {
        const properties = country.properties as unknown as Record<string, unknown>;
        const localizedName = properties[langKey];
        if (typeof localizedName !== 'string' || localizedName.trim() === '') {
          failures.push(`${country.properties.NAME} is missing ${langKey} for ${locale}`);
        }
      }
    }

    expectNoFailures(failures);
  });

  test('source translation calls use known keys and avoid legacy APIs', () => {
    const failures: string[] = [];

    for (const fileName of getSourceFiles(sourceRoot)) {
      const sourceText = readFileSync(fileName, 'utf8');
      const scriptKind = fileName.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
      const sourceFile = ts.createSourceFile(
        fileName,
        sourceText,
        ts.ScriptTarget.Latest,
        true,
        scriptKind,
      );
      const isI18nModule = fileName === join(sourceRoot, 'i18n', 'index.ts');

      function visit(node: ts.Node) {
        if (ts.isIdentifier(node) && node.text === 'translatePage') {
          failures.push(`${getLocation(sourceFile, node)} uses removed translatePage`);
        }

        if (
          !isI18nModule &&
          ts.isCallExpression(node) &&
          ts.isPropertyAccessExpression(node.expression) &&
          ts.isIdentifier(node.expression.expression) &&
          node.expression.expression.text === 'i18next' &&
          node.expression.name.text === 't'
        ) {
          failures.push(`${getLocation(sourceFile, node)} calls i18next.t() directly`);
        }

        if (
          ts.isCallExpression(node) &&
          ts.isIdentifier(node.expression) &&
          node.expression.text === 't'
        ) {
          const key = node.arguments[0];
          if (
            key &&
            (ts.isStringLiteral(key) || ts.isNoSubstitutionTemplateLiteral(key)) &&
            !(key.text in english)
          ) {
            failures.push(
              `${getLocation(sourceFile, key)} uses unknown translation key "${key.text}"`,
            );
          }
        }

        ts.forEachChild(node, visit);
      }

      visit(sourceFile);
    }

    expectNoFailures(failures);
  });
});
