import { FeatureService } from 'src/app/services/feature.service';
import { LoaderService } from 'src/app/services/loader.service';
import { TagsetService } from 'src/app/services/tagset.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { MessageService, SelectItem } from 'primeng/api';
import { LayerService } from 'src/app/services/layer.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Layer } from 'src/app/models/layer/layer.model';
import { Feature } from 'src/app/models/feature/feature';
import { NgForm } from '@angular/forms';
import { FeatureType } from 'src/app/models/feature/feature-type';
import { Tagset } from 'src/app/models/tagset/tagset';
import Swal from 'sweetalert2';
import { PopupDeleteItemComponent } from 'src/app/controllers/popup/popup-delete-item/popup-delete-item.component';
import { CreateFeature } from 'src/app/models/feature/create-feature';

/**Variabile globale (jQuery?) */
declare var $: any; //TODO verificare natura di questo elemento

/**Componente della vista di dettaglio di un layer corredata dall'elenco delle feature */
@Component({
  selector: 'app-layers-view',
  templateUrl: './layers-view.component.html',
  styleUrls: ['./layers-view.component.scss']
})
export class LayersViewComponent implements OnInit {
  /**
   * Effettua la rimozione di una feature
   * @param id {number} identificativo numerico della feature
   * @param name {string} nome della feature
   */
  private deleteFeature = (id: number, name: string): void => {
    this.showOperationInProgress('Sto cancellando');

    let errorMsg = 'Errore nell\'eliminare la feature \'' + name + '\'';
    let failMsg = 'La feature \'' + name + '\' è parte di un\'annotazione';
    let successMsg = 'Feature \'' + name + '\' eliminato con successo';

    this.featureService
        .deleteFeature(this.layerInfo!.id!, id)
        .subscribe({
          next: (result) => {
            if (result) {
              this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
              Swal.close();
            }
            else {
              this.showOperationFailed('Cancellazione Fallita: ' + failMsg);
            }
            this.loadDetails(this.layerId);
          },
          error: () => {
            this.showOperationFailed('Cancellazione Fallita: ' + errorMsg);
          }
        })
  }

  /**Getter che definisce se una feature è in modifica */
  public get isEditing(): boolean {
    if (this.featureModel && this.featureModel.id) {
      return true;
    }

    return false;
  }

  /**Getter del titolo di una feature per il modale */
  public get featureModalTitle(): string {
    if (((!this.featureForm) || (!this.featureForm.value)) || (!this.featureForm.value.name)) {
      return "Nuova feature";
    }

    return this.featureForm.value.name;
  }

  /**Getter che definisce se una feature è di tipo tagset */
  public get featureType(): boolean {
    return this.featureModel.type == FeatureType.TAGSET;
  }

  /**Getter che restituisce la lista dei nomi delle feature associate */
  public get filteredFeatureNames(): string[] {
    let filteredFeatures = this.features;

    if (this.featureModel.id) {
      filteredFeatures = this.features.filter(f => f.id != this.featureModel.id);
    }

    return filteredFeatures.map(f => f.name!);
  }

