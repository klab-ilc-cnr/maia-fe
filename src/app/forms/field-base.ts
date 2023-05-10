export class FieldBase<T> {
  value: T|undefined;
  key: string;
  label: string;
  required: boolean;
  styleClass: string;
  controlType: string;
  type: string;
  options: {key: string, value: string}[];

  constructor(options: {
    value?: T;
    key?: string;
    label?: string;
    required?: boolean;
    styleClass?: string;
    controlType?: string;
    type?: string;
    options?: {key: string, value: string}[];
  }) {
    this.value = options.value;
    this.key = options.key || '';
    this.label = options.label || '';
    this.required = !!options.required;
    this.styleClass = options.styleClass || 'form-row';
    this.controlType = options.controlType || '';
    this.type = options.type || '';
    this.options = options.options || [];
  }
}
