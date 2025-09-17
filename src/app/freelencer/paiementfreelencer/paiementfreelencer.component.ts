import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { trigger, transition, animate, style } from '@angular/animations';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  faCreditCard,
  faArrowRight,
  faPlus,
  faSync,
  faClock,
  faCheckCircle,
  faChartLine,
  faPercent,
  faPlay,
  faPause,
  faStop,
  faExclamationTriangle,
  faInfoCircle,
  faCalendarAlt,
  faDollarSign,
  faUsers,
  faFileInvoiceDollar,
  faMapPin,
  faEye,
  faUser
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { MissionStatut } from '../../models/mission.model';
import { Mission } from '../../models/mission.model';
import { MissionsService } from '../../services/missions.service';
import { AuthService } from '../../services/auth.service';
import { TranchePaiementService } from '../../services/tranche-paiement.service';
import { MissionPaiementSummaryDTO } from '../../models/mission-paiement-summary.dto';
import { StatutTranche } from '../../models/tranche-paiement.model';
import { Utilisateur } from '../../models/utilisateur.model';
import { UtilisateurService } from '../../services/utilisateurs.service';

/**
 * Interface étendue pour l'affichage des missions du freelance, qui inclut le résumé de paiement.
 */
interface MissionFreelanceView extends Mission {
  summary?: MissionPaiementSummaryDTO;
  paidTranches: number;
  totalTranches: number;
  progress: number;
  lastActivity?: string;
  client?: Utilisateur;
  netEarnings: number; // Montant net gagné par le freelance
  totalNetEarnings: number; // Total net de toutes les tranches
} 

@Component({
  selector: 'app-paiementfreelencer',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  templateUrl: './paiementfreelencer.component.html',
  styleUrls: ['./paiementfreelencer.component.scss'],
  animations: [
    trigger('countUp', [
      transition('* => *', [
        animate('800ms ease-out', style({ transform: 'scale(1.05)' })),
        animate('200ms ease-in', style({ transform: 'scale(1)' }))
      ])
    ])
  ]
})
export class PaiementfreelencerComponent implements OnInit {
  // Icônes principales
  faCreditCard = faCreditCard;
  faArrowRight = faArrowRight;
  faPlus = faPlus;
  faSync = faSync;
  faClock = faClock;
  faCheckCircle = faCheckCircle;
  faChartLine = faChartLine;
  faPercent = faPercent;
  faCalendarAlt = faCalendarAlt;
  faDollarSign = faDollarSign;
  faUsers = faUsers;
  faFileInvoiceDollar = faFileInvoiceDollar;
  faMapPin = faMapPin;
  faEye = faEye;
  faUser = faUser;

  // Données
  missions: MissionFreelanceView[] = [];
  isLoading = true;

  // Valeurs animées pour les KPI
  animatedNetEarnings = 0;
  animatedPotentialEarnings = 0;
  animatedCompletedTranches = 0;
  animatedAverageProgress = 0;

  // Données historiques pour calculer les tendances
  private previousData = {
    netEarnings: 0,
    completedTranches: 0,
    averageProgress: 0,
    timestamp: Date.now()
  };

  constructor(
    private missionService: MissionsService,
    private authService: AuthService,
    private paiementService: TranchePaiementService,
    private utilisateurService: UtilisateurService
  ) {}

  ngOnInit(): void {
    this.loadMissionsWithSummaries();
  }

  /**
   * Charge les missions du freelance et, pour chacune, le résumé des paiements.
   */
  loadMissionsWithSummaries(): void {
    const freelanceId = this.authService.snapshot?.id;
    if (!freelanceId) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.missionService.getMissionsByFreelance(freelanceId).subscribe({
      next: (missions) => {
        // Enrichir les missions avec les informations client
        this.enrichMissionsWithClientInfo(missions);
      },
      error: () => {
        this.isLoading = false;
        // Gérer l'erreur (ex: toast)
      },
    });
  }

