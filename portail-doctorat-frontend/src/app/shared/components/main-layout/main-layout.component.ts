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

            <!-- TABLEAU DE BORD (Commun) -->
            <li>
              <a routerLink="/dashboard" routerLinkActive="active">
                <i class="bi bi-grid-1x2"></i>
                <span>Tableau de bord</span>
              </a>
            </li>

            <!-- ======================================================= -->
            <!-- SECTION DIRECTEUR DE THESE (Conforme CDC)               -->
            <!-- ======================================================= -->
            @if (isDirecteur()) {
              <li class="nav-section">Gestion Académique</li>

              <!-- ✅ Mes Doctorants EN PREMIER -->
              <li>
                <a routerLink="/director/my-students" routerLinkActive="active">
                  <i class="bi bi-people-fill"></i>
                  <span>Mes Doctorants</span>
                </a>
              </li>

              <li>
                <a routerLink="/validations" routerLinkActive="active">
                  <i class="bi bi-file-earmark-check"></i>
                  <span>Validations en attente</span>
                </a>
              </li>
              <li>
                <a routerLink="/director/reinscriptions" routerLinkActive="active">
                  <i class="bi bi-journal-check"></i>
                  <span>Réinscriptions</span>
                </a>
              </li>
              <li>
                <a routerLink="/director/derogations" routerLinkActive="active">
                  <i class="bi bi-clock-history"></i>
                  <span>Dérogations</span>
                </a>
              </li>
              <li>
                <a routerLink="/director/soutenances" routerLinkActive="active">
                  <i class="bi bi-award"></i>
                  <span>Demandes Soutenance</span>
                </a>
              </li>
            }

            <!-- ======================================================= -->
            <!-- SECTION DOCTORANT (Le candidat validé)                  -->
            <!-- ======================================================= -->
            @if (isDoctorant()) {
              <li class="nav-section">Mon Parcours</li>
              <li>
                <a routerLink="/inscriptions" routerLinkActive="active">
                  <i class="bi bi-file-earmark-text"></i>
                  <span>Dossier Inscription</span>
                </a>
              </li>
              <li>
                <a routerLink="/derogations" routerLinkActive="active">
                  <i class="bi bi-clock-history"></i>
                  <span>Dérogations</span>
                </a>
              </li>
              <li>
                <a routerLink="/soutenances" routerLinkActive="active">
                  <i class="bi bi-mortarboard"></i>
                  <span>Ma Soutenance</span>
                </a>
              </li>
            }

            <!-- ======================================================= -->
            <!-- SECTION ADMIN                                           -->
            <!-- ======================================================= -->
            @if (isAdmin()) {
              <li class="nav-section">Administration</li>
              <li>
                <a routerLink="/admin/users" routerLinkActive="active">
                  <i class="bi bi-people-fill"></i>
                  <span>Utilisateurs</span>
                </a>
              </li>
              <li>
                <a routerLink="/admin/campagnes" routerLinkActive="active">
                  <i class="bi bi-calendar-range"></i>
                  <span>Campagnes</span>
                </a>
              </li>
              <!-- Réinscriptions -->
              <li>
                <a routerLink="/admin/reinscriptions" routerLinkActive="active">
                  <i class="bi bi-journal-check"></i>
                  <span>Réinscriptions</span>
                </a>
              </li>
              <li>
                <a routerLink="/admin/derogations" routerLinkActive="active">
                  <i class="bi bi-exclamation-circle"></i>
                  <span>Dérogations</span>
                </a>
              </li>
              <li>
                <a routerLink="/admin/soutenances" routerLinkActive="active">
                  <i class="bi bi-award-fill"></i>
                  <span>Soutenances</span>
                </a>
              </li>
            }
          </ul>
        </nav>

        <!-- FOOTER USER -->
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

          <button class="btn-logout-full" (click)="logout()">
            <i class="bi bi-box-arrow-left"></i> Déconnexion
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
    .layout { display: flex; min-height: 100vh; }
    .sidebar { width: 260px; background: #1e293b; color: white; display: flex; flex-direction: column; position: fixed; height: 100vh; z-index: 100; box-shadow: 4px 0 24px rgba(0,0,0,0.1); }
    .sidebar-header { padding: 1.5rem; display: flex; align-items: center; gap: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .logo { width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(118, 75, 162, 0.3); }
    .logo i { font-size: 1.25rem; color: white; }
    .logo-text { font-weight: 600; font-size: 1.125rem; letter-spacing: -0.025em; }
    .sidebar-nav { flex: 1; overflow-y: auto; padding: 1rem 0; }
    .sidebar-nav::-webkit-scrollbar { width: 4px; }
    .sidebar-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
    .nav-list { list-style: none; padding: 0; margin: 0; }
    .nav-section { padding: 1rem 1.5rem 0.5rem; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px; }
    .nav-list a { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1.5rem; color: #94a3b8; text-decoration: none; transition: all 0.2s ease; position: relative; }
    .nav-list a:hover { background: rgba(255,255,255,0.05); color: white; }
    .nav-list a:hover i { transform: translateX(2px); }
    .nav-list a i { font-size: 1.125rem; transition: transform 0.2s; }
    .nav-list a.active { background: rgba(99, 102, 241, 0.15); color: #818cf8; font-weight: 500; }
    .nav-list a.active::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: #818cf8; border-top-right-radius: 4px; border-bottom-right-radius: 4px; }
    .sidebar-footer { padding: 1.5rem; border-top: 1px solid rgba(255,255,255,0.1); display: flex; flex-direction: column; gap: 1rem; background: rgba(0,0,0,0.15); }
    .user-info { width: 100%; display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border-radius: 10px; color: white; text-decoration: none; background: rgba(255,255,255,0.05); transition: background 0.2s; }
    .user-info:hover { background: rgba(255,255,255,0.1); }
    .user-avatar { width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; font-weight: 600; color: white; border: 2px solid rgba(255,255,255,0.2); flex-shrink: 0; }
    .user-details { display: flex; flex-direction: column; overflow: hidden; }
    .user-name { font-size: 0.9rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .user-role { font-size: 0.75rem; color: #cbd5e1; }
    .btn-logout-full { width: 100%; background: transparent; border: 1px solid #ef4444; color: #ef4444; padding: 0.6rem; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.2s ease; }
    .btn-logout-full:hover { background: #ef4444; color: white; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3); }
    .main-content { flex: 1; margin-left: 260px; padding: 2rem; background: #f8fafc; min-height: 100vh; width: calc(100% - 260px); }
  `]
})
export class MainLayoutComponent {
  constructor(public authService: AuthService) {}

  isDoctorant(): boolean { return this.authService.currentUser()?.role === Role.DOCTORANT; }
  isDirecteur(): boolean { return this.authService.currentUser()?.role === Role.DIRECTEUR_THESE; }
  isAdmin(): boolean { return this.authService.currentUser()?.role === Role.ADMIN; }

  getInitials(): string {
    const user = this.authService.currentUser();
    if (!user) return '?';
    return (user.prenom?.charAt(0) || '') + (user.nom?.charAt(0) || '');
  }

  getRoleLabel(): string {
    const role = this.authService.currentUser()?.role;
    const labels: Record<string, string> = {
      'CANDIDAT': 'Candidat',
      'DOCTORANT': 'Doctorant',
      'DIRECTEUR_THESE': 'Directeur de Thèse',
      'ADMIN': 'Administrateur'
    };
    return role ? labels[role] || role : 'Invité';
  }

  logout(): void {
    this.authService.logout();
  }
}