import { TextTileContent } from "./tile/text-tile-content.model";
import { Tile } from "./tile/tile.model";

/**Classe che rappresenta un workspace */
export class Workspace {
    /**Identificativo numerico del workspace */
    id: number | undefined;
    /**Lista dei tile contenuti */
    tiles: Array<Tile<TextTileContent>> | undefined;
    /**Layout */
    layout: any | undefined;

    /**
     * Costruttore per Workspace
     * @param id {number} identificativo numerico del workspace
     * @param tiles {Array<Tile<TextTileContent>>} lista dei tile del workspace
     * @param layout {any} layout
     */
    constructor(id: number, tiles: Array<Tile<TextTileContent>>, layout: any)
    {
        this.id = id;
        this.tiles = tiles;
        this.layout = layout;
    }
}
