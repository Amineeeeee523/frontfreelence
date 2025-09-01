import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  Utilisateur,
  TypeUtilisateur,
  Disponibilite,
  NiveauExperience,
  Langue,
  Mobilite,
  EngagementModel,
  StatutKyc,
  PreferenceDuree,
  TypeClient
} from '../models/utilisateur.model';
import { MissionCategorie, Gouvernorat } from '../models/mission.model';
import { FreelanceSummary } from '../models/freelance-summary.model';

@Injectable({
  providedIn: 'root'
})
export class UtilisateurService {
  private readonly api = `${environment.apiUrl}/utilisateurs`;

  constructor(private http: HttpClient) {}

  /**
   * Crée un nouvel utilisateur
   */
  createUtilisateur(utilisateur: Utilisateur): Observable<Utilisateur> {
    return this.http.post<Utilisateur>(this.api, utilisateur, { withCredentials: true });
  }

  /**
   * Récupère la liste des utilisateurs avec filtres optionnels
   */
  getUtilisateurs(filters?: {
    // Filtres de base
    type?: TypeUtilisateur;
    localisation?: string;
    competences?: string;
    tarifMin?: number;
    tarifMax?: number;
    tarifJourMin?: number;
    tarifJourMax?: number;
    dispo?: Disponibilite;
    niveau?: NiveauExperience;
    langue?: Langue;
    categories?: MissionCategorie[];
    
    // Filtres de réputation existants
    noteMin?: number;
    projetsTerminesMin?: number;
    
    // Nouveaux filtres étendus
    gouvernorat?: Gouvernorat;
    mobilite?: Mobilite;
    timezone?: string;
    preferenceDuree?: PreferenceDuree;
    typeClient?: TypeClient;
    estActif?: boolean;
    
    // Vérifications / KYC
    emailVerifie?: boolean;
    telephoneVerifie?: boolean;
    identiteVerifiee?: boolean;
    ribVerifie?: boolean;
    kycStatut?: StatutKyc;
    
    // Réputation
    nombreAvisMin?: number;
  }): Observable<Utilisateur[]> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value != null) {
          if (Array.isArray(value)) {
            value.forEach(v => {
              params = params.append(key, v.toString());
            });
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }
    return this.http.get<Utilisateur[]>(this.api, { params, withCredentials: true });
  }

  /**
   * Récupère un utilisateur par son ID
   */
  getUtilisateurById(id: number): Observable<Utilisateur> {
    const url = `${this.api}/${id}`;
    return this.http.get<Utilisateur>(url, { withCredentials: true });
  }

  /** Récupère le profil courant */
  me(): Observable<Utilisateur> {
    return this.http.get<Utilisateur>(`${this.api}/me`, { withCredentials: true });
  }

  /**
   * Met à jour un utilisateur existant
   */
  updateUtilisateur(id: number, utilisateur: Utilisateur): Observable<Utilisateur> {
    const url = `${this.api}/${id}`;
    return this.http.put<Utilisateur>(url, utilisateur, { withCredentials: true });
  }

  /**
   * Supprime un utilisateur par son ID
   */
  deleteUtilisateur(id: number): Observable<void> {
    const url = `${this.api}/${id}`;
    return this.http.delete<void>(url, { withCredentials: true });
  }

  /**
   * Met à jour partiellement le profil d'un freelance
   */
  patchProfil(id: number, profilData: {
    bio?: string;
    localisation?: string;
    competences?: string[];
    tarifHoraire?: number;
    tarifJournalier?: number;
    categories?: MissionCategorie[];
    photoProfilUrl?: string;
  }): Observable<Utilisateur> {
    const url = `${this.api}/${id}/profil`;
    return this.http.patch<Utilisateur>(url, profilData, { withCredentials: true });
  }

  /**
   * Active ou désactive un utilisateur
   */
  setActivation(id: number, actif: boolean): Observable<void> {
    const url = `${this.api}/${id}/activation`;
    return this.http.post<void>(url, null, { 
      params: { actif: actif.toString() }, 
      withCredentials: true 
    });
  }

  /**
   * Ajoute un token push pour les notifications
   */
  addPushToken(id: number, token: string): Observable<void> {
    const url = `${this.api}/${id}/push-tokens`;
    return this.http.post<void>(url, null, { 
      params: { token }, 
      withCredentials: true 
    });
  }

  /**
   * Supprime un token push
   */
  removePushToken(id: number, token: string): Observable<void> {
    const url = `${this.api}/${id}/push-tokens`;
    return this.http.delete<void>(url, { 
      params: { token }, 
      withCredentials: true 
    });
  }

  /**
   * Incrémente le compteur de swipes
   */
  incrementSwipe(id: number): Observable<void> {
    const url = `${this.api}/${id}/counters/swipe`;
    return this.http.post<void>(url, null, { withCredentials: true });
  }

  /**
   * Incrémente le compteur de likes reçus
   */
  incrementLike(id: number): Observable<void> {
    const url = `${this.api}/${id}/counters/like`;
    return this.http.post<void>(url, null, { withCredentials: true });
  }

  /**
   * Incrémente le compteur de matches
   */
  incrementMatch(id: number): Observable<void> {
    const url = `${this.api}/${id}/counters/match`;
    return this.http.post<void>(url, null, { withCredentials: true });
  }

  /**
   * Récupère les métadonnées des enums
   */
  getEnums(): Observable<{
    types: TypeUtilisateur[];
    disponibilites: Disponibilite[];
    niveauxExperience: NiveauExperience[];
    langues: Langue[];
    categoriesMission: MissionCategorie[];
    gouvernorats: Gouvernorat[];
    mobilites: Mobilite[];
    preferencesDuree: PreferenceDuree[];
    typesClient: TypeClient[];
    statutsKyc: StatutKyc[];
  }> {
    const url = `${this.api}/enums`;
    return this.http.get<any>(url, { withCredentials: true });
  }

  /**
   * Vérifie l'email d'un utilisateur
   */
  verifyEmail(id: number): Observable<void> {
    const url = `${this.api}/${id}/verify/email`;
    return this.http.post<void>(url, null, { withCredentials: true });
  }

  /**
   * Vérifie le téléphone d'un utilisateur
   */
  verifyPhone(id: number): Observable<void> {
    const url = `${this.api}/${id}/verify/phone`;
    return this.http.post<void>(url, null, { withCredentials: true });
  }

  /**
   * Définit le statut KYC d'un utilisateur
   */
  setKycStatus(id: number, statut: StatutKyc): Observable<void> {
    const url = `${this.api}/${id}/kyc`;
    return this.http.post<void>(url, null, { 
      params: { statut }, 
      withCredentials: true 
    });
  }

  /**
   * Consomme un super-like
   */
  consumeSuperLike(id: number): Observable<void> {
    const url = `${this.api}/${id}/superlikes/consume`;
    return this.http.post<void>(url, null, { withCredentials: true });
  }

  /**
   * Définit le nombre de super-likes quotidiens
   */
  setDailySuperlikes(id: number, count: number): Observable<void> {
    const url = `${this.api}/${id}/superlikes/set`;
    return this.http.post<void>(url, null, { 
      params: { count: count.toString() }, 
      withCredentials: true 
    });
  }

  /**
   * Récupère la liste des freelances en format résumé
   */
  getFreelanceSummaries(): Observable<FreelanceSummary[]> {
    const url = `${this.api}/freelances/summary`;
    return this.http.get<FreelanceSummary[]>(url, { withCredentials: true });
  }

  /**
   * Récupère le résumé d'un freelance par ID
   */
  getFreelanceSummary(id: number): Observable<FreelanceSummary> {
    const url = `${this.api}/${id}/summary`;
    return this.http.get<FreelanceSummary>(url, { withCredentials: true });
  }
}
