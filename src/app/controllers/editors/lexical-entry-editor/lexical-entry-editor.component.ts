import { Component, Input, OnInit } from '@angular/core';
import { elementAt, Subscription } from 'rxjs';
import { LexicalEntry } from 'src/app/models/lexicon/lexical-entry.model';
import { LexiconService } from 'src/app/services/lexicon.service';
import { UpdateLexiconRelation } from 'src/app/models/lexicon/update-lexicon-relation.model';

@Component({
  selector: 'app-lexical-entry-editor',
  templateUrl: './lexical-entry-editor.component.html',
  styleUrls: ['./lexical-entry-editor.component.scss']
})
export class LexicalEntryEditorComponent implements OnInit {
  private subscription!: Subscription;
  
  uncertainOptions: any[] = [];
  uncertainForm?: string;
  labelForm?: string;
  typesForm: DropdownField[] = [];
  selectedTypesForm?: DropdownField[] = [];
  partOfSpeechesForm: DropdownField[] = [];
  selectedPartOfSpeechForm?: DropdownField;
  languagesForm: DropdownField[] = [];
  selectedLanguageForm?: DropdownField;
  noteForm?: string;
  attestationsForm: any[] = [];
  loading?: boolean;

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
        //this.uncertainForm = TRUE o FALSE; TODO capire dove prendere questo dato

        this.selectedTypesForm = [];
        data.type.forEach((typeCode: string) => {
          this.selectedTypesForm!.push(this.typesForm.find(el => el.code === typeCode)!);
        });
        //this.selectedTypeForm = this.typesForm.filter(el => el.code === data.type[0]);

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
    let labelUpdate: UpdateLexiconRelation = { relation: "label", value: this.labelForm };
    /* let uncertainUpdate: UpdateLexiconRelation = { relation: "uncertain", value: this.uncertainForm }; TODO*/
    let typesUpdate: UpdateLexiconRelation = { relation: "type", value: this.selectedTypesForm?.map(type => type.code) };
    let posUpdate: UpdateLexiconRelation = { relation: "pos", value: this.selectedPartOfSpeechForm?.code };
    let languageUpdate: UpdateLexiconRelation = { relation: "language", value: this.selectedLanguageForm?.code };
    let noteUpdate: UpdateLexiconRelation = { relation: "note", value: this.noteForm };

    this.lexiconService.updateLexicalEntry(this.instanceName, labelUpdate).subscribe({
      next: (data: any) => { },
      error: (error: any) => { }
    })
    this.lexiconService.updateLexicalEntry(this.instanceName, typesUpdate).subscribe({
      next: (data: any) => { },
      error: (error: any) => { }
    })
    this.lexiconService.updateLexicalEntry(this.instanceName, posUpdate).subscribe({
      next: (data: any) => { },
      error: (error: any) => { }
    })
    this.lexiconService.updateLexicalEntry(this.instanceName, languageUpdate).subscribe({
      next: (data: any) => { },
      error: (error: any) => { }
    })
    this.lexiconService.updateLexicalEntry(this.instanceName, noteUpdate).subscribe({
      next: (data: any) => { },
      error: (error: any) => { }
    })
  }
}

interface DropdownField {
  name: string,
  code: string
}
