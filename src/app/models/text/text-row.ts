import { TextLine } from './text-line';

/**Classe che rappresenta una riga di testo */
export class TextRow {
  /**Identificativo numerico della riga */
  id: number | undefined
  /**Testo contenuto */
  text: string | undefined
  /**Lista delle line */
  lines: Array<TextLine> | undefined
  /**Lista delle parole */
  words: Array<string> | undefined
  yBG: number | undefined
  yText?: number | undefined
  ySentnum: number | undefined
  height: number | undefined
  startIndex: number | undefined
  endIndex: number | undefined
  xText: number | undefined
  xSentnum: number | undefined
}
