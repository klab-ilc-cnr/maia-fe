import { FieldBase } from "./field-base";

export class FieldText extends FieldBase<string> {
  override controlType = 'textbox';
}
