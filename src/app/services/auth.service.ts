import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, switchMap, map } from 'rxjs';
import { Router } from '@angular/router';

import { environment }           from '../../environments/environment';
import { LoginRequestDto }       from '../models/login-request.model';
import { RegisterRequestDto }    from '../models/register-request.model';
import { TokenPairDto }          from '../models/token-pair.model';
import { Utilisateur, TypeUtilisateur }           from '../models/utilisateur.model';
import { UtilisateurService } from './utilisateurs.service';
import { FileStorageService } from './file-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {

  /* --- état courant --- */
  private currentUser$ = new BehaviorSubject<Utilisateur | null>(null);
  public  user$        = this.currentUser$.asObservable();

  private readonly api = `${environment.apiUrl}/auth`;

  constructor(
    private http: HttpClient,
    private router: Router,
    private utilisateurService: UtilisateurService,
    private fileStorageService: FileStorageService
  ) {}

  /* ---------- Auth ---------- */
  login(body: LoginRequestDto): Observable<void> {
    return this.http.post<void>(`${this.api}/login`, body, { withCredentials: true })
      .pipe(
        switchMap(() => this.fetchMe()),
        tap(user => {
          if (user.typeUtilisateur === TypeUtilisateur.FREELANCE) {
            this.router.navigate(['/freelencer']);
          } else {
            this.router.navigate(['/client']);
          }
        }),
        map(() => undefined)
      );
  }

  register(body: RegisterRequestDto): Observable<void> {
    return this.http.post<void>(`${this.api}/register`, body, { withCredentials: true })
    .pipe(
      switchMap(() => this.fetchMe()),
      tap(user => {
        if (user.typeUtilisateur === TypeUtilisateur.FREELANCE) {
          this.router.navigate(['/freelencer']);
        } else {
          this.router.navigate(['/client']);
        }
      }),
      map(() => undefined)
    );
  }

  logout(): void {
    this.currentUser$.next(null);
    this.router.navigate(['/login']);
  }

  /* ---------- Refresh (cookie HttpOnly) ---------- */
  refreshToken(): Observable<TokenPairDto> {
    return this.http.post<TokenPairDto>(
      `${this.api}/refresh-token`, {}, { withCredentials: true }
    );
  }

  /* ---------- Profil courant ---------- */
  fetchMe(): Observable<Utilisateur> {
    return this.utilisateurService.me()
      .pipe(tap(user => {
        // Convertit la photo de profil en URL absolue si nécessaire
        user.photoProfilUrl = this.fileStorageService.makeAbsolute(user.photoProfilUrl ?? '');
        console.log('Données de l\'utilisateur reçues du backend :', user);
        this.currentUser$.next(user)
      }));
  }

  /* Helper synchrone */
  get snapshot(): Utilisateur | null {
    return this.currentUser$.value;
  }
}
