import { Feature } from "./feature";

/**
 * Classe che rappresenta una feature per l'annotazione
 * @extends Feature
 */
export class FeatureForAnnotation extends Feature{
  /**Placeholder */
  placeholder: string | undefined
  /**
   * Lista dei possibili valori della feature
   * @default dropdownOptions=[]
   */
  dropdownOptions: Array<any> = []
  /**Nome del modello ? */
  modelPropName: string | undefined
  /**Valore */
  value: any
  /**Etichetta del valore */
  valueLabel: string | undefined
}
