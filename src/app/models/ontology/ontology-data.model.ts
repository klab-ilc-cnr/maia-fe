import { OntologyAnnotations } from "./ontology-annotations.model";

export class OntologyDataAnnotationLabel {
    value: string = '';
    language: string = '';
    type: string = '';
}
export class OntologyDataAnnotations {
    id: string = '';
    shortId: string = '';
    label: OntologyDataAnnotationLabel[] = [];
}

export class OntologyData {
    iri: string = '';
    version: string = '';
    reasonerName: string = '';
    reasonerVersion: string = '';
    annotations: OntologyDataAnnotations[] = [];
}
