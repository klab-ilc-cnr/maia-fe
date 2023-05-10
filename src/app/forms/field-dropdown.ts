import { FieldBase } from "./field-base";

export class FieldDropdown extends FieldBase<string> {
  override controlType = 'dropdown';
}
