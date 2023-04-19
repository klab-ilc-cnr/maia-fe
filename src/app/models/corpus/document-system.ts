import { DocumentElement } from "./document-element"

/**Classe che rappresenta il sistema documentale */
export class DocumentSystem {
  /**UUID di richiesta */
  requestUUID: string | undefined
  /**
   * Numero di esiti ottenuti
   * @example result:2 indica due cartelle nel corpus
   */
  result: string | undefined
  /**Lista degli elementi nel sistema documentale */
  documentSystem: DocumentElement[] | undefined
}
