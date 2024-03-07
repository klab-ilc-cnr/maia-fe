
/**A section representation mapping object */
export class Section {
    id!: number;

    start!: number;

    end!: number;

    title!: string;

    /**sentum string index */
    index!: string;

    /**starting row index */
    row_start!: number;

    /**ending row index */
    row_end!: number;

    type!: SectionType;

    children!: Array<Section>;
}

export class SectionType {
    id!: number;
    name!: string;
}