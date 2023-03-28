import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { forkJoin, Subscription, take } from 'rxjs';
import { DropdownField, SelectButtonField } from 'src/app/models/dropdown-field';
import { LexicalEntryType } from 'src/app/models/lexicon/lexical-entry.model';
import { LexicalEntryUpdater, LEXICAL_ENTRY_RELATIONS, LinguisticRelationUpdater, LINGUISTIC_RELATIONS } from 'src/app/models/lexicon/lexicon-updater';
import { CommonService } from 'src/app/services/common.service';
import { LexiconService } from 'src/app/services/lexicon.service';
import { LoggedUserService } from 'src/app/services/logged-user.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';

/**Componente dell'editor per le entrate lessicali */
@Component({
  selector: 'app-lexical-entry-editor',
  templateUrl: './lexical-entry-editor.component.html',
  styleUrls: ['./lexical-entry-editor.component.scss']
})
export class LexicalEntryEditorComponent implements OnInit, OnDestroy {
  /**Sottoscrizione per la gestione del notify */
  private subscription!: Subscription;

  /**Identificativo dell'entrata lessicale */
  lexicalEntryInstanceName!: string;

  /**Definisce se elementi del form sono in caricamento */
  loading = false;
  /**Input numerico della confidenza */
  confidenceForm?: number;
  /**Text input della label */
  labelForm?: string;
  /**Lista delle option dei tipi */
  @Input() typesForm!: DropdownField[];
  /**Option selezionata del tipo */
  selectedTypeForm?: DropdownField;
  /**Lista delle option delle POS */
  @Input() partOfSpeechesForm!: DropdownField[];
  /**Option selezionata della POS */
  selectedPartOfSpeechesForm?: DropdownField;
  /**Lista delle option delle lingue */
  @Input() languagesForm!: DropdownField[];
  /**Option selezionata della lingua */
  selectedLanguageForm?: DropdownField;
  /**Text input delle note */
  noteForm?: string;
  /**Lista delle attestazioni */
  attestationsForm: any[] = [];
  /**Lista delle option dello status */
  @Input() statusForm!: SelectButtonField[];
  /**Option selezionata dello status */
  selectedStatusForm?: SelectButtonField;
  /**Data di ultima modifica */
  lastUpdate = '';
  /**Valori iniziali del form */
  initialValues!: { status: string, label: string, confidence: number, type: string, pos: string, lang: string, note: string };

  /**Identificativo dell'entrata lessicale */
  @Input() instanceName!: string;

  /**Definisce se ci sono modifiche pendenti */
  pendingChanges = false;

  /**
   * Costruttore per LexicalEntryEditorComponent
   * @param lexiconService {LexiconService} servizi relativi al lessico
   * @param commonService {CommonService} servizi comuni
   * @param loggedUserService {LoggedUserService} servizi relativi all'utente loggato
   * @param messageService {MessageService} servizi dei messaggi primeng
   * @param msgConfService {MessageConfigurationService} servizi di configurazione dei messaggi
   */
  constructor(
    private lexiconService: LexiconService,
    private commonService: CommonService,
    private loggedUserService: LoggedUserService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService
  ) { }

  /**Metodo dell'interfaccia OnInit, utilizzato per il caricamento preliminare dei dati e la sottoscrizione di notify */
  ngOnInit(): void {
    this.loadData()

    this.subscription = this.commonService.notifyObservable$.subscribe((res: any) => {
      if ('option' in res && res.option === 'lexical_entry_editor_save' && this.instanceName === res.value) {
        this.handleSave();
      }
    })

  }

