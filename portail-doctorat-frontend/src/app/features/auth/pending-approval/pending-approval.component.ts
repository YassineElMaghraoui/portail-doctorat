import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-pending-approval',
    standalone: true,
    imports: [CommonModule],
    template: `
        <!-- Conteneur principal avec le dégradé (Même que Login) -->
        <div class="auth-container">

            <!-- Carte blanche centrée -->
            <div class="auth-card">

                <!-- Icône animée ou statique -->
                <div class="icon-wrapper mb-4">
                    <i class="bi bi-hourglass-split"></i>
                </div>

                <h2 class="auth-title">Candidature en cours</h2>

                <div class="status-badge">
                    <span class="badge-dot"></span> Statut : En cours
                </div>

                <div class="content-text">
                    <p>
                        Votre demande d'inscription au cycle doctoral a bien été reçue.
                    </p>
                    <p class="text-muted">
                        L'administration examine actuellement votre dossier.
                        Vous ne pourrez accéder à votre tableau de bord qu'après validation de votre compte par un administrateur.
                    </p>
                </div>

                <div class="divider"></div>

                <p class="small-text">
                    Veuillez vous reconnecter ultérieurement pour vérifier si votre accès a été débloqué.
                </p>

                <button class="btn-logout" (click)="logout()">
                    <i class="bi bi-box-arrow-left"></i> Se déconnecter
                </button>
            </div>
        </div>
    `,
    styles: [`
    /* 1. Fond dégradé identique au Login */
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1rem;
    }

    /* 2. Style de la carte (Ombres et arrondis identiques) */
    .auth-card {
      width: 100%;
      max-width: 500px;
      background: white;
      border-radius: 16px;
      padding: 3rem 2rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      text-align: center;
    }

    /* 3. Typographie et Icônes */
    .icon-wrapper i {
      font-size: 4rem;
      background: -webkit-linear-gradient(#667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .auth-title {
      color: #1e293b;
      font-weight: 700;
      margin-bottom: 1rem;
      font-size: 1.75rem;
    }

    /* Badge de statut */
    .status-badge {
      display: inline-flex;
      align-items: center;
      background-color: #fff7ed;
      color: #c2410c;
      border: 1px solid #ffedd5;
      padding: 0.5rem 1rem;
      border-radius: 50px;
      font-weight: 600;
      font-size: 0.9rem;
      margin-bottom: 2rem;
    }

    .badge-dot {
      height: 8px;
      width: 8px;
      background-color: #fb923c;
      border-radius: 50%;
      display: inline-block;
      margin-right: 8px;
      animation: pulse 2s infinite;
    }

    .content-text p {
      color: #334155;
      font-size: 1.05rem;
      line-height: 1.6;
      margin-bottom: 1rem;
    }

    .text-muted {
      color: #64748b !important;
      font-size: 0.95rem;
    }

    .divider {
      height: 1px;
      background-color: #e2e8f0;
      margin: 2rem 0;
    }

    .small-text {
      color: #94a3b8;
      font-size: 0.85rem;
      margin-bottom: 1.5rem;
    }

    /* Bouton de déconnexion stylisé */
    .btn-logout {
      background: white;
      color: #ef4444;
      border: 2px solid #fee2e2;
      padding: 0.75rem 2rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-logout:hover {
      background: #fee2e2;
      border-color: #fecaca;
      transform: translateY(-2px);
    }

    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(251, 146, 60, 0.4); }
      70% { box-shadow: 0 0 0 6px rgba(251, 146, 60, 0); }
      100% { box-shadow: 0 0 0 0 rgba(251, 146, 60, 0); }
    }
  `]
})
export class PendingApprovalComponent {
    constructor(private authService: AuthService, private router: Router) {}

    logout() {
        this.authService.logout();
    }
}