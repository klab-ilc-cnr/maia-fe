import { Relation } from "./relation"

/**Classe che rappresenta le relazioni di un elemento */
export class Relations {
  /**Lista di relazioni in ingresso */
  in: Array<Relation> = []
  /**Lista di relazioni in uscita */
  out: Array<Relation> = []
}
