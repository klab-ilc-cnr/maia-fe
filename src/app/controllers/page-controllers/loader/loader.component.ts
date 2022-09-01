import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { LoaderService } from 'src/app/services/loader.service';

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss']
})
export class LoaderComponent implements OnInit {

  isLoading!: boolean
  private serviceSubscription!: Subscription

  constructor(private loaderService: LoaderService) { }

  ngOnInit(): void {
    this.serviceSubscription = this.loaderService.getStatus().subscribe(
      loadingStatus => { this.isLoading = loadingStatus }
    )
  }

  ngOnDestroy(): void {
    this.serviceSubscription.unsubscribe()
  }

}
