import { FieldBase } from "./field-base";

export class FieldDropdownInput extends FieldBase<{value: string, checkbox: boolean}> {
  override controlType = 'dropdownInput'
}
