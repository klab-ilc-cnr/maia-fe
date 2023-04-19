/**Classe che rappresenta un'annotazione con feature */
export class AnnotationFeature {
  /**Identificativo numerico dell'annotazione */
  annotationId: number | undefined
  /**Identificativo numerico del layer */
  layerId: number | undefined
  /**Lista degli identificativi numerici delle feature */
  featureIds: Array<number> = []
}
