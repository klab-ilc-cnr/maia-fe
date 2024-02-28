export class Section {
    id!: number;
    start!: number;
    end!: number;
    title!: string;
    index!: string;
    row_start!: number;
    row_end!: number;
    type!: SectionType;
    children!: Array<Section>;
}

export class SectionType {
    id!: number;
    name!: string;
}