import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MainLayoutComponent } from '../../../shared/components/main-layout/main-layout.component';
import { AuthService } from '../../../core/services/auth.service';
import { InscriptionService } from '../../../core/services/inscription.service';
import { Inscription, StatutInscription } from '../../../core/models/inscription.model';

@Component({
  selector: 'app-inscription-list',
  standalone: true,
  imports: [CommonModule, RouterLink, MainLayoutComponent],
  template: `
    <app-main-layout>
      <div class="page">
        <header class="page-header">
          <div>
            <h1>Mes inscriptions</h1>
            <p class="text-muted">Gérez vos demandes d'inscription au doctorat</p>
          </div>
          <a routerLink="/inscriptions/nouvelle" class="btn btn-primary">
            <i class="bi bi-plus-lg"></i>
            Nouvelle inscription
          </a>
        </header>

        @if (isLoading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Chargement...</p>
          </div>
        } @else if (inscriptions().length === 0) {
          <div class="empty-state">
            <i class="bi bi-file-earmark-text"></i>
            <h3>Aucune inscription</h3>
            <p>Vous n'avez pas encore d'inscription. Créez votre première demande.</p>
            <a routerLink="/inscriptions/nouvelle" class="btn btn-primary">
              <i class="bi bi-plus-lg"></i>
              Nouvelle inscription
            </a>
          </div>
        } @else {
          <div class="card">
            <table class="table">
              <thead>
                <tr>
                  <th>Campagne</th>
                  <th>Sujet de thèse</th>
                  <th>Type</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (inscription of inscriptions(); track inscription.id) {
                  <tr>
                    <td>{{ inscription.campagne?.anneeUniversitaire || 'N/A' }}</td>
                    <td class="sujet-cell">{{ inscription.sujetThese }}</td>
                    <td>
                      <span class="badge badge-secondary">
                        {{ inscription.typeInscription === 'PREMIERE_INSCRIPTION' ? '1ère' : 'Réinscription' }}
                      </span>
                    </td>
                    <td>
                      <span class="badge" [class]="getStatutClass(inscription.statut)">
                        {{ getStatutLabel(inscription.statut) }}
                      </span>
                    </td>
                    <td>{{ inscription.createdAt | date:'dd/MM/yyyy' }}</td>
                    <td>
                      <div class="actions">
                        <a [routerLink]="['/inscriptions', inscription.id]" class="btn btn-sm btn-outline">
                          <i class="bi bi-eye"></i>
                        </a>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </app-main-layout>
  `,
  styles: [`
    .page {
      max-width: 1200px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
    }

    .page-header h1 {
      margin-bottom: 0.25rem;
    }

    .text-muted {
      color: #64748b;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      font-weight: 500;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-primary:hover {
      background: #5a67d8;
    }

    .btn-outline {
      background: transparent;
      border: 1px solid #e2e8f0;
      color: #64748b;
    }

    .btn-outline:hover {
      background: #f8fafc;
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.875rem;
    }

    .card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }

    .table {
      width: 100%;
      border-collapse: collapse;
    }

    .table th,
    .table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }

    .table th {
      background: #f8fafc;
      font-weight: 600;
      font-size: 0.8125rem;
      color: #64748b;
      text-transform: uppercase;
    }

    .sujet-cell {
      max-width: 250px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.625rem;
      font-size: 0.75rem;
      font-weight: 500;
      border-radius: 20px;
    }

    .badge-secondary {
      background: rgba(100, 116, 139, 0.1);
      color: #64748b;
    }

    .badge-primary {
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;
    }

    .badge-success {
      background: rgba(34, 197, 94, 0.1);
      color: #22c55e;
    }

    .badge-warning {
      background: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
    }

    .badge-danger {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    .loading-state,
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }

    .empty-state i {
      font-size: 4rem;
      color: #e2e8f0;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      margin-bottom: 0.5rem;
    }

    .empty-state p {
      color: #64748b;
      margin-bottom: 1.5rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e2e8f0;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class InscriptionListComponent implements OnInit {
  inscriptions = signal<Inscription[]>([]);
  isLoading = signal(true);

  constructor(
    private authService: AuthService,
    private inscriptionService: InscriptionService
  ) {}

  ngOnInit(): void {
    this.loadInscriptions();
  }

  private loadInscriptions(): void {
    const userId = this.authService.currentUser()?.id;
    if (!userId) {
      this.isLoading.set(false);
      return;
    }

    this.inscriptionService.getByDoctorant(userId).subscribe({
      next: (data) => {
        this.inscriptions.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  getStatutClass(statut: StatutInscription): string {
    const classes: Record<string, string> = {
      'BROUILLON': 'badge-secondary',
      'SOUMIS': 'badge-primary',
      'VALIDE_DIRECTEUR': 'badge-warning',
      'VALIDE_ADMIN': 'badge-success',
      'REJETE_DIRECTEUR': 'badge-danger',
      'REJETE_ADMIN': 'badge-danger'
    };
    return classes[statut] || 'badge-secondary';
  }

  getStatutLabel(statut: StatutInscription): string {
    const labels: Record<string, string> = {
      'BROUILLON': 'Brouillon',
      'SOUMIS': 'Soumis',
      'VALIDE_DIRECTEUR': 'Validé (Dir.)',
      'VALIDE_ADMIN': 'Validé',
      'REJETE_DIRECTEUR': 'Rejeté',
      'REJETE_ADMIN': 'Rejeté'
    };
    return labels[statut] || statut;
  }
}
