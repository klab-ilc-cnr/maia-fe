import { Tagset } from "../tagset/tagset"
import { FeatureType } from "./feature-type"

/**Classe che rappresenta una feature */
export class Feature {
  /**Identificativo numerico */
  id: number | undefined
  /**Identificativo numerico del layer di appartenenza */
  layerId: number | undefined
  /**Nome della feature */
  name: string | undefined
  /**Tipologia di feature */
  type: FeatureType | undefined
  /**Tagset dei valori */
  tagset: Tagset | undefined
  /**Descrizione */
  description: string | undefined
}
