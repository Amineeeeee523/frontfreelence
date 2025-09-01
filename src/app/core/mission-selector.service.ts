import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MissionSelectorService {
  private readonly openRequests$ = new Subject<void>();

  get open$(): Observable<void> {
    return this.openRequests$.asObservable();
  }

  open(): void {
    this.openRequests$.next();
  }
}
