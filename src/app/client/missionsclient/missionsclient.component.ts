import { Component, OnInit, inject, signal, computed, WritableSignal } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { CommonModule, TitleCasePipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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

// + AJOUTER
import { FeedbackApiService } from '../../services/feedback-api.service';
import { FeedbackSocketService } from '../../services/feedback-socket.service';
import { Audience, CriterionType, FeedbackRole } from '../../models/feedback.enums';
import { FeedbackEligibility, FeedbackWindow, FeedbackCreateRequest, FeedbackResponse, FeedbackUpdateRequest, ScoreItem } from '../../models/feedback.models';
import { generateIdempotencyKey } from '../../utils/idempotency.util';

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
import { StarsRatingComponent } from '../../shared/components/stars-rating/stars-rating.component';

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
    FontAwesomeModule,
    StarsRatingComponent
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
  private router = inject(Router);
  private fb = inject(FormBuilder);

  // + AJOUTER
  private feedbackApi = inject(FeedbackApiService);
  private feedbackSocket = inject(FeedbackSocketService);

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

  // + AJOUTER - Feedback Modal State
  isFeedbackModalOpen = signal(false);
  isSubmittingFeedback = signal(false);
  selectedMissionForFeedback: WritableSignal<MissionView | null> = signal(null);
  feedbackModalMode = signal<'create' | 'view' | 'edit'>('create');

  feedbackEligibility = signal<Record<number, FeedbackEligibility>>({});
  feedbackWindow = signal<Record<number, FeedbackWindow>>({});
  feedbackData = signal<Record<number, FeedbackResponse>>({});

  feedbackForm: FormGroup;

  // Critères (client -> freelance)
  readonly criteriaForClient: CriterionType[] = [
    CriterionType.QUALITY, CriterionType.TIMELINESS, CriterionType.COMMUNICATION,
    CriterionType.TECHNICAL, CriterionType.GLOBAL
  ];

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

    // + AJOUTER - Feedback Form avec validation complète
    this.feedbackForm = this.fb.group({
      quality: [1, [Validators.required, Validators.min(1), Validators.max(5)]],
      timeliness: [1, [Validators.required, Validators.min(1), Validators.max(5)]],
      communication: [1, [Validators.required, Validators.min(1), Validators.max(5)]],
      technical: [1, [Validators.required, Validators.min(1), Validators.max(5)]],
      global: [1, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.required, Validators.minLength(30), Validators.maxLength(800)]]
    });
  }

  ngOnInit(): void {
    // Log de configuration au démarrage
    console.group('[MissionsClient] Configuration Feedback');
    console.log('🔧 Services injectés:');
    console.log('  - FeedbackApiService:', !!this.feedbackApi);
    console.log('  - FeedbackSocketService:', !!this.feedbackSocket);
    console.log('🔧 Configuration feedback:');
    console.log('  - Critères disponibles:', this.criteriaForClient);
    console.log('  - Form initialisé:', !!this.feedbackForm);
    console.log('🔧 État initial:');
    console.log('  - feedbackData:', this.feedbackData());
    console.log('  - feedbackEligibility:', this.feedbackEligibility());
    console.log('  - feedbackWindow:', this.feedbackWindow());
    console.groupEnd();

    // 🔥 CORRECTION : Ajouter des watchers pour auto-correction des scores
    this.setupScoreWatchers();

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
   * Configure les watchers pour auto-correction des scores
   */
  private setupScoreWatchers(): void {
    console.group('[Feedback] Configuration des watchers de scores');
    
    ['quality', 'timeliness', 'communication', 'technical', 'global'].forEach(k => {
      const c = this.feedbackForm.get(k)!;
      c.valueChanges.subscribe(v => {
        const coerced = this.coerceScore(v);
        if (v !== coerced) {
          console.log(`[Feedback] Auto-correction ${k}: ${v} → ${coerced}`);
          c.setValue(coerced, { emitEvent: false });
        }
      });
    });
    
    console.log('[Feedback] ✅ Watchers configurés pour auto-correction des scores');
    console.groupEnd();
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
      
      // + AJOUTER - Pré-charger l'éligibilité feedback et les données existantes
      missions.forEach((m, index) => {
        console.log(`[Feedback] Pré-chargement pour mission ${m.id} (statut: ${m.statut})`);
        this.prefetchFeedbackEligibility(m.id);
        
        // 🔥 CORRECTION : Charger les données de feedback pour TOUTES les missions terminées/prêtes
        if (m.statut === 'TERMINEE' || m.statut === 'PRET_A_CLOTURER') {
          console.log(`[Feedback] 🔥 Chargement feedback pour mission ${m.id} (statut: ${m.statut})`);
          // Délai progressif pour éviter de surcharger l'API
          setTimeout(() => {
            this.loadFeedbackData(m.id);
          }, index * 200); // Délai progressif de 200ms par mission
        }
      });
      
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
  onPayerTranche(trancheId: number, mission?: MissionView): void {
    try {
      console.log('[MissionCard] Payer tranche', trancheId);
      
      if (mission) {
        console.log('[MissionCard] Navigation vers paiements avec mission:', {
          missionId: mission.id,
          missionTitle: mission.titre,
          trancheId: trancheId
        });
        
        // Navigation vers la section paiements avec les paramètres de la mission et tranche
        this.router.navigate(['/client/paiements'], {
          queryParams: {
            missionId: mission.id,
            missionTitle: mission.titre,
            trancheId: trancheId,
            category: mission.categorie,
            budget: mission.budget
          }
        }).then(success => {
          console.log('[MissionCard] Navigation vers paiements réussie:', success);
        }).catch(error => {
          console.error('[MissionCard] Erreur navigation vers paiements:', error);
        });
      } else {
        // Fallback vers la section paiements générale
        console.log('[MissionCard] Navigation vers paiements générale');
        this.router.navigate(['/client/paiements']).then(success => {
          console.log('[MissionCard] Navigation générale vers paiements réussie:', success);
        }).catch(error => {
          console.error('[MissionCard] Erreur navigation générale vers paiements:', error);
        });
      }
    } catch (error) {
      console.error('[MissionCard] Erreur lors du paiement de la tranche:', error);
    }
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
    
    // S'assurer qu'on reste dans le composant MissionsClient
    // Ne pas rediriger ou changer de route
  }

  /**
   * Navigue vers l'exploration des freelances
   */
  navigateToExploreFreelancers(mission?: MissionView): void {
    console.log('[MissionsClient] Navigation vers exploration des freelances');
    
    if (mission) {
      console.log('[MissionsClient] Mission sélectionnée:', {
        id: mission.id,
        titre: mission.titre,
        categorie: mission.categorie,
        budget: mission.budget,
        competencesRequises: mission.competencesRequises
      });
      
      // Navigation avec les paramètres de la mission
      this.router.navigate(['/client/explorer-freelances'], {
        queryParams: {
          missionId: mission.id,
          missionTitle: mission.titre,
          category: mission.categorie,
          budget: mission.budget,
          skills: mission.competencesRequises?.join(',') || ''
        }
      }).then(success => {
        console.log('[MissionsClient] Navigation avec mission réussie:', success);
      }).catch(error => {
        console.error('[MissionsClient] Erreur de navigation avec mission:', error);
      });
    } else {
      // Navigation générale sans mission spécifique
      console.log('[MissionsClient] Route cible: /client/explorer-freelances');
      this.router.navigate(['/client/explorer-freelances']).then(success => {
        console.log('[MissionsClient] Navigation générale réussie:', success);
      }).catch(error => {
        console.error('[MissionsClient] Erreur de navigation générale:', error);
      });
    }
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
    // + AJOUTER - Feedback en priorité
    if (this.isFeedbackEligible(mission)) {
      return 'feedback';
    }
    
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
   * Détermine les actions disponibles pour le feedback (simplifié pour les cartes de mission)
   */
  getFeedbackActions(mission: MissionView): string[] {
    const actions: string[] = [];
    
    // 🔥 CORRECTION : Debug détaillé pour voir l'état
    const feedbackData = this.feedbackData()[mission.id];
    const eligibility = this.feedbackEligibility()[mission.id];
    const hasFeedback = this.hasFeedback(mission);
    const isEligible = this.isFeedbackEligible(mission);
    
    console.log(`[Feedback] getFeedbackActions pour mission ${mission.id}:`, {
      missionStatut: mission.statut,
      hasFeedback,
      isEligible,
      feedbackData: feedbackData ? {
        id: feedbackData.id,
        submittedAt: feedbackData.submittedAt,
        publishedAt: feedbackData.publishedAt,
        overallRating: feedbackData.overallRating
      } : null,
      eligibility: eligibility ? {
        eligible: eligibility.eligible,
        reason: eligibility.reason
      } : null,
      feedbackDataKeys: Object.keys(this.feedbackData()),
      allFeedbackData: this.feedbackData()
    });
    
    // 🔥 CORRECTION : Logique simplifiée - seulement create et view dans les cartes
    if (hasFeedback && feedbackData) {
      console.log(`[Feedback] ✅ Feedback trouvé pour mission ${mission.id}, ajout de l'action 'view'`);
      actions.push('view'); // Toujours possible de voir
    } else if (isEligible) {
      console.log(`[Feedback] ✅ Mission ${mission.id} éligible au feedback, ajout de l'action 'create'`);
      actions.push('create');
    } else {
      console.log(`[Feedback] ❌ Mission ${mission.id} non éligible au feedback`);
    }
    
    console.log(`[Feedback] 🎯 Actions finales pour mission ${mission.id}:`, actions);
    return actions;
  }

  /**
   * Force le rechargement des données de feedback pour une mission
   */
  refreshFeedbackData(missionId: number): void {
    console.group(`[Feedback] 🔥 Rechargement forcé des données pour mission ${missionId}`);
    console.log('📊 État avant rechargement:', {
      missionId,
      currentFeedbackData: this.feedbackData()[missionId],
      allFeedbackDataKeys: Object.keys(this.feedbackData())
    });
    
    // 🔥 CORRECTION : Vider les données existantes pour forcer le rechargement
    this.feedbackData.update(map => {
      const newMap = { ...map };
      delete newMap[missionId];
      console.log(`[Feedback] 🔥 Données vidées pour mission ${missionId}:`, {
        newMap,
        allKeys: Object.keys(newMap)
      });
      return newMap;
    });
    
    // Recharger l'éligibilité
    this.prefetchFeedbackEligibility(missionId);
    
    // Recharger la fenêtre
    this.loadFeedbackWindow(missionId);
    
    // Forcer le rechargement des données de feedback
    this.loadFeedbackData(missionId);
    
    // 🔥 CORRECTION : Forcer le change detection après un délai
    setTimeout(() => {
      console.log('[Feedback] 🔥 État final après rechargement:', {
        missionId,
        feedbackData: this.feedbackData()[missionId],
        hasFeedback: this.hasFeedback({ id: missionId } as MissionView),
        actions: this.getFeedbackActions({ id: missionId } as MissionView),
        allFeedbackDataKeys: Object.keys(this.feedbackData())
      });
      console.groupEnd();
    }, 500);
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

  // + AJOUTER - Feedback Methods

  /**
   * Pré-charge l'éligibilité feedback pour une mission
   */
  private prefetchFeedbackEligibility(missionId: number): void {
    console.group(`[Feedback] Vérification éligibilité pour mission ${missionId}`);
    console.log('🎯 Mission ID:', missionId);
    console.log('🌐 Appel API: GET /api/feedback/eligibility?missionId=' + missionId);
    console.groupEnd();
    
    this.feedbackApi.eligibility(missionId).subscribe({
      next: (e) => {
        console.log(`[Feedback] ✅ Éligibilité mission ${missionId}:`, e);
        this.feedbackEligibility.update(map => ({ ...map, [missionId]: e }));
        
        // 🔥 CORRECTION : Toujours charger les données de feedback si éligible
        if (e.eligible) {
          console.log(`[Feedback] 🔥 Mission ${missionId} éligible, chargement des données de feedback`);
          this.loadFeedbackData(missionId);
        }
      },
      error: (err) => {
        console.error(`[Feedback] ❌ Erreur éligibilité mission ${missionId}:`, err);
        console.error('🌐 URL appelée:', `GET /api/feedback/eligibility?missionId=${missionId}`);
      }
    });
  }

  /**
   * Charge la fenêtre feedback pour une mission
   */
  private loadFeedbackWindow(missionId: number): void {
    console.group(`[Feedback] Chargement fenêtre pour mission ${missionId}`);
    console.log('🎯 Mission ID:', missionId);
    console.log('🌐 Appel API: GET /api/feedback/window?missionId=' + missionId);
    console.groupEnd();
    
    this.feedbackApi.window(missionId).subscribe({
      next: (w) => {
        console.log(`[Feedback] ✅ Fenêtre mission ${missionId}:`, w);
        this.feedbackWindow.update(map => ({ ...map, [missionId]: w }));
        
        // 🔥 CORRECTION : Vérifier si on peut ouvrir le modal de vue
        this.checkAndOpenViewModal(missionId);
      },
      error: (err) => {
        console.error(`[Feedback] ❌ Erreur fenêtre mission ${missionId}:`, err);
        console.error('🌐 URL appelée:', `GET /api/feedback/window?missionId=${missionId}`);
      }
    });
  }

  /**
   * Vérifie si toutes les données nécessaires sont chargées et ouvre le modal de vue si approprié
   */
  private checkAndOpenViewModal(missionId: number): void {
    const feedback = this.feedbackData()[missionId];
    const window = this.feedbackWindow()[missionId];
    const mission = this.selectedMissionForFeedback();
    
    console.log(`[Feedback] 🔍 Vérification ouverture modal pour mission ${missionId}:`, {
      hasFeedback: !!feedback,
      hasWindow: !!window,
      modalMode: this.feedbackModalMode(),
      isModalOpen: this.isFeedbackModalOpen(),
      mission: mission ? { id: mission.id, titre: mission.titre } : null
    });
    
    // Ouvrir le modal seulement si :
    // 1. On est en mode 'view'
    // 2. Le modal n'est pas déjà ouvert
    // 3. On a une mission sélectionnée
    // 4. On a les données de feedback (la fenêtre peut être optionnelle pour l'affichage)
    if (this.feedbackModalMode() === 'view' && 
        !this.isFeedbackModalOpen() && 
        mission && 
        mission.id === missionId && 
        feedback) {
      
      console.log('[Feedback] 🎯 Ouverture automatique du modal de vue après chargement complet');
      this.isFeedbackModalOpen.set(true);
      
      // Log final pour debug
      setTimeout(() => {
        console.log('[Feedback] 📊 État final après ouverture modal:', {
          missionId,
          feedbackData: this.feedbackData()[missionId],
          feedbackWindow: this.feedbackWindow()[missionId],
          canModify: this.canModifyFeedback(mission),
          modalOpen: this.isFeedbackModalOpen(),
          modalMode: this.feedbackModalMode()
        });
      }, 100);
    }
  }

  /**
   * Vérifie si une mission est éligible au feedback
   */
  isFeedbackEligible(m: MissionView): boolean {
    const e = this.feedbackEligibility()[m.id];
    // Par design: bouton seulement si mission prête/terminée ET eligible renvoyé par le back
    const statutOK = m.statut === MissionStatut.PRET_A_CLOTURER || m.statut === MissionStatut.TERMINEE;
    return !!e?.eligible && statutOK;
  }

  /**
   * Vérifie si un feedback existe pour une mission
   */
  hasFeedback(m: MissionView): boolean {
    const feedback = this.feedbackData()[m.id];
    const hasFeedback = !!feedback;
    
    // 🔥 CORRECTION : Logs détaillés pour debug
    console.log(`[Feedback] hasFeedback pour mission ${m.id}:`, {
      missionId: m.id,
      missionStatut: m.statut,
      feedback: feedback ? {
        id: feedback.id,
        submittedAt: feedback.submittedAt,
        publishedAt: feedback.publishedAt,
        overallRating: feedback.overallRating
      } : null,
      hasFeedback,
      feedbackDataKeys: Object.keys(this.feedbackData()),
      allFeedbackData: this.feedbackData()
    });
    
    return hasFeedback;
  }

  /**
   * Vérifie si un feedback peut être modifié
   */
  canModifyFeedback(m: MissionView): boolean {
    const feedback = this.feedbackData()[m.id];
    const window = this.feedbackWindow()[m.id];
    
    console.log(`[Feedback] 🔍 canModifyFeedback pour mission ${m.id}:`, {
      hasFeedback: !!feedback,
      hasWindow: !!window,
      feedback: feedback ? {
        id: feedback.id,
        publishedAt: feedback.publishedAt,
        submittedAt: feedback.submittedAt
      } : null,
      window: window ? {
        expiresAt: window.expiresAt,
        openedAt: window.openedAt
      } : null
    });
    
    if (!feedback || !window) {
      console.log(`[Feedback] ❌ canModifyFeedback = false (données manquantes)`);
      return false;
    }
    
    // Vérifier que la fenêtre n'est pas expirée
    const now = new Date();
    const expiresAt = new Date(window.expiresAt);
    const isWindowOpen = now < expiresAt;
    
    // Vérifier que le feedback n'est pas déjà publié
    const isNotPublished = !feedback.publishedAt;
    
    const result = isWindowOpen && isNotPublished;
    
    console.log(`[Feedback] 🔍 canModifyFeedback calcul:`, {
      now: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      isWindowOpen,
      isNotPublished,
      result
    });
    
    return result;
  }

  /**
   * Vérifie si un feedback peut être supprimé
   */
  canDeleteFeedback(m: MissionView): boolean {
    return this.canModifyFeedback(m); // Mêmes conditions que la modification
  }

  /**
   * Ouvre la modale de feedback (création)
   */
  openFeedbackModal(mission: MissionView): void {
    console.group('[Feedback] Ouverture modale de création');
    console.log('📋 Mission sélectionnée:', {
      id: mission.id,
      titre: mission.titre,
      statut: mission.statut,
      freelanceSelectionneId: (mission as any).freelanceSelectionneId,
      freelance: mission.freelance,
      clientId: mission.clientId
    });
    console.log('👤 Current user:', {
      id: this.currentUser?.id,
      nom: this.currentUser?.nom,
      prenom: this.currentUser?.prenom,
      typeUtilisateur: this.currentUser?.typeUtilisateur
    });
    console.groupEnd();

    this.selectedMissionForFeedback.set(mission);
    this.feedbackModalMode.set('create');
    this.isFeedbackModalOpen.set(true);

    // Charge la fenêtre / souscris au temps réel pour cette mission
    this.loadFeedbackWindow(mission.id);
    this.feedbackSocket.connect(); // idempotent

    // S'abonner aux publications en temps réel
    this.feedbackSocket.subscribeToPublished(mission.id).subscribe(() => {
      // feedback publié → on peut rafraîchir la fenêtre/éligibilité
      this.prefetchFeedbackEligibility(mission.id);
      this.loadFeedbackWindow(mission.id);
    });
  }

  /**
   * Ferme la modale de feedback
   */
  closeFeedbackModal(): void {
    const mission = this.selectedMissionForFeedback();
    
    console.log('[Feedback] Fermeture modale pour mission:', mission?.id);
    
    this.isFeedbackModalOpen.set(false);
    this.selectedMissionForFeedback.set(null);
    this.feedbackModalMode.set('create');
    
    // 🔥 CORRECTION : Forcer le rechargement des données si on a une mission
    if (mission) {
      setTimeout(() => {
        console.log('[Feedback] 🔄 Rechargement après fermeture modale pour mission:', mission.id);
        this.refreshFeedbackData(mission.id);
        
        // Vérifier l'état après rechargement
        setTimeout(() => {
          console.log('[Feedback] ✅ État final après fermeture modale:', {
            missionId: mission.id,
            feedbackData: this.feedbackData()[mission.id],
            hasFeedback: this.hasFeedback(mission),
            actions: this.getFeedbackActions(mission)
          });
        }, 300);
      }, 100); // Délai réduit pour une meilleure réactivité
    }
  }

  /**
   * Obtient le mode de la modale de feedback
   */
  getFeedbackModalMode(): 'create' | 'view' | 'edit' {
    return this.feedbackModalMode();
  }

  /**
   * Obtient le titre de la modale de feedback
   */
  getFeedbackModalTitle(): string {
    switch (this.feedbackModalMode()) {
      case 'create': return 'Donner un avis';
      case 'view': return 'Voir mon avis';
      case 'edit': return 'Modifier mon avis';
      default: return 'Feedback';
    }
  }

  /**
   * Charge le feedback existant pour une mission
   */
  private loadFeedbackData(missionId: number): void {
    console.group(`[Feedback] 🔄 Chargement feedback pour mission ${missionId}`);
    console.log('🎯 Mission ID:', missionId);
    console.log('🌐 Appel API: GET /api/feedback/by-mission/{missionId}');
    console.log('📊 État avant chargement:', {
      currentFeedbackData: this.feedbackData(),
      hasExistingData: !!this.feedbackData()[missionId],
      allFeedbackDataKeys: Object.keys(this.feedbackData()),
      modalMode: this.feedbackModalMode(),
      isModalOpen: this.isFeedbackModalOpen()
    });
    console.groupEnd();
    
    this.feedbackApi.getFeedbackByMission(missionId).subscribe({
      next: (feedback) => {
        console.group(`[Feedback] ✅ Feedback chargé pour mission ${missionId}`);
        console.log('📋 Feedback reçu:', {
          id: feedback.id,
          missionId: feedback.missionId,
          submittedAt: feedback.submittedAt,
          publishedAt: feedback.publishedAt,
          overallRating: feedback.overallRating,
          comment: feedback.comment?.substring(0, 50) + '...'
        });
        
        // 🔥 CORRECTION : Mettre à jour les données avec logs détaillés
        this.feedbackData.update(map => {
          const newMap = { ...map, [missionId]: feedback };
          console.log(`[Feedback] 📊 Nouveau feedbackData après chargement:`, {
            missionId,
            newMap,
            allKeys: Object.keys(newMap)
          });
          return newMap;
        });
        
        // 🔥 CORRECTION : Vérifier si on peut ouvrir le modal de vue
        this.checkAndOpenViewModal(missionId);
        
        // Vérifier immédiatement après la mise à jour
        setTimeout(() => {
          console.log(`[Feedback] 📊 Vérification après chargement:`, {
            missionId,
            feedbackData: this.feedbackData()[missionId],
            hasFeedback: this.hasFeedback({ id: missionId } as MissionView),
            actions: this.getFeedbackActions({ id: missionId } as MissionView),
            modalOpen: this.isFeedbackModalOpen(),
            modalMode: this.feedbackModalMode()
          });
          console.groupEnd();
        }, 50);
      },
      error: (err) => {
        console.group(`[Feedback] ❌ Erreur chargement feedback mission ${missionId}`);
        console.error('🌐 URL appelée:', `GET /api/feedback/by-mission/${missionId}`);
        console.error('❌ Status:', err.status);
        console.error('❌ Message:', err.message);
        console.error('❌ Détail erreur:', err.error);
        
        // Si 404, c'est normal (pas de feedback encore)
        if (err.status === 404) {
          console.log(`[Feedback] ℹ️ Aucun feedback trouvé pour mission ${missionId} (normal si pas encore soumis)`);
        } else {
          console.error('❌ Erreur inattendue:', err);
        }
        console.groupEnd();
      }
    });
  }

  /**
   * Ouvre la modale de lecture du feedback
   */
  openFeedbackViewModal(mission: MissionView): void {
    console.group('[Feedback] Ouverture modale de lecture');
    console.log('📋 Mission sélectionnée:', {
      id: mission.id,
      titre: mission.titre,
      statut: mission.statut
    });
    console.log('📊 Données de feedback existantes:', this.feedbackData()[mission.id]);
    console.log('📊 Fenêtre de feedback existante:', this.feedbackWindow()[mission.id]);
    console.groupEnd();

    this.selectedMissionForFeedback.set(mission);
    this.feedbackModalMode.set('view');

    // 🔥 CORRECTION : Vérifier si TOUTES les données sont déjà chargées
    const existingFeedback = this.feedbackData()[mission.id];
    const existingWindow = this.feedbackWindow()[mission.id];
    
    if (existingFeedback && existingWindow) {
      console.log('[Feedback] ✅ Toutes les données déjà chargées, ouverture immédiate du modal');
      console.log('[Feedback] 🔍 canModifyFeedback:', this.canModifyFeedback(mission));
      this.isFeedbackModalOpen.set(true);
    } else {
      console.log('[Feedback] ⏳ Données manquantes, chargement avant ouverture');
      console.log('[Feedback] 📊 État des données:', {
        hasFeedback: !!existingFeedback,
        hasWindow: !!existingWindow
      });
      
      // 🔥 CORRECTION : Charger les deux types de données nécessaires
      this.loadFeedbackData(mission.id);
      this.loadFeedbackWindow(mission.id);
      
      // Le modal s'ouvrira automatiquement après le chargement des données
    }
  }

  /**
   * Ouvre la modale de modification du feedback
   */
  openFeedbackEditModal(mission: MissionView): void {
    console.group('[Feedback] Ouverture modale de modification');
    console.log('📋 Mission sélectionnée:', {
      id: mission.id,
      titre: mission.titre,
      statut: mission.statut
    });
    console.groupEnd();

    const feedback = this.feedbackData()[mission.id];
    if (!feedback) {
      console.error('[Feedback] Aucun feedback trouvé pour la mission', mission.id);
      alert('Aucun feedback trouvé pour cette mission.');
      return;
    }

    this.selectedMissionForFeedback.set(mission);
    this.feedbackModalMode.set('edit');
    this.isFeedbackModalOpen.set(true);

    // Pré-remplir le formulaire avec les données actuelles
    this.populateFeedbackForm(feedback);
  }

  /**
   * Pré-remplit le formulaire avec les données du feedback (avec coercition robuste)
   */
  private populateFeedbackForm(feedback: FeedbackResponse): void {
    console.group('[Feedback] Pré-remplissage du formulaire avec coercition');
    console.log('📝 Feedback à pré-remplir:', {
      id: feedback.id,
      overallRating: feedback.overallRating,
      comment: feedback.comment?.substring(0, 50) + '...',
      submittedAt: feedback.submittedAt
    });
    
    // 🔥 CORRECTION : Clamp robuste pour chaque score
    const clamp = (n: any) => Math.max(1, Math.min(5, Number(n) || 1));
    const base = clamp(feedback.overallRating);
    
    // Récupérer les valeurs actuelles du formulaire ou utiliser la base
    const currentValues = this.feedbackForm.value;
    
    this.feedbackForm.patchValue({
      quality: clamp(currentValues?.quality ?? base),
      timeliness: clamp(currentValues?.timeliness ?? base),
      communication: clamp(currentValues?.communication ?? base),
      technical: clamp(currentValues?.technical ?? base),
      global: clamp(currentValues?.global ?? base),
      comment: feedback.comment || ''
    });
    
    console.log('📝 Formulaire pré-rempli avec clamp robuste:', {
      quality: clamp(currentValues?.quality ?? base),
      timeliness: clamp(currentValues?.timeliness ?? base),
      communication: clamp(currentValues?.communication ?? base),
      technical: clamp(currentValues?.technical ?? base),
      global: clamp(currentValues?.global ?? base),
      comment: feedback.comment?.substring(0, 50) + '...'
    });
    console.groupEnd();
  }

  /**
   * Met à jour le feedback
   */
  updateFeedback(): void {
    const mission = this.selectedMissionForFeedback();
    
    // 🔥 CORRECTION : Validation renforcée avec message clair
    if (!mission) {
      console.group('[Feedback] Validation échouée - Mission manquante');
      console.log('❌ Mission:', mission);
      console.groupEnd();
      return;
    }
    
    if (this.feedbackForm.invalid) {
      console.group('[Feedback] Validation échouée - Formulaire invalide pour modification');
      console.log('❌ Form valid:', this.feedbackForm.valid);
      console.log('❌ Form errors:', this.feedbackForm.errors);
      console.log('❌ Form values:', this.feedbackForm.value);
      
      // Vérifier spécifiquement les scores
      const scores = this.feedbackForm.value;
      const invalidScores = [];
      if (scores.quality < 1 || scores.quality > 5) invalidScores.push('Qualité');
      if (scores.timeliness < 1 || scores.timeliness > 5) invalidScores.push('Respect des délais');
      if (scores.communication < 1 || scores.communication > 5) invalidScores.push('Communication');
      if (scores.technical < 1 || scores.technical > 5) invalidScores.push('Technique');
      if (scores.global < 1 || scores.global > 5) invalidScores.push('Appréciation globale');
      
      if (invalidScores.length > 0) {
        alert(`Tous les scores doivent être entre 1 et 5. Problèmes détectés : ${invalidScores.join(', ')}`);
      } else {
        alert('Veuillez remplir tous les champs correctement.');
      }
      console.groupEnd();
      return;
    }

    const feedback = this.feedbackData()[mission.id];
    if (!feedback) {
      console.error('[Feedback] Aucun feedback trouvé pour la mission', mission.id);
      alert('Aucun feedback trouvé pour cette mission.');
      return;
    }

    const updateRequest: FeedbackUpdateRequest = {
      comment: this.feedbackForm.value.comment,
      scores: this.buildScoresFromForm(),
      idempotencyKey: generateIdempotencyKey()
    };

    // 🔥 CORRECTION : Logs de debug détaillés pour le payload
    console.group('[Feedback] Mise à jour du feedback');
    console.log('🌐 URL complète: PUT /api/feedback/' + feedback.id);
    console.log('📤 Payload envoyé au backend:', updateRequest);
    console.log('📤 Payload JSON:', JSON.stringify(updateRequest, null, 2));
    console.log('📊 Form values avant envoi:', this.feedbackForm.value);
    console.log('📊 Scores construits:', this.buildScoresFromForm());
    console.log('🔑 Headers attendus: X-Idempotency-Key: ' + updateRequest.idempotencyKey);
    console.log('🍪 WithCredentials: true');
    console.groupEnd();

    // 🔥 GARDE-FOU : Vérification finale des scores avant envoi
    console.group('[Feedback] 🔍 GARDE-FOU - Vérification finale des scores (UPDATE)');
    const finalScores = updateRequest.scores;
    const invalidScores = finalScores.filter(s => s.score < 1 || s.score > 5 || !Number.isInteger(s.score));
    if (invalidScores.length > 0) {
      console.error('[Feedback] ❌ ERREUR CRITIQUE : Scores invalides détectés avant envoi:', invalidScores);
      console.error('[Feedback] ❌ Arrêt de l\'envoi pour éviter ConstraintViolationException');
      alert('Erreur : Scores invalides détectés. Veuillez réessayer.');
      return;
    }
    console.log('[Feedback] ✅ Tous les scores sont valides:', finalScores.map(s => `${s.criterion}=${s.score}`));
    console.groupEnd();

    this.isSubmittingFeedback.set(true);
    this.feedbackApi.updateFeedback(feedback.id, updateRequest, { idempotencyKey: updateRequest.idempotencyKey }).subscribe({
      next: (res) => {
        console.group('[Feedback] Mise à jour OK');
        console.log('✅ Réponse du backend:', res);
        console.groupEnd();
        
        this.isSubmittingFeedback.set(false);
        // Mettre à jour les données locales
        this.feedbackData.update(map => ({ ...map, [mission.id]: res }));
        this.closeFeedbackModal();
        alert('Votre avis a été modifié avec succès.');
      },
      error: (err) => {
        console.group('[Feedback] Erreur mise à jour');
        console.error('🌐 URL appelée: PUT /api/feedback/' + feedback.id);
        console.error('❌ Status:', err.status);
        console.error('❌ Message:', err.message);
        console.error('❌ Détail erreur:', err.error);
        console.error('📤 Payload envoyé:', updateRequest);
        console.groupEnd();
        
        this.isSubmittingFeedback.set(false);
        alert(err?.error?.message || 'Erreur lors de la modification du feedback.');
      }
    });
  }

  /**
   * Supprime le feedback
   */
  deleteFeedback(mission: MissionView): void {
    const feedback = this.feedbackData()[mission.id];
    if (!feedback) {
      console.error('[Feedback] Aucun feedback trouvé pour la mission', mission.id);
      alert('Aucun feedback trouvé pour cette mission.');
      return;
    }

    const confirmed = confirm('Êtes-vous sûr de vouloir supprimer votre avis ? Cette action est irréversible.');
    if (!confirmed) {
      return;
    }

    console.group('[Feedback] Suppression du feedback');
    console.log('🌐 URL complète: DELETE /api/feedback/' + feedback.id);
    console.log('🍪 WithCredentials: true');
    console.groupEnd();

    this.feedbackApi.deleteFeedback(feedback.id).subscribe({
      next: () => {
        console.group('[Feedback] Suppression OK');
        console.log('✅ Feedback supprimé avec succès');
        console.groupEnd();
        
        // Supprimer des données locales
        this.feedbackData.update(map => {
          const newMap = { ...map };
          delete newMap[mission.id];
          return newMap;
        });
        
        // Rafraîchir l'éligibilité
        this.prefetchFeedbackEligibility(mission.id);
        this.loadFeedbackWindow(mission.id);
        
        alert('Votre avis a été supprimé avec succès.');
      },
      error: (err) => {
        console.group('[Feedback] Erreur suppression');
        console.error('🌐 URL appelée: DELETE /api/feedback/' + feedback.id);
        console.error('❌ Status:', err.status);
        console.error('❌ Message:', err.message);
        console.error('❌ Détail erreur:', err.error);
        console.groupEnd();
        
        alert(err?.error?.message || 'Erreur lors de la suppression du feedback.');
      }
    });
  }

  /**
   * Coerce une valeur en score valide (1-5)
   */
  private coerceScore(v: any): number {
    const n = Number(v);
    if (!Number.isFinite(n)) return 1;
    return Math.max(1, Math.min(5, Math.trunc(n)));
  }

  /**
   * Construit les scores à partir du formulaire avec coercition robuste
   */
  private buildScoresFromForm(): ScoreItem[] {
    const f = this.feedbackForm.value;
    const scores = [
      { criterion: CriterionType.QUALITY,       score: this.coerceScore(f.quality) },
      { criterion: CriterionType.TIMELINESS,    score: this.coerceScore(f.timeliness) },
      { criterion: CriterionType.COMMUNICATION, score: this.coerceScore(f.communication) },
      { criterion: CriterionType.TECHNICAL,     score: this.coerceScore(f.technical) },
      { criterion: CriterionType.GLOBAL,        score: this.coerceScore(f.global) },
    ];
    
    console.log('[Feedback] Scores construits avec coercition:', scores);
    console.log('[Feedback] Form values bruts:', f);
    
    // 🔥 GARDE-FOU : Vérifier qu'aucun score n'est invalide
    const invalidScores = scores.filter(s => s.score < 1 || s.score > 5);
    if (invalidScores.length > 0) {
      console.error('[Feedback] ❌ ERREUR : Scores invalides détectés:', invalidScores);
      throw new Error(`Scores invalides détectés: ${invalidScores.map(s => `${s.criterion}=${s.score}`).join(', ')}`);
    }
    
    return scores;
  }

  /**
   * Soumet le feedback
   */
  submitFeedback(): void {
    const mission = this.selectedMissionForFeedback();
    
    // 🔥 CORRECTION : Validation renforcée avec message clair
    if (!mission || !this.currentUser) {
      console.group('[Feedback] Validation échouée - Données manquantes');
      console.log('❌ Mission:', mission);
      console.log('❌ Current user:', this.currentUser);
      console.groupEnd();
      return;
    }
    
    if (this.feedbackForm.invalid) {
      console.group('[Feedback] Validation échouée - Formulaire invalide');
      console.log('❌ Form valid:', this.feedbackForm.valid);
      console.log('❌ Form errors:', this.feedbackForm.errors);
      console.log('❌ Form values:', this.feedbackForm.value);
      
      // Vérifier spécifiquement les scores
      const scores = this.feedbackForm.value;
      const invalidScores = [];
      if (scores.quality < 1 || scores.quality > 5) invalidScores.push('Qualité');
      if (scores.timeliness < 1 || scores.timeliness > 5) invalidScores.push('Respect des délais');
      if (scores.communication < 1 || scores.communication > 5) invalidScores.push('Communication');
      if (scores.technical < 1 || scores.technical > 5) invalidScores.push('Technique');
      if (scores.global < 1 || scores.global > 5) invalidScores.push('Appréciation globale');
      
      if (invalidScores.length > 0) {
        alert(`Tous les scores doivent être entre 1 et 5. Problèmes détectés : ${invalidScores.join(', ')}`);
      } else {
        alert('Veuillez remplir tous les champs correctement.');
      }
      console.groupEnd();
      return;
    }

    const targetId = (mission as any).freelanceSelectionneId || mission.freelance?.id;
    if (!targetId) { 
      console.group('[Feedback] Pas de freelance');
      console.log('❌ Mission object:', mission);
      console.log('❌ freelanceSelectionneId:', (mission as any).freelanceSelectionneId);
      console.log('❌ mission.freelance:', mission.freelance);
      console.log('❌ mission.freelance?.id:', mission.freelance?.id);
      console.groupEnd();
      alert('Aucun freelance sélectionné.'); 
      return; 
    }

    const payload: FeedbackCreateRequest = {
      missionId: mission.id,
      targetId,
      role: FeedbackRole.CLIENT_TO_FREELANCER,
      scores: this.buildScoresFromForm(),
      comment: this.feedbackForm.value.comment,
      idempotencyKey: generateIdempotencyKey()
    };

    // 🔥 CORRECTION : Logs de debug détaillés pour le payload
    console.group('[Feedback] Soumission');
    console.log('🌐 URL complète: POST /api/feedback/submit');
    console.log('📤 Payload envoyé au backend:', payload);
    console.log('📤 Payload JSON:', JSON.stringify(payload, null, 2));
    console.log('📊 Form values avant envoi:', this.feedbackForm.value);
    console.log('📊 Scores construits:', this.buildScoresFromForm());
    console.log('➡ missionId:', payload.missionId);
    console.log('➡ targetId:', payload.targetId);
    console.log('➡ role:', payload.role);
    console.log('➡ scores:', payload.scores);
    console.log('➡ comment:', payload.comment);
    console.log('➡ idempotencyKey:', payload.idempotencyKey);
    console.log('📋 Mission source:', {
      id: mission.id,
      titre: mission.titre,
      statut: mission.statut,
      freelanceSelectionneId: (mission as any).freelanceSelectionneId,
      freelance: mission.freelance
    });
    console.log('👤 Current user:', {
      id: this.currentUser.id,
      nom: this.currentUser.nom,
      prenom: this.currentUser.prenom,
      typeUtilisateur: this.currentUser.typeUtilisateur
    });
    console.log('📝 Form values:', this.feedbackForm.value);
    console.log('🔑 Headers attendus: X-Idempotency-Key: ' + payload.idempotencyKey);
    console.log('🍪 WithCredentials: true');
    console.groupEnd();

    // 🔥 GARDE-FOU : Vérification finale des scores avant envoi
    console.group('[Feedback] 🔍 GARDE-FOU - Vérification finale des scores');
    const finalScores = payload.scores;
    const invalidScores = finalScores.filter(s => s.score < 1 || s.score > 5 || !Number.isInteger(s.score));
    if (invalidScores.length > 0) {
      console.error('[Feedback] ❌ ERREUR CRITIQUE : Scores invalides détectés avant envoi:', invalidScores);
      console.error('[Feedback] ❌ Arrêt de l\'envoi pour éviter ConstraintViolationException');
      alert('Erreur : Scores invalides détectés. Veuillez réessayer.');
      return;
    }
    console.log('[Feedback] ✅ Tous les scores sont valides:', finalScores.map(s => `${s.criterion}=${s.score}`));
    console.groupEnd();

    this.isSubmittingFeedback.set(true);
    this.feedbackApi.submit(payload, { idempotencyKey: payload.idempotencyKey }).subscribe({
      next: (res) => {
        console.group('[Feedback] Réponse OK');
        console.log('✅ Réponse du backend:', res);
        console.groupEnd();
        
        this.isSubmittingFeedback.set(false);
        
        // 🔥 CORRECTION 1: Mettre à jour les données locales avec la réponse
        console.log('[Feedback] Avant mise à jour feedbackData:', {
          missionId: mission.id,
          currentFeedbackData: this.feedbackData(),
          responseFromBackend: res
        });
        
        this.feedbackData.update(map => {
          const newMap = { ...map, [mission.id]: res };
          console.log('[Feedback] Nouveau feedbackData après update:', newMap);
          return newMap;
        });
        
        // Vérifier immédiatement après la mise à jour
        console.log('[Feedback] Vérification immédiate après update:', {
          missionId: mission.id,
          feedbackData: this.feedbackData()[mission.id],
          hasFeedback: this.hasFeedback(mission),
          actions: this.getFeedbackActions(mission)
        });
        
        // 🔥 CORRECTION 2: Rafraîchir éligibilité & fenêtre
        this.prefetchFeedbackEligibility(mission.id);
        this.loadFeedbackWindow(mission.id);
        
        // 🔥 CORRECTION 3: Log final avec délai pour s'assurer que les données sont mises à jour
        setTimeout(() => {
          console.log('[Feedback] ✅ Données mises à jour après soumission:', {
            missionId: mission.id,
            feedbackData: this.feedbackData()[mission.id],
            hasFeedback: this.hasFeedback(mission),
            actions: this.getFeedbackActions(mission)
          });
          
          // Fermer la modale après vérification
          this.closeFeedbackModal();
          alert('Votre avis a été soumis. Publication en double-aveugle dès que l\'autre partie soumet, ou auto-publication à J+14.');
        }, 200); // Délai réduit mais suffisant
      },
      error: (err) => {
        console.group('[Feedback] Erreur backend');
        console.error('🌐 URL appelée: POST /api/feedback/submit');
        console.error('❌ Status:', err.status);
        console.error('❌ Status Text:', err.statusText);
        console.error('❌ Message:', err.message);
        console.error('❌ URL complète:', err.url);
        console.error('❌ Détail erreur:', err.error);
        console.error('❌ Headers réponse:', err.headers);
        console.error('❌ Erreur complète:', err);
        console.error('📤 Payload envoyé:', payload);
        console.error('🔑 Headers envoyés: X-Idempotency-Key: ' + payload.idempotencyKey);
        console.groupEnd();
        
        this.isSubmittingFeedback.set(false);
        alert(err?.error?.message || 'Erreur lors de la soumission du feedback.');
      }
    });
  }
}
