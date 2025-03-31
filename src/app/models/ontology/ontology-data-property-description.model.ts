import { OntologyDescriptionAxiom } from "./ontology-description-axiom.model";

export class OntologyDataPropertyDescription {
    equivalentTo! : Array<OntologyDescriptionAxiom>;
    subPropertyOf! : Array<OntologyDescriptionAxiom>;
    inverseOf! : Array<OntologyDescriptionAxiom>;
    domains! : Array<OntologyDescriptionAxiom>;
    ranges! : Array<OntologyDescriptionAxiom>;
    disjointWith! : Array<OntologyDescriptionAxiom>;
    superPropertyOfChain! : Array<OntologyDescriptionAxiom>;
}
