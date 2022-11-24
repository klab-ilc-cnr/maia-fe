import { Component, Input, OnInit } from '@angular/core';
import { elementAt, Subscription } from 'rxjs';
import { LexicalEntry } from 'src/app/models/lexicon/lexical-entry.model';
import { LexiconService } from 'src/app/services/lexicon.service';

@Component({
  selector: 'app-lexical-entry-editor',
  templateUrl: './lexical-entry-editor.component.html',
  styleUrls: ['./lexical-entry-editor.component.scss']
})
export class LexicalEntryEditorComponent implements OnInit {
  private subscription!: Subscription;
  private loading: boolean = false;

  uncertainOptions: any[] = [];
  uncertainForm?: string;
  labelForm?: string;
  typesForm: DropdownField[] = [];
  selectedTypeForm?: DropdownField;
  partOfSpeechesForm: DropdownField[] = [];
  selectedPartOfSpeechForm?: DropdownField;
  languagesForm: DropdownField[] = [];
  selectedLanguageForm?: DropdownField;
  noteForm?: string;
  attestationsForm: any[] = [];

  @Input() instanceName!: string;

  constructor(private lexiconService: LexiconService) { }

  ngOnInit(): void {
    this.loadData();

    this.uncertainOptions = [
      { label: 'Off', value: 'off' },
      { label: 'On', value: 'on' },
    ];
    this.uncertainForm = 'off';
  }

  loadData() {
    this.loading = true;

    this.loadLexicalEntryTypes();
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
      error: (error: any) => { }
    })
  }

  loadPartOfSpeech() {
    this.lexiconService.getMorphology().subscribe({
      next: (data: any) => {
        this.partOfSpeechesForm = data.find((el: any) => el.propertyId === 'partOfSpeech')
          .propertyValues.map((propValue: any) => ({
            name: propValue['valueLabel'],
            code: propValue['valueId']
          }))

        this.loadLanguages();
      },
      error: (error: any) => { }
    })
  }

  loadLanguages() {
    this.lexiconService.getLexicalEntriesLanguages().subscribe({
      next: (data: any) => {
        this.languagesForm = data.map((lang: any) => ({
          name: lang['label'],
          code: lang['lexvo']
        }))

        this.loadLexicalEntry();
      },
      error: (error: any) => {

      }
    })
  }

  loadLexicalEntry() {
    this.lexiconService.getLexicalEntry(this.instanceName).subscribe({
      next: (data: any) => {
        this.labelForm = data.label;
        this.selectedTypeForm = this.typesForm.find(el => el.code === data.type[0]);
        this.selectedPartOfSpeechForm = this.partOfSpeechesForm.find(el => el.code === data.pos);
        this.selectedLanguageForm = this.languagesForm.find(el => el.code === data.language);
        this.noteForm = data.note;
        this.attestationsForm = data.links.find((el: any) => el.type === 'Attestation').elements.map((att: any) => ({
          name: att['label'],
          code: att['label']
        }))

        this.loading = false;
      },
      error: (error: any) => {

      }
    })
  }

  handleSave(event: any) {
    //execute action
  }
}

interface DropdownField {
  name: string,
  code: string
}
