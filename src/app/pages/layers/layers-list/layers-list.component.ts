import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { LoaderService } from 'src/app/services/loader.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Layer } from 'src/app/models/layer/layer.model';
import { LayerService } from 'src/app/services/layer.service';
import Swal from 'sweetalert2';
import { PopupDeleteItemComponent } from 'src/app/controllers/popup/popup-delete-item/popup-delete-item.component';
import { NgForm } from '@angular/forms';

/**Componente della tabella dei layer */
@Component({
  selector: 'app-layers-list',
  templateUrl: './layers-list.component.html',
  styleUrls: ['./layers-list.component.scss']
})
export class LayersListComponent implements OnInit {
  /**
   * Esegue la rimozione di un layer
   * @param id {number} identificativo numerico del layer
   * @param name {string} nome del layer
   */
  private delete = (id: number, name: string): void => {
    this.showOperationInProgress('Sto cancellando');

    let errorMsg = 'Errore nell\'eliminare il layer \'' + name + '\'';
    let failMsg = 'Il layer \'' + name + '\' è parte di un\'annotazione e/o di una relazione';
    let successMsg = 'Layer \'' + name + '\' eliminato con successo';

    this.layerService
        .deleteLayer(id)
        .subscribe({
          next: (result) => {
            if (result) { //caso di avvenuta rimozione
              this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
              Swal.close();
            }
            else {
              this.showOperationFailed('Cancellazione Fallita: ' + failMsg);
            }
            this.loadData();
          },
          error: () => {
            this.showOperationFailed('Cancellazione Fallita: ' + errorMsg)
          }
        })
  }

  /**Getter che definisce se siamo in modalità di modifica */
  public get isEditing(): boolean {
    if (this.layer && this.layer.id) {
      return true;
    }

    return false;
  }

