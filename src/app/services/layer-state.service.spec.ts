import { TestBed } from '@angular/core/testing';

import { LayerStateService } from './layer-state.service';

describe('LayerStateService', () => {
  let service: LayerStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LayerStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
