import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LexEntryMetadataEditorComponent } from './lex-entry-metadata-editor.component';

describe('LexEntryMetadataEditorComponent', () => {
  let component: LexEntryMetadataEditorComponent;
  let fixture: ComponentFixture<LexEntryMetadataEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LexEntryMetadataEditorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LexEntryMetadataEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
