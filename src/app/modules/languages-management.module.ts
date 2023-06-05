import { NgModule } from '@angular/core';
import { LanguagesListComponent } from '../pages/lexicon/languages-list/languages-list.component';
import { LanguagesViewComponent } from '../pages/lexicon/languages-view/languages-view.component';
import { SharedModule } from './shared.module';
import { RouterModule } from '@angular/router';
import { LANGUAGES_MANAGEMENT_ROUTES } from '../routes/lexicon.routes';



@NgModule({
  declarations: [
    LanguagesListComponent,
    LanguagesViewComponent
  ],
  imports: [
    SharedModule,
    RouterModule.forChild(LANGUAGES_MANAGEMENT_ROUTES),
  ]
})
export class LanguagesManagementModule { }
