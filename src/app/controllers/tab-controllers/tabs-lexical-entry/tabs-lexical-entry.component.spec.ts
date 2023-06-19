import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabsLexicalEntryComponent } from './tabs-lexical-entry.component';

describe('TabLexicalEntryComponent', () => {
  let component: TabsLexicalEntryComponent;
  let fixture: ComponentFixture<TabsLexicalEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TabsLexicalEntryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TabsLexicalEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
