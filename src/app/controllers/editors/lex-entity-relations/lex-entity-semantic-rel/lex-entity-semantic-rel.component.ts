import { HttpErrorResponse } from '@angular/common/http';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { take } from 'rxjs';
import { PopupDeleteItemComponent } from 'src/app/controllers/popup/popup-delete-item/popup-delete-item.component';
import { LexiconService } from 'src/app/services/lexicon.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { BaseLexEntityRelationsStrategy, SuggestionEntry } from '../base-lex-entity-relations/base-lex-entity-relations-strategy';
import { FormItem } from '../base-lex-entity-relations/base-lex-entity-relations.component';

interface AutoCompleteCompleteEvent {
  originalEvent: Event;
  query: string;
}

@Component({
  selector: 'app-lex-entity-semantic-rel',
  templateUrl: './lex-entity-semantic-rel.component.html',
  styleUrls: ['./lex-entity-semantic-rel.component.scss']
})
export class LexEntitySemanticRelComponent implements OnInit {

  @Input() control!: FormItem;
  @Input() form!: FormGroup;
  @Input() formItems!: FormItem[];
  @Input() strategy!: BaseLexEntityRelationsStrategy;

  /**Riferimento al popup di conferma cancellazione */
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

  selectedSuggestion?: SuggestionEntry;
  suggestions: SuggestionEntry[] = [];

  constructor(
    protected lexiconService: LexiconService,
    protected messageService: MessageService,
    protected msgConfService: MessageConfigurationService,
  ) { }

  private showHttpError(err: HttpErrorResponse): void {
    console.error(err);
    const message = this.msgConfService.generateErrorMessageConfig(`${err.name}: ${err.error.message}`);
    this.messageService.add(message);
  }

  ngOnInit(): void {
    const { destinationLabel, destinationURI } = this.control;
    this.selectedSuggestion = {
      relationshipLabel: destinationLabel,
      relationshipURI: destinationURI,
    };
  }

  onSearchForSuggestions($event: AutoCompleteCompleteEvent) {
    this.strategy.getSuggestions($event.query).pipe(
      take(1)
    ).subscribe((suggestions: SuggestionEntry[]) => {
      this.suggestions = suggestions;
    });
  }

  onSelectSuggestionUpdateRelationship(suggestion: SuggestionEntry, control: FormItem) {

    this.strategy.updateRelationship(control, suggestion).pipe(
      take(1)
    ).subscribe({
      next: () => {
        this.selectedSuggestion = suggestion;
        control.destinationURI = suggestion.relationshipURI;
        const message = this.msgConfService.generateSuccessMessageConfig(`${control.relationshipLabel} updated`);
        this.messageService.add(message);
      },
      error: this.showHttpError
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

    const { relationshipLabel, itemID } = control;
    const confirmMsg = `Are you sure to remove "${relationshipLabel}"?`;
    this.popupDeleteItem.confirmMessage = confirmMsg;

    this.popupDeleteItem.showDeleteConfirmSimple(() => {
      this.strategy.removeRelationship(control).pipe(
        take(1)
      ).subscribe({
        next: () => {
          this.removeFormItem(relationshipLabel, itemID);
        },
        error: this.showHttpError
      });
    });
  }

}
