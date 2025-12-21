import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainLayoutComponent } from '@shared/components/main-layout/main-layout.component';
import { AuthService } from '@core/services/auth.service';
import { DerogationService } from '@core/services/derogation.service';
import { Derogation, StatutDerogation, TypeDerogation } from '@core/models/derogation.model';

@Component({
  selector: 'app-derogation-management',
  standalone: true,
  imports: [CommonModule, MainLayoutComponent],
  template: `
    <app-main-layout>
      <div class="page">
        <header class="page-header">
          <h1>Gestion des dérogations</h1>
          <p class="text-muted">Traitez les demandes de dérogation des doctorants</p>
        </header>

        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-value">{{ stats().enAttente }}</span>
            <span class="stat-label">En attente</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ stats().approuvees }}</span>
            <span class="stat-label">Approuvées</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ stats().refusees }}</span>
            <span class="stat-label">Refusées</span>
          </div>
        </div>

        <div class="card mt-4">
          <div class="card-header">
            <h3>Demandes en attente</h3>
          </div>
          @if (derogations().length === 0) {
            <div class="card-body text-center" style="padding: 3rem;">
              <p class="text-muted">Aucune demande en attente</p>
            </div>
          } @else {
            <table class="table">
              <thead>
                <tr>
                  <th>Doctorant</th>
                  <th>Type</th>
                  <th>Motif</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (d of derogations(); track d.id) {
                  <tr>
                    <td>Doctorant #{{ d.doctorantId }}</td>
                    <td>{{ getTypeLabel(d.typeDerogation) }}</td>
                    <td>{{ d.motif | slice:0:50 }}...</td>
                    <td>{{ d.dateDemande | date:'dd/MM/yyyy' }}</td>
                    <td>
                      <button class="btn btn-sm btn-success" (click)="approuver(d.id)">
                        <i class="bi bi-check"></i>
                      </button>
                      <button class="btn btn-sm btn-danger" (click)="refuser(d.id)">
                        <i class="bi bi-x"></i>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      </div>
    </app-main-layout>
  `,
  styles: [`
    .page { max-width: 1200px; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: var(--border-radius);
      text-align: center;
      border: 1px solid var(--border-color);
    }
    .stat-value {
      display: block;
      font-size: 2rem;
      font-weight: 700;
      color: var(--primary-color);
    }
    .stat-label {
      color: var(--text-muted);
      font-size: 0.875rem;
    }
  `]
})
export class DerogationManagementComponent implements OnInit {
  derogations = signal<Derogation[]>([]);
  stats = signal({ enAttente: 0, approuvees: 0, refusees: 0 });

  constructor(
    private authService: AuthService,
    private derogationService: DerogationService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.derogationService.getDerogationsEnAttente().subscribe({
      next: (data) => this.derogations.set(data)
    });
    this.derogationService.getStatistiques().subscribe({
      next: (data) => this.stats.set(data)
    });
  }

  approuver(id: number): void {
    const userId = this.authService.currentUser()?.id;
    if (userId) {
      this.derogationService.approuver(id, userId, 'Approuvé').subscribe({
        next: () => this.loadData()
      });
    }
  }

  refuser(id: number): void {
    const userId = this.authService.currentUser()?.id;
    const commentaire = prompt('Motif du refus :');
    if (userId && commentaire) {
      this.derogationService.refuser(id, userId, commentaire).subscribe({
        next: () => this.loadData()
      });
    }
  }

  getTypeLabel(type: TypeDerogation): string {
    const labels: Record<string, string> = {
      'PROLONGATION_4EME_ANNEE': '4ème année',
      'PROLONGATION_5EME_ANNEE': '5ème année',
      'PROLONGATION_6EME_ANNEE': '6ème année'
    };
    return labels[type] || type;
  }
}
