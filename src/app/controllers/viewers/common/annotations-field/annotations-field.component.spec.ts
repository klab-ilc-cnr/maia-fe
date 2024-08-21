import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnotationsFieldComponent } from './annotations-field.component';

describe('AnnotationsFieldComponent', () => {
  let component: AnnotationsFieldComponent;
  let fixture: ComponentFixture<AnnotationsFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AnnotationsFieldComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnnotationsFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
