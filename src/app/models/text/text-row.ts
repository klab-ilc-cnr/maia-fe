import { TextLine } from './text-line';

export class TextRow {
  id: number | undefined
  text: string | undefined
  lines: Array<TextLine> | undefined
  words: Array<string> | undefined
  yBG: number | undefined
  yText?: number | undefined
  ySentnum: number | undefined
  height: number | undefined
  startIndex: number | undefined
  endIndex: number | undefined
}
