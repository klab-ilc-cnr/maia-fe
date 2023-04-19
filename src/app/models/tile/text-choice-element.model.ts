/**Classe che rappresenta un testo opzione */
export class TextChoice {
    /**Identificativo numerico del testo */
    id: number | undefined;
    /**Titolo del testo */
    title: string | undefined;
    /**Ultimo aggiornamento */
    updatedOn: string | undefined;
    /**Creato da (caricato da) */
    createdBy: string | undefined;
    /**Stato corrente del testo */
    status: string | undefined;
}
