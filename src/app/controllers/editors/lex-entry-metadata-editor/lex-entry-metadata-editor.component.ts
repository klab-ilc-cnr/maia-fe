import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-lex-entry-metadata-editor',
  templateUrl: './lex-entry-metadata-editor.component.html',
  styleUrls: ['./lex-entry-metadata-editor.component.scss']
})
export class LexEntryMetadataEditorComponent implements OnInit {
  /**Definisce se elementi del form sono in caricamento */
  loading = false;

  constructor() { }

  ngOnInit(): void {
  }

}
