import { Pipe, PipeTransform } from '@angular/core';
import { MissionStatut } from '../models/mission.model';

@Pipe({ name: 'statutLabel', standalone: true })
export class StatutLabelPipe implements PipeTransform {
  private readonly labels: Record<string, string> = {
    [MissionStatut.EN_ATTENTE]: 'En attente',
    [MissionStatut.EN_COURS]: 'En cours',
    [MissionStatut.EN_ATTENTE_VALIDATION]: 'En attente validation',
    [MissionStatut.PRET_A_CLOTURER]: 'Prêt à clôturer',
    [MissionStatut.TERMINEE]: 'Terminée',
    [MissionStatut.ANNULEE]: 'Annulée',
    [MissionStatut.EXPIREE]: 'Expirée',
  };

  transform(value: MissionStatut | string): string {
    // Assurer que la clé est bien du type MissionStatut
    const key = value as MissionStatut;
    return this.labels[key] ?? String(value);
  }
}