  /**Getter del titolo del layer */
  public get title(): string {
    if (((!this.layerInfo) || (!this.layerInfo.name))) {
      return "Layer";
    }

    return this.layerInfo.name;
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

  /**Riferimento al form della feature */
  @ViewChild(NgForm) public featureForm!: NgForm;
  /**Riferimento al popup di cancellazione di un elemento */
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

  /**
   * Costruttore per LayersViewComponent
   * @param loaderService {LoaderService} servizi per la gestione del segnale di caricamento
   * @param layerService {LayerService} servizi relativi ai layer
   * @param featureService {FeatureService} servizi relativi alle feature
   * @param tagsetService {TagsetService} servizi relativi ai tagset
   * @param messageService {MessageService} servizi per la gestione dei messaggi
   * @param msgConfService {MessageConfigurationService} servizi per la configurazione dei messaggi per messageService
   * @param route {ActivatedRoute} fornisce l'accesso alle informazioni di una route associata con un componente caricato in un outlet
   * @param router {Router} servizi per la navigazione fra le viste
   */
  constructor(
    private loaderService: LoaderService,
    private layerService: LayerService,
    private featureService: FeatureService,
    private tagsetService: TagsetService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  /**Metodo dell'interfaccia OnInit utilizzato per inizializzare i valori di partenza del componente */
  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      var id = params.get('id');

      if (id != null) {
        this.layerId = Number.parseInt(id);
        this.loadDetails(this.layerId);
      }
      else {
        this.back();
      }
    });
  }

  /**Metodo dell'interfaccia OnDestroy, utilizzato per chiudere eventuali popup swal aperti */
  ngOnDestroy(): void {
    Swal.close();
  }

  /**Metodo che naviga "indietro" sulla pagina dei layer */
  back() {
    this.router.navigate(['layers']);
  }

  /**
   * Metodo che al variare della selezione del tipo di feature azzera l'identificativo del tagset associato alla feature
   * @param event {any} evento emesso alla variazione della selezione sulla dropdown dei tipi di feature
   */
  featureTypeChange(event: any) {
    if (!this.featureType) {
      this.featureModel.tagsetId = undefined;
    }
  }

  /**
   * Metodo che sottomette il form della feature per salvarne i dati
   * @param form {NgForm} form della feature
   * @returns {void}
   */
  onSubmitFeatureModal(form: NgForm): void {
    if (this.featureForm.invalid) { //caso di form non valido
      return this.saveWithFormErrors();
    }

    this.save();
  }

  /**Metodo che visualizza il modale per lavorazione della nuova feature */
  showFeatureModal() {
    this.resetForm();
    this.featureModel.layerId = this.layerInfo?.id;

    $('#featureModal').modal('show');
  }

  /**
   * Metodo che gestisce la visualizzazione dei popup di cancellazione di una feature e invoca la sua effettiva eliminazione
   * @param feature {Feature} feature da rimuovere
   */
  showDeleteFeatureModal(feature: Feature) {
    let confirmMsg = 'Stai per cancellare la feature \'' + feature.name + '\'';

    this.popupDeleteItem.confirmMessage = confirmMsg;
    this.popupDeleteItem.showDeleteConfirm(() => this.deleteFeature(feature.id!, (feature.name || "")), feature.id, (feature.name || ""));
  }

  /**
   * Metodo che visualizza il modale di edit di una feature
   * @param feature {Feature} feature da modificare
   */
  showEditFeatureModal(feature: Feature) {
    this.resetForm();
    this.featureModel = JSON.parse(JSON.stringify(feature));

    if (feature.tagset) {
      this.featureModel.tagsetId = feature.tagset.id;
    }

    $('#featureModal').modal('show');
  }

  /**
   * Metodo che recupera i dettagli di un layer
   * @param layerId {number} identificativo del layer
   */
  private loadDetails(layerId: number) {
    this.loaderService.show();
    //TODO probabile integrazione da fare anche sul backend, verificare
    // ATTENZIONE: QUI CI VUOLE LA RETRIEVE SINGOLA BY ID
    this.layerService
      .retrieveLayers()
      .subscribe({
        next: (layers: Layer[]) => {
          this.layerInfo = layers.find(l => l.id == layerId); //avendo recuperato la lista completa dei layer devono filtrare per id
          this.loaderService.hide();
        }
      });

    this.loaderService.show();
    this.featureService
      .retrieveFeaturesByLayerId(layerId)
      .subscribe({
        next: (features: Feature[]) => {
          this.features = features; //recupera la lista di feature associate al layer
          this.loaderService.hide();
        }
      });

    this.featureTypeOptions = Object.values(FeatureType).map((item: any) => ({ label: item, value: item }));

    this.loaderService.show();
    this.tagsetService
      .retrieve()
      .subscribe({
        next: (data: Tagset[]) => {
          this.tagsetList = data;
          this.tagsetOptions = data.map(item => ({ label: item.name, value: item.id }));
          this.loaderService.hide();
        },
        error: (err) => {
          this.loaderService.hide();
          this.messageService.add(this.msgConfService.generateErrorMessageConfig(err))
        }
      });
  }

  /**Metodo privato che inizializza un modello di Feature e imposta il form della feature a nuovo */
  private resetForm() {
    this.featureModel = new CreateFeature();
    this.featureForm.form.markAsUntouched();
    this.featureForm.form.markAsPristine();
  }

  /**
   * Metodo privato per salvare una feature
   * @returns {void}
   */
  private save(): void {
    if (!this.layerInfo || (!this.layerInfo.id) || !this.featureModel) {
      this.messageService.add(this.msgConfService.generateErrorMessageConfig("Errore durante il salvataggio!"));
      return;
    }

    let msgSuccess = "Operazione effettuata con successo";
    let item: any;
    let apiCall;

    if (this.isEditing) { //caso di feature in modifica
      item = JSON.parse(JSON.stringify(this.featureModel));
      if (item.tagsetId) {
        item.tagset = this.tagsetList.find(t => t.id == item.tagsetId);
      }

      msgSuccess = "Feature modificata con successo";
      apiCall = this.featureService.updateFeature(item);
    }
    else {
      msgSuccess = "Feature creata con successo";
      apiCall = this.featureService.createFeature(this.featureModel);
    }

    this.loaderService.show();
    apiCall.subscribe({
      next: () => {
        $('#featureModal').modal('hide');
        this.loaderService.hide();
        this.loadDetails(this.layerId);
        this.messageService.add(this.msgConfService.generateSuccessMessageConfig(msgSuccess));
      },
      error: (err: string) => {
        $('#featureModal').modal('hide');
        this.loaderService.hide();
        this.messageService.add(this.msgConfService.generateErrorMessageConfig(err));
      }
    });
  }

  /**Metodo privato che segnala tutti i campi del form come touched per evidenziare gli errori */
  private saveWithFormErrors(): void {
    this.featureForm.form.markAllAsTouched();
  }

  /**
   * Metodo privato per visualizzare il popup di operazione fallita
   * @param errorMessage {string} messaggio di errore
   */
  private showOperationFailed(errorMessage: string): void {
    Swal.fire({
      icon: 'error',
      title: errorMessage,
      showConfirmButton: true
    });
  }

  /**
   * Metodo privato per la visualizzazione di un popup di operazione in corso
   * @param message {string} messaggio da visualizzare
   */
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
