import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MissionCard, NextAction } from '../../models/mission-card.model';

@Component({
  selector: 'app-mission-card',
  standalone: true,
  imports: [CommonModule, DatePipe, TitleCasePipe, RouterModule],
  templateUrl: './mission-card.component.html',
  styleUrls: ['./mission-card.component.scss']
})
export class MissionCardComponent {
  @Input() mission!: MissionCard;

  @Output() validerLivrable = new EventEmitter<number>();
  @Output() payerTranche = new EventEmitter<number>();
  @Output() boosterMission = new EventEmitter<number>();
  @Output() voirDetails = new EventEmitter<number>();

  get hasLivraisonEnAttente(): boolean {
    return typeof this.mission?.livrableIdEnAttente === 'number';
  }

  get hasTrancheDue(): boolean {
    return !!this.mission?.trancheDue;
  }

  get statusClass(): string {
    return `status-${(this.mission?.statut || '').toLowerCase()}`;
  }

  get livrablesTotal(): number {
    return this.mission?.livrablesTotal ?? 0;
  }

  get livrablesValides(): number {
    return this.mission?.livrablesValides ?? 0;
  }

  get livrablesEnAttente(): number {
    return this.mission?.livrablesEnAttente ?? 0;
  }

  get progressPct(): number {
    const value = this.mission?.progressPct ?? 0;
    return Math.min(100, Math.max(0, value));
  }

  get budgetDisplay(): string {
    const budget = this.mission?.budget ?? 0;
    const devise = this.mission?.devise ?? 'TND';
    return `${budget.toLocaleString()} ${devise}`;
  }

  get deadlineDisplay(): string | null {
    return this.mission?.delaiLivraison || null;
  }

  get freelanceName(): string | null {
    if (!this.mission?.freelance) return null;
    const anyFreelance: any = this.mission.freelance;
    const prenom: string | undefined = anyFreelance.prenom;
    const nom: string | undefined = anyFreelance.nom;
    if (prenom || nom) return [prenom, nom].filter(Boolean).join(' ');
    return anyFreelance.nomAffichage || null;
  }

  get freelancePhoto(): string {
    const f: any = this.mission?.freelance || {};
    return f.photoProfilUrl || f.photoUrl || 'assets/default-avatar.png';
  }

  get nextAction(): NextAction {
    return this.mission?.nextAction ?? NextAction.DETAILS;
  }

  get ctaLabel(): string {
    switch (this.nextAction) {
      case NextAction.VALIDER_LIVRABLE: return 'Revoir & valider';
      case NextAction.PAYER_TRANCHE: return 'Payer la tranche';
      case NextAction.BOOSTER: return 'Booster mission';
      default: return 'Détails';
    }
  }

  get ctaClass(): string {
    switch (this.nextAction) {
      case NextAction.VALIDER_LIVRABLE: return 'cta-primary';
      case NextAction.PAYER_TRANCHE: return 'cta-success';
      case NextAction.BOOSTER: return 'cta-warning';
      default: return 'cta-neutral';
    }
  }

  get ctaDisabled(): boolean {
    if (!this.mission) return true;
    if (this.nextAction === NextAction.VALIDER_LIVRABLE) {
      // Activer le bouton s'il y a des livrables en attente
      return (this.mission.livrablesEnAttente ?? 0) <= 0;
    }
    if (this.nextAction === NextAction.PAYER_TRANCHE) {
      return typeof this.mission.trancheIdDue !== 'number';
    }
    return false;
  }

  onPrimaryCtaClick(): void {
    if (!this.mission) return;

    switch (this.nextAction) {
      case NextAction.VALIDER_LIVRABLE: {
        // Si on a un livrableIdEnAttente spécifique, l'utiliser
        // Sinon, émettre l'ID de la mission pour ouvrir la modale des livrables
        const livrableId = this.mission.livrableIdEnAttente;
        if (typeof livrableId === 'number') {
          this.validerLivrable.emit(livrableId);
        } else {
          // Émettre l'ID de la mission pour ouvrir la modale des livrables
          this.validerLivrable.emit(this.mission.id);
        }
        break;
      }
      case NextAction.PAYER_TRANCHE: {
        const id = this.mission.trancheIdDue;
        if (typeof id === 'number') this.payerTranche.emit(id);
        else this.voirDetails.emit(this.mission.id);
        break;
      }
      case NextAction.BOOSTER: {
        this.boosterMission.emit(this.mission.id);
        break;
      }
      default: {
        this.voirDetails.emit(this.mission.id);
      }
    }
  }
}


