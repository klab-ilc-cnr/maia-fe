import { NgModule } from '@angular/core';
import { SharedModule } from './shared.module';
import { RouterModule } from '@angular/router';
import { LAYERS_ROUTES } from '../routes/layers.routes';
import { LayersListComponent } from '../pages/layers/layers-list/layers-list.component';
import { LayersViewComponent } from '../pages/layers/layers-view/layers-view.component';



@NgModule({
  declarations: [
    LayersListComponent,
    LayersViewComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(LAYERS_ROUTES)
  ]
})
export class LayersModule { }
