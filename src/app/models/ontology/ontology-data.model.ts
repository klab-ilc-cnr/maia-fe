import { LabelObject } from "./ontology-base.model";

export class OntologyDataAnnotations {
    id: string = '';
    shortId: string = '';
    label: LabelObject[] = [];
}

export class OntologyData {
    iri: string = '';
    version: string = '';
    reasonerName: string = '';
    reasonerVersion: string = '';
    annotations: OntologyDataAnnotations[] = [];
    directImports: string[] = [];
    indirectImports: string[] = [];
}
