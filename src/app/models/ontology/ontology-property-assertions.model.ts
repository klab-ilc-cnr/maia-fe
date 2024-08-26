import { OntologyPropertyAssertionData } from "./ontology-property-assertion-data.model";
import { OntologyPropertyAssertionObject } from "./ontology-property-assertion-object.model";

export class OntologyObjectPropertyAssertions {
    objectPropertyAssertions!: Array<OntologyPropertyAssertionObject>;
    negativeObjectPropertyAssertions!: Array<OntologyPropertyAssertionObject>;
}

export class OntologyDataPropertyAssertions {
    dataPropertyAssertions!: Array<OntologyPropertyAssertionData>;
    negativeDataPropertyAssertions!: Array<OntologyPropertyAssertionData>;
}

export enum AssertionType {
    object = "object",
    data = "data"
}