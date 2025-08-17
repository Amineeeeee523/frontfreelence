import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHeart, faTimes, faSync, faEuroSign, faClock, faCalendarDay, faMapMarkerAlt, faCheckCircle, faPlayCircle, faBriefcase, faFire, faInfoCircle, faBullseye, faListCheck, faUserTie, faFileSignature, faStar, faCheck } from '@fortawesome/free-solid-svg-icons';
import { catchError, finalize, switchMap, take, map } from 'rxjs/operators';
import { EMPTY, of, forkJoin } from 'rxjs';

import { MissionViewModel } from '../../models/mission-view.model';
import { MissionsService } from '../../services/missions.service';
import { AuthService } from '../../services/auth.service';
import { Decision } from '../../models/swipe.model';
import { UtilisateurService } from '../../services/utilisateurs.service';
import { Mission } from '../../models/mission.model';
import { MatchNotificationService } from '../../services/match-notification.service';
import { MatchNotification } from '../../models/match-notification.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-swipefreelencer',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, CurrencyPipe],
  templateUrl: './swipefreelencer.component.html',
  styleUrls: ['./swipefreelencer.component.scss']
})
export class SwipefreelencerComponent implements OnInit {
  missions: MissionViewModel[] = [];
  isLoading = true;
  animating = false;
  panPosition = { x: 0, y: 0 };
  public currentIndex: number = 0;
  // Pointer drag state
  private dragActive = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private activeCardEl: HTMLElement | null = null;

  faHeart = faHeart;
  faTimes = faTimes;
  faSync = faSync;
  faEuroSign = faEuroSign;
  faClock = faClock;
  faCalendarDay = faCalendarDay;
  faFire = faFire;
  faMapMarkerAlt = faMapMarkerAlt;
  faCheckCircle = faCheckCircle;
  faPlayCircle = faPlayCircle;
  faBriefcase = faBriefcase;
  // Ajout de nouvelles icônes pour les panneaux latéraux
  faInfoCircle = faInfoCircle;
  faBullseye = faBullseye;
  faListCheck = faListCheck;
  faUserTie = faUserTie;
  faFileSignature = faFileSignature;
  faStar = faStar;
  faCheck = faCheck;

  public get currentMission(): MissionViewModel | undefined {
    if (this.missions && this.missions.length > 0) {
      return this.missions[this.missions.length - 1];
    }
    return undefined;
  }

  public currentUserId: number | null = null;
  private currentUserCategories: string[] = [];
  private currentCategoryIndex = 0;

  constructor(
    private missionsService: MissionsService,
    private authService: AuthService,
    private utilisateurService: UtilisateurService,
    private matchService: MatchNotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Init WS match notifications
    this.matchService.connect();
    this.matchService.match$.subscribe((notif) => this.onMatch(notif));

    this.authService.user$.pipe(take(1)).subscribe(user => {
      if (user && user.id && user.categories && user.categories.length > 0) {
        this.currentUserId = user.id;
        this.currentUserCategories = user.categories;
        this.loadMissionsForCurrentCategory();
      } else {
        this.isLoading = false;
        // Handle case where user is not authenticated or has no categories
      }
    });
  }

  trackByMissionId(index: number, mission: MissionViewModel): number {
    return mission.id;
  }

  loadMissionsForCurrentCategory(): void {
    if (!this.currentUserId || this.currentUserCategories.length === 0) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    const categoryToLoad = this.currentUserCategories[this.currentCategoryIndex];

    this.missionsService.getMissionsForSwipe(this.currentUserId, categoryToLoad).pipe(
      switchMap((missions: Mission[]) => {
        if (missions.length === 0) {
          return of([]);
        }
        
        const userRequests = missions.map(mission => {
          const cid = mission.clientId ?? (mission as any).client?.id;
          return cid ? this.utilisateurService.getUtilisateurById(cid).pipe(catchError(() => of(null))) : of(null);
        });

        return forkJoin(userRequests).pipe(
          map(users => {
            return missions.map((mission, index) => {
              const user = users[index];
              const cid = mission.clientId ?? (mission as any).client?.id;
              return {
                ...mission,
                id: mission.id,
                titre: mission.titre,
                budget: mission.budget,
                devise: mission.devise,
                categorie: mission.categorie,
                statut: mission.statut,
                modaliteTravail: mission.modaliteTravail,
                datePublication: mission.datePublication,
                dureeEstimeeJours: mission.dureeEstimeeJours,
                description: mission.description,
                competencesRequises: mission.competencesRequises ?? [],
                localisation: mission.localisation,
                mediaUrls: mission.mediaUrls ?? [],
                videoBriefUrl: mission.videoBriefUrl,
                clientId: cid,
                clientNom: user ? `${user.prenom} ${user.nom}` : 'Client Anonyme',
                clientAvatarUrl: user?.photoProfilUrl,
                clientEstVerifie: user?.estActif,
                clientMissionsPostees: user?.missionsPubliees,
                scoreCompatibilite: mission.scoreMatching,
                resume: mission.description ? mission.description.substring(0, 100) + '...' : '',
              } as MissionViewModel;
            });
          })
        );
      }),
      finalize(() => this.isLoading = false),
      catchError((err) => {
        console.error("Erreur lors du chargement des missions:", err);
        return EMPTY;
      })
    ).subscribe(viewModels => {
      console.log('--- DEBUG: Contenu des cartes après chargement ---', viewModels);
      this.missions = viewModels.reverse();
      this.currentIndex = this.missions.length - 1;
      if (this.missions.length === 0) {
        this.loadNextCategory();
      }
    });
  }

