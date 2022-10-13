import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { LoaderService } from 'src/app/services/loader.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ColorPickerModule } from 'primeng/colorpicker';
import { Table } from 'primeng/table';
import { Layer } from 'src/app/models/layer/layer.model';
import { LayerService } from 'src/app/services/layer.service';
import Swal from 'sweetalert2';
import { PopupDeleteItemComponent } from 'src/app/controllers/popup/popup-delete-item/popup-delete-item.component';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-layers-list',
  templateUrl: './layers-list.component.html',
  styleUrls: ['./layers-list.component.scss']
})
export class LayersListComponent implements OnInit {
  private delete = (id: number, name: string): void => {
    this.showOperationInProgress('Sto cancellando');

    let errorMsg = 'Errore nell\'eliminare il layer \'' + name + '\'';
    let successMsg = 'Layer \'' + name + '\' eliminato con successo';

    this.layerService
        .deleteLayer(id)
        .subscribe({
          next: (result) => {
            this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
            Swal.close();
            this.loadData();
          },
          error: () => {
            this.showOperationFailed('Cancellazione Fallita: ' + errorMsg)
          }
        })
  }

  public get isEditing(): boolean {
    if (this.layer && this.layer.id) {
      return true;
    }

    return false;
  }

  public get layerModalTitle(): string {
    if (((!this.layerForm) || (!this.layerForm.value)) || (!this.layerForm.value.name)) {
      return "Nuovo layer";
    }

    return this.layerForm.value.name;
  }

  public get filteredLayerNames(): string[] {
    let filteredLayers = this.layers;

    if (this.layer.id) {
      filteredLayers = this.layers.filter(l => l.id != this.layer.id);
    }

    return filteredLayers.map(l => l.name!);
  }

  layer: Layer = new Layer();
  layers: Layer[] = [];

  @ViewChild(NgForm) public layerForm!: NgForm;
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

  constructor(
    private router: Router,
    private activeRoute: ActivatedRoute,
    private loaderService: LoaderService,
    private layerService: LayerService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
    private confirmationService: ConfirmationService) { }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    Swal.close();
  }

  onSubmitLayerModal(form: NgForm): void {
    if (this.layerForm.invalid) {
      return this.saveWithFormErrors();
    }

    this.save();
  }

  showDeleteLayerModal(layer: Layer) {
    let confirmMsg = 'Stai per cancellare il layer \'' + layer.name + '\'';

    this.popupDeleteItem.confirmMessage = confirmMsg;
    this.popupDeleteItem.showDeleteConfirm(() => this.delete(layer.id!, (layer.name || "")), layer.id, layer.name);
  }

  showEditLayerModal(layer: Layer) {
    this.resetForm();
    this.layer = JSON.parse(JSON.stringify(layer));

    $('#layerModal').modal('show');
  }

  showLayerModal() {
    this.resetForm();

    $('#layerModal').modal('show');
  }

  viewLayerFeatures(layer: Layer) {
    this.router.navigate([layer.id], { relativeTo: this.activeRoute });
  }

  private findIndexById(id: number): number {
    return this.layers.findIndex(l => l.id === this.layer.id)
  }

  private loadData() {
    this.loaderService.show();
    this.layerService.retrieveLayers()
      .subscribe({
        next: (data: Layer[]) => {
          this.layers = data;
          this.loaderService.hide();
        }
      });
  }

  private resetForm() {
    this.layer = new Layer();
    this.layerForm.form.markAsUntouched();
    this.layerForm.form.markAsPristine();
  }

  private save(): void {
    if (!this.layer) {
      this.messageService.add(this.msgConfService.generateErrorMessageConfig("Errore durante il salvataggio!"));
      return;
    }

    //bug colorpicker required fix
    if(this.layer.color === undefined
      || this.layer.color === null
      || this.layer.color.trim().length <= 0 )
      {
        this.messageService.add(this.msgConfService.generateErrorMessageConfig("Errore durante il salvataggio!"));
        return;
      }

    let msgSuccess = "Operazione effettuata con successo";

    this.loaderService.show();

    if (this.isEditing && this.layer.name?.trim() && this.layer.id) {
      msgSuccess = "Layer modificato con successo";

      this.layerService
        .updateLayer(this.layer)
        .subscribe({
          next: (layer) => {
            $('#layerModal').modal('hide');

            this.layers[this.findIndexById(layer.id!)] = { ...layer }; // NON SERVE PIU' SECONDO ME

            this.loaderService.hide();
            this.messageService.add(this.msgConfService.generateSuccessMessageConfig(msgSuccess));
            this.saveLayerCompleted();
            this.loadData();
          },
          error: (err: string) => {
            $('#layerModal').modal('hide');
            this.loaderService.hide();
            this.messageService.add(this.msgConfService.generateErrorMessageConfig(err));
            this.saveLayerCompleted();
          }
        });
    }
    else {
      msgSuccess = "Layer creato con successo";

      this.layerService
        .createLayer(this.layer)
        .subscribe({
          next: (layer) => {
            $('#layerModal').modal('hide');

            this.layer = layer; // NON SERVE PIU' SECONDO ME
            this.layers.push(this.layer); // NON SERVE PIU' SECONDO ME

            this.loaderService.hide();
            this.messageService.add(this.msgConfService.generateSuccessMessageConfig(msgSuccess));
            this.saveLayerCompleted();

            this.viewLayerFeatures(layer);
          },
          error: (err: string) => {
            $('#layerModal').modal('hide');
            this.loaderService.hide();
            this.messageService.add(this.msgConfService.generateErrorMessageConfig(err));
            this.saveLayerCompleted();
          }
        });
    }
  }

  private saveWithFormErrors(): void {
    this.layerForm.form.markAllAsTouched();
  }

  private saveLayerCompleted() {
    this.layers = [...this.layers];
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
