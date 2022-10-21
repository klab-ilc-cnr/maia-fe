import { AnnotationFeature } from 'src/app/models/annotation/annotation-feature';
import { FeatureForAnnotation } from 'src/app/models/feature/feature-for-annotation';
import { Feature } from 'src/app/models/feature/feature';
import { LoaderService } from 'src/app/services/loader.service';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Annotation } from 'src/app/models/annotation/annotation';
import { AnnotationService } from 'src/app/services/annotation.service';
import { LayerService } from 'src/app/services/layer.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { WorkspaceService } from 'src/app/services/workspace.service';
import Swal from 'sweetalert2';
import { PopupDeleteItemComponent } from '../../popup/popup-delete-item/popup-delete-item.component';
import { FeatureService } from 'src/app/services/feature.service';
import { LoggedUserService } from 'src/app/services/logged-user.service';
import { Roles } from 'src/app/models/roles';
import { FeatureType } from 'src/app/models/feature/feature-type';

@Component({
  selector: 'app-annotation-editor',
  templateUrl: './annotation-editor.component.html',
  styleUrls: ['./annotation-editor.component.scss']
})
export class AnnotationEditorComponent implements OnInit {

  private deleteElement = (id: number): void => {
    this.showOperationInProgress('Sto cancellando');

    let errorMsg = 'Errore nell\'eliminare l\'annotazione'
    let successMsg = 'Annotazione eliminata con successo'

    this.annotationService
      .delete(id)
      .subscribe({
        next: (result) => {
          this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
          Swal.close();
          this.onDelete.emit()
          this.annotationService.deleteAnnotationFeature(id).subscribe({
            next: (result: boolean) => {
              if (result) {
                console.log("AnnotationFeature salvata correttamento sul db");
              }
              else {
                console.log("Errore durante il salvataggio di AnnotationFeature");
              }
            },
            error: () => {
              console.log("Errore durante il salvataggio di AnnotationFeature");
            }
          })
        },
        error: () => {
          this.showOperationFailed('Cancellazione Fallita: ' + errorMsg)
        }
      })
  }

  @Input()
  get annotationModel(): Annotation { return this._annotation; }
  set annotationModel(annotation: Annotation) {
    this._annotation = annotation;

    let layerId = Number.parseInt(annotation.layer);

    this.features = [];

    if (!layerId || isNaN(layerId)) {
      return;
    }

    this.featureService.retrieveFeaturesByLayerId(layerId).subscribe({
      next: (data) => {
        data.forEach(feature => {
          let newFeature: FeatureForAnnotation = JSON.parse(JSON.stringify(feature));

          if (feature.tagset && feature.tagset.values) {
            newFeature.dropdownOptions = feature.tagset.values.map(item => ({ label: item.name, value: item.id }));
          }

          if (feature.type == FeatureType.URI) {
            // TO COMPLETE
            newFeature.dropdownOptions = [];
          }

          newFeature.placeholder = feature.name;
          newFeature.modelPropName = `${feature.name}`;

          if (annotation.attributes['features']) {
            //GESTIONE BUG SULLE API CASH
            //non viene restituito un array di feature nel caso ci sia una sola feature
            //ma solo un elemento feature
            if(!Array.isArray(annotation.attributes['features']))
            {
              annotation.attributes['features'] = new Array(annotation.attributes['features']);
            }
            
            let elem = annotation.attributes['features'].find((f: any) => f.id == feature.id);

            if (elem && (feature.type == FeatureType.TAGSET || feature.type == FeatureType.URI)) {
              let option = newFeature.dropdownOptions.find(o => o.value == elem.value);

              if (option) {
                newFeature.value = option.value;
              }
            }

            if (elem && feature.type == FeatureType.STRING) {
              newFeature.value = elem.value;
            }
          }

          this.features.push(newFeature);
        })
      }
    })
  }
  private _annotation: Annotation = new Annotation();

  @Input() fileId: number | undefined;

  @Output() onCancel = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();
  @Output() onSave = new EventEmitter<any>();

  public get emptyFeatures(): boolean {
    return this.features.length == 0;
  }

  public get isEditing(): boolean {
    if (this.annotationModel && this.annotationModel.id) {
      return true;
    }

    return false;
  }

  public get noneAnnotationIsSelected(): boolean {
    return (!this.annotationModel || !this.annotationModel?.layer || this.annotationModel?.layer == -1 || !this.annotationModel.spans);
  }

  public get shouldBeDisabled(): boolean {
    if (!this.isEditing) {
      return true;
    }

    return this.annotationModel.attributes["relations"] &&
      (this.annotationModel.attributes["relations"].in.length != 0 ||
        this.annotationModel.attributes["relations"].out.length != 0);
  }

  public get shouldBeEditable(): boolean {
    if (!this.isEditing) {
      return true;
    }

    if ((this.currentUserId && this.annotationModel.attributes["metadata"] && this.annotationModel.attributes["metadata"].createdBy && this.annotationModel.attributes["metadata"].createdBy == this.currentUserId) ||
      this.loggedUserService.currentUser?.role == Roles.AMMINISTRATORE) {
      return true;
    }

    return false;
  };

