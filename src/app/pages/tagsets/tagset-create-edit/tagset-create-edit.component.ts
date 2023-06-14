import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Observable, Subject, takeUntil } from 'rxjs';
import { PopupDeleteItemComponent } from 'src/app/controllers/popup/popup-delete-item/popup-delete-item.component';
import { Tagset } from 'src/app/models/tagset/tagset';
import { TagsetValue } from 'src/app/models/tagset/tagset-value';
import { TTagset } from 'src/app/models/texto/t-tagset';
import { LoaderService } from 'src/app/services/loader.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { TagsetStateService } from 'src/app/services/tagset-state.service';
import { TagsetService } from 'src/app/services/tagset.service';
import Swal from 'sweetalert2';

/**Variabile globale (jQuery?) */
declare var $: any;

/**Componente per la creazione/modifica di un tagset */
@Component({
  selector: 'app-tagset-create-edit',
  templateUrl: './tagset-create-edit.component.html',
  styleUrls: ['./tagset-create-edit.component.scss'],
  providers: [TagsetStateService],
})
export class TagsetCreateEditComponent implements OnInit, OnDestroy {
  private readonly unsubscribe$ = new Subject();
  ttagset!: TTagset;
  ttagsetItems$ = this.tagsetState.tagsetItems$;
  /**
   * @private
   * Effettua la rimozione di un tagset
   * @param id {number} identificativo numerico di un tagset
   * @param name {string} nome del tagset
   */
  private deleteTagset = (id: number, name: string): void => {
    this.showOperationInProgress('Sto cancellando');

    let errorMsg = 'Errore nell\'eliminare il tagset \'' + name + '\'';
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
              this.showOperationFailed('Cancellazione Fallita: ' + errorMsg);
            }
            this.backToList();
          },
          error: () => {
            this.showOperationFailed('Cancellazione Fallita: ' + errorMsg);
          }
        })
  }

  /**
   * @private
   * Effettua la rimozione di un valore del tagset
   * @param name {string} nome del valore
   * @returns {void}
   */
  private deleteValue = (name: string): void => {
    this.showOperationInProgress('Sto cancellando');

    let errorMsg = 'Errore nel rimuovere il valore \'' + name + '\'';
    let successMsg = 'Valore \'' + name + '\' rimosso con successo';

    let i = this.tagsetModel.values!.findIndex((item: any) => item.originalName == name);

    if (!this.tagsetModel.values || i < 0) {
      this.showOperationFailed('Cancellazione Fallita: ' + errorMsg);
      Swal.close();
      return;
    }

    this.areTagsetValuesChanged = true;

    this.tagsetModel.values.splice(i, 1);
    Swal.close();
  }

  /**Getter che restituisce se siamo in modalità di modifica */
  public get isEditing(): boolean {
    if (this.tagsetModel && this.tagsetModel.id) {
      return true;
    }

    return false;
  }

  /**Getter che restituisce se il valore del tagset è in modalità di modifica */
  public get isTagsetValueEditing(): boolean {
    if (this.tagsetValueModel && this.tagsetValueModel.originalName && this.tagsetValueModel.name) {
      return true;
    }

    return false;
  }

  /**Getter che restituisce il nome del valore del tagset */
  public get tagsetValueModalTitle(): string {
    if (((!this.tagsetValueForm) || (!this.tagsetValueForm.value)) || (!this.tagsetValueForm.value.tvName)) {
      return "Nuovo valore del tagset";
    }

    return this.tagsetValueForm.value.tvName;
  }

  /**Getter che restituisce il nome del tagset in lavorazione */
  public get title(): string {
    if (((!this.tagsetForm) || (!this.tagsetForm.value)) || (!this.tagsetForm.value.name)) {
      return "Nuovo tagset";
    }

    return this.tagsetForm.value.name;
  }

  /**Definisce se un tagset può essere cancellato */
  canBeDeleted: boolean = false;
  /**Identificativo per un nuovo tagset */
  newId: string = "new"
  /**Tagset in lavorazione */
  tagsetModel: Tagset = new Tagset();
  /**Valore del tagset in lavorazione */
  tagsetValueModel: TagsetValue = new TagsetValue();
  /**Definisce se i valori di un tagset sono stati modificati */
  areTagsetValuesChanged: boolean = false;

  /**Riferimento al popup di conferma cancellazione */
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;
  /**Riferimento al form di inserimento/modifica tagset */
  @ViewChild("tagsetForm") public tagsetForm!: NgForm;
  /**Riferimento al form di inserimento/modifica valore di un tagset */
  @ViewChild("tagsetValueForm") public tagsetValueForm!: NgForm;

  /**
   * Costruttore per TagsetCreateEditComponent
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
    private router: Router,
    private tagsetState: TagsetStateService,
  ) {
    this.tagsetState.tagset$.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(tagset => {
      this.ttagset = tagset;
    });
  }

  /**Metodo dell'interfaccia OnInit, utilizzato per decidere se tornare alla pagina della lista, caricare i dati del tagset o iniziare un nuovo inserimento */
  ngOnInit(): void {
    this.activeRoute.paramMap.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe({
      next: (params) => {
        const id = params.get('id');

        if (id == null) {
          this.backToList();
        }
        else if (id != this.newId) {
          // this.loadData(Number.parseInt(id));
          this.tagsetState.retrieveTagset.next(+id);
          this.tagsetState.retrieveTagsetItems.next(+id);
        }
        else {
          this.tagsetModel.values = [];
        }
      }
    });
  }

  /**Metodo dell'interfaccia OnDestroy, utilizzato per chiudere eventuali popup swal */
  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
    Swal.close();
  }

  /**Metodo che esegue la navigazione sulla lista dei tagset */
  backToList() {
    this.router.navigate(["../"], { relativeTo: this.activeRoute });
  }

  /**
   * Metodo che verifica se un tagset è cancellabile
   * @param id {number} identificativo numerico del tagset
   * @returns {Observable<boolean>} observable che definisce se un tagset può essere cancellato o meno
   */
  retrieveCanBeDeleted(id: number): Observable<boolean> {
    return this.tagsetService.retrieveCanBeDeleted(id);
  }

  /**
   * Metodo che visualizza il modale di conferma della cancellazione di un tagset ed eventualmente richiama la proprietà di cancellazione
   * @param tagset {Tagset} tagset da rimuovere
   */
  showDeleteModal(tagset: Tagset): void {
    let confirmMsg = 'Stai per cancellare il tagset \'' + tagset.name + '\'';

    this.popupDeleteItem.confirmMessage = confirmMsg;
    this.popupDeleteItem.showDeleteConfirm(() => this.deleteTagset(tagset.id, (tagset.name || "")), tagset.id, tagset.name);
  }

  /**
   * Metodo che visualizza il modale di conferma della cancellazione di un valore di un tagset ed eventualmente richiama la proprietà di cancellazione
   * @param value {TagsetValue} valore di un tagset
   */
  showDeleteValueModal(value: TagsetValue): void {
    let confirmMsg = 'Stai per cancellare il valore \'' + value.originalName + '\'';

    this.popupDeleteItem.confirmMessage = confirmMsg;
    this.popupDeleteItem.showDeleteConfirm(() => this.deleteValue((value.originalName || "")), value.originalName);
  }

  /**
   * Metodo che visualizza il modale di modifica di un valore di un tagset
   * @param value {TagsetValue} valore di un tagset
   */
  showEditValueModal(value: TagsetValue): void {
    this.resetForm();
    this.tagsetValueModel = JSON.parse(JSON.stringify(value));
    $('#tagsetValueModal').modal('show');
  }

  /**Metodo che visualizza il modale di inserimento di un nuovo valore del tagset */
  showTagsetValueModal() {
    this.resetForm();
    $('#tagsetValueModal').modal('show');
  }

  /**
   * Metodo che sottomette il salvataggio del form del tagset
   * @param form {NgForm} form del tagset
   * @returns {void}
   */
  onSubmitTagsetForm(form: NgForm): void {
    if (this.tagsetForm.invalid) {
      return this.saveWithFormErrors();
    }

    this.save();
  }

  /**
   * Metodo che sottomette il salvataggio del form del valore del tagset
   * @param form {NgForm} form del valore del tagset
   * @returns {void}
   */
  onSubmitTagsetValueModal(form: NgForm): void {
    if (this.tagsetValueForm.invalid) {
      return this.saveTagsetValueWithFormErrors();
    }

    this.saveTagsetValue();
  }

  /**
   * @private
   * Metodo che recupera un valore del tagset utilizzando il nome
   * @param name {string} nome del valore del tagset da verificare
   * @returns {TagsetValue|undefined} un valore del tagset se già esiste con quel nome
   */
  private findTagsetValueByName(name: string) {
    let v = this.tagsetModel.values?.find((item: any) => item.name == name)

    return v;
  }

  /**
   * @private
   * Metodo che carica i dati di un tagset
   * @param id {number} identificativo numerico del tagset
   */
  private loadData(id: number) {
    this.loaderService.show();
    this.tagsetService.retrieveById(id)
      .subscribe({
        next: (tagset) => {
          var model = Object.assign(new Tagset(), tagset);
          this.tagsetModel = model;

          if (!this.tagsetModel.values) {
            this.tagsetModel.values = [];
          }

          let valuesCopy = JSON.parse(JSON.stringify(this.tagsetModel.values));

          this.tagsetModel.values = [];

          valuesCopy.forEach((v: any) => {
            this.tagsetModel.values?.push({ ...v, originalName: v.name })
          })

          this.loaderService.hide();
        }
      })

      this.retrieveCanBeDeleted(id)
        .subscribe({
          next: (canBeDeleted) => this.canBeDeleted = canBeDeleted
        })
  }

  /**
   * @private
   * Metodo che resetta il valore del tagset in lavorazione e ne reinizializza il form
   */
  private resetForm() {
    this.tagsetValueModel = new TagsetValue();
    this.tagsetValueForm.form.markAsUntouched();
    this.tagsetValueForm.form.markAsPristine();
  }

  /**
   * @private
   * Metodo che esegue il salvataggio del form del tagset
   * @returns {void}
   */
  private save(): void {
    let errorMsg = "Errore durante il salvataggio!";
    if (!this.tagsetModel) {
      this.messageService.add(this.msgConfService.generateErrorMessageConfig(errorMsg));
      return;
    }

    let successMsg = "Operazione effettuata con successo";
    let apiCall;
    if (this.isEditing) {
      successMsg = "Tagset modificato con successo";
      apiCall = this.tagsetService.update(this.tagsetModel);
    }
    else {
      successMsg = "Tagset creato con successo";
      // this.tagsetService.createTagset(<TTagset>{name: this.tagsetModel.name}).pipe(
      //   takeUntil(this.unsubscribe$),
      // ).subscribe(() => {
      //   this.backToList();
      // })
    }

    // this.loaderService.show();
    // apiCall.subscribe({
    //   next: () => {
    //     this.loaderService.hide();
    //     this.backToList();
    //     this.messageService.add(this.msgConfService.generateSuccessMessageConfig(successMsg));
    //   },
    //   error: (err) => {
    //     this.loaderService.hide();

    //     if (err.status == 418) {
    //       errorMsg == "Esiste già un tagset con questo nome!"
    //     }

    //     this.messageService.add(this.msgConfService.generateErrorMessageConfig(errorMsg));
    //   }
    // });
  }

  /**
   * @private
   * Metodo che richiama il salvataggio del form del valore del tagset
   * @returns {void}
   */
  private saveTagsetValue(): void {
    if (!this.tagsetValueModel) {
      return;
    }

    if (this.isTagsetValueEditing) { //caso di valore del tagset in edit
      let i = this.tagsetModel.values!.findIndex((item: any) => item.originalName == this.tagsetValueModel.originalName);

      if (!this.tagsetModel.values || i < 0) {
        this.messageService.add(this.msgConfService.generateErrorMessageConfig("Non esiste un valore del tagset con questo nome"));
        $('#tagsetValueModal').modal('hide');
        return;
      }

      this.tagsetValueModel.originalName = this.tagsetValueModel.name;

      this.areTagsetValuesChanged = true;
      this.tagsetModel.values[i] = {...this.tagsetValueModel};
    }
    else { //caso di nuovo valore del tagset
      let v = this.findTagsetValueByName(this.tagsetValueModel.name || "");

      if (v) { //caso di nome del valore del tagset già presente
        this.messageService.add(this.msgConfService.generateErrorMessageConfig("Esiste già un valore del tagset con questo nome"));
        $('#tagsetValueModal').modal('hide');
        return;
      }

      this.tagsetValueModel.originalName = this.tagsetValueModel.name;

      this.areTagsetValuesChanged = true;
      this.tagsetModel.values?.push(JSON.parse(JSON.stringify(this.tagsetValueModel)));
    }

    $('#tagsetValueModal').modal('hide');
  }

  /**
   * @private
   * Metodo che marca tutti i campi del form come touched per segnalarne eventuali errori
   */
  private saveWithFormErrors(): void {
    this.tagsetForm.form.markAllAsTouched();
  }

  /**
   * @private
   * Metodo che marca tutti i campi del form del valore del tagset come touched per segnalarne eventuali errori
   */
  private saveTagsetValueWithFormErrors(): void {
    this.tagsetValueForm.form.markAllAsTouched();
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
