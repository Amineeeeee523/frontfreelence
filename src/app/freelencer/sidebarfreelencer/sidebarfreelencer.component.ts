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
    public router: Router
  ) {
    this.isCollapsed$ = this.sidebarState.isCollapsed$;
    this.user$ = this.authService.user$;
  }

  ngOnInit(): void {
    // Assure que la sidebar est ouverte par défaut côté freelance
    this.sidebarState.setCollapsed(false);
    
    // Initialiser les notifications statiques
    this.initializeMockNotifications();
  }

  /**
   * Initialise les notifications statiques (mock)
   * TODO: Remplacer par service plus tard
   */
  private initializeMockNotifications(): void {
    this.notifications = [
      {
        id: '1',
        type: 'MESSAGE',
        title: 'Nouveau message de Sarah',
        snippet: 'Bonjour ! J\'ai une question concernant la mission...',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
        read: false,
        severity: 'info',
        entityRef: { kind: 'message', id: 'msg-123' }
      },
      {
        id: '2',
        type: 'MISSION',
        title: 'Nouvelle mission disponible',
        snippet: 'Développement web - Site e-commerce',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h ago
        read: false,
        severity: 'warning',
        entityRef: { kind: 'mission', id: 'mission-456' }
      },
      {
        id: '3',
        type: 'PAIEMENT',
        title: 'Paiement reçu',
        snippet: 'Mission #123 - 500 TND reçus avec succès',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        read: true,
        severity: 'info',
        entityRef: { kind: 'paiement', id: 'pay-789' }
      },
      {
        id: '4',
        type: 'SYSTEME',
        title: 'Maintenance prévue',
        snippet: 'Le site sera indisponible le 15/12 de 2h à 4h',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
        read: false,
        severity: 'critical',
        entityRef: { kind: 'mission', id: 'system-001' }
      },
      {
        id: '5',
        type: 'MISSION',
        title: 'Nouveau match !',
        snippet: 'Sarah est intéressée par votre profil',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
        read: true,
        severity: 'info',
        entityRef: { kind: 'mission', id: 'mission-789' }
      },
      {
        id: '6',
        type: 'PAIEMENT',
        title: 'Paiement en attente',
        snippet: 'Mission #456 - En attente de validation',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(), // 4 days ago
        read: true,
        severity: 'warning',
        entityRef: { kind: 'paiement', id: 'pay-456' }
      }
    ];
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
    notification.read = !notification.read;
  }

  /**
   * Marque toutes les notifications comme lues
   */
  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
  }

  /**
   * Gère le clic sur une notification
   */
  onNotificationClick(notification: NotificationMock): void {
    // Marquer comme lue
    if (!notification.read) {
      notification.read = true;
    }

    // TODO: Navigation future
    console.log('Notification clicked:', notification);
    
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
}
