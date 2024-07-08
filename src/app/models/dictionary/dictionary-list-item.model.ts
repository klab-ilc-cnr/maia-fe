import { DictionaryBase } from "./dictionary-base.model";

export interface DictionaryListItem extends DictionaryBase {
    [key: string]: number|string|string[]|boolean|{ id: string, label: string }[];
    language: string;
    /**Defines whether it is a referral item (i.e., an empty entry) */
    isReferralItem: boolean;
    sameDictionaryEntryAs: { id: string, label: string }[];
}
