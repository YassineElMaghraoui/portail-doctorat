import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">

        <!-- En-tête -->
        <div class="auth-header">
          <div class="logo">
            <i class="bi bi-mortarboard-fill"></i>
          </div>
          <h1>Créer un compte</h1>
          <p>Candidature au Doctorat</p>
        </div>

        <!-- Message d'erreur -->
        @if (errorMessage()) {
          <div class="alert alert-danger">
            {{ errorMessage() }}
          </div>
        }

        <!-- Formulaire -->
        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">

          <!-- Ligne Nom & Prénom -->
          <div class="row g-2 mb-3">
            <div class="col-6">
              <label class="form-label">Nom</label>
              <input type="text" class="form-control" formControlName="nom" placeholder="Votre nom"
                     [class.is-invalid]="isFieldInvalid('nom')">
            </div>
            <div class="col-6">
              <label class="form-label">Prénom</label>
              <input type="text" class="form-control" formControlName="prenom" placeholder="Votre prénom"
                     [class.is-invalid]="isFieldInvalid('prenom')">
            </div>
          </div>

          <!-- Ligne Matricule & Téléphone -->
          <div class="row g-2 mb-3">
            <div class="col-6">
              <label class="form-label">Matricule</label>
              <input type="text" class="form-control" formControlName="matricule" placeholder="Ex: D135..."
                     [class.is-invalid]="isFieldInvalid('matricule')">
            </div>
            <div class="col-6">
              <label class="form-label">Téléphone</label>
              <input type="text" class="form-control" formControlName="telephone" placeholder="+212 6..."
                     [class.is-invalid]="isFieldInvalid('telephone')">
            </div>
          </div>

          <!-- Email -->
          <div class="mb-3">
            <label class="form-label">Email</label>
            <input type="email" class="form-control" formControlName="email" placeholder="exemple@email.com"
                   [class.is-invalid]="isFieldInvalid('email')">
          </div>

          <!-- Mot de passe -->
          <div class="mb-4">
            <label class="form-label">Mot de passe</label>
            <input type="password" class="form-control" formControlName="password" placeholder="Minimum 6 caractères"
                   [class.is-invalid]="isFieldInvalid('password')">
          </div>

          <!-- Bouton d'action -->
          <button type="submit" class="btn btn-primary btn-block" [disabled]="isLoading()">
            @if (isLoading()) {
              <span class="spinner-border spinner-border-sm me-2"></span> Inscription...
            } @else {
              S'inscrire
            }
          </button>
        </form>

        <!-- Pied de page -->
        <div class="auth-footer">
          <p>Vous avez déjà un compte ? <a routerLink="/auth/login">Se connecter</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Fond dégradé identique au Login */
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1rem;
    }

    /* Carte blanche centrée */
    .auth-card {
      width: 100%;
      max-width: 480px; /* Un peu plus large pour les 2 colonnes */
      background: white;
      border-radius: 16px;
      padding: 2.5rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .auth-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .logo {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1rem;
      color: white; font-size: 1.8rem;
    }

    h1 { font-size: 1.5rem; font-weight: 700; color: #1e293b; margin-bottom: 0.25rem; }
    p { color: #64748b; font-size: 0.9rem; }

    /* Styles des champs */
    .form-label {
      font-weight: 500;
      font-size: 0.9rem;
      color: #334155;
      margin-bottom: 0.5rem;
      display: block;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.95rem;
      background-color: #f8fafc;
      transition: all 0.2s;
    }

    .form-control:focus {
      background-color: white;
      border-color: #818cf8;
      outline: none;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }

    .is-invalid { border-color: #ef4444 !important; }

    /* Bouton principal */
    .btn-block {
      width: 100%;
      padding: 0.875rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      color: white;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      margin-top: 0.5rem;
      transition: transform 0.1s;
    }

    .btn-block:hover:not(:disabled) { transform: translateY(-1px); opacity: 0.95; }
    .btn-block:disabled { opacity: 0.7; cursor: not-allowed; }

    .auth-footer { text-align: center; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #f1f5f9; font-size: 0.9rem; color: #64748b; }
    .auth-footer a { color: #6366f1; text-decoration: none; font-weight: 500; }
    .auth-footer a:hover { text-decoration: underline; }

    .row { display: flex; gap: 15px; }
    .col-6 { flex: 1; }

    .alert { padding: 0.75rem; background: #fee2e2; color: #dc2626; border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.9rem; border: 1px solid #fecaca; }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.registerForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      // ✅ CHANGEMENT : matricule et telephone
      matricule: ['', [Validators.required, Validators.minLength(3)]],
      telephone: ['', [Validators.required, Validators.pattern('^[0-9+ ]{8,15}$')]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        alert('Compte créé avec succès ! Connectez-vous maintenant.');
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Erreur lors de l\'inscription');
        this.isLoading.set(false);
      }
    });
  }
}