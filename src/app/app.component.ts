import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

import { MatchNotification } from './models/match-notification.model';
import { MatchNotificationService } from './services/match-notification.service';
import { AuthService } from './services/auth.service';
import { TypeUtilisateur } from './models/utilisateur.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'frontend';

  matchPopup?: MatchNotification;
  private subscriptions = new Subscription();

  /** Tableau utilisé pour générer les confettis dans l'overlay via *ngFor */
  confettiArray = Array(40);

  constructor(
    private matchService: MatchNotificationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Établir la connexion WS pour les notifications de match dès le démarrage
    this.matchService.connect();
    const sub = this.matchService.match$.subscribe(notif => {
      this.matchPopup = notif;
    });
    this.subscriptions.add(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /* ------------ Actions depuis le pop-up ------------- */
  closePopup(): void {
    this.matchPopup = undefined;
  }

  openChat(): void {
    if (!this.matchPopup) return;
    const user = this.authService.snapshot;
    if (user?.typeUtilisateur === TypeUtilisateur.FREELANCE) {
      this.router.navigate(['/freelencer/chat'], { queryParams: { convId: this.matchPopup.conversationId } });
    } else {
      this.router.navigate(['/client/messagerie'], { queryParams: { convId: this.matchPopup.conversationId } });
    }
    this.closePopup();
  }
}
