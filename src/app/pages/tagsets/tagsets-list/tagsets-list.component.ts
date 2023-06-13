import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PopupDeleteItemComponent } from 'src/app/controllers/popup/popup-delete-item/popup-delete-item.component';
import { TTagset } from 'src/app/models/texto/t-tagset';
import { TagsetStateService } from 'src/app/services/tagset-state.service';

/**Componente della lista dei tagset */
@Component({
  selector: 'app-tagsets-list',
  templateUrl: './tagsets-list.component.html',
  styleUrls: ['./tagsets-list.component.scss'],
  providers: [TagsetStateService]
})
export class TagsetsListComponent {
  tagsets$ = this.tagsetState.tagsets$;
  tagsetTotal$ = this.tagsetState.tagsetTotal$;

  /**
   * Esegue la rimozione di un tagset
   * @param id {number} identificativo numerico del tagset
   */
  private delete = (id: number): void => {
    this.tagsetState.removeTagset.next(id);
  }

  /**Riferimento al popup di cancellazione elemento */
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

  /**
   * Costruttore per TagsetsListComponent
   * @param activeRoute {ActivatedRoute} fornisce l'accesso alle informazioni di una route associata con un componente caricato in un outlet
   * @param router {Router} servizi per la navigazione fra le viste
   */
  constructor(
    private activeRoute: ActivatedRoute,
    private router: Router,
    private tagsetState: TagsetStateService,
  ) { }

  /**Metodo che esegue la navigazione su un "nuovo" tagset */
  onNew(): void {
    this.router.navigate(["new"], { relativeTo: this.activeRoute });
  }

  /**
   * Metodo che esegue la navigazione di un tagset per la sua modifica
   * @param tagset {Tagset} tagset selezionato
   */
  onEdit(tagset: TTagset): void {
    this.router.navigate([tagset.id], { relativeTo: this.activeRoute });
  }

  /**
   * Metodo che visualizza il popup di conferma cancellazione ed eventualmente richiama proprietà di cancellazione
   * @param tagset {TTagset} tagset selezionato
   */
  onDelete(tagset: TTagset): void {
    const confirmMsg = `You are about to delete the tagset "${tagset.name}"`;

    this.popupDeleteItem.confirmMessage = confirmMsg;
    this.popupDeleteItem.showDeleteConfirm(() => this.delete(tagset.id!), tagset.id, tagset.name);
  }
}
