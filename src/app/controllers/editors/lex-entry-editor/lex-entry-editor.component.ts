import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Observable, Subject, catchError, debounceTime, map, of, skip, take, takeUntil, throwError } from 'rxjs';
import { searchModeEnum } from 'src/app/models/lexicon/lexical-entry-request.model';
import { LexicalEntryCore, MorphologyProperty } from 'src/app/models/lexicon/lexical-entry.model';
import { GENERIC_RELATIONS, GENERIC_RELATION_TYPE, GenericRelationUpdater, LEXICAL_ENTRY_RELATIONS, LINGUISTIC_RELATION_TYPE, LexicalEntryUpdater, LinguisticRelationUpdater } from 'src/app/models/lexicon/lexicon-updater';
import { LinguisticRelationModel } from 'src/app/models/lexicon/linguistic-relation.model';
import { Roles } from 'src/app/models/roles';
import { User } from 'src/app/models/user';
import { CommonService } from 'src/app/services/common.service';
import { GlobalStateService } from 'src/app/services/global-state.service';
import { LexiconService } from 'src/app/services/lexicon.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { UserService } from 'src/app/services/user.service';
import { PopupDeleteItemComponent } from '../../popup/popup-delete-item/popup-delete-item.component';

@Component({
  selector: 'app-lex-entry-editor',
  templateUrl: './lex-entry-editor.component.html',
  styleUrls: ['./lex-entry-editor.component.scss']
})
export class LexEntryEditorComponent implements OnInit, OnDestroy {
  private readonly unsubscribe$ = new Subject();
  emptyField = '-- Select --'
  @Input() lexicalEntry$!: Observable<LexicalEntryCore>;
  lexicalEntry!: LexicalEntryCore;
  initialType!: string;
  form = new FormGroup({
    status: new FormControl<string>({ value: '', disabled: true }),
    label: new FormControl<string>(''),
    language: new FormControl<string>(''),
    pos: new FormControl<string>(''),
    type: new FormControl<string[]>([]),
    evokes: new FormArray<FormControl>([]),
    denotes: new FormArray<FormControl>([]),
    seeAlso: new FormArray<FormControl>([])
  });

  _evokes: { label: string, value: string, external: boolean, inferred: boolean }[] = [];
  _denotes: { label: string, value: string, external: boolean, inferred: boolean }[] = [];
  _seeAlso: { label: string, value: string, external: boolean, inferred: boolean }[] = [];

  /**Lista delle option dello status */
  statusForm: string[] = ['completed', 'reviewed', 'working'];
  languages$ = this.globalState.languages$;
  pos$ = this.globalState.pos$;
  types$ = this.globalState.lexicalEntryTypes$;
  currentUser!: User;

  get evokes() {
    return this.form.controls['evokes'] as FormArray;
  }

  get denotes() {
    return this.form.controls['denotes'] as FormArray;
  }

  get seeAlso() {
    return this.form.controls['seeAlso'] as FormArray;
  }

  lexConceptList = (text: string) => this.lexiconService.getFilteredLexicalConcepts({
    text: text,
    searchMode: searchModeEnum.startsWith,
    labelType: "prefLabel",
    author: "",
    offset: 0,
    limit: 500
  }).pipe(
    map(resp => resp.list) //TODO da mappare come lex entry list, non appena capita la struttura dell'oggetto lexical concept
  );

  lexEntryList = (text: string) => this.lexiconService.getLexicalEntriesList({
    text: text,
    searchMode: searchModeEnum.startsWith,
    type: '',
    pos: '',
    formType: '',
    author: '',
    lang: '',
    status: '',
    offset: 0,
    limit: 500
  }).pipe(
    map(resp => resp.list.map(le => <{ label: string, value: string, external: boolean, inferred: boolean }>{
      label: le.label,
      value: le.lexicalEntry,
      external: false,
      inferred: false
    }))
  );

  lexOntolList = (text: string) => of([]); //TODO implementare il recupero delle ontologie

  /**Riferimento al popup di conferma cancellazione */
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

