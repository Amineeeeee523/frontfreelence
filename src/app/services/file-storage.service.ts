// src/app/services/file-storage.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FileStorageService {
  private readonly api = `${environment.apiUrl}/files`;

  constructor(private http: HttpClient) {}

  /**
   * Uploads a file to the server.
   * @param file The file to upload.
   * @returns An observable with the relative URL of the uploaded file.
   */
  upload(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    // Le backend renvoie une URL en texte brut, pas du JSON.
    return this.http.post(`${this.api}/upload`, formData, {
      responseType: 'text',
      withCredentials: true // Important si vous avez une sécurité basée sur les cookies/sessions
    }).pipe(
      map((path: string) => this.makeAbsolute(path))
    );
  }

  /**
   * Convertit un chemin relatif (par ex. "/uploads/abcd.jpg") en URL absolue
   * basée sur l'URL du backend.
   */
  makeAbsolute(path: string): string {
    if (!path) return path;
    // Si l'URL est déjà absolue (http/https), on ne touche pas
    if (/^https?:\/\//i.test(path)) return path;

    // Utilise le staticUrl pour les fichiers statiques
    const base = environment.staticUrl;
    // S'assure qu'il n'y a pas de double slash
    const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${normalizedBase}${normalizedPath}`;
  }
} 