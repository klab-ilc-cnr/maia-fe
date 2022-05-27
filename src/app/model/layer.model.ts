export class Layer {
    id: number | undefined;
    name: string | undefined;
    color: string | undefined;
    description: string | undefined;

    constructor(id?: number, name?:string, color?: string, description?:string)
    {
        this.id = id;
        this.name = name;
        this.color = color;
        this.description = description;
    }
}
