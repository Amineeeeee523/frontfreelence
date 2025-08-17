import { TestBed } from '@angular/core/testing';

import { TranchePaiementService } from './tranche-paiement.service';

describe('TranchePaiementService', () => {
  let service: TranchePaiementService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TranchePaiementService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