  /**
   * Enrichit les missions avec les informations client et les résumés de paiement.
   */
  private enrichMissionsWithClientInfo(missions: Mission[]): void {
    if (missions.length === 0) {
      this.missions = [];
      this.isLoading = false;
      return;
    }

    // Créer les vues de base
    const missionViews: MissionFreelanceView[] = missions.map((m) => ({
      ...m,
      paidTranches: 0,
      totalTranches: 0,
      progress: 0,
      lastActivity: this.generateLastActivity(),
      netEarnings: 0,
      totalNetEarnings: 0,
    }));

    // Charger les informations client pour chaque mission
    const clientRequests = missions.map((mission) => {
      const clientId = (mission as any).clientId ?? (mission as any).client?.id;
      return clientId 
        ? this.utilisateurService.getUtilisateurById(clientId).pipe(
            // En cas d'erreur, retourner null
            catchError(() => of(null))
          )
        : of(null);
    });

    forkJoin(clientRequests).subscribe((clients) => {
      // Assigner les clients aux missions
      missionViews.forEach((mission, index) => {
        mission.client = clients[index] || undefined;
      });

      this.missions = missionViews;

      // Charger les résumés de paiement pour chaque mission
      let completedMissions = 0;
      const totalMissions = this.missions.length;

      this.missions.forEach((mission) => {
        this.paiementService.missionSummary(mission.id).subscribe((summary) => {
          console.group(`[PaiementFreelance] Mission ${mission.id} - ${mission.titre}`);
          console.log('📊 Résumé reçu du backend:', summary);
          console.log('📋 Tranches reçues (avant nettoyage):', summary.tranches);
          
          // Nettoyer les doublons dès le début
          const cleanTranches = this.removeDuplicateTranches(summary.tranches);
          console.log('🧹 Tranches après nettoyage des doublons:', cleanTranches);
          
          // Mettre à jour le résumé avec les tranches nettoyées
          mission.summary = { ...summary, tranches: cleanTranches };
          mission.totalTranches = cleanTranches.length;
          
          // Calculer les tranches versées avec les données nettoyées
          mission.paidTranches = this.countPaidTranchesSafely(cleanTranches);
          console.log('💰 Nombre de tranches versées (nettoyé):', mission.paidTranches);
          
          mission.progress =
            mission.totalTranches > 0
              ? (mission.paidTranches / mission.totalTranches) * 100
              : 0;

          // Calculer les gains nets avec les données nettoyées
          mission.netEarnings = this.calculateNetEarningsSafely(cleanTranches);
          console.log('💵 Gains nets (nettoyé):', mission.netEarnings);
          
          mission.totalNetEarnings = cleanTranches
            .reduce((sum, t) => sum + t.montantNetFreelance, 0);
          
          console.log('📈 Progression:', mission.progress + '%');
          console.log('💵 Total net potentiel:', mission.totalNetEarnings);
          console.groupEnd();

          completedMissions++;
          
          // Quand toutes les missions sont chargées, déclencher les animations
          if (completedMissions === totalMissions) {
            this.isLoading = false;
            // Délai pour permettre au DOM de se mettre à jour
            setTimeout(() => {
              this.animateKPIValues();
              this.updatePreviousData();
            }, 300);
          }
        });
      });
      
      // Si aucune mission, arrêter le loading immédiatement
      if (totalMissions === 0) {
        this.isLoading = false;
      }
    });
  }

  /**
   * Retourne la classe CSS correspondant au statut de la mission.
   */
  getBadgeClass(statut: MissionStatut): string {
    switch (statut) {
      case MissionStatut.EN_COURS:
        return 'badge-blue';
      case MissionStatut.TERMINEE:
        return 'badge-green';
      case MissionStatut.EN_ATTENTE:
        return 'badge-yellow';
      case MissionStatut.EN_ATTENTE_VALIDATION:
        return 'badge-yellow';
      case MissionStatut.ANNULEE:
        return 'badge-gray';
      case MissionStatut.EXPIREE:
        return 'badge-gray';
      default:
        return 'badge-gray';
    }
  }

  /**
   * Retourne l'icône correspondant au statut de la mission.
   */
  getBadgeIcon(statut: MissionStatut): any {
    switch (statut) {
      case MissionStatut.EN_COURS:
        return faPlay;
      case MissionStatut.TERMINEE:
        return faCheckCircle;
      case MissionStatut.EN_ATTENTE:
      case MissionStatut.EN_ATTENTE_VALIDATION:
        return faPause;
      case MissionStatut.ANNULEE:
      case MissionStatut.EXPIREE:
        return faExclamationTriangle;
      default:
        return faInfoCircle;
    }
  }

  /**
   * Retourne l'icône pour l'indicateur de statut.
   */
  getStatusIcon(statut: MissionStatut): any {
    switch (statut) {
      case MissionStatut.EN_COURS:
        return faPlay;
      case MissionStatut.TERMINEE:
        return faCheckCircle;
      case MissionStatut.EN_ATTENTE:
      case MissionStatut.EN_ATTENTE_VALIDATION:
        return faPause;
      case MissionStatut.ANNULEE:
      case MissionStatut.EXPIREE:
        return faExclamationTriangle;
      default:
        return faInfoCircle;
    }
  }

  /**
   * Retourne la classe CSS pour l'indicateur de statut.
   */
  getStatusIndicatorClass(statut: MissionStatut): string {
    switch (statut) {
      case MissionStatut.EN_COURS:
        return 'status-active';
      case MissionStatut.TERMINEE:
        return 'status-completed';
      case MissionStatut.EN_ATTENTE:
      case MissionStatut.EN_ATTENTE_VALIDATION:
        return 'status-pending';
      case MissionStatut.ANNULEE:
      case MissionStatut.EXPIREE:
        return 'status-default';
      default:
        return 'status-default';
    }
  }

