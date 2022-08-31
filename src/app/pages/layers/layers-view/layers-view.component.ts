import { LayerService } from './../../../services/layer.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-layers-view',
  templateUrl: './layers-view.component.html',
  styleUrls: ['./layers-view.component.scss']
})
export class LayersViewComponent implements OnInit {

  constructor(
    private layerService: LayerService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      var id = params.get('id');

      if (id != null) {
        this.loadDetails(Number.parseInt(id));
      }
      else {
        this.back();
      }
    });
  }

  back() {
    this.router.navigate(['layers']);
  }

  loadDetails(layerId: number) {
    this.layerService;
  }
}
