import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject, take, takeUntil } from 'rxjs';
import { SenseCore } from 'src/app/models/lexicon/lexical-entry.model';
import { CommonService } from 'src/app/services/common.service';
import { LexiconService } from 'src/app/services/lexicon.service';
import { environment } from 'src/environments/environment';
/**Componente dei tab per la lavorazione di un senso */
@Component({
  selector: 'app-tabs-sense',
  templateUrl: './tabs-sense.component.html',
  styleUrls: ['./tabs-sense.component.scss']
})
export class TabsSenseComponent implements OnInit, OnDestroy {
  demoHide = environment.demoHide;
  /**Subject per la gestione della cancellazione delle subscribe */
  private readonly unsubscribe$ = new Subject();
  /**Identificativo del senso */
  @Input() senseId!: string;
  /**Identificativo dell'entrata lessicale */
  @Input() lexEntryId!: string;
  /**Senso in lavorazione */
  senseEntry: SenseCore | undefined;

  entry$!: Observable<SenseCore>;

  /**
   * Costruttore per TabsSenseComponent
   * @param lexiconService {LexiconService} servizi relativi al lessico
   * @param commonService {CommonService} servizi di utilità generale
   */
  constructor(
    private lexiconService: LexiconService,
    private commonService: CommonService,
  ) { }

  /**Metodo dell'interfaccia OnInit, utilizzato per il caricamento iniziale dei dati */
  ngOnInit(): void {
    this.loadData();
  }

  /**Metodo dell'interfacia AfterViewInit, utilizzato per sottoscrivere le selezione di un nuovo senso sulla stessa entrata lessicale e procedere all'aggiornamento dei dati */
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

  /**Metodo dell'interfaccia OnDestroy, utilizzato per l'emissione e chiusura del subject di gestione delle subscribe */
  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  /**
 * @private
 * Metodo che richiama il servizio di recupero del senso
 */
  private loadData(): void {
    this.entry$ = this.lexiconService.getSense(this.senseId);
    this.entry$.pipe(
      take(1),
    ).subscribe(se => {
      this.senseEntry = se;
    });
  }
}
