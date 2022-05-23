import { TileType } from "./tile-type.model";

export class Tile<T> {
    id: string | undefined;
    workspaceId: number | undefined;
    content: T | undefined;
    type : TileType | undefined;

    constructor(type:TileType, id: string)
    {
        this.type = type;
        this.id = id;
    }
}
