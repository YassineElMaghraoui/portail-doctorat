import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MainLayoutComponent } from '@shared/components/main-layout/main-layout.component';
import { AuthService } from '@core/services/auth.service';
import { InscriptionService } from '@core/services/inscription.service';
import { Role } from '@core/models/user.model';
import { AdminDashboardComponent } from '../admin/dashboard/admin-dashboard.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MainLayoutComponent, AdminDashboardComponent],
  template: `
    <!-- ROUTAGE INTELLIGENT DU DASHBOARD -->

    @if (isAdmin()) {
      <!-- CAS 1 : C'EST UN ADMIN -->
      <app-admin-dashboard></app-admin-dashboard>
    } @else {
      <!-- CAS 2 : DOCTORANT OU DIRECTEUR -->
      <app-main-layout>
        <div class="dashboard-container p-4">

          <header class="mb-5">
            <h1 class="fw-bold text-dark">Bienvenue, {{ authService.currentUser()?.prenom }} !</h1>
            <p class="text-muted">Espace {{ isDoctorant() ? 'Doctorant' : 'Encadrement' }}</p>
          </header>

          <!-- STATS GRID -->
          <div class="row g-4 mb-5">

            <!-- STATS DOCTORANT -->
            @if (isDoctorant()) {
              <div class="col-md-4">
                <div class="stat-card bg-white p-4 rounded-4 shadow-sm border-start border-4 border-primary">
                  <div class="d-flex align-items-center">
                    <div class="icon-box bg-primary-subtle text-primary rounded-circle me-3">
                      <i class="bi bi-mortarboard"></i>
                    </div>
                    <div>
                      <h3 class="mb-0 fw-bold">Doctorat</h3>
                      <span class="text-muted small">Cycle en cours</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-md-4">
                <div class="stat-card bg-white p-4 rounded-4 shadow-sm border-start border-4 border-success">
                  <div class="d-flex align-items-center">
                    <div class="icon-box bg-success-subtle text-success rounded-circle me-3">
                      <i class="bi bi-file-earmark-text"></i>
                    </div>
                    <div>
                      <h3 class="mb-0 fw-bold">{{ stats().inscriptions }}</h3>
                      <span class="text-muted small">Dossiers soumis</span>
                    </div>
                  </div>
                </div>
              </div>
            }

            <!-- STATS DIRECTEUR -->
            @if (isDirecteur()) {
              <div class="col-md-4">
                <div class="stat-card bg-white p-4 rounded-4 shadow-sm border-start border-4 border-warning">
                  <div class="d-flex align-items-center">
                    <div class="icon-box bg-warning-subtle text-warning rounded-circle me-3">
                      <i class="bi bi-hourglass-split"></i>
                    </div>
                    <div>
                      <h3 class="mb-0 fw-bold">{{ stats().aValider }}</h3>
                      <span class="text-muted small">Dossiers à valider</span>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- ACTIONS RAPIDES -->
          <h4 class="fw-bold text-muted text-uppercase small mb-3">Actions Rapides</h4>
          <div class="row g-4">

            <!-- ACTIONS DOCTORANT -->
            @if (isDoctorant()) {
              <div class="col-md-4">
                <a routerLink="/inscriptions/nouvelle" class="action-card">
                  <div class="icon bg-blue-soft text-blue"><i class="bi bi-plus-lg"></i></div>
                  <div>
                    <h5>Nouvelle Inscription</h5>
                    <p>Déposer un dossier pour cette année</p>
                  </div>
                </a>
              </div>

              <div class="col-md-4">
                <a routerLink="/soutenances" class="action-card">
                  <div class="icon bg-purple-soft text-purple"><i class="bi bi-award"></i></div>
                  <div>
                    <h5>Ma Soutenance</h5>
                    <p>Gérer la fin de thèse et le jury</p>
                  </div>
                </a>
              </div>

              <div class="col-md-4">
                <a routerLink="/derogations" class="action-card">
                  <div class="icon bg-orange-soft text-orange"><i class="bi bi-clock-history"></i></div>
                  <div>
                    <h5>Dérogations</h5>
                    <p>Demander une prolongation</p>
                  </div>
                </a>
              </div>
            }

            <!-- ACTIONS DIRECTEUR -->
            @if (isDirecteur()) {
              <div class="col-md-4">
                <a routerLink="/validations" class="action-card">
                  <div class="icon bg-green-soft text-green"><i class="bi bi-check2-circle"></i></div>
                  <div>
                    <h5>Valider Inscriptions</h5>
                    <p>Examiner les dossiers de vos doctorants</p>
                  </div>
                </a>
              </div>
            }
          </div>

        </div>
      </app-main-layout>
    }
  `,
  styles: [`
    .icon-box { width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }

    .action-card {
      display: flex; align-items: center; gap: 1rem;
      background: white; padding: 1.5rem; border-radius: 16px;
      text-decoration: none; color: inherit;
      box-shadow: 0 4px 6px rgba(0,0,0,0.02); transition: all 0.2s;
      border: 1px solid rgba(0,0,0,0.05);
    }
    .action-card:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.08); }
    .action-card h5 { margin: 0; font-weight: 700; font-size: 1rem; color: #1e293b; }
    .action-card p { margin: 0; font-size: 0.85rem; color: #64748b; }

    .icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; flex-shrink: 0; }

    .bg-blue-soft { background: #e0f2fe; } .text-blue { color: #0284c7; }
    .bg-purple-soft { background: #f3e8ff; } .text-purple { color: #9333ea; }
    .bg-orange-soft { background: #ffedd5; } .text-orange { color: #ea580c; }
    .bg-green-soft { background: #dcfce7; } .text-green { color: #16a34a; }
  `]
})
export class DashboardComponent implements OnInit {
  stats = signal({ inscriptions: 0, aValider: 0 });

  constructor(
      public authService: AuthService,
      private inscriptionService: InscriptionService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  isDoctorant(): boolean { return this.authService.currentUser()?.role === Role.DOCTORANT; }
  isDirecteur(): boolean { return this.authService.currentUser()?.role === Role.DIRECTEUR_THESE; }
  isAdmin(): boolean { return this.authService.currentUser()?.role === Role.ADMIN; }

  private loadData(): void {
    const user = this.authService.currentUser();
    if (!user) return;

    if (this.isDoctorant()) {
      this.inscriptionService.getByDoctorant(user.id).subscribe(data =>
          this.stats.update(s => ({ ...s, inscriptions: data.length }))
      );
    }
    else if (this.isDirecteur()) {
      this.inscriptionService.getInscriptionsByDirecteur(user.id).subscribe(data => {
        const count = data.filter(i => i.statut === 'SOUMIS').length;
        this.stats.update(s => ({ ...s, aValider: count }));
      });
    }
  }
}