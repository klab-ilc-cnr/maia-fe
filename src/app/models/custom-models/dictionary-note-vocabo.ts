import { decode } from 'html-entities';

export class DictionaryNoteVocabo {
    etymology: {
        language: string;
        etymon: string;
        details: string;
    };
    decameronOccurrences: number;
    frequencies: {documentId: string; frequency: number}[];
    firstAttestation: string;
    firstAttestationDetails: string;
    linguisticsSemantics: string;
    decameron: string;
    firstAbsAttestation: string;
    boccaccioDante: string;
    crusche: string;
    polyrhematics: string;

    constructor(note: string) {
        try {
            const parsedNote = JSON.parse(note);
            this.etymology = { 
                ...parsedNote?.etymology,
                details: decode(parsedNote.etymology?.details) ?? ''
             };
            this.decameronOccurrences = parsedNote?.decameronOccurrences ?? 0;
            this.frequencies = parsedNote?.frequencies ? [...parsedNote.frequencies] : [];
            this.firstAttestation = parsedNote?.firstAttestation ?? '';
            this.firstAttestationDetails = parsedNote?.firstAttestationDetails ?? '';
            this.linguisticsSemantics = decode(parsedNote?.linguisticsSemantics) ?? '';
            this.decameron = decode(parsedNote?.decameron) ?? '';
            this.firstAbsAttestation = decode(parsedNote?.firstAbsAttestation) ?? '';
            this.boccaccioDante = decode(parsedNote?.boccaccioDante) ?? '';
            this.crusche = decode(parsedNote?.crusche) ?? '';
            this.polyrhematics = decode(parsedNote?.polyrhematics) ?? '';
        } catch (error) {
            console.group('Error with note structure, note value will be ignored');
            console.error(error);
            console.warn('Note value: ', note);
            console.groupEnd();
            this.etymology = {
                language: '',
                etymon: '',
                details: '',
            };
            this.decameronOccurrences = 0;
            this.frequencies = [];
            this.firstAttestation = '';
            this.firstAttestationDetails = '';
            this.linguisticsSemantics = '';
            this.decameron = '';
            this.firstAbsAttestation = '';
            this.boccaccioDante = '';
            this.crusche = '';
            this.polyrhematics = '';
        }        
    }

    public noteToString(): string {
        return JSON.stringify(this);
    }
}
