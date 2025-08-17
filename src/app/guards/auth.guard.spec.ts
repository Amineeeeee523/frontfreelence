import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router } from '@angular/router';

import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
      TestBed.runInInjectionContext(() => new AuthGuard(TestBed.inject(AuthService), TestBed.inject(Router)).canActivate());

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService, Router]
    });
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
