import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { MenuItem, MessageService } from 'primeng/api';
import { LexEntityRelationTypeModel } from 'src/app/models/lexicon/lexentity-relation-type.model';
import { LexicalEntityRelationsResponseModel } from 'src/app/models/lexicon/lexical-sense-response.model';
import { LexiconService } from 'src/app/services/lexicon.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { environment } from 'src/environments/environment';

@Component({ template: '' })
export class BaseLexEntityEditorComponent {
  /**Elementi del menu relativi alle definizioni */
  menuItems: MenuItem[] = [];
  model: LexicalEntityRelationsResponseModel = { indirectRelations: [], directRelations: [] };
  /**Defines whether an element should be hidden/disabled in the demo version */
  demoHide = environment.demoHide;

  public constructor(
    protected lexiconService: LexiconService,
    protected msgConfService: MessageConfigurationService,
    protected messageService: MessageService,
  ) { }

  protected showHttpError(err: HttpErrorResponse): void {
    console.error(err);
    const message = this.msgConfService.generateErrorMessageConfig(`${err.name}: ${err.error.message}`);
    this.messageService.add(message);
  }

  private sortMenuItems(a: MenuItem, b: MenuItem): number {
    return (a.label || '') > (b.label || '') ? 1 : -1;
  }

  private menuItemByRelationshipURI: { [id: string]: MenuItem } = {};

  protected buildMenuItems(relationTypes: LexEntityRelationTypeModel[]): MenuItem[] {

    const rootNode: MenuItem = { label: '', command: (e) => { console.error(e) }, items: [] };

    // Prepare nodes
    const nodeById = this.menuItemByRelationshipURI;

    for (const relationType of relationTypes) {
      const { propertyLabel, propertyId, propertyDescription } = relationType;
      nodeById[propertyId] = {
        label: propertyLabel,
        tooltip: propertyDescription,
        id: propertyId,
      };
    }

    // Prepare sub-items per each node

    for (const relationType of relationTypes) {
      let parentNode = nodeById[relationType.parentID] || rootNode;
      const childNode = nodeById[relationType.propertyId];
      if (parentNode == childNode) parentNode = rootNode;
      parentNode.items = (parentNode.items || []);
      parentNode.items.push(childNode);
    }

    // Sort alphabetically

    for (const relationType of relationTypes) {
      const node = nodeById[relationType.propertyId];
      if (!node.items) continue;
      node.items.sort(this.sortMenuItems);
    }

    rootNode.items?.sort(this.sortMenuItems);

    return rootNode.items || [];
  }

}
