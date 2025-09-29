import { Component, OnInit, ChangeDetectionStrategy, TrackByFunction } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AsyncPipe, CommonModule, NgIf, NgFor, NgClass } from '@angular/common';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {
  faFolder, faUsers, faCreditCard,
  faGauge, faRightFromBracket, faMagnifyingGlass, 
  faCommentDots as faMessage, faQuestionCircle,
  faBell, faCheck, faTimes, faFilter,
  faMessage as faMessageIcon, faBriefcase, faGear,
  faExclamationTriangle, faInfoCircle, faEdit, faUserTie,
  faHeart, faCog, faSignOutAlt
} from '@fortawesome/free-solid-svg-icons';
import { FormsModule } from '@angular/forms';

import { SidebarStateService } from '../../core/sidebar-state.service';
import { AuthService } from '../../services/auth.service';
import { Utilisateur } from '../../models/utilisateur.model';
import { Observable } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { NotificationSocketService } from '../../services/notification-socket.service';
import { NotificationEntity } from '../../models/notification.model';
import { NotificationDto } from '../../models/notification-dto.model';
import { NotificationCategory } from '../../models/notification-category.enum';
import { NotificationPriority } from '../../models/notification-priority.enum';
import { NotificationType } from '../../models/notification-type.enum';

// Types pour les notifications statiques
type NotifType = 'MESSAGE' | 'MISSION' | 'PAIEMENT' | 'SYSTEME';
type NotifSeverity = 'info' | 'warning' | 'critical';

interface NotificationMock {
  id: string;
  type: NotifType;
  title: string;
  snippet?: string;
  createdAt: string; // ISO
  read: boolean;
  severity: NotifSeverity;
  entityRef?: { kind: 'message' | 'mission' | 'paiement'; id: string | number };
  icon?: string;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration: number;
}

