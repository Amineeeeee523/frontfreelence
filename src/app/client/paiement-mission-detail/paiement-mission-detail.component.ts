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
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { TranchePaiementService } from '../../services/tranche-paiement.service';
import { MissionPaiementSummaryDTO } from '../../models/mission-paiement-summary.dto';
import {
  StatutTranche,
  TranchePaiement,
} from '../../models/tranche-paiement.model';
import { TranchePaiementResponseDTO } from '../../models/tranche-paiement-response.dto';
import { TranchePaiementCreateDTO } from '../../models/tranche-paiement-create.dto';

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

  // Données
  missionSummary: MissionPaiementSummaryDTO | null = null;
  isLoading = true;

  // État pour le modal d'ajout
  isAddTrancheModalOpen = false;
  newTranche: TranchePaiementCreateDTO = {
    ordre: 0,
    titre: '',
    montant: 0,
    devise: 'TND',
    missionId: 0,
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private paiementService: TranchePaiementService
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
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      },
    });
  }

  // --- Actions sur les tranches ---

  handleTrancheAction(tranche: TranchePaiementResponseDTO): void {
    switch (tranche.statut) {
      case StatutTranche.EN_ATTENTE_DEPOT:
        this.payTranche(tranche.id);
        break;
      case StatutTranche.EN_ATTENTE_VALIDATION:
        this.validateTranche(tranche.id);
        break;
      // Ajoutez d'autres cas si nécessaire (ex: voir détails)
    }
  }

  payTranche(trancheId: number): void {
    this.paiementService.checkout(trancheId).subscribe({
      next: (response) => {
        if (response.paymeePaymentUrl) {
          this.paiementService.openPaymeeUrl(response);
        }
      },
      error: (err) => console.error(err),
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
  this.newTranche.montant = 0;
  this.newTranche.ordre = 0;
}

  createTranche(): void {
  if (!this.newTranche.titre || +this.newTranche.montant <= 0) {
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
    montant: Number(this.newTranche.montant),
    ordre: Number(this.newTranche.ordre),
    missionId: Number(this.newTranche.missionId)
  };

  // Log pour debug
  console.log('Tranche envoyée :', this.newTranche);

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
      statut === StatutTranche.EN_ATTENTE_VALIDATION
    );
  }

  formatStatut(statut: string): string {
    return statut.replace(/_/g, ' ').toLowerCase();
  }

  goBack(): void {
    this.router.navigate(['/client/paiements']);
  }
}
