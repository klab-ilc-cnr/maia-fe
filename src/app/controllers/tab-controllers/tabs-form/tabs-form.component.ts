import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { FormCore } from 'src/app/models/lexicon/lexical-entry.model';
import { LexiconService } from 'src/app/services/lexicon.service';

@Component({
  selector: 'app-tabs-form',
  templateUrl: './tabs-form.component.html',
  styleUrls: ['./tabs-form.component.scss']
})
export class TabsFormComponent implements OnInit {
  @Input() formId!: string;
  formEntry$!: Observable<FormCore>;

  constructor(
    private lexiconService: LexiconService,
  ) { }

  ngOnInit(): void {
    this.formEntry$ = this.lexiconService.getForm(this.formId);
  }

}
