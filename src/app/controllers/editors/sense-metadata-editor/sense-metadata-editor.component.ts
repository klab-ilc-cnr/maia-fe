import { Component } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Observable } from 'rxjs';
import { LEXICAL_SENSE_RELATIONS } from 'src/app/models/lexicon/lexicon-updater';
import { LexiconService } from 'src/app/services/lexicon.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { UserService } from 'src/app/services/user.service';
import { BaseMetadataEditorComponent } from '../base-metadata-editor/base-metadata-editor.component';

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
    if(value==='') {
      const relationLabel = relation.split('#')[1];
      return this.lexiconService.deleteRelation(
        this.entry.sense, 
        {
          relation:relation,
          value: this.entry[relationLabel]
        }
      );
    }
    return this.lexiconService.updateLexicalSense(
      userName,
      this.entry.sense,
      {relation, value}
    );
  }
}