  /**
   * Formate le statut pour l'affichage.
   */
  formatStatut(statut: MissionStatut): string {
    return statut.replace(/_/g, ' ').toLowerCase();
  }

  /**
   * Génère une activité récente simulée.
   */
  generateLastActivity(): string {
    const activities = [
      'Il y a 2 heures',
      'Hier',
      'Il y a 3 jours',
      'Cette semaine',
      'Il y a 1 semaine'
    ];
    return activities[Math.floor(Math.random() * activities.length)];
  }

  /**
   * Retourne la dernière activité pour une mission.
   */
  getLastActivity(mission: MissionFreelanceView): string {
    return mission.lastActivity || 'Récemment';
  }

  /**
   * Génère un tableau d'étapes pour la barre de progression.
   */
  getProgressSteps(totalTranches: number): number[] {
    return Array.from({ length: totalTranches }, (_, i) => i);
  }

  /**
   * Calcule le montant total net gagné par le freelance.
   */
  getTotalNetEarnings(): number {
    return this.missions.reduce((total, mission) => {
      return total + mission.netEarnings;
    }, 0);
  }

  /**
   * Calcule le montant total net potentiel (toutes les tranches).
   */
  getTotalPotentialEarnings(): number {
    return this.missions.reduce((total, mission) => {
      return total + mission.totalNetEarnings;
    }, 0);
  }

  /**
   * Calcule le nombre total de tranches payées.
   */
  getCompletedTranches(): number {
    return this.missions.reduce((total, mission) => {
      return total + mission.paidTranches;
    }, 0);
  }

  /**
   * Calcule la progression moyenne de toutes les missions.
   */
  getAverageProgress(): number {
    if (this.missions.length === 0) return 0;
    
    const totalProgress = this.missions.reduce((total, mission) => {
      return total + mission.progress;
    }, 0);
    
    return totalProgress / this.missions.length;
  }

  /**
   * Rafraîchit la liste des missions.
   */
  refreshMissions(): void {
    this.loadMissionsWithSummaries();
  }

  /**
   * TrackBy function pour optimiser les performances de la liste.
   */
  trackByMissionId(index: number, mission: MissionFreelanceView): number {
    return mission.id;
  }

  /**
   * Obtient l'URL de la photo du client.
   */
  getClientPhotoUrl(client: Utilisateur | undefined): string {
    if (client && client.photoProfilUrl) {
      return client.photoProfilUrl;
    }
    return 'assets/default-avatar.png'; // Image par défaut
  }

  /**
   * Obtient le nom complet du client.
   */
  getClientFullName(client: Utilisateur | undefined): string {
    if (!client) return 'Client inconnu';
    return `${client.prenom || ''} ${client.nom || ''}`.trim() || 'Client';
  }

  /**
   * Nettoie les tranches en supprimant les doublons par ID.
   * Utile pour corriger les problèmes de données du backend.
   */
  private removeDuplicateTranches(tranches: any[]): any[] {
    const seen = new Set();
    return tranches.filter(tranche => {
      if (seen.has(tranche.id)) {
        console.warn(`[PaiementFreelance] Doublon détecté et supprimé: Tranche ID ${tranche.id}`);
        return false;
      }
      seen.add(tranche.id);
      return true;
    });
  }

  /**
   * Calcule les gains nets en évitant les doublons.
   */
  private calculateNetEarningsSafely(tranches: any[]): number {
    const uniqueTranches = this.removeDuplicateTranches(tranches);
    return uniqueTranches
      .filter(t => t.statut === StatutTranche.VERSEE_FREELANCE)
      .reduce((sum, t) => sum + t.montantNetFreelance, 0);
  }

  /**
   * Compte les tranches versées en évitant les doublons.
   */
  private countPaidTranchesSafely(tranches: any[]): number {
    const uniqueTranches = this.removeDuplicateTranches(tranches);
    return uniqueTranches.filter(t => t.statut === StatutTranche.VERSEE_FREELANCE).length;
  }

  // === MÉTHODES DYNAMIQUES POUR LES KPI ===

  /**
   * Anime les valeurs des KPI
   */
  private animateKPIValues(): void {
    const targetNetEarnings = this.getTotalNetEarnings();
    const targetPotentialEarnings = this.getTotalPotentialEarnings();
    const targetCompletedTranches = this.getCompletedTranches();
    const targetAverageProgress = this.getAverageProgress();

    // Animation des gains nets
    this.animateValue('animatedNetEarnings', targetNetEarnings, 1000);
    
    // Animation du potentiel total
    this.animateValue('animatedPotentialEarnings', targetPotentialEarnings, 1200);
    
    // Animation des tranches complétées
    this.animateValue('animatedCompletedTranches', targetCompletedTranches, 800);
    
    // Animation de la progression moyenne
    this.animateValue('animatedAverageProgress', targetAverageProgress, 1000);
  }

