import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormCoreEditorComponent } from './form-core-editor.component';

describe('FormCoreEditorComponent', () => {
  let component: FormCoreEditorComponent;
  let fixture: ComponentFixture<FormCoreEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FormCoreEditorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormCoreEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
