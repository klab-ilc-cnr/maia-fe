import { FeatureType } from "./feature-type"

export class Feature {
  id: number | undefined
  layerId: number | undefined
  name: string | undefined
  type: FeatureType | undefined
  tagsetId?: number | undefined
  description: string | undefined
}
