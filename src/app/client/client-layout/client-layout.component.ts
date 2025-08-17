import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AsyncPipe, NgClass } from '@angular/common';
import { Observable } from 'rxjs';

import { SidebarclientComponent } from '../sidebarclient/sidebarclient.component';
import { NavbarclientComponent } from '../navbarclient/navbarclient.component';
import { SidebarStateService } from '../../core/sidebar-state.service';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    SidebarclientComponent,
    NavbarclientComponent,
    AsyncPipe,
    NgClass
  ],
  templateUrl: './client-layout.component.html',
  styleUrls: ['./client-layout.component.scss']
})
export class ClientLayoutComponent {
  isSidebarCollapsed$: Observable<boolean>;

  constructor(private sidebarState: SidebarStateService) {
    this.isSidebarCollapsed$ = this.sidebarState.isCollapsed$;
  }
} 