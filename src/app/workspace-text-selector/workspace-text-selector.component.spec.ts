import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkspaceTextSelectorComponent } from './workspace-text-selector.component';

describe('WorkspaceTextSelectorComponent', () => {
  let component: WorkspaceTextSelectorComponent;
  let fixture: ComponentFixture<WorkspaceTextSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkspaceTextSelectorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkspaceTextSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
