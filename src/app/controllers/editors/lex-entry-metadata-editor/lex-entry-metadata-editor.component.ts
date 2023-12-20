import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { Observable } from 'rxjs';
import { LEXICAL_ENTRY_RELATIONS } from 'src/app/models/lexicon/lexicon-updater';
import { CommonService } from 'src/app/services/common.service';
import { LexiconService } from 'src/app/services/lexicon.service';
import { MessageConfigurationService } from 'src/app/services/message-configuration.service';
import { UserService } from 'src/app/services/user.service';
import { BaseMetadataEditorComponent } from '../base-metadata-editor/base-metadata-editor.component';

@Component({
  selector: 'app-lex-entry-metadata-editor',
  templateUrl: './lex-entry-metadata-editor.component.html',
  styleUrls: ['./lex-entry-metadata-editor.component.scss']
})
export class LexEntryMetadataEditorComponent extends BaseMetadataEditorComponent {

  constructor(
    private lexiconService: LexiconService,
    private commonService: CommonService,
    userService: UserService,
    messageService: MessageService,
    msgConfService: MessageConfigurationService,
  ) {
    super(userService, messageService, msgConfService);
    this.formControls = {...this.formControls,
      author: new FormControl<string>({ value: '', disabled: true }),
      completionDate: new FormControl<string>({ value: '', disabled: true }),
      revisor: new FormControl<string>({ value: '', disabled: true }),
      revisionDate: new FormControl<string>({ value: '', disabled: true }),
    };

    this.relations = LEXICAL_ENTRY_RELATIONS;
  }

  protected override onLoadData(entry: typeof this.entry) {
    super.onLoadData(entry);
    const formControlList = this.form.controls;

    formControlList['author'].setValue(this.entry.author);
    if (entry.completionDate !== '') {
      formControlList['completionDate'].setValue(new Date(entry.completionDate).toLocaleString());
    }
    formControlList['revisor'].setValue(entry.revisor);
    if (entry.revisionDate !== '') {
      formControlList['revisionDate'].setValue(new Date(entry.revisionDate).toLocaleString());
    }
  }

  override async onUpdateField(userName: string, relation: LEXICAL_ENTRY_RELATIONS, value: string): Promise<Observable<string>> {
    this.commonService.notifyOther({ option: 'lexicon_edit_update_tree', value: this.entry.lexicalEntry });
    return this.lexiconService.updateLexicalEntry(
      userName,
      this.entry.lexicalEntry,
      {relation, value}
    );
  }
}
