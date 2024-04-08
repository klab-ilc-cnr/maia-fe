import { TestBed } from '@angular/core/testing';

import { DictionaryStateService } from './dictionary-state.service';

describe('DictionaryStateService', () => {
  let service: DictionaryStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DictionaryStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
