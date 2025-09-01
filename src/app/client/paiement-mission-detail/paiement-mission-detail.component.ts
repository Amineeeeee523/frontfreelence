import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  faPlus,
  faCreditCard,
  faCheckCircle,
  faHourglassHalf,
  faFileInvoiceDollar,
  faArrowLeft,
  faTimesCircle,
  faExclamationCircle,
  faEye,
  faChevronUp,
  faChevronDown,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranchePaiementService } from '../../services/tranche-paiement.service';
import { MissionsService } from '../../services/missions.service';
import { MissionPaiementSummaryDTO } from '../../models/mission-paiement-summary.dto';
import {
  StatutTranche,
  TranchePaiement,
} from '../../models/tranche-paiement.model';
import { TranchePaiementResponseDTO } from '../../models/tranche-paiement-response.dto';
import { TranchePaiementCreateDTO } from '../../models/tranche-paiement-create.dto';
import { Devise } from '../../models';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-paiement-mission-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FontAwesomeModule],
  templateUrl: './paiement-mission-detail.component.html',
  styleUrls: ['./paiement-mission-detail.component.scss'],
})
export class PaiementMissionDetailComponent implements OnInit {
  // Icônes
  faPlus = faPlus;
  faArrowLeft = faArrowLeft;
  faCreditCard = faCreditCard;
  faCheckCircle = faCheckCircle;
  faEye = faEye;
  faExclamationCircle = faExclamationCircle;
  faChevronUp = faChevronUp;
  faChevronDown = faChevronDown;

  // Données
  missionSummary: MissionPaiementSummaryDTO | null = null;
  isLoading = true;
  showSettings = false; // Pour l'accordéon des paramètres

