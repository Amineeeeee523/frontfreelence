import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { SidebarfreelencerComponent } from '../sidebarfreelencer/sidebarfreelencer.component';
import { NavbarFreelencerComponent } from '../navbar-freelencer/navbar-freelencer.component'; // Importez le composant Navbar
import { SidebarStateService } from '../../core/sidebar-state.service';
import { Observable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-freelencer-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarfreelencerComponent, NavbarFreelencerComponent], // Ajoutez NavbarFreelencerComponent aux imports
  templateUrl: './freelencer-layout.component.html',
  styleUrls: ['./freelencer-layout.component.scss']
})
export class FreelencerLayoutComponent implements OnDestroy {
  isSidebarCollapsed$: Observable<boolean>;
  private routerSubscription: Subscription;

  constructor(
    private sidebarStateService: SidebarStateService,
    private router: Router
  ) {
    this.isSidebarCollapsed$ = this.sidebarStateService.isCollapsed$;

    this.routerSubscription = this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      if (event.urlAfterRedirects.includes('/freelencer/chat')) {
        this.sidebarStateService.setCollapsed(true);
      } else {
        this.sidebarStateService.setCollapsed(false);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}