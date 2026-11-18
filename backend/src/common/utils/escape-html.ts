const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escapes user-written text (workout titles, display names, comments) before
 * it goes into HTML: an e-mail body, a shared web page, a generated view.
 *
 * The API itself stores and returns text exactly as typed: JSON is not an
 * HTML context, and escaping on the way in would show "&lt;" in the app.
 * Escaping happens on output, where HTML is built. Today every e-mail is
 * plain text (MailMessage has no html field) and no route serves HTML, so
 * nothing needs it yet. The first template or web view that interpolates
 * user text must go through this function.
 */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => ENTITIES[char]);
}