  /**Getter del titolo del layer nel modale di editing */
  public get layerModalTitle(): string {
    if (((!this.layerForm) || (!this.layerForm.value)) || (!this.layerForm.value.name)) {
      return "Nuovo layer";
    }

    return this.layerForm.value.name;
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

  /**Riferimento al form di creazione/modifica layer */
  @ViewChild(NgForm) public layerForm!: NgForm;
  /**Riferimento al popup di cancellazione elemento */
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

  /**
   * Costruttore per LayersListComponent
   * @param router {Router} servizi per la navigazione fra le viste
   * @param activeRoute {ActivatedRoute} fornisce l'accesso alle informazioni di una route associata con un componente caricato in un outlet
   * @param loaderService {LoaderService} servizi per la gestione del segnale di caricamento
   * @param layerService {LayerService} servizi relativi ai layer
   * @param messageService {MessageService} servizi per la gestione dei messaggi
   * @param msgConfService {MessageConfigurationService} servizi per la configurazione dei messaggi per messageService
   * @param confirmationService {ConfirmationService} servizi per i messaggi di conferma
   */
  constructor(
    private router: Router,
    private activeRoute: ActivatedRoute,
    private loaderService: LoaderService,
    private layerService: LayerService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
    private confirmationService: ConfirmationService) { }

  /**Metodo dell'interfaccia OnInit nel quale sono recuperate le informazioni iniziali del componente */
  ngOnInit(): void {
    this.loadData();
  }

  /**Metodo dell'interfaccia OnDestroy nel quale vengono chiusi eventuali swal (che gestiscono i popup) */
  ngOnDestroy(): void {
    Swal.close();
  }

  /**
   * Metodo che sottomette i dati del form nel popup per la creazione o modifica di un layer
   * @param form {NgForm} form con i dati del layer
   * @returns {void}
   */
  onSubmitLayerModal(form: NgForm): void {
    if (this.layerForm.invalid) { //caso nel quale il form non è valido
      return this.saveWithFormErrors();
    }

    this.save();
  }

  /**
   * Metodo che visualizza il modale di conferma cancellazione di un layer
   * @param layer {Layer} layer da eliminare
   */
  showDeleteLayerModal(layer: Layer) {
    let confirmMsg = 'Stai per cancellare il layer \'' + layer.name + '\'';

    this.popupDeleteItem.confirmMessage = confirmMsg;
    this.popupDeleteItem.showDeleteConfirm(() => this.delete(layer.id!, (layer.name || "")), layer.id, layer.name);
  }

  /**
   * Metodo che visualizza il modale di modifica di un layer
   * @param layer {Layer} layer da modificare
   */
  showEditLayerModal(layer: Layer) {
    this.resetForm();
    this.layer = JSON.parse(JSON.stringify(layer)); //inizializza il layer di lavorazione con i valori del layer passato come argomento

    $('#layerModal').modal('show');
  }

  /**Metodo che visualizza il modale di modifica di un layer per un nuovo inserimento */
  showLayerModal() {
    this.resetForm();

    $('#layerModal').modal('show');
  }

  /**
   * Metodo che naviga sulla vista di dettaglio del layer per gestirne le feature
   * @param layer {Layer} layer aggiunto
   */
  viewLayerFeatures(layer: Layer) {
    this.router.navigate([layer.id], { relativeTo: this.activeRoute });
  }

  /**
   * Metodo privato che recupera l'indice di un layer nella lista a partire dall'identificativo
   * @param id {number} identificativo numerico del layer
   * @returns {number} indice del layer nella lista
   */
  private findIndexById(id: number): number {
    return this.layers.findIndex(l => l.id === this.layer.id)
  }

  /**Metodo privato per il recupero delle informazioni iniziali del componente */
  private loadData() {
    this.loaderService.show();
    this.layerService.retrieveLayers() //recupera l'elenco dei layer esistenti
      .subscribe({
        next: (data: Layer[]) => {
          this.layers = data;
          this.loaderService.hide();
        }
      });
  }

  /**Metodo privato che crea un nuovo oggetto layer e inizializza il form dei layer */
  private resetForm() {
    this.layer = new Layer();
    this.layerForm.form.markAsUntouched();
    this.layerForm.form.markAsPristine();
  }

  /**
   * Metodo privato che richiede il salvataggio del form di layer
   * @returns {void}
   */
  private save(): void {
    let errorMsg = "Errore durante il salvataggio!";
    if (!this.layer) { //caso in cui non sia presente il layer nuovo/modificato
      this.messageService.add(this.msgConfService.generateErrorMessageConfig(errorMsg));
      return;
    }

    //bug colorpicker required fix
    if(this.layer.color === undefined
      || this.layer.color === null
      || this.layer.color.trim().length <= 0 )
      {
        this.messageService.add(this.msgConfService.generateErrorMessageConfig(errorMsg));
        return;
      }

    let successMsg = "Operazione effettuata con successo";

    this.loaderService.show();

    if (this.isEditing && this.layer.name?.trim() && this.layer.id) { //caso di layer in modifica
      successMsg = "Layer modificato con successo";

      this.layerService
        .updateLayer(this.layer)
        .subscribe({
          next: (layer) => {
            $('#layerModal').modal('hide'); //nasconde il modale contenente il form di modifica layer

            this.layers[this.findIndexById(layer.id!)] = { ...layer }; // NON SERVE PIU' SECONDO ME

            this.loaderService.hide();
            this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
            this.saveLayerCompleted();
            this.loadData(); //recupera i dati aggiornati?
          },
          error: (err: string) => {
            $('#layerModal').modal('hide');
            this.loaderService.hide();
            this.messageService.add(this.msgConfService.generateErrorMessageConfig(errorMsg));
            this.saveLayerCompleted();
          }
        });
    }
    else { //caso della creazione di un nuovo layer
      successMsg = "Layer creato con successo";

      this.layerService
        .createLayer(this.layer)
        .subscribe({
          next: (layer) => {
            $('#layerModal').modal('hide');

            this.layer = layer; // NON SERVE PIU' SECONDO ME
            this.layers.push(this.layer); // NON SERVE PIU' SECONDO ME

            this.loaderService.hide();
            this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
            this.saveLayerCompleted();

            this.viewLayerFeatures(layer);
          },
          error: (err: string) => {
            $('#layerModal').modal('hide');
            this.loaderService.hide();
            this.messageService.add(this.msgConfService.generateErrorMessageConfig(errorMsg));
            this.saveLayerCompleted();
          }
        });
    }
  }

  /**Metodo privato che segna tutti i campi come toccati (evidenziando gli errori) nel caso in cui si tenti il salvataggio di un form non valido */
  private saveWithFormErrors(): void {
    this.layerForm.form.markAllAsTouched();
  }

  //TODO verificare perché è stato inserito il metodo
  /**Metodo privato che aggiorna la lista dei layer con una copia di sé stessa */
  private saveLayerCompleted() {
    this.layers = [...this.layers];
  }

  /**
   * Metodo privato che visualizza il popup di errore
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
   * Metodo privato che visualizza il popup di operazione in corso
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
