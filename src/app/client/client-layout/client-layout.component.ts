import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { AsyncPipe, NgClass } from '@angular/common';
import { Observable } from 'rxjs';

import { SidebarclientComponent } from '../sidebarclient/sidebarclient.component';
import { SidebarStateService } from '../../core/sidebar-state.service';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    SidebarclientComponent,
    AsyncPipe,
    NgClass
  ],
  templateUrl: './client-layout.component.html',
  styleUrls: ['./client-layout.component.scss']
})
export class ClientLayoutComponent implements OnInit {
  isSidebarCollapsed$: Observable<boolean>;

  constructor(
    private sidebarState: SidebarStateService,
    private router: Router
  ) {
    this.isSidebarCollapsed$ = this.sidebarState.isCollapsed$;
  }

  ngOnInit(): void {
    // Rediriger vers explorer-freelances si on est sur la route racine client
    if (this.router.url === '/client') {
      this.router.navigate(['/client/explorer-freelances']);
    }
  }
} 