import { NgModule } from '@angular/core';
import { SharedModule } from './shared.module';
import { RouterModule } from '@angular/router';
import { LEXICON_ROUTES } from '../routes/lexicon.routes';



@NgModule({
  declarations: [],
  imports: [
    SharedModule,
    RouterModule.forChild(LEXICON_ROUTES),
  ]
})
export class LexiconModule { }
