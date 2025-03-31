import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconBaseComponent } from './icon-base/icon-base.component';
import { IconAddFolderComponent } from './icon-add-folder/icon-add-folder.component';
import { IconUploadFileComponent } from './icon-upload-file/icon-upload-file.component';
import { IconRenameComponent } from './icon-rename/icon-rename.component';
import { IconMoveComponent } from './icon-move/icon-move.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconLayerGroupComponent } from './icon-layer-group/icon-layer-group.component';
import { IconAuthorComponent } from './icon-author/icon-author.component';
import { TooltipModule } from 'primeng/tooltip';
import { IconNoteComponent } from './icon-note/icon-note.component';
import { IconLockComponent } from './icon-lock/icon-lock.component';
import { IconPlusCircleComponent } from './icon-circle-plus/icon-circle-plus.component';


@NgModule({
  declarations: [
    IconBaseComponent,
    IconAddFolderComponent,
    IconUploadFileComponent,
    IconRenameComponent,
    IconMoveComponent,
    IconLayerGroupComponent,
    IconAuthorComponent,
    IconNoteComponent,
    IconLockComponent,
    IconPlusCircleComponent
  ],
  exports: [
    IconBaseComponent,
    IconAddFolderComponent,
    IconUploadFileComponent,
    IconRenameComponent,
    IconMoveComponent,
    IconLayerGroupComponent,
    IconAuthorComponent,
    IconNoteComponent,
    IconLockComponent,
    IconPlusCircleComponent
  ],
  imports: [
    CommonModule,
    FontAwesomeModule,
    TooltipModule
  ]
})
export class IconsModule { }
