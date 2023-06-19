import { Component, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PopupDeleteItemComponent } from 'src/app/controllers/popup/popup-delete-item/popup-delete-item.component';
import { Layer } from 'src/app/models/layer/layer.model';
import { TLayer } from 'src/app/models/texto/t-layer';
import { LayerStateService } from 'src/app/services/layer-state.service';
import { nameDuplicateValidator } from 'src/app/validators/not-duplicate-name.directive';
import { whitespacesValidator } from 'src/app/validators/whitespaces-validator.directive';

/**Componente della tabella dei layer */
@Component({
  selector: 'app-layers-list',
  templateUrl: './layers-list.component.html',
  styleUrls: ['./layers-list.component.scss'],
  providers: [LayerStateService]
})
export class LayersListComponent {
  private readonly unsubscribe$ = new Subject();
  layers$ = this.layerState.layers$;
  layerOnEdit: TLayer | undefined = undefined;
  layersNames: string[] = [];
  tlayerForm = new FormGroup({
    name: new FormControl<string>('', [Validators.required, whitespacesValidator]),
    color: new FormControl<string>('', [Validators.required]),
    description: new FormControl<string>(''),
  });
  get name() { return this.tlayerForm.controls.name }
  get color() { return this.tlayerForm.controls.color }
  get description() { return this.tlayerForm.controls.description }
  visibleEditNewLayer = false;
  modalTitle = '';
  /**
   * Esegue la rimozione di un layer
   * @param id {number} identificativo numerico del layer
   * @param name {string} nome del layer
   */
  private delete = (id: number, name: string): void => {
    this.layerState.removeLayer.next(id);
  }

  /**Getter della lista dei nomi dei layer esistenti */
  public get filteredLayerNames(): string[] {
    let filteredLayers = this.layers;

    if (this.layer.id) {
      filteredLayers = this.layers.filter(l => l.id != this.layer.id);
    }

    return filteredLayers.map(l => l.name!);
  }

  /**Nuovo oggetto Layer */
  layer: Layer = new Layer();
  /**Lista di layer */
  layers: Layer[] = [];

  /**Riferimento al popup di cancellazione elemento */
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

  /**
   * Costruttore per LayersListComponent
   * @param router {Router} servizi per la navigazione fra le viste
   * @param activeRoute {ActivatedRoute} fornisce l'accesso alle informazioni di una route associata con un componente caricato in un outlet
   */
  constructor(
    private router: Router,
    private activeRoute: ActivatedRoute,
    private layerState: LayerStateService,
  ) {
    this.layers$.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(ll => {
      const temp = ll.map(l => l.name!);
      this.layersNames = temp;
    });
  }

  /**Metodo dell'interfaccia OnDestroy nel quale vengono chiusi eventuali swal (che gestiscono i popup) */
  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  /**
   * Metodo che sottomette i dati del form nel popup per la creazione o modifica di un layer
   * @returns {void}
   */
  onSubmitLayerModal(): void {
    if (this.tlayerForm.invalid || this.name.value === '') return;
    if (this.layerOnEdit !== undefined) {
      const updatedLayer = <TLayer>{ ...this.layerOnEdit, name: this.name.value, color: this.color.value, description: this.description.value };
      this.layerState.updateLayer.next(updatedLayer);
    } else {
      const newLayer = <TLayer>{ name: this.name.value, color: this.color.value, description: this.description.value };
      this.layerState.addLayer.next(newLayer);
    }
    this.visibleEditNewLayer = false;
    this.layerOnEdit = undefined;
  }

  /**
   * Metodo che visualizza il modale di conferma cancellazione di un layer
   * @param layer {Layer} layer da eliminare
   */
  showDeleteLayerModal(layer: TLayer) {
    const confirmMsg = `You are about to delete the layer "${layer.name}"`;
    this.popupDeleteItem.confirmMessage = confirmMsg;
    this.popupDeleteItem.showDeleteConfirm(() => this.delete(layer.id!, (layer.name || "")), layer.id, layer.name);
  }

  /**
   * Metodo che visualizza il modale di modifica di un layer
   * @param layer {Layer} layer da modificare
   */
  showEditLayerModal(layer: TLayer) {
    this.tlayerForm.reset();
    this.layerOnEdit = layer;
    this.name.setValue(layer.name || '');
    this.name.setValidators(nameDuplicateValidator(this.layersNames));
    this.color.setValue(layer.color || '');
    this.description.setValue(layer.description || '');
    this.modalTitle = layer.name || 'Edit layer';
    this.visibleEditNewLayer = true;
  }

  /**Metodo che visualizza il modale di modifica di un layer per un nuovo inserimento */
  showLayerModal() {
    this.layerOnEdit = undefined;
    this.tlayerForm.reset();
    this.modalTitle = "New layer";
    this.name.setValidators(nameDuplicateValidator(this.layersNames));
    this.visibleEditNewLayer = true;
  }

  /**
   * Metodo che naviga sulla vista di dettaglio del layer per gestirne le feature
   * @param layer {Layer} layer aggiunto
   */
  viewLayerFeatures(layer: TLayer) {
    this.router.navigate([layer.id], { relativeTo: this.activeRoute });
  }
}
