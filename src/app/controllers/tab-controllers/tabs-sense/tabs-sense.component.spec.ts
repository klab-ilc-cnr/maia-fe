import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabsSenseComponent } from './tabs-sense.component';

describe('TabsSenseComponent', () => {
  let component: TabsSenseComponent;
  let fixture: ComponentFixture<TabsSenseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TabsSenseComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TabsSenseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
