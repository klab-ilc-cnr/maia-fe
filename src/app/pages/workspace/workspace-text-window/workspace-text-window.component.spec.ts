import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkspaceTextWindowComponent } from './workspace-text-window.component';

describe('WorkspaceTextWindowComponent', () => {
  let component: WorkspaceTextWindowComponent;
  let fixture: ComponentFixture<WorkspaceTextWindowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkspaceTextWindowComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkspaceTextWindowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
