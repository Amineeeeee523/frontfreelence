import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faHeart, faTimes, faSync, faStar, faMapPin,
  faCheckCircle, faUserTie, faLevelUpAlt, faDollarSign, faHandshake, faChevronDown, faBriefcase, faCheck
} from '@fortawesome/free-solid-svg-icons';
import { catchError, finalize, switchMap, take } from 'rxjs/operators';
import { EMPTY, of } from 'rxjs';

import { UtilisateurSummaryModel } from '../../models/utilisateur-summary.model';
import { SwipeService } from '../../services/swipe.service';
import { AuthService } from '../../services/auth.service';
import { Decision } from '../../models/swipe.model';
import { Mission } from '../../models/mission.model';
import { MissionsService } from '../../services/missions.service';
import { MatchNotificationService } from '../../services/match-notification.service';
import { MatchNotification } from '../../models/match-notification.model';
import { Router } from '@angular/router';

export interface FreelancerViewModel extends UtilisateurSummaryModel {
  decision?: 'like' | 'dislike';
}

@Component({
  selector: 'app-swipeclient',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './swipeclient.component.html',
  styleUrls: ['./swipeclient.component.scss']
})
export class SwipeclientComponent implements OnInit {
  // --- États principaux ---
  clientMissions: Mission[] = [];
  selectedMission: Mission | null = null;
  freelancers: FreelancerViewModel[] = [];

  isLoadingMissions = true;
  isLoadingFreelancers = false;
  isMissionSelectorOpen = false;

  // --- Animation / Drag State ---
  animating = false;
  panPosition = { x: 0, y: 0 };
  currentIndex = 0;
  private dragActive = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private activeCardEl: HTMLElement | null = null;
  public clientId!: number;

  // --- Icones FontAwesome ---
  faHeart = faHeart;
  faTimes = faTimes;
  faSync = faSync;
  faDollarSign = faDollarSign;
  faLevelUpAlt = faLevelUpAlt;
  faMapPin = faMapPin;
  faStar = faStar;
  faCheckCircle = faCheckCircle;
  faUserTie = faUserTie;
  faChevronDown = faChevronDown;
  faBriefcase = faBriefcase;
  faCheck = faCheck;

  get currentFreelancer(): FreelancerViewModel | undefined {
    return this.freelancers.length > 0 ? this.freelancers[this.freelancers.length - 1] : undefined;
  }

  constructor(
    private swipeService: SwipeService,
    private missionsService: MissionsService,
    private authService: AuthService,
    private matchService: MatchNotificationService,
    private router: Router
  ) {}

  // -------------------- INIT --------------------
  ngOnInit(): void {
    // WS pour les matchs
    this.matchService.connect();
    this.matchService.match$.subscribe((notif) => this.onMatch(notif));

    this.authService.user$.pipe(
      take(1),
      switchMap(user => {
        if (user && user.id) {
          this.clientId = user.id;
          return this.missionsService.getMissionsByClient(this.clientId);
        }
        return EMPTY;
      }),
      finalize(() => (this.isLoadingMissions = false)),
      catchError(err => {
        console.error('Erreur lors du chargement des missions du client', err);
        return EMPTY;
      })
    ).subscribe(missions => {
      this.clientMissions = missions;
      // On pourrait présélectionner la première mission ici si souhaité
    });
  }

  // -------------------- Missions --------------------
  toggleMissionSelector(): void {
    this.isMissionSelectorOpen = !this.isMissionSelectorOpen;
  }

  selectMission(mission: Mission): void {
    this.selectedMission = mission;
    this.isMissionSelectorOpen = false;
    this.freelancers = [];
    this.loadFreelancers(mission.id);
  }

