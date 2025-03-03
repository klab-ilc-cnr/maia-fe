import { decode } from 'html-entities';

export class DictionaryNoteVocabo {
    etymology: {
        language: string;
        etymon: string;
        details: string;
    } = {
            language: '',
            etymon: '',
            details: ''
        };
    decameronOccurrences: number = 0;
    frequencies: {documentId: string; frequency: number}[] = [];
    firstAttestation: string = '';
    firstAttestationDetails: string = '';
    linguisticsSemantics: string = '';
    decameron: string = '';
    firstAbsAttestation: string = '';
    boccaccioDante: string = '';
    crusche: string = '';
    polyrhematics: string = '';

    constructor(note: string) {
        if(note !== '') {
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
                console.error('Note value: ', note);
                console.groupEnd();
            }            
        }
    }

    public noteToString(): string {
        return JSON.stringify(this);
    }
}
