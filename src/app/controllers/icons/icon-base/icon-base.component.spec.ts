import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconBaseComponent } from './icon-base.component';

describe('IconBaseComponent', () => {
  let component: IconBaseComponent;
  let fixture: ComponentFixture<IconBaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ IconBaseComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(IconBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
