import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkspaceLayersVisibilityManagerComponent } from './workspace-layers-visibility-manager.component';

describe('WorkspaceLayersVisibilityManagerComponent', () => {
  let component: WorkspaceLayersVisibilityManagerComponent;
  let fixture: ComponentFixture<WorkspaceLayersVisibilityManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkspaceLayersVisibilityManagerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkspaceLayersVisibilityManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