  private loadFreelancers(missionId: number): void {
    if (!this.clientId) return;

    this.isLoadingFreelancers = true;
    this.swipeService.exploreFreelancers(missionId, this.clientId).pipe(
      finalize(() => (this.isLoadingFreelancers = false)),
      catchError(err => {
        console.error('Erreur lors du chargement des freelances compatibles :', err);
        return EMPTY;
      })
    ).subscribe(freelancers => {
      // On renverse pour avoir la première carte en haut de pile
      this.freelancers = freelancers.reverse();
      this.currentIndex = this.freelancers.length - 1;
    });
  }

  reloadFreelancers(): void {
    if (this.selectedMission) {
      this.loadFreelancers(this.selectedMission.id);
    }
  }

  trackById(index: number, item: { id: number }): number {
    return item.id;
  }

  // -------------------- Swipe Buttons --------------------
  onLike(): void {
    this.swipe(Decision.LIKE);
  }

  onDislike(): void {
    this.swipe(Decision.DISLIKE);
  }

  private swipe(decision: Decision): void {
    if (!this.currentFreelancer || this.animating || !this.selectedMission) return;

    const freelancer = this.currentFreelancer;
    freelancer.decision = decision === Decision.LIKE ? 'like' : 'dislike';
    this.animating = true;

    this.swipeService.clientSwipeFreelance(
      this.selectedMission.id,
      this.clientId,
      freelancer.id,
      decision
    ).pipe(catchError(() => of(null)))
     .subscribe();

    // Augmenter le délai pour laisser l'animation se terminer complètement
    setTimeout(() => {
      this.freelancers.pop();
      this.currentIndex = this.freelancers.length - 1;
      this.animating = false;
    }, 800); // Augmenté de 500ms à 800ms pour une animation plus fluide
  }

  // -------------------- Gesture Management --------------------
  handlePointerDown(event: PointerEvent, index: number): void {
    if (this.animating || index !== this.currentIndex) return;

    this.dragActive = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;

    this.activeCardEl = (event.target as HTMLElement).closest('.swipe-card');
    if (this.activeCardEl) {
      this.activeCardEl.setPointerCapture(event.pointerId);
      this.activeCardEl.style.transition = 'none';
    }
  }

  handlePointerMove(event: PointerEvent): void {
    if (!this.dragActive || !this.activeCardEl) return;

    const deltaX = event.clientX - this.dragStartX;
    const deltaY = event.clientY - this.dragStartY;
    this.panPosition = { x: deltaX, y: deltaY };

    const rotate = deltaX * 0.05;
    this.activeCardEl.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotate}deg)`;
  }

  handlePointerUp(event: PointerEvent, index: number): void {
    if (!this.dragActive || !this.activeCardEl || index !== this.currentIndex) return;

    const deltaX = event.clientX - this.dragStartX;
    const decision = deltaX > 100 ? Decision.LIKE : deltaX < -100 ? Decision.DISLIKE : null;

    this.panPosition = { x: 0, y: 0 };
    this.dragActive = false;

    try {
      this.activeCardEl.releasePointerCapture(event.pointerId);
    } catch (_) {}

    if (decision) {
      this.swipe(decision);
    } else {
      this.activeCardEl.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      this.activeCardEl.style.transform = '';
    }

    this.activeCardEl = null;
  }

  // -------------------- Overlays --------------------
  getLikeOpacity(index: number): number {
    if (index !== this.currentIndex) return 0;
    return this.panPosition.x > 0 ? Math.min(this.panPosition.x / 100, 1) : 0;
  }

  getDislikeOpacity(index: number): number {
    if (index !== this.currentIndex) return 0;
    return this.panPosition.x < 0 ? Math.min(Math.abs(this.panPosition.x) / 100, 1) : 0;
  }

  /* ---------------- MATCH ---------------- */
  matchPopup?: MatchNotification;

  private onMatch(notif: MatchNotification): void {
    this.matchPopup = notif;
  }

  goToChat(): void {
    if (this.matchPopup) {
      this.router.navigate(['/client/messagerie'], { queryParams: { convId: this.matchPopup.conversationId } });
      this.matchPopup = undefined;
    }
  }
}
