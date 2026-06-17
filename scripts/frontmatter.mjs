import fs from 'node:fs';
import path from 'node:path';

/**
 * Coerces a raw frontmatter string value into its JS equivalent.
 *
 * Supports:
 *   - `true` / `false` → boolean
 *   - `[a, b, c]` → array of trimmed, non-empty strings
 *   - anything else → string
 */
// fallow-ignore-next-line complexity
function parseValue(rawValue) {
  const value = rawValue.trim();
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value.startsWith('[') && value.endsWith(']')) {
    return value
      .slice(1, -1)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return value;
}

/**
 * Parses YAML-like frontmatter from a markdown file.
 *
 * Returns `null` when the file has no frontmatter block.
 */
// fallow-ignore-next-line complexity
export function parseFrontmatter(relativePath) {
  const content = fs.readFileSync(path.resolve(relativePath), 'utf8');

  if (!content.startsWith('---\n') && !content.startsWith('---\r\n')) return null;
  const end = content.indexOf('\n---', 4);
  if (end === -1) return null;
  const endOffset = content.startsWith('---\r\n') && end > 0 && content[end - 1] === '\r' ? end - 1 : end;

  const frontmatter = {};
  for (const rawLine of content.slice(4, endOffset).split(/\r?\n/)) {
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(rawLine);
    if (!match) continue;
    frontmatter[match[1]] = parseValue(match[2]);
  }

  return frontmatter;
}
