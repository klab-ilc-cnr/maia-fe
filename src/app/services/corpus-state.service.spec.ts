import { TestBed } from '@angular/core/testing';

import { CorpusStateService } from './corpus-state.service';

describe('CorpusStateService', () => {
  let service: CorpusStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CorpusStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
