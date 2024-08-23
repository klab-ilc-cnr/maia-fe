import { OntologyPropertyAssertionData } from "./ontology-property-assertion-data.model";
import { OntologyPropertyAssertionObject } from "./ontology-property-assertion-object.model";

export class OntologyPropertyAssertions {
    objectPropertyAssertions!: Array<OntologyPropertyAssertionObject>;
    dataPropertyAssertions!: Array<OntologyPropertyAssertionData>;
    negativeObjectPropertyAssertions!: Array<OntologyPropertyAssertionObject>;
    negativeDataPropertyAssertions!: Array<OntologyPropertyAssertionData>;
}

export enum AssertionType {
    object = "object",
    data = "data"
}