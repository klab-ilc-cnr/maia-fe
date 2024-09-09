export class OntologyObjectPropertyCharacteristics {
    functional!: boolean;
    inverseFunctional!: boolean;
    transitive!: boolean;
    symmetric!: boolean;
    asymmetric!: boolean;
    reflexive!: boolean;
    irreflexive!: boolean;
}

export enum CharacterisctType {
    object = "object",
    data = "data"
}