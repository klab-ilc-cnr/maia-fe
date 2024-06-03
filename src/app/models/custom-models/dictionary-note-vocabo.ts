export class DictionaryNoteVocabo {
    etymology: {
        language: string;
        etymon: string;
        details: string;
    };
    frequencies: {documentId: string; frequency: number}[];
    firstAttestation: string;
    linguisticsSemantics: string;
    decameron: string;
    firstAbsAttestation: string;
    boccaccioDante: string;
    crusche: string;
    polyrhematics: string;

    constructor(note: string) {
        try {
            const parsedNote = JSON.parse(note);
            this.etymology = { ...parsedNote.etymology };
            this.frequencies = [...parsedNote.frequencies];
            this.firstAttestation = parsedNote.firstAttestation;
            this.linguisticsSemantics = parsedNote.linguisticsSemantics;
            this.decameron = parsedNote.decameron;
            this.firstAbsAttestation = parsedNote.firstAbsAttestation;
            this.boccaccioDante = parsedNote.boccaccioDante;
            this.crusche = parsedNote.crusche;
            this.polyrhematics = parsedNote.polyrhematics;
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
            this.frequencies = [];
            this.firstAttestation = '';
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
