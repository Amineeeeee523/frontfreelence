import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTachometerAlt, faHeart, faCommentDots, faFolder, faCog, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';

import { AuthService } from '../../services/auth.service';
import { Utilisateur } from '../../models/utilisateur.model';
import { Observable } from 'rxjs';
import { SidebarStateService } from '../../core/sidebar-state.service';

@Component({
  selector: 'app-sidebarfreelencer',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  templateUrl: './sidebarfreelencer.component.html',
  styleUrls: ['./sidebarfreelencer.component.scss']
})
export class SidebarfreelencerComponent implements OnInit {
  isCollapsed$: Observable<boolean>;

  // Icônes
  faTachometerAlt = faTachometerAlt;
  faHeart = faHeart;
  faCommentDots = faCommentDots;
  faFolder = faFolder;
  faCog = faCog;
  faSignOutAlt = faSignOutAlt;

  constructor(
    private authService: AuthService,
    private router: Router,
    private sidebarStateService: SidebarStateService
  ) {
    this.isCollapsed$ = this.sidebarStateService.isCollapsed$;
  }

  ngOnInit(): void {}

  toggleSidebar() {
    this.sidebarStateService.toggle();
  }

  logout() {
    this.authService.logout();
  }

  isLinkActive(url: string): boolean {
    return this.router.isActive(url, true);
  }
}
