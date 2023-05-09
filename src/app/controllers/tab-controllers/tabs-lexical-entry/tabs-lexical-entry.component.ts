import { Component, Input } from '@angular/core';
import { DropdownField } from 'src/app/models/dropdown-field';

@Component({
  selector: 'app-tabs-lexical-entry',
  templateUrl: './tabs-lexical-entry.component.html',
  styleUrls: ['./tabs-lexical-entry.component.scss']
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

}
