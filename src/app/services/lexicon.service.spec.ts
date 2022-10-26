import { TestBed } from '@angular/core/testing';

import { LexiconService } from './lexicon.service';

describe('LexiconService', () => {
  let service: LexiconService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LexiconService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
