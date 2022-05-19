import { TileType } from "./tile-type.model";

export class TileContent {
    type : TileType | undefined;
    id: string | undefined;

    constructor(type:TileType, id: string)
    {
        this.type = type;
        this.id = id;
    }
}
