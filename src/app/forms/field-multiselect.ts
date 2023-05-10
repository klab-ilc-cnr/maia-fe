import { FieldBase } from "./field-base";

export class FieldMultiselect extends FieldBase<string[]> {
  override controlType = 'multiselect'
}
