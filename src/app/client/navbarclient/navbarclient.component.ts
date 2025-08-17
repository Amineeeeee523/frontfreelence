import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBell, faPlusCircle, faChevronDown, faUser, faCog, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { Observable } from 'rxjs';
import { Utilisateur } from '../../models/utilisateur.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbarclient',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  templateUrl: './navbarclient.component.html',
  styleUrls: ['./navbarclient.component.scss']
})
export class NavbarclientComponent implements OnInit {
  user$: Observable<Utilisateur | null>;
  isDropdownOpen = false;

  // Icônes spécifiques au client
  faBell = faBell;
  faPlusCircle = faPlusCircle; // Bouton pour "Créer une mission"
  faChevronDown = faChevronDown;
  faUser = faUser;
  faCog = faCog;
  faSignOutAlt = faSignOutAlt;

  constructor(private authService: AuthService) {
    this.user$ = this.authService.user$;
  }

  ngOnInit(): void {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-menu')) {
      this.isDropdownOpen = false;
    }
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }
  
  logout() {
    this.authService.logout();
  }
}
