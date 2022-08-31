import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayersViewComponent } from './layers-view.component';

describe('LayersViewComponent', () => {
  let component: LayersViewComponent;
  let fixture: ComponentFixture<LayersViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LayersViewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LayersViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
