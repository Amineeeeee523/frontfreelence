import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { jwtInterceptor } from './interceptors/jwt.interceptor';
import { API_BASE_URL, WS_BASE_URL } from './core/tokens';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    provideAnimations(),
    
    // Configuration des tokens d'injection
    { provide: API_BASE_URL, useValue: environment.apiUrl },
    { provide: WS_BASE_URL, useValue: environment.wsBaseUrl }
  ]
};