export class PaginatedResponse {
  data: TextSplittedRow[] | undefined;
  count: number | undefined;
  start: number | undefined;
  end: number | undefined;
  offset: number | undefined;
}

export class TextSplittedRow {
  id!: string; // database identifier of the row
  index: string | undefined; // section index
  absolute!: number; // absolute line number (starting from 0)
  relative!: number; // line number relative to the section (starting from 0)
  start!: number; // starting character
  end!: number; // ending character (excluded)
  text!: string; // line text
}