export class PaginatedResponse {
  data: TextSplittedRow[] | undefined;
  count: number | undefined;
  start: number | undefined;
  end: number | undefined;
  offset: number | undefined;
}

/**
 * Response mapping object of a text row rapresentation
 */
export class TextSplittedRow {
  /**database identifier of the row */
  id!: string;

  /**section index*/
  index: string | undefined;

  /**absolute line number (starting from 0) */
  absolute!: number;

  /**line number relative to the section (starting from 0) */
  relative!: number;

  /**starting character */
  start!: number;

  /**ending character (excluded) */
  end!: number;

  /**line text */
  text!: string;
}