import { LoaderService } from 'src/app/services/loader.service';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Annotation } from 'src/app/model/annotation/annotation';
import { LayerWithFeatures } from 'src/app/model/layer/layer-with-features';
import { AnnotationService } from 'src/app/services/annotation.service';
import { LayerService } from 'src/app/services/layer.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { WorkspaceService } from 'src/app/services/workspace.service';
import Swal from 'sweetalert2';
import { PopupDeleteItemComponent } from '../../popup/popup-delete-item/popup-delete-item.component';

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
          },
          error: () => {
            this.showOperationFailed('Cancellazione Fallita: ' + errorMsg)
          }
        })
  }

  @Input() annotationModel: Annotation | undefined;
  @Input() fileId: number | undefined;
  @Input() selection: any;

  @Output() onCancel = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();
  @Output() onSave = new EventEmitter<any>();

  public get isEditing(): boolean {
    if (this.annotationModel && this.annotationModel.id) {
      return true;
    }

    return false;
  }

  public get noneAnnotationIsSelected(): boolean {
    return (!this.annotationModel || !this.annotationModel?.layer || this.annotationModel?.layer == -1 || !this.annotationModel.spans);
  }

  @ViewChild(NgForm) public annotationForm!: NgForm;
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

  constructor(
    private annotationService: AnnotationService,
    private workspaceService: WorkspaceService,
    private loaderService: LoaderService,
    private layerService: LayerService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService
  ) { }

  ngOnInit(): void {
    // if (!this.layerId) {
    //   return;
    // }

    // console.log(this.layerId)

    // this.layerService.retrieveLayerById(this.layerId)
    //   .subscribe((data: LayerWithFeatures) => {

    //   });
  }

  ngOnDestroy(): void {
    Swal.close();
  }

  onCancelBtn() {
    this.onCancel.emit();
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
    if (!this.fileId || !this.annotationModel) {
      this.messageService.add(this.msgConfService.generateErrorMessageConfig("Errore durante il salvataggio!"));
      return;
    }

    let msgSuccess = "Operazione effettuata con successo";
    let apiCall;

    if (this.isEditing) {
      msgSuccess = "Annotazione modificata con successo";
      apiCall = this.annotationService.update(this.annotationModel);
    }
    else {
      msgSuccess = "Annotazione creata con successo";
      apiCall = this.annotationService.create(this.fileId, this.annotationModel);
    }

    this.loaderService.show();
    apiCall.subscribe({
      next: () => {
        this.messageService.add(this.msgConfService.generateSuccessMessageConfig(msgSuccess));
        this.onSave.emit();
        this.loaderService.hide();
      },
      error: (err: string) => {
        this.messageService.add(this.msgConfService.generateErrorMessageConfig(err));
        this.loaderService.hide();
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