  constructor(
    private globalState: GlobalStateService,
    private lexiconService: LexiconService,
    private userService: UserService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
    private commonService: CommonService,
  ) {
    this.userService.retrieveCurrentUser().pipe(
      take(1),
    ).subscribe(cu => {
      this.currentUser = cu;
    });

    this.form.get('status')?.valueChanges.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(status => {
      if (this.lexicalEntry.status !== status) {
        this.updateLexicalEntryField(LEXICAL_ENTRY_RELATIONS.TERM_STATUS, status).then(() => {
          this.lexicalEntry = <LexicalEntryCore>{ ...this.lexicalEntry, status: status };
        });
      }
    });

    this.form.get('label')?.valueChanges.pipe(
      debounceTime(500),
      takeUntil(this.unsubscribe$),
    ).subscribe(label => {
      if (this.lexicalEntry.label !== label) {
        this.updateLexicalEntryField(LEXICAL_ENTRY_RELATIONS.LABEL, label).then(() => {
          this.lexicalEntry = <LexicalEntryCore>{ ...this.lexicalEntry, label: label };
        });
      }
    });

    this.form.get('language')?.valueChanges.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(language => {
      if (this.lexicalEntry.language !== language) {
        this.updateLexicalEntryField(LEXICAL_ENTRY_RELATIONS.ENTRY, language).then(() => {
          this.lexicalEntry = <LexicalEntryCore>{ ...this.lexicalEntry, language: language }; //TODO da testare non appena disponibile una nuova lingua
        });
      }
    });

    this.form.get('pos')?.valueChanges.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(pos => {
      const posIndex = this.lexicalEntry.morphology.findIndex(m => m.trait.endsWith('#partOfSpeech'));
      const currentPos = posIndex !== -1 ? this.lexicalEntry.morphology[posIndex].value : undefined;
      if (!currentPos || pos !== currentPos) {
        this.updateLinguisticRelation(LINGUISTIC_RELATION_TYPE.MORPHOLOGY, 'http://www.lexinfo.net/ontology/3.0/lexinfo#partOfSpeech', pos, currentPos).then(() => {
          let tempLexEntry = <LexicalEntryCore>{ ...this.lexicalEntry, pos: pos?.split('#')[1] };
          if (posIndex !== -1 && pos) {
            const tempMorph = [...this.lexicalEntry.morphology];
            tempMorph[posIndex] = { ...tempMorph[posIndex], value: pos };
            tempLexEntry = <LexicalEntryCore>{ ...tempLexEntry, morphology: [...tempMorph] };
          } else if (posIndex === -1 && pos) {
            const tempMorph = [...this.lexicalEntry.morphology, <MorphologyProperty>{
              trait: 'http://www.lexinfo.net/ontology/3.0/lexinfo#partOfSpeech',
              value: pos
            }];
            tempLexEntry = <LexicalEntryCore>{ ...tempLexEntry, morphology: [...tempMorph] };
          }
          this.lexicalEntry = tempLexEntry;
        })
      }
    });

    this.form.get('type')?.valueChanges.pipe(
      skip(1),
      takeUntil(this.unsubscribe$),
    ).subscribe(type => {
      this.updateLexicalEntryField(LEXICAL_ENTRY_RELATIONS.TYPE, type);
    });
  }

