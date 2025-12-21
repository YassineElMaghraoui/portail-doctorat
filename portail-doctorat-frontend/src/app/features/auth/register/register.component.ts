import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { Role } from '@core/models/user.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <div class="logo">
            <i class="bi bi-mortarboard-fill"></i>
          </div>
          <h1>Créer un compte</h1>
          <p>Rejoignez le Portail Doctorat</p>
        </div>

        @if (errorMessage()) {
          <div class="alert alert-danger">
            <i class="bi bi-exclamation-circle"></i>
            {{ errorMessage() }}
          </div>
        }

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label" for="nom">Nom</label>
              <input
                type="text"
                id="nom"
                class="form-control"
                formControlName="nom"
                placeholder="Votre nom"
                [class.is-invalid]="isFieldInvalid('nom')"
              />
            </div>
            <div class="form-group">
              <label class="form-label" for="prenom">Prénom</label>
              <input
                type="text"
                id="prenom"
                class="form-control"
                formControlName="prenom"
                placeholder="Votre prénom"
                [class.is-invalid]="isFieldInvalid('prenom')"
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="username">Nom d'utilisateur</label>
            <input
              type="text"
              id="username"
              class="form-control"
              formControlName="username"
              placeholder="Choisissez un identifiant"
              [class.is-invalid]="isFieldInvalid('username')"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="email">Email</label>
            <input
              type="email"
              id="email"
              class="form-control"
              formControlName="email"
              placeholder="votre.email@example.com"
              [class.is-invalid]="isFieldInvalid('email')"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Mot de passe</label>
            <input
              type="password"
              id="password"
              class="form-control"
              formControlName="password"
              placeholder="Minimum 6 caractères"
              [class.is-invalid]="isFieldInvalid('password')"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="role">Profil</label>
            <select
              id="role"
              class="form-control form-select"
              formControlName="role"
            >
              <option value="DOCTORANT">Doctorant</option>
              <option value="DIRECTEUR_THESE">Directeur de thèse</option>
            </select>
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="isLoading()">
            @if (isLoading()) {
              <span class="spinner"></span>
              Inscription en cours...
            } @else {
              <i class="bi bi-person-plus"></i>
              S'inscrire
            }
          </button>
        </form>

        <div class="auth-footer">
          <p>Déjà un compte ? <a routerLink="/auth/login">Se connecter</a></p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1rem;
    }

    .auth-card {
      width: 100%;
      max-width: 480px;
      background: white;
      border-radius: 16px;
      padding: 2.5rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .auth-header {
      text-align: center;
      margin-bottom: 2rem;

      .logo {
        width: 70px;
        height: 70px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1rem;
        
        i {
          font-size: 2rem;
          color: white;
        }
      }

      h1 {
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
      }

      p {
        color: #64748b;
      }
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .btn-block {
      width: 100%;
      padding: 0.875rem;
      font-size: 1rem;
      margin-top: 0.5rem;
    }

    .auth-footer {
      text-align: center;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e2e8f0;
      
      p {
        color: #64748b;
      }
    }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['DOCTORANT']
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
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.errorMessage.set(error.message || 'Erreur lors de l\'inscription');
        this.isLoading.set(false);
      }
    });
  }
}
