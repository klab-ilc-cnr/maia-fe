import { LoaderService } from 'src/app/services/loader.service';
import { Tagset } from './../../../models/tagset/tagset';
import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { TagsetService } from 'src/app/services/tagset.service';
import Swal from 'sweetalert2';
import { PopupDeleteItemComponent } from 'src/app/controllers/popup/popup-delete-item/popup-delete-item.component';

/**Componente della lista dei tagset */
@Component({
  selector: 'app-tagsets-list',
  templateUrl: './tagsets-list.component.html',
  styleUrls: ['./tagsets-list.component.scss']
})
export class TagsetsListComponent implements OnInit {
  /**
   * Esegue la rimozione di un tagset
   * @param id {number} identificativo numerico del tagset
   * @param name {string} nome del tagset
   */
  private delete = (id: number, name: string): void => {
    this.showOperationInProgress('Sto cancellando');

    let errorMsg = 'Errore nell\'eliminare il tagset \'' + name + '\'';
    let failMsg = 'Il tagset \'' + name + '\' è parte di una feature';
    let successMsg = 'Tagset \'' + name + '\' eliminato con successo';

    this.tagsetService
        .delete(id)
        .subscribe({
          next: (result) => {
            if (result) {
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
    if (this.tagsetModel && this.tagsetModel.id) {
      return true;
    }

    return false;
  }

  /**Lista dei tagset */
  tagsets: Tagset[] = [];
  /**Tagset in lavorazione */
  tagsetModel: Tagset = new Tagset();

  /**Riferimento al form di creazione/modifica tagset */
  @ViewChild(NgForm) public tagsetForm!: NgForm;
  /**Riferimento al popup di cancellazione elemento */
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

  /**
   * Costruttore per TagsetsListComponent
   * @param loaderService {LoaderService} servizi per la gestione del segnale di caricamento
   * @param tagsetService {TagsetService} servizi relativi ai tagset
   * @param messageService {MessageService} servizi per la gestione dei messaggi
   * @param msgConfService {MessageConfigurationService} servizi per la configurazione dei messaggi per messageService
   * @param activeRoute {ActivatedRoute} fornisce l'accesso alle informazioni di una route associata con un componente caricato in un outlet
   * @param router {Router} servizi per la navigazione fra le viste
   */
  constructor(
    private loaderService: LoaderService,
    private tagsetService: TagsetService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
    private activeRoute: ActivatedRoute,
    private router: Router
  ) { }

  /**Metodo dell'interfaccia OnInit, utilizzato per il caricamento dei dati iniziali del componente */
  ngOnInit(): void {
    this.loadData();
  }

  /**Metodo dell'interfaccia OnDestroy, utilizzato per chiudere eventuali popup swal aperti */
  ngOnDestroy(): void {
    Swal.close();
  }

  /**
   * Metodo che esegue la navigazione su un tagset specifico
   * @param event {any} evento qualsiasi
   */
  navigateTo(event: any) { //TODO non è richiamato né internamente, né nel template, verificare se serve la rimozione
    const item = event.data;
    this.router.navigate([item.id], { relativeTo: this.activeRoute });
  }

  /**Metodo che esegue la navigazione su un "nuovo" tagset */
  onNew(): void {
    this.router.navigate(["new"], { relativeTo: this.activeRoute });
	}

  /**
   * Metodo che esegue la navigazione di un tagset per la sua modifica
   * @param tagset {Tagset} tagset selezionato
   */
  onEdit(tagset: Tagset): void {
    this.router.navigate([tagset.id], { relativeTo: this.activeRoute });
  }

  /**
   * Metodo che visualizza il popup di conferma cancellazione ed eventualmente richiama proprietà di cancellazione
   * @param tagset {Tagset} tagset selezionato
   */
  onDelete(tagset: Tagset): void {
    let confirmMsg = 'Stai per cancellare il tagset \'' + tagset.name + '\'';

    this.popupDeleteItem.confirmMessage = confirmMsg;
    this.popupDeleteItem.showDeleteConfirm(() => this.delete(tagset.id, (tagset.name || "")), tagset.id, tagset.name);
  }

  /**
   * @private
   * Metodo che esegue il caricamento dei dati del componente
   */
  private loadData() {
    this.loaderService.show();

    this.tagsetService.retrieve()
      .subscribe({
        next: (data) => {
          this.tagsets = [...data];
          this.loaderService.hide();
        }
      })
  }

  /**
   * @private
   * Metodo che visualizza il popup di operazione fallita
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
   * @private
   * Metodo che visualizza il popup di operazione in corso
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
