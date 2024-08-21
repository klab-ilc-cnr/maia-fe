export class OntologyDescriptionField {
    key! : string;
    value!: Array<Axiom> | Array<Instance>
}


export class Axiom {
    axiom!: string;
}

export class Instance {
    id! : string;
    shortId!: string
}