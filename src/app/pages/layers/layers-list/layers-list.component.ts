import { LoaderService } from 'src/app/services/loader.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ColorPickerModule } from 'primeng/colorpicker';
import { Table } from 'primeng/table';
import { Layer } from 'src/app/model/layer.model';
import { LayerService } from 'src/app/services/layer.service';

@Component({
  selector: 'app-layers-list',
  templateUrl: './layers-list.component.html',
  styleUrls: ['./layers-list.component.scss']
})
export class LayersListComponent implements OnInit {
  layers: Layer[] = [];

  layer: Layer = new Layer();

  layerDialog: boolean = false;
  submitted: boolean = false;

  constructor(
    private router: Router,
    private activeRoute: ActivatedRoute,
    private loaderService: LoaderService,
    private layerService: LayerService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService) { }

  ngOnInit(): void {
    this.loaderService.show();
    this.layerService.retrieveLayers()
      .subscribe({
        next: (data: Layer[]) => {
          this.layers = data;
        },
        complete: () => {
          this.loaderService.hide();
        }
      });
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
          },
          complete: () => {
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
          },
          complete: () => {
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
    this.confirmationService.confirm({
      message: 'Sei sicuro di voler eliminare il layer',
      header: 'Conferma',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.loaderService.show();

        this.layerService.deleteLayer(layer.id).subscribe({
          next: (data) => {
            let indexOfDeleted = this.layers.findIndex(l => l.id === data);
            this.layers.splice(indexOfDeleted, 1);
            this.messageService.add({ severity: 'success', summary: 'Successo', detail: 'Layer eliminato', life: 3000 });
          },
          complete: () => {
            this.loaderService.hide();
          }
        })
      }
    });
  }

  viewLayerFeatures(layer: Layer) {
    this.router.navigate([layer.id], { relativeTo: this.activeRoute });
  }

  private saveLayerCompleted() {
    this.loaderService.hide();

    this.layers = [...this.layers];
    this.layerDialog = false;
  }
}
