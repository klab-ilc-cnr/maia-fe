import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SelectItem } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { PopupDeleteItemComponent } from 'src/app/controllers/popup/popup-delete-item/popup-delete-item.component';
import { CreateFeature } from 'src/app/models/feature/create-feature';
import { Feature } from 'src/app/models/feature/feature';
import { Layer } from 'src/app/models/layer/layer.model';
import { Tagset } from 'src/app/models/tagset/tagset';
import { TFeature, TFeatureType } from 'src/app/models/texto/t-feature';
import { TLayer } from 'src/app/models/texto/t-layer';
import { TTagset } from 'src/app/models/texto/t-tagset';
import { LayerStateService } from 'src/app/services/layer-state.service';
import { TagsetStateService } from 'src/app/services/tagset-state.service';
import { nameDuplicateValidator } from 'src/app/validators/not-duplicate-name.directive';
import { whitespacesValidator } from 'src/app/validators/whitespaces-validator.directive';

/**Componente della vista di dettaglio di un layer corredata dall'elenco delle feature */
@Component({
  selector: 'app-layers-view',
  templateUrl: './layers-view.component.html',
  styleUrls: ['./layers-view.component.scss'],
  providers: [LayerStateService, TagsetStateService]
})
export class LayersViewComponent implements OnInit {
  private readonly unsubscribe$ = new Subject();
  visibleEditNewFeature = false;
  tlayer!: TLayer;
  tlayer$ = this.layerState.layer$;
  features$ = this.layerState.features$;
  featuresForm = new FormGroup({
    name: new FormControl<string>('', [Validators.required, whitespacesValidator]),
    type: new FormControl<string>('', Validators.required),
    tagset: new FormControl<TTagset | null>(null),
    description: new FormControl<string>(''),
  });
  get name() { return this.featuresForm.controls.name; }
  get type() { return this.featuresForm.controls.type; }
  get tagset() { return this.featuresForm.controls.tagset; }
  get description() { return this.featuresForm.controls.description; }
  tagsets$ = this.tagsetState.tagsets$;
  featureNames: string[] = [];
  public featureTypes = TFeatureType;
  featureOnEdit: TFeature | undefined;
  newEditTitle = '';
  /**
   * Effettua la rimozione di una feature
   * @param id {number} identificativo numerico della feature
   * @param name {string} nome della feature
   */
  private deleteFeature = (feature: TFeature): void => {
    this.layerState.removeFeature.next(feature);
  }

  /**Getter che definisce se una feature è in modifica */
  public get isEditing(): boolean {
    return this.featureOnEdit !== undefined;
  }

  /**Identificativo numerico del layer in lavorazione */
  layerId!: number;
  /**Layer in lavorazione */
  layerInfo: Layer | undefined;
  /**Lista delle feature */
  features: Feature[] = [];
  /**Oggetto che rappresenta una nuova feature in creazione */
  featureModel: CreateFeature = new CreateFeature();

  /**Lista di elementi selezionabili che rappresentano i tipi di feature */
  featureTypeOptions = new Array<SelectItem>();
  /**Lista di tagset */
  tagsetList: Tagset[] = [];
  /**Lista di elementi selezionabili che rappresentano i possibili tagset */
  tagsetOptions = new Array<SelectItem>();

  /**Riferimento al popup di cancellazione di un elemento */
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

  /**
   * Costruttore per LayersViewComponent
   * @param route {ActivatedRoute} fornisce l'accesso alle informazioni di una route associata con un componente caricato in un outlet
   * @param router {Router} servizi per la navigazione fra le viste
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

  /**Metodo dell'interfaccia OnInit utilizzato per inizializzare i valori di partenza del componente */
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

  /**Metodo dell'interfaccia OnDestroy, utilizzato per chiudere eventuali popup swal aperti */
  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  /**Metodo che naviga "indietro" sulla pagina dei layer */
  back() {
    this.router.navigate(['layers']);
  }

  /**
   * Metodo che sottomette il form della feature per salvarne i dati
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

  /**Metodo che visualizza il modale per lavorazione della nuova feature */
  showFeatureModal() {
    this.featureOnEdit = undefined;
    this.newEditTitle = 'New feature';
    this.featuresForm.reset();
    this.name.setValidators(nameDuplicateValidator(this.featureNames));
    this.visibleEditNewFeature = true;
  }

  /**
   * Metodo che gestisce la visualizzazione dei popup di cancellazione di una feature e invoca la sua effettiva eliminazione
   * @param feature {Feature} feature da rimuovere
   */
  showDeleteFeatureModal(feature: TFeature) {
    const confirmMsg = 'Stai per cancellare la feature \'' + feature.name + '\'';
    this.popupDeleteItem.confirmMessage = confirmMsg;
    this.popupDeleteItem.showDeleteConfirm(() => this.deleteFeature(feature), feature.id, (feature.name || ""));
  }

  /**
   * Metodo che visualizza il modale di edit di una feature
   * @param feature {Feature} feature da modificare
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
