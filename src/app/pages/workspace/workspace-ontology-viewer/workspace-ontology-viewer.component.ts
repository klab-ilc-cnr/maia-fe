import { Component, OnInit } from '@angular/core';
import { TileType } from 'src/app/models/tile/tile-type.model';

@Component({
  selector: 'app-workspace-ontology-viewer',
  templateUrl: './workspace-ontology-viewer.component.html',
  styleUrls: ['./workspace-ontology-viewer.component.scss']
})
export class WorkspaceOntologyViewerComponent implements OnInit {

  public readonly TileType = TileType;
  /**Initial tab */
  public selectedTab = 0;
  public visibleTileType!: TileType;

  constructor() { }

  ngOnInit(): void {
  }

}