import { TestBed } from '@angular/core/testing';

import { SearchAnnotationService } from './search-annotation.service';

describe('SearchAnnotationService', () => {
  let service: SearchAnnotationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SearchAnnotationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
