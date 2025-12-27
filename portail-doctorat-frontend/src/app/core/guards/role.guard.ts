import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Récupérer les rôles autorisés depuis la route
  const allowedRoles = route.data['roles'] as string[];

  if (!authService.isLoggedIn()) {
    router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // ✅ Vérifier si l'utilisateur a l'un des rôles autorisés
  if (allowedRoles && allowedRoles.length > 0) {
    if (authService.hasAnyRole(allowedRoles)) {
      return true;
    } else {
      console.warn('❌ Accès refusé - Rôle requis:', allowedRoles);
      router.navigate(['/dashboard']);
      return false;
    }
  }

  return true;
};