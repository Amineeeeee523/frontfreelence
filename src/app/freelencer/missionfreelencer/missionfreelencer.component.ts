import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faSearch, faCalendarAlt, faMoneyBillWave, faChevronDown, faUpload, faEye, 
  faExclamationCircle, faPaperclip, faLink, faTrash, faFilePdf, faFileZipper, 
  faFileVideo, faFileImage, faFile, faTimes, faCheckCircle, faFolderOpen, faSpinner, faUserCircle, faPaperPlane 
} from '@fortawesome/free-solid-svg-icons';
import { faGithub, faFigma, faGoogleDrive } from '@fortawesome/free-brands-svg-icons';
import { forkJoin, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

import { MissionsService } from '../../services/missions.service';
import { AuthService } from '../../services/auth.service';
import { UtilisateurService } from '../../services/utilisateurs.service';
import { Mission, MissionStatut } from '../../models/mission.model';
import { Utilisateur } from '../../models/utilisateur.model';
import { FileStorageService } from '../../services/file-storage.service';
import { LivrableService } from '../../services/livrable.service';
import { CreateLivrableRequest, Livrable } from '../../models/livrable.model';

export interface MissionViewModel extends Mission {
  client?: Utilisateur;
  progress?: number;
}

interface UploadedFile {
  file: File;
  name: string;
  size: string;
  type: string;
  icon: any;
  color?: string;
  previewUrl?: string | ArrayBuffer | null;
}

@Component({
  selector: 'app-missionfreelencer',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './missionfreelencer.component.html',
  styleUrls: ['./missionfreelencer.component.scss']
})
export class MissionfreelencerComponent implements OnInit {
  // Icons
  faSearch = faSearch; faCalendarAlt = faCalendarAlt; faMoneyBillWave = faMoneyBillWave;
  faChevronDown = faChevronDown; faUpload = faUpload; faEye = faEye; faExclamationCircle = faExclamationCircle;
  faPaperclip = faPaperclip; faLink = faLink; faTrash = faTrash; faFilePdf = faFilePdf;
  faFileZipper = faFileZipper; faFileVideo = faFileVideo; faFileImage = faFileImage;
  faFile = faFile; faTimes = faTimes; faCheckCircle = faCheckCircle; faFolderOpen = faFolderOpen;
  faSpinner = faSpinner; faGithub = faGithub; faFigma = faFigma; faGoogleDrive = faGoogleDrive;
  faUserCircle = faUserCircle; faPaperPlane = faPaperPlane;

  allMissions: MissionViewModel[] = [];
  filteredMissions: MissionViewModel[] = [];

  isLoading = true;
  statusFilter: string = 'Tous';
  searchTerm: string = '';
  sortBy: string = 'delaiLivraison';
  
  statuses = ['Tous', 'En attente', 'En cours', 'Terminée', 'Annulée'];
  sortOptions = [
    { id: 'delaiLivraison', name: 'Deadline' },
    { id: 'budget', name: 'Budget' },
    { id: 'datePublication', name: 'Date de début' }
  ];

  // --- Modal State & Data ---
  isDeliveryModalOpen = false;
  isSubmitting = false;
  currentMissionForDelivery?: MissionViewModel;
  description: string = '';
  externalLinks: { url: string; icon: any }[] = [{ url: '', icon: faLink }];
  uploadedFiles: UploadedFile[] = [];
  isDragOver = false;

  constructor(
    private missionsService: MissionsService,
    private authService: AuthService,
    private utilisateurService: UtilisateurService,
    private fileStorageService: FileStorageService,
    private livrableService: LivrableService
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.authService.user$.pipe(
      switchMap(user => {
        if (user && user.id) {
          return this.missionsService.getMissionsByFreelance(user.id);
        }
        return of([]);
      }),
      switchMap((missions: Mission[]) => {
        if (missions.length === 0) {
          return of([]);
        }
        const clientRequests = missions.map(mission => {
          const cid = (mission as any).clientId ?? (mission as any).client?.id;
          return cid ? this.utilisateurService.getUtilisateurById(cid).pipe(catchError(() => of(null))) : of(null);
        });
        return forkJoin(clientRequests).pipe(
          map(clients => {
            return missions.map((mission, index) => {
              const client = clients[index];
              const cid = (mission as any).clientId ?? (mission as any).client?.id;
              return {
                ...mission,
                client: client || undefined,
                clientId: cid,
                progress: this.calculateProgress(mission)
              };
            });
          })
        );
      })
    ).subscribe(missionsWithClients => {
      this.allMissions = missionsWithClients;
      this.filterAndSortMissions();
      this.isLoading = false;
    });
  }

  getClientPhotoUrl(client: Utilisateur | undefined): string {
    if (client && client.photoProfilUrl) {
      return client.photoProfilUrl;
    }
    return `https://i.pravatar.cc/40?u=${client?.id || 'default'}`;
  }

  selectStatus(status: string): void {
    this.statusFilter = status;
    this.filterAndSortMissions();
  }

  filterAndSortMissions(): void {
    let missions = this.allMissions;

    if (this.statusFilter !== 'Tous') {
      const missionStatus = this.getMissionStatusFromString(this.statusFilter);
      missions = missions.filter(m => m.statut === missionStatus);
    }

    if (this.searchTerm) {
      const lowerCaseSearch = this.searchTerm.toLowerCase();
      missions = missions.filter(m =>
        m.titre.toLowerCase().includes(lowerCaseSearch) ||
        (m.client && (m.client.nom + ' ' + m.client.prenom).toLowerCase().includes(lowerCaseSearch))
      );
    }

    missions.sort((a, b) => {
      if (this.sortBy === 'budget') {
        return b.budget - a.budget;
      } else if (this.sortBy === 'delaiLivraison' || this.sortBy === 'datePublication') {
        const key = this.sortBy as keyof MissionViewModel;
        const dateA = new Date((a[key] as string | undefined) || '').getTime();
        const dateB = new Date((b[key] as string | undefined) || '').getTime();
        return dateA - dateB;
      }
      return 0;
    });

    this.filteredMissions = missions;
  }
  
  private getMissionStatusFromString(status: string): MissionStatut | null {
    switch (status) {
      case 'En attente': return MissionStatut.EN_ATTENTE;
      case 'En cours': return MissionStatut.EN_COURS;
      case 'Terminée': return MissionStatut.TERMINEE;
      case 'Annulée': return MissionStatut.ANNULEE;
      default: return null;
    }
  }

  getStatusClass(status: MissionStatut): string {
    switch (status) {
      case MissionStatut.EN_COURS: return 'status-in-progress';
      case MissionStatut.TERMINEE: return 'status-completed';
      case MissionStatut.EN_ATTENTE: return 'status-pending';
      case MissionStatut.ANNULEE: return 'status-cancelled';
      case MissionStatut.EXPIREE: return 'status-expired';
      default: return 'status-default';
    }
  }

  calculateProgress(mission: Mission): number {
    switch (mission.statut) {
      case MissionStatut.EN_ATTENTE: return 10;
      case MissionStatut.EN_COURS: return 50;
      case MissionStatut.TERMINEE: return 100;
      default: return 0;
    }
  }

  // --- Delivery Modal Logic ---
  openDeliveryForm(mission: MissionViewModel): void {
    this.currentMissionForDelivery = mission;
    this.isDeliveryModalOpen = true;
  }

  closeDeliveryForm(): void {
    this.isDeliveryModalOpen = false;
    // Reset form for next time
    setTimeout(() => {
      this.currentMissionForDelivery = undefined;
      this.description = '';
      this.externalLinks = [{ url: '', icon: faLink }];
      this.uploadedFiles = [];
    }, 300); // Wait for fade-out animation
  }

  submitDelivery(): void {
    if (!this.currentMissionForDelivery) return;
    const freelancerId = this.authService.snapshot?.id;
    if (!freelancerId) {
      console.error("ID du freelance non trouvé. Impossible de soumettre.");
      return;
    }

    this.isSubmitting = true;

    const meta: CreateLivrableRequest = {
      missionId: this.currentMissionForDelivery.id,
      titre: `Livraison pour: ${this.currentMissionForDelivery.titre}`,
      description: this.description,
      liensExternes: this.externalLinks.map(l => l.url).filter(url => url)
    };
    
    const files = this.uploadedFiles.map(f => f.file);

    this.livrableService.uploadLivrable(meta, files, freelancerId).subscribe({
      next: (response: Livrable) => {
        console.log('Livrable soumis avec succès', response);
        this.isSubmitting = false;
        this.closeDeliveryForm();
        // Maybe refresh the mission list or show a success notification
      },
      error: (err: any) => {
        console.error('Erreur lors de la soumission du livrable', err);
        this.isSubmitting = false;
        // Show an error notification
      }
    });
  }

  // --- File Handling ---
  onDragOver(event: DragEvent) { event.preventDefault(); this.isDragOver = true; }
  onDragLeave(event: DragEvent) { event.preventDefault(); this.isDragOver = false; }
  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    if (event.dataTransfer?.files) {
      this.handleFiles(event.dataTransfer.files);
    }
  }
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) this.handleFiles(input.files);
  }

  private handleFiles(files: FileList) {
    Array.from(files).forEach(file => {
      if (this.uploadedFiles.some(f => f.name === file.name)) return;
      
      const { icon, color } = this.getIconAndColorForFileType(file.type);

      const newFile: UploadedFile = {
        file: file,
        name: file.name,
        size: this.formatBytes(file.size),
        type: file.type,
        icon: icon,
        color: color,
      };

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = e => newFile.previewUrl = e.target?.result;
        reader.readAsDataURL(file);
      }
      this.uploadedFiles.push(newFile);
    });
  }
  
  removeFile(fileName: string): void {
    this.uploadedFiles = this.uploadedFiles.filter(f => f.name !== fileName);
  }

  // --- Link Handling ---
  addLink(): void {
    this.externalLinks.push({ url: '', icon: faLink });
  }

  removeLink(index: number): void {
    this.externalLinks.splice(index, 1);
  }

  updateLinkIcon(index: number): void {
    const url = this.externalLinks[index].url.toLowerCase();
    if (url.includes('github.com')) this.externalLinks[index].icon = faGithub;
    else if (url.includes('figma.com')) this.externalLinks[index].icon = faFigma;
    else if (url.includes('drive.google.com')) this.externalLinks[index].icon = faGoogleDrive;
    else this.externalLinks[index].icon = faLink;
  }

  /**
   * Vérifie si tous les liens externes sont vides ou ne contiennent que des espaces.
   */
  public allLinksEmpty(): boolean {
    return this.externalLinks.every(link => !link.url || link.url.trim() === '');
  }

  /**
   * Indique si le bouton de soumission doit être désactivé.
   */
  public isSubmitDisabled(): boolean {
    return this.isSubmitting || (this.uploadedFiles.length === 0 && this.allLinksEmpty());
  }

  // --- Helpers ---
  private formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  public getIconAndColorForFileType(type: string): { icon: any; color: string } {
    if (!type) return { icon: faFile, color: '#6B7280' };
    if (type.includes('pdf')) return { icon: faFilePdf, color: '#EF4444' };
    if (type.includes('zip') || type.includes('x-rar-compressed')) return { icon: faFileZipper, color: '#F59E0B' };
    if (type.startsWith('video/')) return { icon: faFileVideo, color: '#8B5CF6' };
    if (type.startsWith('image/')) return { icon: faFileImage, color: '#3B82F6' };
    return { icon: faFile, color: '#6B7280' };
  }

  public getIconForFileType(type: string): any {
    return this.getIconAndColorForFileType(type).icon;
  }
}
