import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseMetadataEditorComponent } from './base-metadata-editor.component';

describe('BaseMetadataEditorComponent', () => {
  let component: BaseMetadataEditorComponent;
  let fixture: ComponentFixture<BaseMetadataEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BaseMetadataEditorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BaseMetadataEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
