import { TileType } from "./tile-type.model";

export class Tile<T> {
    id: string;
    workspaceId: string | undefined;
    content: T | undefined; // i diversi tipi di tile potrebbero avere contenuti diversi
    tileConfig: any | undefined;
    type : TileType | undefined;

    constructor(id: string, workspaceId: string, content:T, tileConfig:any, type:TileType)
    {
        this.id = id;
        this.workspaceId = workspaceId;
        this.content = content;
        this.tileConfig = tileConfig;
        this.type = type;
    }
}
