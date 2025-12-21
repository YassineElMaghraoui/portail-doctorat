import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // URLs publiques qui ne nécessitent pas de token
  const publicUrls = ['/auth/login', '/auth/register', '/auth/refresh'];
  const isPublicUrl = publicUrls.some(url => req.url.includes(url));
  
  // Ajouter le token si disponible et URL non publique
  const token = authService.getToken();
  if (token && !isPublicUrl) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si erreur 401, déconnecter l'utilisateur
      if (error.status === 401 && !isPublicUrl) {
        authService.logout();
        router.navigate(['/auth/login'], {
          queryParams: { returnUrl: router.url }
        });
      }
      
      return throwError(() => error);
    })
  );
};
