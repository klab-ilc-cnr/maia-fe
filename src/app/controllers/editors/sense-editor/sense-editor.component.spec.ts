import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SenseEditorComponent } from './sense-editor.component';

describe('SenseEditorComponent', () => {
  let component: SenseEditorComponent;
  let fixture: ComponentFixture<SenseEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SenseEditorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SenseEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
