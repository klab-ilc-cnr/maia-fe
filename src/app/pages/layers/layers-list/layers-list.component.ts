import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { LoaderService } from 'src/app/services/loader.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ColorPickerModule } from 'primeng/colorpicker';
import { Table } from 'primeng/table';
import { Layer } from 'src/app/model/layer.model';
import { LayerService } from 'src/app/services/layer.service';
import Swal from 'sweetalert2';
import { PopupDeleteItemComponent } from 'src/app/controllers/popup/popup-delete-item/popup-delete-item.component';

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

  layers: Layer[] = [];

  layer: Layer = new Layer();

  layerDialog: boolean = false;
  submitted: boolean = false;

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

  openNew() {
    this.layer = new Layer();
    this.submitted = false;
    this.layerDialog = true;
  }

  editLayer(layer: Layer) {
    this.layer = { ...layer };
    this.layerDialog = true;
  }

  hideDialog() {
    this.layerDialog = false;
    this.submitted = false;
  }

  saveLayer() {
    this.submitted = true;

    //bug colorpicker required fix
    if(this.layer.color === undefined
      || this.layer.color === null
      || this.layer.color.trim().length <= 0 )
      {
        return;
      }

    this.loaderService.show();

    //EDIT
    if (this.layer.name?.trim()) {
      if (this.layer.id) {
        this.layerService.updateLayer(this.layer).subscribe({
          next: (layer) => {
            this.layers[this.findIndexById(layer.id!)] = { ...layer };
            this.messageService.add({ severity: 'success', summary: 'Successo', detail: 'Layer aggiornato', life: 3000 });
            this.saveLayerCompleted();
          }
        })
      }
      //CREATE
      else {
        this.layerService.createLayer(this.layer).subscribe({
          next: (layer) => {
            this.layer = layer;
            this.layers.push(this.layer);
            this.messageService.add({ severity: 'success', summary: 'Successo', detail: 'Layer creato', life: 3000 });
            this.viewLayerFeatures(layer);
            this.saveLayerCompleted();
          }
        })
      }
    }
  }

  findIndexById(id: number): number {
    return this.layers.findIndex(l => l.id === this.layer.id)
  }

  deleteLayer(layer: Layer) {
    let confirmMsg = 'Stai per cancellare il layer \'' + layer.name + '\'';

    this.popupDeleteItem.confirmMessage = confirmMsg;
    this.popupDeleteItem.showDeleteConfirm(() => this.delete(layer.id!, (layer.name || "")), layer.id, layer.name);
  }

  viewLayerFeatures(layer: Layer) {
    this.router.navigate([layer.id], { relativeTo: this.activeRoute });
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

  private saveLayerCompleted() {
    this.loaderService.hide();

    this.layers = [...this.layers];
    this.layerDialog = false;
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
