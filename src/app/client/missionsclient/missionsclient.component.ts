import { Component, OnInit, inject, signal, computed, WritableSignal } from '@angular/core';
import { CommonModule, TitleCasePipe, SlicePipe, CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { firstValueFrom } from 'rxjs';
import {
  faPlus, faSearch, faChevronDown, faFolderOpen,
  faCalendarAlt, faMoneyBillWave, faEdit,
  faTimes, faSave, faSpinner, faBoxOpen, faCheck, faDownload, faExclamationCircle, faLink,
  faStar, faCode, faFolder
} from '@fortawesome/free-solid-svg-icons';

import { Mission, MissionStatut, MissionCategorie } from '../../models/mission.model';
import { Livrable, StatusLivrable } from '../../models/livrable.model';
import { MissionsService } from '../../services/missions.service';
import { LivrableService } from '../../services/livrable.service';
import { AuthService } from '../../services/auth.service';
import { UtilisateurService } from '../../services/utilisateurs.service';
import { FileStorageService } from '../../services/file-storage.service';
import { Utilisateur } from '../../models/utilisateur.model';
import { UtilisateurSummaryModel } from '../../models/utilisateur-summary.model';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

// Interface pour enrichir la mission avec le freelance et la progression
interface MissionView extends Mission {
  freelance?: Utilisateur;
  livrablesEnAttente?: number;
}

@Component({
  selector: 'app-missionsclient',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    FaIconComponent,
    TitleCasePipe,
    SlicePipe,
    CurrencyPipe,
    DatePipe
  ],
  templateUrl: './missionsclient.component.html',
  styleUrls: ['./missionsclient.component.scss']
})
export class MissionsclientComponent implements OnInit {

  // --- Services ---
  private authService = inject(AuthService);
  private missionsService = inject(MissionsService);
  private livrableService = inject(LivrableService);
  private utilisateurService = inject(UtilisateurService);
  private fileStorageService = inject(FileStorageService);
  private fb = inject(FormBuilder);

  // --- Icons ---
  faPlus = faPlus;
  faSearch = faSearch;
  faChevronDown = faChevronDown;
  faFolderOpen = faFolderOpen;
  faCalendarAlt = faCalendarAlt;
  faMoneyBillWave = faMoneyBillWave;
  faEdit = faEdit;
  faTimes = faTimes;
  faSave = faSave;
  faSpinner = faSpinner;
  faBoxOpen = faBoxOpen;
  faCheck = faCheck;
  faDownload = faDownload;
  faExclamationCircle = faExclamationCircle;
  faLink = faLink;
  faStar = faStar;
  faCode = faCode;
  faFolder = faFolder;

  // --- State (Signals) ---
  isLoading = signal(true);
  isEnriching = signal(false);
  currentUser: Utilisateur | null = null;

  // Cache pour éviter de recharger les données
  private freelanceCache = new Map<number, Utilisateur>();
  private livrablesCache = new Map<number, Livrable[]>();

  // Missions
  private allMissions: WritableSignal<MissionView[]> = signal([]);
  filteredMissions = computed(() => {
    let missions = this.allMissions();
    
    // Filtre par statut
    if (this.statusFilter() !== 'Tous') {
      missions = missions.filter(m => m.statut === this.statusFilter());
    }
    
    // Filtre par recherche
    if (this.searchTerm()) {
      missions = missions.filter(m => 
        m.titre.toLowerCase().includes(this.searchTerm().toLowerCase())
      );
    }
    
    // Tri
    missions.sort((a, b) => {
      switch (this.sortBy()) {
        case 'date-desc':
          return new Date(b.datePublication).getTime() - new Date(a.datePublication).getTime();
        case 'date-asc':
          return new Date(a.datePublication).getTime() - new Date(b.datePublication).getTime();
        case 'budget-desc':
          return b.budget - a.budget;
        case 'budget-asc':
          return a.budget - b.budget;
        default:
          return 0;
      }
    });
    
    return missions;
  });

  // Filtres & Sort
  searchTerm = signal('');
  statusFilter: WritableSignal<string> = signal('Tous');
  sortBy = signal('date-desc');
  statuses = ['Tous', ...Object.values(MissionStatut)];
  categories = Object.values(MissionCategorie);
  sortOptions = [
    { id: 'date-desc', name: 'Plus récentes' },
    { id: 'date-asc', name: 'Plus anciennes' },
    { id: 'budget-desc', name: 'Budget (élevé)' },
    { id: 'budget-asc', name: 'Budget (bas)' },
  ];

