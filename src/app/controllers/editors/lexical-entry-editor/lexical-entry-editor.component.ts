import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { DropdownField, SelectButtonField } from 'src/app/models/dropdown-field';
import { LexicalEntryType } from 'src/app/models/lexicon/lexical-entry.model';
import { CommonService } from 'src/app/services/common.service';
import { LexiconService } from 'src/app/services/lexicon.service';

@Component({
  selector: 'app-lexical-entry-editor',
  templateUrl: './lexical-entry-editor.component.html',
  styleUrls: ['./lexical-entry-editor.component.scss']
})
export class LexicalEntryEditorComponent implements OnInit, OnDestroy {
  private subscription!: Subscription;

  /**Definisce se elementi del form sono in caricamento */
  loading = false;
  confidenceForm?: number;
  labelForm?: string;
  @Input() typesForm!: DropdownField[];
  selectedTypeForm?: DropdownField;
  @Input() partOfSpeechesForm!: DropdownField[];
  selectedPartOfSpeechesForm?: DropdownField;
  @Input() languagesForm!: DropdownField[];
  selectedLanguageForm?: DropdownField;
  noteForm?: string;
  attestationsForm: any[] = [];
  @Input() statusForm!: SelectButtonField[];
  selectedStatusForm?: SelectButtonField;
  lastUpdate = '';

  @Input() instanceName!: string;

  pendingChanges = false;

  constructor(
    private lexiconService: LexiconService,
    private commonService: CommonService
  ) { }

  ngOnInit(): void {
    this.loadData()

    this.subscription = this.commonService.notifyObservable$.subscribe((res: any) => {
      if ('option' in res && res.option === 'lexical_entry_editor_save' && this.instanceName === res.value) {
        this.handleSave(null);
      }
    })

  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  handleSave(event: any) {
    console.group('Handle save in lexical entry editor'); //TODO sostituire con meccanismo di salvataggio
    console.info(this.selectedStatusForm)
    console.info(this.labelForm);
    console.info(this.confidenceForm);
    console.info(this.selectedTypeForm);
    console.info(this.selectedPartOfSpeechesForm);
    console.info(this.selectedLanguageForm);
    console.info(this.noteForm);
    console.groupEnd();
    this.pendingChanges = false;
    this.commonService.notifyOther({ option: 'lexicon_edit_pending_changes', value: this.pendingChanges, type: LexicalEntryType.LEXICAL_ENTRY })
  }

  loadData() {
    this.loading = true;

    this.loadLexicalEntry();
  }

  onPendingChanges() {
    if (this.pendingChanges) {
      return;
    }

    this.pendingChanges = true;
    this.commonService.notifyOther({ option: 'lexicon_edit_pending_changes', value: this.pendingChanges, type: LexicalEntryType.LEXICAL_ENTRY });
  }

  private loadLexicalEntry() {
    this.lexiconService.getLexicalEntry(this.instanceName).subscribe({
      next: (data: any) => {
        this.selectedStatusForm = this.statusForm.find((el: any) => el.icon === data.status);
        this.labelForm = data.label;
        this.confidenceForm = data.confidence < 0 ? 0 : data.confidence * 100;

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

}
