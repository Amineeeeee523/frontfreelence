import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, map } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { TypeUtilisateur } from '../models/utilisateur.model';

@Injectable({ providedIn: 'root' })
export class ClientGuard implements CanActivate {

  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): Observable<boolean | UrlTree> {
    return this.auth.user$.pipe(
      map(user => {
        if (user && user.typeUtilisateur === TypeUtilisateur.CLIENT) {
          return true;
        }
        return this.router.createUrlTree(['/login']);
      })
    );
  }
} 