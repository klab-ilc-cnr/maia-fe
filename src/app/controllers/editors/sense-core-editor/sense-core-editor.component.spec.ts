import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SenseCoreEditorComponent } from './sense-core-editor.component';

describe('SenseCoreEditorComponent', () => {
  let component: SenseCoreEditorComponent;
  let fixture: ComponentFixture<SenseCoreEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SenseCoreEditorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SenseCoreEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
