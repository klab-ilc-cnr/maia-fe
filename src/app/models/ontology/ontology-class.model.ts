/**Ontology class type definition*/
export class OntologyClass {
    /**class id URI*/
    id!: string;

    /**string after the # symbol in id */
    shortId!: string;

    /**class label */
    label!: string;

    /**number of childern of the this node */
    children!:number;

    /**name to be shown */
    name!: string;

    /**class creator */
    creator!: string;

    creationDate!: string;
    
    lastUpdate!: string;

    /**class status */
    status: ClassStatus = ClassStatus.unknown;
}

export enum ClassStatus {
    unknown = 'unknown', completed = "completed", reviewed = "reviewed", working = "working"
}