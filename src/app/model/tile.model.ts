import { TileType } from "./tile-type.model";

export class Tile<T> {
    id: string;
    workspaceId: string | undefined;
    content: T | undefined; // i diversi tipi di tile potrebbero avere contenuti diversi
    tileConfig: any | undefined;
    type : TileType | undefined;

    constructor(type:TileType, id: string)
    {
        this.type = type;
        this.id = id;
    }
}
