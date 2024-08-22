export class OntologyDescription {
    equivalentTo! : Array<Axiom>;
    subClassOf! : Array<Axiom>;
    generalClassAxioms! : Array<Axiom>;
    subClassOfAnonymousAncestor! : Array<Axiom>;
    instances! : Array<Instance>;
    targetForKey! : Array<Axiom>;
    disjointWith! : Array<Axiom>;
    disjointUnionOf! : Array<Axiom>;
}


export class Axiom {
    axiom!: string;
}

export class Instance {
    id! : string;
    shortId!: string
}