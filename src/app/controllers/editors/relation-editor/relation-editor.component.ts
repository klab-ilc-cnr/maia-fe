import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Annotation } from 'src/app/models/annotation/annotation';
import { Layer } from 'src/app/models/layer/layer.model';
import { Relation } from 'src/app/models/relation/relation';
import { AnnotationService } from 'src/app/services/annotation.service';
import { LayerService } from 'src/app/services/layer.service';
import { LoaderService } from 'src/app/services/loader.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { WorkspaceService } from 'src/app/services/workspace.service';
import Swal from 'sweetalert2';
import { PopupDeleteItemComponent } from '../../popup/popup-delete-item/popup-delete-item.component';
import { v4 as uuidv4 } from 'uuid';
import { Relations } from 'src/app/models/relation/relations';

@Component({
  selector: 'app-relation-editor',
  templateUrl: './relation-editor.component.html',
  styleUrls: ['./relation-editor.component.scss']
})
export class RelationEditorComponent implements OnInit {
  private deleteElement = (id: string): void => {
    this.showOperationInProgress('Sto cancellando');

    let errorMsg = 'Errore nell\'eliminare la relazione'
    let successMsg = 'Relazione eliminata con successo'

    if (id == "" || id == undefined || id == null || !this.sourceAnn.attributes || !this.targetAnn.attributes) {
      this.showOperationFailed('Cancellazione Fallita: ' + errorMsg)
      return;
    }

    let sIndex = this.sourceAnn.attributes['relations'].out.findIndex((r: Relation) => r.id == this.relationModel?.id);
    let tIndex = this.targetAnn.attributes['relations'].in.findIndex((r: Relation) => r.id == this.relationModel?.id);

    if (sIndex < 0) {
      this.showOperationFailed('Cancellazione Fallita: ' + errorMsg)
      return;
    }

    if (tIndex < 0) {
      this.showOperationFailed('Cancellazione Fallita: ' + errorMsg)
      return;
    }

    this.sourceAnn.attributes['relations'].out.splice(sIndex, 1);
    this.targetAnn.attributes['relations'].in.splice(tIndex, 1);

    this.loaderService.show();
    this.annotationService.update(this.sourceAnn).subscribe({
      next: () => {
        this.annotationService.update(this.targetAnn).subscribe({
          next: () => {
            this.loaderService.hide();
            this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
            Swal.close();
            this.onDelete.emit();
          },
          error: (err: string) => {
            this.loaderService.hide();
            this.messageService.add(this.msgConfService.generateErrorMessageConfig(err));
          }
        });
      },
      error: (err: string) => {
        this.loaderService.hide();
        this.messageService.add(this.msgConfService.generateErrorMessageConfig(err));
      }
    });
  }

  @Input() relationModel: Relation = new Relation();
  @Input() sourceLayer: Layer | undefined;
  @Input() targetLayer: Layer | undefined;
  @Input()
  get sourceAnn(): Annotation { return this._sourceAnn; }
  set sourceAnn(sourceAnn: Annotation) {
    this._sourceAnn = sourceAnn;
  }
  private _sourceAnn: Annotation = new Annotation();

  @Input()
  get targetAnn(): Annotation { return this._targetAnn; }
  set targetAnn(targetAnn: Annotation) {
    this._targetAnn = targetAnn;
  }
  private _targetAnn: Annotation = new Annotation();

  @Output() onCancel = new EventEmitter<any>();
  @Output() onDelete = new EventEmitter<any>();
  @Output() onSave = new EventEmitter<any>();

  public get isEditing(): boolean {
    if (this.relationModel && this.relationModel.id) {
      return true;
    }

    return false;
  }

  public get noneRelationIsSelected(): boolean {
    return (!this.relationModel || !this.sourceAnn || !this.sourceLayer || !this.targetAnn || !this.targetLayer);
  }

  layersList: Layer[] = [];

  @ViewChild(NgForm) public relationForm!: NgForm;
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
  }

  ngOnDestroy(): void {
    Swal.close();
  }

  onCancelBtn() {
    this.onCancel.emit();
  }

  onClearBtn() {
    this.relationForm.form.reset();
    this.saveWithFormErrors();
  }

  onSubmit(form: NgForm): void {
    if (this.relationForm.invalid) {
      return this.saveWithFormErrors();
    }

    this.save();
  }

  showDeleteModal(): void {
    if (!this.relationModel) {
      return;
    }

    let confirmMsg = 'Stai per cancellare una relazione';

    this.popupDeleteItem.confirmMessage = confirmMsg;

    this.popupDeleteItem.showDeleteConfirm(() => this.deleteElement((this.relationModel?.id || "")), this.relationModel.id);
  }

  private save(): void {
    if (!this.relationModel) {
      this.messageService.add(this.msgConfService.generateErrorMessageConfig("Errore durante il salvataggio!"));
      return;
    }

    let successMsg = "Operazione effettuata con successo";

    // INIZIO INIZIALIZZAZIONE
    if (!this.sourceAnn.attributes) {
      this.sourceAnn.attributes = {};
    }

    if (!this.targetAnn.attributes) {
      this.targetAnn.attributes = {};
    }

    if (!this.sourceAnn.attributes['relations']) {
      this.sourceAnn.attributes['relations'] = new Relations();
    }

    if (!this.targetAnn.attributes['relations']) {
      this.targetAnn.attributes['relations'] = new Relations();
    }
    // FINE INIZIALIZZAZIONE

    if (this.isEditing) {
      successMsg = "Relazione modificata con successo";

      let sIndex = this.sourceAnn.attributes['relations'].out.findIndex((r: Relation) => r.id == this.relationModel?.id);
      let tIndex = this.targetAnn.attributes['relations'].in.findIndex((r: Relation) => r.id == this.relationModel?.id);

      if (sIndex < 0) {
        return;
      }

      if (tIndex < 0) {
        return;
      }

      this.sourceAnn.attributes['relations'].out.splice(sIndex, 1);
      this.targetAnn.attributes['relations'].in.splice(tIndex, 1);
    }
    else {
      successMsg = "Relazione creata con successo";
      this.relationModel.id = uuidv4();
    }

    this.sourceAnn.attributes['relations'].out.push(JSON.parse(JSON.stringify(this.relationModel)));
    this.targetAnn.attributes['relations'].in.push(JSON.parse(JSON.stringify(this.relationModel)));

    // @TODO: queste chiamate andranno sostituite con una unica al nostro backend che gestirà la creazione delle relazioni
    this.loaderService.show();
    this.annotationService.update(this.sourceAnn).subscribe({
      next: () => {
        this.annotationService.update(this.targetAnn).subscribe({
          next: () => {
            this.loaderService.hide();
            this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
            this.onSave.emit();
          },
          error: (err: string) => {
            this.loaderService.hide();
            this.messageService.add(this.msgConfService.generateErrorMessageConfig(err));
          }
        });
      },
      error: (err: string) => {
        this.loaderService.hide();
        this.messageService.add(this.msgConfService.generateErrorMessageConfig(err));
      }
    });
  }

  private saveWithFormErrors(): void {
    this.relationForm.form.markAllAsTouched();
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