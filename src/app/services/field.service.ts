import { Injectable } from '@angular/core';
import { FieldBase } from '../forms/field-base';
import { FieldText } from '../forms/field-text';
import { FieldDropdown } from '../forms/field-dropdown';
import { of } from 'rxjs';
import { LexiconService } from './lexicon.service';

@Injectable()
export class FieldService {
  constructor(
    private lexiconService: LexiconService
  ) {}

  getFields() {
    const fields: FieldBase<string | string[] | {value: string, checkbox: boolean}>[] = [
      new FieldText({
        key: 'label',
        label: 'Label',
        required: true,
        styleClass: 'col-6',
        type: 'text'
      }),
      new FieldDropdown({
        key: 'language',
        label: 'Language',
        styleClass: 'col-6',
        options: [
          { key: 'som', value: 'Somalo'},
          { key: 'it', value: 'Italiano' }
        ]
      })
    ];

    return of(fields);
  }
}
