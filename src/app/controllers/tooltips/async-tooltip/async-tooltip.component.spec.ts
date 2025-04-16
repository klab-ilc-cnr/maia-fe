import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsyncTooltipComponent } from './async-tooltip.component';

describe('AsyncTooltipComponent', () => {
  let component: AsyncTooltipComponent;
  let fixture: ComponentFixture<AsyncTooltipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AsyncTooltipComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AsyncTooltipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
