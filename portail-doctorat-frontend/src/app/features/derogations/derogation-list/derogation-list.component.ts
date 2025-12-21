import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MainLayoutComponent } from '../../../shared/components/main-layout/main-layout.component';
import { AuthService } from '../../../core/services/auth.service';
import { DerogationService } from '../../../core/services/derogation.service';
import { Derogation, EligibiliteReinscription, StatutDerogation, TypeDerogation } from '../../../core/models/derogation.model';

@Component({
  selector: 'app-derogation-list',
  standalone: true,
  imports: [CommonModule, RouterLink, MainLayoutComponent],
  template: `
    <app-main-layout>
      <div class="page">
        <header class="page-header">
          <h1>Mes dérogations</h1>
          <p class="text-muted">Gérez vos demandes de dérogation pour prolongation du doctorat</p>
        </header>

        <!-- Info sur l'année actuelle -->
        <div class="info-card">
          <div class="info-content">
            <i class="bi bi-info-circle"></i>
            <div>
              <strong>Règles de durée du doctorat</strong>
              <p>Durée normale: 3 ans. Maximum avec dérogations: 6 ans. Au-delà de 3 ans, une dérogation est requise chaque année.</p>
            </div>
          </div>
          <a routerLink="/derogations/nouvelle" class="btn btn-primary">
            <i class="bi bi-plus-lg"></i> Nouvelle demande
          </a>
        </div>

        <!-- Liste des dérogations -->
        @if (derogations().length > 0) {
          <div class="card">
            <div class="card-header">
              <h3>Historique des demandes</h3>
            </div>
            <table class="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Motif</th>
                  <th>Statut</th>
                  <th>Date de demande</th>
                </tr>
              </thead>
              <tbody>
                @for (derogation of derogations(); track derogation.id) {
                  <tr>
                    <td>{{ getTypeLabel(derogation.typeDerogation) }}</td>
                    <td class="motif-cell">{{ derogation.motif }}</td>
                    <td>
                      <span class="badge" [class]="getStatutClass(derogation.statut)">
                        {{ getStatutLabel(derogation.statut) }}
                      </span>
                    </td>
                    <td>{{ derogation.dateDemande | date:'dd/MM/yyyy' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <div class="empty-state">
            <i class="bi bi-clock-history"></i>
            <h3>Aucune demande de dérogation</h3>
            <p>Vous n'avez pas encore fait de demande de dérogation.</p>
          </div>
        }
      </div>
    </app-main-layout>
  `,
  styles: [`
    .page {
      max-width: 1000px;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .page-header h1 {
      margin-bottom: 0.5rem;
    }

    .text-muted {
      color: #64748b;
    }

    .info-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      margin-bottom: 1.5rem;
    }

    .info-content {
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }

    .info-content i {
      font-size: 1.5rem;
      color: #667eea;
    }

    .info-content p {
      margin: 0.25rem 0 0;
      color: #64748b;
      font-size: 0.875rem;
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
      white-space: nowrap;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-primary:hover {
      background: #5a67d8;
    }

    .card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }

    .card-header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e2e8f0;
      background: #f8fafc;
    }

    .card-header h3 {
      margin: 0;
      font-size: 1rem;
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

    .motif-cell {
      max-width: 300px;
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

    .badge-warning {
      background: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
    }

    .badge-success {
      background: rgba(34, 197, 94, 0.1);
      color: #22c55e;
    }

    .badge-danger {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }

    .badge-secondary {
      background: rgba(100, 116, 139, 0.1);
      color: #64748b;
    }

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
      display: block;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      margin-bottom: 0.5rem;
    }

    .empty-state p {
      color: #64748b;
    }
  `]
})
export class DerogationListComponent implements OnInit {
  derogations = signal<Derogation[]>([]);
  eligibilite = signal<EligibiliteReinscription | null>(null);

  constructor(
    private authService: AuthService,
    private derogationService: DerogationService
  ) {}

  ngOnInit(): void {
    const userId = this.authService.currentUser()?.id;
    if (userId) {
      this.derogationService.getMesDerogations(userId).subscribe({
        next: (data) => this.derogations.set(data),
        error: () => {}
      });
    }
  }

  getTypeLabel(type: TypeDerogation): string {
    const labels: Record<string, string> = {
      'PROLONGATION_4EME_ANNEE': '4ème année',
      'PROLONGATION_5EME_ANNEE': '5ème année',
      'PROLONGATION_6EME_ANNEE': '6ème année',
      'SUSPENSION_TEMPORAIRE': 'Suspension',
      'AUTRE': 'Autre'
    };
    return labels[type] || type;
  }

  getStatutClass(statut: StatutDerogation): string {
    const classes: Record<string, string> = {
      'EN_ATTENTE': 'badge-warning',
      'APPROUVEE': 'badge-success',
      'REFUSEE': 'badge-danger',
      'EXPIREE': 'badge-secondary',
      'ANNULEE': 'badge-secondary'
    };
    return classes[statut] || 'badge-secondary';
  }

  getStatutLabel(statut: StatutDerogation): string {
    const labels: Record<string, string> = {
      'EN_ATTENTE': 'En attente',
      'APPROUVEE': 'Approuvée',
      'REFUSEE': 'Refusée',
      'EXPIREE': 'Expirée',
      'ANNULEE': 'Annulée'
    };
    return labels[statut] || statut;
  }
}
