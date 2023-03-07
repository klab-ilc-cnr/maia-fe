import { Component, OnInit } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { LexicalEntryType } from 'src/app/models/lexicon/lexical-entry.model';

/**Classe del tile di modifica di un'entrata lessicale */
@Component({
  selector: 'app-workspace-lexicon-edit-tile',
  templateUrl: './workspace-lexicon-edit-tile.component.html',
  styleUrls: ['./workspace-lexicon-edit-tile.component.scss']
})
export class WorkspaceLexiconEditTileComponent implements OnInit {
  /**Tipo di entrata lessicale */
  public selectedType!: LexicalEntryType; //set su workspace
  /**Nodo dell'albero del lessico selezionato */
  public selectedNode!: TreeNode; //set su workspace

  constructor() { }

  ngOnInit(): void {
    console.group('Dati di apertura del pannello')
    console.info(this.selectedType)
    console.info(this.selectedNode)
    console.groupEnd()
  }

}
