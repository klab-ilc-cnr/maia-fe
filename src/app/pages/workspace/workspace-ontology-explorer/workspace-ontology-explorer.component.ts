import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-workspace-ontology-explorer',
  templateUrl: './workspace-ontology-explorer.component.html',
  styleUrls: ['./workspace-ontology-explorer.component.scss']
})
export class WorkspaceOntologyExplorerComponent implements OnInit {

  /**Initial tab */
  public selectedTab = 0;
  /**jsPanel ontology explorer height */
  public ontologyPanelHeight: number = 0;

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void{
    this.ontologyPanelHeight = document.getElementById("ontologyExplorerTile")!.clientHeight;
  }

  /**
* Updates the height of the content of the panel
* @param newHeight {any} newHeight
*/
  updateHeight(newHeight: number) {
    this.ontologyPanelHeight = newHeight;
  }

}
