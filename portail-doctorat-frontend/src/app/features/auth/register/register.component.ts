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
        <div class="auth-header">
          <h1>Créer un compte</h1>
          <p>Candidature au Doctorat</p>
        </div>

        @if (errorMessage()) {
          <div class="alert alert-danger">
            {{ errorMessage() }}
          </div>
        }

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="form-row">
            <div class="form-group">
              <label>Nom</label>
              <input type="text" class="form-control" formControlName="nom" placeholder="Votre nom" />
            </div>
            <div class="form-group">
              <label>Prénom</label>
              <input type="text" class="form-control" formControlName="prenom" placeholder="Votre prénom" />
            </div>
          </div>

          <div class="form-group">
            <label>Nom d'utilisateur</label>
            <input type="text" class="form-control" formControlName="username" />
          </div>

          <div class="form-group">
            <label>Email</label>
            <input type="email" class="form-control" formControlName="email" />
          </div>

          <div class="form-group">
            <label>Mot de passe</label>
            <input type="password" class="form-control" formControlName="password" />
          </div>

          <!-- PAS DE CHAMP RÔLE : C'est automatique -->

          <button type="submit" class="btn btn-primary btn-block" [disabled]="isLoading()">
            @if (isLoading()) { <span>Inscription...</span> }
            @else { <span>S'inscrire</span> }
          </button>
        </form>

        <div class="auth-footer">
          <p>Déjà un compte ? <a routerLink="/auth/login">Se connecter</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f0f2f5; }
    .auth-card { width: 100%; max-width: 450px; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .auth-header { text-align: center; margin-bottom: 2rem; h1 { font-size: 1.5rem; margin-bottom: 0.5rem; } }
    .form-group { margin-bottom: 1rem; label { display: block; margin-bottom: 0.5rem; font-weight: 500; } }
    .form-control { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .btn-block { width: 100%; padding: 0.75rem; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; }
    .btn-block:disabled { background: #93c5fd; }
    .auth-footer { text-align: center; margin-top: 1.5rem; font-size: 0.9rem; }
    .alert { padding: 0.75rem; background: #fee2e2; color: #dc2626; border-radius: 4px; margin-bottom: 1rem; }
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
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['DOCTORANT'] // Sera ignoré par le backend qui forcera CANDIDAT
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.isLoading.set(true);
    this.authService.register(this.registerForm.value).subscribe({
      next: () => {
        // ✅ REDIRECTION VERS LOGIN
        alert('Compte créé ! Connectez-vous pour voir le statut de votre candidature.');
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Erreur lors de l\'inscription');
        this.isLoading.set(false);
      }
    });
  }
}