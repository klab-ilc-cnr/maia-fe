import { Component, OnInit } from '@angular/core';
import { DictionaryEntry } from 'src/app/models/dictionary/dictionary-entry.model';

@Component({
  selector: 'app-workspace-dictionary-editor-tile',
  templateUrl: './workspace-dictionary-editor-tile.component.html',
  styleUrls: ['./workspace-dictionary-editor-tile.component.scss']
})
export class WorkspaceDictionaryEditorTileComponent implements OnInit {
  public panelId!: string;
  public dictionaryEntry!: DictionaryEntry;

  constructor() { }

  ngOnInit(): void {
  }

}
