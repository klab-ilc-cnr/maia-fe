import { SpanCoordinates } from "./span-coordinates"

/**Classe che rappresenta una annotazione */
export class Annotation {
  /**Layer di riferimento */
  layer: any
  /**Nome del layer */
  layerName: string | undefined
  /**Valore */
  value: string | undefined
  /**Definisce se è importata */
  imported: boolean | undefined
  /**Eventuali attributi */
  attributes: Record<string, any> = {}
  /**Lista degli span coinvolti */
  spans: Array<SpanCoordinates> | undefined
  /**Identificativo numerico */
  id!: number
}
