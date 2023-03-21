import { AfterViewInit, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { DropdownField } from 'src/app/models/dropdown-field';
import { LexicalEntryType } from 'src/app/models/lexicon/lexical-entry.model';
import { Morphology } from 'src/app/models/lexicon/morphology.model';
import { OntolexType } from 'src/app/models/lexicon/ontolex-type.model';
import { CommonService } from 'src/app/services/common.service';
import { LexiconService } from 'src/app/services/lexicon.service';

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

  constructor(
    private lexiconService: LexiconService,
    private commonService: CommonService
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
        this.handleSave(null);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  handleSave(event: any) {
    console.group('Handle save in lexical entry editor'); //TODO sostituire con meccanismo di salvataggio
    console.info(this.selectedType);
    console.info(this.writtenRepresentationInput);
    console.info(this.noteInput);
    console.info(this.morphologicalForms);
    console.groupEnd();

    this.pendingChanges = false;
    this.commonService.notifyOther({ option: 'lexicon_edit_pending_changes', value: this.pendingChanges, type: LexicalEntryType.FORM })
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
    this.morphologicalForms = this.morphologicalForms.filter(mf => mf !== morph);
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
