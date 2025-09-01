import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMapMarkerAlt, faUserTie, faCheckCircle, faStar, faEuroSign, faClock } from '@fortawesome/free-solid-svg-icons';

import { FreelanceSummary } from '../../models/freelance-summary.model';
import { StatutKyc } from '../../models/utilisateur.model';

@Component({
  selector: 'app-swipe-client-freelance',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './swipe-client-freelance.component.html',
  styleUrls: ['./swipe-client-freelance.component.scss']
})
export class SwipeClientFreelanceComponent {
  @Input() freelancer!: FreelanceSummary;

  faMapMarkerAlt = faMapMarkerAlt;
  faUserTie = faUserTie;
  faCheckCircle = faCheckCircle;
  faStar = faStar;
  faEuroSign = faEuroSign;
  faClock = faClock;

  readonly StatutKyc = StatutKyc;

  get photoUrl(): string {
    return this.freelancer?.photoUrl || this.freelancer?.photoProfilUrl || 'https://placehold.co/120x120';
  }

  get displayLocation(): string | undefined {
    return (this.freelancer?.gouvernorat as any) || this.freelancer?.localisation || undefined;
  }

  get displayExperience(): string | undefined {
    if (this.freelancer?.niveauExperience) return this.freelancer.niveauExperience as any;
    if (typeof this.freelancer?.anneesExperience === 'number') {
      return `${this.freelancer.anneesExperience} ans`;
    }
    return undefined;
  }

  get displayDisponibilite(): string | undefined {
    if (this.freelancer?.disponibilite) return this.freelancer.disponibilite as any;
    if (this.freelancer?.dateDisponibilite) return `Dès le ${this.freelancer.dateDisponibilite}`;
    return undefined;
  }

  get displayTarif(): { label: string; value: string } | undefined {
    if (typeof this.freelancer?.tarifJournalier === 'number') {
      return { label: 'TJM', value: `${this.freelancer.tarifJournalier}€` };
    }
    if (typeof this.freelancer?.tarifHoraire === 'number') {
      return { label: 'Taux horaire', value: `${this.freelancer.tarifHoraire}€` };
    }
    return undefined;
  }

  get isVerified(): boolean {
    return !!(this.freelancer?.identiteVerifiee || this.freelancer?.kycStatut === StatutKyc.VERIFIE);
  }
}


