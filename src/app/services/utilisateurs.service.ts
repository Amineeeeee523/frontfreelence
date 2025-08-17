import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  Utilisateur,
  TypeUtilisateur,
  Disponibilite,
  NiveauExperience,
  Langue
} from '../models/utilisateur.model';
import { MissionCategorie } from '../models/mission.model';

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
}
