import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Observable, Subject, forkJoin, map, take, takeUntil, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
  private savedOldValues: Map<string, string> = new Map(); // Salva come stringa (JSON per oggetti)

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
      const definitionValue = sense.definition.find(s => s.propertyID === 'definition')?.propertyValue || '';
      const lemma = sense.lexicalEntryLabel ? sense.lexicalEntryLabel.split('@')[0] : '';
      // Formatta la definizione includendo il lemma in grassetto
      const definition = lemma ? `${lemma} - ${definitionValue}` : definitionValue;
      return <SenseListItem>{
        creator: sense.creator,
        lastUpdate: sense.lastUpdate,
        creationDate: sense.creationDate,
        confidence: sense.confidence,
        sense: sense.sense,
        hasChildren: false,
        lemma: lemma,
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
      if (value === null || value === undefined || value === '') {
        return false;
      }
      // Per i tagset, verifica che sia un oggetto con name o una stringa
      if (typeof value === 'object' && 'name' in value) {
        return value.name && value.name.trim() !== '';
      }
      // Per le stringhe, verifica che non sia solo spazi
      if (typeof value === 'string') {
        return value.trim() !== '';
      }
      return true;
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
   * Metodo che imposta un valore indiretto per il campo oldValue (valore attuale) in edit mode
   * @param value {any} valore da impostare
   * @param featureFieldName {string} nome del campo della feature
   */
  setIndirectOldValue(value: any, featureFieldName: string) {
    this.featureForm.get(`${featureFieldName}_oldValue`)?.setValue(value);
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

    const featureList = this.createFeatureValueList();

    let request: MultipleAnnotationRequest = {
      layerId: this.layerId,
      features: featureList,
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
      // In edit mode, controlla se c'è un nuovo valore indipendentemente dallo switch
      // In create/delete mode, controlla solo se la feature è checked
      if (!this.editMode && !feature.checked) { return; }

      if (!feature.feature?.name) {
        throw Error('Feature missing name');
      }
      const featValue: string | TTagsetItem | null | undefined = this.featureForm.get(feature.feature.name)?.value;
      
      // Gestisci il valore in base al tipo
      let newValue: string = '';
      if (featValue !== null && featValue !== undefined) {
        if (typeof featValue === 'string') {
          newValue = featValue;
        } else if (typeof featValue === 'object' && 'name' in featValue) {
          newValue = featValue.name || '';
        }
      }

      // In edit mode: includi solo se c'è un nuovo valore (indipendentemente dallo switch)
      // In create/delete mode: includi solo se checked e c'è un valore
      const hasValidValue = newValue && newValue.trim() !== '';
      if (this.editMode) {
        // In edit mode, includi solo se c'è un nuovo valore da impostare
        if (hasValidValue) {
          // Recupera il valore attuale (oldValue) se lo switch è attivo
          const checkedControl = this.featureForm.get(`${feature.feature.name}_checked`);
          const oldValueControl = this.featureForm.get(`${feature.feature.name}_oldValue`);
          let oldValue: string | undefined = undefined;
          
          if (checkedControl?.value && oldValueControl?.value) {
            const oldValueRaw = oldValueControl.value;
            // Gestisci il valore in base al tipo: se è un oggetto, estrai l'ID
            if (typeof oldValueRaw === 'string') {
              oldValue = oldValueRaw;
            } else if (typeof oldValueRaw === 'object') {
              // Per LEXICAL_ENTRY, FORM, SENSE, estrai l'ID dall'oggetto
              if ('lexicalEntry' in oldValueRaw && oldValueRaw.lexicalEntry) {
                oldValue = oldValueRaw.lexicalEntry;
              } else if ('form' in oldValueRaw && oldValueRaw.form) {
                oldValue = oldValueRaw.form;
              } else if ('sense' in oldValueRaw && oldValueRaw.sense) {
                oldValue = oldValueRaw.sense;
              } else if ('name' in oldValueRaw && oldValueRaw.name) {
                oldValue = oldValueRaw.name;
              }
            }
          }
          
          result.push(<MultipleAnnotationFeature>{
            featureId: feature.feature.id,
            value: newValue.trim(),
            oldValue: oldValue
          });
        }
      } else {
        // In create/delete mode, includi solo se checked e c'è un valore
        if (feature.checked && hasValidValue) {
          result.push(<MultipleAnnotationFeature>{
            featureId: feature.feature.id,
            value: newValue.trim()
          });
        }
      }
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
        // Il tipo del FormControl per oldValue dipende dal tipo di feature
        let oldValueControl: FormControl;
        if (featureType === this.featureTypes.LEXICAL_ENTRY || 
            featureType === this.featureTypes.FORM || 
            featureType === this.featureTypes.SENSE) {
          // Per autocomplete, il valore può essere un oggetto o una stringa
          oldValueControl = new FormControl<any>(null);
        } else {
          // Per STRING, URI, TAGSET, usa stringa
          oldValueControl = new FormControl<string>('');
        }
        this.featureForm.addControl(`${controlName}_oldValue`, oldValueControl);
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
              if (currentValue !== null && currentValue !== undefined && currentValue !== '') {
                // Per oggetti, salva come JSON string; per stringhe, salva direttamente
                if (typeof currentValue === 'object') {
                  this.savedOldValues.set(controlName, JSON.stringify(currentValue));
                } else {
                  this.savedOldValues.set(controlName, currentValue);
                }
              }
              oldValueControl.setValue(null, { emitEvent: false });
            } else {
              // Quando lo switch viene riattivato, ripristina il valore salvato se esiste
              const savedValue = this.savedOldValues.get(controlName);
              if (savedValue) {
                // Prova a parsare come JSON se è un oggetto, altrimenti usa direttamente
                try {
                  const parsed = JSON.parse(savedValue);
                  oldValueControl.setValue(parsed, { emitEvent: false });
                } catch {
                  oldValueControl.setValue(savedValue, { emitEvent: false });
                }
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

        const sortedValuesList = Array.from(valueCounts.keys()).sort();
        this.existingFeatureValues.set(featureName, sortedValuesList);

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
        const featureType = featureObj?.feature?.type;

        // Helper function per verificare se una stringa è un URI valido
        const isValidUri = (value: string): boolean => {
          if (!value || typeof value !== 'string') return false;
          if (value.startsWith('http://') || value.startsWith('https://')) {
            return true;
          }
          if (value.includes('://')) {
            return true;
          }
          // Verifica se è un URI con schema (es: urn:, sense:, lexicalEntry:, form:)
          if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) {
            // Escludi valori testuali che contengono @ (come "casa@it: ...")
            // che sono probabilmente rappresentazioni testuali, non URI
            if (value.includes('@') && !value.startsWith('http')) {
              return false;
            }
            return true;
          }
          return false;
        };

        if (featureType === this.featureTypes.TAGSET && featureObj) {
          featureObj.tagsetItems?.pipe(take(1)).subscribe(items => {
            const matchingItem = items.find(item => item.name === mostCommonValue);
            const valueToSet = matchingItem?.name || mostCommonValue;
            oldValueControl.setValue(valueToSet);
            this.savedOldValues.set(featureName, valueToSet);
            checkedControl.setValue(true, { emitEvent: false });
          });
        } else if (featureType === this.featureTypes.LEXICAL_ENTRY) {
          if (isValidUri(mostCommonValue)) {
            // Imposta direttamente l'ID (l'autocomplete caricherà l'oggetto usando initialValueFn)
            oldValueControl.setValue(mostCommonValue);
            this.savedOldValues.set(featureName, mostCommonValue);
            checkedControl.setValue(true, { emitEvent: false });
          } else {
            // Cerca il lexical entry per testo
            this.findLexicalEntryByText(mostCommonValue, oldValueControl as FormControl, checkedControl as FormControl, featureName);
          }
        } else if (featureType === this.featureTypes.FORM) {
          if (isValidUri(mostCommonValue)) {
            // Imposta direttamente l'ID (l'autocomplete caricherà l'oggetto usando initialValueFn)
            oldValueControl.setValue(mostCommonValue);
            this.savedOldValues.set(featureName, mostCommonValue);
            checkedControl.setValue(true, { emitEvent: false });
          } else {
            // Cerca la form per testo
            this.findFormByText(mostCommonValue, oldValueControl as FormControl, checkedControl as FormControl, featureName);
          }
        } else if (featureType === this.featureTypes.SENSE) {
          if (isValidUri(mostCommonValue)) {
            // Imposta direttamente l'ID (l'autocomplete caricherà l'oggetto usando initialValueFn)
            oldValueControl.setValue(mostCommonValue);
            this.savedOldValues.set(featureName, mostCommonValue);
            checkedControl.setValue(true, { emitEvent: false });
          } else {
            // Cerca il senso per testo e poi carica l'oggetto completo usando l'ID
            this.findSenseByText(mostCommonValue, oldValueControl as FormControl, checkedControl as FormControl, featureName);
          }
        } else {
          // Per STRING e URI, usa il valore direttamente
          oldValueControl.setValue(mostCommonValue);
          this.savedOldValues.set(featureName, mostCommonValue);
          checkedControl.setValue(true, { emitEvent: false });
        }
      });
    });
  }

  /**
   * @private
   * Cerca un senso per testo e carica l'oggetto completo usando l'ID trovato
   */
  private findSenseByText(textValue: string, oldValueControl: FormControl | null, checkedControl: FormControl | null, featureName: string): void {
    if (!oldValueControl || !checkedControl) return;
    // Estrai il lemma (prima parte prima di "@") o usa tutto il testo
    const searchText = textValue.includes('@') ? textValue.split('@')[0].trim() : textValue.trim();
    
    if (!searchText) {
      oldValueControl.setValue(null);
      checkedControl.setValue(false, { emitEvent: false });
      return;
    }

    // Cerca i sensi per testo
    this.lexiconService.getFilteredSenses({
      text: searchText,
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
      take(1),
      catchError(error => {
        console.error('Error finding sense by text:', error);
        return of({ list: [] });
      })
    ).subscribe((response: any) => {
      const senses = response.list || [];
      
      // Cerca il senso che corrisponde meglio al valore originale
      // Prima prova a trovare una corrispondenza esatta nella definizione
      let matchingSense = senses.find((s: SenseListItem) => {
        const senseDefinition = s.definition || s.label || '';
        return senseDefinition === textValue || senseDefinition.includes(textValue) || textValue.includes(senseDefinition);
      });
      
      // Se non trova una corrispondenza esatta, usa il primo risultato
      if (!matchingSense && senses.length > 0) {
        matchingSense = senses[0];
      }
      
      if (matchingSense && matchingSense.sense) {
        // Imposta l'ID invece dell'oggetto completo (l'autocomplete caricherà l'oggetto usando initialValueFn)
        oldValueControl.setValue(matchingSense.sense);
        this.savedOldValues.set(featureName, matchingSense.sense);
        checkedControl.setValue(true, { emitEvent: false });
      } else {
        oldValueControl.setValue(null);
        checkedControl.setValue(false, { emitEvent: false });
      }
    });
  }

  /**
   * @private
   * Cerca un lexical entry per testo
   */
  private findLexicalEntryByText(textValue: string, oldValueControl: FormControl | null, checkedControl: FormControl | null, featureName: string): void {
    if (!oldValueControl || !checkedControl) return;
    const searchText = textValue.includes('@') ? textValue.split('@')[0].trim() : textValue.trim();
    
    if (!searchText) {
      oldValueControl.setValue(null);
      checkedControl.setValue(false, { emitEvent: false });
      return;
    }

    this.lexiconService.getLexicalEntriesList({
      text: searchText,
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
      take(1),
      catchError(error => {
        console.error('Error finding lexical entry by text:', error);
        return of({ list: [] });
      })
    ).subscribe((response: any) => {
      const entries = response.list || [];
      const matchingEntry = entries.find((e: any) => {
        const entryLabel = e.label || '';
        return entryLabel === textValue || entryLabel.includes(textValue) || textValue.includes(entryLabel);
      }) || entries[0];
      
      if (matchingEntry && matchingEntry.lexicalEntry) {
        // Imposta l'ID invece dell'oggetto completo (l'autocomplete caricherà l'oggetto usando initialValueFn)
        oldValueControl.setValue(matchingEntry.lexicalEntry);
        this.savedOldValues.set(featureName, matchingEntry.lexicalEntry);
        checkedControl.setValue(true, { emitEvent: false });
      } else {
        oldValueControl.setValue(null);
        checkedControl.setValue(false, { emitEvent: false });
      }
    });
  }

  /**
   * @private
   * Cerca una form per testo
   */
  private findFormByText(textValue: string, oldValueControl: FormControl | null, checkedControl: FormControl | null, featureName: string): void {
    if (!oldValueControl || !checkedControl) return;
    const searchText = textValue.includes('@') ? textValue.split('@')[0].trim() : textValue.trim();
    
    if (!searchText) {
      oldValueControl.setValue(null);
      checkedControl.setValue(false, { emitEvent: false });
      return;
    }

    this.lexiconService.getFormList({
      text: searchText,
      searchMode: searchModeEnum.startsWith,
      representationType: "writtenRep",
      author: '',
      offset: 0,
      limit: 500
    }).pipe(
      take(1),
      catchError(error => {
        console.error('Error finding form by text:', error);
        return of({ list: [] });
      })
    ).subscribe((response: any) => {
      const forms = response.list || [];
      const matchingForm = forms.find((f: any) => {
        const formLabel = f.label || '';
        return formLabel === textValue || formLabel.includes(textValue) || textValue.includes(formLabel);
      }) || forms[0];
      
      if (matchingForm && matchingForm.form) {
        // Imposta l'ID invece dell'oggetto completo (l'autocomplete caricherà l'oggetto usando initialValueFn)
        oldValueControl.setValue(matchingForm.form);
        this.savedOldValues.set(featureName, matchingForm.form);
        checkedControl.setValue(true, { emitEvent: false });
      } else {
        oldValueControl.setValue(null);
        checkedControl.setValue(false, { emitEvent: false });
      }
    });
  }
}
