import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { trigger, transition, animate, style } from '@angular/animations';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  faArrowLeft,
  faCreditCard,
  faCheckCircle,
  faClock,
  faExclamationTriangle,
  faInfoCircle,
  faPlay,
  faPause,
  faStop,
  faChartLine,
  faPercent,
  faDollarSign,
  faCalendarAlt,
  faUser,
  faFileInvoiceDollar,
  faEye,
  faDownload,
  faHistory,
  faBell,
  faMoneyBillWave,
  faArrowUp,
  faList,
  faLayerGroup
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
 * Interface pour les données enrichies de la mission
 */
interface MissionDetailView extends Mission {
  summary?: MissionPaiementSummaryDTO;
  client?: Utilisateur;
  paidTranches: number;
  totalTranches: number;
  progress: number;
  netEarnings: number;
  totalNetEarnings: number;
  // Données simulées pour enrichir l'expérience
  estimatedCompletion?: string;
  nextMilestone?: string;
  lastActivity?: string;
  contractDetails?: {
    startDate: string;
    estimatedDuration: string;
    deliverables: string[];
  };
}

/**
 * Interface pour l'historique des actions (simulé)
 */
interface ActionHistory {
  id: number;
  date: string;
  action: string;
  description: string;
  status: 'completed' | 'pending' | 'in_progress';
  icon: any;
}

