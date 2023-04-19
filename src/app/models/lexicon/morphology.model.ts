import { OntolexType } from "./ontolex-type.model";

/**Classe che rappresenta un elemento morfologico di LexO */
export class Morphology {
  /**Identificativo della proprietà */
  propertyId: string|undefined;
  /**Etichetta della proprietà */
  propertyLabel: string|undefined;
  /**Descrizione della proprietà */
  propertyDescription: string|undefined;
  /**Lista dei valori associati alla proprietà */
  propertyValues: OntolexType[]|undefined;
}
