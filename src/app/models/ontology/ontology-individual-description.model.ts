import { OntologyDescriptionInstance } from "./ontology-description-instance.model";

export class OntologyIndividualDescription {
    types!: Array<OntologyDescriptionInstance>;
    sameAs!: Array<OntologyDescriptionInstance>;
    differentFrom!: Array<OntologyDescriptionInstance>;
}
