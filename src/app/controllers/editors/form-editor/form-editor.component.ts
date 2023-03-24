import { AfterViewInit, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { forkJoin, Subscription, take } from 'rxjs';
import { DropdownField } from 'src/app/models/dropdown-field';
import { LexicalEntryType } from 'src/app/models/lexicon/lexical-entry.model';
import { FormUpdater, FORM_RELATIONS, LinguisticRelationUpdater, LINGUISTIC_RELATIONS } from 'src/app/models/lexicon/lexicon-updater';
import { Morphology } from 'src/app/models/lexicon/morphology.model';
import { OntolexType } from 'src/app/models/lexicon/ontolex-type.model';
import { CommonService } from 'src/app/services/common.service';
import { LexiconService } from 'src/app/services/lexicon.service';
import { LoggedUserService } from 'src/app/services/logged-user.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';

@Component({
  selector: 'app-form-editor',
  templateUrl: './form-editor.component.html',
  styleUrls: ['./form-editor.component.scss']
})
export class FormEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  private subscription!: Subscription;

  @Input() lexicalEntryID!: string | undefined;

  writtenRepresentationInput?: string;
  @Input() typesDropdownList!: DropdownField[];
  selectedType?: DropdownField;
  noteInput?: string;
  attestationsList: any[] = [];
  loading?: boolean;

  @Input() traitsDropdown!: DropdownField[];

  @Input() morphologicalData!: Morphology[];

  morphologicalForms: {
    selectedTrait: DropdownField,
    propertiesList: DropdownField[],
    selectedProperty: DropdownField
  }[] = [];

  @Input() instanceName!: string;

  lastUpdate = '';

  pendingChanges = false;

  private initialValues!: { type: string, writtenRep: string, note: string, morphs: { trait: string, value: string }[] };

  constructor(
    private lexiconService: LexiconService,
    private commonService: CommonService,
    private loggedUserService: LoggedUserService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.subscription = this.commonService.notifyObservable$.subscribe((res) => {
      if ('option' in res && res.option === 'form_selected' && res.value !== this.instanceName && this.lexicalEntryID === res.lexEntryId) {
        this.instanceName = res.value;
        this.loadData();
      }
      if ('option' in res && res.option === 'form_editor_save' && this.instanceName === res.value) {
        this.handleSave();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  handleSave() {
    const successMsg = "Forma aggiornata con successo";
    const currentUser = this.loggedUserService.currentUser;
    const currentUserName = currentUser?.name + '.' + currentUser?.surname;

    // eslint-disable-next-line prefer-const
    let httpList = [];

    if (this.selectedType?.code !== this.initialValues.type) {
      httpList.push(this.lexiconService.updateLexicalForm(currentUserName, this.instanceName, <FormUpdater>{ relation: FORM_RELATIONS.TYPE, value: this.selectedType?.code }));
      this.initialValues.type = this.selectedType!.code;
    }
    if (this.writtenRepresentationInput !== this.initialValues.writtenRep) {
      httpList.push(this.lexiconService.updateLexicalForm(currentUserName, this.instanceName, <FormUpdater>{ relation: FORM_RELATIONS.WRITTEN_REP, value: this.writtenRepresentationInput }));
      this.initialValues.writtenRep = this.writtenRepresentationInput!;
    }
    if (this.noteInput !== this.initialValues.note) {
      httpList.push(this.lexiconService.updateLexicalForm(currentUserName, this.instanceName, <FormUpdater>{ relation: FORM_RELATIONS.NOTE, value: this.noteInput }));
      this.initialValues.note = this.noteInput!;
    }
    this.morphologicalForms.forEach(mf => {
      const currentValueIndex = this.initialValues.morphs.findIndex(e => e.trait === mf.selectedTrait.code);
      const currentValue = this.initialValues.morphs.find(e => e.trait === mf.selectedTrait.code)?.value;
      const newValue = mf.selectedProperty.code;
      if (currentValue !== newValue) {
        httpList.push(this.lexiconService.updateLinguisticRelation(this.instanceName, <LinguisticRelationUpdater>{
          type: LINGUISTIC_RELATIONS.MORPHOLOGY,
          relation: mf.selectedTrait.code,
          value: newValue,
          currentValue: currentValue
        }));
      }
      if (currentValueIndex !== -1) {
        this.initialValues.morphs[currentValueIndex].value = newValue;
      } else {
        this.initialValues.morphs.push({ trait: mf.selectedTrait.code, value: newValue });
      }
    });
    if (httpList.length > 0) {
      forkJoin(httpList).pipe(take(1)).subscribe((res: string[]) => {
        this.pendingChanges = false;
        this.commonService.notifyOther({ option: 'lexicon_edit_pending_changes', value: this.pendingChanges, type: LexicalEntryType.FORM })
        this.commonService.notifyOther({ option: 'lexicon_edit_update_tree', value: this.lexicalEntryID });
        this.lastUpdate = new Date(res[0]).toLocaleString();
        this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
      });
    }
  }

  loadData() {
    this.loading = true;
    // this.loadFormTypes();
    this.loadForm();
  }

  onAddMorphForm() {
    this.morphologicalForms = [
      ...this.morphologicalForms,
      {
        selectedTrait: { name: '--none', code: '' },
        propertiesList: [],
        selectedProperty: { name: '--none', code: '' }
      }
    ]
  }

  onChangeTraitSelection(traitDropdownField: any, mfIndex: number) {
    this.morphologicalForms[mfIndex] = {
      selectedTrait: traitDropdownField,
      propertiesList: this.loadProperties(traitDropdownField.code),
      selectedProperty: { name: '--none--', code: '' }
    };
  }

  onPendingChanges() {
    if (this.pendingChanges) {
      return;
    }

    this.pendingChanges = true;
    this.commonService.notifyOther({ option: 'lexicon_edit_pending_changes', value: this.pendingChanges, type: LexicalEntryType.FORM });
  }


  onRemoveMorphForm(morph: any) {
    const successMsg = "Forma aggiornata con successo";
    this.morphologicalForms = this.morphologicalForms.filter(mf => mf !== morph);
    const initialValuesIndex = this.initialValues.morphs.findIndex(mf => mf.trait === morph.selectedTrait.code);
    if(initialValuesIndex !== -1) {
      this.lexiconService.deleteRelation(this.instanceName, {relation: morph.selectedTrait.code, value: morph.selectedProperty.code}).pipe(take(1)).subscribe(res => {
        this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
        this.initialValues.morphs = this.initialValues.morphs.filter(m => m.trait !== morph.selectedTrait.code);
        this.lastUpdate = new Date(res).toLocaleString();
      });
    }
  }

  private loadForm() {
    this.lexiconService.getForm(this.instanceName).subscribe({
      next: (data: any) => {
        this.writtenRepresentationInput = data.label.find((el: any) => el.propertyID === 'writtenRep').propertyValue;

        this.selectedType = this.typesDropdownList.find(el => el.code === data.type);

        this.noteInput = data.note;
        this.attestationsList = data.links.find((el: any) => el.type === 'Attestation').elements.map((att: any) => ({
          name: att['label'],
          code: att['label']
        }));

        this.lastUpdate = data.lastUpdate ? new Date(data.lastUpdate).toLocaleString() : '';

        this.morphologicalForms = data.morphology.map((el: any) => {
          const propList = this.loadProperties(el.trait);
          return {
            selectedTrait: this.traitsDropdown.find((val: any) => val.code === el.trait),
            propertiesList: propList,
            selectedProperty: propList.find((p: any) => p.code === el.value)
          };
        });
        if (this.morphologicalForms.length === 0) {
          this.onAddMorphForm();
        }

        this.initialValues = {
          type: this.selectedType!.code,
          writtenRep: this.writtenRepresentationInput!,
          note: this.noteInput!,
          morphs: data.morphology
        };

        this.loading = false;
      },
      error: (error: any) => {
        console.error(error);
      }
    })
  }

  private loadProperties(traitId: any) {
    if (traitId === '') {
      return [];
    }

    const morph = this.morphologicalData.find((el: Morphology) => el.propertyId === traitId)?.propertyValues;

    const values = morph ? morph.map((val: OntolexType) => (<DropdownField>{
      name: val.valueLabel,
      code: val.valueId
    })) : []

    return [<DropdownField>{
      name: '--none--',
      code: ''
    }, ...values];
  }
}
