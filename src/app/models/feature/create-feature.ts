import { FeatureType } from "./feature-type"

export class CreateFeature {
  id: number | undefined
  layerId: number | undefined
  name: string | undefined
  type: FeatureType | undefined
  tagsetId: number | undefined
  description: string | undefined
}
