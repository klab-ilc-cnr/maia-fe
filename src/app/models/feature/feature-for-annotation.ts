import { Feature } from "./feature";

export class FeatureForAnnotation extends Feature{
  placeholder: string | undefined
  dropdownOptions: Array<any> = []
  modelPropName: string | undefined
  value: any
}
