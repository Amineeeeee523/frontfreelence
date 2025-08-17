/**
 * Résumé des informations d'un freelance à afficher dans la carte côté client.
 * Correspond au FreelanceSummaryDTO Java.
 */
export interface FreelanceSummary {
  id: number;
  nom: string;
  prenom: string;
  photoUrl?: string;
  localisation?: string;
  niveauExperience?: string;
  disponibilite?: string;
  tarifHoraire?: number;
  noteMoyenne?: number;
  competences?: string[];
  badgePrincipal?: string; // ex. Top Talent, Expert…
}