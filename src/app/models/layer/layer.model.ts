/**Classe che rappresenta un layer */
export class Layer {
    /**Identificativo numerico */
    id: number | undefined;
    /**Nome */
    name: string | undefined;
    /**Colore associato al layer */
    color: string | undefined;
    /**Descrizione */
    description: string | undefined;

    /**
     * Costruttore per Layer
     * @param id {number} identificativo numerico del layer
     * @param name {string} nome del layer
     * @param color {string} colore associato al layer
     * @param description {string} descrizione
     */
    constructor(id?: number, name?:string, color?: string, description?:string)
    {
        this.id = id;
        this.name = name;
        this.color = color;
        this.description = description;
    }
}
