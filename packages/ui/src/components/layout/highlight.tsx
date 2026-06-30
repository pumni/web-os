import * as React from 'react';

import { cn } from '../../lib/cn';

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
  /** Optional class name to style the matching highlighted <mark> elements. */
  matchClassName?: string;
} & React.ComponentProps<'span'>>;

/** Escapes a string for safe use inside a RegExp. */
function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const DEFAULT_MATCH_CLASS = 'font-semibold text-foreground bg-transparent';

export function Highlight({
  ref,
  text,
  query,
  matchClassName,
  className,
  ...props
}: HighlightProps) {
  const trimmed = query.trim();
  const tokens: readonly string[] = !trimmed
    ? []
    : Array.from(new Set(trimmed.split(/\s+/).map(escapeRegExp).filter(Boolean))).sort(
        (a, b) => b.length - a.length,
      );

  // Capture group preserves separators in String.split, so non-matched text is
  // rendered verbatim. Global flag is required for split to find all matches.
  // A fresh non-global pattern tests each split part without stateful lastIndex.
  const { splitPattern, testPattern } = (() => {
    if (tokens.length === 0) return { splitPattern: null, testPattern: null };
    const joined = tokens.join('|');
    return {
      splitPattern: new RegExp(`(${joined})`, 'gi'),
      testPattern: new RegExp(`^(?:${joined})$`, 'i'),
    };
  })();

  const highlightedParts =
    !splitPattern || !testPattern
      ? null
      : text.split(splitPattern).map((part, i) =>
          part && testPattern.test(part) ? (
            <mark key={i} className={cn(DEFAULT_MATCH_CLASS, matchClassName)}>
              {part}
            </mark>
          ) : (
            <React.Fragment key={i}>{part}</React.Fragment>
          ),
        );

  const hasRestProps = className !== undefined || Object.keys(props).length > 0 || ref !== undefined;

  if (!splitPattern || !testPattern || !highlightedParts) {
    if (hasRestProps) {
      return (
        <span ref={ref} data-slot="highlight" className={className} {...props}>
          {text}
        </span>
      );
    }
    return <>{text}</>;
  }

  if (hasRestProps) {
    return (
      <span ref={ref} data-slot="highlight" className={className} {...props}>
        {highlightedParts}
      </span>
    );
  }

  return <>{highlightedParts}</>;
}

