import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
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
  faMapPin
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { MissionStatut } from '../../models/mission.model';
import { MissionCard } from '../../models/mission-card.model';
import { MissionsService } from '../../services/missions.service';
import { AuthService } from '../../services/auth.service';
import { TranchePaiementService } from '../../services/tranche-paiement.service';
import { MissionPaiementSummaryDTO } from '../../models/mission-paiement-summary.dto';
import { StatutTranche } from '../../models/tranche-paiement.model';

/**
 * Interface étendue pour l'affichage, qui inclut le résumé de paiement.
 */
interface MissionView extends MissionCard {
  summary?: MissionPaiementSummaryDTO;
  paidTranches: number;
  totalTranches: number;
  progress: number;
  lastActivity?: string;
}

@Component({
  selector: 'app-paiementclient',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  templateUrl: './paiementclient.component.html',
  styleUrls: ['./paiementclient.component.scss'],
})
export class PaiementclientComponent implements OnInit {
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

  // Données
  missions: MissionView[] = [];
  isLoading = true;

  constructor(
    private missionService: MissionsService,
    private authService: AuthService,
    private paiementService: TranchePaiementService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadMissionsWithSummaries();
    
    // Vérifier les paramètres de requête pour sélectionner une mission/tranche spécifique
    this.route.queryParams.subscribe(params => {
      if (params['missionId']) {
        const missionId = parseInt(params['missionId']);
        console.log('[PaiementClient] Mission spécifique demandée:', {
          missionId: missionId,
          missionTitle: params['missionTitle'],
          trancheId: params['trancheId'],
          category: params['category'],
          budget: params['budget']
        });
        
        // Attendre que les missions soient chargées, puis sélectionner la mission spécifique
        setTimeout(() => {
          const specificMission = this.missions.find(m => m.id === missionId);
          if (specificMission) {
            console.log('[PaiementClient] Mission spécifique trouvée:', specificMission);
            this.selectMissionAndTranche(specificMission, params['trancheId']);
          } else {
            console.warn('[PaiementClient] Mission spécifiée non trouvée:', missionId);
          }
        }, 1000); // Délai pour laisser le temps aux missions de se charger
      }
    });
  }

  /**
   * Charge les missions du client et, pour chacune, le résumé des paiements.
   */
  loadMissionsWithSummaries(): void {
    const clientId = this.authService.snapshot?.id;
    if (!clientId) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.missionService.getMissionsByClient(clientId).subscribe({
      next: (missions) => {
        const missionViews: MissionView[] = missions.map((m) => ({
          ...m,
          paidTranches: 0,
          totalTranches: 0,
          progress: 0,
          lastActivity: this.generateLastActivity(),
        }));
        this.missions = missionViews;

        // Pour chaque mission, on charge le résumé de paiement
        this.missions.forEach((mission) => {
          this.paiementService.missionSummary(mission.id).subscribe((summary) => {
            mission.summary = summary;
            mission.totalTranches = summary.tranches.length;
            mission.paidTranches = summary.tranches.filter(
              (t) => t.statut === StatutTranche.VERSEE_FREELANCE
            ).length;
            mission.progress =
              mission.totalTranches > 0
                ? (mission.paidTranches / mission.totalTranches) * 100
                : 0;
          });
        });
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        // Gérer l'erreur (ex: toast)
      },
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
  getLastActivity(mission: MissionView): string {
    return mission.lastActivity || 'Récemment';
  }

  /**
   * Génère un tableau d'étapes pour la barre de progression.
   */
  getProgressSteps(totalTranches: number): number[] {
    return Array.from({ length: totalTranches }, (_, i) => i);
  }

  /**
   * Calcule le montant total de toutes les missions.
   */
  getTotalAmount(): number {
    return this.missions.reduce((total, mission) => {
      return total + (mission.summary?.totalBrut || 0);
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
   * Lance un paiement direct (Flouci simulation) pour une tranche donnée.
   * - Appelle l'endpoint /v1/tranches/{id}/payer-direct
   * - Ouvre l'URL retournée (simulation page) dans un nouvel onglet
   */
  payerTrancheDirect(trancheId: number): void {
    const rawId = this.authService.snapshot?.id;
    const xUserId = typeof rawId === 'number' ? rawId : undefined;
    this.paiementService.payerDirect(trancheId, xUserId).subscribe({
      next: (dto) => {
        this.paiementService.openPaymentUrl(dto);
      },
      error: () => {
        // TODO: afficher un toast d'erreur si besoin
      }
    });
  }

  /**
   * TrackBy function pour optimiser les performances de la liste.
   */
  trackByMissionId(index: number, mission: MissionView): number {
    return mission.id;
  }

  /**
   * Sélectionne automatiquement une mission et une tranche spécifique
   * et déclenche le paiement si une tranche est spécifiée
   */
  selectMissionAndTranche(mission: MissionView, trancheId?: string): void {
    console.log('[PaiementClient] Sélection automatique:', {
      missionId: mission.id,
      missionTitle: mission.titre,
      trancheId: trancheId
    });

    if (trancheId) {
      const trancheIdNumber = parseInt(trancheId);
      console.log('[PaiementClient] Déclenchement automatique du paiement pour tranche:', trancheIdNumber);
      
      // Déclencher automatiquement le paiement de la tranche
      this.payerTrancheDirect(trancheIdNumber);
    } else {
      console.log('[PaiementClient] Aucune tranche spécifiée, navigation vers la mission uniquement');
      // TODO: Implémenter la sélection visuelle de la mission dans l'interface
      // Par exemple, scroller vers la mission ou l'ouvrir automatiquement
    }
  }

}
