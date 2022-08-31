import { LayerService } from 'src/app/services/layer.service';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Layer } from 'src/app/model/layer.model';

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
    this.layerService.retrieveLayers().subscribe({
      next: (layers) => {
        this.layers = layers;

        if (!this.selectedLayers) {
          this.selectedLayers = layers;
        }
      }
    })
  }

}
