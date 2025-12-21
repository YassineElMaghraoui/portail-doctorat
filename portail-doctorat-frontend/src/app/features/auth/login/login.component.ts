import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <div class="logo">
            <i class="bi bi-mortarboard-fill"></i>
          </div>
          <h1>Portail Doctorat</h1>
          <p>Connectez-vous à votre compte</p>
        </div>

        @if (errorMessage()) {
          <div class="alert alert-danger">
            <i class="bi bi-exclamation-circle"></i>
            {{ errorMessage() }}
          </div>
        }

        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label class="form-label" for="username">Nom d'utilisateur ou Email</label>
            <div class="input-group">
              <i class="bi bi-person"></i>
              <input
                type="text"
                id="username"
                class="form-control"
                formControlName="username"
                placeholder="Entrez votre identifiant"
                [class.is-invalid]="isFieldInvalid('username')"
              />
            </div>
            @if (isFieldInvalid('username')) {
              <div class="invalid-feedback">Ce champ est obligatoire</div>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Mot de passe</label>
            <div class="input-group">
              <i class="bi bi-lock"></i>
              <input
                [type]="showPassword() ? 'text' : 'password'"
                id="password"
                class="form-control"
                formControlName="password"
                placeholder="Entrez votre mot de passe"
                [class.is-invalid]="isFieldInvalid('password')"
              />
              <button type="button" class="btn-toggle-password" (click)="togglePassword()">
                <i class="bi" [class.bi-eye]="!showPassword()" [class.bi-eye-slash]="showPassword()"></i>
              </button>
            </div>
            @if (isFieldInvalid('password')) {
              <div class="invalid-feedback">Ce champ est obligatoire</div>
            }
          </div>

          <button type="submit" class="btn btn-primary btn-block" [disabled]="isLoading()">
            @if (isLoading()) {
              <span class="spinner"></span>
              Connexion en cours...
            } @else {
              <i class="bi bi-box-arrow-in-right"></i>
              Se connecter
            }
          </button>
        </form>

        <div class="auth-footer">
          <p>Pas encore de compte ? <a routerLink="/auth/register">S'inscrire</a></p>
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
      max-width: 420px;
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
        color: #1e293b;
      }

      p {
        color: #64748b;
        font-size: 0.9375rem;
      }
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .input-group {
      position: relative;
      
      i:first-child {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: #94a3b8;
      }

      .form-control {
        padding-left: 2.75rem;
        padding-right: 2.75rem;
      }

      .btn-toggle-password {
        position: absolute;
        right: 0.5rem;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 0.5rem;
        
        &:hover {
          color: #64748b;
        }
      }
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
        font-size: 0.9375rem;
      }
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = signal(false);
  showPassword = signal(false);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  isFieldInvalid(field: string): boolean {
    const control = this.loginForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
        this.router.navigateByUrl(returnUrl);
      },
      error: (error) => {
        this.errorMessage.set(error.message || 'Erreur de connexion');
        this.isLoading.set(false);
      }
    });
  }
}
