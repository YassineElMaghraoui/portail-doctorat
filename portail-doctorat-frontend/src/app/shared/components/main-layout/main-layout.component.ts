import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { Role } from '@core/models/user.model';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <div class="layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="logo">
            <i class="bi bi-mortarboard-fill"></i>
          </div>
          <span class="logo-text">Portail Doctorat</span>
        </div>

        <nav class="sidebar-nav">
          <ul class="nav-list">
            <li>
              <a routerLink="/dashboard" routerLinkActive="active">
                <i class="bi bi-grid-1x2"></i>
                <span>Tableau de bord</span>
              </a>
            </li>

            @if (isDoctorant() || isAdmin()) {
              <li>
                <a routerLink="/inscriptions" routerLinkActive="active">
                  <i class="bi bi-file-earmark-text"></i>
                  <span>Mes inscriptions</span>
                </a>
              </li>
            }

            @if (isDirecteur()) {
              <li>
                <a routerLink="/inscriptions/a-valider" routerLinkActive="active">
                  <i class="bi bi-check-circle"></i>
                  <span>Validations</span>
                </a>
              </li>
            }

            @if (isDoctorant()) {
              <li>
                <a routerLink="/soutenances" routerLinkActive="active">
                  <i class="bi bi-award"></i>
                  <span>Ma soutenance</span>
                </a>
              </li>
              <li>
                <a routerLink="/derogations" routerLinkActive="active">
                  <i class="bi bi-clock-history"></i>
                  <span>Dérogations</span>
                </a>
              </li>
            }

            @if (isAdmin()) {
              <li class="nav-section">Administration</li>
              <li>
                <a routerLink="/campagnes" routerLinkActive="active">
                  <i class="bi bi-calendar-event"></i>
                  <span>Campagnes</span>
                </a>
              </li>
              <li>
                <a routerLink="/admin/inscriptions" routerLinkActive="active">
                  <i class="bi bi-file-earmark-check"></i>
                  <span>Toutes inscriptions</span>
                </a>
              </li>
              <li>
                <a routerLink="/admin/derogations" routerLinkActive="active">
                  <i class="bi bi-hourglass-split"></i>
                  <span>Dérogations</span>
                </a>
              </li>
              <li>
                <a routerLink="/admin/users" routerLinkActive="active">
                  <i class="bi bi-people"></i>
                  <span>Utilisateurs</span>
                </a>
              </li>
            }
          </ul>
        </nav>

        <div class="sidebar-footer">
          <a routerLink="/profil" class="user-info">
            <div class="user-avatar">
              {{ getInitials() }}
            </div>
            <div class="user-details">
              <span class="user-name">{{ authService.currentUser()?.prenom }} {{ authService.currentUser()?.nom }}</span>
              <span class="user-role">{{ getRoleLabel() }}</span>
            </div>
          </a>
          <button class="btn-logout" (click)="logout()" title="Déconnexion">
            <i class="bi bi-box-arrow-right"></i>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <ng-content></ng-content>
      </main>
    </div>
  `,
  styles: [`
    .layout {
      display: flex;
      min-height: 100vh;
    }

    .sidebar {
      width: 260px;
      background: #1e293b;
      color: white;
      display: flex;
      flex-direction: column;
      position: fixed;
      height: 100vh;
      z-index: 100;
    }

    .sidebar-header {
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .logo {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .logo i {
      font-size: 1.25rem;
      color: white;
    }

    .logo-text {
      font-weight: 600;
      font-size: 1.125rem;
    }

    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      padding: 1rem 0;
    }

    .nav-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .nav-section {
      padding: 1rem 1.5rem 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
    }

    .nav-list a {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1.5rem;
      color: #94a3b8;
      text-decoration: none;
      transition: all 0.2s;
    }

    .nav-list a i {
      font-size: 1.125rem;
    }

    .nav-list a:hover {
      background: rgba(255,255,255,0.05);
      color: white;
    }

    .nav-list a.active {
      background: rgba(99, 102, 241, 0.2);
      color: white;
      border-right: 3px solid #818cf8;
    }

    .sidebar-footer {
      padding: 1rem;
      border-top: 1px solid rgba(255,255,255,0.1);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .user-info {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
      border-radius: 8px;
      color: white;
      text-decoration: none;
    }

    .user-info:hover {
      background: rgba(255,255,255,0.05);
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .user-details {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-size: 0.875rem;
      font-weight: 500;
    }

    .user-role {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .btn-logout {
      background: none;
      border: none;
      color: #94a3b8;
      padding: 0.5rem;
      cursor: pointer;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .btn-logout:hover {
      background: rgba(239, 68, 68, 0.2);
      color: #f87171;
    }

    .btn-logout i {
      font-size: 1.125rem;
    }

    .main-content {
      flex: 1;
      margin-left: 260px;
      padding: 2rem;
      background: #f8fafc;
      min-height: 100vh;
    }
  `]
})
export class MainLayoutComponent {
  constructor(public authService: AuthService) {}

  isDoctorant(): boolean {
    return this.authService.currentUser()?.role === Role.DOCTORANT;
  }

  isDirecteur(): boolean {
    return this.authService.currentUser()?.role === Role.DIRECTEUR_THESE;
  }

  isAdmin(): boolean {
    return this.authService.currentUser()?.role === Role.ADMIN;
  }

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

  logout(): void {
    this.authService.logout();
  }
}
