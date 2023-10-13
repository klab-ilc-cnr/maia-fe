import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { map, take } from 'rxjs';
import { PopupDeleteItemComponent } from 'src/app/controllers/popup/popup-delete-item/popup-delete-item.component';
import { formTypeEnum } from 'src/app/models/lexicon/lexical-entry-request.model';
import { SenseCore, SenseListItem } from 'src/app/models/lexicon/lexical-entry.model';
import { LINGUISTIC_RELATION_TYPE, LinguisticRelationUpdater } from 'src/app/models/lexicon/lexicon-updater';
import { LexiconService } from 'src/app/services/lexicon.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { FilteredSenseModel } from 'src/app/models/lexicon/filtered-sense.model';
import { FormItem } from '../../base-relations/base-relations.component';

type SuggestionItem = {
  relationshipLabel: string,
  senseListItem?: SenseListItem,
};

interface AutoCompleteCompleteEvent {
  originalEvent: Event;
  query: string;
}

@Component({
  selector: 'app-semantic-rel-direct',
  templateUrl: './semantic-rel-direct.component.html',
  styleUrls: ['./semantic-rel-direct.component.scss']
})
export class SemanticRelDirectComponent implements OnInit {

  @Input() control!: FormItem;
  @Input() form!: FormGroup;
  @Input() formItems!: FormItem[];
  @Input() senseEntry!: SenseCore;

  /**Riferimento al popup di conferma cancellazione */
  @ViewChild("popupDeleteItem") public popupDeleteItem!: PopupDeleteItemComponent;

  selectedSuggestion?: SuggestionItem;
  suggestions: SuggestionItem[] = [];

  constructor(
    private lexiconService: LexiconService,
    private messageService: MessageService,
    private msgConfService: MessageConfigurationService,
  ) {}

  ngOnInit(): void {
    this.selectedSuggestion = {
      relationshipLabel: this.control.destinationLabel,
    }
  }

  private buildRelationshipLabel(item: SenseListItem): string {
    return `${item.lemma} - ${item.label || 'no def'}`;
  }

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
    const updater : LinguisticRelationUpdater = {
      type: LINGUISTIC_RELATION_TYPE.SENSE_REL,
      relation: control.relationshipURI,
      currentValue: control.destinationURI,
      value: senseDisplayItem.senseListItem?.sense || '',
    };

    this.lexiconService.updateLinguisticRelation(this.senseEntry.sense, updater).pipe(
      take(1)
    ).subscribe(
      () => {
        this.selectedSuggestion = senseDisplayItem;
        control.destinationURI = senseDisplayItem.senseListItem?.sense || '';
        const message = this.msgConfService.generateSuccessMessageConfig(`${control.relationshipLabel} updated`);
        this.messageService.add(message);
      },
      (err) => {
        console.error(err);
        const message = this.msgConfService.generateErrorMessageConfig(`${err.name}: ${err.error}`);
        this.messageService.add(message);
      }
    );
  }

  /**
   * Metodo che gestisce la rimozione di una relazione
   * @param control {FormItem} item del form da rimuovere
   */
  onRemoveRelationship(control: FormItem) {
    const {relationshipLabel, destinationURI, relationshipURI, itemID} = control;
    const confirmMsg = `Are you sure to remove "${relationshipLabel}"?`;
    this.popupDeleteItem.confirmMessage = confirmMsg;
    this.popupDeleteItem.showDeleteConfirmSimple(() => {
      if (!this.selectedSuggestion) return;
      const updater = {relation: relationshipURI, value: destinationURI};
      this.lexiconService.deleteRelation(this.senseEntry.sense, updater).pipe(
        take(1)
      ).subscribe(
        () => {
          this.form.removeControl(`${itemID}`);
          const index = this.formItems.findIndex(e => e.itemID === itemID);
          this.formItems.splice(index, 1);
          const message = this.msgConfService.generateSuccessMessageConfig(`${relationshipLabel} removed`);
          this.messageService.add(message);
        },
        (err) => {
          console.error(err);
          const message = this.msgConfService.generateErrorMessageConfig(`${err.name}: ${err.error}`);
          this.messageService.add(message);
        }
      );
    });
  }

}