  ngOnInit(): void {
    this.lexicalEntry$.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(le => {
      this.lexicalEntry = le;
      const lexEntryPosCode = this.lexicalEntry.morphology.find(m => m.trait.endsWith('#partOfSpeech'))?.value;
      const lexEntryTypeCode: string[] = [];
      this.lexicalEntry.type.forEach(type => {
        lexEntryTypeCode.push('http://www.w3.org/ns/lemon/ontolex#' + type); //TODO capire come gestire in maniera generalizzata @andreabellandi
      });
      if (le.status) this.form.get('status')?.setValue(le.status);
      if (le.label) this.form.get('label')?.setValue(le.label);
      if (le.language) this.form.get('language')?.setValue(le.language);
      if (lexEntryPosCode) this.form.get('pos')?.setValue(lexEntryPosCode);
      if (lexEntryTypeCode && lexEntryTypeCode.length > 0) this.form.get('type')?.setValue(lexEntryTypeCode);
      if (this.currentUser.role === Roles.AMMINISTRATORE) { //TODO vedere se altri ruoli devono essere autorizzati
        this.form.get('status')?.enable();
      }
      const seeAlsoCount = this.lexicalEntry.links.find(l => l.type === 'Reference')?.elements.find(r => r.label === 'seeAlso')?.count;
      if (seeAlsoCount && seeAlsoCount > 0) {
        this.getSeeAlso();
      }
      this.getDenotes();
      this.getEvokes();
    })
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  onAddDenotes() {
    const newDenotes = { label: '', value: '', external: true, inferred: false };
    this.denotes.push(new FormControl(newDenotes)); //TODO da modificare quando potremo inserire l'autocomplete sulle ontologie
    this._denotes.push({ ...newDenotes });
  }

  onAddEvokes() {
    const newEvokes = { label: '', value: '', external: true, inferred: false };
    this.evokes.push(new FormControl(newEvokes)); //TODO da modificare quando potremo inserire evokes da autocomplete
    this._evokes.push({ ...newEvokes });
  }

  onAddSeeAlso() {
    const newSeeAlso = { label: '', value: '', external: false, inferred: false };
    this.seeAlso.push(new FormControl(newSeeAlso));
    this._seeAlso.push({ ...newSeeAlso });
  }

  onRemoveDenotes(index: number) {
    const currentValue = this._denotes[index].value;
    if (!currentValue || currentValue === '') {
      this.denotes.removeAt(index);
      this._denotes.splice(index, 1);
      return;
    }
    if (currentValue && currentValue !== '') {
      const confirmMsg = `Are you sure to remove "${currentValue}"?`;
      this.popupDeleteItem.confirmMessage = confirmMsg;
      this.popupDeleteItem.showDeleteConfirmSimple(() => {
        this.removeRelation({ relation: "http://www.w3.org/ns/lemon/ontolex#denotes", value: currentValue }).then(
          () => {
            this.denotes.removeAt(index);
            this._denotes.splice(index, 1);
          },
          () => null
        );
      });
    }
  }

  onRemoveEvokes(index: number) {
    const currentValue = this._evokes[index].value;
    if (!currentValue || currentValue === '') {
      this.evokes.removeAt(index);
      this._evokes.splice(index, 1);
      return;
    }
    if (currentValue && currentValue !== '') {
      const confirmMsg = `Are you sure to remove "${currentValue}"?`;
      this.popupDeleteItem.confirmMessage = confirmMsg;
      this.popupDeleteItem.showDeleteConfirmSimple(() => {
        this.removeRelation({ relation: "http://www.w3.org/ns/lemon/ontolex#evokes", value: currentValue }).then(
          () => {
            this.evokes.removeAt(index);
            this._evokes.splice(index, 1);
          },
          () => null
        );
      });
    }
  }

  onRemoveSeeAlso(index: number) {
    const currentValue = this._seeAlso[index].value;
    if (!currentValue || currentValue === '') {
      this.seeAlso.removeAt(index);
      this._seeAlso.splice(index, 1);
      return;
    }
    if (currentValue && currentValue !== '') {
      const confirmMsg = `Are you sure to remove "${currentValue}"?`;
      this.popupDeleteItem.confirmMessage = confirmMsg;
      this.popupDeleteItem.showDeleteConfirmSimple(() => {
        this.removeRelation({ relation: GENERIC_RELATIONS.SEEALSO, value: currentValue }).then(
          () => {
            this.seeAlso.removeAt(index);
            this._seeAlso.splice(index, 1);
          },
          () => null
        );
      });
    }
  }

  onSelectDenote(selectedValue: { label: string, value: string, external: boolean, inferred: boolean }, formIndex: number) {
    if (this._denotes[formIndex].value !== selectedValue.value) {
      this.updateLinguisticRelation(LINGUISTIC_RELATION_TYPE.CONCEPT_REF, "http://www.w3.org/ns/lemon/ontolex#denotes", selectedValue.value, this._denotes[formIndex].value).then(() => {
        this.updateListControlList(this.denotes, this._denotes, formIndex, selectedValue);
      });
    }
  }

  onSelectLexicalConcept(selectedValue: { label: string, value: string, external: boolean, inferred: boolean }, formIndex: number) { //BUG con https://dbpedia.org/page/House non funziona, da testare
    if (this._evokes[formIndex].value !== selectedValue.value) {
      this.updateLinguisticRelation(LINGUISTIC_RELATION_TYPE.CONCEPT_REL, "http://www.w3.org/ns/lemon/ontolex#evokes", selectedValue.value, this._evokes[formIndex].value).then(() => {
        this.updateListControlList(this.evokes, this._evokes, formIndex, selectedValue);
      });
    }
  }

  onSelectLexEntry(selectedValue: { label: string, value: string, external: boolean, inferred: boolean }, formIndex: number) {
    if (this._seeAlso[formIndex].value !== selectedValue.value) {
      this.updateGenericRelation(GENERIC_RELATION_TYPE.REFERENCE, GENERIC_RELATIONS.SEEALSO, selectedValue.value, this._seeAlso[formIndex].value).then(() => {
        this.updateListControlList(this.seeAlso, this._seeAlso, formIndex, selectedValue);
      });
    }
  }

  private getDenotes() {
    this.linguisticRelationCall('denotes').subscribe(denotesList => {
      denotesList.forEach(denote => {
        const denoteElement = { label: denote.label, value: denote.entity, external: denote.linkType === 'external', inferred: denote.inferred };
        this.denotes.push(new FormControl(denoteElement));
        this._denotes.push(<{ label: string, value: string, external: boolean, inferred: boolean }>{ ...denoteElement });
      });
    });
  }

  private getEvokes() {
    this.linguisticRelationCall('evokes').subscribe(evokesList => {
      console.info('evokes', evokesList);
    });
  }

  private getSeeAlso() {
    this.linguisticRelationCall('seeAlso').subscribe((seeAlsoList: LinguisticRelationModel[]) => {
      seeAlsoList.forEach(seeAlso => {
        const seeAlsoElement = { label: seeAlso.label, value: seeAlso.entity, external: seeAlso.linkType === 'external', inferred: seeAlso.inferred };
        this.seeAlso.push(new FormControl(seeAlsoElement));
        this._seeAlso.push(<{ label: string, value: string, external: boolean, inferred: boolean }>{ ...seeAlsoElement });
      });
    });
  }

  private linguisticRelationCall(relation: string): Observable<LinguisticRelationModel[]> {
    return this.lexiconService.getLinguisticRelations(relation, this.lexicalEntry.lexicalEntry).pipe(
      take(1),
      map((list: LinguisticRelationModel[]) => list.sort((a, b) => a.inferred === b.inferred ? 0 : (
        a.inferred && !b.inferred ? -1 : 1
      ))),
    );
  }

  private async manageUpdateObservable(updateObs: Observable<string>, relation: string) {
    updateObs.pipe(
      take(1),
      catchError((error: HttpErrorResponse) => {
        this.messageService.add(this.msgConfService.generateWarningMessageConfig(`${this.lexicalEntry.label} update "${relation}" failed `));
        return throwError(() => new Error(error.error));
      }),
    ).subscribe(resp => {
      this.lexicalEntry = <LexicalEntryCore>{ ...this.lexicalEntry, lastUpdate: resp };
      this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`${this.lexicalEntry.label} update "${relation}" success `));
      this.commonService.notifyOther({ option: 'lexicon_edit_update_tree', value: this.lexicalEntry.lexicalEntry });
    });
  }

  private async removeRelation(updater: { relation: string, value: string }) {
    this.lexiconService.deleteRelation(this.lexicalEntry.lexicalEntry, updater).pipe(
      take(1),
      catchError((error: HttpErrorResponse) => {
        this.messageService.add(this.msgConfService.generateWarningMessageConfig(`${this.lexicalEntry.label} removing "${updater.value}" failed `));
        return throwError(() => new Error(error.error));
      }),
    ).subscribe(resp => {
      this.lexicalEntry = <LexicalEntryCore>{ ...this.lexicalEntry, lastUpdate: resp };
      this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`${this.lexicalEntry.label} removing "${updater.value}" success `));
      this.commonService.notifyOther({ option: 'lexicon_edit_update_tree', value: this.lexicalEntry.lexicalEntry });
    });
  }

  private async updateGenericRelation(type: GENERIC_RELATION_TYPE, relation: GENERIC_RELATIONS, value: any, currentValue: any) {
    const updater = <GenericRelationUpdater>{
      type: type,
      relation: relation,
      value: value,
      currentValue: currentValue
    };
    this.manageUpdateObservable(this.lexiconService.updateGenericRelation(this.lexicalEntry.lexicalEntry, updater), relation);
  }

  private async updateLexicalEntryField(relation: LEXICAL_ENTRY_RELATIONS, value: any) {
    if (!this.currentUser.name) {
      this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Current user not found`));
      return;
    }
    const updater = <LexicalEntryUpdater>{
      relation: relation,
      value: value
    };
    this.manageUpdateObservable(this.lexiconService.updateLexicalEntry(this.currentUser.name, this.lexicalEntry.lexicalEntry, updater), relation);
  }

  private async updateLinguisticRelation(type: LINGUISTIC_RELATION_TYPE, relation: string, value: any, currentValue?: any) {
    if (!this.currentUser.name) {
      this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Current user not found`));
      return;
    }
    const updater = <LinguisticRelationUpdater>{
      type: type,
      relation: relation,
      value: value,
      currentValue: currentValue ?? ''
    };
    this.manageUpdateObservable(this.lexiconService.updateLinguisticRelation(this.lexicalEntry.lexicalEntry, updater), relation);
  }

  private updateListControlList(list: FormArray<any>, controlList: { label: string, value: string, external: boolean, inferred: boolean }[], index: number, value: { label: string, value: string, external: boolean, inferred: boolean }) {
    list.at(index).setValue(value);
    controlList[index] = <{ label: string, value: string, external: boolean, inferred: boolean }>{ ...value };
  }
}
