import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnnotationsSectionComponent } from './annotations-section.component';

describe('AnnotationsSectionComponent', () => {
  let component: AnnotationsSectionComponent;
  let fixture: ComponentFixture<AnnotationsSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AnnotationsSectionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnnotationsSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
