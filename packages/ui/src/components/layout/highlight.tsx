import * as React from 'react';

/**
 * Renders `text` with the substring(s) matching `query` emphasized.
 *
 * Pure client/server component — no state. Matching is case-insensitive and
 * highlights every query token (whitespace-split) wherever it appears, so a
 * query like "set" bolds the "Set" in "Settings". Empty/whitespace queries
 * render the text untouched.
 *
 * The two RegExps are memoized on the token set so a re-render with an
 * unchanged query (e.g. parent state churn while typing in an unrelated
 * field) doesn't rebuild them. Highlight typically renders inside a list that
 * re-renders on every keystroke, so avoiding per-item RegExp construction
 * matters.
 */
type HighlightProps = Readonly<{
  text: string;
  query: string;
}>;

/** Escapes a string for safe use inside a RegExp. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const MATCH_CLASS = 'font-semibold text-foreground';

export function Highlight({ text, query }: HighlightProps) {
  const tokens = React.useMemo(() => {
    const q = query.trim();
    if (!q) return [] as readonly string[];
    return q.split(/\s+/).map(escapeRegExp).filter(Boolean);
  }, [query]);

  // Capture group preserves separators in String.split, so non-matched text is
  // rendered verbatim. Global flag is required for split to find all matches.
  // A fresh non-global pattern tests each split part without stateful lastIndex.
  const { splitPattern, testPattern } = React.useMemo(() => {
    if (tokens.length === 0) return { splitPattern: null, testPattern: null };
    const joined = tokens.join('|');
    return {
      splitPattern: new RegExp(`(${joined})`, 'gi'),
      testPattern: new RegExp(`^(?:${joined})$`, 'i'),
    };
  }, [tokens]);

  const highlightedParts = React.useMemo(() => {
    if (!splitPattern || !testPattern) return null;
    return text.split(splitPattern).map((part, i) =>
      part && testPattern.test(part) ? (
        <mark key={i} className={`bg-transparent ${MATCH_CLASS}`}>
          {part}
        </mark>
      ) : (
        <React.Fragment key={i}>{part}</React.Fragment>
      ),
    );
  }, [text, splitPattern, testPattern]);

  if (!splitPattern || !testPattern || !highlightedParts) return <>{text}</>;

  return <>{highlightedParts}</>;
}
