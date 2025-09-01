import { Component, OnInit, inject, signal, computed, WritableSignal } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule, TitleCasePipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FaIconComponent, FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { firstValueFrom } from 'rxjs';
import {
  faPlus, faSearch, faChevronDown, faFolderOpen,
  faCalendarAlt, faMoneyBillWave, faEdit,
  faTimes, faSave, faSpinner, faBoxOpen, faCheck, faDownload, faExclamationCircle, faLink,
  faStar, faCode, faFolder, faMapPin, faEye, faCreditCard, faFlagCheckered,
  faListCheck, faCheckCircle, faInbox, faHourglassHalf, faPlay, faClipboardCheck,
  faXmarkCircle, faClockRotateLeft
} from '@fortawesome/free-solid-svg-icons';

import { Mission, MissionStatut, MissionCategorie, ModaliteTravail, TypeRemuneration, NiveauBrief, Gouvernorat } from '../../models/mission.model';
import { MissionCard } from '../../models/mission-card.model';
import { Livrable, StatusLivrable } from '../../models/livrable.model';
import { MissionsService } from '../../services/missions.service';
import { LivrableService } from '../../services/livrable.service';
import { AuthService } from '../../services/auth.service';
import { UtilisateurService } from '../../services/utilisateurs.service';
import { FileStorageService } from '../../services/file-storage.service';
import { Utilisateur } from '../../models/utilisateur.model';
import { FreelanceSummary } from '../../models/freelance-summary.model';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MissionCardComponent } from '../../components/mission-card/mission-card.component';
import { MissionDetailComponent } from '../mission-detail/mission-detail.component';
import { StatutLabelPipe } from '../../pipes/mission-statut-label.pipe';

