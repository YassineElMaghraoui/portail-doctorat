import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MainLayoutComponent } from '@shared/components/main-layout/main-layout.component';
import { UserService } from '@core/services/user.service';
import { InscriptionService } from '@core/services/inscription.service';
import { SoutenanceService } from '@core/services/soutenance.service'; // ✅ Import ajouté

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, MainLayoutComponent, RouterLink],
    template: `
        <app-main-layout>
            <div class="dashboard-container">

                <!-- HERO SECTION -->
                <div class="welcome-hero">
                    <div class="hero-content">
                        <div class="avatar-box">
                            <span class="avatar-initials"><i class="bi bi-shield-lock-fill"></i></span>
                        </div>
                        <div class="welcome-text">
                            <p class="greeting">Espace Administration</p>
                            <h1 class="user-name">Vue d'ensemble</h1>
                            <div class="user-tags">
                                <span class="tag role"><i class="bi bi-gear-wide-connected"></i>Administrateur</span>
                                <span class="tag year"><i class="bi bi-calendar-range"></i>2025-2026</span>
                                <span class="tag status"><i class="bi bi-check-circle"></i>Système opérationnel</span>
                            </div>
                        </div>
                    </div>
                    <div class="hero-date">
                        <i class="bi bi-calendar3"></i>{{ today | date:'EEEE d MMMM yyyy' }}
                    </div>
                </div>

                <!-- STATS GRID -->
                <div class="stats-grid">
                    <!-- Candidats -->
                    <div class="stat-card warning">
                        <div class="stat-icon"><i class="bi bi-person-lines-fill"></i></div>
                        <div class="stat-info">
                            <span class="stat-label">Candidatures</span>
                            <span class="stat-value">{{ stats().candidats }}</span>
                        </div>
                    </div>

                    <!-- Doctorants -->
                    <div class="stat-card green">
                        <div class="stat-icon"><i class="bi bi-mortarboard-fill"></i></div>
                        <div class="stat-info">
                            <span class="stat-label">Doctorants Inscrits</span>
                            <span class="stat-value">{{ stats().doctorants }}</span>
                        </div>
                    </div>

                    <!-- Directeurs -->
                    <div class="stat-card blue">
                        <div class="stat-icon"><i class="bi bi-person-video3"></i></div>
                        <div class="stat-info">
                            <span class="stat-label">Directeurs de Thèse</span>
                            <span class="stat-value">{{ stats().directeurs }}</span>
                        </div>
                    </div>

                    <!-- Dossiers (Réinscriptions) -->
                    <div class="stat-card purple">
                        <div class="stat-icon"><i class="bi bi-files"></i></div>
                        <div class="stat-info">
                            <span class="stat-label">Réinscriptions à Valider</span>
                            <span class="stat-value">{{ stats().inscriptions }}</span>
                        </div>
                    </div>
                </div>

                <!-- ALERTES -->
                <div class="alerts-container">
                    @if (stats().inscriptions > 0) {
                        <div class="alert-banner info">
                            <div class="alert-icon"><i class="bi bi-journal-check"></i></div>
                            <div class="alert-content">
                                <strong>{{ stats().inscriptions }} demande(s) de réinscription en attente</strong>
                                <p>Des dossiers validés par les directeurs nécessitent votre approbation.</p>
                            </div>
                            <a routerLink="/admin/reinscriptions" class="alert-action">Traiter</a>
                        </div>
                    }

                    @if (stats().soutenances > 0) {
                        <div class="alert-banner warning-light">
                            <div class="alert-icon"><i class="bi bi-mortarboard"></i></div>
                            <div class="alert-content">
                                <strong>{{ stats().soutenances }} soutenance(s) nécessitent votre action</strong>
                                <p>Autorisation de soutenance ou validation de jury requise.</p>
                            </div>
                            <a routerLink="/admin/soutenances" class="alert-action">Traiter</a>
                        </div>
                    }
                </div>

                <!-- ACTIONS RAPIDES -->
                <h4 class="section-title"><i class="bi bi-lightning-charge me-2"></i>Gestion Rapide</h4>
                <div class="actions-grid">
                    <!-- 1. Utilisateurs -->
                    <a routerLink="/admin/users" class="action-card blue">
                        <div class="action-icon"><i class="bi bi-people-fill"></i></div>
                        <div class="action-content">
                            <h5>Utilisateurs</h5>
                            <p>Gérer les comptes</p>
                        </div>
                        <i class="bi bi-arrow-right"></i>
                    </a>

                    <!-- 2. Réinscriptions (Renommé) -->
                    <a routerLink="/admin/reinscriptions" class="action-card purple">
                        <div class="action-icon"><i class="bi bi-journal-check"></i></div>
                        <div class="action-content">
                            <h5>Réinscriptions</h5>
                            <p>{{ stats().inscriptions }} à valider</p>
                        </div>
                        @if (stats().inscriptions > 0) { <span class="action-badge">{{ stats().inscriptions }}</span> }
                        <i class="bi bi-arrow-right"></i>
                    </a>

                    <!-- 3. Soutenances (Ajouté) -->
                    <a routerLink="/admin/soutenances" class="action-card pink">
                        <div class="action-icon"><i class="bi bi-mortarboard"></i></div>
                        <div class="action-content">
                            <h5>Soutenances</h5>
                            <p>Suivi & Planification</p>
                        </div>
                        @if (stats().soutenances > 0) { <span class="action-badge">{{ stats().soutenances }}</span> }
                        <i class="bi bi-arrow-right"></i>
                    </a>

                    <!-- 4. Campagnes -->
                    <a routerLink="/admin/campagnes" class="action-card green">
                        <div class="action-icon"><i class="bi bi-calendar-range"></i></div>
                        <div class="action-content">
                            <h5>Campagnes</h5>
                            <p>Ouvrir/Fermer</p>
                        </div>
                        <i class="bi bi-arrow-right"></i>
                    </a>

                    <!-- 5. Dérogations -->
                    <a routerLink="/admin/derogations" class="action-card orange">
                        <div class="action-icon"><i class="bi bi-exclamation-triangle"></i></div>
                        <div class="action-content">
                            <h5>Dérogations</h5>
                            <p>Gestion des années</p>
                        </div>
                        <i class="bi bi-arrow-right"></i>
                    </a>
                </div>

            </div>
        </app-main-layout>
    `,
    styles: [`
      .dashboard-container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem 3rem; }

      /* Hero Section */
      .welcome-hero { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); border-radius: 24px; padding: 2rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; }
      .hero-content { display: flex; align-items: center; gap: 1.5rem; }
      .avatar-box { width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 20px; display: flex; align-items: center; justify-content: center; border: 3px solid rgba(255,255,255,0.3); }
      .avatar-initials { font-size: 2rem; color: white; }
      .welcome-text { color: white; }
      .greeting { margin: 0; font-size: 0.95rem; opacity: 0.9; }
      .user-name { margin: 0.25rem 0 0.75rem; font-size: 1.75rem; font-weight: 800; color: white; }
      .user-tags { display: flex; gap: 0.5rem; flex-wrap: wrap; }
      .tag { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.4rem 0.75rem; background: rgba(255,255,255,0.15); border-radius: 50px; font-size: 0.8rem; font-weight: 500; color: white; }
      .tag.status { background: rgba(34,197,94,0.3); }
      .hero-date { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; background: rgba(255,255,255,0.15); border-radius: 12px; color: white; font-weight: 500; }

      /* Stats Grid */
      .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
      .stat-card { background: white; border-radius: 16px; padding: 1.5rem 1.25rem; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; display: flex; flex-direction: column; justify-content: center; }
      .stat-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; margin-bottom: 1rem; }
      .stat-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; display: block; margin-bottom: 0.25rem; }
      .stat-value { font-size: 2rem; font-weight: 800; line-height: 1; color: #1e293b; }

      /* Colors for Stats */
      .stat-card.warning .stat-icon { background: #fff7ed; color: #ea580c; }
      .stat-card.green .stat-icon { background: #f0fdf4; color: #16a34a; }
      .stat-card.blue .stat-icon { background: #eff6ff; color: #2563eb; }
      .stat-card.purple .stat-icon { background: #f3e8ff; color: #9333ea; }

      /* Alerts */
      .alerts-container { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
      .alert-banner { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.5rem; border-radius: 16px; }
      .alert-banner.info { background: #f3e8ff; border: 1px solid #c4b5fd; }
      .alert-banner.warning-light { background: #fff7ed; border: 1px solid #fdba74; }
      .alert-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0; }
      .info .alert-icon { background: #8b5cf6; color: white; }
      .warning-light .alert-icon { background: #f97316; color: white; }
      .alert-content { flex: 1; }
      .alert-content strong { display: block; margin-bottom: 0.25rem; color: #1e293b; }
      .alert-content p { margin: 0; font-size: 0.875rem; opacity: 0.8; color: #334155; }
      .alert-action { padding: 0.5rem 1rem; background: white; border-radius: 8px; font-weight: 600; font-size: 0.85rem; text-decoration: none; color: #1e293b; white-space: nowrap; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }

      /* Actions Grid */
      .section-title { font-weight: 700; color: #1e293b; display: flex; align-items: center; margin-bottom: 1rem; }
      .section-title i { color: #6366f1; }
      /* ✅ Passage à auto-fill pour gérer 5 éléments proprement */
      .actions-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }

      .action-card { display: flex; align-items: center; gap: 1rem; padding: 1.25rem; background: white; border-radius: 16px; text-decoration: none; color: inherit; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; transition: all 0.3s; position: relative; }
      .action-card:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0,0,0,0.12); }
      .action-icon { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; flex-shrink: 0; }
      .action-content { flex: 1; }
      .action-content h5 { margin: 0 0 0.25rem; font-weight: 700; font-size: 1rem; color: #1e293b; }
      .action-content p { margin: 0; font-size: 0.8rem; color: #64748b; }
      .action-card > .bi-arrow-right { color: #cbd5e1; font-size: 1.25rem; }

      .action-badge { position: absolute; top: -8px; right: -8px; background: #ef4444; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; border: 2px solid white; }

      /* Action Colors */
      .action-card.blue .action-icon { background: #dbeafe; color: #2563eb; }
      .action-card.purple .action-icon { background: #f3e8ff; color: #9333ea; }
      .action-card.orange .action-icon { background: #ffedd5; color: #ea580c; }
      .action-card.green .action-icon { background: #dcfce7; color: #16a34a; }
      .action-card.pink .action-icon { background: #fce7f3; color: #db2777; }

      @media (max-width: 992px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
      @media (max-width: 768px) { .welcome-hero { flex-direction: column; text-align: center; gap: 1.5rem; } .hero-content { flex-direction: column; } .stats-grid { grid-template-columns: 1fr; } .actions-grid { grid-template-columns: 1fr; } }
    `]
})
export class AdminDashboardComponent implements OnInit {
    today = new Date();
    stats = signal({ candidats: 0, inscriptions: 0, directeurs: 0, doctorants: 0, soutenances: 0 });

