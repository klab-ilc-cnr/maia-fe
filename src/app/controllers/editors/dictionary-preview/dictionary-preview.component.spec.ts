import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DictionaryPreviewComponent } from './dictionary-preview.component';

describe('DictionaryPreviewComponent', () => {
  let component: DictionaryPreviewComponent;
  let fixture: ComponentFixture<DictionaryPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DictionaryPreviewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DictionaryPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
