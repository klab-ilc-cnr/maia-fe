import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { SenseCore  } from 'src/app/models/lexicon/lexical-entry.model';
import { MenuItem, MessageService } from 'primeng/api';
import { FormGroup } from '@angular/forms';
import { LinguisticRelationModel } from 'src/app/models/lexicon/linguistic-relation.model';
import { LexiconService } from 'src/app/services/lexicon.service';
import { take } from 'rxjs';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';

export interface FormItem {
  relationshipLabel: string,
  relationshipURI: string,
  destinationLabel: string,
  destinationURI: string,
  itemID: number,
}

@Component({
  selector: 'app-indirect-relations',
  templateUrl: './indirect-relations.component.html',
  styleUrls: ['./indirect-relations.component.scss']
})

export class IndirectRelationsComponent implements OnChanges {

  @Input() senseEntry!: SenseCore;
  @Input() menuItems: MenuItem[] = [];
  @Input() relations: LinguisticRelationModel[] = [];

  formItems: FormItem[] = [];
  relationshipLabelByURI: { [id: string] : string } = {};

  /**Form per la modifica dei valori del senso */
  form = new FormGroup({
    indirectSenseRelations: new FormGroup({}),
  });

  uniqueID = 0;

  constructor(
    private lexiconService: LexiconService,
    private msgConfService: MessageConfigurationService,
    private messageService: MessageService,
  ) {}

  private populateRelationships(items: LinguisticRelationModel[]): void {
    for (const [itemID, item] of items.entries()) {
      const {link, entity, label} = item;
      if (!link) continue;
      const newItem : FormItem = {
        relationshipLabel: this.relationshipLabelByURI[link] || '',
        relationshipURI: link,
        destinationURI: entity || '',
        destinationLabel: label || '',
        itemID
      };

      this.formItems.unshift(newItem);
      this.uniqueID = this.formItems.length;
    }
  }

  private assignMenuTree(root: MenuItem): MenuItem {
    const label = root.label || '';
    const uri = root.id || '';

    const dupItem : MenuItem = {
      ...root,
      items: root.items !== undefined? [] : undefined,
      command: () => this.onMenuClickInsertFormItem(label, uri),
    };

    for (const menuItem of Object.values(root.items || [])) {
      const subItem : MenuItem = this.assignMenuTree(menuItem);
      dupItem.items?.push(subItem);
    }

    this.relationshipLabelByURI[uri] = label;

    return dupItem;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['relations']) {
      console.log('changing relationships')
      console.log(changes)
      this.populateRelationships(changes['relations'].currentValue);
    }

    if (changes['menuItems']) {
      const items = changes['menuItems'].currentValue;
      this.menuItems = this.assignMenuTree({items}).items || [];
    }
  }

  onMenuClickInsertFormItem(relationshipLabel: string, relationshipURI: string) {
    const newItem : FormItem = {
      itemID: this.uniqueID++,
      relationshipLabel,
      relationshipURI,
      destinationURI: '',
      destinationLabel: '',
    };
    this.formItems.unshift(newItem);

    this.lexiconService.createIndirectSenseRelation(
      this.senseEntry.sense, relationshipURI
    ).pipe(
      take(1),
    ).subscribe(
      (indirectRelationshipURI: string) => {
        console.log('DONE!!')
        console.log(indirectRelationshipURI)
        newItem.relationshipURI = indirectRelationshipURI;
      },
      (err) => {
        console.error(err);
        const message = this.msgConfService.generateErrorMessageConfig(`${err.name}: ${err.error}`);
        this.messageService.add(message);
      }
    );

  }

}