    constructor(
        private userService: UserService,
        private inscriptionService: InscriptionService,
        private soutenanceService: SoutenanceService
    ) {}

    ngOnInit() {
        this.loadStats();
    }

    loadStats() {
        // 1. Candidats
        this.userService.getUsersByRole('CANDIDAT').subscribe(u =>
            this.stats.update(s => ({ ...s, candidats: u.length }))
        );

        // 2. Directeurs
        this.userService.getUsersByRole('DIRECTEUR_THESE').subscribe(u =>
            this.stats.update(s => ({ ...s, directeurs: u.length }))
        );

        // 3. Doctorants
        this.userService.getUsersByRole('DOCTORANT').subscribe(u =>
            this.stats.update(s => ({ ...s, doctorants: u.length }))
        );

        // 4. Dossiers de réinscription à valider (EN_ATTENTE_ADMIN)
        this.inscriptionService.getByStatut('EN_ATTENTE_ADMIN').subscribe(i =>
            this.stats.update(s => ({ ...s, inscriptions: i.length }))
        );

        // 5. Soutenances nécessitant une action Admin (PREREQUIS_VALIDES + JURY_PROPOSE)
        this.soutenanceService.getAllSoutenances().subscribe(all => {
            const actionRequired = all.filter(s =>
                s.statut === 'PREREQUIS_VALIDES' || s.statut === 'JURY_PROPOSE'
            ).length;
            this.stats.update(s => ({ ...s, soutenances: actionRequired }));
        });
    }
}