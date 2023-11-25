import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Observable, take } from 'rxjs';
import { PopupDeleteItemComponent } from 'src/app/controllers/popup/popup-delete-item/popup-delete-item.component';
import { LexiconService } from 'src/app/services/lexicon.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { FormItem } from './base-lex-entity-relations.component';

export type SuggestionEntry = {
  relationshipLabel: string,
  relationshipURI: string,
};

interface AutoCompleteCompleteEvent {
  originalEvent: Event;
  query: string;
}

@Component({template: '<div></div>'})
export abstract class BaseLexEntitySemanticInputComponent implements OnInit {

  @Input() control!: FormItem;
  @Input() form!: FormGroup;
  @Input() formItems!: FormItem[];

  /**Riferimento al popup di conferma cancellazione */
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

  selectedSuggestion?: SuggestionEntry;
  suggestions: SuggestionEntry[] = [];

  constructor(
    protected lexiconService: LexiconService,
    protected messageService: MessageService,
    protected msgConfService: MessageConfigurationService,
  ) {}

  ngOnInit(): void {
    const { destinationLabel, destinationURI } = this.control;
    this.selectedSuggestion = {
      relationshipLabel: destinationLabel,
      relationshipURI: destinationURI,
    };
  }

  abstract updateRelationship(senseListItem: SuggestionEntry, control: FormItem): Observable<string>;
  abstract removeRelationship(control: FormItem): Observable<string>;
  abstract getSuggestions(text: string): Observable<SuggestionEntry[]>;

  onSearchForSuggestions($event: AutoCompleteCompleteEvent) {
    this.getSuggestions($event.query).pipe(
      take(1)
    ).subscribe((suggestions: SuggestionEntry[]) => {
      this.suggestions = suggestions;
    });
  }

  onSelectSuggestionUpdateRelationship(suggestion: SuggestionEntry, control: FormItem) {

    this.updateRelationship(suggestion, control).pipe(
      take(1)
    ).subscribe({
      next: () => {
        this.selectedSuggestion = suggestion;
        control.destinationURI = suggestion.relationshipURI;
        const message = this.msgConfService.generateSuccessMessageConfig(`${control.relationshipLabel} updated`);
        this.messageService.add(message);
      },
      error: (err) => {
        console.error(err);
        const message = this.msgConfService.generateErrorMessageConfig(`${err.name}: ${err.error}`);
        this.messageService.add(message);
      }
    });
  }

  private removeFormItem(relationshipLabel: string, itemID: number): void {
    this.form.removeControl(`${itemID}`);
    const index = this.formItems.findIndex(e => e.itemID === itemID);
    this.formItems.splice(index, 1);
    const message = this.msgConfService.generateSuccessMessageConfig(`${relationshipLabel} removed`);
    this.messageService.add(message);
  }

  /**
   * Metodo che gestisce la rimozione di una relazione
   * @param control {FormItem} item del form da rimuovere
   */
  onRemoveRelationship(control: FormItem): void {

    const {relationshipLabel, itemID} = control;
    const confirmMsg = `Are you sure to remove "${relationshipLabel}"?`;
    this.popupDeleteItem.confirmMessage = confirmMsg;

    this.popupDeleteItem.showDeleteConfirmSimple(() => {
      if (!this.selectedSuggestion) return;

      this.removeRelationship(control).pipe(
        take(1)
      ).subscribe({
        next: () => {
          this.removeFormItem(relationshipLabel, itemID);
        },
        error: (err) => {
          console.error(err);
          const message = this.msgConfService.generateErrorMessageConfig(`${err.name}: ${err.error}`);
          this.messageService.add(message);
        }
      });
    });
  }

}
