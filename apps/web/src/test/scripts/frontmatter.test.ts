/**
 * Unit tests for parseFrontmatter from scripts/frontmatter.mjs.
 *
 * The function is duplicated here (copied verbatim) so that the test runs
 * inside Vitest's jsdom sandbox without needing Vite's server.fs.allow
 * configured for the monorepo root. If the source changes, update the copy.
 */
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

// @ts-expect-error - import JS script into test
import { parseFrontmatter } from '../../../../../scripts/frontmatter.mjs';


// ---- Tests ----

describe('parseFrontmatter', () => {
  const tmpDir = path.join(__dirname, '__tmp_frontmatter__');
  const tmpFile = path.join(tmpDir, 'test.md');

  beforeEach(() => {
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function write(content: string) {
    fs.writeFileSync(tmpFile, content, 'utf8');
  }

  it('returns null when file has no frontmatter block', () => {
    write('# Plain markdown\n\nNo frontmatter here.');
    expect(parseFrontmatter(tmpFile)).toBeNull();
  });

  it('returns null when file does not start with ---', () => {
    write('some text\n---\ntitle: Test\n---');
    expect(parseFrontmatter(tmpFile)).toBeNull();
  });

  it('returns null when opening --- is not closed', () => {
    write('---\ntitle: Test\nno closing');
    expect(parseFrontmatter(tmpFile)).toBeNull();
  });

  it('parses basic string key-value pairs', () => {
    write('---\ntitle: Hello World\nauthor: pumz\n---\n\nBody content.');
    const result = parseFrontmatter(tmpFile);
    expect(result).toEqual({ title: 'Hello World', author: 'pumz' });
  });

  it('handles CRLF line endings', () => {
    write('---\r\ntitle: Test\r\n---');
    const result = parseFrontmatter(tmpFile);
    expect(result).toEqual({ title: 'Test' });
  });

  it('parses boolean true value', () => {
    write('---\npublished: true\n---');
    const result = parseFrontmatter(tmpFile);
    expect(result).toEqual({ published: true });
  });

  it('parses boolean false value', () => {
    write('---\ndraft: false\n---');
    const result = parseFrontmatter(tmpFile);
    expect(result).toEqual({ draft: false });
  });

  it('parses array values', () => {
    write('---\ntags: [a, b, c]\n---');
    const result = parseFrontmatter(tmpFile);
    expect(result).toEqual({ tags: ['a', 'b', 'c'] });
  });

  it('trims whitespace from array items and filters empty strings', () => {
    write('---\ntags: [  alpha ,  , beta ]\n---');
    const result = parseFrontmatter(tmpFile);
    expect(result).toEqual({ tags: ['alpha', 'beta'] });
  });

  it('handles empty array', () => {
    write('---\ntags: []\n---');
    const result = parseFrontmatter(tmpFile);
    expect(result).toEqual({ tags: [] });
  });

  it('skips lines that do not match key: value pattern', () => {
    write('---\ntitle: Test\nthis is not a key-value line\nauthor: pumz\n---');
    const result = parseFrontmatter(tmpFile);
    expect(result).toEqual({ title: 'Test', author: 'pumz' });
  });

  it('supports hyphens and underscores in key names', () => {
    write('---\nmy-key: value\nanother_key: value2\n---');
    const result = parseFrontmatter(tmpFile);
    expect(result).toEqual({ 'my-key': 'value', another_key: 'value2' });
  });

  it('returns empty object for frontmatter block with only whitespace lines', () => {
    write('---\n\n---');
    const result = parseFrontmatter(tmpFile);
    expect(result).toEqual({});
  });

  it('preserves whitespace in string values', () => {
    write('---\ndescription: Some description with spaces\n---');
    const result = parseFrontmatter(tmpFile);
    expect(result).toEqual({ description: 'Some description with spaces' });
  });
});
