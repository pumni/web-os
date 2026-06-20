import * as React from 'react';

/**
 * Renders `text` with the substring(s) matching `query` emphasized.
 *
 * Pure client/server component — no state. Matching is case-insensitive and
 * highlights every query token (whitespace-split) wherever it appears, so a
 * query like "set" bolds the "Set" in "Settings". Empty/whitespace queries
 * render the text untouched.
 */
type HighlightProps = Readonly<{
  text: string;
  query: string;
  /** Class applied to matched characters. Defaults to a subtle weight bump. */
  matchClassName?: string;
}>;

/** Escapes a string for safe use inside a RegExp. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function Highlight({ text, query, matchClassName = 'font-semibold text-foreground' }: HighlightProps) {
  const q = query.trim();
  if (!q) return <>{text}</>;

  const tokens = q.split(/\s+/).map(escapeRegExp).filter(Boolean);
  if (tokens.length === 0) return <>{text}</>;

  // Capture group preserves separators in String.split, so non-matched text is
  // rendered verbatim. Global flag is required for split to find all matches.
  const splitPattern = new RegExp(`(${tokens.join('|')})`, 'gi');
  // A fresh non-global pattern to test each split part without stateful lastIndex.
  const testPattern = new RegExp(`^(?:${tokens.join('|')})$`, 'i');

  return (
    <>
      {text.split(splitPattern).map((part, i) =>
        part && testPattern.test(part) ? (
          <mark key={i} className={`bg-transparent ${matchClassName}`}>
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  );
}
