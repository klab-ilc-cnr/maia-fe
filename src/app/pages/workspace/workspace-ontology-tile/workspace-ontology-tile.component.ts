import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-workspace-ontology-tile',
  templateUrl: './workspace-ontology-tile.component.html',
  styleUrls: ['./workspace-ontology-tile.component.scss']
})
export class WorkspaceOntologyTileComponent implements OnInit {

  /**Initial tab */
  public selectedTab = 0;
  /**jsPanel ontology explorer height */
  public ontologyPanelHeight: number = 0;

  constructor() { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void{
    this.ontologyPanelHeight = document.getElementById("ontologyTile")!.clientHeight;
  }

  /**
* Updates the height of the content of the panel
* @param newHeight {any} newHeight
*/
  updateHeight(newHeight: number) {
    this.ontologyPanelHeight = newHeight;
  }

}