import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DropdownPlusNumberComponent } from './dropdown-plus-number.component';

describe('DropdownPlusNumberComponent', () => {
  let component: DropdownPlusNumberComponent;
  let fixture: ComponentFixture<DropdownPlusNumberComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DropdownPlusNumberComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DropdownPlusNumberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
