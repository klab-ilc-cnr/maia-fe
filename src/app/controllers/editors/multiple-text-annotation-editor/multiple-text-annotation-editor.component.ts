import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Observable, Subject, forkJoin, map, take, takeUntil } from 'rxjs';
import { formTypeEnum, searchModeEnum } from 'src/app/models/lexicon/lexical-entry-request.model';
import { FormListItem, SenseListItem } from 'src/app/models/lexicon/lexical-entry.model';
import { TFeature, TFeatureType } from 'src/app/models/texto/t-feature';
import { TLayer } from 'src/app/models/texto/t-layer';
import { TTagsetItem } from 'src/app/models/texto/t-tagset-item';
import { User } from 'src/app/models/user';
import { AnnotationService, MultipleAnnotationRequest, MultipleAnnotationResponse as MultipleAnnotationResponse } from 'src/app/services/annotation.service';
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
  private _visible: boolean = false;

  workingLayer!: TLayer;
  /**Tipi di feature */
  featureTypes = TFeatureType;
  currentUser!: User;
  features: FeatForAnn[] = [];

  annotationForm = new FormGroup({
    layer: new FormControl<string>({ value: '', disabled: true }),
    text: new FormControl<string>({ value: '', disabled: true }),
    feature: new FormGroup({})
  });

  @Input()
  annotationFragment!: string;

  @Input()
  set layerId(value: number | undefined) {
    if (value !== this._layerId) {
      this._layerId = value;
      if (value) {
        this.fetchAndMapFeatures(value);
      }
    }
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
  set visible(value: boolean) {
    this._visible = value;
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
    else {
      this.onSaveStart.emit();
    }

    if (!this.isAnyFeatureValue && !this.deleteMode) {
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
          if (response.errors.length > 0) {
            this.onDeleteEnd.emit({ status: 'ERROR', errors: response.errors });
          } else {
            this.onDeleteEnd.emit({ status: 'OK', errors: [] });
          }
        },
        error: (err) => {
          this.onDeleteEnd.emit({ status: 'ERROR', errors: [] });
        }
      });
      return;
    }

    this.annotationservice.createMultipleAnnotation(request).pipe(
      take(1),
    ).subscribe({
      next: (response) => {
        if (response.errors.length > 0) {
          this.onSaveEnd.emit({ status: 'ERROR', errors: response.errors });
        } else {
          this.onSaveEnd.emit({ status: 'OK', errors: [] });
        }
      },
      error: (err) => {
        this.onSaveEnd.emit({ status: 'ERROR', errors: [] });
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
      if(!feature.checked) {return;}
      
      if (!feature.feature?.name) {
        throw Error('Feature missing name');
      }
      const featValue: string | TTagsetItem = this.featureForm.get(feature.feature.name)?.value;
      result.push(<MultipleAnnotationFeature>{
        featureId: feature.feature.id,
        value: featValue !== null ? (typeof (featValue) === 'string' ? featValue : featValue.name) : '' //FIX empty string to manage reset of a feature
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

      const checkedControl = new FormControl<boolean>(f.checked, { nonNullable: true });
      this.featureForm.addControl(`${controlName}_checked`, checkedControl);

      checkedControl.valueChanges.subscribe(value => {
        f.checked = value;
      });

      checkedControl.setValue(true, { emitEvent: false });
    });
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
      this.onClearBtn();
    });
  }
}
