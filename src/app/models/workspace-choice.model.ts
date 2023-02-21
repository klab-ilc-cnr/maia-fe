/**Modello per i workspace da visualizzare nella lista (sono le scelte di workspace) */
export class WorkspaceChoice {
    /**Identificativo numerico */
    id: number | undefined;
    /**Nome del workspace */
    name: string | undefined
    /**Eventuali note */
    note: string | undefined;
    /**Data di ultimo aggiornamento */
    updated: Date | undefined;
}
