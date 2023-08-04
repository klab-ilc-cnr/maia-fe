import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject, take, takeUntil } from 'rxjs';
import { FormCore } from 'src/app/models/lexicon/lexical-entry.model';
import { CommonService } from 'src/app/services/common.service';
import { LexiconService } from 'src/app/services/lexicon.service';
import { environment } from 'src/environments/environment';
/**Componente dei tab per la lavorazione di una forma */
@Component({
  selector: 'app-tabs-form',
  templateUrl: './tabs-form.component.html',
  styleUrls: ['./tabs-form.component.scss']
})
export class TabsFormComponent implements OnInit, OnDestroy {
  demoHide = environment.demoHide;
  /**Subject per la gestione della cancellazione delle subscribe */
  private readonly unsubscribe$ = new Subject();
  /**Identificativo della forma */
  @Input() formId!: string;
  /**Identificativo dell'entrata lessicale */
  @Input() lexEntryId!: string;
  /**Forma in lavorazione */
  formEntry: FormCore | undefined;
  /**Tab iniziale selezionato */
  selectedTab = 0;
  entry$!: Observable<FormCore>;


  /**
   * Costruttore per TabsFormComponent
   * @param lexiconService {LexiconService} servizi relativi al lessico
   * @param commonService {CommonService} servizi di utilità generale
   */
  constructor(
    private lexiconService: LexiconService,
    private commonService: CommonService,
  ) {
  }

  /**Metodo dell'interfaccia OnInit utilizzato per il caricamento iniziale dei dati */
  ngOnInit(): void {
    this.loadData();
  }

  /**Metodo dell'interfaccia AfterViewInit, utilizzato per sottoscrivere la selezione di una nuova forma della stessa entrata lessicale e procedere all'aggiornamento dei dati */
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

  /**Metodo dell'interfaccia OnDestroy, utilizzato per l'emissione e chiusura del subject di gestione delle subscribe */
  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  /**
   * @private
   * Metodo che richiama il servizio di recupero della forma
   */
  private loadData() {
    this.entry$ = this.lexiconService.getForm(this.formId);

    this.entry$.pipe(
      take(1),
    ).subscribe(fe => {
      this.formEntry = fe;
    });
  }
}
