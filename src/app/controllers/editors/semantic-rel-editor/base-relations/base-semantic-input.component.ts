import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Observable, map, take } from 'rxjs';
import { PopupDeleteItemComponent } from 'src/app/controllers/popup/popup-delete-item/popup-delete-item.component';
import { formTypeEnum } from 'src/app/models/lexicon/lexical-entry-request.model';
import { SenseCore, SenseListItem } from 'src/app/models/lexicon/lexical-entry.model';
import { LexiconService } from 'src/app/services/lexicon.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { FilteredSenseModel } from 'src/app/models/lexicon/filtered-sense.model';
import { FormItem } from '../base-relations/base-relations.component';

export type SuggestionItem = {
  relationshipLabel: string,
  senseListItem?: SenseListItem,
};

interface AutoCompleteCompleteEvent {
  originalEvent: Event;
  query: string;
}

@Component({template: '<div></div>'})
export abstract class BaseSemanticInputComponent implements OnInit {

  @Input() control!: FormItem;
  @Input() form!: FormGroup;
  @Input() formItems!: FormItem[];
  @Input() senseEntry!: SenseCore;

  /**Riferimento al popup di conferma cancellazione */
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

  selectedSuggestion?: SuggestionItem;
  suggestions: SuggestionItem[] = [];

  constructor(
    protected lexiconService: LexiconService,
    protected messageService: MessageService,
    protected msgConfService: MessageConfigurationService,
  ) {}

  ngOnInit(): void {
    this.selectedSuggestion = {
      relationshipLabel: this.control.destinationLabel,
    }
  }

  private buildRelationshipLabel(item: SenseListItem): string {
    return `${item.lemma} - ${item.label || 'no def'}`;
  }

  abstract updateRelationship(senseListItem: SenseListItem | undefined, control: FormItem): Observable<string>;
  abstract removeRelationship(control: FormItem): Observable<string>;

  onSearchSense($event: AutoCompleteCompleteEvent) {
    this.lexiconService.getFilteredSenses({
      text: $event.query,
      searchMode: "startsWith",
      formType: formTypeEnum.flexed,
      status: "",
      type: "",
      field: "",
      pos: "",
      author: "",
      lang: "",
      offset: 0,
      limit: 500,
    }).pipe(
      map((resp: FilteredSenseModel): SenseListItem[] => resp.list),
      take(1),
    ).subscribe((result: SenseListItem[]) => {
      this.suggestions = result.map((item: SenseListItem): SuggestionItem => {
        return {relationshipLabel: this.buildRelationshipLabel(item), senseListItem: item};
      });
    });
  }

  onSelectSenseUpdateRelationship(senseDisplayItem: SuggestionItem, control: FormItem) {

    this.updateRelationship(senseDisplayItem.senseListItem, control).pipe(
      take(1)
    ).subscribe({
      next: () => {
        this.selectedSuggestion = senseDisplayItem;
        control.destinationURI = senseDisplayItem.senseListItem?.sense || '';
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
