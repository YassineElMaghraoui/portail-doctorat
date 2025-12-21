import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainLayoutComponent } from '../../shared/components/main-layout/main-layout.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule, MainLayoutComponent],
  template: `
    <app-main-layout>
      <div class="page">
        <header class="page-header">
          <h1>Mon profil</h1>
          <p class="text-muted">Consultez et modifiez vos informations personnelles</p>
        </header>

        <div class="card">
          <div class="card-body">
            <div class="profile-header">
              <div class="avatar">
                {{ getInitials() }}
              </div>
              <div class="profile-info">
                <h2>{{ authService.currentUser()?.prenom }} {{ authService.currentUser()?.nom }}</h2>
                <span class="badge">{{ getRoleLabel() }}</span>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-item">
                <label>Nom d'utilisateur</label>
                <span>{{ authService.currentUser()?.username }}</span>
              </div>
              <div class="info-item">
                <label>Email</label>
                <span>{{ authService.currentUser()?.email }}</span>
              </div>
              <div class="info-item">
                <label>Nom</label>
                <span>{{ authService.currentUser()?.nom }}</span>
              </div>
              <div class="info-item">
                <label>Prénom</label>
                <span>{{ authService.currentUser()?.prenom }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </app-main-layout>
  `,
  styles: [`
    .page {
      max-width: 800px;
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

    .card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      border: 1px solid #e2e8f0;
    }

    .card-body {
      padding: 2rem;
    }

    .profile-header {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .avatar {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 600;
      color: white;
    }

    .profile-info h2 {
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .info-item label {
      display: block;
      font-size: 0.8125rem;
      color: #64748b;
      margin-bottom: 0.25rem;
    }

    .info-item span {
      font-weight: 500;
      color: #1e293b;
    }
  `]
})
export class ProfilComponent {
  constructor(public authService: AuthService) {}

  getInitials(): string {
    const user = this.authService.currentUser();
    if (!user) return '?';
    return (user.prenom?.charAt(0) || '') + (user.nom?.charAt(0) || '');
  }

  getRoleLabel(): string {
    const role = this.authService.currentUser()?.role;
    const labels: Record<string, string> = {
      'DOCTORANT': 'Doctorant',
      'DIRECTEUR_THESE': 'Directeur de thèse',
      'CHEF_FILIERE': 'Chef de filière',
      'RESPONSABLE_CEDOC': 'Responsable CEDoc',
      'ADMIN': 'Administrateur'
    };
    return role ? labels[role] || role : '';
  }
}
