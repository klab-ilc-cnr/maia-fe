import { NgModule } from '@angular/core';
import { NamespacesListComponent } from '../pages/lexicon/namespaces-list/namespaces-list.component';
import { SharedModule } from './shared.module';
import { RouterModule } from '@angular/router';
import { NAMESPACES_ROUTES } from '../routes/lexicon.routes';



@NgModule({
  declarations: [
    NamespacesListComponent,
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(NAMESPACES_ROUTES),
  ]
})
export class NamespacesModule { }
