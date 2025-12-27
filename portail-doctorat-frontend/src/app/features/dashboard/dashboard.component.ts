import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MainLayoutComponent } from '@shared/components/main-layout/main-layout.component';
import { AuthService } from '@core/services/auth.service';
import { InscriptionService } from '@core/services/inscription.service';
import { Role } from '@core/models/user.model';
import { AdminDashboardComponent } from '../admin/dashboard/admin-dashboard.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MainLayoutComponent, AdminDashboardComponent],
  template: `
    @if (isAdmin()) {
      <app-admin-dashboard></app-admin-dashboard>
    } @else {
      <app-main-layout>
        <div class="dashboard-container">

          <!-- HERO -->
          <div class="welcome-hero">
            <div class="hero-content">
              <div class="avatar-box">
                <span class="avatar-initials">{{ getInitials() }}</span>
              </div>
              <div class="welcome-text">
                <p class="greeting">Bienvenue,</p>
                <h1 class="user-name">{{ authService.currentUser()?.prenom }} {{ authService.currentUser()?.nom }}</h1>
                <div class="user-tags">
                  <span class="tag role"><i class="bi bi-mortarboard"></i>{{ getRoleLabel() }}</span>
                  @if (isDoctorant() && getAnneeTheseNumber()) {
                    <span class="tag year"><i class="bi bi-calendar3"></i>{{ getAnneeTheseNumber() }}{{ getAnneeTheseSuffix() }} année</span>
                  }
                  <span class="tag status"><i class="bi bi-check-circle"></i>Compte actif</span>
                </div>
              </div>
            </div>
            <div class="hero-date"><i class="bi bi-calendar3"></i>{{ today | date:'EEEE d MMMM yyyy' }}</div>
          </div>

          @if (isDoctorant()) {
            <!-- SUJET DE THÈSE -->
            <div class="thesis-card">
              <div class="thesis-header">
                <div class="thesis-icon"><i class="bi bi-journal-text"></i></div>
                <h3>Mon Sujet de Thèse</h3>
              </div>
              <div class="thesis-body">
                @if (authService.currentUser()?.sujetThese) {
                  <p class="thesis-text">{{ authService.currentUser()?.sujetThese }}</p>
                  <span class="thesis-meta"><i class="bi bi-person-check"></i>Assigné par votre directeur</span>
                } @else {
                  <div class="no-thesis">
                    <i class="bi bi-journal-x"></i>
                    <p>Aucun sujet de thèse assigné</p>
                    <span>Votre directeur vous assignera un sujet lors de la validation.</span>
                  </div>
                }
              </div>
            </div>

            <!-- ALERTE DURÉE -->
            @if (getAnneeTheseNumber() >= 3) {
              <div class="alert-banner" [ngClass]="getAlertClass()">
                <div class="alert-icon"><i class="bi" [ngClass]="getAlertIcon()"></i></div>
                <div class="alert-content">
                  <strong>{{ getAlertTitle() }}</strong>
                  <p>{{ getAlertMessage() }}</p>
                </div>
                @if (getAnneeTheseNumber() >= 4) {
                  <a routerLink="/derogations" class="alert-action">Demander une dérogation</a>
                }
              </div>
            }

            <!-- STATS -->
            <div class="stats-grid">
              <div class="stat-card" [ngClass]="getYearCardClass()">
                <div class="stat-icon"><i class="bi bi-calendar-check"></i></div>
                <div class="stat-info">
                  <span class="stat-label">Année de thèse</span>
                  <span class="stat-value">{{ getAnneeTheseNumber() }}<sup>{{ getAnneeTheseSuffix() }}</sup></span>
                </div>
                <div class="stat-progress"><div class="progress-fill" [style.width.%]="(getAnneeTheseNumber() / 6) * 100"></div></div>
              </div>
              <div class="stat-card publications">
                <div class="stat-icon"><i class="bi bi-journal-richtext"></i></div>
                <div class="stat-info">
                  <span class="stat-label">Publications Q1/Q2</span>
                  <span class="stat-value">{{ getPublications() }}<span class="stat-total">/2</span></span>
                </div>
                <div class="stat-progress"><div class="progress-fill" [style.width.%]="(getPublications() / 2) * 100"></div></div>
              </div>
              <div class="stat-card conferences">
                <div class="stat-icon"><i class="bi bi-mic"></i></div>
                <div class="stat-info">
                  <span class="stat-label">Conférences</span>
                  <span class="stat-value">{{ getConferences() }}<span class="stat-total">/2</span></span>
                </div>
                <div class="stat-progress"><div class="progress-fill" [style.width.%]="(getConferences() / 2) * 100"></div></div>
              </div>
              <div class="stat-card formation">
                <div class="stat-icon"><i class="bi bi-book"></i></div>
                <div class="stat-info">
                  <span class="stat-label">Heures Formation</span>
                  <span class="stat-value">{{ getHeuresFormation() }}<span class="stat-total">/200h</span></span>
                </div>
                <div class="stat-progress"><div class="progress-fill" [style.width.%]="(getHeuresFormation() / 200) * 100"></div></div>
              </div>
            </div>

            <!-- ACTIONS -->
            <h4 class="section-title"><i class="bi bi-lightning-charge me-2"></i>Actions Rapides</h4>
            <div class="actions-grid">
              <a routerLink="/inscriptions" class="action-card blue">
                <div class="action-icon"><i class="bi bi-folder2-open"></i></div>
                <div class="action-content"><h5>Mes Dossiers</h5><p>Inscriptions annuelles</p></div>
                <i class="bi bi-arrow-right"></i>
              </a>
              <a routerLink="/soutenances" class="action-card purple" [class.disabled]="!canSoutenir()">
                <div class="action-icon"><i class="bi bi-award"></i></div>
                <div class="action-content"><h5>Ma Soutenance</h5><p>{{ canSoutenir() ? 'Déposer ma demande' : 'Prérequis non atteints' }}</p></div>
                <i class="bi bi-arrow-right"></i>
              </a>
              <a routerLink="/derogations" class="action-card orange">
                <div class="action-icon"><i class="bi bi-clock-history"></i></div>
                <div class="action-content"><h5>Dérogations</h5><p>Demander une prolongation</p></div>
                <i class="bi bi-arrow-right"></i>
              </a>
              <a routerLink="/profil" class="action-card gray">
                <div class="action-icon"><i class="bi bi-person-gear"></i></div>
                <div class="action-content"><h5>Mon Profil</h5><p>Voir mes informations</p></div>
                <i class="bi bi-arrow-right"></i>
              </a>
            </div>

            <!-- PROFIL SANS BOUTON MODIFIER -->
            <div class="profile-card">
              <div class="profile-header">
                <div class="profile-icon"><i class="bi bi-person-badge"></i></div>
                <h4>Mon Profil Doctorant</h4>
              </div>
              <div class="profile-body">
                <div class="profile-grid">
                  <div class="profile-item"><span class="item-label">Nom complet</span><span class="item-value">{{ authService.currentUser()?.nom }} {{ authService.currentUser()?.prenom }}</span></div>
                  <div class="profile-item"><span class="item-label">Matricule</span><span class="item-value mono">{{ authService.currentUser()?.username }}</span></div>
                  <div class="profile-item"><span class="item-label">Email</span><span class="item-value">{{ authService.currentUser()?.email }}</span></div>
                  <div class="profile-item"><span class="item-label">Téléphone</span><span class="item-value">{{ authService.currentUser()?.telephone || 'Non renseigné' }}</span></div>
                  <div class="profile-item"><span class="item-label">Statut</span><span class="item-value"><span class="status-tag success"><i class="bi bi-patch-check-fill"></i>DOCTORANT VALIDÉ</span></span></div>
                  <div class="profile-item"><span class="item-label">Dossiers soumis</span><span class="item-value">{{ stats().inscriptions }} inscription(s)</span></div>
                </div>
              </div>
            </div>
          }

          @if (isDirecteur()) {
            <div class="stats-grid">
              <div class="stat-card warning">
                <div class="stat-icon"><i class="bi bi-hourglass-split"></i></div>
                <div class="stat-info"><span class="stat-label">Dossiers à valider</span><span class="stat-value">{{ stats().aValider }}</span></div>
              </div>
            </div>
            <h4 class="section-title"><i class="bi bi-lightning-charge me-2"></i>Actions Rapides</h4>
            <div class="actions-grid">
              <a routerLink="/validations" class="action-card green">
                <div class="action-icon"><i class="bi bi-check2-circle"></i></div>
                <div class="action-content"><h5>Valider Inscriptions</h5><p>Examiner les dossiers</p></div>
                <i class="bi bi-arrow-right"></i>
              </a>
              <a routerLink="/director/soutenances" class="action-card purple">
                <div class="action-icon"><i class="bi bi-mortarboard"></i></div>
                <div class="action-content"><h5>Soutenances</h5><p>Gérer les demandes</p></div>
                <i class="bi bi-arrow-right"></i>
              </a>
            </div>
          }
        </div>
      </app-main-layout>
    }
  `,
  styles: [`
    .dashboard-container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem 3rem; }
    .welcome-hero { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); border-radius: 24px; padding: 2rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; position: relative; overflow: hidden; }
    .hero-content { display: flex; align-items: center; gap: 1.5rem; z-index: 2; }
    .avatar-box { width: 80px; height: 80px; background: rgba(255,255,255,0.2); backdrop-filter: blur(10px); border-radius: 20px; display: flex; align-items: center; justify-content: center; border: 3px solid rgba(255,255,255,0.3); }
    .avatar-initials { font-size: 1.75rem; font-weight: 700; color: white; }
    .welcome-text { color: white; }
    .greeting { margin: 0; font-size: 0.95rem; opacity: 0.9; }
    .user-name { margin: 0.25rem 0 0.75rem; font-size: 1.75rem; font-weight: 800; color: white; }
    .user-tags { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .tag { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.4rem 0.75rem; background: rgba(255,255,255,0.15); border-radius: 50px; font-size: 0.8rem; font-weight: 500; color: white; }
    .tag.status { background: rgba(34,197,94,0.3); }
    .hero-date { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; background: rgba(255,255,255,0.15); border-radius: 12px; color: white; font-weight: 500; z-index: 2; }
    .thesis-card { background: white; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; overflow: hidden; margin-bottom: 1.5rem; }
    .thesis-header { display: flex; align-items: center; gap: 0.75rem; padding: 1.25rem 1.5rem; background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-bottom: 1px solid #e2e8f0; }
    .thesis-icon { width: 44px; height: 44px; background: linear-gradient(135deg, #8b5cf6, #6d28d9); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.25rem; }
    .thesis-header h3 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #1e293b; }
    .thesis-body { padding: 1.5rem; }
    .thesis-text { font-size: 1.1rem; font-weight: 600; color: #1e293b; line-height: 1.5; margin: 0 0 1rem; padding: 1rem; background: linear-gradient(135deg, #f0f4ff, #ede9fe); border-radius: 12px; border-left: 4px solid #8b5cf6; }
    .thesis-meta { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #64748b; }
    .thesis-meta i { color: #22c55e; }
    .no-thesis { text-align: center; padding: 2rem; color: #64748b; }
    .no-thesis i { font-size: 2.5rem; color: #cbd5e1; margin-bottom: 0.75rem; }
    .no-thesis p { margin: 0; font-weight: 600; color: #475569; }
    .no-thesis span { font-size: 0.85rem; }
    .alert-banner { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.5rem; border-radius: 16px; margin-bottom: 1.5rem; }
    .alert-banner.warning { background: #fef3c7; border: 1px solid #fcd34d; }
    .alert-banner.danger { background: #fee2e2; border: 1px solid #fca5a5; }
    .alert-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; background: rgba(0,0,0,0.1); }
    .alert-content { flex: 1; }
    .alert-content strong { display: block; margin-bottom: 0.25rem; }
    .alert-content p { margin: 0; font-size: 0.875rem; opacity: 0.8; }
    .alert-action { padding: 0.5rem 1rem; background: white; border-radius: 8px; font-weight: 600; font-size: 0.85rem; text-decoration: none; color: inherit; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: white; border-radius: 16px; padding: 1.25rem; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
    .stat-card .stat-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; margin-bottom: 1rem; }
    .stat-card .stat-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
    .stat-card .stat-value { font-size: 2rem; font-weight: 800; line-height: 1; }
    .stat-card .stat-value sup { font-size: 0.8rem; font-weight: 600; }
    .stat-card .stat-total { font-size: 0.9rem; color: #94a3b8; font-weight: 500; }
    .stat-card .stat-progress { height: 4px; background: #e2e8f0; border-radius: 2px; margin-top: 1rem; overflow: hidden; }
    .stat-card .progress-fill { height: 100%; border-radius: 2px; transition: width 0.5s; }
    .stat-card.year-green .stat-icon { background: #dcfce7; color: #16a34a; } .stat-card.year-green .stat-value { color: #16a34a; } .stat-card.year-green .progress-fill { background: #16a34a; }
    .stat-card.year-yellow .stat-icon { background: #fef3c7; color: #d97706; } .stat-card.year-yellow .stat-value { color: #d97706; } .stat-card.year-yellow .progress-fill { background: #d97706; }
    .stat-card.year-orange .stat-icon { background: #ffedd5; color: #ea580c; } .stat-card.year-orange .stat-value { color: #ea580c; } .stat-card.year-orange .progress-fill { background: #ea580c; }
    .stat-card.year-red .stat-icon { background: #fee2e2; color: #dc2626; } .stat-card.year-red .stat-value { color: #dc2626; } .stat-card.year-red .progress-fill { background: #dc2626; }
    .stat-card.publications .stat-icon { background: #dbeafe; color: #2563eb; } .stat-card.publications .stat-value { color: #2563eb; } .stat-card.publications .progress-fill { background: #2563eb; }
    .stat-card.conferences .stat-icon { background: #f3e8ff; color: #9333ea; } .stat-card.conferences .stat-value { color: #9333ea; } .stat-card.conferences .progress-fill { background: #9333ea; }
    .stat-card.formation .stat-icon { background: #fce7f3; color: #db2777; } .stat-card.formation .stat-value { color: #db2777; } .stat-card.formation .progress-fill { background: #db2777; }
    .stat-card.warning .stat-icon { background: #fef3c7; color: #d97706; } .stat-card.warning .stat-value { color: #d97706; }
    .section-title { font-weight: 700; color: #1e293b; display: flex; align-items: center; margin-bottom: 1rem; }
    .section-title i { color: #6366f1; }
    .actions-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .action-card { display: flex; align-items: center; gap: 1rem; padding: 1.25rem; background: white; border-radius: 16px; text-decoration: none; color: inherit; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; transition: all 0.3s; }
    .action-card:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0,0,0,0.12); }
    .action-card.disabled { opacity: 0.6; pointer-events: none; }
    .action-icon { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; flex-shrink: 0; }
    .action-content { flex: 1; }
    .action-content h5 { margin: 0 0 0.25rem; font-weight: 700; font-size: 1rem; color: #1e293b; }
    .action-content p { margin: 0; font-size: 0.8rem; color: #64748b; }
    .action-card > .bi-arrow-right { color: #cbd5e1; font-size: 1.25rem; }
    .action-card:hover > .bi-arrow-right { color: #6366f1; transform: translateX(4px); }
    .action-card.blue .action-icon { background: #dbeafe; color: #2563eb; }
    .action-card.purple .action-icon { background: #f3e8ff; color: #9333ea; }
    .action-card.orange .action-icon { background: #ffedd5; color: #ea580c; }
    .action-card.green .action-icon { background: #dcfce7; color: #16a34a; }
    .action-card.gray .action-icon { background: #f1f5f9; color: #64748b; }
    .profile-card { background: white; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; overflow: hidden; }
    .profile-header { display: flex; align-items: center; gap: 0.75rem; padding: 1.25rem 1.5rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
    .profile-icon { width: 40px; height: 40px; background: #dbeafe; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #2563eb; font-size: 1.1rem; }
    .profile-header h4 { margin: 0; font-weight: 700; color: #1e293b; }
    .profile-body { padding: 1.5rem; }
    .profile-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .profile-item { padding: 0.75rem; background: #f8fafc; border-radius: 10px; }
    .item-label { display: block; font-size: 0.7rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem; }
    .item-value { font-size: 0.95rem; font-weight: 600; color: #1e293b; }
    .item-value.mono { font-family: monospace; }
    .status-tag { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
    .status-tag.success { background: #dcfce7; color: #15803d; }
    @media (max-width: 992px) { .stats-grid, .actions-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 768px) { .welcome-hero { flex-direction: column; text-align: center; gap: 1.5rem; } .hero-content { flex-direction: column; } .stats-grid, .actions-grid { grid-template-columns: 1fr; } .profile-grid { grid-template-columns: 1fr; } }
  `]
})
export class DashboardComponent implements OnInit {
  stats = signal({ inscriptions: 0, aValider: 0 });
  today = new Date();

