import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Observable, Subject, forkJoin, map, take, takeUntil } from 'rxjs';
import { formTypeEnum, searchModeEnum } from 'src/app/models/lexicon/lexical-entry-request.model';
import { FormListItem, SenseListItem } from 'src/app/models/lexicon/lexical-entry.model';
import { TAnnotationFeature } from 'src/app/models/texto/t-annotation-feature';
import { TFeature, TFeatureType } from 'src/app/models/texto/t-feature';
import { TLayer } from 'src/app/models/texto/t-layer';
import { TTagsetItem } from 'src/app/models/texto/t-tagset-item';
import { User } from 'src/app/models/user';
import { AnnotationService, CreateMultipleAnnotationRequest, CreateMultipleAnnotationResponse } from 'src/app/services/annotation.service';
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
}

export interface TextOffset {
  index: number;
  resourceId: number;
  start: number;
  end: number;
}

@Component({
  selector: 'app-multiple-text-annotation-editor',
  templateUrl: './multiple-text-annotation-editor.component.html',
  styleUrls: ['./multiple-text-annotation-editor.component.scss']
})
export class MultipleTextAnnotationEditorComponent implements OnDestroy {
  private readonly unsubscribe$ = new Subject();
  private _layerId?: number;
  private _textOffsets: TextOffset[] = [];

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
  set textOffsets(value: TextOffset[]) {
    this._textOffsets = value;
  }
  get textOffsets(): TextOffset[] {
    return this._textOffsets;
  }

  @Output() onCancel = new EventEmitter<void>();
  @Output() onSaveStart = new EventEmitter<void>();
  @Output() onSaveEnd = new EventEmitter<CreateMultipleAnnotationResponse>();
  @Output() onDelete = new EventEmitter<void>();

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

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  onCancelBtn() {
    this.onCancel.emit();
  }

  onClearBtn() {
    this.featureForm.reset(); //Svuoto solamente la parte relativa alle feature, perché layer e testo selezionato sono indipendenti
    this.commonService.notifyOther({ option: 'clear_feature_fields' });
  }

  setIndirectValue(value: any, featureFieldName: string) {
    this.featureForm.get(featureFieldName)?.setValue(value);
  }

  onSubmitAnnotation() {
    this.onSaveStart.emit();
    let request: CreateMultipleAnnotationRequest = {
      layerId: this.layerId,
      features: this.createFeatureValueList(),
      offsets: this.textOffsets
    };

    this.annotationservice.createMultipleAnnotation(request).pipe(
      take(1),
    ).subscribe({
      next: (response) => {
        if (response.errors.length > 0) {
          this.onSaveEnd.emit({ status: 'ERROR', errors: response.errors });
        } else {
          this.onSaveEnd.emit({ status: 'OK', errors: [] });
        }
      }
      , error: (err) => {
        this.onSaveEnd.emit({ status: 'ERROR', errors: [] });
      }
    });
  }

  private createFeatureValueList(): TAnnotationFeature[] {
    const result: TAnnotationFeature[] = [];
    this.features.forEach(feature => {
      if (!feature.feature?.name) {
        throw Error('Feature missing name');
      }
      const featValue: string | TTagsetItem = this.featureForm.get(feature.feature.name)?.value;
      result.push(<TAnnotationFeature>{
        feature: feature.feature.id,
        value: featValue !== null ? (typeof (featValue) === 'string' ? featValue : featValue.name) : '' //FIX empty string to manage reset of a feature
      });
    });
    return result;
  }

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
      this.featureForm.get(controlName)?.setValue(false)
    });
  }

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
          tagsetItems: tagsetId ? this.tagsetService.getTagsetItemsById(tagsetId) : undefined
        };
      });
      this.createForm();
      this.onClearBtn();
    });
  }
}
