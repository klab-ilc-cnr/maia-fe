import { Component } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Observable } from 'rxjs';
import { LexiconService } from 'src/app/services/lexicon.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { UserService } from 'src/app/services/user.service';
import { BaseMetadataEditorComponent } from '../base-metadata-editor/base-metadata-editor.component';
import { FORM_RELATIONS } from 'src/app/models/lexicon/lexicon-updater';

@Component({
  selector: 'app-form-metadata-editor',
  templateUrl: '../base-metadata-editor/base-metadata-editor.component.html',
  styleUrls: ['../base-metadata-editor/base-metadata-editor.component.scss']
})
export class FormMetadataEditorComponent extends BaseMetadataEditorComponent {

  constructor(
    private lexiconService: LexiconService,
    userService: UserService,
    messageService: MessageService,
    msgConfService: MessageConfigurationService,
  ) {
    super(userService, messageService, msgConfService);
    this.relations = FORM_RELATIONS;
  }

  override async onUpdateField(userName: string, relation: any, value: any): Promise<Observable<string>> {
    return this.lexiconService.updateLexicalForm(
      userName,
      this.entry.form,
      {relation, value}
    );
  }
}
