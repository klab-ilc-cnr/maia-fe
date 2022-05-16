import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkspaceMenuComponent } from './workspace-menu.component';

describe('WorkspaceMenuComponent', () => {
  let component: WorkspaceMenuComponent;
  let fixture: ComponentFixture<WorkspaceMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkspaceMenuComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkspaceMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
