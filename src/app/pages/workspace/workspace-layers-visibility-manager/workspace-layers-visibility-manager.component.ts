import { LoaderService } from 'src/app/services/loader.service';
import { LayerService } from 'src/app/services/layer.service';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Layer } from 'src/app/models/layer/layer.model';

//TODO verificare stato del componente, non appare in uso in alcun punto
@Component({
  selector: 'app-workspace-layers-visibility-manager',
  templateUrl: './workspace-layers-visibility-manager.component.html',
  styleUrls: ['./workspace-layers-visibility-manager.component.scss']
})
export class WorkspaceLayersVisibilityManagerComponent implements OnInit {

  @Output() changeVisibleLayers = new EventEmitter<any>();

  layers: Layer[] = [];
  selectedLayers: Layer[] | undefined;

  constructor(
    private loaderService: LoaderService,
    private layerService: LayerService
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  hideAll() {
    this.selectedLayers = [];
    this.selectionChange();
  }

  reload() {
    this.loadData();
  }

  showAll() {
    this.selectedLayers = this.layers;
    this.selectionChange();
  }

  selectionChange() {
    console.log('selezionati', this.selectedLayers)
    this.changeVisibleLayers.emit(this.selectedLayers);
  }

  private loadData() {
    this.loaderService.show();
    this.layerService.retrieveLayers().subscribe({
      next: (layers) => {
        this.layers = layers;

        if (!this.selectedLayers) {
          this.selectedLayers = layers;
        }

        this.loaderService.hide();
      }
    })
  }

}
