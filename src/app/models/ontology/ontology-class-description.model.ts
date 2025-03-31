import { OntologyDescriptionAxiom } from "./ontology-description-axiom.model";
import { OntologyDescriptionInstance } from "./ontology-description-instance.model";

export class OntologyClassDescription {
    equivalentTo! : Array<OntologyDescriptionAxiom>;
    subClassOf! : Array<OntologyDescriptionAxiom>;
    generalClassAxioms! : Array<OntologyDescriptionAxiom>;
    subClassOfAnonymousAncestor! : Array<OntologyDescriptionAxiom>;
    instances! : Array<OntologyDescriptionInstance>;
    targetForKey! : Array<OntologyDescriptionAxiom>;
    disjointWith! : Array<OntologyDescriptionAxiom>;
    disjointUnionOf! : Array<OntologyDescriptionAxiom>;
}