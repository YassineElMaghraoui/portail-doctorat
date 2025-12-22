import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/user.model';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Récupérer les rôles autorisés depuis les données de la route
  // On cast en any puis Role[] pour éviter les conflits de types string/enum
  const allowedRoles = route.data['roles'] as unknown as Role[];

  // Si aucun rôle n'est spécifié, on laisse passer (ou on bloque selon la logique, ici on laisse passer)
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  // Vérifier si l'utilisateur a un des rôles autorisés
  if (authService.hasRole(allowedRoles)) {
    return true;
  }

  // Rediriger vers dashboard si pas autorisé
  // (Optionnel : ajouter une alerte ou rediriger vers une page 403 Forbidden)
  router.navigate(['/dashboard']);
  return false;
};