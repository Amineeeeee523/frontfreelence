import { Component, Input, OnInit, signal, computed, WritableSignal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { 
  faTimes, faCalendarAlt, faMapPin, faClock, faUser, 
  faMoneyBillWave, faCheckCircle, faExclamationTriangle,
  faDownload, faLink, faPlay, faPause, faStar, faTag,
  faBuilding, faGraduationCap, faBriefcase, faFileAlt,
  faCreditCard, faPercent, faArrowRight, faEye, faEyeSlash
} from '@fortawesome/free-solid-svg-icons';

import { MissionDetailView, TrancheMini, LivrableLite } from '../../models/mission-detail-view.model';
import { MissionsService } from '../../services/missions.service';
import { AuthService } from '../../services/auth.service';
import { TranchePaiementService } from '../../services/tranche-paiement.service';
import { LivrableService } from '../../services/livrable.service';
import { MissionStatut, MissionCategorie, ModaliteTravail, Gouvernorat, NiveauBrief } from '../../models/mission.model';
import { FileStorageService } from '../../services/file-storage.service';

@Component({
  selector: 'app-mission-detail',
  standalone: true,
  imports: [CommonModule, FaIconComponent],
  templateUrl: './mission-detail.component.html',
  styleUrls: ['./mission-detail.component.scss']
})
export class MissionDetailComponent implements OnInit {
  @Input() missionId: number = 0;

  // Services
  private missionsService = inject(MissionsService);
  private authService = inject(AuthService);
  private trancheService = inject(TranchePaiementService);
  private livrableService = inject(LivrableService);
  private fileStorage = inject(FileStorageService);

  // Icons
  faTimes = faTimes;
  faCalendarAlt = faCalendarAlt;
  faMapPin = faMapPin;
  faClock = faClock;
  faUser = faUser;
  faMoneyBillWave = faMoneyBillWave;
  faCheckCircle = faCheckCircle;
  faExclamationTriangle = faExclamationTriangle;
  faDownload = faDownload;
  faLink = faLink;
  faPlay = faPlay;
  faPause = faPause;
  faStar = faStar;
  faTag = faTag;
  faBuilding = faBuilding;
  faGraduationCap = faGraduationCap;
  faBriefcase = faBriefcase;
  faFileAlt = faFileAlt;
  faCreditCard = faCreditCard;
  faPercent = faPercent;
  faArrowRight = faArrowRight;
  faEye = faEye;
  faEyeSlash = faEyeSlash;

  // State
  isLoading = signal(true);
  isError = signal(false);
  errorMessage = signal('');
  mission: WritableSignal<MissionDetailView | null> = signal(null);
  
  // State pour l'affichage des livrables par tranche
  selectedTrancheForLivrables: WritableSignal<TrancheMini | null> = signal(null);
  isLivrablesModalOpen = signal(false);

  // Computed properties
  statusClass = computed(() => {
    const data = this.mission();
    if (!data) return '';
    return `status-${(data.statut || '').toLowerCase().replace(/_/g, '-')}`;
  });

  statusIcon = computed(() => {
    const data = this.mission();
    if (!data) return faPause;
    
    switch (data.statut) {
      case MissionStatut.EN_COURS: return faPlay;
      case MissionStatut.TERMINEE: return faCheckCircle;
      case MissionStatut.EN_ATTENTE_VALIDATION: return faExclamationTriangle;
      default: return faPause;
    }
  });

  progressPercentage = computed(() => {
    const data = this.mission();
    return Number(data?.paiements?.progressionPct ?? 0);
  });

  totalAmount = computed(() => {
    const data = this.mission();
    return Number((data?.paiements?.totalBrut as any) ?? 0);
  });

  paidAmount = computed(() => {
    const data = this.mission();
    return Number((data?.paiements?.paidTotal as any) ?? 0);
  });

  ngOnInit(): void {
    if (this.missionId) {
      this.loadMissionDetails();
    }
  }

  private normalizeMission(data: MissionDetailView): MissionDetailView {
    // Normaliser media URLs
    const mediaUrls = Array.isArray(data.mediaUrls) 
      ? data.mediaUrls.map(u => this.fileStorage.makeAbsolute(u))
      : [];

    // Normaliser livrables: cheminsFichiers absolus
    const livrables = Array.isArray(data.livrables) ? data.livrables.map(l => ({
      ...l,
      cheminsFichiers: Array.isArray(l.cheminsFichiers) ? l.cheminsFichiers.map(u => this.fileStorage.makeAbsolute(u)) : [],
      liensExternes: Array.isArray(l.liensExternes) ? l.liensExternes : []
    })) : [];

    // Normaliser paiements/tranches et assurer number
    const tranches = Array.isArray(data.paiements?.tranches) ? data.paiements.tranches.map(t => ({
      ...t,
      montantBrut: Number((t as any).montantBrut ?? 0)
    })) : [];

    const paiements = {
      totalBrut: Number((data.paiements as any)?.totalBrut ?? 0),
      totalNetFreelance: Number((data.paiements as any)?.totalNetFreelance ?? 0),
      paidTotal: Number((data.paiements as any)?.paidTotal ?? 0),
      progressionPct: Number((data.paiements as any)?.progressionPct ?? 0),
      tranches
    };

    const videoBriefUrl = data.videoBriefUrl ? this.fileStorage.makeAbsolute(data.videoBriefUrl) : undefined;

    const normalized: MissionDetailView = {
      ...data,
      mediaUrls,
      videoBriefUrl,
      livrables,
      paiements
    } as MissionDetailView;

    console.log('[MissionDetail] Normalized payload:', {
      tranchesCount: normalized.paiements.tranches.length,
      livrablesCount: normalized.livrables.length,
      mediaCount: normalized.mediaUrls.length
    });

    return normalized;
  }

  private loadMissionDetails(): void {
    const userId = this.authService.snapshot?.id;
    if (!userId) {
      this.isError.set(true);
      this.errorMessage.set('Utilisateur non connecté');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.isError.set(false);

    this.missionsService.getMissionDetailView(this.missionId, userId).subscribe({
      next: (missionData) => {
        const normalized = this.normalizeMission(missionData);
        this.mission.set(normalized);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Erreur lors du chargement des détails de mission:', error);
        this.isError.set(true);
        this.errorMessage.set('Erreur lors du chargement des détails');
        this.isLoading.set(false);
      }
    });
  }

  // Actions
  onPayerTranche(tranche: TrancheMini): void {
    if (!tranche || !tranche.paymentUrl) {
      console.warn('Aucune URL de paiement disponible pour cette tranche');
      return;
    }

    const userId = this.authService.snapshot?.id;
    if (!userId) {
      console.error('Utilisateur non connecté');
      return;
    }

    this.trancheService.payerDirect(tranche.id, userId).subscribe({
      next: (response) => {
        this.trancheService.openPaymentUrl(response);
      },
      error: (error) => {
        console.error('Erreur lors du paiement:', error);
        alert('Erreur lors du paiement de la tranche');
      }
    });
  }

  onValiderLivrable(livrable: LivrableLite): void {
    const userId = this.authService.snapshot?.id;
    if (!userId) {
      console.error('Utilisateur non connecté');
      return;
    }

    this.livrableService.validateLivrable(livrable.id, userId).subscribe({
      next: () => {
        console.log('Livrable validé avec succès');
        this.loadMissionDetails(); // Recharger les données
      },
      error: (error) => {
        console.error('Erreur lors de la validation:', error);
        alert('Erreur lors de la validation du livrable');
      }
    });
  }

  onRejeterLivrable(livrable: LivrableLite): void {
    const userId = this.authService.snapshot?.id;
    if (!userId) {
      console.error('Utilisateur non connecté');
      return;
    }

    const raison = prompt('Raison du rejet:');
    if (!raison) return;

    this.livrableService.rejectLivrable(livrable.id, userId, raison).subscribe({
      next: () => {
        console.log('Livrable rejeté avec succès');
        this.loadMissionDetails(); // Recharger les données
      },
      error: (error) => {
        console.error('Erreur lors du rejet:', error);
        alert('Erreur lors du rejet du livrable');
      }
    });
  }

  // Utility methods (defensive)
  getStatusLabel(statut?: MissionStatut | null): string {
    return (statut || '').toString().replace(/_/g, ' ').toLowerCase() || '-';
  }

  getCategorieLabel(categorie?: MissionCategorie | null): string {
    return (categorie || '').toString().replace(/_/g, ' ').toLowerCase() || '-';
  }

  getModaliteLabel(modalite?: ModaliteTravail | null): string {
    return (modalite || '').toString().replace(/_/g, ' ').toLowerCase() || '-';
  }

  getGouvernoratLabel(gouvernorat?: Gouvernorat | null): string {
    return (gouvernorat || '').toString().replace(/_/g, ' ').toLowerCase() || '-';
  }

  getNiveauBriefLabel(niveau?: NiveauBrief | null): string {
    return ((niveau as any) || '').toString().toLowerCase() || '-';
  }

  formatDate(dateString?: string | null): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatCurrency(amount?: number | string, devise: string = 'TND'): string {
    const value = Number(amount ?? 0) || 0;
    try {
      return new Intl.NumberFormat('fr-TN', { style: 'currency', currency: devise }).format(value);
    } catch {
      return `${value.toLocaleString()} ${devise}`;
    }
  }

  trancheStatusClass(statut?: string | null): string {
    const s = (statut || '').toString().toLowerCase();
    return s ? `status-${s}` : '';
  }

  livrableStatusClass(status?: string | null): string {
    const s = (status || '').toString().toLowerCase();
    return s ? `status-${s}` : '';
  }

  openFile(url: string): void {
    if (!url) return;
    window.open(url, '_blank');
  }

  openVideo(url: string): void {
    if (!url) return;
    window.open(url, '_blank');
  }

  // Payment status methods
  isTranchePayable(tranche: TrancheMini): boolean {
    // Tranche payable si elle a une URL de paiement et n'est pas déjà payée
    return !!(tranche.paymentUrl && this.isTrancheNotPaid(tranche));
  }

  isTrancheNotPaid(tranche: TrancheMini): boolean {
    // Tranche non payée si le statut indique qu'elle est en attente de paiement
    const unpaidStatuses = [
      'EN_ATTENTE_DEPOT',
      'EN_ATTENTE_PAIEMENT', 
      'FONDS_BLOQUES',
      'EN_ATTENTE_VALIDATION'
    ];
    return unpaidStatuses.includes(tranche.statut);
  }

  isTranchePaid(tranche: TrancheMini): boolean {
    // Tranche payée si elle est validée ou versée au freelance
    const paidStatuses = [
      'VALIDEE',
      'VERSEE_FREELANCE'
    ];
    return paidStatuses.includes(tranche.statut);
  }

  isTrancheRejected(tranche: TrancheMini): boolean {
    return tranche.statut === 'REJETEE';
  }

  isTrancheInError(tranche: TrancheMini): boolean {
    return tranche.statut === 'ERREUR_CAPTURE';
  }

  getTrancheStatusLabel(tranche: TrancheMini): string {
    switch (tranche.statut) {
      case 'EN_ATTENTE_DEPOT':
        return 'En attente de dépôt';
      case 'EN_ATTENTE_PAIEMENT':
        return 'En attente de paiement';
      case 'FONDS_BLOQUES':
        return 'Fonds bloqués';
      case 'EN_ATTENTE_VALIDATION':
        return 'En attente de validation';
      case 'VALIDEE':
        return 'Validée';
      case 'VERSEE_FREELANCE':
        return 'Versée au freelance';
      case 'REJETEE':
        return 'Rejetée';
      case 'ERREUR_CAPTURE':
        return 'Erreur de capture';
      default:
        return tranche.statut;
    }
  }

  getTrancheStatusIcon(tranche: TrancheMini): any {
    if (this.isTranchePaid(tranche)) {
      return this.faCheckCircle;
    } else if (this.isTrancheRejected(tranche)) {
      return this.faTimes;
    } else if (this.isTrancheInError(tranche)) {
      return this.faExclamationTriangle;
    } else {
      return this.faClock;
    }
  }

  getTrancheStatusClass(tranche: TrancheMini): string {
    if (this.isTranchePaid(tranche)) {
      return 'status-paid';
    } else if (this.isTrancheRejected(tranche)) {
      return 'status-rejected';
    } else if (this.isTrancheInError(tranche)) {
      return 'status-error';
    } else {
      return 'status-pending';
    }
  }

  // Méthodes pour gérer les livrables par tranche
  openLivrablesForTranche(tranche: TrancheMini): void {
    this.selectedTrancheForLivrables.set(tranche);
    this.isLivrablesModalOpen.set(true);
  }

  closeLivrablesModal(): void {
    this.isLivrablesModalOpen.set(false);
    this.selectedTrancheForLivrables.set(null);
  }

  getLivrablesForTranche(tranche: TrancheMini): LivrableLite[] {
    const mission = this.mission();
    if (!mission || !mission.livrables) {
      return [];
    }

    // 🎯 SOLUTION ULTRA LOGIQUE : Priorité d'association
    
    // 1. PRIORITÉ MAXIMALE : Livrables directement associés à la tranche
    if (tranche.livrables && tranche.livrables.length > 0) {
      return tranche.livrables;
    }

    // 2. PRIORITÉ ÉLEVÉE : Livrable associé par ID spécifique
    if (tranche.livrableAssocieId) {
      const livrableAssocie = mission.livrables.find(livrable => 
        livrable.id === tranche.livrableAssocieId
      );
      if (livrableAssocie) {
        return [livrableAssocie];
      }
    }

    // 3. PRIORITÉ MOYENNE : Association logique par ordre de tranche
    const totalTranches = mission.paiements?.tranches?.length || 0;
    const totalLivrables = mission.livrables.length;
    
    if (totalTranches > 0 && totalLivrables > 0) {
      const trancheIndex = tranche.ordre - 1; // ordre commence à 1
      const livrablesParTranche = Math.ceil(totalLivrables / totalTranches);
      const startIndex = trancheIndex * livrablesParTranche;
      const endIndex = Math.min(startIndex + livrablesParTranche, totalLivrables);
      
      if (startIndex < totalLivrables) {
        return mission.livrables.slice(startIndex, endIndex);
      }
    }

    // 4. FALLBACK : Si c'est la tranche finale, associer tous les livrables non associés
    if (tranche.finale && mission.livrables.length > 0) {
      return mission.livrables;
    }

    // 5. AUCUN LIVRABLE : Retourner un tableau vide
    return [];
  }

  hasLivrablesForTranche(tranche: TrancheMini): boolean {
    return this.getLivrablesForTranche(tranche).length > 0;
  }

  getLivrablesCountForTranche(tranche: TrancheMini): number {
    return this.getLivrablesForTranche(tranche).length;
  }

  // Close modal method
  closeModal(): void {
    // Emit close event or handle modal closing
    // This will be handled by the parent component
    window.history.back();
  }
}
