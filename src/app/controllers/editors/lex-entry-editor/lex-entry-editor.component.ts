import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { Observable, Subscription, map, of, take } from 'rxjs';
import { searchModeEnum } from 'src/app/models/lexicon/lexical-entry-request.model';
import { LexicalEntryCore } from 'src/app/models/lexicon/lexical-entry.model';
import { LinguisticRelationModel } from 'src/app/models/lexicon/linguistic-relation.model';
import { GlobalStateService } from 'src/app/services/global-state.service';
import { LexiconService } from 'src/app/services/lexicon.service';

@Component({
  selector: 'app-lex-entry-editor',
  templateUrl: './lex-entry-editor.component.html',
  styleUrls: ['./lex-entry-editor.component.scss']
})
export class LexEntryEditorComponent implements OnInit, OnDestroy {
  emptyField = '-- Select --'
  subs!: Subscription;
  @Input() lexicalEntry$!: Observable<LexicalEntryCore>;
  lexicalEntry!: LexicalEntryCore;
  initialType!: string;
  form = new FormGroup({
    status: new FormControl<string>({ value: '', disabled: true }), //TODO sostituire disabled true con controllo sui ruoli utente
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
  ) {
  }

  ngOnInit(): void {
    this.subs = this.lexicalEntry$.subscribe(le => {
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
      const seeAlsoCount = this.lexicalEntry.links.find(l => l.type === 'Reference')?.elements.find(r => r.label === 'seeAlso')?.count;
      if (seeAlsoCount && seeAlsoCount > 0) {
        this.getSeeAlso();
      }
      this.getDenotes();
      this.getEvokes();
    })
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
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
    this.seeAlso.at(formIndex).setValue(lexEntryId);
  }

  onSubmit() {
    console.info('form', this.form.value)
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
}