  // État pour le modal d'ajout
  isAddTrancheModalOpen = false;
  newTranche: TranchePaiementCreateDTO = {
    ordre: 0,
    titre: '',
    montantBrut: 0,
    devise: Devise.TND,
    missionId: 0,
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paiementService: TranchePaiementService,
    private authService: AuthService,
    private missionsService: MissionsService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const missionId = Number(params.get('id'));
      if (missionId) {
        this.newTranche.missionId = missionId;
        this.loadMissionSummary(missionId);
      }
    });
  }

  loadMissionSummary(missionId: number): void {
    this.isLoading = true;
    this.paiementService.missionSummary(missionId).subscribe({
      next: (summary) => {
        this.missionSummary = summary;
        // Trier les tranches par ordre
        this.missionSummary.tranches.sort((a, b) => a.ordre - b.ordre);
        
        // 🔍 LOGS DÉTAILLÉS POUR CHAQUE TRANCHE
        console.group(`[PaiementDetail] Mission ${missionId} - Détails des tranches`);
        console.log('📊 Résumé mission:', {
          missionId: summary.missionId,
          titreMission: summary.titreMission,
          totalBrut: summary.totalBrut,
          totalCommission: summary.totalCommission,
          totalNetFreelance: summary.totalNetFreelance,
          closurePolicy: summary.closurePolicy,
          nombreTranches: summary.tranches.length
        });
        
        summary.tranches.forEach((tranche, index) => {
          console.log(`💰 Tranche ${index + 1} (ID: ${tranche.id}):`, {
            ordre: tranche.ordre,
            titre: tranche.titre,
            montantBrut: tranche.montantBrut,
            montantNetFreelance: tranche.montantNetFreelance,
            commissionPlateforme: tranche.commissionPlateforme,
            statut: tranche.statut,
            devise: tranche.devise,
            dateCreation: tranche.dateCreation,
            // 🔍 Indicateurs de la tranche
            required: tranche.required,
            finale: tranche.finale,
            // 🔍 ID du livrable associé (si existant)
            livrableAssocieId: tranche.livrableAssocieId,
            // 🔍 URLs de paiement
            paymeePaymentUrl: tranche.paymeePaymentUrl
          });
        });
        console.groupEnd();
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('[PaiementDetail] Erreur lors du chargement du résumé:', err);
        this.isLoading = false;
      },
    });
  }

  // --- Nouvelles méthodes pour le header sticky ---

  /**
   * Calcule le pourcentage payé pour l'affichage dans le header
   */
  getPaidPercentage(): number {
    if (!this.missionSummary || this.missionSummary.totalBrut === 0) return 0;
    
    const paidAmount = this.missionSummary.tranches
      .filter(t => t.statut === StatutTranche.VERSEE_FREELANCE)
      .reduce((sum, t) => sum + t.montantBrut, 0);
    
    return (paidAmount / this.missionSummary.totalBrut) * 100;
  }

  /**
   * Détermine si on peut payer le freelance (tranches en attente)
   */
  canPayFreelancer(): boolean {
    if (!this.missionSummary) return false;
    
    return this.missionSummary.tranches.some(t => 
      t.statut === StatutTranche.EN_ATTENTE_DEPOT || 
      t.statut === StatutTranche.EN_ATTENTE_PAIEMENT
    );
  }

  /**
   * Détermine si on peut clôturer la mission
   */
  canCloseMission(): boolean {
    if (!this.missionSummary) return false;
    
    return (this.missionSummary.allRequiredPaidAndAccepted ?? false) && 
           (this.isManualPolicy ? !this.missionSummary.closedByClient : true);
  }

  /**
   * Action pour payer le freelance (ouvre la première tranche disponible)
   */
  payFreelancer(): void {
    if (!this.missionSummary) return;
    
    const pendingTranche = this.missionSummary.tranches.find(t => 
      t.statut === StatutTranche.EN_ATTENTE_DEPOT || 
      t.statut === StatutTranche.EN_ATTENTE_PAIEMENT
    );
    
    if (pendingTranche) {
      this.payTranche(pendingTranche.id);
    }
  }

  /**
   * Action pour clôturer la mission
   */
  closeMission(): void {
    if (!this.missionSummary) return;
    
    if (this.isManualPolicy) {
      this.confirmCloseAsClient();
    } else {
      // Pour les autres policies, afficher un message d'info
      alert('La mission sera clôturée automatiquement une fois toutes les conditions remplies.');
    }
  }

  /**
   * Retourne la classe CSS pour le statut de la mission
   */
  getStatusClass(): string {
    if (!this.missionSummary) return 'status-default';
    
    if (this.missionSummary.allRequiredPaidAndAccepted) {
      return 'status-ready';
    } else {
      return 'status-pending';
    }
  }

  /**
   * Retourne le texte du statut de la mission
   */
  getStatusText(): string {
    if (!this.missionSummary) return 'Chargement...';
    
    if (this.missionSummary.allRequiredPaidAndAccepted) {
      return 'Prêt à clôturer';
    } else {
      return 'En cours';
    }
  }

  /**
   * Toggle pour l'accordéon des paramètres
   */
  toggleSettings(): void {
    this.showSettings = !this.showSettings;
  }

  // --- Actions sur les tranches ---

  handleTrancheAction(tranche: TranchePaiementResponseDTO): void {
    switch (tranche.statut) {
      case StatutTranche.EN_ATTENTE_DEPOT:
      case StatutTranche.EN_ATTENTE_PAIEMENT:
        this.payTranche(tranche.id);
        break;
      case StatutTranche.EN_ATTENTE_VALIDATION:
        this.validateTranche(tranche.id);
        break;
      // Ajoutez d'autres cas si nécessaire (ex: voir détails)
    }
  }

  payTranche(trancheId: number): void {
    const rawId = this.authService.snapshot?.id;
    const xUserId = typeof rawId === 'number' ? rawId : undefined;
    
    // 🔍 LOGS POUR LE PAIEMENT
    console.group('[PaiementDetail] Paiement de tranche');
    console.log('💳 Paiement tranche:', {
      trancheId: trancheId,
      clientId: rawId,
      xUserId: xUserId
    });
    
    // Trouver les détails de la tranche pour plus d'infos
    const tranche = this.missionSummary?.tranches.find(t => t.id === trancheId);
    if (tranche) {
      console.log('💰 Détails de la tranche:', {
        titre: tranche.titre,
        montantBrut: tranche.montantBrut,
        statut: tranche.statut,
        ordre: tranche.ordre
      });
    }
    console.groupEnd();
    
    this.paiementService.payerDirect(trancheId, xUserId).subscribe({
      next: (response) => {
        this.paiementService.openPaymentUrl(response);
      },
      error: (err) => {
        console.error('Erreur lors du paiement direct:', err);
        // Récupérer le message renvoyé par le back s'il existe
        const serverMsg = typeof err?.error === 'string' ? err.error
                         : err?.error?.message || null;
        const message = serverMsg || 'Erreur lors du paiement. Veuillez réessayer.';
        alert(message);
      },
    });
  }

  validateTranche(trancheId: number): void {
    // Confirmer avec l'utilisateur avant de valider
    if (confirm('Êtes-vous sûr de vouloir valider ce livrable ? Les fonds seront débloqués pour le freelance.')) {
      this.paiementService.validateDeliverable(trancheId).subscribe({
        next: () => {
          this.loadMissionSummary(this.newTranche.missionId); // Recharger
        },
        error: (err) => console.error(err),
      });
    }
  }

  // --- Gestion du modal d'ajout ---

  openAddTrancheModal(): void {
    this.newTranche.ordre = (this.missionSummary?.tranches.length || 0) + 1;
    this.isAddTrancheModalOpen = true;
  }

  closeAddTrancheModal(): void {
  this.isAddTrancheModalOpen = false;
  // Réinitialiser le formulaire
  this.newTranche.titre = '';
  this.newTranche.montantBrut = 0;
  this.newTranche.ordre = 0;
}

  createTranche(): void {
  if (!this.newTranche.titre || +this.newTranche.montantBrut <= 0) {
    alert('Veuillez remplir tous les champs.');
    return;
  }

  // 🔐 Sécurité pour ordre
  if (this.newTranche.ordre <= 0) {
    this.newTranche.ordre = (this.missionSummary?.tranches.length || 0) + 1;
  }

  // 👉 Force la conversion en Number AVANT envoi
  this.newTranche = {
    ...this.newTranche,
    montantBrut: Number(this.newTranche.montantBrut),
    ordre: Number(this.newTranche.ordre),
    missionId: Number(this.newTranche.missionId)
  };

  // 🔍 LOGS DÉTAILLÉS POUR LA CRÉATION DE TRANCHE
  const currentClientId = this.authService.snapshot?.id;
  console.group('[PaiementDetail] Création de tranche');
  console.log('👤 Client actuel:', {
    clientId: currentClientId,
    type: typeof currentClientId
  });
  console.log('💰 Tranche à créer:', this.newTranche);
  console.log('📋 Mission associée:', {
    missionId: this.newTranche.missionId,
    titreMission: this.missionSummary?.titreMission
  });
  console.groupEnd();

  this.paiementService.create(this.newTranche).subscribe({
    next: () => {
      this.loadMissionSummary(this.newTranche.missionId);
      this.closeAddTrancheModal();
    },
    error: (err) => {
      console.error('Erreur création tranche:', err);
      alert('Erreur lors de la création de la tranche.');
    },
  });
}

  // --- Helpers pour l'affichage ---

  // Helpers policy
  get isFinalPolicy(): boolean {
    return this.missionSummary?.closurePolicy === 'FINAL_MILESTONE_REQUIRED';
  }
  get isManualPolicy(): boolean {
    return this.missionSummary?.closurePolicy === 'MANUAL_DUAL_CONFIRM';
  }
  get isContractPolicy(): boolean {
    return this.missionSummary?.closurePolicy === 'CONTRACT_TOTAL_AMOUNT';
  }

  onChangePolicy(value: 'FINAL_MILESTONE_REQUIRED'|'MANUAL_DUAL_CONFIRM'|'CONTRACT_TOTAL_AMOUNT') {
    if (!this.missionSummary) return;
    this.isLoading = true;
    this.missionsService.updateClosurePolicy(this.missionSummary.missionId, value).subscribe({
      next: () => this.loadMissionSummary(this.missionSummary!.missionId),
      error: () => this.isLoading = false
    });
  }

  updateContractAmount(amount: number) {
    if (!this.missionSummary) return;
    this.isLoading = true;
    this.missionsService.updateContractTotal(this.missionSummary.missionId, amount).subscribe({
      next: () => this.loadMissionSummary(this.missionSummary!.missionId),
      error: () => this.isLoading = false
    });
  }

  toggleFinale(trancheId: number, current: boolean | undefined) {
    if (!this.missionSummary) return;
    
    console.log(`[PaiementDetail] Toggle finale pour tranche ${trancheId}: ${current} -> ${!current}`);
    
    this.paiementService.setFinale(trancheId, !current).subscribe({
      next: () => {
        console.log(`[PaiementDetail] Finale mise à jour avec succès pour tranche ${trancheId}`);
        this.loadMissionSummary(this.missionSummary!.missionId);
      },
      error: (error) => {
        console.error(`[PaiementDetail] Erreur lors de la mise à jour finale pour tranche ${trancheId}:`, error);
        alert('Erreur lors de la mise à jour de la tranche finale.');
      }
    });
  }

  toggleRequired(trancheId: number, current: boolean | undefined) {
    if (!this.missionSummary) return;
    
    console.log(`[PaiementDetail] Toggle required pour tranche ${trancheId}: ${current} -> ${!current}`);
    
    this.paiementService.setRequired(trancheId, !current).subscribe({
      next: () => {
        console.log(`[PaiementDetail] Required mis à jour avec succès pour tranche ${trancheId}`);
        this.loadMissionSummary(this.missionSummary!.missionId);
      },
      error: (error) => {
        console.error(`[PaiementDetail] Erreur lors de la mise à jour required pour tranche ${trancheId}:`, error);
        alert('Erreur lors de la mise à jour de la tranche requise.');
      }
    });
  }

  confirmCloseAsClient() {
    if (!this.missionSummary) return;
    this.isLoading = true;
    this.missionsService.confirmCloseByClient(this.missionSummary.missionId).subscribe({
      next: () => this.loadMissionSummary(this.missionSummary!.missionId),
      error: () => this.isLoading = false
    });
  }

  getTimelineIcon(statut: StatutTranche): any {
    switch (statut) {
      case StatutTranche.VALIDEE:
      case StatutTranche.VERSEE_FREELANCE:
        return faCheckCircle;
      case StatutTranche.REJETEE:
      case StatutTranche.ERREUR_CAPTURE:
        return faTimesCircle;
      default:
        return faHourglassHalf;
    }
  }

  getTimelineClass(statut: StatutTranche): string {
    switch (statut) {
      case StatutTranche.VALIDEE:
      case StatutTranche.VERSEE_FREELANCE:
        return 'status-validated';
      case StatutTranche.REJETEE:
      case StatutTranche.ERREUR_CAPTURE:
        return 'status-rejected';
      case StatutTranche.FONDS_BLOQUES:
        return 'status-funded';
      case StatutTranche.EN_ATTENTE_VALIDATION:
        return 'status-pending-validation';
      default:
        return 'status-pending';
    }
  }

  getButtonText(statut: StatutTranche): string {
    switch (statut) {
      case StatutTranche.EN_ATTENTE_DEPOT:
      case StatutTranche.EN_ATTENTE_PAIEMENT:
        return 'Payer la tranche';
      case StatutTranche.EN_ATTENTE_VALIDATION:
        return 'Valider le livrable';
      default:
        return '';
    }
  }

  isActionAvailable(statut: StatutTranche): boolean {
    return (
      statut === StatutTranche.EN_ATTENTE_DEPOT ||
      statut === StatutTranche.EN_ATTENTE_PAIEMENT ||
      statut === StatutTranche.EN_ATTENTE_VALIDATION
    );
  }

  formatStatut(statut: string): string {
    return statut.replace(/_/g, ' ').toLowerCase();
  }

  goBack(): void {
    this.router.navigate(['/client/paiements']);
  }

  /**
   * Redirige vers la page des missions avec la modale des livrables ouverte
   */
  voirLivrable(livrableId: number): void {
    console.log(`[PaiementDetail] 🎯 Clic sur "Voir livrable" pour livrable ${livrableId}`);
    
    if (!this.missionSummary) {
      console.error('[PaiementDetail] ❌ MissionSummary est null, impossible de rediriger');
      return;
    }
    
    console.log(`[PaiementDetail] ✅ Redirection vers livrable ${livrableId} de la mission ${this.missionSummary.missionId}`);
    
    // Rediriger vers la page des missions avec des paramètres pour ouvrir la modale des livrables
    this.router.navigate(['/client/mes-missions'], {
      queryParams: {
        openLivrables: 'true',
        missionId: this.missionSummary.missionId,
        livrableId: livrableId
      }
    }).then(() => {
      console.log('[PaiementDetail] ✅ Navigation réussie vers /client/mes-missions');
    }).catch((error) => {
      console.error('[PaiementDetail] ❌ Erreur lors de la navigation:', error);
    });
  }
}