// Interface pour enrichir la mission avec le freelance et la progression
interface MissionView extends MissionCard {
  freelance?: FreelanceSummary;
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
    DatePipe,
    MissionCardComponent,
    MissionDetailComponent,
    StatutLabelPipe,
    FontAwesomeModule
  ],
  templateUrl: './missionsclient.component.html',
  styleUrls: ['./missionsclient.component.scss'],
  animations: [
    trigger('cardAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('250ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ])
  ]
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
  faMapPin = faMapPin;
  faEye = faEye;
  faCreditCard = faCreditCard;
  faFlagCheckered = faFlagCheckered;
  faListCheck = faListCheck;
  faCheckCircle = faCheckCircle;
  faInbox = faInbox;
  faHourglassHalf = faHourglassHalf;
  faPlay = faPlay;
  faClipboardCheck = faClipboardCheck;
  faXmarkCircle = faXmarkCircle;
  faClockRotateLeft = faClockRotateLeft;

  // --- State (Signals) ---
  isLoading = signal(true);
  isEnriching = signal(false);
  currentUser: Utilisateur | null = null;

  // Cache pour éviter de recharger les données
  private freelanceCache = new Map<number, FreelanceSummary>();
  private livrablesCache = new Map<number, Livrable[]>();

  // Missions
  private allMissions: WritableSignal<MissionView[]> = signal([]);
  filteredMissions = computed(() => {
    // Clone pour éviter de muter le tableau source via sort()
    let missions = [...this.allMissions()];
    
    // 🔍 LOGS POUR DIAGNOSTIQUER LE FILTRAGE
    console.log('[MissionsClient] Filtrage des missions:', {
      totalMissions: missions.length,
      statusFilter: this.statusFilter(),
      searchTerm: this.searchTerm(),
      sortBy: this.sortBy(),
      missions: missions.map(m => ({ id: m.id, titre: m.titre, statut: m.statut }))
    });
    
    // Filtre par statut
    if (this.statusFilter() !== 'Tous') {
      missions = missions.filter(m => m.statut === this.statusFilter());
      console.log('🔍 Après filtrage par statut:', missions.length, 'missions');
    }
    
    // Filtre par recherche
    if (this.searchTerm()) {
      missions = missions.filter(m => 
        m.titre.toLowerCase().includes(this.searchTerm().toLowerCase())
      );
      console.log('🔍 Après filtrage par recherche:', missions.length, 'missions');
    }
    
    // Tri (MissionCard n'a pas datePublication → fallback sur derniereActiviteAt puis id)
    missions.sort((a, b) => {
      switch (this.sortBy()) {
        case 'date-desc': {
          const da = (a.derniereActiviteAt ? new Date(a.derniereActiviteAt).getTime() : 0);
          const db = (b.derniereActiviteAt ? new Date(b.derniereActiviteAt).getTime() : 0);
          return db - da;
        }
        case 'date-asc': {
          const da = (a.derniereActiviteAt ? new Date(a.derniereActiviteAt).getTime() : 0);
          const db = (b.derniereActiviteAt ? new Date(b.derniereActiviteAt).getTime() : 0);
          return da - db;
        }
        case 'budget-desc':
          return (b.budget ?? 0) - (a.budget ?? 0);
        case 'budget-asc':
          return (a.budget ?? 0) - (b.budget ?? 0);
        default:
          return (b.id ?? 0) - (a.id ?? 0);
      }
    });
    
    console.log('🎯 Missions finales après filtrage/tri:', 
      missions.map(m => ({ id: m.id, titre: m.titre, statut: m.statut }))
    );
    
    return missions;
  });

  // Filtres & Sort
  searchTerm = signal('');
  statusFilter: WritableSignal<string> = signal('Tous');
  sortBy = signal('date-desc');
  statuses = ['Tous', ...Object.values(MissionStatut)];
  categories = Object.values(MissionCategorie);
  gouvernorats = Object.values(Gouvernorat);
  modalites = Object.values(ModaliteTravail);
  remunerations = Object.values(TypeRemuneration);
  niveauxBrief = Object.values(NiveauBrief);
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

  // Modal de détails de mission
  isDetailOverlayOpen = signal(false);
  selectedMissionForDetail: WritableSignal<MissionView | null> = signal(null);

  constructor() {
    this.missionForm = this.fb.group({
      id: [null],
      titre: ['', Validators.required],
      description: ['', Validators.required],
      budget: [null, Validators.required],
      devise: ['TND'],
      typeRemuneration: [TypeRemuneration.FORFAIT],
      budgetMin: [null],
      budgetMax: [null],
      tjmJournalier: [null],
      delaiLivraison: [null, Validators.required],
      dureeEstimeeJours: [null],
      dateLimiteCandidature: [null],
      dateDebutSouhaitee: [null],
      chargeHebdoJours: [null, [Validators.min(0), Validators.max(7)]],
      categorie: ['', Validators.required],
      localisation: [''],
      gouvernorat: [''],
      modaliteTravail: [ModaliteTravail.NON_SPECIFIE],
      urgent: [false],
      qualiteBrief: [null],
      competences: [''],
      mediaUrls: [''],
      videoBriefUrl: ['']
    });
  }

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      this.currentUser = user;
      if (user && user.id) {
        this.loadClientMissions(user.id);
      }
    });

    // Vérifier les paramètres de requête pour ouvrir automatiquement la modale des livrables
    this.checkQueryParamsForLivrables();
  }

  /**
   * Vérifie les paramètres de requête pour ouvrir automatiquement la modale des livrables
   */
  private checkQueryParamsForLivrables(): void {
    const queryParams = new URLSearchParams(window.location.search);
    const openLivrables = queryParams.get('openLivrables');
    const missionId = queryParams.get('missionId');
    const livrableId = queryParams.get('livrableId');

    if (openLivrables === 'true' && missionId) {
      console.log(`[MissionsClient] Ouverture automatique des livrables pour mission ${missionId}, livrable ${livrableId}`);
      
      // Attendre que les missions soient chargées, puis ouvrir la modale
      setTimeout(() => {
        const mission = this.allMissions().find(m => m.id === Number(missionId));
        if (mission) {
          this.openLivrablesModal(mission);
        } else {
          console.warn(`[MissionsClient] Mission ${missionId} non trouvée pour ouverture automatique des livrables`);
        }
      }, 1000); // Délai pour laisser le temps aux missions de se charger
    }
  }

  loadClientMissions(clientId: number): void {
    this.isLoading.set(true);
    // Vider le cache lors d'un nouveau chargement
    this.clearCache();
    
    this.missionsService.getMissionsByClient(clientId).subscribe((missions: MissionCard[]) => {
      // 🔍 LOGS POUR DIAGNOSTIQUER LE PROBLÈME
      console.group('[MissionsClient] Chargement des missions');
      console.log('📋 Missions reçues du backend:', missions.map(m => ({
        id: m.id,
        titre: m.titre,
        statut: m.statut
      })));
      
      // Afficher d'abord les missions de base
      const basicMissions: MissionView[] = missions.map(m => ({
        ...m,
        livrablesEnAttente: 0
      }));
      
      console.log('🎯 Missions de base créées:', basicMissions.map(m => ({
        id: m.id,
        titre: m.titre,
        statut: m.statut
      })));
      
      this.allMissions.set(basicMissions);
      this.isLoading.set(false);
      
      // Enrichir progressivement les missions
      this.enrichMissionsProgressively(basicMissions);
      console.groupEnd();
    });
  }

  private clearCache(): void {
    this.freelanceCache.clear();
    this.livrablesCache.clear();
  }

  private async enrichMissionsProgressively(missions: MissionView[]): Promise<void> {
    this.isEnriching.set(true);
    
    console.group('[MissionsClient] Enrichissement progressif des missions');
    console.log('🔄 Début enrichissement pour', missions.length, 'missions');
    
    for (let i = 0; i < missions.length; i++) {
      const mission = missions[i];
      console.log(`📝 Enrichissement mission ${i + 1}/${missions.length}:`, {
        id: mission.id,
        titre: mission.titre
      });
      
      try {
        // Timeout de 5 secondes pour chaque enrichissement
        const enrichedMission = await Promise.race([
          this.enrichMission(mission),
          new Promise<MissionView>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          )
        ]);
        
        console.log(`✅ Mission ${mission.id} enrichie:`, {
          id: enrichedMission.id,
          titre: enrichedMission.titre,
          freelance: enrichedMission.freelance ? 'Oui' : 'Non',
          livrablesEnAttente: enrichedMission.livrablesEnAttente
        });
        
        // Mettre à jour la mission spécifique dans le signal
        this.allMissions.update(currentMissions => {
          console.log('🔄 Mise à jour du signal - Missions actuelles:', 
            currentMissions.map(m => ({ id: m.id, titre: m.titre }))
          );
          
          // Remplacer par ID (robuste si l'ordre change ailleurs)
          const updatedMissions = currentMissions.map(m => 
            m.id === mission.id ? enrichedMission : m
          );
          
          console.log('🔄 Missions après mise à jour:', 
            updatedMissions.map(m => ({ id: m.id, titre: m.titre }))
          );
          
          return updatedMissions;
        });
        
        // Petit délai pour éviter de surcharger l'API
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Erreur lors de l'enrichissement de la mission ${mission.id}:`, error);
        // Continuer avec les autres missions même en cas d'erreur
      }
    }
    
    console.log('🏁 Fin enrichissement progressif');
    console.groupEnd();
    this.isEnriching.set(false);
  }

  async enrichMission(mission: MissionView): Promise<MissionView> {
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

  private async loadFreelanceData(mission: MissionCard): Promise<FreelanceSummary | null> {
    // Vérifier le cache d'abord
    if (this.freelanceCache.has(mission.id)) {
      return this.freelanceCache.get(mission.id) || null;
    }

    const anyMission = mission as any;
    let summary: FreelanceSummary | undefined = anyMission.freelance || undefined;

    if (summary) {
      const photoAbs = this.fileStorageService.makeAbsolute(summary.photoUrl || summary.photoProfilUrl || '');
      const freelance: FreelanceSummary = { ...summary, photoUrl: photoAbs, photoProfilUrl: photoAbs, typeUtilisateur: 'FREELANCE' } as FreelanceSummary;
      
      // Mettre en cache
      this.freelanceCache.set(mission.id, freelance);
      return freelance;
    } else if ((anyMission.freelanceSelectionneId as number | undefined)) {
      try {
        const u = await firstValueFrom(this.utilisateurService.getUtilisateurById(anyMission.freelanceSelectionneId));
        if (u && typeof u.id === 'number') {
          const photoAbs = this.fileStorageService.makeAbsolute(u.photoProfilUrl || '');
          const freelance: FreelanceSummary = {
            id: u.id,
            nom: u.nom,
            prenom: u.prenom,
            photoUrl: photoAbs,
            photoProfilUrl: photoAbs,
            typeUtilisateur: 'FREELANCE'
          };
          this.freelanceCache.set(mission.id, freelance);
          return freelance;
        }
      } catch (e) {
        console.error(`Impossible de charger le freelance ID ${anyMission.freelanceSelectionneId}`, e);
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

  /**
   * Vérifie si une mission a des livrables en attente
   */
  hasLivrablesEnAttente(mission: MissionView): boolean {
    return mission.livrablesEnAttente ? mission.livrablesEnAttente > 0 : false;
  }

  // --- Modal de création/édition ---
  openCreateMissionModal(mission?: MissionView): void {
    this.isEditing.set(!!mission);
    if (mission) {
      const competencesString = mission.competencesRequises ? mission.competencesRequises.join(', ') : '';
      this.missionForm.patchValue({
        id: mission.id,
        titre: mission.titre,
        description: mission.description,
        budget: mission.budget,
        devise: mission.devise,
        typeRemuneration: mission.typeRemuneration,
        budgetMin: mission.budgetMin,
        budgetMax: mission.budgetMax,
        tjmJournalier: mission.tjmJournalier,
        delaiLivraison: mission.delaiLivraison,
        dureeEstimeeJours: mission.dureeEstimeeJours,
        dateLimiteCandidature: mission.dateLimiteCandidature,
        dateDebutSouhaitee: mission.dateDebutSouhaitee,
        chargeHebdoJours: mission.chargeHebdoJours,
        categorie: mission.categorie,
        localisation: mission.localisation,
        gouvernorat: mission.gouvernorat,
        modaliteTravail: mission.modaliteTravail,
        urgent: mission.urgent,
        qualiteBrief: mission.qualiteBrief,
        competences: competencesString,
        mediaUrls: (mission.mediaUrls || []).join(', '),
        videoBriefUrl: mission.videoBriefUrl
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

  /**
   * Mappe le formulaire vers un payload valide pour le backend
   */
  private mapFormToMissionPayload(formValue: any): any {
    // Traitement des compétences
    const rawComp = (formValue.competences ?? '').toString();
    const competencesArray = rawComp
      .split(',')
      .map((c: string) => c.trim())
      .filter((c: string) => c);

    // Traitement des URLs média
    const mediaUrlsArray = (formValue.mediaUrls ?? '').toString()
      .split(',')
      .map((u: string) => u.trim())
      .filter((u: string) => u);

    // Construction du payload avec seulement les champs supportés par le backend
    const payload: any = {
      titre: formValue.titre,
      description: formValue.description,
      budget: +formValue.budget, // Conversion en number
      devise: formValue.devise || 'TND',
      categorie: formValue.categorie,
      competencesRequises: competencesArray,
      localisation: formValue.localisation,
      gouvernorat: formValue.gouvernorat,
      modaliteTravail: formValue.modaliteTravail,
      dureeEstimeeJours: formValue.dureeEstimeeJours ? +formValue.dureeEstimeeJours : undefined,
      delaiLivraison: formValue.delaiLivraison,
      dateLimiteCandidature: formValue.dateLimiteCandidature,
      urgent: !!formValue.urgent,
      mediaUrls: mediaUrlsArray,
      videoBriefUrl: formValue.videoBriefUrl,
      client: { id: this.currentUser!.id } // Structure attendue par le backend
    };

    // Nettoyer les champs vides/null
    const cleaned: any = {};
    Object.keys(payload).forEach(key => {
      const v: any = payload[key];
      const isEmptyArray = Array.isArray(v) && v.length === 0;
      const isEmptyString = v === '' || v === undefined || v === null;
      if (!isEmptyArray && !isEmptyString) {
        cleaned[key] = v;
      }
    });

    return cleaned;
  }

  submitMissionForm(): void {
    if (this.missionForm.invalid || !this.currentUser) {
      // Debug: afficher les contrôles invalides
      const invalidControls = Object.entries(this.missionForm.controls)
        .filter(([_, control]) => control.invalid)
        .map(([name, control]) => ({ name, errors: control.errors }));
      console.warn('[Mission] Form invalid or no user', {
        hasCurrentUser: !!this.currentUser,
        invalidControls
      });
      return;
    }
    
    this.isSubmitting.set(true);
    const formValue = this.missionForm.value;
    
    // Utiliser la fonction de mapping pour créer un payload valide
    const cleanedPayload = this.mapFormToMissionPayload(formValue);
    
    // Ajouter l'ID pour les mises à jour
    if (this.isEditing() && formValue.id) {
      cleanedPayload.id = formValue.id;
    }

    const isUpdate = this.isEditing() && !!formValue.id;
    console.group('[Mission] Submit debug');
    console.log('formValue', formValue);
    console.log('payload (cleaned)', cleanedPayload);
    console.log('operation', isUpdate ? 'update' : 'create');
    console.groupEnd();

    const request$ = isUpdate
      ? this.missionsService.updateMission(formValue.id, cleanedPayload as Mission)
      : this.missionsService.createMission(cleanedPayload as Mission);

    console.time('[Mission] saveRequest');
    request$.subscribe({
      next: () => {
        console.timeEnd('[Mission] saveRequest');
        console.info('[Mission] Save OK');
        this.loadClientMissions(this.currentUser!.id!);
        this.isSubmitting.set(false);
        this.closeCreateMissionModal();
      },
      error: err => {
        console.timeEnd('[Mission] saveRequest');
        try {
          console.group('[Mission] Save error');
          console.error('HTTP status', err?.status, err?.statusText);
          console.error('URL', err?.url);
          console.error('Message', err?.message);
          if (err?.error) {
            if (typeof err.error === 'object') {
              console.error('Response error object', err.error);
            } else {
              console.error('Response error text', err.error);
            }
          }
          console.error('Full error', err);
          console.groupEnd();
        } catch { /* noop */ }
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
    const clientId = this.currentUser?.id;
    if (!clientId) {
      console.error('[Livrable] Pas d\'ID client disponible');
      alert('Erreur: Utilisateur non connecté');
      return;
    }

    // Debug pour vérifier les paramètres
    console.log(`[Livrable] ${action} - livrableId: ${livrableId}, clientId: ${clientId}, missionId: ${missionId}`);
    
    if (action === 'valider') {
      this.livrableService.debugValidateRequest(livrableId, clientId);
    }

    // Essayer d'abord la méthode normale, sinon utiliser l'alternative
    const apiCall = action === 'valider'
      ? this.livrableService.validateLivrable(livrableId, clientId)
      : this.livrableService.rejectLivrable(livrableId, clientId, 'Raison à ajouter');
    
    apiCall.subscribe({
      next: () => {
        console.log(`[Livrable] ${action} réussi pour livrable ${livrableId}`);
        // Rafraîchir les livrables dans la modale
        this.livrableService.getLivrablesForMission(missionId).subscribe(livrables => {
          this.livrablesForMission.set(livrables);
          // Rafraîchir aussi la carte de mission dans la liste principale
          this.refreshSingleMission(missionId);
        });
      },
      error: (error) => {
        console.error(`[Livrable] Erreur lors du ${action} du livrable ${livrableId}:`, error);
        // Récupérer le message renvoyé par le back s'il existe
        const serverMsg = typeof error?.error === 'string' ? error.error
                         : error?.error?.message || null;

        let message = serverMsg || `Erreur lors du ${action} du livrable`;
        if (!serverMsg) {
          if (error.status === 400) message = 'Erreur 400: clientId manquant/invalide.';
          else if (error.status === 422) message = 'Erreur 422: prérequis manquant pour le paiement.';
          else if (error.status === 403) message = 'Erreur 403: accès refusé.';
        }
        alert(message);
      }
    });
  }

  // Nouvelle méthode pour gérer le clic sur "Revoir & valider"
  handleValiderLivrable(livrableIdOrMissionId: number, mission: MissionView): void {
    // Si c'est un ID de livrable spécifique, valider directement
    if (mission.livrableIdEnAttente === livrableIdOrMissionId) {
      this.handleLivrableAction(livrableIdOrMissionId, 'valider', mission.id);
    } else {
      // Sinon, ouvrir la modale des livrables pour cette mission
      this.openLivrablesModal(mission);
    }
  }
  
  async refreshSingleMission(missionId: number) {
    console.group(`[MissionsClient] Rafraîchissement mission ${missionId}`);
    
    const currentMissions = this.allMissions();
    console.log('📋 Missions actuelles:', currentMissions.map(m => ({ id: m.id, titre: m.titre })));
    
    const missionToRefresh = currentMissions.find(m => m.id === missionId);
    if (missionToRefresh) {
      console.log('🔄 Mission trouvée pour rafraîchissement:', {
        id: missionToRefresh.id,
        titre: missionToRefresh.titre
      });
      
      try {
        const refreshedMission = await this.enrichMission(missionToRefresh);
        console.log('✅ Mission rafraîchie:', {
          id: refreshedMission.id,
          titre: refreshedMission.titre,
          livrablesEnAttente: refreshedMission.livrablesEnAttente
        });
        
        this.allMissions.update(missions => {
          const updatedMissions = missions.map(m => m.id === missionId ? refreshedMission : m);
          console.log('🔄 Missions après rafraîchissement:', 
            updatedMissions.map(m => ({ id: m.id, titre: m.titre }))
          );
          return updatedMissions;
        });
      } catch (error) {
        console.error(`❌ Erreur lors du rafraîchissement de la mission ${missionId}:`, error);
      }
    } else {
      console.warn(`⚠️ Mission ${missionId} non trouvée pour rafraîchissement`);
    }
    
    console.groupEnd();
  }

  // === CTA handlers from mission-card ===
  onPayerTranche(trancheId: number): void {
    try {
      console.log('[MissionCard] Payer tranche', trancheId);
      alert('Paiement de la tranche #' + trancheId + ' (TODO: implémenter la redirection paiement)');
    } catch {}
  }

  onBoosterMission(missionId: number): void {
    try {
      console.log('[MissionCard] Booster mission', missionId);
      alert('Booster la mission #' + missionId + ' (TODO: implémenter le flux booster)');
    } catch {}
  }

  onVoirDetails(missionId: number): void {
    try {
      console.log('[MissionCard] Voir détails mission', missionId);
      const mission = this.allMissions().find(m => m.id === missionId);
      if (mission) {
        this.openMissionDetail(mission);
      }
    } catch {}
  }

  openMissionDetail(mission: MissionView): void {
    console.log('[MissionsClient] Ouverture détails mission:', mission.id);
    this.selectedMissionForDetail.set(mission);
    this.isDetailOverlayOpen.set(true);
  }

  closeMissionDetail(): void {
    console.log('[MissionsClient] Fermeture détails mission');
    this.isDetailOverlayOpen.set(false);
    this.selectedMissionForDetail.set(null);
  }

  // Méthode de test pour vérifier les headers
  testHeaders(): void {
    const clientId = this.currentUser?.id;
    if (!clientId) {
      console.error('[Test] Pas d\'ID client disponible');
      return;
    }
    
    console.log('[Test] Test des headers avec clientId:', clientId);
    this.livrableService.debugValidateRequest(999, clientId);
  }

  /**
   * TrackBy function pour optimiser les performances de la liste des missions
   */
  trackByMissionId(index: number, mission: MissionView): number {
    return mission.id;
  }

  // === NOUVELLES MÉTHODES POUR L'INTERFACE ULTRA-MODERNE ===

  /**
   * Obtient le nombre de missions par statut pour afficher les compteurs
   */
  getStatusCount(status: string): number {
    if (status === 'Tous') return this.allMissions().length;
    return this.allMissions().filter(m => m.statut === status).length;
  }

  /**
   * Obtient la classe CSS pour le liseré de statut de la carte
   */
  getCardStatusClass(status: MissionStatut): string {
    switch (status) {
      case MissionStatut.EN_COURS: return 'card--en-cours';
      case MissionStatut.PRET_A_CLOTURER: return 'card--prete';
      case MissionStatut.TERMINEE: return 'card--terminee';
      case MissionStatut.ANNULEE: return 'card--annulee';
      case MissionStatut.EXPIREE: return 'card--expiree';
      // EN_ATTENTE et EN_ATTENTE_VALIDATION n'ont pas de classe spécifique pour le liseré,
      // elles utiliseront la couleur par défaut définie dans .mission-card
      default: return '';
    }
  }



  /**
   * Obtient l'icône FontAwesome pour le statut
   */
  getStatusIcon(status: MissionStatut): any {
    switch (status) {
      case MissionStatut.EN_ATTENTE: return this.faHourglassHalf;
      case MissionStatut.EN_COURS: return this.faPlay;
      case MissionStatut.EN_ATTENTE_VALIDATION: return this.faClipboardCheck;
      case MissionStatut.PRET_A_CLOTURER: return this.faFlagCheckered;
      case MissionStatut.TERMINEE: return this.faCheckCircle;
      case MissionStatut.ANNULEE: return this.faXmarkCircle;
      case MissionStatut.EXPIREE: return this.faClockRotateLeft;
      default: return this.faHourglassHalf;
    }
  }

  /**
   * Obtient l'affichage du budget formaté
   */
  getBudgetDisplay(mission: MissionView): string {
    const budget = mission.budget ?? 0;
    return this.formatTnd(budget);
  }

  /**
   * Formate un nombre en devise TND
   */
  formatTnd(value: number): string {
    return `TND ${value.toLocaleString('fr-TN')}`;
  }

  /**
   * Obtient le pourcentage de progression
   */
  getProgressPercentage(mission: MissionView): number {
    const progress = mission.progressPct ?? 0;
    return Math.min(100, Math.max(0, progress));
  }

  /**
   * Obtient le nom du freelance
   */
  getFreelanceName(freelance: any): string {
    if (!freelance) return 'Freelance';
    const prenom = freelance.prenom;
    const nom = freelance.nom;
    if (prenom || nom) return [prenom, nom].filter(Boolean).join(' ');
    return freelance.nomAffichage || 'Freelance';
  }

  /**
   * Obtient la photo du freelance
   */
  getFreelancePhoto(freelance: any): string {
    if (!freelance) return 'assets/default-avatar.png';
    return freelance.photoProfilUrl || freelance.photoUrl || 'assets/default-avatar.png';
  }

  /**
   * Détermine la prochaine action à afficher
   */
  getNextAction(mission: MissionView): string {
    if (mission.livrablesEnAttente && mission.livrablesEnAttente > 0) {
      return 'valider';
    }
    if (mission.trancheIdDue) {
      return 'payer';
    }
    if (mission.pretACloturer) {
      return 'cloturer';
    }
    if (mission.statut === MissionStatut.EXPIREE) {
      return 'booster';
    }
    return 'details';
  }

  /**
   * Obtient l'icône FontAwesome pour le statut des livrables
   */
  getLivrableStatusIcon(status: StatusLivrable): any {
    switch (status) {
      case StatusLivrable.EN_ATTENTE: return this.faHourglassHalf;
      case StatusLivrable.VALIDE: return this.faCheckCircle;
      case StatusLivrable.REJETE: return this.faXmarkCircle;
      default: return this.faHourglassHalf;
    }
  }

  /**
   * Obtient le libellé humain pour le statut des livrables
   */
  getLivrableStatusLabel(status: StatusLivrable): string {
    switch (status) {
      case StatusLivrable.EN_ATTENTE: return 'En attente';
      case StatusLivrable.VALIDE: return 'Validé';
      case StatusLivrable.REJETE: return 'Rejeté';
      default: return status;
    }
  }

  /**
   * Gère la pluralisation simple pour l'UI
   */
  plural(n: number, singular: string, plural: string): string {
    if (n === null || n === undefined) n = 0;
    return `${n} ${n > 1 ? plural : singular}`;
  }
}