@Component({
  selector: 'app-mission-detail-freelancer',
  standalone: true,
  imports: [CommonModule, RouterModule, FontAwesomeModule],
  templateUrl: './mission-detail-freelancer.component.html',
  styleUrls: ['./mission-detail-freelancer.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.3s ease-in', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class MissionDetailFreelancerComponent implements OnInit {
  // Icônes
  faArrowLeft = faArrowLeft;
  faCreditCard = faCreditCard;
  faCheckCircle = faCheckCircle;
  faClock = faClock;
  faExclamationTriangle = faExclamationTriangle;
  faInfoCircle = faInfoCircle;
  faPlay = faPlay;
  faPause = faPause;
  faStop = faStop;
  faChartLine = faChartLine;
  faPercent = faPercent;
  faDollarSign = faDollarSign;
  faCalendarAlt = faCalendarAlt;
  faUser = faUser;
  faFileInvoiceDollar = faFileInvoiceDollar;
  faEye = faEye;
  faDownload = faDownload;
  faHistory = faHistory;
  faBell = faBell;
  faMoneyBillWave = faMoneyBillWave;
  faArrowUp = faArrowUp;
  faList = faList;
  faLayerGroup = faLayerGroup;

  // Données
  mission: MissionDetailView | null = null;
  isLoading = true;
  error: string | null = null;
  actionHistory: ActionHistory[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private missionService: MissionsService,
    private authService: AuthService,
    private paiementService: TranchePaiementService,
    private utilisateurService: UtilisateurService
  ) {}

  ngOnInit(): void {
    const missionId = this.route.snapshot.paramMap.get('id');
    if (missionId) {
      this.loadMissionDetails(parseInt(missionId));
    } else {
      this.error = 'ID de mission manquant';
      this.isLoading = false;
    }
  }

  /**
   * Charge les détails complets de la mission
   */
  loadMissionDetails(missionId: number): void {
    const freelanceId = this.authService.snapshot?.id;
    if (!freelanceId) {
      this.error = 'Utilisateur non authentifié';
      this.isLoading = false;
      return;
    }

    this.isLoading = true;

    // Charger la mission et le résumé de paiement en parallèle
    forkJoin({
      mission: this.missionService.getFreelancerMissionDetailView(missionId, freelanceId),
      summary: this.paiementService.missionSummary(missionId).pipe(
        catchError(() => of(null))
      )
    }).subscribe({
      next: ({ mission, summary }) => {
        this.enrichMissionData(mission, summary);
        this.generateActionHistory();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement de la mission:', error);
        this.error = 'Erreur lors du chargement de la mission';
        this.isLoading = false;
      }
    });
  }

  /**
   * Enrichit les données de la mission avec les informations client et les données simulées
   */
  private enrichMissionData(mission: any, summary: MissionPaiementSummaryDTO | null): void {
    // Créer la vue enrichie
    const missionView: MissionDetailView = {
      ...mission,
      summary: summary,
      paidTranches: 0,
      totalTranches: 0,
      progress: 0,
      netEarnings: 0,
      totalNetEarnings: 0,
      estimatedCompletion: this.generateEstimatedCompletion(),
      nextMilestone: this.generateNextMilestone(),
      lastActivity: this.generateLastActivity(),
      contractDetails: this.generateContractDetails()
    };

    // Calculer les statistiques de paiement
    if (summary && summary.tranches) {
      const cleanTranches = this.removeDuplicateTranches(summary.tranches);
      missionView.totalTranches = cleanTranches.length;
      missionView.paidTranches = cleanTranches.filter(t => t.statut === StatutTranche.VERSEE_FREELANCE).length;
      missionView.progress = missionView.totalTranches > 0 
        ? (missionView.paidTranches / missionView.totalTranches) * 100 
        : 0;
      missionView.netEarnings = this.calculateNetEarnings(cleanTranches);
      missionView.totalNetEarnings = cleanTranches.reduce((sum, t) => sum + t.montantNetFreelance, 0);
    }

    // Charger les informations client
    const clientId = mission.clientId || mission.client?.id;
    if (clientId) {
      this.utilisateurService.getUtilisateurById(clientId).pipe(
        catchError(() => of(null))
      ).subscribe(client => {
        missionView.client = client ?? undefined;
        this.mission = missionView;
      });
    } else {
      this.mission = missionView;
    }
  }

  /**
   * Génère l'historique des actions (simulé)
   */
  private generateActionHistory(): void {
    if (!this.mission) return;

    const baseActions: ActionHistory[] = [
      {
        id: 1,
        date: this.mission.datePublication,
        action: 'Mission créée',
        description: 'La mission a été créée par le client',
        status: 'completed',
        icon: faCheckCircle
      },
      {
        id: 2,
        date: this.addDays(this.mission.datePublication, 1),
        action: 'Affectation acceptée',
        description: 'Vous avez accepté cette mission',
        status: 'completed',
        icon: faCheckCircle
      }
    ];

    // Ajouter des actions basées sur les tranches
    if (this.mission.summary && this.mission.summary.tranches) {
      this.mission.summary.tranches.forEach((tranche, index) => {
        baseActions.push({
          id: baseActions.length + 1,
          date: this.addDays(this.mission!.datePublication, (index + 1) * 7),
          action: `Tranche ${index + 1}`,
          description: tranche.statut === StatutTranche.VERSEE_FREELANCE 
            ? `Tranche de ${tranche.montantNetFreelance} TND versée`
            : `Tranche de ${tranche.montantNetFreelance} TND en attente`,
          status: tranche.statut === StatutTranche.VERSEE_FREELANCE ? 'completed' : 'pending',
          icon: tranche.statut === StatutTranche.VERSEE_FREELANCE ? faCheckCircle : faClock
        });
      });
    }

    // Ajouter une action finale si la mission est terminée
    if (this.mission.statut === MissionStatut.TERMINEE) {
      baseActions.push({
        id: baseActions.length + 1,
        date: this.addDays(this.mission.datePublication, 30),
        action: 'Mission terminée',
        description: 'La mission a été clôturée avec succès',
        status: 'completed',
        icon: faCheckCircle
      });
    }

    this.actionHistory = baseActions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Génère une date d'achèvement estimée (simulé)
   */
  private generateEstimatedCompletion(): string {
    const days = Math.floor(Math.random() * 30) + 15; // 15-45 jours
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString('fr-FR');
  }

  /**
   * Génère le prochain jalon (simulé)
   */
  private generateNextMilestone(): string {
    const milestones = [
      'Livraison de la première version',
      'Révision des spécifications',
      'Tests et validation',
      'Livraison finale',
      'Documentation technique'
    ];
    return milestones[Math.floor(Math.random() * milestones.length)];
  }

  /**
   * Génère la dernière activité (simulé)
   */
  private generateLastActivity(): string {
    const activities = [
      'Il y a 2 heures',
      'Hier',
      'Il y a 3 jours',
      'Cette semaine'
    ];
    return activities[Math.floor(Math.random() * activities.length)];
  }

  /**
   * Génère les détails du contrat (simulé)
   */
  private generateContractDetails(): any {
    return {
      startDate: new Date().toLocaleDateString('fr-FR'),
      estimatedDuration: `${Math.floor(Math.random() * 4) + 2} semaines`,
      deliverables: [
        'Code source complet',
        'Documentation technique',
        'Tests unitaires',
        'Guide d\'installation'
      ]
    };
  }

  /**
   * Calcule les gains nets
   */
  private calculateNetEarnings(tranches: any[]): number {
    return tranches
      .filter(t => t.statut === StatutTranche.VERSEE_FREELANCE)
      .reduce((sum, t) => sum + t.montantNetFreelance, 0);
  }

  /**
   * Nettoie les doublons de tranches
   */
  private removeDuplicateTranches(tranches: any[]): any[] {
    const seen = new Set();
    return tranches.filter(tranche => {
      if (seen.has(tranche.id)) {
        return false;
      }
      seen.add(tranche.id);
      return true;
    });
  }

  /**
   * Ajoute des jours à une date
   */
  private addDays(dateString: string, days: number): string {
    const date = new Date(dateString);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  /**
   * Retourne la classe CSS pour le statut
   */
  getStatusClass(statut: MissionStatut): string {
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
        return 'status-cancelled';
      default:
        return 'status-default';
    }
  }

  /**
   * Retourne l'icône pour le statut
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
   * Retourne la classe CSS pour le statut de tranche
   */
  getTrancheStatusClass(statut: StatutTranche): string {
    switch (statut) {
      case StatutTranche.VERSEE_FREELANCE:
        return 'tranche-paid';
      case StatutTranche.EN_ATTENTE_DEPOT:
      case StatutTranche.EN_ATTENTE_PAIEMENT:
      case StatutTranche.EN_ATTENTE_VALIDATION:
        return 'tranche-pending';
      default:
        return 'tranche-default';
    }
  }

  /**
   * Retourne l'icône pour le statut de tranche
   */
  getTrancheStatusIcon(statut: StatutTranche): any {
    switch (statut) {
      case StatutTranche.VERSEE_FREELANCE:
        return faCheckCircle;
      case StatutTranche.EN_ATTENTE_DEPOT:
      case StatutTranche.EN_ATTENTE_PAIEMENT:
      case StatutTranche.EN_ATTENTE_VALIDATION:
        return faClock;
      default:
        return faInfoCircle;
    }
  }

  /**
   * Formate le statut pour l'affichage
   */
  formatStatut(statut: MissionStatut): string {
    return statut.replace(/_/g, ' ').toLowerCase();
  }

  /**
   * Retourne à la page précédente
   */
  goBack(): void {
    this.router.navigate(['/freelencer/paiements']);
  }
}
