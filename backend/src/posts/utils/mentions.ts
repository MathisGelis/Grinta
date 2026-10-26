/** Partners kept per post, in the order they are mentioned. */
export const MAX_PARTNERS = 10;

/** Handles looked up per text, so a long list of @ costs one bounded query. */
const MAX_HANDLES = 30;

// An @ that starts a word (not the middle of an e-mail address or "@@"),
// followed by a handle in the characters generated usernames use.
const MENTION = /(?:^|[^a-z0-9_.@])@([a-z0-9_.]{3,30})/gi;

/**
 * The @handles of a text, lowercased like stored usernames, without
 * duplicates, in order of first appearance. A trailing dot is punctuation
 * ("thanks @paul."), not part of the handle.
 */
export function extractMentions(
  ...texts: Array<string | null | undefined>
): string[] {
  const handles = new Set<string>();

  for (const text of texts)
    for (const match of (text ?? '').matchAll(MENTION)) {
      const handle = match[1].toLowerCase().replace(/\.+$/, '');

      if (handle.length >= 3) handles.add(handle);
      if (handles.size === MAX_HANDLES) return [...handles];
    }
  return [...handles];
}
