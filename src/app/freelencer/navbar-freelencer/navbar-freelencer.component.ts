import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faBell, faCreditCard, faChevronDown, faMedal, faWallet } from '@fortawesome/free-solid-svg-icons';
import { Observable } from 'rxjs';
import { Utilisateur } from '../../models/utilisateur.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar-freelencer',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  templateUrl: './navbar-freelencer.component.html',
  styleUrls: ['./navbar-freelencer.component.scss']
})
export class NavbarFreelencerComponent implements OnInit {
  user$: Observable<Utilisateur | null>;
  isDropdownOpen = false;

  faBell = faBell;
  faCreditCard = faCreditCard;
  faChevronDown = faChevronDown;
  faMedal = faMedal;
  faWallet = faWallet;

  constructor(private authService: AuthService) {
    this.user$ = this.authService.user$;
  }

  ngOnInit(): void {}

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }
  logout() {
    this.authService.logout();
  }
}
