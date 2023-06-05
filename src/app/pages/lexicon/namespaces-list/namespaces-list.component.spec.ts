import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NamespacesListComponent } from './namespaces-list.component';

describe('NamespacesListComponent', () => {
  let component: NamespacesListComponent;
  let fixture: ComponentFixture<NamespacesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NamespacesListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NamespacesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
