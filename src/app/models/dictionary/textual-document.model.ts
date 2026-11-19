export interface TextualDocument {
    code: string;
    title: string;
    /** position in the list of works (ascending); given by the backend */
    order?: number;
}
