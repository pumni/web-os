/** Allowed reaction emojis, shared by the floating reaction bar and per-message reactions. */
export const REACTION_EMOJIS = ['❤️', '😂', '😮', '👍', '🎉'] as const;

export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export function isReactionEmoji(value: unknown): value is ReactionEmoji {
  return typeof value === 'string' && (REACTION_EMOJIS as readonly string[]).includes(value);
}
