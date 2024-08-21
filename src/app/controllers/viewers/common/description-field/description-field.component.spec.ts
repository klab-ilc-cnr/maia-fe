import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DescriptionFieldComponent } from './description-field.component';

describe('DescriptionFieldComponent', () => {
  let component: DescriptionFieldComponent;
  let fixture: ComponentFixture<DescriptionFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DescriptionFieldComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DescriptionFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
