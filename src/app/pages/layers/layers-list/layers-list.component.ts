import { Component, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PopupDeleteItemComponent } from 'src/app/controllers/popup/popup-delete-item/popup-delete-item.component';
import { TLayer } from 'src/app/models/texto/t-layer';
import { LayerStateService } from 'src/app/services/layer-state.service';
import { setUniqueNameValidators } from 'src/app/validators/not-duplicate-name.directive';
import { whitespacesValidator } from 'src/app/validators/whitespaces-validator.directive';

/**Component representing the layer table */
@Component({
  selector: 'app-layers-list',
  templateUrl: './layers-list.component.html',
  styleUrls: ['./layers-list.component.scss'],
  providers: [LayerStateService],
  standalone: false
})
export class LayersListComponent {
  /**Subject for subscribe management */
  private readonly unsubscribe$ = new Subject();
  /**Observable of the layer list */
  layers$ = this.layerState.layers$;
  /**Layer currently being edited */
  layerOnEdit: TLayer | undefined = undefined;
  /**List of existing layer names */
  layersNames: string[] = [];
  /**List of existing layer colors */
  layersColor: string[] = [];
  /**Layer description form */
  tlayerForm = new FormGroup({
    name: new FormControl<string>('', [Validators.required, whitespacesValidator]),
    color: new FormControl<string>('', [Validators.required]),
    description: new FormControl<string>(''),
  });
  /**Getter for the form name field */
  get name() { return this.tlayerForm.controls.name }
  /**Getter for the form color field */
  get color() { return this.tlayerForm.controls.color }
  /**Getter for the form description field */
  get description() { return this.tlayerForm.controls.description }
  /**Defines whether the creation/insertion modal of a layer is visible */
  visibleEditNewLayer = false;
  /**Modal title */
  modalTitle = '';
  /**
   * Performs removal of a layer
   * @param id {number} numeric layer identifier
   * @param name {string} layer name
   */
  private delete = (id: number, name: string): void => {
    this.layerState.removeLayer.next(id);
  }

  /**Reference to item deletion popup */
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

  /**
   * Constructor for LayersListComponent
   * @param router {Router} A service that provides navigation among views and URL manipulation capabilities
   * @param activeRoute {ActivatedRoute} Provides access to information about a route associated with a component that is loaded in an outlet
   * @param layerState {LayerStateService} service that manages the general state of the layers
   */
  constructor(
    private router: Router,
    private activeRoute: ActivatedRoute,
    private layerState: LayerStateService,
  ) {
    this.layers$.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(ll => {
      const tempNames = ll.map(l => l.name!);
      const tempColors = ll.map(l => l.color!);
      this.layersNames = tempNames;
      this.layersColor = tempColors;
    });
  }

  /**Method of the OnDestroy interface, used to emit the unsubscribe subject */
  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  /**
   * Method that submits form data in the popup for creating or editing a layer
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
   * Method that displays the delete confirmation modal of a layer
   * @param layer {Layer} layer to remove
   */
  showDeleteLayerModal(layer: TLayer) {
    const confirmMsg = `You are about to delete the layer "${layer.name}"`;
    this.popupDeleteItem.confirmMessage = confirmMsg;
    this.popupDeleteItem.showDeleteConfirm(() => this.delete(layer.id!, (layer.name || "")), layer.id, layer.name);
  }

  /**
   * Method that displays the editing modal of a layer
   * @param layer {TLayer} layer to edit
   */
  showEditLayerModal(layer: TLayer) {
    this.tlayerForm.reset();
    this.layerOnEdit = layer;
    this.name.setValue(layer.name || '');
    const tempNames = this.layersNames.filter(n => n !== layer.name); //If the name is not changed, it should not be invalid
    setUniqueNameValidators(this.name, tempNames);
    this.color.setValue(layer.color || '');
    const tempColors = this.layersColor.filter(l => l !== layer.color); //If the color is not changed, it should not be invalid
    setUniqueNameValidators(this.color, tempColors, [Validators.required]);
    this.description.setValue(layer.description || '');
    this.modalTitle = layer.name || 'Edit layer';
    this.visibleEditNewLayer = true;
  }

  /**Method that displays the modal with the form to create a new layer */
  showLayerModal() {
    this.layerOnEdit = undefined;
    this.tlayerForm.reset();
    this.modalTitle = "New layer";
    setUniqueNameValidators(this.name, this.layersNames);
    setUniqueNameValidators(this.color, this.layersColor, [Validators.required]);
    // the color picker always shows a color (red when the field is empty): the field starts with a free one, so what is
    // shown is what is saved (before, Add stayed disabled with no hint until a color was picked)
    this.color.setValue(this.freeColor());
    this.visibleEditNewLayer = true;
  }

  /**
   * A pastel color that no layer uses yet
   * @returns {string} color as #rrggbb
   */
  private freeColor(): string {
    const used = new Set(this.layersColor.map(c => (c ?? '').toLowerCase()));
    const hsl = (h: number) => {
      const s = 0.7, l = 0.75, k = (n: number) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
      const f = (n: number) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
      return '#' + [f(0), f(8), f(4)].map(x => x.toString(16).padStart(2, '0')).join('');
    };
    for (let i = 0; i < 50; i++) {
      const color = hsl(Math.floor(Math.random() * 360));
      if (!used.has(color)) { return color; }
    }
    return hsl(0);
  }

  /**
   * Method that navigates to the detail view of the layer to manage its features
   * @param layer {TLayer} added layer
   */
  viewLayerFeatures(layer: TLayer) {
    this.router.navigate([layer.id], { relativeTo: this.activeRoute });
  }
}
