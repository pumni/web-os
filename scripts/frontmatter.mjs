import fs from 'node:fs';
import path from 'node:path';

/**
 * Parses YAML-like frontmatter from a markdown file.
 *
 * Supports:
 *   - `key: value` (string)
 *   - `key: true` / `key: false` (boolean)
 *   - `key: [a, b, c]` (array of strings)
 *
 * Returns `null` when the file has no frontmatter block.
 */
export function parseFrontmatter(relativePath) {
  const content = fs.readFileSync(
    path.resolve(relativePath),
    'utf8',
  );

  if (!content.startsWith('---\n') && !content.startsWith('---\r\n')) return null;
  const end = content.indexOf('\n---', 4);
  if (end === -1) return null;

  const frontmatter = {};
  for (const rawLine of content.slice(4, end).split(/\r?\n/)) {
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(rawLine);
    if (!match) continue;
    const [, key, rawValue] = match;
    const value = rawValue.trim();
    if (value === 'true') {
      frontmatter[key] = true;
    } else if (value === 'false') {
      frontmatter[key] = false;
    } else if (value.startsWith('[') && value.endsWith(']')) {
      frontmatter[key] = value
        .slice(1, -1)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    } else {
      frontmatter[key] = value;
    }
  }

  return frontmatter;
}
