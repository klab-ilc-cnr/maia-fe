import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Observable, Subject, catchError, debounceTime, map, of, skip, take, takeUntil, throwError } from 'rxjs';
import { searchModeEnum } from 'src/app/models/lexicon/lexical-entry-request.model';
import { LexicalEntryCore, MorphologyProperty } from 'src/app/models/lexicon/lexical-entry.model';
import { LEXICAL_ENTRY_RELATIONS, LINGUISTIC_RELATION_TYPE, LexicalEntryUpdater, LinguisticRelationUpdater } from 'src/app/models/lexicon/lexicon-updater';
import { LinguisticRelationModel } from 'src/app/models/lexicon/linguistic-relation.model';
import { Roles } from 'src/app/models/roles';
import { User } from 'src/app/models/user';
import { CommonService } from 'src/app/services/common.service';
import { GlobalStateService } from 'src/app/services/global-state.service';
import { LexiconService } from 'src/app/services/lexicon.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { UserService } from 'src/app/services/user.service';

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
        //TODO utilizza lexical entry updater con relation entry
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
    this.denotes.push(new FormControl({ label: '', value: '', external: true, inferred: false })); //TODO da modificare quando potremo inserire l'autocomplete sulle ontologie
  }

  onAddEvokes() {
    this.evokes.push(new FormControl({ label: '', value: '', external: true, inferred: false })); //TODO da modificare quando potremo inserire evokes da autocomplete
  }

  onAddSeeAlso() {
    this.seeAlso.push(new FormControl({ label: '', value: '', external: false, inferred: false }));
  }

  onRemoveDenotes(index: number) {
    this.denotes.removeAt(index);
  }

  onRemoveEvokes(index: number) {
    this.evokes.removeAt(index);
  }

  onRemoveSeeAlso(index: number) {
    this.seeAlso.removeAt(index);
  }

  onSelectDenote(ontology: string, formIndex: number) {
    this.denotes.at(formIndex).setValue(ontology);
  }

  onSelectLexicalConcept(lexConceptId: string, formIndex: number) {
    this.evokes.at(formIndex).setValue(lexConceptId);
  }

  onSelectLexEntry(lexEntryId: string, formIndex: number) {
    const formElementInitial = this.seeAlso.at(formIndex);
    if (formElementInitial.value !== lexEntryId) {
      //TODO update http then update form
      // this.seeAlso.at(formIndex).setValue(lexEntryId);
    }
  }

  private getDenotes() {
    this.linguisticRelationCall('denotes').subscribe(denotesList => {
      console.info('denotes', denotesList);
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
        this.seeAlso.push(new FormControl({ label: seeAlso.label, value: seeAlso.entity, external: seeAlso.linkType === 'external', inferred: seeAlso.inferred }))
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

  private async updateGenericRelation() { } //TODO da implementare

  private async updateLexicalEntryField(relation: LEXICAL_ENTRY_RELATIONS, value: any) {
    if (!this.currentUser.name) {
      this.messageService.add(this.msgConfService.generateWarningMessageConfig(`Current user not found`));
      return;
    }
    const updater = <LexicalEntryUpdater>{
      relation: relation,
      value: value
    };
    this.lexiconService.updateLexicalEntry(this.currentUser.name, this.lexicalEntry.lexicalEntry, updater).pipe(
      take(1),
      catchError((error: HttpErrorResponse) => {
        this.messageService.add(this.msgConfService.generateWarningMessageConfig(`${this.lexicalEntry.label} update "${relation}" failed `));
        return throwError(() => new Error(error.error));
      }),
    ).subscribe((resp) => {
      this.lexicalEntry = <LexicalEntryCore>{ ...this.lexicalEntry, lastUpdate: resp };
      this.messageService.add(this.msgConfService.generateSuccessMessageConfig(`${this.lexicalEntry.label} update "${relation}" success `));
      this.commonService.notifyOther({ option: 'lexicon_edit_update_tree', value: this.lexicalEntry.lexicalEntry });
    });
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
    this.lexiconService.updateLinguisticRelation(this.lexicalEntry.lexicalEntry, updater).pipe(
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
}
