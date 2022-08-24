import { TestBed } from '@angular/core/testing';

import { MessageConfigurationService } from './message-configuration.service';

describe('MessageConfigurationService', () => {
  let service: MessageConfigurationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MessageConfigurationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
