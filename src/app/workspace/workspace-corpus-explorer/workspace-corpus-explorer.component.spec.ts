import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkspaceCorpusExplorerComponent } from './workspace-corpus-explorer.component';

describe('WorkspaceCorpusExplorerComponent', () => {
  let component: WorkspaceCorpusExplorerComponent;
  let fixture: ComponentFixture<WorkspaceCorpusExplorerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkspaceCorpusExplorerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkspaceCorpusExplorerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
