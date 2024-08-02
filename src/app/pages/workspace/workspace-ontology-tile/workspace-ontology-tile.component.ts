import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-workspace-ontology-tile',
  templateUrl: './workspace-ontology-tile.component.html',
  styleUrls: ['./workspace-ontology-tile.component.scss']
})
export class WorkspaceOntologyTileComponent implements OnInit {

  /**Initial tab */
  selectedTab = 0;

  constructor() { }

  ngOnInit(): void {
  }

}
