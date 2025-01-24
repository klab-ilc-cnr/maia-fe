import { Component, OnInit, ViewChild } from '@angular/core';
import { OntologyDataExplorerComponent } from 'src/app/controllers/explorers/ontology-data-explorer/ontology-data-explorer.component';

@Component({
  selector: 'app-workspace-ontology-explorer',
  templateUrl: './workspace-ontology-explorer.component.html',
  styleUrls: ['./workspace-ontology-explorer.component.scss']
})
export class WorkspaceOntologyExplorerComponent implements OnInit {

  @ViewChild(OntologyDataExplorerComponent) ontologyDataExplorerComponent!: OntologyDataExplorerComponent;

  /**Initial tab */
  public selectedTab = 0;
  /**jsPanel ontology explorer height */
  public ontologyPanelHeight: number = 0;

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.ontologyPanelHeight = document.getElementById("ontologyExplorerTile")!.clientHeight;
  }

  /**
* Updates the height of the content of the panel
* @param newHeight {any} newHeight
*/
  updateHeight(newHeight: number) {
    this.ontologyPanelHeight = newHeight;
  }

  /**
   * On tab change
   * @param $event {any} event
   * @returns
  */
  onTabChange(event: any) {
    const index = event.index;
    // Verify open tab is Ontology-Data
    if (index === 4) {
      if (this.ontologyDataExplorerComponent) {
        this.ontologyDataExplorerComponent.refreshAnnotationHeigh();
      }
    }
  }

}
