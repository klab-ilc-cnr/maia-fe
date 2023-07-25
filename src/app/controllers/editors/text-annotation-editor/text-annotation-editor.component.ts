import { Component, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Observable, Subject, catchError, take, takeUntil, throwError } from 'rxjs';
import { TAnnotation } from 'src/app/models/texto/t-annotation';
import { TFeature, TFeatureType } from 'src/app/models/texto/t-feature';
import { TTagsetItem } from 'src/app/models/texto/t-tagset-item';
import { User } from 'src/app/models/user';
import { LayerService } from 'src/app/services/layer.service';
import { TagsetService } from 'src/app/services/tagset.service';
import { UserService } from 'src/app/services/user.service';
import { uriValidator } from 'src/app/validators/uri-validator.directive';
import { whitespacesValidator } from 'src/app/validators/whitespaces-validator.directive';
import Swal from 'sweetalert2';
import { PopupDeleteItemComponent } from '../../popup/popup-delete-item/popup-delete-item.component';
import { AnnotationService } from 'src/app/services/annotation.service';
import { HttpErrorResponse } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';

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

  public get noneAnnotationIsSelected(): boolean { return (!this.annotationModel || !this.annotationModel?.layer || !this.annotationModel?.layer.id || !this.annotationModel.start || !this.annotationModel.end) }

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

  @Output() onCancel = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<{ feature: TFeature, value: string }[]>();
  @Output() onDelete = new EventEmitter<void>();

  private deleteAnnotation = (id: number): void => {
    this.showOperationInProgress('Deletion in progress');
    const successMsg = 'Annotation successfully removed';
    this.annotationService.deleteAnnotationById(id).pipe(
      take(1),
      catchError((error: HttpErrorResponse) => {
        this.messageService.add(this.msgConfService.generateErrorMessageConfig(`Deleting annotation failed: ${error.error}`));
        Swal.close();
        return throwError(() => new Error(error.error));
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

  onSubmitAnnotation() {
    this.onSave.emit(this.createFeatureValueList());
  }

  showDeleteModal() {
    if(!this.annotationModel.id || this.annotationModel.id === undefined) {
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
    this.annotationForm.controls.layer.setValue(this.annotationModel.layer?.name ?? '');
    this.annotationForm.controls.text.setValue(this.annotationFragment);
    this.features.forEach(f => {
      const controlName = f.feature?.name;
      const existingValue: string = this.annotationModel.features?.find(af => af.feature?.name === controlName)?.value ?? '';
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
    this.layerService.retrieveLayerFeatureList(layerId).pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(features => {
      this.features = features.map(feature => {
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
