import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHeart, faTimes, faSync, faEuroSign, faClock, faCalendarDay, faMapMarkerAlt, faCheckCircle, faPlayCircle, faFire, faStar, faCheck, faBriefcase, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { catchError, finalize, switchMap, take, map, tap } from 'rxjs/operators';
import { EMPTY, of, forkJoin } from 'rxjs';

import { MissionViewModel } from '../../models/mission-view.model';
import { MissionsService } from '../../services/missions.service';
import { AuthService } from '../../services/auth.service';
import { Decision } from '../../models/swipe.model';
import { UtilisateurService } from '../../services/utilisateurs.service';
import { Mission, MissionCategorie, TypeRemuneration } from '../../models/mission.model';
import { MatchNotificationService } from '../../services/match-notification.service';
import { MatchNotification } from '../../models/match-notification.model';
import { Router } from '@angular/router';
import { MissionSummary } from '../../models/mission-summary.model';

@Component({
  selector: 'app-swipefreelencer',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, CurrencyPipe],
  templateUrl: './swipefreelencer.component.html',
  styleUrls: ['./swipefreelencer.component.scss']
})
export class SwipefreelencerComponent implements OnInit {
  // Color mode: false => homogeneous, true => semi-differentiated
  useSemiDiff = false;
  missions: MissionViewModel[] = [];
  isLoading = true;
  animating = false;
  panPosition = { x: 0, y: 0 };
  public currentIndex: number = 0;
  // Description expansion state
  public expandedDescriptions: { [missionId: number]: boolean } = {};
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
  faStar = faStar;
  faCheck = faCheck;
  faBriefcase = faBriefcase;
  faChevronDown = faChevronDown;

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
      tap((missions) => console.log('[Swipe] RAW missions from API:', missions)),
      switchMap((missions: MissionSummary[]) => {
        if (missions.length === 0) {
          return of([]);
        }
        
        const userRequests = missions.map(mission => {
          const cid = mission.client?.id as number | undefined;
          return cid ? this.utilisateurService.getUtilisateurById(cid).pipe(catchError(() => of(null))) : of(null);
        });
        const detailsRequests = missions.map(mission => {
          const skills = (mission as any)?.competencesRequises;
          return skills && Array.isArray(skills) && skills.length > 0
            ? of(null)
            : this.missionsService.getMissionById(mission.id).pipe(catchError(() => of(null)));
        });

        return forkJoin({ users: forkJoin(userRequests), details: forkJoin(detailsRequests) }).pipe(
          map(({ users, details }) => {
            return missions.map((mission, index) => {
              const user = users[index];
              const missionDetails = details[index] as (Mission | null);
              const cid = mission.client?.id as number | undefined;
              // Normalize competences: accept array of strings, array of objects, or comma-separated string
              const rawSkillsSource: any = (mission as any).competencesRequises ?? (missionDetails as any)?.competencesRequises;
              const rawSkills: any = rawSkillsSource;
              const competencesRequises: string[] = Array.isArray(rawSkills)
                ? rawSkills.map((s: any) => typeof s === 'string' ? s : (s?.nom || s?.name || String(s))).filter(Boolean)
                : typeof rawSkills === 'string'
                ? rawSkills.split(/[,;|]/).map((s: string) => s.trim()).filter(Boolean)
                : [];

              // Debug mapping of competences
              console.log('[Swipe] Mission', mission.id, 'rawSkills=', rawSkills, 'normalized=', competencesRequises);
              const description = (mission as any).description ?? missionDetails?.description ?? '';
              return {
                ...mission,
                id: mission.id,
                titre: mission.titre,
                budget: mission.budget,
                devise: mission.devise,
                typeRemuneration: (mission as any).typeRemuneration ?? missionDetails?.typeRemuneration,
                budgetMin: (mission as any).budgetMin ?? missionDetails?.budgetMin ?? undefined,
                budgetMax: (mission as any).budgetMax ?? missionDetails?.budgetMax ?? undefined,
                tjmJournalier: (mission as any).tjmJournalier ?? missionDetails?.tjmJournalier ?? undefined,
                categorie: mission.categorie,
                statut: mission.statut,
                modaliteTravail: mission.modaliteTravail,
                datePublication: mission.datePublication,
                dureeEstimeeJours: (mission as any).dureeEstimeeJours ?? (missionDetails as any)?.dureeEstimeeJours,
                dateLimiteCandidature: (mission as any).dateLimiteCandidature ?? missionDetails?.dateLimiteCandidature,
                dateDebutSouhaitee: (mission as any).dateDebutSouhaitee ?? missionDetails?.dateDebutSouhaitee,
                chargeHebdoJours: (mission as any).chargeHebdoJours ?? missionDetails?.chargeHebdoJours,
                niveauExperienceMin: (mission as any).niveauExperienceMin ?? missionDetails?.niveauExperienceMin,
                description: typeof description === 'string' ? description : (description != null ? JSON.stringify(description) : ''),
                competencesRequises,
                localisation: (mission as any).localisation ?? missionDetails?.localisation,
                gouvernorat: (mission as any).gouvernorat ?? missionDetails?.gouvernorat,
                urgent: (mission as any).urgent ?? missionDetails?.urgent,
                qualiteBrief: (mission as any).qualiteBrief ?? missionDetails?.qualiteBrief,
                mediaUrls: (mission as any).mediaUrls ?? missionDetails?.mediaUrls ?? [],
                videoBriefUrl: (mission as any).videoBriefUrl ?? missionDetails?.videoBriefUrl,
                clientId: cid,
                clientNom: user ? `${user.prenom} ${user.nom}` : (mission.client ? `${mission.client.prenom} ${mission.client.nom}` : 'Client Anonyme'),
                clientAvatarUrl: user?.photoProfilUrl || mission.client?.photoUrl,
                clientEstVerifie: user?.estActif,
                clientMissionsPostees: user?.missionsPubliees,
                scoreCompatibilite: undefined,
                resume: (mission as any).description ? (mission as any).description.substring(0, 100) + '...' : '',
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
      console.log('[Swipe] currentMission skills =', this.currentMission?.competencesRequises);
      console.log('[Swipe] currentMission description =', this.currentMission?.description);
      console.log('[Swipe] currentMission description length =', this.currentMission?.description?.length);
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

  toggleDescription(missionId: number): void {
    console.log('Toggle description for missionId:', missionId);
    const mission = this.missions.find(m => m.id === missionId);
    console.log('Mission description:', mission?.description);
    this.expandedDescriptions[missionId] = !this.expandedDescriptions[missionId];
    console.log('New state:', this.expandedDescriptions[missionId]);
  }

  /**
   * Returns the best available mission text to show in description:
   * 1) description (trimmed) if present
   * 2) resume/summary fallback
   * 3) empty string when none
   */
  safeMissionText(mission: MissionViewModel | undefined): string {
    if (!mission) { return ''; }
    const description = (mission as any)?.description ? String((mission as any).description) : '';
    const descTrimmed = description.trim();
    if (descTrimmed.length > 0) { return descTrimmed; }
    const resume = (mission as any)?.resume ? String((mission as any).resume) : '';
    const resumeTrimmed = resume.trim();
    return resumeTrimmed;
  }
}
