import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;

export const jwtInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {

  const authService = inject(AuthService);
  const request = req.clone({ withCredentials: true });

  return next(request).pipe(
    catchError((err: any) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && !isRefreshing) {
        isRefreshing = true;

        return authService.refreshToken().pipe(
          switchMap(() => {
            isRefreshing = false;
            return next(request);
          }),
          catchError(innerErr => {
            isRefreshing = false;
            authService.logout();
            return throwError(() => innerErr);
          })
        );
      }
      return throwError(() => err);
    })
  );
};
