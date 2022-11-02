export class LexicalEntry {
    name?: string
    lexicalEntryInstanceName?: string
    label?: string
    creator?: string
    creationDate?: string
    lastUpdate?: string
    status?: string
    type?: LexicalEntryType
}


export enum LexicalEntryType{
    LEXICAL_ENTRY,
    FORM,
    SENSE
}