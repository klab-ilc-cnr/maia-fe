import { Component, Input, OnInit } from '@angular/core';
import { DropdownField, SelectButtonField } from 'src/app/models/dropdown-field';
import { LexiconService } from 'src/app/services/lexicon.service';

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
  statusForm: SelectButtonField[] = [];
  selectedStatusForm?: SelectButtonField;
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

    this.loadStatus();
  }

  loadLanguages() {
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
        this.selectedStatusForm = this.statusForm.find((el: any) => el.icon === data.status);
        this.labelForm = data.label;
        this.confidenceForm = data.confidence < 0 ? 0 : data.confidence * 100;
        console.info(this.confidenceForm)

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

  loadStatus() {
    this.lexiconService.getStatus().subscribe({
      next: (data: any) => {
        this.statusForm = data.map((val: any) => ({
          icon: val['label'],
          justify: ''
        }));

        this.loadLexicalEntryTypes();
      },
      error: (error: any) => {
        console.error(error)
      }
    });
  }

}
