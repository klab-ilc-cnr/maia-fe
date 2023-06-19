import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabsFormComponent } from './tabs-form.component';

describe('TabsFormComponent', () => {
  let component: TabsFormComponent;
  let fixture: ComponentFixture<TabsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TabsFormComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TabsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
