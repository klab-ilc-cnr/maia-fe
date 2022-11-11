import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { LexicalEntryType } from 'src/app/models/lexicon/lexical-entry.model';

@Component({
  selector: 'app-workspace-lexicon-edit-tile',
  templateUrl: './workspace-lexicon-edit-tile.component.html',
  styleUrls: ['./workspace-lexicon-edit-tile.component.scss']
})
export class WorkspaceLexiconEditTileComponent implements OnInit {
  selectedType?: LexicalEntryType;

  constructor() { }

  ngOnInit(): void {
  }

}
