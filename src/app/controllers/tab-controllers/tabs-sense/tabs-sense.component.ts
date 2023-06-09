import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject, take, takeUntil } from 'rxjs';
import { SenseCore } from 'src/app/models/lexicon/lexical-entry.model';
import { CommonService } from 'src/app/services/common.service';
import { LexiconService } from 'src/app/services/lexicon.service';

@Component({
  selector: 'app-tabs-sense',
  templateUrl: './tabs-sense.component.html',
  styleUrls: ['./tabs-sense.component.scss']
})
export class TabsSenseComponent implements OnInit, OnDestroy {
  private readonly unsubscribe$ = new Subject();
  @Input() senseId!: string;
  @Input() lexEntryId!: string;
  senseEntry: SenseCore | undefined;

  constructor(
    private lexiconService: LexiconService,
    private commonService: CommonService,
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.commonService.notifyObservable$.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(res => {
      if ('option' in res) {
        if (res.option === 'sense_selected' &&
          res.lexEntryId === this.lexEntryId &&
          res.value !== this.senseId) {
          this.senseEntry = undefined;
          this.senseId = res.value;
          this.loadData();
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  private loadData(): void {
    this.lexiconService.getSense(this.senseId).pipe(
      take(1),
    ).subscribe(se => { this.senseEntry = se; });
  }
}
