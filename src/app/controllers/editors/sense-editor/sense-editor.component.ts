import { Component, Input, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { UpdateRelation } from 'src/app/models/lexicon/update-lexicon-relation.model';
import { CommonService } from 'src/app/services/common.service';
import { LexiconService } from 'src/app/services/lexicon.service';

@Component({
  selector: 'app-sense-editor',
  templateUrl: './sense-editor.component.html',
  styleUrls: ['./sense-editor.component.scss']
})
export class SenseEditorComponent implements OnInit {
  private subscription!: Subscription;

  noteInput?: string;
  definitionInput?: string;
  referenceInput?: string;
  attestationsList: any[] = [];
  loading?: boolean;

  @Input() instanceName!: string;

  constructor(private lexiconService: LexiconService,
    private commonService: CommonService) { }

  ngAfterViewInit(): void {
    this.subscription = this.commonService.notifyObservable$.subscribe((res) => {
      if (res.hasOwnProperty('option') && res.option === 'sense_selected') {
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

    this.loadSense();
  }

  loadSense() {
    this.lexiconService.getSense(this.instanceName).subscribe({
      next: (data: any) => {
        this.definitionInput = data.definition.find((el: any) => el.propertyID === 'definition').propertyValue;

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
    let definitionUpdate: UpdateRelation = { relation: "definition", value: this.definitionInput };
    //let referenceUpdate: UpdateRelation = { relation: "references", value: this.referenceInput };
    let noteUpdate: UpdateRelation = { relation: "note", value: this.noteInput };

    this.lexiconService.updateSense(this.instanceName, definitionUpdate).subscribe({
      next: (data: any) => { },
      error: (error: any) => { }
    })
    /*     this.lexiconService.updateLexicalEntry(this.instanceName, referenceUpdate).subscribe({
          next: (data: any) => { },
          error: (error: any) => { }
        }) */
    this.lexiconService.updateSense(this.instanceName, noteUpdate).subscribe({
      next: (data: any) => { },
      error: (error: any) => { }
    })
  }
}

interface DropdownField {
  name: string,
  code: string
}