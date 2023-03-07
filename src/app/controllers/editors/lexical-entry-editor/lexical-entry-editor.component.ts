import { Component, Input, OnInit } from '@angular/core';
import { LexiconService } from 'src/app/services/lexicon.service';

interface DropdownField {
  name: string,
  code: string
}

@Component({
  selector: 'app-lexical-entry-editor',
  templateUrl: './lexical-entry-editor.component.html',
  styleUrls: ['./lexical-entry-editor.component.scss']
})
export class LexicalEntryEditorComponent implements OnInit {
  /**Definisce se elementi del form sono in caricamento */
  loading: boolean = false;
  confidenceForm?: number;
  labelForm?: string;
  typesForm: DropdownField[] = [];
  selectedTypeForm?: DropdownField;
  partOfSpeechesForm: DropdownField[] = [];
  selectedPartOfSpeechesForm?: DropdownField;
  languagesForm: DropdownField[] = [];
  selectedLanguageForm?: DropdownField;
  noteForm?: string;
  attestationsForm: any[] = [];
  lastUpdate: string = '';

  @Input() instanceName!: string;

  constructor(
    private lexiconService: LexiconService
  ) { }

  ngOnInit(): void {
    this.loadData()
  }

  loadData() {
    this.loading = true;

    this.loadLexicalEntryTypes();
  }

  loadLanguages() {
    console.info('load languages')
    this.lexiconService.getLanguages().subscribe({
      next: (data: any) => {
        this.languagesForm = data.map((lang: any) => ({
          name: lang['label'],
          code: lang['label']
        }));

        this.loadLexicalEntry();
      },
      error: (error: any) => {
        console.error(error);
      }
    });
  }

  loadLexicalEntry() {
    this.lexiconService.getLexicalEntry(this.instanceName).subscribe({
      next: (data: any) => {
        this.labelForm = data.label;
        this.confidenceForm = data.confidence *100;

        this.selectedTypeForm = this.typesForm.find(el => el.code === data.type[0]);

        this.selectedPartOfSpeechesForm = this.partOfSpeechesForm.find(el => el.code === data.pos);
        this.selectedLanguageForm = this.languagesForm.find(el => el.code === data.language);
        this.noteForm = data.note;
        this.attestationsForm = data.links.find((el: any) => el.type === 'Attestation').elements.map((att: any) => ({
          name: att['label'],
          code: att['label']
        }));

        this.lastUpdate = data.lastUpdate ? new Date(data.lastUpdate).toLocaleString() : '';

        this.loading = false;
      },
      error: (error: any) => {
        console.error(error)
      }
    });
  }

  loadLexicalEntryTypes() {
    console.info('load entry types')

    this.lexiconService.getLexicalEntryTypes().subscribe({
      next: (data: any) => {
        this.typesForm = data.map((val: any) => ({
          name: val['valueLabel'],
          code: val['valueId']
        }));

        this.loadPartOfSpeech();
      },
      error: (error: any) => {
        console.error(error);
      }
    });
  }

  loadPartOfSpeech() {
    this.lexiconService.getMorphology().subscribe({
      next: (data: any) => {
        this.partOfSpeechesForm = data.find((el: any) => el.propertyId === 'partOfSpeech')
          .propertyValues.map((propValue: any) => ({
            name: propValue['valueLabel'],
            code: propValue['valueId']
          }));

        this.loadLanguages();
      },
      error: (error: any) => {
        console.error(error);
      }
    });
  }

}
