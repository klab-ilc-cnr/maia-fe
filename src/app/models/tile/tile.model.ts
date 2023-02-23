import { TileType } from "./tile-type.model";

/**Classe che rappresenta un tile di tipo T */
export class Tile<T> {
    /**Identificativo del tile */
    id: string | undefined;
    /**Identificativo del workspace */
    workspaceId: string | undefined;
    /**Contenuto del tile */
    content: T | undefined; // i diversi tipi di tile potrebbero avere contenuti diversi
    /**Configurazione del tile */
    tileConfig: any | undefined;
    /**
     * Tipo di tile 
     * @example TileType.CORPUS
     */
    type : TileType | undefined;

    /**
     * Costruttore per Tile<T>
     * @param id {string} identificativo del tile
     * @param workspaceId {string} identificativo del workspace
     * @param content {T} contenuto del tile
     * @param tileConfig {any} configurazione del tile
     * @param type {TileType} tipologia di tile
     */
    constructor(id: string, workspaceId: string, content:T, tileConfig:any, type:TileType)
    {
        this.id = id;
        this.workspaceId = workspaceId;
        this.content = content;
        this.tileConfig = tileConfig;
        this.type = type;
    }
}