  private loadNextCategory(): void {
    this.currentCategoryIndex++;
    if (this.currentCategoryIndex < this.currentUserCategories.length) {
      this.loadMissionsForCurrentCategory();
    } else {
      // Toutes les catégories ont été vues
      console.log("Toutes les catégories ont été parcourues.");
    }
  }

  onLike(): void {
    this.swipe(Decision.LIKE);
  }

  onDislike(): void {
    this.swipe(Decision.DISLIKE);
  }

  private swipe(decision: Decision): void {
    if (this.missions.length === 0 || this.animating) return;

    const mission = this.missions[this.missions.length - 1];
    mission.decision = decision === Decision.LIKE ? 'like' : 'dislike';
    this.animating = true;

    this.missionsService.swipeMission(mission.id, this.currentUserId!, decision)
      .pipe(catchError(() => of(null))) // Handle swipe error without blocking
      .subscribe();

    setTimeout(() => {
      this.missions.pop();
      this.currentIndex = this.missions.length - 1;
      this.animating = false;
      if (this.missions.length === 0) {
        this.loadNextCategory();
      }
    }, 500); // Animation duration
  }

  formatDate(date: string): string {
    if (!date) return '';
    const now = new Date();
    const publicationDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - publicationDate.getTime()) / 1000);

    const days = Math.floor(diffInSeconds / 86400);
    if (days > 1) return `Publié il y a ${days} jours`;
    if (days === 1) return `Publié hier`;

    const hours = Math.floor(diffInSeconds / 3600);
    if (hours > 1) return `Publié il y a ${hours} heures`;
    if (hours === 1) return `Publié il y a une heure`;

    const minutes = Math.floor(diffInSeconds / 60);
    if (minutes > 1) return `Publié il y a ${minutes} minutes`;
    
    return `Publié à l'instant`;
  }

  // --- Gesture Management ---
  handlePanStart(event: any): void {
    if (this.animating) return;
    const card = event.target.closest('.swipe-card');
    if (card) {
      card.style.transition = 'none'; // Remove transition during pan
    }
  }

  handlePanMove(event: any, index: number): void {
    if (this.animating || index !== this.currentIndex) return;

    const card = event.target.closest('.swipe-card');
    if (!card) return;

    this.panPosition = { x: event.deltaX, y: event.deltaY };
    const rotate = this.panPosition.x * 0.05;
    card.style.transform = `translate(${this.panPosition.x}px, ${this.panPosition.y}px) rotate(${rotate}deg)`;
  }

  handlePanEnd(event: any, missionId: number, index: number): void {
    if (this.animating || index !== this.currentIndex) return;

    const card = event.target.closest('.swipe-card');
    if (!card) return;

    const endX = event.deltaX;
    const decision = endX > 100 ? Decision.LIKE : endX < -100 ? Decision.DISLIKE : null;

    this.panPosition = { x: 0, y: 0 }; // Reset position

    if (decision) {
      this.swipe(decision);
    } else {
      // Return to original position
      card.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      card.style.transform = '';
    }
  }

  getLikeOpacity(index: number): number {
    if (index !== this.currentIndex) return 0;
    return this.panPosition.x > 0 ? Math.min(this.panPosition.x / 100, 1) : 0;
  }

  getDislikeOpacity(index: number): number {
    if (index !== this.currentIndex) return 0;
    return this.panPosition.x < 0 ? Math.min(Math.abs(this.panPosition.x) / 100, 1) : 0;
  }

  reloadMissions(): void {
    this.currentCategoryIndex = 0;
    this.loadMissionsForCurrentCategory();
  }

  /* ----------- Pointer-based drag & drop (works without HammerJS) ----------- */
  handlePointerDown(event: PointerEvent, index: number): void {
    if (this.animating || index !== this.currentIndex) return;

    this.dragActive = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;

    this.activeCardEl = (event.target as HTMLElement).closest('.swipe-card') as HTMLElement;
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

  handlePointerUp(event: PointerEvent, missionId: number, index: number): void {
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
      // Return to origin
      this.activeCardEl.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      this.activeCardEl.style.transform = '';
    }

    this.activeCardEl = null;
  }

  /** Ouvre la vidéo de brief dans un nouvel onglet */
  openVideo(url: string): void {
    if (!url) { return; }
    window.open(url, '_blank');
  }

  /* ------------------- MATCH HANDLING ------------------- */
  public matchPopup?: MatchNotification;

  private onMatch(notif: MatchNotification): void {
    // Afficher le pop-up uniquement si l'un des participants est le freelance courant
    // et si la mission concerne l'une des cartes (sécurité supplémentaire)
    this.matchPopup = notif;
  }

  goToChat(): void {
    if (this.matchPopup) {
      this.router.navigate(['/freelencer/chat'], { queryParams: { convId: this.matchPopup.conversationId } });
      this.matchPopup = undefined;
    }
  }
}
