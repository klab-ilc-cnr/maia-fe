import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Observable, Subject, forkJoin, map, take, takeUntil } from 'rxjs';
import { formTypeEnum, searchModeEnum } from 'src/app/models/lexicon/lexical-entry-request.model';
import { FormListItem, SenseListItem } from 'src/app/models/lexicon/lexical-entry.model';
import { TFeature, TFeatureType } from 'src/app/models/texto/t-feature';
import { TLayer } from 'src/app/models/texto/t-layer';
import { TTagsetItem } from 'src/app/models/texto/t-tagset-item';
import { User } from 'src/app/models/user';
import { AnnotationService, MultipleAnnotationRequest, MultipleAnnotationResponse as MultipleAnnotationResponse, WordAnnotationRequest, WordAnnotationResponse } from 'src/app/services/annotation.service';
import { CommonService } from 'src/app/services/common.service';
import { LayerService } from 'src/app/services/layer.service';
import { LexiconService } from 'src/app/services/lexicon.service';
import { TagsetService } from 'src/app/services/tagset.service';
import { UserService } from 'src/app/services/user.service';
import { uriValidator } from 'src/app/validators/uri-validator.directive';
import { whitespacesValidator } from 'src/app/validators/whitespaces-validator.directive';

export interface FeatForAnn {
  feature: TFeature | undefined;
  tagsetItems: Observable<TTagsetItem[]> | undefined;
  value: string | undefined;
  checked: boolean;
}

export interface TextOffset {
  index: number;
  resourceId: number;
  start: number;
  end: number;
}

export interface MultipleAnnotationFeature {
  featureId: number;
  value: string | TTagsetItem;
  oldValue?: string; // usato solo in editMode (valore attuale da sostituire)
}

@Component({
  selector: 'app-multiple-text-annotation-editor',
  templateUrl: './multiple-text-annotation-editor.component.html',
  styleUrls: ['./multiple-text-annotation-editor.component.scss']
})
export class MultipleTextAnnotationEditorComponent implements OnDestroy {
  private readonly unsubscribe$ = new Subject();
  private _layerId?: number;
  private _layerColor?: string;
  private _layerName?: string;
  private _textOffsets: TextOffset[] = [];
  private _deleteMode: boolean = false;
  private _editMode: boolean = false;
  private _visible: boolean = false;

  workingLayer!: TLayer;
  /**Tipi di feature */
  featureTypes = TFeatureType;
  currentUser!: User;
  features: FeatForAnn[] = [];

  /** Valori esistenti per ogni feature (per il dropdown del valore attuale in edit mode) */
  existingFeatureValues: Map<string, string[]> = new Map();
  /** Valori temporanei salvati quando lo switch viene disattivato (per ripristinarli quando viene riattivato) */
  private savedOldValues: Map<string, string> = new Map();

  annotationForm = new FormGroup({
    layer: new FormControl<string>({ value: '', disabled: true }),
    text: new FormControl<string>({ value: '', disabled: true }),
    feature: new FormGroup({})
  });

  @Input()
  annotationFragment!: string;

  @Input()
  set layerId(value: number | undefined) {
    this._layerId = value;
  }
  get layerId(): number | undefined {
    return this._layerId;
  }

  @Input()
  set layerColor(value: string | undefined) {
    this._layerColor = value;
  }
  get layerColor(): string | undefined {
    return this._layerColor;
  }

  @Input()
  set layerName(value: string | undefined) {
    this._layerName = value;
  }
  get layerName(): string | undefined {
    return this._layerName;
  }

  @Input()
  set textOffsets(value: TextOffset[]) {
    this._textOffsets = value;
  }
  get textOffsets(): TextOffset[] {
    return this._textOffsets;
  }

  @Input()
  set deleteMode(value: boolean) {
    this._deleteMode = value;
  }
  get deleteMode(): boolean {
    return this._deleteMode;
  }

  @Input()
  set editMode(value: boolean) {
    this._editMode = value;
  }
  get editMode(): boolean {
    return this._editMode;
  }

  @Input()
  set visible(value: boolean) {
    this._visible = value;
    if (value) {
      this.initOnOpen();
    }
  }
  get visible(): boolean {
    return this._visible;
  }

