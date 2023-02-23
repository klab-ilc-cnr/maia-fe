/**Classe che rappresenta una relazione tra annotazioni */
export class Relation {
  /**Identificativo numerico della relazione */
  id: number | undefined
  /**Nome della relazione */
  name: string | undefined
  /**Identificativo numerico del layer sorgente */
  srcLayerId: number | undefined
  /**Identificativo numerico del layer target */
  targetLayerId: number | undefined
  /**Identificativo numerico dell'annotazione sorgente */
  srcAnnotationId: number | undefined
  /**Identificativo numerico dell'annotazione target */
  targetAnnotationId: number | undefined
  /**Descrizione */
  description: string | undefined
  /**Identificativo numerico del testo */
  textId: number | undefined
}
