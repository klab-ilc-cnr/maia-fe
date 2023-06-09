import { TAnnotElementBase } from "./t-annot-element-base";
import { TLayer } from "./t-layer";
import { TTagset } from "./t-tagset";

export enum TFeatureType {
  STRING = 'STRING',
  URI = 'URI',
  TAGSET = 'TAGSET',
}

export class TFeature extends TAnnotElementBase {
  layer: TLayer | undefined;
  type: TFeatureType | undefined;
  tagset: TTagset | undefined;
}
