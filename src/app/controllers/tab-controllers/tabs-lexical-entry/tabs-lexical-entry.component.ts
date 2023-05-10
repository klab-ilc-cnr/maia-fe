import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { FieldBase } from 'src/app/forms/field-base';
import { DropdownField } from 'src/app/models/dropdown-field';
import { FieldService } from 'src/app/services/field.service';

@Component({
  selector: 'app-tabs-lexical-entry',
  templateUrl: './tabs-lexical-entry.component.html',
  styleUrls: ['./tabs-lexical-entry.component.scss'],
  providers: [FieldService]
})
export class TabsLexicalEntryComponent {
  /**Lista delle option per i tipi di entrata lessicale */
  @Input() lexicalEntryTypes!: DropdownField[];
  /**Lista delle option per le POS */
  @Input() partOfSpeeches!: DropdownField[];
  /**Lista delle option per i valori della lingua */
  @Input() languageValues!: DropdownField[];
  /**Identificativo dell'entrata lessicale */
  @Input() lexicalEntryInstanceName!: string;

  fields$: Observable<FieldBase<any>[]>;

  constructor(fieldService: FieldService) {
    this.fields$ = fieldService.getFields();
  }
}
