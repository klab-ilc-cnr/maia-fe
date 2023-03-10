import { AfterViewInit, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { LexicalEntryType } from 'src/app/models/lexicon/lexical-entry.model';
import { CommonService } from 'src/app/services/common.service';
import { LexiconService } from 'src/app/services/lexicon.service';

@Component({
  selector: 'app-sense-editor',
  templateUrl: './sense-editor.component.html',
  styleUrls: ['./sense-editor.component.scss']
})
export class SenseEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  private subscription!: Subscription;

  noteInput?: string;
  definitionInput?: string;
  referenceInput?: string;
  attestationsList: any[] = [];
  loading?: boolean;

  @Input() instanceName!: string;

  lastUpdate?: string = '';

  pendingChanges: boolean = false;

  constructor(
    private commonService: CommonService,
    private lexiconService: LexiconService
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.subscription = this.commonService.notifyObservable$.subscribe((res) => {
      if (res.hasOwnProperty('option') && res.option === 'sense_selected' && res.value === this.instanceName) {
        this.instanceName = res.value;
        this.loadData();
      }
      if (res.hasOwnProperty('option') && res.option === 'sense_editor_save' && this.instanceName === res.value) {
        this.handleSave(null);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  handleSave(event: any) {
    console.group('Handle save in lexical entry editor'); //TODO sostituire con meccanismo di salvataggio
    console.info(this.definitionInput);
    console.info(this.referenceInput);
    console.info(this.noteInput);
    console.groupEnd();

    this.pendingChanges = false;
    this.commonService.notifyOther({ option: 'lexicon_edit_pending_changes', value: this.pendingChanges, type: LexicalEntryType.SENSE })
  }

  loadData() {
    this.loading = true;

    this.loadSense();
  }

  onPendingChanges() {
    if(this.pendingChanges) {
      return;
    }

    this.pendingChanges = true;
    this.commonService.notifyOther({ option: 'lexicon_edit_pending_changes', value: this.pendingChanges, type: LexicalEntryType.SENSE });
  }

  private loadSense() {
    this.lexiconService.getSense(this.instanceName).subscribe({
      next: (data: any) => {
        this.definitionInput = data.definition.find((el: any) => el.propertyID === 'definition').propertyValue;
        this.noteInput = data.note;

        this.attestationsList = data.links.find((el: any) => el.type === 'Attestation').elements.map((att: any) => ({
          name: att['label'],
          code: att['label']
        }));

        this.lastUpdate = data.lastUpdate ? new Date(data.lastUpdate).toLocaleString() : '';

        this.loading = false;
      },
      error: (error: any) => {
        console.error(error);
      }
    })
  }
}
