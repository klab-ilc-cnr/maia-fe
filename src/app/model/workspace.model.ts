import { TextTileContent } from "./text-tile-content.model";
import { Tile } from "./tile.model";

export class Workspace {
    id: number | undefined;
    tiles: Array<Tile<TextTileContent>> | undefined;
    layout: any | undefined;

    constructor(id: number, tiles: Array<Tile<TextTileContent>>, layout: any)
    {
        this.id = id;
        this.tiles = tiles;
        this.layout = layout;
    }
}