  @Output() onDialogHide = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();
  @Output() onSaveStart = new EventEmitter<void>();
  @Output() onSaveEnd = new EventEmitter<MultipleAnnotationResponse>();
  @Output() onDeleteStart = new EventEmitter<void>();
  @Output() onDeleteEnd = new EventEmitter<MultipleAnnotationResponse>();
  @Output() onEditStart = new EventEmitter<void>();
  @Output() onEditEnd = new EventEmitter<MultipleAnnotationResponse>();

  constructor(
    private layerService: LayerService,
    private tagsetService: TagsetService,
    private userService: UserService,
    private lexiconService: LexiconService,
    private annotationservice: AnnotationService,
    private commonService: CommonService,
  ) {
    this.userService.retrieveCurrentUser().pipe(
      take(1),
    ).subscribe(cu => {
      this.currentUser = cu;
    });
  }

  get featureForm(): FormGroup { return this.annotationForm.get('feature') as FormGroup }

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
    map(resp => resp.list)
  );
  lexEntryById = (id: string) => this.lexiconService.getLexicalEntry(id);

  formList = (text: string) => this.lexiconService.getFormList({
    text: text,
    searchMode: searchModeEnum.startsWith,
    representationType: "writtenRep",
    author: '',
    offset: 0,
    limit: 500
  }).pipe(
    map((resp: any) => resp.list),
  );
  formById = (id: string) => this.lexiconService.getForm(id).pipe(
    map(form => {
      const label = form.label.find(e => e.propertyID === 'writtenRep')?.propertyValue;
      return <FormListItem>{
        creator: form.creator,
        lastUpdate: form.lastUpdate,
        creationDate: form.creationDate,
        confidence: form.confidence,
        type: form.type,
        label: label,
        note: form.note,
        phoneticRep: form.phoneticRep,
        lexicalEntry: form.lexicalEntry,
        form: form.form,
      };
    }),
  );

  senseList = (text: string) => this.lexiconService.getFilteredSenses({
    text: text,
    searchMode: searchModeEnum.startsWith,
    type: "",
    field: "",
    pos: '',
    formType: formTypeEnum.entry,
    author: "",
    lang: "",
    status: "",
    offset: 0,
    limit: 500
  }).pipe(
    map((resp: any) => resp.list),
  );
  senseById = (id: string) => this.lexiconService.getSense(id).pipe(
    map(sense => {
      const definition = sense.definition.find(s => s.propertyID === 'definition')?.propertyValue;
      return <SenseListItem>{
        creator: sense.creator,
        lastUpdate: sense.lastUpdate,
        creationDate: sense.creationDate,
        confidence: sense.confidence,
        sense: sense.sense,
        hasChildren: false,
        definition: definition,
        note: sense.note,
        usage: sense.usage,
        concept: sense.concept,
        description: sense.description,
        gloss: sense.gloss,
        senseExample: sense.senseExample,
        senseTranslation: sense.senseTranslation
      };
    }),
  );

  get isAnyFeatureValue(): boolean {
    return this.features.some((f: FeatForAnn) => {
      const controlName = f.feature?.name;
      if (!controlName) {
        return false;
      }
      const value = this.featureForm.get(controlName)?.value;
      return value !== null && value !== undefined && value !== '';
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  /**
   * @public
   * Metodo che emette l'evento di cancellazione dell'annotazione
   */
  onCancelBtn() {
    this.onCancel.emit();
  }

  /**
   * @public
   * Metodo che resetta i campi relativi alle feature e notifica il servizio comune
   */
  onClearBtn() {
    this.featureForm.reset(); //Svuoto solamente la parte relativa alle feature, perché layer e testo selezionato sono indipendenti
    this.commonService.notifyOther({ option: 'clear_feature_fields' });
  }

  /**
   * @public
   * Metodo che imposta un valore indiretto per un campo specifico del form
   * @param value {any} valore da impostare
   * @param featureFieldName {string} nome del campo della feature
   */
  setIndirectValue(value: any, featureFieldName: string) {
    this.featureForm.get(featureFieldName)?.setValue(value);
  }

  /**
   * @public
   * Metodo che emette l'evento di salvataggio o eliminazione dell'annotazione
   */
  onSubmitAnnotation() {
    if (this.deleteMode) {
      this.onDeleteStart.emit();
    }
    else if (this.editMode) {
      this.onEditStart.emit();
    }
    else {
      this.onSaveStart.emit();
    }

    if (!this.isAnyFeatureValue && !this.deleteMode && !this.editMode) {
      throw Error('No feature value');
    }

    let request: MultipleAnnotationRequest = {
      layerId: this.layerId,
      features: this.createFeatureValueList(),
      offsets: this.textOffsets
    };

    if (this.deleteMode) {
      this.annotationservice.deleteMultipleAnnotation(request).pipe(
        take(1),
      ).subscribe({
        next: (response) => {
          const result = new MultipleAnnotationResponse();
          result.errors = response.errors;
          result.success = response.success;
          this.onDeleteEnd.emit(result);
        },
        error: (err) => {
          this.onDeleteEnd.emit({ status: 'ERROR', success: 0, errors: [] });
        }
      });
      return;
    }

    if (this.editMode) {
      this.annotationservice.updateMultipleAnnotation(request).pipe(
        take(1),
      ).subscribe({
        next: (response) => {
          const result = new MultipleAnnotationResponse();
          result.errors = response.errors;
          result.success = response.success;
          this.onEditEnd.emit(result);
        },
        error: (_err) => {
          this.onEditEnd.emit({ status: 'ERROR', success: 0, errors: [] });
        }
      });
      return;
    }

    this.annotationservice.createMultipleAnnotation(request).pipe(
      take(1),
    ).subscribe({
      next: (response) => {
        const result = new MultipleAnnotationResponse();
          result.errors = response.errors;
          result.success = response.success;
        this.onSaveEnd.emit(result);
      },
      error: (err) => {
        this.onSaveEnd.emit({ status: 'ERROR', success: 0, errors: [] });
      }
    });
  }

  /**
   * Metodo che viene chiamato quando il dialogo viene chiuso.
   */
  dialogHide(): void {
    this.onClearBtn();
    this.onDialogHide.emit();
  }

  /**
   * @private
   * Metodo che crea una lista di valori delle feature per l'annotazione
   * @returns {MultipleAnnotationFeature[]} lista di feature con i relativi valori
   */
  private createFeatureValueList(): MultipleAnnotationFeature[] {
    const result: MultipleAnnotationFeature[] = [];
    this.features.forEach(feature => {
      if (!feature.checked) { return; }

      if (!feature.feature?.name) {
        throw Error('Feature missing name');
      }
      const featValue: string | TTagsetItem = this.featureForm.get(feature.feature.name)?.value;
      const newValue = featValue !== null ? (typeof (featValue) === 'string' ? featValue : featValue.name) : '';

      // In edit mode, se lo switch è attivo e c'è un oldValue selezionato, lo passiamo (altrimenti: qualsiasi valore)
      let oldValue: string | undefined = undefined;
      if (this.editMode) {
        const checked = !!this.featureForm.get(`${feature.feature.name}_checked`)?.value;
        if (checked) {
          const oldValueControl = this.featureForm.get(`${feature.feature.name}_oldValue`);
          const oldValueFormValue = oldValueControl?.value;
          if (oldValueFormValue && oldValueFormValue !== '') {
            oldValue = oldValueFormValue;
          }
        }
      }
      result.push(<MultipleAnnotationFeature>{
        featureId: feature.feature.id,
        value: newValue,
        oldValue: oldValue
      });
    });
    return result;
  }

  /**
   * @private
   * Metodo che inizializza il form con i valori del layer e delle feature
   */
  private createForm() {
    this.annotationForm.controls.layer.setValue(this.workingLayer.name ?? '');
    this.annotationForm.controls.text.setValue(this.annotationFragment);
    this.features.forEach(f => {
      const controlName = f.feature?.name;
      const featureType = f.feature?.type;
      let newControl: FormControl;
      if (!controlName) {
        throw Error('Missing feature name');
      }
      if (!featureType) {
        throw Error('Missing feature type');
      }
      switch (featureType) {
        case this.featureTypes.STRING:
          newControl = new FormControl<string>('', whitespacesValidator);
          break;
        case this.featureTypes.URI:
        case this.featureTypes.LEXICAL_ENTRY:
        case this.featureTypes.FORM:
        case this.featureTypes.SENSE:
          newControl = new FormControl<string>('', uriValidator);
          break;
        default:
          newControl = new FormControl<string>('');
          break;
      }
      this.featureForm.addControl(controlName, newControl);

      // In edit mode: controllo per valore attuale (oldValue)
      if (this.editMode) {
        this.featureForm.addControl(`${controlName}_oldValue`, new FormControl<string>(''));
      }

      const checkedControl = new FormControl<boolean>(f.checked, { nonNullable: true });
      this.featureForm.addControl(`${controlName}_checked`, checkedControl);

      checkedControl.valueChanges.subscribe(value => {
        f.checked = value;
        // In edit mode: gestisci il salvataggio/ripristino del valore quando lo switch viene disattivato/riattivato
        if (this.editMode) {
          const oldValueControl = this.featureForm.get(`${controlName}_oldValue`);
          if (oldValueControl) {
            if (!value) {
              // Quando lo switch viene disattivato, salva il valore corrente e resetta il campo
              const currentValue = oldValueControl.value;
              if (currentValue && currentValue !== '') {
                this.savedOldValues.set(controlName, currentValue);
              }
              oldValueControl.setValue(null, { emitEvent: false });
            } else {
              // Quando lo switch viene riattivato, ripristina il valore salvato se esiste
              const savedValue = this.savedOldValues.get(controlName);
              if (savedValue) {
                oldValueControl.setValue(savedValue, { emitEvent: false });
              }
            }
          }
        }
      });

      // Default:
      // - create: campo sempre attivo
      // - delete/edit: di default "qualsiasi valore" => checked=false (poi il prefill lo porta a true se trova valori)
      checkedControl.setValue(!(this.deleteMode || this.editMode), { emitEvent: false });
    });
  }

  private initOnOpen(): void {
    if (!this.layerId) return;

    // reset form/feature controls per ogni apertura (evita stati sporchi tra aperture)
    this.annotationForm.setControl('feature', new FormGroup({}));
    this.features = [];
    this.existingFeatureValues.clear();
    this.savedOldValues.clear();

    this.fetchAndMapFeatures(this.layerId);
  }

  /**
   * @private
   * Metodo che recupera e mappa le feature di un determinato layer
   * @param layerId {number} ID del layer
   */
  private fetchAndMapFeatures(layerId: number) {
    forkJoin({
      layer: this.layerService.retrieveLayerById(layerId),
      features: this.layerService.retrieveLayerFeatureList(layerId),
    }).pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(response => {
      this.workingLayer = response.layer;
      this.features = response.features.map(feature => {
        const tagsetId = feature.tagset?.id;
        return <FeatForAnn>{
          feature: feature,
          tagsetItems: tagsetId ? this.tagsetService.getTagsetItemsById(tagsetId) : undefined,
          checked: true // default value for checked
        };
      });
      this.createForm();

      if (!this.deleteMode && !this.editMode) {
        this.onClearBtn();
      }

      if (this.deleteMode) {
        this.loadExistingAnnotationsForDelete();
      } else if (this.editMode) {
        this.loadExistingAnnotationsForEdit();
      }
    });
  }

  private loadExistingAnnotationsForDelete(): void {
    if (!this.layerId || this.textOffsets.length === 0) return;

    const offsetsByResource = new Map<number, TextOffset[]>();
    this.textOffsets.forEach(offset => {
      if (!offsetsByResource.has(offset.resourceId)) offsetsByResource.set(offset.resourceId, []);
      offsetsByResource.get(offset.resourceId)!.push(offset);
    });

    const annotationRequests: Observable<WordAnnotationResponse[]>[] = [];
    offsetsByResource.forEach((offsets, resourceId) => {
      const minStart = Math.min(...offsets.map(o => o.start));
      const maxEnd = Math.max(...offsets.map(o => o.end));

      const request = new WordAnnotationRequest();
      request.start = minStart;
      request.end = maxEnd;
      request.layers = this.layerId ? [this.layerId] : [];

      annotationRequests.push(this.annotationservice.retrieveWordAnnotations(resourceId, request));
    });

    if (annotationRequests.length === 0) return;

    forkJoin(annotationRequests).pipe(takeUntil(this.unsubscribe$)).subscribe(responses => {
      const allAnnotations: WordAnnotationResponse[] = responses.flat();

      this.features.forEach(feature => {
        const featureName = feature.feature?.name;
        if (!featureName) return;

        const valueCounts = new Map<string, number>();
        allAnnotations.forEach(ann => {
          ann.features.forEach(f => {
            if (f.feature_name === featureName) {
              valueCounts.set(f.value, (valueCounts.get(f.value) || 0) + 1);
            }
          });
        });

        const checkedControl = this.featureForm.get(`${featureName}_checked`);
        const featureControl = this.featureForm.get(featureName);

        if (!checkedControl || !featureControl) return;

        if (valueCounts.size === 0) {
          checkedControl.setValue(false, { emitEvent: false });
          return;
        }

        const sortedValues = Array.from(valueCounts.entries()).sort((a, b) => b[1] - a[1]);
        const mostCommonValue = sortedValues[0][0];

        const featureObj = this.features.find(f => f.feature?.name === featureName);
        if (featureObj?.feature?.type === this.featureTypes.TAGSET) {
          featureObj.tagsetItems?.pipe(take(1)).subscribe(items => {
            const matchingItem = items.find(item => item.name === mostCommonValue);
            featureControl.setValue(matchingItem ? matchingItem.name : mostCommonValue);
          });
        } else {
          featureControl.setValue(mostCommonValue);
        }

        checkedControl.setValue(true, { emitEvent: false });
      });
    });
  }

  private loadExistingAnnotationsForEdit(): void {
    if (!this.layerId || this.textOffsets.length === 0) return;

    const offsetsByResource = new Map<number, TextOffset[]>();
    this.textOffsets.forEach(offset => {
      if (!offsetsByResource.has(offset.resourceId)) offsetsByResource.set(offset.resourceId, []);
      offsetsByResource.get(offset.resourceId)!.push(offset);
    });

    const annotationRequests: Observable<WordAnnotationResponse[]>[] = [];
    offsetsByResource.forEach((offsets, resourceId) => {
      const minStart = Math.min(...offsets.map(o => o.start));
      const maxEnd = Math.max(...offsets.map(o => o.end));

      const request = new WordAnnotationRequest();
      request.start = minStart;
      request.end = maxEnd;
      request.layers = this.layerId ? [this.layerId] : [];

      annotationRequests.push(this.annotationservice.retrieveWordAnnotations(resourceId, request));
    });

    if (annotationRequests.length === 0) return;

    forkJoin(annotationRequests).pipe(takeUntil(this.unsubscribe$)).subscribe(responses => {
      const allAnnotations: WordAnnotationResponse[] = responses.flat();

      this.features.forEach(feature => {
        const featureName = feature.feature?.name;
        if (!featureName) return;

        const valueCounts = new Map<string, number>();
        allAnnotations.forEach(ann => {
          ann.features.forEach(f => {
            if (f.feature_name === featureName) {
              valueCounts.set(f.value, (valueCounts.get(f.value) || 0) + 1);
            }
          });
        });

        this.existingFeatureValues.set(featureName, Array.from(valueCounts.keys()).sort());

        const checkedControl = this.featureForm.get(`${featureName}_checked`);
        const oldValueControl = this.featureForm.get(`${featureName}_oldValue`);
        if (!checkedControl || !oldValueControl) return;

        if (valueCounts.size === 0) {
          checkedControl.setValue(false, { emitEvent: false });
          oldValueControl.setValue('');
          return;
        }

        const sortedValues = Array.from(valueCounts.entries()).sort((a, b) => b[1] - a[1]);
        const mostCommonValue = sortedValues[0][0];

        const featureObj = this.features.find(f => f.feature?.name === featureName);
        if (featureObj?.feature?.type === this.featureTypes.TAGSET) {
          featureObj.tagsetItems?.pipe(take(1)).subscribe(items => {
            const matchingItem = items.find(item => item.name === mostCommonValue);
            const valueToSet = matchingItem?.name || mostCommonValue;
            oldValueControl.setValue(valueToSet);
            // Salva il valore precaricato per poterlo ripristinare se lo switch viene disattivato e riattivato
            this.savedOldValues.set(featureName, valueToSet);
          });
        } else {
          oldValueControl.setValue(mostCommonValue);
          // Salva il valore precaricato per poterlo ripristinare se lo switch viene disattivato e riattivato
          this.savedOldValues.set(featureName, mostCommonValue);
        }

        checkedControl.setValue(true, { emitEvent: false });
      });
    });
  }
}
