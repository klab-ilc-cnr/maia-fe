import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconBaseComponent } from './icon-base/icon-base.component';
import { IconAddFolderComponent } from './icon-add-folder/icon-add-folder.component';
import { IconUploadFileComponent } from './icon-upload-file/icon-upload-file.component';
import { IconRenameComponent } from './icon-rename/icon-rename.component';
import { IconMoveComponent } from './icon-move/icon-move.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconLayerGroupComponent } from './icon-layer-group/icon-layer-group.component';


@NgModule({
  declarations: [
    IconBaseComponent,
    IconAddFolderComponent,
    IconUploadFileComponent,
    IconRenameComponent,
    IconMoveComponent,
    IconLayerGroupComponent
  ],
  exports: [
    IconBaseComponent,
    IconAddFolderComponent,
    IconUploadFileComponent,
    IconRenameComponent,
    IconMoveComponent,
    IconLayerGroupComponent
  ],
  imports: [
    CommonModule,
    FontAwesomeModule
  ]
})
export class IconsModule { }
