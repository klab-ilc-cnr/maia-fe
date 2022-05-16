import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkspaceLayoutComponent } from './workspace-layout.component';

describe('WorkspaceLayoutComponent', () => {
  let component: WorkspaceLayoutComponent;
  let fixture: ComponentFixture<WorkspaceLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkspaceLayoutComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkspaceLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
