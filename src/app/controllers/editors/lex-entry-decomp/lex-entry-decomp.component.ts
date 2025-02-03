import { Component, Input, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { LexicalEntryListItem } from 'src/app/models/lexicon/lexical-entry.model';
import { LexiconService } from 'src/app/services/lexicon.service';

@Component({
  selector: 'app-lex-entry-decomp',
  templateUrl: './lex-entry-decomp.component.html',
  styleUrls: ['./lex-entry-decomp.component.scss']
})
export class LexEntryDecompComponent implements OnInit {
  @Input() lexicalEntryInstanceName!: string;
  lexicalEntryComponents!: Observable<LexicalEntryListItem[]>;
  form = new FormGroup({
    components: new FormArray<FormControl>([]),
  });
  get components() { return this.form.controls['components'] as FormArray; }

  constructor(
    private lexiconService: LexiconService,
  ) { }

  ngOnInit(): void {
    this.lexicalEntryComponents = this.lexiconService.retrieveMultiwordComponents(this.lexicalEntryInstanceName);
  }

  onAddComponent() {}

  onRemoveComponent(index: number) {}

  onSelectLexEntry() {}
}
