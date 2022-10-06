import { TextHighlight } from "./text-highlight"

export class TextLine {
  text: string | undefined
  words: Array<string> | undefined
  height: number | undefined
  yText: number | undefined
  startIndex: number | undefined
  endIndex: number | undefined
  annotationsTowers: Array<any> | undefined
  yAnnotation: number | undefined
  highlights: Array<TextHighlight> | undefined
  yHighlight: number | undefined
  x: number | undefined
  arcs: Array<any> | undefined
}
