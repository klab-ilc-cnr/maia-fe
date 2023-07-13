import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SenseMetadataEditorComponent } from './sense-metadata-editor.component';

describe('SenseMetadataEditorComponent', () => {
  let component: SenseMetadataEditorComponent;
  let fixture: ComponentFixture<SenseMetadataEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SenseMetadataEditorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SenseMetadataEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
