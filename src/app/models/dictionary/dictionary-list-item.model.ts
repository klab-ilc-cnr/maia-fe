import { DictionaryBase } from "./dictionary-base.model";

export interface DictionaryListItem extends DictionaryBase {
    language: string;
    /**Defines whether it is a referral item (i.e., an empty entry) */
    isReferralItem: boolean;
}
