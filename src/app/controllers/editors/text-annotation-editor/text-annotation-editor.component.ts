import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Observable, Subject, catchError, forkJoin, map, take, takeUntil, throwError } from 'rxjs';
import { formTypeEnum, searchModeEnum } from 'src/app/models/lexicon/lexical-entry-request.model';
import { FormListItem, SenseListItem } from 'src/app/models/lexicon/lexical-entry.model';
import { TAnnotation } from 'src/app/models/texto/t-annotation';
import { TFeature, TFeatureType } from 'src/app/models/texto/t-feature';
import { TLayer } from 'src/app/models/texto/t-layer';
import { TTagsetItem } from 'src/app/models/texto/t-tagset-item';
import { User } from 'src/app/models/user';
import { AnnotationService } from 'src/app/services/annotation.service';
import { LayerService } from 'src/app/services/layer.service';
import { LexiconService } from 'src/app/services/lexicon.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { TagsetService } from 'src/app/services/tagset.service';
import { UserService } from 'src/app/services/user.service';
import { uriValidator } from 'src/app/validators/uri-validator.directive';
import { whitespacesValidator } from 'src/app/validators/whitespaces-validator.directive';
import Swal from 'sweetalert2';
import { PopupDeleteItemComponent } from '../../popup/popup-delete-item/popup-delete-item.component';

export interface FeatForAnn {
  feature: TFeature | undefined;
  tagsetItems: Observable<TTagsetItem[]> | undefined;
  value: string | undefined;
}

@Component({
  selector: 'app-text-annotation-editor',
  templateUrl: './text-annotation-editor.component.html',
  styleUrls: ['./text-annotation-editor.component.scss']
})
export class TextAnnotationEditorComponent implements OnDestroy {
  private readonly unsubscribe$ = new Subject();
  workingLayer!: TLayer;
  /**Tipi di feature */
  featureTypes = TFeatureType;
  @Input() annotationFragment!: string;
  annotationForm = new FormGroup({
    layer: new FormControl<string>({ value: '', disabled: true }),
    text: new FormControl<string>({ value: '', disabled: true }),
    feature: new FormGroup({})
  });
  get featureForm(): FormGroup { return this.annotationForm.get('feature') as FormGroup }
  currentUser!: User;
  @Input()
  get annotationModel(): TAnnotation { return this._annotation; }
  set annotationModel(annotation: TAnnotation) {
    this._annotation = annotation;
    const layerId = annotation.layer?.id;
    if (!layerId) {
      throw Error('layer id undefined');
    }
    this.fetchAndMapFeatures(layerId);
  }
  features: FeatForAnn[] = [];

  public get isEditing(): boolean {
    if (this.annotationModel && this.annotationModel.id) {
      return true;
    }
    return false;
  }

  public get noneAnnotationIsSelected(): boolean { return (!this.annotationModel 
    || !this.annotationModel?.layer 
    || !this.annotationModel?.layer.id 
    || (!this.annotationModel.start && this.annotationModel.start !== 0) 
    || !this.annotationModel.end) }

  public get shouldBeDisabled(): boolean { //FIXME sostituire con una pipe
    if (!this.isEditing) {
      return true; //sempre vero se è un nuovo inserimento
    }
    //valuta la presenza di relazioni in entrata o in uscita
    // return this.annotationModel.attributes["relations"] &&
    //   (this.annotationModel.attributes["relations"].in.length != 0 ||
    //     this.annotationModel.attributes["relations"].out.length != 0);
    return false; //FIXME inserire una verifica sulla presenza di relazioni in entrata o in uscita per bloccare l'eliminazione dell'annotazione
  }

  private _annotation: TAnnotation = new TAnnotation();

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

  @Output() onCancel = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<{ feature: TFeature, value: string }[]>();
  @Output() onDelete = new EventEmitter<void>();

  private deleteAnnotation = (id: number): void => {
    this.showOperationInProgress('Deletion in progress');
    const successMsg = 'Annotation successfully removed';
    this.annotationService.deleteAnnotationById(id).pipe( //FIXME referenced records cannot be deleted, including annotations with enhanced features. Under discussion is the deletion policy
      take(1),
      catchError((error: HttpErrorResponse) => {
        this.messageService.add(this.msgConfService.generateErrorMessageConfig(`Deleting annotation failed: ${error.error.message}`));
        Swal.close();
        return throwError(() => new Error(error.error.message));
      }),
    ).subscribe(() => {
      this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
      Swal.close();
      this.onDelete.emit();
    })
  }
  /**Riferimento al popup di conferma cancellazione */
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;


  constructor(
    private layerService: LayerService,
    private tagsetService: TagsetService,
    private userService: UserService,
    private annotationService: AnnotationService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
    private lexiconService: LexiconService,
  ) {
    this.userService.retrieveCurrentUser().pipe(
      take(1),
    ).subscribe(cu => {
      this.currentUser = cu;
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  onCancelBtn() {
    this.onCancel.emit();
  }

  onClearBtn() {
    this.featureForm.reset(); //Svuoto solamente la parte relativa alle feature, perché layer e testo selezionato sono indipendenti
  }

  setIndirectValue(value: any, featureFieldName: string) {
    this.featureForm.get(featureFieldName)?.setValue(value);
  }

  onSubmitAnnotation() {
    this.onSave.emit(this.createFeatureValueList());
  }

  showDeleteModal() {
    if (!this.annotationModel.id || this.annotationModel.id === undefined) {
      return;
    }
    const confirmMessage = 'You are about to delete an annotation';
    this.popupDeleteItem.confirmMessage = confirmMessage;
    this.popupDeleteItem.showDeleteConfirm(() => this.deleteAnnotation(this.annotationModel.id!), this.annotationModel.id);
  }

  private createFeatureValueList(): { feature: TFeature, value: string }[] {
    const result: { feature: TFeature, value: string }[] = [];
    this.features.forEach(feature => {
      if (!feature.feature?.name) {
        throw Error('Feature missing name');
      }
      const featValue: string | TTagsetItem = this.featureForm.get(feature.feature.name)?.value;
      result.push(<{ feature: TFeature, value: string }>{
        feature: feature.feature,
        value: typeof (featValue) === 'string' ? featValue : featValue.name
      });
    });
    return result;
  }

  private createForm() {
    this.annotationForm.controls.layer.setValue(this.workingLayer.name ?? '');
    this.annotationForm.controls.text.setValue(this.annotationFragment);
    this.features.forEach(f => {
      const controlName = f.feature?.name;
      const existingValue: string = this.annotationModel.features?.find(af => af.feature?.id === f.feature?.id)?.value ?? '';
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
      this.featureForm.get(controlName)?.setValue(existingValue)
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
    });
  }

  /**
 * @private
 * Metodo che visualizza il popup di operazione in corso
 * @param message {string} messaggio da visualizzare
 */
  private showOperationInProgress(message: string): void {
    Swal.fire({
      icon: 'warning',
      titleText: message,
      text: 'please wait',
      customClass: {
        container: 'swal2-container'
      },
      showCancelButton: false,
      showConfirmButton: false
    });
  }

}
