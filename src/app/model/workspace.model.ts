import { TextTileContent } from "./text-tile-content.model";
import { Tile } from "./tile.model";

export class Workspace {
    id: number | undefined;
    textTileList: Array<Tile<TextTileContent>> | undefined;
}
