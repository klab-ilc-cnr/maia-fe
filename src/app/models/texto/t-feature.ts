import { TLayer } from "./t-layer";
import { TTagset } from "./t-tagset";

/**Enum of supported feature types */
export enum TFeatureType {
  STRING = 'STRING',
  URI = 'URI',
  TAGSET = 'TAGSET',
  LEXICAL_ENTRY = "LEXICAL_ENTRY",
  FORM = "FORM",
  SENSE = "SENSE",
}

/**Class describing an annotation layer feature */
export class TFeature extends TTagset {
  /**The annotation layer to which the feature belongs */
  layer: TLayer | undefined;
  /**Feature type (e.g. STRING) */
  type: TFeatureType | undefined;
  /**Tagset of possible values if the feature is of type tagset */
  tagset: TTagset | undefined;
}
