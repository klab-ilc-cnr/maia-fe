import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Layer } from '../../model/layer.model';
import { LayerService } from '../../services/layer.service';
import { ColorPickerModule } from 'primeng/colorpicker';
import { Table } from 'primeng/table';

@Component({
  selector: 'app-layer',
  templateUrl: './layer.component.html',
  styleUrls: ['./layer.component.scss']
})
export class LayerComponent implements OnInit {

  layers: Layer[] = [];

  layer: Layer = new Layer();

  layerDialog: boolean = false;
  submitted: boolean = false;

  constructor(private router: Router,
    private activeRoute: ActivatedRoute,
    private layerService: LayerService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService) { }

  ngOnInit(): void {
    this.layerService.retrieveLayers()
      .subscribe((data: Layer[]) => {
        this.layers = data;
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

    //EDIT
    if (this.layer.name?.trim()) {
      if (this.layer.id) {
        this.layerService.updateLayer(this.layer).subscribe(layer => {
          this.layers[this.findIndexById(layer.id!)] = { ...layer };
          this.messageService.add({ severity: 'success', summary: 'Successo', detail: 'Layer aggiornato', life: 3000 });
        })
      }
      //CREATE
      else {
        this.layerService.createLayer(this.layer).subscribe(layer => {
          this.layer = layer;
          this.layers.push(this.layer);
          this.messageService.add({ severity: 'success', summary: 'Successo', detail: 'Layer creato', life: 3000 });
        })
      }

      this.layers = [...this.layers];
      this.layerDialog = false;
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
        this.layerService.deleteLayer(layer.id).subscribe((data) => {
          let indexOfDeleted = this.layers.findIndex(l => l.id === data);
          this.layers.splice(indexOfDeleted, 1);
          this.messageService.add({ severity: 'success', summary: 'Successo', detail: 'Layer eliminato', life: 3000 });
        })
      }
    });
  }
}