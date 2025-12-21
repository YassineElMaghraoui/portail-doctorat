import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MainLayoutComponent } from '../../shared/components/main-layout/main-layout.component';
import { AuthService } from '../../core/services/auth.service';
import { InscriptionService } from '../../core/services/inscription.service';
import { DerogationService } from '../../core/services/derogation.service';
import { Role } from '../../core/models/user.model';
import { EligibiliteReinscription } from '../../core/models/derogation.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MainLayoutComponent],
  template: `
    <app-main-layout>
      <div class="dashboard">
        <header class="page-header">
          <h1>Bienvenue, {{ authService.currentUser()?.prenom }} !</h1>
          <p class="text-muted">Voici un aperçu de votre espace doctorat</p>
        </header>

        <!-- Alerte dérogation si nécessaire -->
        @if (eligibilite() && eligibilite()!.derogationRequise && !eligibilite()!.derogationObtenue) {
          <div class="alert alert-warning">
            <i class="bi bi-exclamation-triangle"></i>
            <div>
              <strong>Attention !</strong> {{ eligibilite()!.message }}
              <a routerLink="/derogations/nouvelle">Demander une dérogation</a>
            </div>
          </div>
        }

        <!-- Stats Cards -->
        <div class="stats-grid">
          @if (isDoctorant()) {
            <div class="stat-card">
              <div class="stat-icon bg-primary">
                <i class="bi bi-calendar-check"></i>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ eligibilite()?.anneeActuelle || 1 }}</span>
                <span class="stat-label">Année de doctorat</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon bg-success">
                <i class="bi bi-file-earmark-text"></i>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ stats().inscriptions }}</span>
                <span class="stat-label">Inscriptions</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon bg-info">
                <i class="bi bi-clock-history"></i>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ eligibilite()?.anneesRestantes || 6 }}</span>
                <span class="stat-label">Années restantes</span>
              </div>
            </div>
          }

          @if (isDirecteur()) {
            <div class="stat-card">
              <div class="stat-icon bg-warning">
                <i class="bi bi-hourglass-split"></i>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ stats().aValider }}</span>
                <span class="stat-label">À valider</span>
              </div>
            </div>
          }

          @if (isAdmin()) {
            <div class="stat-card">
              <div class="stat-icon bg-primary">
                <i class="bi bi-people"></i>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ stats().totalUsers }}</span>
                <span class="stat-label">Utilisateurs</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon bg-warning">
                <i class="bi bi-clock"></i>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ stats().derogationsEnAttente }}</span>
                <span class="stat-label">Dérogations en attente</span>
              </div>
            </div>
          }
        </div>

        <!-- Actions rapides -->
        <section class="quick-actions">
          <h2>Actions rapides</h2>
          <div class="actions-grid">
            @if (isDoctorant()) {
              <a routerLink="/inscriptions/nouvelle" class="action-card">
                <i class="bi bi-plus-circle"></i>
                <span>Nouvelle inscription</span>
              </a>
              <a routerLink="/soutenances" class="action-card">
                <i class="bi bi-award"></i>
                <span>Ma soutenance</span>
              </a>
              <a routerLink="/derogations" class="action-card">
                <i class="bi bi-clock-history"></i>
                <span>Mes dérogations</span>
              </a>
            }

            @if (isDirecteur()) {
              <a routerLink="/inscriptions/a-valider" class="action-card">
                <i class="bi bi-check-circle"></i>
                <span>Valider inscriptions</span>
              </a>
            }

            @if (isAdmin()) {
              <a routerLink="/campagnes" class="action-card">
                <i class="bi bi-calendar-plus"></i>
                <span>Gérer campagnes</span>
              </a>
              <a routerLink="/admin/derogations" class="action-card">
                <i class="bi bi-hourglass-split"></i>
                <span>Traiter dérogations</span>
              </a>
              <a routerLink="/admin/users" class="action-card">
                <i class="bi bi-person-plus"></i>
                <span>Gérer utilisateurs</span>
              </a>
            }
          </div>
        </section>
      </div>
    </app-main-layout>
  `,
  styles: [`
    .dashboard {
      max-width: 1200px;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .page-header h1 {
      margin-bottom: 0.5rem;
      font-size: 1.75rem;
      font-weight: 600;
    }

    .text-muted {
      color: #64748b;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      border: 1px solid #e2e8f0;
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon i {
      font-size: 1.5rem;
      color: white;
    }

    .stat-icon.bg-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .stat-icon.bg-success { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); }
    .stat-icon.bg-warning { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
    .stat-icon.bg-info { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1e293b;
      line-height: 1;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #64748b;
      margin-top: 0.25rem;
    }

    .quick-actions h2 {
      font-size: 1.25rem;
      margin-bottom: 1rem;
      font-weight: 600;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .action-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      border: 1px solid #e2e8f0;
      transition: all 0.2s;
      color: #1e293b;
      text-decoration: none;
    }

    .action-card i {
      font-size: 2rem;
      color: #667eea;
    }

    .action-card span {
      font-weight: 500;
    }

    .action-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      border-color: #667eea;
    }

    .alert {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      padding: 1rem 1.25rem;
      border-radius: 8px;
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .alert i {
      font-size: 1.25rem;
      color: #f59e0b;
      margin-top: 0.125rem;
    }

    .alert a {
      display: block;
      margin-top: 0.5rem;
      font-weight: 500;
      color: #667eea;
    }
  `]
})
export class DashboardComponent implements OnInit {
  eligibilite = signal<EligibiliteReinscription | null>(null);
  stats = signal({ inscriptions: 0, aValider: 0, totalUsers: 0, derogationsEnAttente: 0 });

  constructor(
    public authService: AuthService,
    private inscriptionService: InscriptionService,
    private derogationService: DerogationService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  isDoctorant(): boolean {
    return this.authService.currentUser()?.role === Role.DOCTORANT;
  }

  isDirecteur(): boolean {
    return this.authService.currentUser()?.role === Role.DIRECTEUR_THESE;
  }

  isAdmin(): boolean {
    return this.authService.currentUser()?.role === Role.ADMIN;
  }

  private loadData(): void {
    const user = this.authService.currentUser();
    if (!user) return;

    // Charger les données selon le rôle
    if (this.isDoctorant()) {
      // Pour l'instant, on met des valeurs par défaut car les services ne sont pas tous connectés
      this.stats.update(s => ({ ...s, inscriptions: 0 }));
      
      // Essayer de charger l'éligibilité (si le service existe)
      // this.derogationService.verifierEligibilite(user.id).subscribe({
      //   next: (data) => this.eligibilite.set(data),
      //   error: () => {}
      // });
    }
  }
}
