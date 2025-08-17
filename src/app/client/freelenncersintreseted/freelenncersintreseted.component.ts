import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faHeart, faTimes, faSync, faStar, faMapPin,
  faCheckCircle, faUserTie, faLevelUpAlt, faDollarSign, faHandshake, faChevronDown, faBriefcase, faPlus, faCheck
} from '@fortawesome/free-solid-svg-icons';
import { catchError, finalize, switchMap, take } from 'rxjs/operators';
import { EMPTY, of } from 'rxjs';

import { UtilisateurSummaryModel } from '../../models/utilisateur-summary.model';
import { SwipeService } from '../../services/swipe.service';
import { AuthService } from '../../services/auth.service';
import { Decision } from '../../models/swipe.model';
import { Mission } from '../../models/mission.model';
import { MissionsService } from '../../services/missions.service';

export interface FreelancerViewModel extends UtilisateurSummaryModel {
  decision?: 'like' | 'dislike';
}

@Component({
  selector: 'app-freelenncersintreseted',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './freelenncersintreseted.component.html',
  styleUrls: ['./freelenncersintreseted.component.scss']
})
export class FreelenncersintresetedComponent implements OnInit {
  // State
  clientMissions: Mission[] = [];
  selectedMission: Mission | null = null;
  freelancers: FreelancerViewModel[] = [];
  
  isLoadingMissions = true;
  isLoadingFreelancers = false;
  isMissionSelectorOpen = false;
  
  animating = false;
  panPosition = { x: 0, y: 0 };
  currentIndex = 0;
  
  // Drag state
  private dragActive = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private activeCardEl: HTMLElement | null = null;
  private clientId!: number;

  // Icons
  faHeart = faHeart;
  faTimes = faTimes;
  faSync = faSync;
  faDollarSign = faDollarSign;
  faLevelUpAlt = faLevelUpAlt;
  faHandshake = faHandshake;
  faMapPin = faMapPin;
  faStar = faStar;
  faCheckCircle = faCheckCircle;
  faUserTie = faUserTie;
  faChevronDown = faChevronDown;
  faBriefcase = faBriefcase;
  faPlus = faPlus;
  faCheck = faCheck;


  public get currentFreelancer(): FreelancerViewModel | undefined {
    return this.freelancers.length > 0 ? this.freelancers[this.freelancers.length - 1] : undefined;
  }

  constructor(
    private swipeService: SwipeService,
    private missionsService: MissionsService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.user$.pipe(
      take(1),
      switchMap(user => {
        if (user && user.id) {
          this.clientId = user.id;
          return this.missionsService.getMissionsByClient(this.clientId);
        }
        return EMPTY;
      }),
      finalize(() => this.isLoadingMissions = false),
      catchError(err => {
        console.error("Erreur lors du chargement des missions du client", err);
        return EMPTY;
      })
    ).subscribe(missions => {
      this.clientMissions = missions;
      // Optionnel : pré-sélectionner la première mission si elle existe
      if(this.clientMissions.length > 0) {
        // this.selectMission(this.clientMissions[0]);
      }
    });
  }
  
  selectMission(mission: Mission): void {
    this.selectedMission = mission;
    this.isMissionSelectorOpen = false;
    this.freelancers = []; // Vider la liste précédente
    this.loadFreelancers(mission.id);
  }

  toggleMissionSelector(): void {
    this.isMissionSelectorOpen = !this.isMissionSelectorOpen;
  }

  loadFreelancers(missionId: number): void {
    if (!this.clientId) return;

    this.isLoadingFreelancers = true;
    this.swipeService.getFreelancersWhoLikedMission(missionId, this.clientId).pipe(
      finalize(() => this.isLoadingFreelancers = false),
      catchError(err => {
        console.error("Erreur lors du chargement des freelances intéressés:", err);
        return EMPTY;
      })
    ).subscribe(freelancers => {
      this.freelancers = freelancers.reverse();
      this.currentIndex = this.freelancers.length - 1;
    });
  }

  trackById(index: number, item: { id: number }): number {
    return item.id;
  }

  onLike(freelancer: FreelancerViewModel): void {
    this.swipe(Decision.LIKE, freelancer);
  }

  onDislike(freelancer: FreelancerViewModel): void {
    this.swipe(Decision.DISLIKE, freelancer);
  }

  private swipe(decision: Decision, freelancer: FreelancerViewModel): void {
    if (this.animating || !this.selectedMission) return;

    freelancer.decision = decision === Decision.LIKE ? 'like' : 'dislike';
    this.animating = true;

    this.swipeService.clientSwipeFreelance(this.selectedMission.id, this.clientId, freelancer.id, decision)
      .pipe(catchError(() => of(null)))
      .subscribe(response => {
        if (response && (response as any).aGenereMatch) {
          console.log('🎉 It\'s a Match!');
        }
      });

    // Animation delay pour montrer l'overlay de décision
    setTimeout(() => {
      // Retirer le freelance de la liste
      const index = this.freelancers.indexOf(freelancer);
      if (index > -1) {
        this.freelancers.splice(index, 1);
      }
      this.currentIndex = this.freelancers.length - 1;
      this.animating = false;
    }, 1000);
  }

  // --- Gesture Management for Swipeable Cards ---
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

    if (decision && this.currentFreelancer) {
      this.swipe(decision, this.currentFreelancer);
    } else {
      this.activeCardEl.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      this.activeCardEl.style.transform = '';
    }

    this.activeCardEl = null;
  }

  getLikeOpacity(index: number): number {
    if (index !== this.currentIndex) return 0;
    return this.panPosition.x > 0 ? Math.min(this.panPosition.x / 100, 1) : 0;
  }

  getDislikeOpacity(index: number): number {
    if (index !== this.currentIndex) return 0;
    return this.panPosition.x < 0 ? Math.min(Math.abs(this.panPosition.x) / 100, 1) : 0;
  }

  reloadFreelancers(): void {
    if (this.selectedMission) {
      this.loadFreelancers(this.selectedMission.id);
    }
  }
}
