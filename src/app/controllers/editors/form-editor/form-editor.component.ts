import { Component, Input, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { UpdateRelation as UpdateRelation } from 'src/app/models/lexicon/update-lexicon-relation.model';
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

  traitsDropdown: DropdownField[] = [];
  selectedTrait?: DropdownField;
  propertiesDropdown: DropdownField[] = [];
  selectedProperty?: DropdownField;

  @Input() instanceName!: string;

  constructor(private lexiconService: LexiconService,
    private commonService: CommonService) { }

  ngAfterViewInit(): void {
    this.subscription = this.commonService.notifyObservable$.subscribe((res) => {
      if (res.hasOwnProperty('option') && res.option === 'form_selected') {
        this.instanceName = res.value;
        this.loadData();
      }
    });
  }

  ngOnInit(): void {
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

        data.morphology.forEach((element: any) => {

        });

        this.loading = false;
      },
      error: (error: any) => {

      }
    })
  }

  handleSave(event: any) {
    let writtenRep: UpdateRelation = { relation: "writtenRep", value: this.writtenRepresentationInput };
    //let typesUpdate: UpdateRelation = { relation: "type", value: this.selectedTypesForm?.map(type => type.code) };
    let noteUpdate: UpdateRelation = { relation: "note", value: this.noteInput };

    this.lexiconService.updateForm(this.instanceName, writtenRep).subscribe({
      next: (data: any) => { },
      error: (error: any) => { }
    })
    /*         this.lexiconService.updateForm(this.instanceName, typesUpdate).subscribe({
              next: (data: any) => { },
              error: (error: any) => { }
            }) */
    this.lexiconService.updateForm(this.instanceName, noteUpdate).subscribe({
      next: (data: any) => { },
      error: (error: any) => { }
    })
  }
}

interface DropdownField {
  name: string,
  code: string
}
