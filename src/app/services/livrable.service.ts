import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../environments/environment';
import { Livrable, StatusLivrable, CreateLivrableRequest } from '../models/livrable.model';
import { FileStorageService } from './file-storage.service';

@Injectable({
  providedIn: 'root'
})
export class LivrableService {
  private readonly api = `${environment.apiUrl}/livrables`;

  constructor(
    private http: HttpClient,
    private fileStorageService: FileStorageService
  ) {}

  uploadLivrable(meta: CreateLivrableRequest, fichiers: File[], freelancerId: number): Observable<Livrable> {
    const formData = new FormData();
    formData.append('meta', new Blob([JSON.stringify(meta)], { type: 'application/json' }));
    fichiers.forEach(file => formData.append('fichiers', file));

    const headers = new HttpHeaders().set('X-Freelancer-Id', freelancerId.toString());

    return this.http.post<Livrable>(`${this.api}/upload`, formData, {
      headers,
      withCredentials: true
    });
  }

  getLivrablesForMission(missionId: number, status?: StatusLivrable): Observable<Livrable[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<Livrable[]>(`${this.api}/mission/${missionId}`, { params, withCredentials: true })
      .pipe(
        map(livrables => livrables.map(livrable => ({
          ...livrable,
          cheminsFichiers: livrable.cheminsFichiers?.map(path => this.fileStorageService.makeAbsolute(path))
        })))
      );
  }

  getLivrablesForFreelancer(freelancerId: number): Observable<Livrable[]> {
    return this.http.get<Livrable[]>(`${this.api}/freelancer/${freelancerId}`, { withCredentials: true })
      .pipe(
        map(livrables => livrables.map(livrable => ({
          ...livrable,
          cheminsFichiers: livrable.cheminsFichiers?.map(path => this.fileStorageService.makeAbsolute(path))
        })))
      );
  }

  validateLivrable(livrableId: number, clientId: number): Observable<void> {
    const url = `${this.api}/${livrableId}/valider`;
    const params = new HttpParams().set('clientId', String(clientId));
    const headers = new HttpHeaders().set('X-Client-Id', String(clientId));

    return this.http.put<void>(url, null, {
      params,
      headers,
      withCredentials: true
    });
  }

  rejectLivrable(livrableId: number, clientId: number, raison?: string): Observable<void> {
    const url = `${this.api}/${livrableId}/rejeter`;
    
    // IMPORTANT: HttpHeaders immuable → utiliser .set avec réaffectation
    const headers = new HttpHeaders()
      .set('X-Client-Id', String(clientId))
      .set('Content-Type', 'text/plain; charset=utf-8');
    
    // Debug : vérifier les headers
    console.log('[LivrableService] PUT', url, 'X-Client-Id =', headers.get('X-Client-Id'));
    console.log('[LivrableService] Content-Type =', headers.get('Content-Type'));
    
    // Envoyer le texte brut pour respecter @RequestBody String raison
    return this.http.put<void>(url, raison || '', { headers, withCredentials: true });
  }

  // Méthode de debug pour tester les headers
  debugValidateRequest(livrableId: number, clientId: number): void {
    const headers = new HttpHeaders().set('X-Client-Id', String(clientId));
    console.log('[LivrableService] Debug validation request:', {
      url: `${this.api}/${livrableId}/valider`,
      method: 'PUT',
      clientId: clientId,
      clientIdType: typeof clientId,
      headers: headers.keys().map(key => `${key}: ${headers.get(key)}`),
      body: null
    });
  }

  // Méthode alternative utilisant l'objet littéral pour les headers
  validateLivrableAlternative(livrableId: number, clientId: number): Observable<void> {
    const url = `${this.api}/${livrableId}/valider`;
    
    // Utiliser l'objet littéral pour éviter les problèmes d'immutabilité
    const options = {
      headers: {
        'X-Client-Id': String(clientId)
      },
      withCredentials: true
    };
    
    console.log('[LivrableService] Alternative PUT', url, 'options =', options);
    
    return this.http.put<void>(url, null, options);
  }
}