  constructor(public authService: AuthService, private inscriptionService: InscriptionService, private router: Router) {}

  ngOnInit(): void { this.loadData(); }

  isDoctorant(): boolean { return this.authService.currentUser()?.role === Role.DOCTORANT; }
  isDirecteur(): boolean { return this.authService.currentUser()?.role === Role.DIRECTEUR_THESE; }
  isAdmin(): boolean { return this.authService.currentUser()?.role === Role.ADMIN; }

  getInitials(): string {
    const user = this.authService.currentUser();
    return user ? (user.prenom?.charAt(0) || '') + (user.nom?.charAt(0) || '') : '?';
  }

  getRoleLabel(): string {
    const role = this.authService.currentUser()?.role;
    if (role === Role.DOCTORANT) return 'Doctorant';
    if (role === Role.DIRECTEUR_THESE) return 'Directeur de Thèse';
    return 'Utilisateur';
  }

  getAnneeTheseNumber(): number { return this.authService.currentUser()?.anneeThese || 1; }
  getAnneeTheseSuffix(): string { return this.getAnneeTheseNumber() === 1 ? 'ère' : 'ème'; }
  getPublications(): number { return this.authService.currentUser()?.nbPublications || 0; }
  getConferences(): number { return this.authService.currentUser()?.nbConferences || 0; }
  getHeuresFormation(): number { return this.authService.currentUser()?.heuresFormation || 0; }
  canSoutenir(): boolean { return this.getPublications() >= 2 && this.getConferences() >= 2 && this.getHeuresFormation() >= 200; }

