import { Component, OnInit, inject, signal, computed, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { firstValueFrom } from 'rxjs';
import { 
  faSearch, faChevronDown, faCalendarAlt, faMoneyBillWave, 
  faEye, faBoxOpen, faCheck, faTimes, faSpinner, faDownload, faExclamationCircle, faLink
} from '@fortawesome/free-solid-svg-icons';

import { Mission, MissionStatut } from '../../models/mission.model';
import { Livrable, StatusLivrable } from '../../models/livrable.model';
import { Utilisateur } from '../../models/utilisateur.model';
import { UtilisateurSummaryModel } from '../../models/utilisateur-summary.model';

import { MissionsService } from '../../services/missions.service';
import { LivrableService } from '../../services/livrable.service';
import { AuthService } from '../../services/auth.service';
import { UtilisateurService } from '../../services/utilisateurs.service';
import { FileStorageService } from '../../services/file-storage.service';

// Interface pour enrichir la mission avec le freelance et la progression
interface MissionView extends Mission {
  freelance?: Utilisateur;
  livrablesEnAttente?: number;
}

@Component({
  selector: 'app-suiviprojetclient',
  standalone: true,
  imports: [CommonModule, FormsModule, FaIconComponent],
  templateUrl: './suiviprojetclient.component.html',
  styleUrl: './suiviprojetclient.component.scss'
})
export class SuiviprojetclientComponent implements OnInit {

  // --- Services ---
  private authService = inject(AuthService);
  private missionsService = inject(MissionsService);
  private livrableService = inject(LivrableService);
  private utilisateurService = inject(UtilisateurService);
  private fileStorageService = inject(FileStorageService);

  // --- State (Signals) ---
  isLoading = signal(true);
  
  // Missions
  private allMissions: WritableSignal<MissionView[]> = signal([]);
  filteredMissions = computed(() => {
    let missions = this.allMissions();
    // Filtre par statut
    if (this.statusFilter() !== 'Tous') {
      missions = missions.filter(m => m.statut === this.statusFilter());
    }
    // TODO: Filtre par recherche
    return missions;
  });

  // Filtres
  statusFilter: WritableSignal<string> = signal('Tous');
  statuses = ['Tous', ...Object.values(MissionStatut)];

  // Modale des livrables
  isModalOpen = signal(false);
  selectedMissionForModal: WritableSignal<MissionView | null> = signal(null);
  livrablesForMission: WritableSignal<Livrable[]> = signal([]);
  isLoadingLivrables = signal(false);

  // --- Icons ---
  faSearch = faSearch;
  faChevronDown = faChevronDown;
  faCalendarAlt = faCalendarAlt;
  faMoneyBillWave = faMoneyBillWave;
  faEye = faEye;
  faBoxOpen = faBoxOpen;
  faSpinner = faSpinner;
  faExclamationCircle = faExclamationCircle;
  faCheck = faCheck;
  faTimes = faTimes;
  faDownload = faDownload;
  faLink = faLink;

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      if (user?.id) {
        this.loadClientMissions(user.id);
      }
    });
  }

  loadClientMissions(clientId: number): void {
    this.isLoading.set(true);
    this.missionsService.getMissionsByClient(clientId).subscribe(missions => {
      // Pour chaque mission, charger le freelance associé
      const missionViewPromises = missions.map(m => this.enrichMission(m));
      Promise.all(missionViewPromises).then(enrichedMissions => {
        this.allMissions.set(enrichedMissions);
        this.isLoading.set(false);
      });
    });
  }

  async enrichMission(mission: Mission): Promise<MissionView> {
    console.log('[SuiviProjet] Enrich mission', mission.id, mission.titre);
    const view: MissionView = { ...mission, livrablesEnAttente: 0 };

    const anyMission = mission as any;
    let summary: UtilisateurSummaryModel | undefined = anyMission.freelanceSummary || anyMission.freelance || undefined;
    console.log('  → summary from mission =', summary);

    if (summary) {
      const photoAbs = this.fileStorageService.makeAbsolute(summary.photoUrl || '');
      console.log('  → photoAbs (from summary)=', photoAbs);
      view.freelance = {
        id: summary.id,
        nom: summary.nom,
        prenom: summary.prenom,
        photoProfilUrl: photoAbs,
        email: '',
        typeUtilisateur: 'FREELANCE' as any,
        estActif: true,
        dateCreation: ''
      } as Utilisateur;
    } else if (mission.freelanceSelectionneId) {
      console.log('  → Fetching freelance via API id=', mission.freelanceSelectionneId);
      try {
        const freelance = await firstValueFrom(this.utilisateurService.getUtilisateurById(mission.freelanceSelectionneId));
        console.log('  → API freelance=', freelance);
        if (freelance) {
          freelance.photoProfilUrl = this.fileStorageService.makeAbsolute(freelance.photoProfilUrl || '');
          console.log('  → photoAbs (from API)=', freelance.photoProfilUrl);
          view.freelance = freelance;
        }
      } catch (e) {
        console.error(`Impossible de charger le freelance ID ${mission.freelanceSelectionneId}`, e);
      }
    } else {
      console.warn('  → Aucun freelance assigné à cette mission');
    }

    const livrables = await firstValueFrom(this.livrableService.getLivrablesForMission(mission.id)) || [];
    view.livrablesEnAttente = livrables.filter(l => l.status === StatusLivrable.EN_ATTENTE).length;

    return view;
  }

  // --- Filtres ---
  selectStatus(status: string): void {
    this.statusFilter.set(status);
  }

  getStatusClass(status: MissionStatut): string {
    return `status-${status}`;
  }
  
  getLivrableStatusClass(status: StatusLivrable): string {
    return `status-${status}`;
  }
  
  // --- Modale Livrables ---
  openLivrablesModal(mission: MissionView): void {
    this.selectedMissionForModal.set(mission);
    this.isModalOpen.set(true);
    this.isLoadingLivrables.set(true);
    this.livrableService.getLivrablesForMission(mission.id).subscribe(livrables => {
      this.livrablesForMission.set(livrables);
      this.isLoadingLivrables.set(false);
    });
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.selectedMissionForModal.set(null);
    this.livrablesForMission.set([]);
  }

  // --- Actions sur les livrables ---
  handleLivrableAction(livrableId: number, action: 'valider' | 'rejeter', missionId: number): void {
    const clientId = this.authService.snapshot?.id;
    if (!clientId) return;

    const apiCall = action === 'valider'
      ? this.livrableService.validateLivrable(livrableId, clientId)
      : this.livrableService.rejectLivrable(livrableId, clientId, 'Raison à ajouter'); // TODO: Ajouter un prompt pour la raison
    
    apiCall.subscribe(() => {
      // Rafraîchir les livrables dans la modale
      this.livrableService.getLivrablesForMission(missionId).subscribe(livrables => {
        this.livrablesForMission.set(livrables);
        // Rafraîchir aussi la carte de mission dans la liste principale
        this.refreshSingleMission(missionId);
      });
    });
  }
  
  async refreshSingleMission(missionId: number) {
    const missionToRefresh = this.allMissions().find(m => m.id === missionId);
    if(missionToRefresh) {
        const refreshedMission = await this.enrichMission(missionToRefresh);
        this.allMissions.update(missions => 
            missions.map(m => m.id === missionId ? refreshedMission : m)
        );
    }
  }
}