@Component({
  selector: 'app-sidebarfreelencer',
  standalone: true,
  imports: [AsyncPipe, NgIf, NgFor, NgClass, RouterLink, CommonModule, FaIconComponent, FormsModule],
  templateUrl: './sidebarfreelencer.component.html',
  styleUrls: ['./sidebarfreelencer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarfreelencerComponent implements OnInit {

  isCollapsed$: Observable<boolean>;

  // Icônes existantes
  faGauge = faGauge;
  faFolder = faFolder;
  faSearch = faMagnifyingGlass;
  faUsers = faUsers;
  faCommentDots = faMessage;
  faCreditCard = faCreditCard;
  faQuestionCircle = faQuestionCircle;
  faRightFromBracket = faRightFromBracket;
  faHeart = faHeart;
  faCog = faCog;
  faSignOutAlt = faSignOutAlt;

  // Nouvelles icônes
  faBell = faBell;
  faCheck = faCheck;
  faTimes = faTimes;
  faFilter = faFilter;
  faMessageIcon = faMessageIcon;
  faBriefcase = faBriefcase;
  faGear = faGear;
  faExclamationTriangle = faExclamationTriangle;
  faInfoCircle = faInfoCircle;
  faEdit = faEdit;
  faUserTie = faUserTie;

  // État des notifications
  isNotificationsOpen = false;
  selectedFilter: NotifType | 'ALL' = 'ALL';
  notifications: NotificationMock[] = [];
  toasts: Toast[] = [];

  // Données utilisateur réelles depuis AuthService
  user$: Observable<Utilisateur | null>;

  constructor(
    private sidebarState: SidebarStateService,
    private authService: AuthService,
    public router: Router,
    private notificationService: NotificationService,
    private notificationSocket: NotificationSocketService
  ) {
    this.isCollapsed$ = this.sidebarState.isCollapsed$;
    this.user$ = this.authService.user$;
  }

  ngOnInit(): void {
    // Assure que la sidebar est ouverte par défaut côté freelance
    this.sidebarState.setCollapsed(false);
    
    // Charger les notifications depuis le backend
    console.log('[SidebarFreelencer] Chargement initial des notifications');
    this.initializeMockNotifications();

    // WS temps réel
    this.notificationSocket.connect();
    console.log('[SidebarFreelencer] WS endpoint utilisé:', (this.notificationSocket as any).WS_ENDPOINT ?? 'privé');
    this.notificationSocket.getConnectionState$?.().subscribe((state: any) => {
      console.log('[SidebarFreelencer] WS state changed ->', state);
    });
    this.notificationSocket.notifications$.subscribe(dto => {
      console.log('[SidebarFreelencer] WS notification reçue', dto);
      const mapped = this.mapDtoToMock(dto);
      this.notifications = [mapped, ...this.notifications];
    });
    setTimeout(() => {
      if (this.notifications.length === 0) {
        console.warn('[SidebarFreelencer] Aucune notif WS reçue après 10s. Checks:', {
          wsConnected: this.notificationSocket.isConnected?.(),
          endpoint: (this.notificationSocket as any).WS_ENDPOINT ?? 'privé'
        });
      }
    }, 10000);
  }

  /**
   * Charge les notifications depuis le backend (REST)
   */
  private initializeMockNotifications(): void {
    console.log('[SidebarFreelencer] Chargement initial des notifications depuis le backend');
    this.notificationService.list(0, 20).subscribe({
      next: (page) => {
        console.log('[SidebarFreelencer] REST notifications reçues', { 
          totalElements: page.totalElements, 
          content: page.content.length,
          firstPage: page.first,
          lastPage: page.last 
        });
        this.notifications = page.content.map(n => this.mapEntityToMock(n));
      },
      error: (err) => {
        console.error('[SidebarFreelencer] Erreur chargement notifications REST', err);
        this.notifications = []; // Liste vide en cas d'erreur
      }
    });
  }

  /**
   * Obtient les initiales de l'utilisateur
   */
  getUserInitials(user: Utilisateur): string {
    return `${user.prenom.charAt(0)}${user.nom.charAt(0)}`.toUpperCase();
  }

  /**
   * Obtient le nom complet de l'utilisateur
   */
  getFullName(user: Utilisateur): string {
    return `${user.prenom} ${user.nom}`;
  }

  /**
   * Compte les notifications non lues
   */
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  /**
   * Obtient les notifications filtrées
   */
  getFilteredNotifications(): NotificationMock[] {
    if (this.selectedFilter === 'ALL') {
      return this.notifications;
    }
    return this.notifications.filter(n => n.type === this.selectedFilter);
  }

  /**
   * Obtient l'icône pour un type de notification
   */
  getNotificationIcon(type: NotifType): any {
    switch (type) {
      case 'MESSAGE': return this.faMessageIcon;
      case 'MISSION': return this.faBriefcase;
      case 'PAIEMENT': return this.faCreditCard;
      case 'SYSTEME': return this.faGear;
      default: return this.faInfoCircle;
    }
  }

  /**
   * Obtient la classe CSS pour la sévérité
   */
  getSeverityClass(severity: NotifSeverity): string {
    switch (severity) {
      case 'info': return 'severity-info';
      case 'warning': return 'severity-warning';
      case 'critical': return 'severity-critical';
      default: return 'severity-info';
    }
  }

  /**
   * Formate le temps écoulé depuis la création
   */
  getTimeAgo(createdAt: string): string {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return created.toLocaleDateString('fr-FR');
  }

  /**
   * Toggle l'ouverture du panneau notifications
   */
  toggleNotifications(): void {
    this.isNotificationsOpen = !this.isNotificationsOpen;
    if (this.isNotificationsOpen) {
      console.log('[SidebarFreelencer] Drawer ouvert → mark seen sur les notifs visibles non lues');
      const toSee = this.getFilteredNotifications()
        .filter(n => !n.read)
        .map(n => Number(n.id));
      toSee.forEach(id => this.notificationService.markSeen(id).subscribe());
    }
  }

  /**
   * Ferme le panneau notifications
   */
  closeNotifications(): void {
    this.isNotificationsOpen = false;
  }

  /**
   * Change le filtre des notifications
   */
  changeFilter(filter: NotifType | 'ALL'): void {
    this.selectedFilter = filter;
  }

  /**
   * Marque une notification comme lue/non lue
   */
  toggleNotificationRead(notification: NotificationMock): void {
    const willBeRead = !notification.read;
    if (willBeRead) {
      console.log('[SidebarFreelencer] Mark read', notification.id);
      this.notificationService.markRead([Number(notification.id)]).subscribe(() => {
        notification.read = true;
      });
    } else {
      notification.read = false;
    }
  }

  /**
   * Marque toutes les notifications comme lues
   */
  markAllAsRead(): void {
    console.log('[SidebarFreelencer] Mark all as read');
    const toMark = this.notifications.filter(n => !n.read).map(n => Number(n.id));
    if (toMark.length === 0) return;
    this.notificationService.markRead(toMark).subscribe(() => {
      this.notifications = this.notifications.map(n => ({ ...n, read: true }));
    });
  }

  /**
   * Gère le clic sur une notification
   */
  onNotificationClick(notification: NotificationMock): void {
    // Marquer comme lue
    if (!notification.read) {
      this.notificationService.markRead([Number(notification.id)]).subscribe(() => {
        notification.read = true;
      });
    }

    // TODO: Navigation future
    console.log('Notification clicked:', notification);
    
    // Notifier backend du clic
    console.log('[SidebarFreelencer] Click notif', notification.id);
    this.notificationService.click(Number(notification.id)).subscribe();
    // Exemple de navigation future (commenté pour l'instant)
    // if (notification.entityRef) {
    //   switch (notification.entityRef.kind) {
    //     case 'message':
    //       this.router.navigate(['/freelencer/chat'], { queryParams: { messageId: notification.entityRef.id } });
    //       break;
    //     case 'mission':
    //       this.router.navigate(['/freelencer/projects', notification.entityRef.id]);
    //       break;
    //     case 'paiement':
    //       this.router.navigate(['/freelencer/payments'], { queryParams: { paymentId: notification.entityRef.id } });
    //       break;
    //   }
    // }
  }

  /**
   * Affiche un toast de démo
   */
  showDemoToast(): void {
    const toast: Toast = {
      id: Date.now().toString(),
      message: 'Nouvelle mission disponible • Développement Web',
      type: 'info',
      duration: 5000
    };

    this.toasts.push(toast);

    // Auto-remove après la durée
    setTimeout(() => {
      this.removeToast(toast.id);
    }, toast.duration);
  }

  /**
   * Supprime un toast
   */
  removeToast(toastId: string): void {
    this.toasts = this.toasts.filter(t => t.id !== toastId);
  }

  /**
   * TrackBy function pour les notifications
   */
  trackByNotification: TrackByFunction<NotificationMock> = (index, notification) => notification.id;

  /**
   * TrackBy function pour les toasts
   */
  trackByToast: TrackByFunction<Toast> = (index, toast) => toast.id;

  // Méthodes existantes
  toggleSidebar(): void {
    this.sidebarState.toggle();
  }

  isLinkActive(url: string): boolean {
    return this.router.url === url;
  }

  logout(): void {
    this.authService.logout();
  }

  /**
   * Éditer le profil utilisateur
   */
  editProfile(): void {
    // TODO: Navigation vers la page de modification du profil
    console.log('Édition du profil');
    this.router.navigate(['/freelencer/profile']);
  }

  // ----- Mapping helpers -----
  private mapEntityToMock(n: NotificationEntity): NotificationMock {
    return {
      id: String(n.id),
      type: this.mapCategoryToType(n.category),
      title: n.title,
      snippet: n.body || this.extractSnippetFromDataString(n.data),
      createdAt: n.createdAt,
      read: n.readAt != null,
      severity: this.mapSeverity(n.priority, n.type)
    };
  }

  private mapDtoToMock(d: NotificationDto): NotificationMock {
    return {
      id: String(d.id),
      type: this.mapTypeToNotifType(d.type),
      title: d.title,
      snippet: this.extractSnippetFromData(d.data),
      createdAt: d.createdAt,
      read: false,
      severity: this.mapSeverity(undefined, d.type)
    };
  }

  private mapCategoryToType(cat: NotificationCategory): NotifType | 'SYSTEME' {
    switch (cat) {
      case NotificationCategory.MESSAGE: return 'MESSAGE';
      case NotificationCategory.MISSION: return 'MISSION';
      case NotificationCategory.PAYMENT:
      case NotificationCategory.WITHDRAWAL: return 'PAIEMENT';
      case NotificationCategory.MATCH:
      case NotificationCategory.DELIVERABLE: return 'MISSION';
      default: return 'SYSTEME';
    }
  }

  private mapTypeToNotifType(t: NotificationType): NotifType | 'SYSTEME' {
    switch (t) {
      case NotificationType.MESSAGE_RECEIVED: return 'MESSAGE';
      case NotificationType.MISSION_STATUS_CHANGED:
      case NotificationType.MISSION_DEADLINE_SOON:
      case NotificationType.MATCH_CREATED:
      case NotificationType.DELIVERABLE_SENT:
      case NotificationType.DELIVERABLE_VALIDATED:
      case NotificationType.DELIVERABLE_REJECTED: return 'MISSION';
      case NotificationType.TRANCHE_LINK_READY:
      case NotificationType.TRANCHE_PAID:
      case NotificationType.TRANCHE_VALIDATED:
      case NotificationType.TRANCHE_ERROR:
      case NotificationType.WITHDRAWAL_PAID:
      case NotificationType.WITHDRAWAL_ERROR: return 'PAIEMENT';
      default: return 'SYSTEME';
    }
  }

  private mapSeverity(priority?: NotificationPriority, type?: NotificationType): NotifSeverity {
    if (type && String(type).endsWith('ERROR')) return 'critical';
    switch (priority) {
      case NotificationPriority.CRITICAL: return 'critical';
      case NotificationPriority.HIGH: return 'warning';
      case NotificationPriority.NORMAL:
      case NotificationPriority.LOW:
      default: return 'info';
    }
  }

  private extractSnippetFromDataString(data?: string): string | undefined {
    if (!data) return undefined;
    try {
      const parsed = JSON.parse(data);
      return this.extractSnippetFromData(parsed);
    } catch {
      return undefined;
    }
  }

  private extractSnippetFromData(data: any): string | undefined {
    if (!data) return undefined;
    return data.snippet || data.body || data.message || data.missionTitle || undefined;
  }
}