  /**Metodo dell'interfaccia OnDestroy, utilizzato per cancellare la sottoscrizione */
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**Metodo per la gestione del salvataggio delle modifiche all'entrata lessicale */
  handleSave() {
    const successMsg = "Entrata aggiornata con successo";
    const currentUser = this.loggedUserService.currentUser;
    const currentUserName = (currentUser?.name + '.' + currentUser?.surname);
    // eslint-disable-next-line prefer-const
    let httpList = [];
    //BUG errore nella chiamata perché non chiaro come gestire aggiornamento di status
    if (this.initialValues.status !== this.selectedStatusForm?.icon) {
      httpList.push(this.lexiconService.updateLexicalEntry(currentUserName, this.lexicalEntryInstanceName, <LexicalEntryUpdater>{ relation: LEXICAL_ENTRY_RELATIONS.STATUS, value: this.selectedStatusForm?.icon }));
      this.initialValues.status = this.selectedStatusForm!.icon;
    }
    if (this.initialValues.label !== this.labelForm) {
      httpList.push(this.lexiconService.updateLexicalEntry(currentUserName, this.lexicalEntryInstanceName, <LexicalEntryUpdater>{ relation: LEXICAL_ENTRY_RELATIONS.LABEL, value: this.labelForm }));
      this.initialValues.label = this.labelForm!;
    }
    console.info(this.confidenceForm); //TODO CONTROLLARE COME ESEGUIRE QUESTO UPDATE
    if (this.initialValues.type !== this.selectedTypeForm?.code) {
      httpList.push(this.lexiconService.updateLexicalEntry(currentUserName, this.lexicalEntryInstanceName, <LexicalEntryUpdater>{ relation: LEXICAL_ENTRY_RELATIONS.TYPE, value: this.selectedTypeForm?.code }));
      this.initialValues.type = this.selectedTypeForm!.code;
    }
    if (this.initialValues.pos !== this.selectedPartOfSpeechesForm?.code) {
      httpList.push(this.lexiconService.updateLinguisticRelation(this.lexicalEntryInstanceName, <LinguisticRelationUpdater>{
        type: LINGUISTIC_RELATIONS.MORPHOLOGY,
        relation: 'partOfSpeech',
        value: this.selectedPartOfSpeechesForm?.code,
        currentValue: this.initialValues.pos
      }));
      this.initialValues.pos = this.selectedPartOfSpeechesForm!.code;
    }
    if (this.initialValues.lang !== this.selectedLanguageForm?.code) {
      httpList.push(this.lexiconService.updateLexicalEntry(currentUserName, this.lexicalEntryInstanceName, <LexicalEntryUpdater>{ relation: LEXICAL_ENTRY_RELATIONS.LANGUAGE, value: this.selectedLanguageForm?.code }));
      this.initialValues.lang = this.selectedLanguageForm!.code;
    }
    if (this.initialValues.note !== this.noteForm) {
      httpList.push(this.lexiconService.updateLexicalEntry(currentUserName, this.lexicalEntryInstanceName, <LexicalEntryUpdater>{ relation: LEXICAL_ENTRY_RELATIONS.NOTE, value: this.noteForm }));
      this.initialValues.note = this.noteForm!;
    }
    if (httpList.length > 0) {
      forkJoin(httpList).pipe(take(1)).subscribe((res: string[]) => {
        this.lastUpdate = new Date(res[0]).toLocaleString()
        this.pendingChanges = false;
        this.commonService.notifyOther({ option: 'lexicon_edit_pending_changes', value: this.pendingChanges, type: LexicalEntryType.LEXICAL_ENTRY })
        this.commonService.notifyOther({ option: 'lexicon_edit_update_tree', value: this.lexicalEntryInstanceName });
        this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
      });
    }
  }

  /**Metodo per la gestione del caricamento dei dati */
  loadData() {
    this.loading = true;

    this.loadLexicalEntry();
  }

  /**Metodo per la gestione delle modifiche pendenti */
  onPendingChanges() {
    if (this.pendingChanges) {
      return;
    }

    this.pendingChanges = true;
    this.commonService.notifyOther({ option: 'lexicon_edit_pending_changes', value: this.pendingChanges, type: LexicalEntryType.LEXICAL_ENTRY });
  }

  /**
   * @private
   * Metodo per il caricamento dei dati dell'entrata lessicale
   */
  private loadLexicalEntry() {
    this.lexiconService.getLexicalEntry(this.instanceName).subscribe({
      next: (data: any) => {
        this.initialValues = {
          status: data.status,
          label: data.label,
          confidence: data.confidence,
          type: data.type,
          pos: data.pos,
          lang: data.language,
          note: data.note
        };
        this.lexicalEntryInstanceName = data.lexicalEntryInstanceName;

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
