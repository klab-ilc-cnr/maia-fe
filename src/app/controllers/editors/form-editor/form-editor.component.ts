import { Component, Input, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonService } from 'src/app/services/common.service';
import { LexiconService } from 'src/app/services/lexicon.service';

@Component({
  selector: 'app-form-editor',
  templateUrl: './form-editor.component.html',
  styleUrls: ['./form-editor.component.scss']
})
export class FormEditorComponent implements OnInit {
  private subscription!: Subscription;
  
  writtenRepresentationInput?: string;
  typesDropdownList: DropdownField[] = [];
  selectedType?: DropdownField;
  noteInput?: string;
  attestationsList: any[] = [];
  loading?: boolean;

  @Input() instanceName!: string;

  constructor(private lexiconService: LexiconService,
    private commonService: CommonService) { }

  ngOnInit(): void {
    this.subscription = this.commonService.notifyObservable$.subscribe((res) => {
      if (res.hasOwnProperty('option') && res.option === 'form_selected') {
        this.loadData();
      }
    });

    this.loadData();
  }

  loadData() {
    this.loading = true;

    this.loadLexicalEntryTypes();
  }

  loadLexicalEntryTypes() {
    this.lexiconService.getLexicalEntryTypes().subscribe({
      next: (data: any) => {
        this.typesDropdownList = data.map((val: any) => ({
          name: val['valueLabel'],
          code: val['valueId']
        }));

        this.loadForm();
      },
      error: (error: any) => { }
    })
  }

  loadForm() {
    this.lexiconService.getForm(this.instanceName).subscribe({
      next: (data: any) => {
        this.writtenRepresentationInput = data.label.find((el: any) => el.propertyID === 'writtenRep').propertyValue;

        this.selectedType = this.typesDropdownList.find(el => el.code === data.type);

        this.noteInput = data.note;
        this.attestationsList = data.links.find((el: any) => el.type === 'Attestation').elements.map((att: any) => ({
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
    /*     let labelUpdate: UpdateLexiconRelation = { relation: "label", value: this.labelForm };
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
      } */
  }
}

interface DropdownField {
  name: string,
  code: string
}
