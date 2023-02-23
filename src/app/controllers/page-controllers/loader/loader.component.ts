import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { LoaderService } from 'src/app/services/loader.service';

/**Componente della grafica di loading */
@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss']
})
export class LoaderComponent implements OnInit {

  /**Definisce se il loading è in corso */
  isLoading!: boolean
  /**Sottoscrizione al servizio */
  private serviceSubscription!: Subscription

  /**
   * Costruttore per LoaderComponent
   * @param loaderService {LoaderService} servizi relativi al loading
   */
  constructor(private loaderService: LoaderService) { }

  /**Metodo dell'interfaccia OnInit, utilizzato per richiedere lo status di loading */
  ngOnInit(): void {
    this.serviceSubscription = this.loaderService.getStatus().subscribe(
      loadingStatus => { this.isLoading = loadingStatus }
    )
  }

  /**Metodo dell'interfaccia OnDestroy, utilizzato per cancellare la sottoscrizione */
  ngOnDestroy(): void {
    this.serviceSubscription.unsubscribe()
  }

}
