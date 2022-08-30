import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayersListComponent } from './layers-list.component';

describe('LayersListComponent', () => {
  let component: LayersListComponent;
  let fixture: ComponentFixture<LayersListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LayersListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LayersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
