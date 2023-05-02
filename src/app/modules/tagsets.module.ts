import { NgModule } from '@angular/core';
import { SharedModule } from './shared.module';
import { RouterModule } from '@angular/router';
import { TAGSETS_ROUTES } from '../routes/tagsets.routes';
import { TagsetsListComponent } from '../pages/tagsets/tagsets-list/tagsets-list.component';
import { TagsetCreateEditComponent } from '../pages/tagsets/tagset-create-edit/tagset-create-edit.component';



@NgModule({
  declarations: [
    TagsetsListComponent,
    TagsetCreateEditComponent
  ],
  imports: [
    // CommonModule
    SharedModule,
    RouterModule.forChild(TAGSETS_ROUTES)
  ]
})
export class TagsetsModule { }
