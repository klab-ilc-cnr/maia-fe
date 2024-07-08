import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkspaceDictionaryEditorTileComponent } from './workspace-dictionary-editor-tile.component';

describe('WorkspaceDictionaryEditorTileComponent', () => {
  let component: WorkspaceDictionaryEditorTileComponent;
  let fixture: ComponentFixture<WorkspaceDictionaryEditorTileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkspaceDictionaryEditorTileComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkspaceDictionaryEditorTileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