  getYearCardClass(): string {
    const a = this.getAnneeTheseNumber();
    if (a <= 2) return 'year-green';
    if (a === 3) return 'year-yellow';
    if (a <= 5) return 'year-orange';
    return 'year-red';
  }

  getAlertClass(): string { return this.getAnneeTheseNumber() >= 4 ? 'danger' : 'warning'; }
  getAlertIcon(): string { return this.getAnneeTheseNumber() >= 5 ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill'; }
  getAlertTitle(): string {
    const a = this.getAnneeTheseNumber();
    if (a === 3) return 'Attention : 3ème année de thèse';
    if (a === 4) return 'Dérogation requise : 4ème année';
    if (a === 5) return '⚠️ 5ème année de thèse';
    if (a === 6) return '🚨 Dernière année possible !';
    return '';
  }
  getAlertMessage(): string {
    const a = this.getAnneeTheseNumber();
    if (a === 3) return 'La durée normale est de 3 ans. Pensez à planifier votre soutenance.';
    if (a === 4) return 'Une dérogation est requise pour continuer au-delà de 3 ans.';
    if (a === 5) return 'Il vous reste 2 ans maximum. Planifiez votre soutenance.';
    if (a === 6) return 'Dernière année. Vous devez soutenir cette année.';
    return '';
  }

  private loadData(): void {
    const user = this.authService.currentUser();
    if (!user) return;
    if (this.isDoctorant()) {
      this.inscriptionService.getByDoctorant(user.id).subscribe({
        next: (data) => this.stats.update(s => ({ ...s, inscriptions: data.length })),
        error: (err) => console.error('Erreur:', err)
      });
    } else if (this.isDirecteur()) {
      this.inscriptionService.getInscriptionsByDirecteur(user.id).subscribe({
        next: (data) => this.stats.update(s => ({ ...s, aValider: data.filter((i: any) => i.statut === 'SOUMIS').length })),
        error: (err) => console.error('Erreur:', err)
      });
    }
  }
}