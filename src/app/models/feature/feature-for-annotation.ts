import { FeatureWithTagsets } from "./feature-with-tagsets";

export class FeatureForAnnotation extends FeatureWithTagsets{
  placeholder: string | undefined
  dropdownOptions: Array<any> = []
  modelPropName: string | undefined
  value: any
}
