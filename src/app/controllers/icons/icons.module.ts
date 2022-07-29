import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconBaseComponent } from './icon-base/icon-base.component';
import { IconAddFolderComponent } from './icon-add-folder/icon-add-folder.component';
import { IconUploadFileComponent } from './icon-upload-file/icon-upload-file.component';
import { IconRenameComponent } from './icon-rename/icon-rename.component';
import { IconMoveComponent } from './icon-move/icon-move.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';


@NgModule({
  declarations: [
    IconBaseComponent,
    IconAddFolderComponent,
    IconUploadFileComponent,
    IconRenameComponent,
    IconMoveComponent
  ],
  exports: [
    IconBaseComponent,
    IconAddFolderComponent,
    IconUploadFileComponent,
    IconRenameComponent,
    IconMoveComponent
  ],
  imports: [
    CommonModule,
    FontAwesomeModule
  ]
})
export class IconsModule { }
