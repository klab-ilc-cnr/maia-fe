import { FeatureType } from "./feature-type"

/**Classe che rappresenta una feature in creazione */
export class CreateFeature {
  /**Identificativo numerico della feature */
  id: number | undefined
  /**Identificativo numerico del layer di appartenenza */
  layerId: number | undefined
  /**Nome della feature */
  name: string | undefined
  /**Tipo di feature */
  type: FeatureType | undefined
  /**Identificativo numerico del tagset */
  tagsetId: number | undefined
  /**Descrizione */
  description: string | undefined
}
