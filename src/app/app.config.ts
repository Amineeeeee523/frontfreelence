import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HammerGestureConfig, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { jwtInterceptor } from './interceptors/jwt.interceptor';
import { environment } from '../environments/environment';
import { API_BASE_URL } from './core/tokens';

// Configuration personnalisée pour HammerJS si nécessaire
// Ici, nous utilisons la configuration par défaut mais nous la fournissons explicitement.
export class MyHammerConfig extends HammerGestureConfig {
  override overrides = <any>{
    // swipe: { direction: Hammer.DIRECTION_ALL }, // exemple de surcharge
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor])),
    provideAnimations(),
    {
      provide: HAMMER_GESTURE_CONFIG,
      useClass: MyHammerConfig,
    },
    {
      provide: API_BASE_URL,
      useValue: environment.apiUrl,
    },
  ]
};
