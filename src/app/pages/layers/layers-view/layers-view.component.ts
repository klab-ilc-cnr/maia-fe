import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PopupDeleteItemComponent } from 'src/app/controllers/popup/popup-delete-item/popup-delete-item.component';
import { TFeature, TFeatureType } from 'src/app/models/texto/t-feature';
import { TLayer } from 'src/app/models/texto/t-layer';
import { TTagset } from 'src/app/models/texto/t-tagset';
import { LayerStateService } from 'src/app/services/layer-state.service';
import { TagsetStateService } from 'src/app/services/tagset-state.service';
import { nameDuplicateValidator } from 'src/app/validators/not-duplicate-name.directive';
import { whitespacesValidator } from 'src/app/validators/whitespaces-validator.directive';

/**Component of the detail view of a layer accompanied by the feature list */
@Component({
  selector: 'app-layers-view',
  templateUrl: './layers-view.component.html',
  styleUrls: ['./layers-view.component.scss'],
  providers: [LayerStateService, TagsetStateService]
})
export class LayersViewComponent implements OnInit {
  /**Subject for subscribe management */
  private readonly unsubscribe$ = new Subject();
  /**Defines whether the creation/insertion modal of a feature is visible */
  visibleEditNewFeature = false;
  /**Current layer */
  tlayer!: TLayer;
  /**Observable of the current layer */
  tlayer$ = this.layerState.layer$;
  /**Observable of the feature list for the current layer */
  features$ = this.layerState.features$;
  /**Feature description form */
  featuresForm = new FormGroup({
    name: new FormControl<string>('', [Validators.required, whitespacesValidator]),
    type: new FormControl<string>('', Validators.required),
    tagset: new FormControl<TTagset | null>(null),
    description: new FormControl<string>(''),
  });
  /**Getter for the form name field */
  get name() { return this.featuresForm.controls.name; }
  /**Getter for the form type field */
  get type() { return this.featuresForm.controls.type; }
  /**Getter for the form tagset field */
  get tagset() { return this.featuresForm.controls.tagset; }
  /**Getter for the form description field */
  get description() { return this.featuresForm.controls.description; }
  /**Observable of the tagset list */
  tagsets$ = this.tagsetState.tagsets$;
  /**Feature names list */
  featureNames: string[] = [];
  /**Enum of feature types */
  public featureTypes = TFeatureType;
  /**Current feature on edit */
  featureOnEdit: TFeature | undefined;
  /**Current feature title */
  newEditTitle = '';
  /**
   * Perform feature removal
   * @param id {number} numerical feature identifier
   * @param name {string} feature name
   */
  private deleteFeature = (feature: TFeature): void => {
    this.layerState.removeFeature.next(feature);
  }

  /**Getter that defines whether a feature is being edited */
  public get isEditing(): boolean {
    return this.featureOnEdit !== undefined;
  }

  /**Reference to item deletion popup */
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

  /**
   * Constructor for LayersViewComponent
   * @param route {ActivatedRoute} Provides access to information about a route associated with a component that is loaded in an outlet
   * @param router {Router} A service that provides navigation among views and URL manipulation capabilities
   * @param layerState {LayerStateService} service that manages the general state of the layers
   * @param tagsetState {TagsetStateService} service that manages the general state of the tagset
   */
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private layerState: LayerStateService,
    private tagsetState: TagsetStateService,
  ) {
    this.layerState.layer$.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(l => {
      this.tlayer = l;
    });
    this.features$.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(f => {
      const temp = f.map(e => e.name!);
      this.featureNames = temp;
    });
  }

  /**OnInit interface method used to initialize the starting values of the component */
  ngOnInit(): void {
    this.route.paramMap.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(params => {
      const id = params.get('id');
      if (id === null) {
        this.back();
        return;
      }
      this.layerState.retrieveLayerById.next(+id);
      this.layerState.retrieveLayerFeatures.next(+id);
    });

    this.type.valueChanges.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(type => {
      if (type === TFeatureType.TAGSET) {
        this.tagset.addValidators(Validators.required);
        return;
      }
      this.tagset.removeValidators(Validators.required);
      this.tagset.setValue(null);
    })
  }

  /**Method of the OnDestroy interface, used to emit the unsubscribe subject */
  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  /**Method that navigates "back" to the layers page */
  back() {
    this.router.navigate(['layers']);
  }

  /**
   * Method that submits the feature form to save its data
   * @returns {void}
   */
  onSubmitFeatureModal(): void {
    if (this.featuresForm.invalid) return;
    const eventualTagset = this.type.value === TFeatureType.TAGSET ? this.tagset.value : undefined;
    if (this.featureOnEdit !== undefined) {
      const updatedFeature = <TFeature>{ ...this.featureOnEdit, name: this.name.value, type: this.type.value, tagset: eventualTagset, description: this.description.value, layer: this.tlayer };
      this.layerState.updateFeature.next(updatedFeature);
    } else {
      const newFeature = <TFeature>{ name: this.name.value, type: this.type.value, tagset: eventualTagset, description: this.description.value, layer: this.tlayer };
      this.layerState.addFeature.next(newFeature);
    }
    this.visibleEditNewFeature = false;
    this.featureOnEdit = undefined;
  }

  /**Method that displays the modal for processing the new feature */
  showFeatureModal() {
    this.featureOnEdit = undefined;
    this.newEditTitle = 'New feature';
    this.featuresForm.reset();
    this.name.setValidators(nameDuplicateValidator(this.featureNames));
    this.visibleEditNewFeature = true;
  }

  /**
   * Method that handles the display of feature deletion popups and invokes its actual deletion
   * @param feature {TFeature} feature to be removed
   */
  showDeleteFeatureModal(feature: TFeature) {
    const confirmMsg = 'Stai per cancellare la feature \'' + feature.name + '\'';
    this.popupDeleteItem.confirmMessage = confirmMsg;
    this.popupDeleteItem.showDeleteConfirm(() => this.deleteFeature(feature), feature.id, (feature.name || ""));
  }

  /**
   * Method that displays the edit modal of a feature
   * @param feature {TFeature} feature to be modified
   */
  showEditFeatureModal(feature: TFeature) {
    this.newEditTitle = feature.name!;
    this.featureOnEdit = feature;
    this.featuresForm.reset();
    this.name.setValue(feature.name || '');
    this.type.setValue(feature.type || '');
    this.description.setValue(feature.description || '');
    if (feature.type === TFeatureType.TAGSET) {
      this.tagset.setValue(feature.tagset || null);
    }
    this.name.setValidators(nameDuplicateValidator(this.featureNames));
    this.visibleEditNewFeature = true;
  }
}
