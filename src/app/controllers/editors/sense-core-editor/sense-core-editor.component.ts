import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Observable, Subject, take, takeUntil } from 'rxjs';
import { PropertyElement, SenseCore } from 'src/app/models/lexicon/lexical-entry.model';
import { User } from 'src/app/models/user';
import { CommonService } from 'src/app/services/common.service';
import { GlobalStateService } from 'src/app/services/global-state.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-sense-core-editor',
  templateUrl: './sense-core-editor.component.html',
  styleUrls: ['./sense-core-editor.component.scss']
})
export class SenseCoreEditorComponent implements OnInit, OnDestroy {
  private readonly unsubscribe$ = new Subject();
  @Input() senseEntry$!: Observable<SenseCore>;
  currentUser!: User;
  definitionFormItems: PropertyElement[] = [];
  definitionsMenuItems: { label: string, command: any }[] = [];
  form = new FormGroup({
    definition: new FormGroup({}),
  });
  senseEntry!: SenseCore;
  get definition() { return this.form.controls.definition; }

  constructor(
    private userService: UserService,
    private globalState: GlobalStateService,
    private commonService: CommonService,
  ) {
    this.userService.retrieveCurrentUser().pipe(
      take(1),
    ).subscribe(cu => {
      this.currentUser = cu;
    });
  }

  ngOnInit(): void {
    this.senseEntry$.pipe(
      takeUntil(this.unsubscribe$),
    ).subscribe(sense => {
      this.senseEntry = sense;
      for (const def of this.senseEntry.definition) {
        if (def.propertyID === 'definition') {
          this.definition.addControl('definition', new FormControl<string>(def.propertyValue, Validators.required));
        }
        if (def.propertyID !== 'definition' && def.propertyValue === '') {
          this.definitionsMenuItems.push({
            label: def.propertyID,
            command: () => {
              this.onAddDefinitionField(def);
            }
          });
          continue;
        }
        this.onAddDefinitionField(def);
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete();
  }

  onAddDefinitionField(fieldProperty: PropertyElement) {
    this.definitionFormItems.push(fieldProperty);
    this.definition.addControl(fieldProperty.propertyID, new FormControl<string>(fieldProperty.propertyValue));
    this.definitionsMenuItems = this.definitionsMenuItems.filter(i => i.label !== fieldProperty.propertyID);
    console.info(this.form.value)
  }

  onDeleteLexicalSense() {
    //TODO implementare metodo di cancellazione del senso e reindirizzamento dell'albero
  }

  onRemoveDefinitionElement(fieldName: string) {
    //TODO implementa rimozione del campo di definitions
  }
}
