import { OntologyStatuses } from "./ontology-statuses.model";

export class OntologyBase {
        /**id URI*/
        id!: string;

        /**string after the # symbol in id */
        shortId!: string;
    
        /**node label */
        label!: string;
    
        /**number of childern of the this node */
        children!:number;
    
        /**name to be shown */
        name!: string;
    
        /**node creator */
        creator!: string;
    
        /**node creation date */
        creationDate!: string;
        
        /**node last update */
        lastUpdate!: string;
    
        /**node status */
        status: OntologyStatuses = OntologyStatuses.unknown;
}
