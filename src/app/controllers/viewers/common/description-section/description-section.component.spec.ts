import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DescriptionSectionComponent } from './description-section.component';

describe('DescriptionSectionComponent', () => {
  let component: DescriptionSectionComponent;
  let fixture: ComponentFixture<DescriptionSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DescriptionSectionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DescriptionSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
