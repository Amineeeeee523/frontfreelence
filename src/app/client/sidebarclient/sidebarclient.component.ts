import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AsyncPipe, CommonModule, NgIf } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faFolder, faUsers, faCreditCard,
  faGauge, faRightFromBracket, faMagnifyingGlass, 
  faCommentDots as faMessage, faQuestionCircle
} from '@fortawesome/free-solid-svg-icons';

import { SidebarStateService } from '../../core/sidebar-state.service';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-sidebarclient',
  standalone: true,
  imports: [AsyncPipe, NgIf, RouterLink, CommonModule, FaIconComponent],
  templateUrl: './sidebarclient.component.html',
  styleUrls: ['./sidebarclient.component.scss']
})
export class SidebarclientComponent implements OnInit {

  isCollapsed$: Observable<boolean>;

  faGauge = faGauge;
  faFolder = faFolder;
  faSearch = faMagnifyingGlass; // Use faMagnifyingGlass for search
  faUsers = faUsers;
  faCommentDots = faMessage; // Use faMessage for consistency
  faCreditCard = faCreditCard;
  faQuestionCircle = faQuestionCircle;
  faRightFromBracket = faRightFromBracket;

  constructor(
    private sidebarState: SidebarStateService,
    private authService: AuthService,

    public router: Router
  ) {
    this.isCollapsed$ = this.sidebarState.isCollapsed$;
  }

  ngOnInit(): void {
    // Assure que la sidebar est ouverte par défaut côté client
    this.sidebarState.setCollapsed(false);
  }

  toggleSidebar(): void {
    this.sidebarState.toggle();
  }

  isLinkActive(url: string): boolean {
    return this.router.url === url;
  }

  logout(): void {
    this.authService.logout();
  }
}