  currentUserId: string | undefined;
  features: FeatureForAnnotation[] = [];
  featureTypes = FeatureType;

  @ViewChild(NgForm) public annotationForm!: NgForm;
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

  constructor(
    private annotationService: AnnotationService,
    private workspaceService: WorkspaceService,
    private loggedUserService: LoggedUserService,
    private loaderService: LoaderService,
    private layerService: LayerService,
    private featureService: FeatureService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService
  ) { }

  ngOnInit(): void {
    this.currentUserId = this.loggedUserService.currentUser?.id;
  }

  ngOnDestroy(): void {
    Swal.close();
  }

  onCancelBtn() {
    this.onCancel.emit();
  }

  onClearBtn() {
    this.annotationForm.form.reset();
    this.saveWithFormErrors();
  }

  onSubmit(form: NgForm): void {
    if (this.annotationForm.invalid) {
      return this.saveWithFormErrors();
    }

    this.save();
  }

  showDeleteModal(): void {
    if (!this.annotationModel) {
      return;
    }

    let confirmMsg = 'Stai per cancellare un\'annotazione';

    this.popupDeleteItem.confirmMessage = confirmMsg;

    this.popupDeleteItem.showDeleteConfirm(() => this.deleteElement((this.annotationModel?.id || 0)), this.annotationModel.id);
  }

  private save(): void {
    if (!this.fileId || !this.annotationModel || !this.features) {
      this.messageService.add(this.msgConfService.generateErrorMessageConfig("Errore durante il salvataggio!"));
      return;
    }

    if (!this.annotationModel.attributes['features']) {
      this.annotationModel.attributes['features'] = [];
    }

    this.features.forEach(f => {
      if (f.type == FeatureType.TAGSET && f.tagset) {
        f.valueLabel = f.tagset.values?.find(v => v.id == f.value)?.name;
      }
      else {
        f.valueLabel = undefined;
      }
    })

    let simplifiedFeatures = this.features.map(({ id, value, valueLabel }) => ({ id, value, valueLabel }))
    this.annotationModel.attributes['features'] = simplifiedFeatures;

    let successMsg = "Operazione effettuata con successo";
    let apiCall;

    if (this.isEditing) {
      successMsg = "Annotazione modificata con successo";

      if (this.annotationModel.attributes["metadata"] && this.currentUserId) {
        this.annotationModel.attributes["metadata"].editedBy = this.currentUserId;
        this.annotationModel.attributes["metadata"].lastModificationDate = new Date().toUTCString();
      }

      apiCall = this.annotationService.update(this.annotationModel);
    }
    else {
      successMsg = "Annotazione creata con successo";

      if (this.annotationModel.attributes["metadata"] && this.currentUserId) {
        let now = new Date().toUTCString();
        this.annotationModel.attributes["metadata"].createdBy = this.currentUserId;
        this.annotationModel.attributes["metadata"].creationDate = now;
        this.annotationModel.attributes["metadata"].editedBy = this.currentUserId;
        this.annotationModel.attributes["metadata"].lastModificationDate = now;
      }

      apiCall = this.annotationService.create(this.fileId, this.annotationModel);
    }

    this.loaderService.show();
    apiCall.subscribe({
      next: (res) => {
        this.loaderService.hide();

        let annFeatures = new AnnotationFeature();
        annFeatures.annotationId = res.annotation.id;
        annFeatures.featureIds = this.features.map(f => f.id!);
        annFeatures.layerId = Number.parseInt(this.annotationModel.layer);
        this.loaderService.show();

        if (this.isEditing) {
          this.loaderService.hide();
          this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
          this.onSave.emit();
          //per il momento non c'è ragione di aggiornare il nostro backend
          /*           this.annotationService.updateAnnotationFeature(annFeatures).subscribe({
                      next: () => {
                        this.loaderService.hide();
                        this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
                        this.onSave.emit();
                      },
                      error: (err: string) => {
                        this.loaderService.hide();
                        this.messageService.add(this.msgConfService.generateErrorMessageConfig(err));
                      }
                    }) */
        }
        else {
          this.annotationService.createAnnotationFeature(annFeatures).subscribe({
            next: () => {
              this.loaderService.hide();
              this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
              this.onSave.emit();
            },
            error: (err: string) => {
              this.loaderService.hide();
              this.messageService.add(this.msgConfService.generateErrorMessageConfig(err));
            }
          })
        }
      },
      error: (err: string) => {
        this.loaderService.hide();
        this.messageService.add(this.msgConfService.generateErrorMessageConfig(err));
      }
    });
  }

  private saveWithFormErrors(): void {
    this.annotationForm.form.markAllAsTouched();
  }

  private showOperationFailed(errorMessage: string): void {
    Swal.fire({
      icon: 'error',
      title: errorMessage,
      showConfirmButton: true
    });
  }

  private showOperationInProgress(message: string): void {
    Swal.fire({
      icon: 'warning',
      titleText: message,
      text: 'per favore attendere',
      customClass: {
        container: 'swal2-container'
      },
      showCancelButton: false,
      showConfirmButton: false
    });
  }
}
