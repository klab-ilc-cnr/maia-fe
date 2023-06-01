import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { SenseCore } from 'src/app/models/lexicon/lexical-entry.model';
import { LexiconService } from 'src/app/services/lexicon.service';

@Component({
  selector: 'app-tabs-sense',
  templateUrl: './tabs-sense.component.html',
  styleUrls: ['./tabs-sense.component.scss']
})
export class TabsSenseComponent implements OnInit {
  @Input() senseId!: string;
  senseEntry$!: Observable<SenseCore>;

  constructor(
    private lexiconService: LexiconService,
  ) { }

  ngOnInit(): void {
    this.senseEntry$ = this.lexiconService.getSense(this.senseId);
  }

}
