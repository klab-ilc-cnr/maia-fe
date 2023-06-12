import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subject, take, takeUntil } from 'rxjs';
import { FormCore } from 'src/app/models/lexicon/lexical-entry.model';
import { CommonService } from 'src/app/services/common.service';
import { LexiconService } from 'src/app/services/lexicon.service';

@Component({
  selector: 'app-tabs-form',
  templateUrl: './tabs-form.component.html',
  styleUrls: ['./tabs-form.component.scss']
})
export class TabsFormComponent implements OnInit, OnDestroy {
  private readonly unsubscribe$ = new Subject();
  @Input() formId!: string;
  @Input() lexEntryId!: string;
  formEntry!: FormCore | undefined;
  selectedTab = 0;

  constructor(
    private lexiconService: LexiconService,
    private commonService: CommonService,
  ) { }

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit() {
    this.commonService.notifyObservable$.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(res => {
      if ('option' in res) {
        if (res.option === 'form_selected' &&
          res.lexEntryId === this.lexEntryId &&
          res.value !== this.formId) {
          this.formEntry = undefined;
          this.formId = res.value;
          this.loadData();
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  private loadData() {
    this.lexiconService.getForm(this.formId).pipe(
      take(1),
    ).subscribe(fe => {
      this.formEntry = fe;
    });
  }
}
