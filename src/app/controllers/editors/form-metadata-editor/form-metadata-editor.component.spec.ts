import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormMetadataEditorComponent } from './form-metadata-editor.component';

describe('FormMetadataEditorComponent', () => {
  let component: FormMetadataEditorComponent;
  let fixture: ComponentFixture<FormMetadataEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FormMetadataEditorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormMetadataEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
