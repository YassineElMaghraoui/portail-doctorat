import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MainLayoutComponent } from '@shared/components/main-layout/main-layout.component';
import { AuthService } from '@core/services/auth.service';
import { DerogationService } from '@core/services/derogation.service';
import { TypeDerogation, EligibiliteReinscription } from '@core/models/derogation.model';

@Component({
  selector: 'app-derogation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MainLayoutComponent],
  template: `
    <app-main-layout>
      <div class="page">
        <header class="page-header">
          <a routerLink="/derogations" class="back-link">
            <i class="bi bi-arrow-left"></i> Retour
          </a>
          <h1>Demande de dérogation</h1>
          <p class="text-muted">Demandez une prolongation de votre doctorat</p>
        </header>

        <div class="card">
          <div class="card-body">
            @if (errorMessage()) {
              <div class="alert alert-danger">{{ errorMessage() }}</div>
            }

            @if (successMessage()) {
              <div class="alert alert-success">{{ successMessage() }}</div>
            }

            <form [formGroup]="derogationForm" (ngSubmit)="onSubmit()">
              <div class="form-group">
                <label class="form-label">Type de dérogation *</label>
                <select class="form-control form-select" formControlName="typeDerogation">
                  <option value="">Sélectionnez le type</option>
                  <option value="PROLONGATION_4EME_ANNEE">Prolongation 4ème année</option>
                  <option value="PROLONGATION_5EME_ANNEE">Prolongation 5ème année</option>
                  <option value="PROLONGATION_6EME_ANNEE">Prolongation 6ème année (dernière)</option>
                  <option value="SUSPENSION_TEMPORAIRE">Suspension temporaire</option>
                  <option value="AUTRE">Autre motif</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Motif détaillé *</label>
                <textarea
                  class="form-control"
                  formControlName="motif"
                  rows="5"
                  placeholder="Expliquez en détail les raisons de votre demande de dérogation..."
                ></textarea>
                <small class="form-text">Minimum 50 caractères</small>
              </div>

              <div class="alert alert-info">
                <i class="bi bi-info-circle"></i>
                <div>
                  <strong>Information</strong>
                  <p>Votre demande sera examinée par le responsable du CEDoc. Vous serez notifié par email de la décision.</p>
                </div>
              </div>

              <div class="form-actions">
                <a routerLink="/derogations" class="btn btn-outline">Annuler</a>
                <button type="submit" class="btn btn-primary" [disabled]="isLoading() || derogationForm.invalid">
                  @if (isLoading()) {
                    <span class="spinner"></span>
                  }
                  <i class="bi bi-send"></i>
                  Soumettre la demande
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </app-main-layout>
  `,
  styles: [`
    .page { max-width: 700px; }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-muted);
      margin-bottom: 1rem;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
    }

    .alert {
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;

      i { font-size: 1.25rem; }
      p { margin: 0.25rem 0 0; }
    }
  `]
})
export class DerogationFormComponent implements OnInit {
  derogationForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private derogationService: DerogationService
  ) {
    this.derogationForm = this.fb.group({
      typeDerogation: ['', Validators.required],
      motif: ['', [Validators.required, Validators.minLength(50)]]
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.derogationForm.invalid) {
      this.derogationForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const userId = this.authService.currentUser()?.id;
    const request = {
      doctorantId: userId!,
      typeDerogation: this.derogationForm.value.typeDerogation as TypeDerogation,
      motif: this.derogationForm.value.motif
    };

    this.derogationService.demanderDerogation(request).subscribe({
      next: () => {
        this.successMessage.set('Votre demande a été soumise avec succès !');
        setTimeout(() => this.router.navigate(['/derogations']), 2000);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Erreur lors de la soumission');
        this.isLoading.set(false);
      }
    });
  }
}
