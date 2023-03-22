import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription, take } from 'rxjs';
import { DropdownField, SelectButtonField } from 'src/app/models/dropdown-field';
import { LexicalEntryType } from 'src/app/models/lexicon/lexical-entry.model';
import { LexicalEntryUpdater, LEXICAL_ENTRY_RELATIONS, LinguisticRelationUpdater, LINGUISTIC_RELATIONS } from 'src/app/models/lexicon/lexicon-updater';
import { CommonService } from 'src/app/services/common.service';
import { LexiconService } from 'src/app/services/lexicon.service';
import { LoggedUserService } from 'src/app/services/logged-user.service';

@Component({
  selector: 'app-lexical-entry-editor',
  templateUrl: './lexical-entry-editor.component.html',
  styleUrls: ['./lexical-entry-editor.component.scss']
})
export class LexicalEntryEditorComponent implements OnInit, OnDestroy {
  private subscription!: Subscription;

  lexicalEntryInstanceName!: string;

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

  lexicalEntryPOS!: string;

  constructor(
    private lexiconService: LexiconService,
    private commonService: CommonService,
    private loggedUserService: LoggedUserService
  ) { }

  ngOnInit(): void {
    this.loadData()

    this.subscription = this.commonService.notifyObservable$.subscribe((res: any) => {
      if ('option' in res && res.option === 'lexical_entry_editor_save' && this.instanceName === res.value) {
        this.handleSave();
      }
    })

  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  handleSave() {
    const currentUser = this.loggedUserService.currentUser;
    const currentUserName = (currentUser?.name + '.' + currentUser?.surname);

    console.group('Handle save in lexical entry editor');
    // console.info(this.selectedStatusForm) //BUG errore nella chiamata perché non chiaro come gestire aggiornamento di status
    this.lexiconService.updateLexicalEntry(currentUserName, this.lexicalEntryInstanceName, <LexicalEntryUpdater>{ relation: LEXICAL_ENTRY_RELATIONS.STATUS, value: this.selectedStatusForm?.icon }).pipe(take(1)).subscribe();
    this.lexiconService.updateLexicalEntry(currentUserName, this.lexicalEntryInstanceName, <LexicalEntryUpdater>{ relation: LEXICAL_ENTRY_RELATIONS.LABEL, value: this.labelForm }).pipe(take(1)).subscribe();
    console.info(this.confidenceForm); //TODO CONTROLLARE COME ESEGUIRE QUESTO UPDATE
    // console.info(this.selectedTypeForm);
    this.lexiconService.updateLexicalEntry(currentUserName, this.lexicalEntryInstanceName, <LexicalEntryUpdater>{ relation: LEXICAL_ENTRY_RELATIONS.TYPE, value: this.selectedTypeForm?.code }).pipe(take(1)).subscribe();
    // console.info(this.selectedPartOfSpeechesForm);
    this.lexiconService.updateLinguisticRelation(this.lexicalEntryInstanceName, <LinguisticRelationUpdater>{
      type: LINGUISTIC_RELATIONS.MORPHOLOGY,
      relation: 'partOfSpeech',
      value: this.selectedPartOfSpeechesForm?.code,
      currentValue: this.lexicalEntryPOS
    }).pipe(take(1)).subscribe();
    // console.info(this.selectedLanguageForm);
    this.lexiconService.updateLexicalEntry(currentUserName, this.lexicalEntryInstanceName, <LexicalEntryUpdater>{ relation: LEXICAL_ENTRY_RELATIONS.LANGUAGE, value: this.selectedLanguageForm?.code }).pipe(take(1)).subscribe();
    // console.info(this.noteForm);
    this.lexiconService.updateLexicalEntry(currentUserName, this.lexicalEntryInstanceName, <LexicalEntryUpdater>{ relation: LEXICAL_ENTRY_RELATIONS.NOTE, value: this.noteForm }).pipe(take(1)).subscribe();
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
        this.lexicalEntryInstanceName = data.lexicalEntryInstanceName;
        this.lexicalEntryPOS = data.pos;

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
