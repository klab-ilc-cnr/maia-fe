/**
 * True when an HTML value coming from a rich text field has something to show: text (spaces and `&nbsp;` do not count),
 * or an image. `''`, `<p><br></p>` and `<p> </p>` are empty (what an editor can leave after the text is deleted).
 */
export function hasRichText(html: string | null | undefined): boolean {
  if (!html) return false;
  if (/<img\b/i.test(html)) return true;
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;|&#160;|\u00a0/gi, '').trim().length > 0;
}
