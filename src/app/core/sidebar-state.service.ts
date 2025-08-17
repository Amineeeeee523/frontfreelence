import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SidebarStateService {
  private isCollapsedSubject = new BehaviorSubject<boolean>(false);
  isCollapsed$ = this.isCollapsedSubject.asObservable();

  constructor() { }

  toggle() {
    this.isCollapsedSubject.next(!this.isCollapsedSubject.value);
  }

  setCollapsed(isCollapsed: boolean) {
    this.isCollapsedSubject.next(isCollapsed);
  }
} 