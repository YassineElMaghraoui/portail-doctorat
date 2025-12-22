import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MainLayoutComponent } from '@shared/components/main-layout/main-layout.component';
import { UserService } from '@core/services/user.service';
import { InscriptionService } from '@core/services/inscription.service';
import { StatutInscription } from '@core/models/inscription.model';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink, MainLayoutComponent],
    template: `
        <app-main-layout>

            <div class="dashboard-wrapper fade-in-up">

                <!-- 1. HERO HEADER (Bandeau Moderne) -->
                <div class="hero-header">
                    <div class="container-fluid px-4">
                        <div class="d-flex justify-content-between align-items-end header-content">
                            <div>
                                <span class="badge bg-white-glass mb-2">Espace Administration</span>
                                <h1 class="display-6 fw-bold text-white mb-2">Vue d'ensemble</h1>
                                <p class="text-white-50 mb-0">Pilotez l'activité du cycle doctoral en temps réel.</p>
                            </div>
                            <div class="d-none d-md-block">
                                <div class="date-capsule">
                                    <i class="bi bi-calendar-event"></i> {{ today | date:'fullDate' }}
                                </div>
                            </div>
                        </div>
                    </div>
                    <!-- Forme décorative en bas -->
                    <div class="hero-wave">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="#f8fafc" fill-opacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>
                    </div>
                </div>

                <!-- 2. CONTENU PRINCIPAL -->
                <div class="container-fluid px-4 main-content">

                    <!-- KPIS (Cartes Statistiques) -->
                    <div class="row g-4 mb-5">

                        <!-- Candidats -->
                        <div class="col-xl-3 col-md-6">
                            <div class="smooth-card hover-lift">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-center mb-3">
                                        <div class="icon-circle bg-orange-soft text-orange">
                                            <i class="bi bi-person-plus-fill"></i>
                                        </div>
                                        <span class="badge bg-light text-muted rounded-pill">En attente</span>
                                    </div>
                                    <h2 class="mb-1 fw-bold text-dark">{{ stats().candidats }}</h2>
                                    <p class="text-muted small mb-0">Nouvelles candidatures</p>
                                </div>
                                <div class="card-footer bg-transparent border-0 pt-0 pb-3">
                                    <a routerLink="/admin/users" class="link-arrow text-orange">
                                        Gérer <i class="bi bi-arrow-right"></i>
                                    </a>
                                </div>
                            </div>
                        </div>

                        <!-- Inscriptions -->
                        <div class="col-xl-3 col-md-6">
                            <div class="smooth-card hover-lift">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-center mb-3">
                                        <div class="icon-circle bg-purple-soft text-purple">
                                            <i class="bi bi-file-earmark-check-fill"></i>
                                        </div>
                                        <span class="badge bg-light text-muted rounded-pill">À valider</span>
                                    </div>
                                    <h2 class="mb-1 fw-bold text-dark">{{ stats().inscriptions }}</h2>
                                    <p class="text-muted small mb-0">Dossiers administratifs</p>
                                </div>
                                <div class="card-footer bg-transparent border-0 pt-0 pb-3">
                                    <a routerLink="/admin/inscriptions" class="link-arrow text-purple">
                                        Examiner <i class="bi bi-arrow-right"></i>
                                    </a>
                                </div>
                            </div>
                        </div>

                        <!-- Directeurs -->
                        <div class="col-xl-3 col-md-6">
                            <div class="smooth-card hover-lift">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-center mb-3">
                                        <div class="icon-circle bg-blue-soft text-blue">
                                            <i class="bi bi-person-badge-fill"></i>
                                        </div>
                                        <span class="badge bg-light text-muted rounded-pill">Actifs</span>
                                    </div>
                                    <h2 class="mb-1 fw-bold text-dark">{{ stats().directeurs }}</h2>
                                    <p class="text-muted small mb-0">Directeurs de thèse</p>
                                </div>
                                <div class="card-footer bg-transparent border-0 pt-0 pb-3">
                                    <a routerLink="/admin/users" class="link-arrow text-blue">
                                        Consulter <i class="bi bi-arrow-right"></i>
                                    </a>
                                </div>
                            </div>
                        </div>

                        <!-- Campagne -->
                        <div class="col-xl-3 col-md-6">
                            <div class="smooth-card bg-gradient-primary text-white h-100 hover-lift border-0">
                                <div class="card-body position-relative overflow-hidden">
                                    <!-- Décoration de fond -->
                                    <i class="bi bi-calendar-check position-absolute top-0 end-0 opacity-25" style="font-size: 5rem; margin-right: -10px; margin-top: -10px;"></i>

                                    <h6 class="text-white-50 text-uppercase mb-2">Campagne en cours</h6>
                                    <h2 class="mb-3 fw-bold">2025-2026</h2>
                                    <span class="badge bg-white text-primary fw-bold px-3 py-2 rounded-pill shadow-sm">
                    <i class="bi bi-circle-fill text-success me-1" style="font-size: 0.5rem;"></i> OUVERTE
                  </span>
                                </div>
                                <div class="card-footer bg-transparent border-0 pt-0 pb-3">
                                    <a routerLink="/campagnes" class="text-white text-decoration-none opacity-75 hover-opacity-100">
                                        Configurer <i class="bi bi-arrow-right ms-1"></i>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ACTIONS RAPIDES (Grandes Cartes) -->
                    <h5 class="section-title">Accès Rapide</h5>

                    <div class="row g-4">

                        <div class="col-md-4">
                            <a routerLink="/admin/users" class="action-card hover-scale">
                                <div class="action-icon text-purple bg-purple-soft">
                                    <i class="bi bi-people"></i>
                                </div>
                                <div class="action-details">
                                    <h5>Utilisateurs</h5>
                                    <p>Valider candidats & Directeurs</p>
                                </div>
                                <div class="action-arrow">
                                    <i class="bi bi-chevron-right"></i>
                                </div>
                            </a>
                        </div>

                        <div class="col-md-4">
                            <a routerLink="/admin/inscriptions" class="action-card hover-scale">
                                <div class="action-icon text-blue bg-blue-soft">
                                    <i class="bi bi-file-earmark-text"></i>
                                </div>
                                <div class="action-details">
                                    <h5>Inscriptions</h5>
                                    <p>Validation administrative</p>
                                </div>
                                <div class="action-arrow">
                                    <i class="bi bi-chevron-right"></i>
                                </div>
                            </a>
                        </div>

                        <div class="col-md-4">
                            <a routerLink="/campagnes" class="action-card hover-scale">
                                <div class="action-icon text-orange bg-orange-soft">
                                    <i class="bi bi-sliders"></i>
                                </div>
                                <div class="action-details">
                                    <h5>Configuration</h5>
                                    <p>Paramètres des campagnes</p>
                                </div>
                                <div class="action-arrow">
                                    <i class="bi bi-chevron-right"></i>
                                </div>
                            </a>
                        </div>

                    </div>
                </div>
            </div>
        </app-main-layout>
    `,
    styles: [`
      /* --- LAYOUT & ANIMATIONS --- */
      .dashboard-wrapper { background-color: #f8fafc; min-height: 100vh; }

      .fade-in-up { animation: fadeInUp 0.6s ease-out; }
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* --- HERO HEADER --- */
      .hero-header {
        background: linear-gradient(120deg, #667eea 0%, #764ba2 100%);
        padding-top: 3rem;
        position: relative;
        overflow: hidden;
      }

      .header-content { position: relative; z-index: 2; padding-bottom: 3rem; }

      .hero-wave { line-height: 0; width: 100%; }
      .hero-wave svg { width: 100%; height: auto; display: block; }

      .bg-white-glass {
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10px);
        color: white;
        font-weight: 500;
        border: 1px solid rgba(255, 255, 255, 0.3);
        padding: 0.5rem 1rem;
        border-radius: 30px;
      }

      .date-capsule {
        background: white;
        color: #667eea;
        padding: 0.6rem 1.2rem;
        border-radius: 50px;
        font-weight: 600;
        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      /* --- CONTENU --- */
      .main-content { margin-top: -6rem; position: relative; z-index: 5; }

      /* --- SMOOTH CARDS (Les stats) --- */
      .smooth-card {
        background: white;
        border-radius: 20px; /* Arrondis marqués */
        border: 1px solid rgba(255,255,255,0.8);
        box-shadow: 0 10px 30px -10px rgba(0,0,0,0.08); /* Ombre douce */
        height: 100%;
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      }

      .hover-lift:hover {
        transform: translateY(-8px); /* Effet de levitation */
        box-shadow: 0 20px 40px -10px rgba(0,0,0,0.15);
      }

      .icon-circle {
        width: 48px; height: 48px; border-radius: 14px;
        display: flex; align-items: center; justify-content: center;
        font-size: 1.4rem;
      }

      .link-arrow {
        text-decoration: none; font-weight: 600; font-size: 0.9rem;
        display: inline-flex; align-items: center; gap: 5px;
        transition: gap 0.2s;
      }
      .link-arrow:hover { gap: 10px; }

      /* --- ACTION CARDS (Les raccourcis) --- */
      .section-title {
        font-size: 0.85rem; font-weight: 700; text-transform: uppercase;
        letter-spacing: 1px; color: #64748b; margin-bottom: 1.5rem; margin-top: 1rem;
      }

      .action-card {
        background: white; border-radius: 16px; padding: 1.25rem;
        display: flex; align-items: center; text-decoration: none; color: inherit;
        border: 1px solid rgba(0,0,0,0.03);
        box-shadow: 0 4px 6px rgba(0,0,0,0.02);
        transition: all 0.3s ease;
      }

      .hover-scale:hover {
        transform: scale(1.02);
        box-shadow: 0 12px 24px rgba(0,0,0,0.08);
      }

      .action-icon {
        width: 54px; height: 54px; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: 1.6rem; margin-right: 1.25rem; flex-shrink: 0;
      }

      .action-details h5 { margin: 0; font-size: 1rem; font-weight: 700; color: #1e293b; }
      .action-details p { margin: 0; font-size: 0.85rem; color: #94a3b8; }

      .action-arrow { margin-left: auto; color: #cbd5e1; transition: color 0.2s; }
      .action-card:hover .action-arrow { color: #667eea; }

      /* --- COULEURS --- */
      .bg-gradient-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }

      .bg-orange-soft { background: #fff7ed; } .text-orange { color: #ea580c; }
      .bg-purple-soft { background: #f3e8ff; } .text-purple { color: #9333ea; }
      .bg-blue-soft { background: #eff6ff; } .text-blue { color: #2563eb; }
    `]
})
export class AdminDashboardComponent implements OnInit {
    today = new Date();
    stats = signal({ candidats: 0, inscriptions: 0, directeurs: 0 });

    constructor(
        private userService: UserService,
        private inscriptionService: InscriptionService
    ) {}

    ngOnInit() {
        this.loadStats();
    }

    loadStats() {
        // Candidats
        this.userService.getUsersByRole('CANDIDAT').subscribe(u =>
            this.stats.update(s => ({ ...s, candidats: u.length }))
        );
        // Directeurs
        this.userService.getUsersByRole('DIRECTEUR_THESE').subscribe(u =>
            this.stats.update(s => ({ ...s, directeurs: u.length }))
        );
        // Inscriptions Validées Dir (Prêtes pour admin)
        this.inscriptionService.getByStatut(StatutInscription.VALIDE_DIRECTEUR).subscribe(i =>
            this.stats.update(s => ({ ...s, inscriptions: i.length }))
        );
    }
}