  // Modal State
  isCreateModalOpen = signal(false);
  isEditing = signal(false);
  isSubmitting = signal(false);
  missionForm: FormGroup;

  // Modale des livrables
  isLivrablesModalOpen = signal(false);
  selectedMissionForModal: WritableSignal<MissionView | null> = signal(null);
  livrablesForMission: WritableSignal<Livrable[]> = signal([]);
  isLoadingLivrables = signal(false);

  constructor() {
    this.missionForm = this.fb.group({
      id: [null],
      titre: ['', Validators.required],
      description: ['', Validators.required],
      budget: [null, Validators.required],
      delaiLivraison: [null, Validators.required],
      categorie: ['', Validators.required],
      competences: ['']
    });
  }

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      this.currentUser = user;
      if (user && user.id) {
        this.loadClientMissions(user.id);
      }
    });
  }

  loadClientMissions(clientId: number): void {
    this.isLoading.set(true);
    // Vider le cache lors d'un nouveau chargement
    this.clearCache();
    
    this.missionsService.getMissionsByClient(clientId).subscribe(missions => {
      // Afficher d'abord les missions de base
      const basicMissions: MissionView[] = missions.map(m => ({
        ...m,
        livrablesEnAttente: 0
      }));
      this.allMissions.set(basicMissions);
      this.isLoading.set(false);
      
      // Enrichir progressivement les missions
      this.enrichMissionsProgressively(basicMissions);
    });
  }

  private clearCache(): void {
    this.freelanceCache.clear();
    this.livrablesCache.clear();
  }

  private async enrichMissionsProgressively(missions: MissionView[]): Promise<void> {
    this.isEnriching.set(true);
    
    for (let i = 0; i < missions.length; i++) {
      const mission = missions[i];
      try {
        // Timeout de 5 secondes pour chaque enrichissement
        const enrichedMission = await Promise.race([
          this.enrichMission(mission),
          new Promise<MissionView>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          )
        ]);
        
        // Mettre à jour la mission spécifique dans le signal
        this.allMissions.update(currentMissions => 
          currentMissions.map((m, index) => 
            index === i ? enrichedMission : m
          )
        );
        
        // Petit délai pour éviter de surcharger l'API
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Erreur lors de l'enrichissement de la mission ${mission.id}:`, error);
        // Continuer avec les autres missions même en cas d'erreur
      }
    }
    
    this.isEnriching.set(false);
  }

  async enrichMission(mission: Mission): Promise<MissionView> {
    const view: MissionView = { ...mission, livrablesEnAttente: 0 };

    // Enrichir le freelance en parallèle avec les livrables
    const [freelanceData, livrablesData] = await Promise.allSettled([
      this.loadFreelanceData(mission),
      this.loadLivrablesData(mission.id)
    ]);

    // Traiter les données du freelance
    if (freelanceData.status === 'fulfilled' && freelanceData.value) {
      view.freelance = freelanceData.value;
    }

    // Traiter les données des livrables
    if (livrablesData.status === 'fulfilled') {
      view.livrablesEnAttente = livrablesData.value.filter(l => l.status === StatusLivrable.EN_ATTENTE).length;
    }

    return view;
  }

  private async loadFreelanceData(mission: Mission): Promise<Utilisateur | null> {
    // Vérifier le cache d'abord
    if (this.freelanceCache.has(mission.id)) {
      return this.freelanceCache.get(mission.id) || null;
    }

    const anyMission = mission as any;
    let summary: UtilisateurSummaryModel | undefined = anyMission.freelanceSummary || anyMission.freelance || undefined;

    if (summary) {
      const photoAbs = this.fileStorageService.makeAbsolute(summary.photoUrl || '');
      const freelance = {
        id: summary.id,
        nom: summary.nom,
        prenom: summary.prenom,
        photoProfilUrl: photoAbs,
        email: '',
        typeUtilisateur: 'FREELANCE' as any,
        estActif: true,
        dateCreation: ''
      } as Utilisateur;
      
      // Mettre en cache
      this.freelanceCache.set(mission.id, freelance);
      return freelance;
    } else if (mission.freelanceSelectionneId) {
      try {
        const freelance = await firstValueFrom(this.utilisateurService.getUtilisateurById(mission.freelanceSelectionneId));
        if (freelance) {
          freelance.photoProfilUrl = this.fileStorageService.makeAbsolute(freelance.photoProfilUrl || '');
          
          // Mettre en cache
          this.freelanceCache.set(mission.id, freelance);
          return freelance;
        }
      } catch (e) {
        console.error(`Impossible de charger le freelance ID ${mission.freelanceSelectionneId}`, e);
      }
    }
    return null;
  }

  private async loadLivrablesData(missionId: number): Promise<Livrable[]> {
    // Vérifier le cache d'abord
    if (this.livrablesCache.has(missionId)) {
      return this.livrablesCache.get(missionId) || [];
    }

    try {
      const livrables = await firstValueFrom(this.livrableService.getLivrablesForMission(missionId));
      
      // Mettre en cache
      this.livrablesCache.set(missionId, livrables);
      return livrables;
    } catch (e) {
      console.error(`Impossible de charger les livrables pour la mission ${missionId}`, e);
      return [];
    }
  }

  // --- Filtres & Tri ---
  selectStatus(status: string): void {
    this.statusFilter.set(status);
  }

  updateSearchTerm(term: string): void {
    this.searchTerm.set(term);
  }

  updateSortBy(sort: string): void {
    this.sortBy.set(sort);
  }

  getStatusClass(status: MissionStatut): string {
    return `status-${status.toLowerCase().replace(/_/g, '-')}`;
  }
  
  getLivrableStatusClass(status: StatusLivrable): string {
    return `status-${status}`;
  }

  // --- Modal de création/édition ---
  openCreateMissionModal(mission?: Mission): void {
    this.isEditing.set(!!mission);
    if (mission) {
      const competencesString = mission.competencesRequises ? mission.competencesRequises.join(', ') : '';
      this.missionForm.patchValue({
        id: mission.id,
        titre: mission.titre,
        description: mission.description,
        budget: mission.budget,
        delaiLivraison: mission.delaiLivraison,
        categorie: mission.categorie,
        competences: competencesString
      });
    } else {
      this.missionForm.reset();
    }
    this.isCreateModalOpen.set(true);
  }

  closeCreateMissionModal(): void {
    this.isCreateModalOpen.set(false);
    this.missionForm.reset();
  }

  submitMissionForm(): void {
    if (this.missionForm.invalid || !this.currentUser) {
      return;
    }
    this.isSubmitting.set(true);
    const formValue = this.missionForm.value;
    const rawComp = (formValue.competences ?? '').toString();
    const competencesArray = rawComp
      .split(',')
      .map((c:string)=>c.trim())
      .filter((c:string)=>c);

    const payload: any = {
      titre: formValue.titre,
      description: formValue.description,
      budget: formValue.budget,
      delaiLivraison: formValue.delaiLivraison,
      categorie: formValue.categorie,
      competencesRequises: competencesArray,
      client: { id: this.currentUser.id }
    };

    if (this.isEditing() && formValue.id) {
      payload.id = formValue.id;
    }

    const request$ = this.isEditing() && payload.id
      ? this.missionsService.updateMission(payload.id, payload as Mission)
      : this.missionsService.createMission(payload as Mission);

    request$.subscribe({
      next: () => {
        this.loadClientMissions(this.currentUser!.id!);
        this.isSubmitting.set(false);
        this.closeCreateMissionModal();
      },
      error: err => {
        console.error('Erreur lors de l\'enregistrement', err);
        alert('Erreur: ' + (err.error?.message || err.statusText));
        this.isSubmitting.set(false);
      }
    });
  }

  // --- Modale Livrables ---
  openLivrablesModal(mission: MissionView): void {
    this.selectedMissionForModal.set(mission);
    this.isLivrablesModalOpen.set(true);
    this.isLoadingLivrables.set(true);
    this.livrableService.getLivrablesForMission(mission.id).subscribe(livrables => {
      this.livrablesForMission.set(livrables);
      this.isLoadingLivrables.set(false);
    });
  }

  closeLivrablesModal(): void {
    this.isLivrablesModalOpen.set(false);
    this.selectedMissionForModal.set(null);
    this.livrablesForMission.set([]);
  }

  // --- Actions sur les livrables ---
  handleLivrableAction(livrableId: number, action: 'valider' | 'rejeter', missionId: number): void {
    const clientId = this.authService.snapshot?.id;
    if (!clientId) return;

    const apiCall = action === 'valider'
      ? this.livrableService.validateLivrable(livrableId, clientId)
      : this.livrableService.rejectLivrable(livrableId, clientId, 'Raison à ajouter');
    
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
    if (missionToRefresh) {
      try {
        const refreshedMission = await this.enrichMission(missionToRefresh);
        this.allMissions.update(missions => 
          missions.map(m => m.id === missionId ? refreshedMission : m)
        );
      } catch (error) {
        console.error(`Erreur lors du rafraîchissement de la mission ${missionId}:`, error);
      }
    }
  }
}
