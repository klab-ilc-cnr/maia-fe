import { TLayer } from "./t-layer";
import { TTagset } from "./t-tagset";

export enum TFeatureType {
  STRING = 'STRING',
  URI = 'URI',
  TAGSET = 'TAGSET',
}

export class TFeature extends TTagset {
  layer: TLayer | undefined;
  type: TFeatureType | undefined;
  tagset: TTagset | undefined;
}
