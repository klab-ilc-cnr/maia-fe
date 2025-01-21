import { OntologyStatuses } from "./ontology-statuses.model";

export class LabelObject {
        /**label language */
        language!: string;

        /**label value */
        value!: string;

        /**label type */
        type!: string;
}

export enum OntologyType {
        class = "class",
        equivalentClass = "equivalentClass",
        object = "object",
        data = "data",
        individual = "individual",
}

export class OntologyBase {
        /**id URI*/
        id!: string;

        /**string after the # symbol in id */
        shortId!: string;

        /**node label */
        label!: LabelObject[];

        /**number of childern of the this node */
        children!: number;

        /**node creator */
        creator!: string;

        /**node creation date */
        creationDate!: string;

        /**node last update */
        lastUpdate!: string;

        type!: OntologyType;

        confidence!: number;

        comment!: string;

        /**name to be shown */
        name!: string;//TODO: remove

        /**node status */
        status: OntologyStatuses = OntologyStatuses.unknown;
}
