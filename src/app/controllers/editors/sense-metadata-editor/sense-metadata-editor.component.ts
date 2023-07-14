import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseMetadataEditorComponent } from '../base-metadata-editor/base-metadata-editor.component';
import { LexiconService } from 'src/app/services/lexicon.service';
import { UserService } from 'src/app/services/user.service';
import { MessageService } from 'primeng/api';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { LEXICAL_SENSE_RELATIONS } from 'src/app/models/lexicon/lexicon-updater';

@Component({
  selector: 'app-sense-metadata-editor',
  templateUrl: '../base-metadata-editor/base-metadata-editor.component.html',
  styleUrls: ['../base-metadata-editor/base-metadata-editor.component.scss']
})
export class SenseMetadataEditorComponent extends BaseMetadataEditorComponent {

  constructor(
    private lexiconService: LexiconService,
    userService: UserService,
    messageService: MessageService,
    msgConfService: MessageConfigurationService,
  ) {
    super(userService, messageService, msgConfService);
    this.relations = LEXICAL_SENSE_RELATIONS;
  }

  override async onUpdateField(userName: string, relation: any, value: any): Promise<Observable<string>> {
    return this.lexiconService.updateLexicalSense(
      userName,
      this.entry.sense,
      {relation, value}
    );
  }
}
