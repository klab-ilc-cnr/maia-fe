/**Classe che rappresenta i metadati di un'annotazione */
export class AnnotationMetadata {
  /**Identificativo numerico del creatore */
  createdBy: number | undefined
  /**Identificativo numerico dell'ultimo che ha apportato modifiche */
  modifiedBy: number | undefined
  /**Data di creazione */
  creationDate: Date | undefined
  /**Data di ultima modifica */
  lastModificationDate: Date | undefined
}
