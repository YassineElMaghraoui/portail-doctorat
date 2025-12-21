import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MainLayoutComponent } from '@shared/components/main-layout/main-layout.component';
import { InscriptionService } from '@core/services/inscription.service';
import { Inscription, StatutInscription } from '@core/models/inscription.model';

@Component({
  selector: 'app-inscription-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MainLayoutComponent],
  template: `
    <app-main-layout>
      <div class="page">
        <header class="page-header">
          <a routerLink="/inscriptions" class="back-link">
            <i class="bi bi-arrow-left"></i> Retour aux inscriptions
          </a>
          <h1>Détail de l'inscription</h1>
        </header>

        @if (isLoading()) {
          <div class="loading-state">
            <div class="spinner"></div>
          </div>
        } @else if (inscription()) {
          <div class="detail-grid">
            <!-- Informations principales -->
            <div class="card">
              <div class="card-header">
                <h3>Informations générales</h3>
                <span class="badge" [class]="getStatutClass(inscription()!.statut)">
                  {{ getStatutLabel(inscription()!.statut) }}
                </span>
              </div>
              <div class="card-body">
                <div class="info-grid">
                  <div class="info-item">
                    <label>Campagne</label>
                    <span>{{ inscription()!.campagne?.anneeUniversitaire }}</span>
                  </div>
                  <div class="info-item">
                    <label>Type</label>
                    <span>{{ inscription()!.typeInscription === 'PREMIERE_INSCRIPTION' ? 'Première inscription' : 'Réinscription' }}</span>
                  </div>
                  <div class="info-item">
                    <label>Année de doctorat</label>
                    <span>{{ inscription()!.anneeInscription }}ème année</span>
                  </div>
                  <div class="info-item">
                    <label>Date de création</label>
                    <span>{{ inscription()!.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sujet de thèse -->
            <div class="card">
              <div class="card-header">
                <h3>Sujet de thèse</h3>
              </div>
              <div class="card-body">
                <p>{{ inscription()!.sujetThese }}</p>
              </div>
            </div>

            <!-- Laboratoire -->
            <div class="card">
              <div class="card-header">
                <h3>Laboratoire et encadrement</h3>
              </div>
              <div class="card-body">
                <div class="info-grid">
                  <div class="info-item">
                    <label>Laboratoire d'accueil</label>
                    <span>{{ inscription()!.laboratoireAccueil }}</span>
                  </div>
                  <div class="info-item">
                    <label>Directeur de thèse (ID)</label>
                    <span>{{ inscription()!.directeurId }}</span>
                  </div>
                  @if (inscription()!.collaborationExterne) {
                    <div class="info-item">
                      <label>Collaboration externe</label>
                      <span>{{ inscription()!.collaborationExterne }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>

            <!-- Commentaires de validation -->
            @if (inscription()!.commentaireDirecteur || inscription()!.commentaireAdmin) {
              <div class="card">
                <div class="card-header">
                  <h3>Commentaires de validation</h3>
                </div>
                <div class="card-body">
                  @if (inscription()!.commentaireDirecteur) {
                    <div class="comment">
                      <label>Directeur de thèse</label>
                      <p>{{ inscription()!.commentaireDirecteur }}</p>
                      <small>{{ inscription()!.dateValidationDirecteur | date:'dd/MM/yyyy HH:mm' }}</small>
                    </div>
                  }
                  @if (inscription()!.commentaireAdmin) {
                    <div class="comment">
                      <label>Administration</label>
                      <p>{{ inscription()!.commentaireAdmin }}</p>
                      <small>{{ inscription()!.dateValidationAdmin | date:'dd/MM/yyyy HH:mm' }}</small>
                    </div>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Actions -->
          @if (inscription()!.statut === 'BROUILLON') {
            <div class="actions-bar">
              <a [routerLink]="['/inscriptions', inscription()!.id, 'edit']" class="btn btn-outline">
                <i class="bi bi-pencil"></i> Modifier
              </a>
              <button class="btn btn-primary" (click)="soumettre()">
                <i class="bi bi-send"></i> Soumettre
              </button>
            </div>
          }
        }
      </div>
    </app-main-layout>
  `,
  styles: [`
    .page {
      max-width: 900px;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }

    .detail-grid {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .info-item {
      label {
        display: block;
        font-size: 0.8125rem;
        color: var(--text-muted);
        margin-bottom: 0.25rem;
      }

      span {
        font-weight: 500;
      }
    }

    .comment {
      padding: 1rem;
      background: var(--bg-color);
      border-radius: var(--border-radius);
      margin-bottom: 1rem;

      &:last-child {
        margin-bottom: 0;
      }

      label {
        font-weight: 600;
        display: block;
        margin-bottom: 0.5rem;
      }

      small {
        color: var(--text-muted);
      }
    }

    .actions-bar {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
    }

    .loading-state {
      display: flex;
      justify-content: center;
      padding: 4rem;
    }
  `]
})
export class InscriptionDetailComponent implements OnInit {
  inscription = signal<Inscription | null>(null);
  isLoading = signal(true);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private inscriptionService: InscriptionService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadInscription(+id);
    }
  }

  private loadInscription(id: number): void {
    this.inscriptionService.getById(id).subscribe({
      next: (data) => {
        this.inscription.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.router.navigate(['/inscriptions']);
      }
    });
  }

  soumettre(): void {
    const id = this.inscription()?.id;
    if (id) {
      this.inscriptionService.soumettre(id).subscribe({
        next: () => this.loadInscription(id)
      });
    }
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
      'VALIDE_DIRECTEUR': 'Validé par le directeur',
      'VALIDE_ADMIN': 'Validé',
      'REJETE_DIRECTEUR': 'Rejeté par le directeur',
      'REJETE_ADMIN': 'Rejeté'
    };
    return labels[statut] || statut;
  }
}