  /**
   * Anime une valeur numérique
   */
  private animateValue(property: string, target: number, duration: number): void {
    const start = (this as any)[property];
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = start + (target - start) * easeOut;
      
      (this as any)[property] = Math.round(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }

  /**
   * Calcule le nombre de missions actives
   */
  getActiveMissionsCount(): number {
    return this.missions.filter(m => 
      m.statut === 'EN_COURS' || 
      m.statut === 'EN_ATTENTE_VALIDATION' ||
      m.statut === 'PRET_A_CLOTURER'
    ).length;
  }

  // === MÉTHODES POUR LES TENDANCES DYNAMIQUES ===

  /**
   * Obtient la classe CSS pour la tendance des gains
   */
  getEarningsTrendClass(): string {
    const current = this.getTotalNetEarnings();
    const previous = this.previousData.netEarnings;
    
    if (current > previous) return 'positive';
    if (current < previous) return 'negative';
    return 'neutral';
  }

  /**
   * Obtient l'icône pour la tendance des gains
   */
  getEarningsTrendIcon(): any {
    const current = this.getTotalNetEarnings();
    const previous = this.previousData.netEarnings;
    
    if (current > previous) return faChartLine;
    if (current < previous) return faChartLine;
    return faClock;
  }

  /**
   * Obtient le texte pour la tendance des gains
   */
  getEarningsTrendText(): string {
    const current = this.getTotalNetEarnings();
    const previous = this.previousData.netEarnings;
    const diff = current - previous;
    
    if (diff > 0) {
      const percentage = previous > 0 ? ((diff / previous) * 100).toFixed(1) : '100';
      return `+${percentage}% cette semaine`;
    } else if (diff < 0) {
      const percentage = previous > 0 ? ((Math.abs(diff) / previous) * 100).toFixed(1) : '0';
      return `-${percentage}% cette semaine`;
    }
    return 'Stable cette semaine';
  }

  /**
   * Obtient la classe CSS pour la tendance des tranches
   */
  getTranchesTrendClass(): string {
    const current = this.getCompletedTranches();
    const previous = this.previousData.completedTranches;
    
    if (current > previous) return 'positive';
    if (current < previous) return 'negative';
    return 'neutral';
  }

  /**
   * Obtient l'icône pour la tendance des tranches
   */
  getTranchesTrendIcon(): any {
    const current = this.getCompletedTranches();
    const previous = this.previousData.completedTranches;
    
    if (current > previous) return faArrowRight;
    if (current < previous) return faArrowRight;
    return faClock;
  }

  /**
   * Obtient le texte pour la tendance des tranches
   */
  getTranchesTrendText(): string {
    const current = this.getCompletedTranches();
    const previous = this.previousData.completedTranches;
    const diff = current - previous;
    
    if (diff > 0) {
      return `+${diff} cette semaine`;
    } else if (diff < 0) {
      return `${diff} cette semaine`;
    }
    return 'Stable cette semaine';
  }

  /**
   * Obtient la classe CSS pour la tendance de progression
   */
  getProgressTrendClass(): string {
    const current = this.getAverageProgress();
    const previous = this.previousData.averageProgress;
    
    if (current > previous) return 'positive';
    if (current < previous) return 'negative';
    return 'neutral';
  }

  /**
   * Obtient l'icône pour la tendance de progression
   */
  getProgressTrendIcon(): any {
    const current = this.getAverageProgress();
    const previous = this.previousData.averageProgress;
    
    if (current > previous) return faChartLine;
    if (current < previous) return faChartLine;
    return faClock;
  }

  /**
   * Obtient le texte pour la tendance de progression
   */
  getProgressTrendText(): string {
    const current = this.getAverageProgress();
    const previous = this.previousData.averageProgress;
    const diff = current - previous;
    
    if (diff > 0) {
      return `+${diff.toFixed(1)}% cette semaine`;
    } else if (diff < 0) {
      return `${diff.toFixed(1)}% cette semaine`;
    }
    return 'Stable cette semaine';
  }

  /**
   * Met à jour les données précédentes pour le calcul des tendances
   */
  private updatePreviousData(): void {
    this.previousData = {
      netEarnings: this.getTotalNetEarnings(),
      completedTranches: this.getCompletedTranches(),
      averageProgress: this.getAverageProgress(),
      timestamp: Date.now()
    };
  }
}
