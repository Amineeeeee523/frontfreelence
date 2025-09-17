import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { SidebarfreelencerComponent } from '../sidebarfreelencer/sidebarfreelencer.component';
import { SidebarStateService } from '../../core/sidebar-state.service';
import { Observable, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-freelencer-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarfreelencerComponent],
  templateUrl: './freelencer-layout.component.html',
  styleUrls: ['./freelencer-layout.component.scss']
})
export class FreelencerLayoutComponent implements OnInit, OnDestroy {
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

  ngOnInit(): void {
    // Rediriger vers swipe si on est sur la route racine freelancer
    if (this.router.url === '/freelencer') {
      this.router.navigate(['/freelencer/swipe']);
    }
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}