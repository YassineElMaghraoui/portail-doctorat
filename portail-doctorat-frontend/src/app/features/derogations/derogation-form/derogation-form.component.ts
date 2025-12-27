import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MainLayoutComponent } from '@shared/components/main-layout/main-layout.component';
import { AuthService } from '@core/services/auth.service';
import { DerogationService } from '@core/services/derogation.service';
import { TypeDerogation } from '@core/models/derogation.model';

@Component({
  selector: 'app-derogation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MainLayoutComponent],
  template: `
    <app-main-layout>
      <div class="page-container">

        <!-- Hero Header -->
        <div class="hero-section">
          <div class="hero-content">
            <a routerLink="/derogations" class="back-btn"><i class="bi bi-arrow-left"></i></a>
            <div class="hero-icon"><i class="bi bi-clock-history"></i></div>
            <div>
              <h1 class="hero-title">Demande de Dérogation</h1>
              <p class="hero-subtitle">Prolongation de votre parcours doctoral</p>
            </div>
          </div>
        </div>

        <!-- Carte affichant l'année actuelle -->
        <div class="year-info-card">
          <div class="year-badge">
            <i class="bi bi-calendar3"></i>
            <div class="year-content">
              <span class="year-label">Votre année de thèse actuelle</span>
              <span class="year-value">{{ currentYear }}{{ getYearSuffix() }} année</span>
            </div>
          </div>
          <div class="year-status">
            @if (currentYear <= 3) {
              <span class="status-chip success"><i class="bi bi-check-circle"></i>Dans les délais normaux</span>
            } @else if (currentYear === 4) {
              <span class="status-chip warning"><i class="bi bi-exclamation-triangle"></i>1ère dérogation requise</span>
            } @else if (currentYear === 5) {
              <span class="status-chip warning"><i class="bi bi-exclamation-triangle"></i>2ème dérogation requise</span>
            } @else {
              <span class="status-chip danger"><i class="bi bi-x-circle"></i>3ème et dernière dérogation</span>
            }
          </div>
        </div>

        <!-- Info Banner -->
        <div class="info-banner">
          <i class="bi bi-info-circle"></i>
          <div>
            <strong>À propos des dérogations</strong>
            <p>La durée normale de thèse est de 3 ans. Au-delà, une dérogation est nécessaire pour chaque année supplémentaire (maximum 6 ans au total).</p>
          </div>
        </div>

        <!-- Form Card -->
        <div class="form-card">
          <div class="card-header">
            <div class="header-icon"><i class="bi bi-file-earmark-plus"></i></div>
            <h3>Formulaire de Demande</h3>
          </div>

          <form [formGroup]="derogationForm" (ngSubmit)="onSubmit()" class="card-body">

            <!-- Type de dérogation - TOUTES LES OPTIONS VISIBLES -->
            <div class="form-group">
              <label class="form-label">
                <i class="bi bi-tag"></i>
                Type de dérogation <span class="required">*</span>
              </label>
              <select class="form-select" formControlName="typeDerogation">
                <option value="">Sélectionnez le type</option>
                <option value="PROLONGATION_4EME_ANNEE">Prolongation 4ème année</option>
                <option value="PROLONGATION_5EME_ANNEE">Prolongation 5ème année</option>
                <option value="PROLONGATION_6EME_ANNEE">Prolongation 6ème année (dernière)</option>
                <option value="SUSPENSION_TEMPORAIRE">Suspension temporaire</option>
                <option value="AUTRE">Autre motif</option>
              </select>
              @if (derogationForm.get('typeDerogation')?.invalid && derogationForm.get('typeDerogation')?.touched) {
                <span class="error-text"><i class="bi bi-exclamation-circle"></i>Sélectionnez un type</span>
              }
            </div>

            <!-- Motif -->
            <div class="form-group">
              <label class="form-label">
                <i class="bi bi-chat-left-text"></i>
                Motif détaillé <span class="required">*</span>
              </label>
              <textarea
                  class="form-textarea"
                  formControlName="motif"
                  rows="5"
                  placeholder="Expliquez en détail les raisons de votre demande de dérogation...">
              </textarea>
              <span class="hint">Minimum 50 caractères</span>
              @if (derogationForm.get('motif')?.invalid && derogationForm.get('motif')?.touched) {
                <span class="error-text"><i class="bi bi-exclamation-circle"></i>Le motif est obligatoire (min. 50 caractères)</span>
              }
            </div>

            <!-- Info -->
            <div class="info-box">
              <i class="bi bi-lightbulb"></i>
              <div>
                <strong>Information</strong>
                <p>Votre demande sera examinée par le responsable du CEDoc. Vous serez notifié par email de la décision.</p>
              </div>
            </div>

            <!-- Actions -->
            <div class="form-actions">
              <a routerLink="/derogations" class="btn-cancel">
                <i class="bi bi-x-lg"></i>Annuler
              </a>
              <button type="submit" class="btn-submit" [disabled]="isLoading() || derogationForm.invalid">
                @if (isLoading()) {
                  <span class="spinner"></span>Envoi en cours...
                } @else {
                  <i class="bi bi-send"></i>Soumettre la demande
                }
              </button>
            </div>

            @if (errorMessage()) {
              <div class="alert error"><i class="bi bi-exclamation-triangle"></i>{{ errorMessage() }}</div>
            }
            @if (successMessage()) {
              <div class="alert success"><i class="bi bi-check-circle"></i>{{ successMessage() }}</div>
            }
          </form>
        </div>

      </div>
    </app-main-layout>
  `,
  styles: [`
    .page-container { max-width: 800px; margin: 0 auto; padding: 0 1.5rem 3rem; }

    .hero-section { background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 20px; padding: 2rem; margin-bottom: 1.5rem; color: white; }
    .hero-content { display: flex; align-items: center; gap: 1rem; }
    .back-btn { width: 40px; height: 40px; background: rgba(255,255,255,0.2); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; text-decoration: none; transition: all 0.2s; }
    .back-btn:hover { background: rgba(255,255,255,0.3); }
    .hero-icon { width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
    .hero-title { margin: 0; font-size: 1.5rem; font-weight: 800; }
    .hero-subtitle { margin: 0.25rem 0 0; opacity: 0.9; }

    .year-info-card { display: flex; align-items: center; justify-content: space-between; background: white; border-radius: 16px; padding: 1.25rem 1.5rem; margin-bottom: 1.5rem; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
    .year-badge { display: flex; align-items: center; gap: 1rem; }
    .year-badge > i { font-size: 2rem; color: #f59e0b; }
    .year-content { display: flex; flex-direction: column; }
    .year-label { font-size: 0.8rem; color: #64748b; }
    .year-value { font-size: 1.25rem; font-weight: 700; color: #1e293b; }
    .status-chip { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.4rem 0.75rem; border-radius: 50px; font-size: 0.8rem; font-weight: 600; }
    .status-chip.success { background: #dcfce7; color: #15803d; }
    .status-chip.warning { background: #fef3c7; color: #b45309; }
    .status-chip.danger { background: #fee2e2; color: #dc2626; }

    .info-banner { display: flex; gap: 1rem; padding: 1rem 1.25rem; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; margin-bottom: 1.5rem; color: #1e40af; }
    .info-banner i { font-size: 1.25rem; flex-shrink: 0; }
    .info-banner strong { display: block; margin-bottom: 0.2rem; }
    .info-banner p { margin: 0; font-size: 0.875rem; }

    .form-card { background: white; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; overflow: hidden; }
    .card-header { display: flex; align-items: center; gap: 0.75rem; padding: 1.25rem 1.5rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
    .header-icon { width: 44px; height: 44px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.1rem; }
    .card-header h3 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #1e293b; }
    .card-body { padding: 1.5rem; }

    .form-group { margin-bottom: 1.5rem; }
    .form-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem; }
    .form-label i { color: #f59e0b; }
    .required { color: #ef4444; }

    .form-select, .form-textarea {
      width: 100%; padding: 0.875rem 1rem; font-size: 0.95rem;
      border: 2px solid #e2e8f0; border-radius: 10px; background: #f8fafc; transition: all 0.2s;
    }
    .form-select:focus, .form-textarea:focus { outline: none; border-color: #f59e0b; background: white; box-shadow: 0 0 0 4px rgba(245,158,11,0.1); }
    .form-textarea { resize: vertical; min-height: 120px; }
    .hint { font-size: 0.75rem; color: #94a3b8; margin-top: 0.25rem; }
    .error-text { display: flex; align-items: center; gap: 0.3rem; font-size: 0.8rem; color: #ef4444; margin-top: 0.4rem; }

    .info-box { display: flex; gap: 0.75rem; padding: 1rem; background: #fef3c7; border-radius: 10px; margin-bottom: 1.5rem; }
    .info-box i { color: #f59e0b; font-size: 1.1rem; }
    .info-box strong { display: block; font-size: 0.85rem; color: #92400e; margin-bottom: 0.15rem; }
    .info-box p { margin: 0; font-size: 0.8rem; color: #a16207; }

    .form-actions { display: flex; gap: 1rem; margin-top: 2rem; padding-top: 1.5rem; border-top: 2px solid #f1f5f9; }
    .btn-cancel { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.875rem 1.5rem; background: white; border: 2px solid #e2e8f0; border-radius: 10px; color: #64748b; font-weight: 600; text-decoration: none; transition: all 0.2s; }
    .btn-cancel:hover { background: #f8fafc; border-color: #cbd5e1; }
    .btn-submit { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.875rem 1.5rem; background: linear-gradient(135deg, #f59e0b, #d97706); border: none; border-radius: 10px; color: white; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(245,158,11,0.3); }
    .btn-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(245,158,11,0.4); }
    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    .spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .alert { display: flex; align-items: center; gap: 0.5rem; padding: 0.875rem; margin-top: 1rem; border-radius: 10px; font-size: 0.875rem; }
    .alert.error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
    .alert.success { background: #f0fdf4; border: 1px solid #86efac; color: #15803d; }

    @media (max-width: 640px) {
      .year-info-card { flex-direction: column; gap: 1rem; align-items: flex-start; }
      .form-actions { flex-direction: column; }
      .btn-cancel { order: 2; }
    }
  `]
})
export class DerogationFormComponent implements OnInit {
  derogationForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  currentYear = 1;

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

  ngOnInit(): void {
    this.currentYear = this.authService.currentUser()?.anneeThese || 1;
  }

  getYearSuffix(): string {
    return this.currentYear === 1 ? 'ère' : 'ème';
  }

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
        this.isLoading.set(false);
        setTimeout(() => this.router.navigate(['/derogations']), 2000);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Erreur lors de la soumission');
        this.isLoading.set(false);
      }
    });
  }
}