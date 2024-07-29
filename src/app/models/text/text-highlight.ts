/**Classe che rappresenta un'evidenziazione nel testo */
export class TextHighlight {
  /**Coordinate iniziali di evidenziazione */
  coordinates!: {
    x: number | undefined
    y: number | undefined
  }
  /**Colore di background */
  bgColor: string | undefined
  /**Larghezza dell'evidenziazione */
  width: number | undefined
  /**Altezza dell'evidenziazione */
  height: number | undefined
  /**Identificativo dell'evidenziazione */
  id: string | undefined
  /**true if it's part of the special text selection */
  isSelection!: boolean
}
