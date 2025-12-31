import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MainLayoutComponent } from '@shared/components/main-layout/main-layout.component';
import { AuthService } from '@core/services/auth.service';
import { UserService } from '@core/services/user.service';
import { InscriptionService } from '@core/services/inscription.service';
import { DerogationService } from '@core/services/derogation.service';
import { SoutenanceService } from '@core/services/soutenance.service';
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

          <!-- HERO HEADER -->
          <div class="welcome-hero">
            <div class="hero-content">
              <div class="avatar-box"><span class="avatar-initials">{{ getInitials() }}</span></div>
              <div class="welcome-text">
                <p class="greeting">Bienvenue,</p>
                <h1 class="user-name">{{ currentUserData()?.prenom }} {{ currentUserData()?.nom }}</h1>
                <div class="user-tags">
                  <span class="tag role"><i class="bi bi-mortarboard"></i>{{ getRoleLabel() }}</span>

                  @if (isDoctorant()) {
                    <!-- Année de thèse -->
                    @if (getAnneeTheseNumber()) {
                      <span class="tag year"><i class="bi bi-calendar3"></i>{{ getAnneeTheseNumber() }}{{ getAnneeTheseSuffix() }} année</span>
                    }

                    <!-- ✅ NOUVEAU : Affichage du Directeur -->
                    @if (directorName()) {
                      <span class="tag director">
                        <i class="bi bi-person-video3"></i> Dir: {{ directorName() }}
                      </span>
                    }
                  }

                  <span class="tag status"><i class="bi bi-check-circle"></i>Compte actif</span>
                </div>
              </div>
            </div>
            <div class="hero-date"><i class="bi bi-calendar3"></i>{{ today | date:'EEEE d MMMM yyyy' }}</div>
          </div>

          <!-- ============================================= -->
          <!-- SECTION DOCTORANT                             -->
          <!-- ============================================= -->
          @if (isDoctorant()) {
            <div class="thesis-card">
              <div class="thesis-header"><div class="thesis-icon"><i class="bi bi-journal-text"></i></div><h3>Mon Sujet de Thèse</h3></div>
              <div class="thesis-body">
                @if (currentUserData()?.sujetThese || currentUserData()?.titreThese) {
                  <p class="thesis-text">{{ currentUserData()?.sujetThese || currentUserData()?.titreThese }}</p>
                  <span class="thesis-meta">
                    <i class="bi bi-person-check"></i>
                    <!-- Affichage dynamique du directeur aussi ici -->
                    Assigné par : {{ directorName() || 'votre directeur' }}
                  </span>
                } @else {
                  <div class="no-thesis"><i class="bi bi-journal-x"></i><p>Aucun sujet de thèse assigné</p><span>Votre directeur vous assignera un sujet lors de la validation.</span></div>
                }
              </div>
            </div>

            @if (getAnneeTheseNumber() >= 3) {
              <div class="alert-banner" [ngClass]="getAlertClass()">
                <div class="alert-icon"><i class="bi" [ngClass]="getAlertIcon()"></i></div>
                <div class="alert-content"><strong>{{ getAlertTitle() }}</strong><p>{{ getAlertMessage() }}</p></div>
                @if (getAnneeTheseNumber() >= 4) { <a routerLink="/derogations" class="alert-action">Demander une dérogation</a> }
              </div>
            }

            <div class="stats-grid">
              <div class="stat-card" [ngClass]="getYearCardClass()"><div class="stat-icon"><i class="bi bi-calendar-check"></i></div><div class="stat-info"><span class="stat-label">Année de thèse</span><span class="stat-value">{{ getAnneeTheseNumber() }}<sup>{{ getAnneeTheseSuffix() }}</sup></span></div><div class="stat-progress"><div class="progress-fill" [style.width.%]="(getAnneeTheseNumber() / 6) * 100"></div></div></div>
              <div class="stat-card publications" [class.complete]="getPublications() >= 2"><div class="stat-icon"><i class="bi bi-journal-richtext"></i></div><div class="stat-info"><span class="stat-label">Publications Q1/Q2</span><span class="stat-value">{{ getPublications() }}<span class="stat-total">/2</span></span></div><div class="stat-progress"><div class="progress-fill" [style.width.%]="getProgressPercent(getPublications(), 2)"></div></div>@if (getPublications() >= 2) { <span class="complete-badge"><i class="bi bi-check-circle-fill"></i></span> }</div>
              <div class="stat-card conferences" [class.complete]="getConferences() >= 2"><div class="stat-icon"><i class="bi bi-mic"></i></div><div class="stat-info"><span class="stat-label">Conférences</span><span class="stat-value">{{ getConferences() }}<span class="stat-total">/2</span></span></div><div class="stat-progress"><div class="progress-fill" [style.width.%]="getProgressPercent(getConferences(), 2)"></div></div>@if (getConferences() >= 2) { <span class="complete-badge"><i class="bi bi-check-circle-fill"></i></span> }</div>
              <div class="stat-card formation" [class.complete]="getHeuresFormation() >= 200"><div class="stat-icon"><i class="bi bi-book"></i></div><div class="stat-info"><span class="stat-label">Heures Formation</span><span class="stat-value">{{ getHeuresFormation() }}<span class="stat-total">/200h</span></span></div><div class="stat-progress"><div class="progress-fill" [style.width.%]="getProgressPercent(getHeuresFormation(), 200)"></div></div>@if (getHeuresFormation() >= 200) { <span class="complete-badge"><i class="bi bi-check-circle-fill"></i></span> }</div>
            </div>

            @if (canSoutenir()) {
              <div class="success-banner"><div class="success-icon"><i class="bi bi-trophy-fill"></i></div><div class="success-content"><strong>Félicitations ! Tous vos prérequis sont validés</strong><p>Vous pouvez maintenant déposer votre demande de soutenance.</p></div><a routerLink="/soutenances" class="success-action">Demander la soutenance</a></div>
            }

            <h4 class="section-title"><i class="bi bi-lightning-charge me-2"></i>Actions Rapides</h4>
            <div class="actions-grid">
              <a routerLink="/inscriptions" class="action-card blue"><div class="action-icon"><i class="bi bi-folder2-open"></i></div><div class="action-content"><h5>Mes Dossiers</h5><p>Inscriptions annuelles</p></div><i class="bi bi-arrow-right"></i></a>
              <a routerLink="/soutenances" class="action-card purple" [class.disabled]="!canSoutenir()"><div class="action-icon"><i class="bi bi-award"></i></div><div class="action-content"><h5>Ma Soutenance</h5><p>{{ canSoutenir() ? 'Déposer ma demande' : 'Prérequis non atteints' }}</p></div>@if (canSoutenir()) { <span class="action-badge-ready"><i class="bi bi-check"></i></span> }<i class="bi bi-arrow-right"></i></a>
              <a routerLink="/derogations" class="action-card orange"><div class="action-icon"><i class="bi bi-clock-history"></i></div><div class="action-content"><h5>Dérogations</h5><p>Demander une prolongation</p></div><i class="bi bi-arrow-right"></i></a>
              <a routerLink="/profil" class="action-card gray"><div class="action-icon"><i class="bi bi-person-gear"></i></div><div class="action-content"><h5>Mon Profil</h5><p>Voir mes informations</p></div><i class="bi bi-arrow-right"></i></a>
            </div>

            <div class="profile-card">
              <div class="profile-header"><div class="profile-icon"><i class="bi bi-person-badge"></i></div><h4>Mon Profil Doctorant</h4><button class="btn-refresh-profile" (click)="refreshUserData()" [disabled]="isRefreshing()"><i class="bi" [class.bi-arrow-clockwise]="!isRefreshing()" [class.spinner-icon]="isRefreshing()"></i></button></div>
              <div class="profile-body"><div class="profile-grid">
                <div class="profile-item"><span class="item-label">Nom complet</span><span class="item-value">{{ currentUserData()?.nom }} {{ currentUserData()?.prenom }}</span></div>
                <div class="profile-item"><span class="item-label">Matricule</span><span class="item-value mono">{{ currentUserData()?.username }}</span></div>
                <div class="profile-item"><span class="item-label">Email</span><span class="item-value">{{ currentUserData()?.email }}</span></div>
                <div class="profile-item"><span class="item-label">Téléphone</span><span class="item-value">{{ currentUserData()?.telephone || 'Non renseigné' }}</span></div>
                <div class="profile-item"><span class="item-label">Statut</span><span class="item-value"><span class="status-tag success"><i class="bi bi-patch-check-fill"></i>DOCTORANT VALIDÉ</span></span></div>
                <div class="profile-item"><span class="item-label">Dossiers soumis</span><span class="item-value">{{ stats().inscriptions }} inscription(s)</span></div>
              </div></div>
            </div>
          }

          <!-- ============================================= -->
          <!-- SECTION DIRECTEUR (Avec Ordre & Badges)       -->
          <!-- ============================================= -->
          @if (isDirecteur()) {

            <!-- 1. GRILLE STATISTIQUES (Vue d'ensemble) -->
            <div class="stats-grid five-cols">

              <!-- 1. Doctorants -->
              <div class="stat-card purple">
                <div class="stat-icon"><i class="bi bi-people-fill"></i></div>
                <div class="stat-info">
                  <span class="stat-label">Mes Doctorants</span>
                  <span class="stat-value">{{ stats().activeStudents }}</span>
                </div>
              </div>

              <!-- 2. Nouveaux -->
              <div class="stat-card warning">
                <div class="stat-icon"><i class="bi bi-folder-check"></i></div>
                <div class="stat-info">
                  <span class="stat-label">Nouveaux</span>
                  <span class="stat-value">{{ stats().aValider }}</span>
                </div>
              </div>

              <!-- 3. Réinscriptions -->
              <div class="stat-card blue">
                <div class="stat-icon"><i class="bi bi-journal-check"></i></div>
                <div class="stat-info">
                  <span class="stat-label">Réinscriptions</span>
                  <span class="stat-value">{{ stats().reinscriptionsEnAttente }}</span>
                </div>
              </div>

              <!-- 4. Dérogations -->
              <div class="stat-card orange">
                <div class="stat-icon"><i class="bi bi-clock-history"></i></div>
                <div class="stat-info">
                  <span class="stat-label">Dérogations</span>
                  <span class="stat-value">{{ stats().derogationsEnAttente }}</span>
                </div>
              </div>

              <!-- 5. Soutenances -->
              <div class="stat-card green">
                <div class="stat-icon"><i class="bi bi-award"></i></div>
                <div class="stat-info">
                  <span class="stat-label">Soutenances</span>
                  <span class="stat-value">{{ stats().soutenances }}</span>
                </div>
              </div>
            </div>

            <!-- 2. BANNIÈRES D'ALERTE (S'affichent si besoin) -->
            <div class="alerts-container">
              @if (stats().aValider > 0) {
                <div class="alert-banner warning">
                  <div class="alert-icon"><i class="bi bi-folder-check"></i></div>
                  <div class="alert-content">
                    <strong>{{ stats().aValider }} nouveau(x) dossier(s) en attente</strong>
                    <p>Des dossiers de première inscription nécessitent votre validation.</p>
                  </div>
                  <a routerLink="/validations" class="alert-action">Traiter</a>
                </div>
              }

              @if (stats().reinscriptionsEnAttente > 0) {
                <div class="alert-banner info">
                  <div class="alert-icon"><i class="bi bi-journal-check"></i></div>
                  <div class="alert-content">
                    <strong>{{ stats().reinscriptionsEnAttente }} demande(s) de réinscription</strong>
                    <p>Vos doctorants ont soumis des demandes de réinscription.</p>
                  </div>
                  <a routerLink="/director/reinscriptions" class="alert-action">Traiter</a>
                </div>
              }

              @if (stats().derogationsEnAttente > 0) {
                <div class="alert-banner orange">
                  <div class="alert-icon"><i class="bi bi-exclamation-triangle-fill"></i></div>
                  <div class="alert-content">
                    <strong>{{ stats().derogationsEnAttente }} dérogation(s) en attente</strong>
                    <p>Vos doctorants ont soumis des demandes de prolongation.</p>
                  </div>
                  <a routerLink="/director/derogations" class="alert-action">Traiter</a>
                </div>
              }

              @if (stats().soutenances > 0) {
                <div class="alert-banner green">
                  <div class="alert-icon"><i class="bi bi-award"></i></div>
                  <div class="alert-content">
                    <strong>{{ stats().soutenances }} soutenance(s) en attente</strong>
                    <p>Des demandes de soutenance nécessitent votre validation.</p>
                  </div>
                  <a routerLink="/director/soutenances" class="alert-action">Traiter</a>
                </div>
              }
            </div>

            <h4 class="section-title"><i class="bi bi-lightning-charge me-2"></i>Actions Rapides</h4>

            <!-- 3. ACTIONS GRID (Boutons cliquables avec BADGES) -->
            <div class="actions-grid five-cols">

              <!-- 1. Mes Doctorants -->
              <a routerLink="/director/my-students" class="action-card purple">
                <div class="action-icon"><i class="bi bi-people-fill"></i></div>
                <div class="action-content">
                  <h5>Mes Doctorants</h5>
                  <p>Suivi et progression</p>
                </div>
                <i class="bi bi-arrow-right"></i>
              </a>

              <!-- 2. Nouveaux -->
              <a routerLink="/validations" class="action-card warning position-relative">
                <div class="action-icon"><i class="bi bi-check2-circle"></i></div>
                <div class="action-content">
                  <h5>Nouveaux</h5>
                  <p>{{ stats().aValider }} dossier(s)</p>
                </div>
                <!-- BADGE -->
                @if (stats().aValider > 0) {
                  <span class="action-badge">{{ stats().aValider }}</span>
                }
                <i class="bi bi-arrow-right"></i>
              </a>

              <!-- 3. Réinscriptions -->
              <a routerLink="/director/reinscriptions" class="action-card blue position-relative">
                <div class="action-icon"><i class="bi bi-journal-check"></i></div>
                <div class="action-content">
                  <h5>Réinscriptions</h5>
                  <p>{{ stats().reinscriptionsEnAttente }} demande(s)</p>
                </div>
                <!-- BADGE -->
                @if (stats().reinscriptionsEnAttente > 0) {
                  <span class="action-badge">{{ stats().reinscriptionsEnAttente }}</span>
                }
                <i class="bi bi-arrow-right"></i>
              </a>

              <!-- 4. Dérogations -->
              <a routerLink="/director/derogations" class="action-card orange position-relative">
                <div class="action-icon"><i class="bi bi-clock-history"></i></div>
                <div class="action-content">
                  <h5>Dérogations</h5>
                  <p>{{ stats().derogationsEnAttente }} demande(s)</p>
                </div>
                <!-- BADGE -->
                @if (stats().derogationsEnAttente > 0) {
                  <span class="action-badge">{{ stats().derogationsEnAttente }}</span>
                }
                <i class="bi bi-arrow-right"></i>
              </a>

              <!-- 5. Soutenances -->
              <a routerLink="/director/soutenances" class="action-card green position-relative">
                <div class="action-icon"><i class="bi bi-mortarboard"></i></div>
                <div class="action-content">
                  <h5>Soutenances</h5>
                  <p>{{ stats().soutenances }} demande(s)</p>
                </div>
                <!-- BADGE -->
                @if (stats().soutenances > 0) {
                  <span class="action-badge">{{ stats().soutenances }}</span>
                }
                <i class="bi bi-arrow-right"></i>
              </a>

            </div>
          }
        </div>
      </app-main-layout>
    }
  `,
  styles: [`
    .dashboard-container { max-width: 1400px; margin: 0 auto; padding: 0 1.5rem 3rem; }
    .welcome-hero { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%); border-radius: 24px; padding: 2rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; }
    .hero-content { display: flex; align-items: center; gap: 1.5rem; }
    .avatar-box { width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 20px; display: flex; align-items: center; justify-content: center; border: 3px solid rgba(255,255,255,0.3); }
    .avatar-initials { font-size: 1.75rem; font-weight: 700; color: white; }
    .welcome-text { color: white; }
    .greeting { margin: 0; font-size: 0.95rem; opacity: 0.9; }
    .user-name { margin: 0.25rem 0 0.75rem; font-size: 1.75rem; font-weight: 800; color: white; }
    .user-tags { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .tag { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.4rem 0.75rem; background: rgba(255,255,255,0.15); border-radius: 50px; font-size: 0.8rem; font-weight: 500; color: white; }
    .tag.status { background: rgba(34,197,94,0.3); }

    /* Style pour le tag directeur */
    .tag.director { background: rgba(255, 255, 255, 0.25); border: 1px solid rgba(255,255,255,0.3); }

    .hero-date { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; background: rgba(255,255,255,0.15); border-radius: 12px; color: white; font-weight: 500; }

    /* Thesis Card (Doctorant) */
    .thesis-card { background: white; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; overflow: hidden; margin-bottom: 1.5rem; }
    .thesis-header { display: flex; align-items: center; gap: 0.75rem; padding: 1.25rem 1.5rem; background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-bottom: 1px solid #e2e8f0; }
    .thesis-icon { width: 44px; height: 44px; background: linear-gradient(135deg, #8b5cf6, #6d28d9); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.25rem; }
    .thesis-header h3 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #1e293b; }
    .thesis-body { padding: 1.5rem; }
    .thesis-text { font-size: 1.1rem; font-weight: 600; color: #1e293b; line-height: 1.5; margin: 0 0 1rem; padding: 1rem; background: linear-gradient(135deg, #f0f4ff, #ede9fe); border-radius: 12px; border-left: 4px solid #8b5cf6; }
    .thesis-meta { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #64748b; }
    .thesis-meta i { color: #22c55e; }
    .no-thesis { text-align: center; padding: 2rem; color: #64748b; }
    .no-thesis i { font-size: 2.5rem; color: #cbd5e1; margin-bottom: 0.75rem; display: block; }
    .no-thesis p { margin: 0; font-weight: 600; color: #475569; }
    .no-thesis span { font-size: 0.85rem; }

    /* Alert Banners */
    .alert-banner { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.5rem; border-radius: 16px; margin-bottom: 1rem; }
    .alert-banner.warning { background: #fef3c7; border: 1px solid #fcd34d; }
    .alert-banner.danger { background: #fee2e2; border: 1px solid #fca5a5; }
    .alert-banner.info { background: #f3e8ff; border: 1px solid #c4b5fd; }
    .alert-banner.blue { background: #eff6ff; border: 1px solid #93c5fd; }
    .alert-banner.green { background: #dcfce7; border: 1px solid #86efac; }
    .alert-banner.orange { background: #ffedd5; border: 1px solid #fdba74; }
    .alert-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0; }
    .alert-banner.warning .alert-icon { background: #f59e0b; color: white; }
    .alert-banner.danger .alert-icon { background: #ef4444; color: white; }
    .alert-banner.info .alert-icon { background: #8b5cf6; color: white; }
    .alert-banner.blue .alert-icon { background: #3b82f6; color: white; }
    .alert-banner.green .alert-icon { background: #22c55e; color: white; }
    .alert-banner.orange .alert-icon { background: #f97316; color: white; }
    .alert-content { flex: 1; }
    .alert-content strong { display: block; margin-bottom: 0.25rem; font-size: 0.95rem; }
    .alert-content p { margin: 0; font-size: 0.85rem; opacity: 0.9; }
    .alert-action { padding: 0.5rem 1rem; background: white; border-radius: 8px; font-weight: 600; font-size: 0.85rem; text-decoration: none; color: inherit; white-space: nowrap; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }

    .success-banner { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.5rem; border-radius: 16px; margin-bottom: 1.5rem; background: linear-gradient(135deg, #dcfce7, #bbf7d0); border: 1px solid #86efac; }
    .success-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; background: #22c55e; color: white; }
    .success-content { flex: 1; color: #166534; }
    .success-content strong { display: block; margin-bottom: 0.25rem; }
    .success-content p { margin: 0; font-size: 0.875rem; }
    .success-action { padding: 0.6rem 1.25rem; background: #22c55e; color: white; border-radius: 8px; font-weight: 600; font-size: 0.85rem; text-decoration: none; }

    /* Stats & Actions Grids */
    .stats-grid { display: grid; gap: 1rem; margin-bottom: 1.5rem; }
    .actions-grid { display: grid; gap: 1rem; margin-bottom: 1.5rem; }

    /* Config par défaut (Doctorant - 4 colonnes) */
    .stats-grid:not(.five-cols), .actions-grid:not(.five-cols) { grid-template-columns: repeat(4, 1fr); }

    /* Config pour Directeur (5 colonnes) */
    .stats-grid.five-cols, .actions-grid.five-cols { grid-template-columns: repeat(5, 1fr); }

    /* Stat Card */
    .stat-card { background: white; border-radius: 16px; padding: 1.25rem; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; position: relative; display: flex; flex-direction: column; align-items: center; text-align: center; }
    .stat-card.complete { border-color: #86efac; background: linear-gradient(135deg, white, #f0fdf4); }
    .stat-card .stat-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; margin-bottom: 0.75rem; }
    .stat-card .stat-info { width: 100%; }
    .stat-card .stat-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; display: block; margin-bottom: 0.25rem; }
    .stat-card .stat-value { font-size: 1.75rem; font-weight: 800; line-height: 1; color: #1e293b; }
    .stat-card .stat-value sup { font-size: 0.8rem; font-weight: 600; }
    .stat-card .stat-total { font-size: 0.9rem; color: #94a3b8; font-weight: 500; }
    .stat-card .stat-progress { height: 4px; background: #e2e8f0; border-radius: 2px; margin-top: 1rem; overflow: hidden; width: 100%; }
    .stat-card .progress-fill { height: 100%; border-radius: 2px; transition: width 0.5s; }
    .complete-badge { position: absolute; top: 0.75rem; right: 0.75rem; color: #22c55e; font-size: 1.25rem; }

    /* Couleurs Stat Cards */
    .stat-card.year-green .stat-icon { background: #dcfce7; color: #16a34a; } .stat-card.year-green .stat-value { color: #16a34a; } .stat-card.year-green .progress-fill { background: #16a34a; }
    .stat-card.year-yellow .stat-icon { background: #fef3c7; color: #d97706; } .stat-card.year-yellow .stat-value { color: #d97706; } .stat-card.year-yellow .progress-fill { background: #d97706; }
    .stat-card.year-orange .stat-icon { background: #ffedd5; color: #ea580c; } .stat-card.year-orange .stat-value { color: #ea580c; } .stat-card.year-orange .progress-fill { background: #ea580c; }
    .stat-card.year-red .stat-icon { background: #fee2e2; color: #dc2626; } .stat-card.year-red .stat-value { color: #dc2626; } .stat-card.year-red .progress-fill { background: #dc2626; }
    .stat-card.publications .stat-icon { background: #dbeafe; color: #2563eb; } .stat-card.publications .stat-value { color: #2563eb; } .stat-card.publications .progress-fill { background: #2563eb; }
    .stat-card.conferences .stat-icon { background: #f3e8ff; color: #9333ea; } .stat-card.conferences .stat-value { color: #9333ea; } .stat-card.conferences .progress-fill { background: #9333ea; }
    .stat-card.formation .stat-icon { background: #fce7f3; color: #db2777; } .stat-card.formation .stat-value { color: #db2777; } .stat-card.formation .progress-fill { background: #db2777; }

    .stat-card.warning .stat-icon { background: #fef3c7; color: #d97706; } .stat-card.warning .stat-value { color: #d97706; }
    .stat-card.orange .stat-icon { background: #ffedd5; color: #ea580c; } .stat-card.orange .stat-value { color: #ea580c; }
    .stat-card.purple .stat-icon { background: #f3e8ff; color: #9333ea; } .stat-card.purple .stat-value { color: #9333ea; }
    .stat-card.blue .stat-icon { background: #dbeafe; color: #2563eb; } .stat-card.blue .stat-value { color: #2563eb; }
    .stat-card.green .stat-icon { background: #dcfce7; color: #16a34a; } .stat-card.green .stat-value { color: #16a34a; }

    .section-title { font-weight: 700; color: #1e293b; display: flex; align-items: center; margin-bottom: 1rem; font-size: 1.1rem; }
    .section-title i { color: #6366f1; }

    /* Action Cards */
    .action-card { display: flex; align-items: center; gap: 1rem; padding: 1.25rem; background: white; border-radius: 16px; text-decoration: none; color: inherit; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; transition: all 0.3s; position: relative; }
    .action-card:hover { transform: translateY(-4px); box-shadow: 0 12px 30px rgba(0,0,0,0.12); }
    .action-card.disabled { opacity: 0.6; pointer-events: none; }

    .action-icon { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; flex-shrink: 0; }
    .action-content { flex: 1; }
    .action-content h5 { margin: 0 0 0.25rem; font-weight: 700; font-size: 1rem; color: #1e293b; }
    .action-content p { margin: 0; font-size: 0.8rem; color: #64748b; }
    .action-card > .bi-arrow-right { color: #cbd5e1; font-size: 1.25rem; margin-left: auto; }

    /* BADGES (Style Corrigé) */
    .action-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background: #ef4444;
      color: white;
      min-width: 24px;
      height: 24px;
      padding: 0 6px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
      box-shadow: 0 2px 5px rgba(239, 68, 68, 0.4);
      border: 2px solid white;
    }
    .action-badge-ready { position: absolute; top: -8px; right: -8px; background: #22c55e; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; border: 2px solid white; }

    .action-card.blue .action-icon { background: #dbeafe; color: #2563eb; }
    .action-card.purple .action-icon { background: #f3e8ff; color: #9333ea; }
    .action-card.orange .action-icon { background: #ffedd5; color: #ea580c; }
    .action-card.green .action-icon { background: #dcfce7; color: #16a34a; }
    .action-card.warning .action-icon { background: #fef3c7; color: #d97706; }
    .action-card.gray .action-icon { background: #f1f5f9; color: #64748b; }

    .profile-card { background: white; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; overflow: hidden; }
    .profile-header { display: flex; align-items: center; gap: 0.75rem; padding: 1.25rem 1.5rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
    .profile-icon { width: 40px; height: 40px; background: #dbeafe; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #2563eb; font-size: 1.1rem; }
    .profile-header h4 { margin: 0; font-weight: 700; color: #1e293b; flex: 1; }
    .btn-refresh-profile { width: 36px; height: 36px; border: 1px solid #e2e8f0; background: white; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; }
    .btn-refresh-profile:disabled { opacity: 0.5; }
    .spinner-icon { animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .profile-body { padding: 1.5rem; }
    .profile-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .profile-item { padding: 0.75rem; background: #f8fafc; border-radius: 10px; }
    .item-label { display: block; font-size: 0.7rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.25rem; }
    .item-value { font-size: 0.95rem; font-weight: 600; color: #1e293b; }
    .item-value.mono { font-family: monospace; }
    .status-tag { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
    .status-tag.success { background: #dcfce7; color: #15803d; }

    @media (max-width: 1200px) {
      .stats-grid.five-cols, .actions-grid.five-cols { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 992px) {
      .stats-grid:not(.five-cols), .actions-grid:not(.five-cols) { grid-template-columns: repeat(2, 1fr); }
      .stats-grid.five-cols, .actions-grid.five-cols { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 768px) {
      .welcome-hero { flex-direction: column; text-align: center; gap: 1.5rem; }
      .hero-content { flex-direction: column; }
      .stats-grid, .actions-grid, .stats-grid.five-cols, .actions-grid.five-cols { grid-template-columns: 1fr; }
      .profile-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  // Ajout de 'activeStudents' dans les stats
  stats = signal({ inscriptions: 0, aValider: 0, derogationsEnAttente: 0, soutenances: 0, reinscriptionsEnAttente: 0, activeStudents: 0 });
  today = new Date();
  currentUserData = signal<any>(null);
  directorName = signal<string | null>(null); // ✅ Signal pour stocker le nom du directeur
  isRefreshing = signal(false);

  constructor(
      public authService: AuthService,
      private userService: UserService,
      private inscriptionService: InscriptionService,
      private derogationService: DerogationService,
      private soutenanceService: SoutenanceService,
      private router: Router
  ) {}

  ngOnInit(): void { this.loadUserFromDB(); this.loadData(); }

  loadUserFromDB(): void {
    const user = this.authService.currentUser();
    if (user?.id) {
      this.userService.getUserById(user.id).subscribe({ next: (d) => {
          this.currentUserData.set(d);
          this.authService.updateCurrentUser(d);

          // ✅ Récupérer le nom du directeur si c'est un doctorant
          if (d.role === Role.DOCTORANT && d.directeurId) {
            this.loadDirectorName(d.directeurId);
          }

        }, error: () => this.currentUserData.set(user) });
    } else { this.currentUserData.set(user); }
  }

  // ✅ Nouvelle méthode pour charger le directeur
  loadDirectorName(directeurId: number) {
    this.userService.getUserById(directeurId).subscribe({
      next: (dir) => {
        this.directorName.set(`${dir.prenom} ${dir.nom}`);
      },
      error: () => this.directorName.set('Non trouvé')
    });
  }

  refreshUserData(): void {
    this.isRefreshing.set(true);
    const user = this.authService.currentUser();
    if (user?.id) {
      this.userService.getUserById(user.id).subscribe({ next: (d) => {
          this.currentUserData.set(d);
          this.authService.updateCurrentUser(d);

          // Recharger aussi le directeur au cas où
          if (d.role === Role.DOCTORANT && d.directeurId) {
            this.loadDirectorName(d.directeurId);
          }

          this.isRefreshing.set(false);
        }, error: () => this.isRefreshing.set(false) });
    }
    else { this.isRefreshing.set(false); }
  }

  getProgressPercent(c: number, m: number): number { return Math.min((c / m) * 100, 100); }
  isDoctorant(): boolean { return this.authService.currentUser()?.role === Role.DOCTORANT; }
  isDirecteur(): boolean { return this.authService.currentUser()?.role === Role.DIRECTEUR_THESE; }
  isAdmin(): boolean { return this.authService.currentUser()?.role === Role.ADMIN; }
  getInitials(): string { const u = this.currentUserData() || this.authService.currentUser(); return u ? (u.prenom?.charAt(0) || '') + (u.nom?.charAt(0) || '') : '?'; }
  getRoleLabel(): string { const r = this.authService.currentUser()?.role; return r === Role.DOCTORANT ? 'Doctorant' : r === Role.DIRECTEUR_THESE ? 'Directeur de Thèse' : 'Utilisateur'; }
  getAnneeTheseNumber(): number { return this.currentUserData()?.anneeThese || 1; }
  getAnneeTheseSuffix(): string { return this.getAnneeTheseNumber() === 1 ? 'ère' : 'ème'; }
  getPublications(): number { return this.currentUserData()?.nbPublications || 0; }
  getConferences(): number { return this.currentUserData()?.nbConferences || 0; }
  getHeuresFormation(): number { return this.currentUserData()?.heuresFormation || 0; }
  canSoutenir(): boolean { return this.getPublications() >= 2 && this.getConferences() >= 2 && this.getHeuresFormation() >= 200; }
  getYearCardClass(): string { const a = this.getAnneeTheseNumber(); return a <= 2 ? 'year-green' : a === 3 ? 'year-yellow' : a <= 5 ? 'year-orange' : 'year-red'; }
  getAlertClass(): string { return this.getAnneeTheseNumber() >= 4 ? 'danger' : 'warning'; }
  getAlertIcon(): string { return this.getAnneeTheseNumber() >= 5 ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill'; }
  getAlertTitle(): string { const a = this.getAnneeTheseNumber(); return a === 3 ? 'Attention : 3ème année de thèse' : a === 4 ? 'Dérogation requise : 4ème année' : a === 5 ? '⚠️ 5ème année de thèse' : a === 6 ? '🚨 Dernière année possible !' : ''; }
  getAlertMessage(): string { const a = this.getAnneeTheseNumber(); return a === 3 ? 'La durée normale est de 3 ans.' : a === 4 ? 'Une dérogation est requise.' : a === 5 ? 'Il vous reste 2 ans maximum.' : a === 6 ? 'Vous devez soutenir cette année.' : ''; }

  private loadData(): void {
    const u = this.authService.currentUser(); if (!u) return;
    if (this.isDoctorant()) {
      this.inscriptionService.getByDoctorant(u.id).subscribe({ next: (d: any) => this.stats.update(s => ({ ...s, inscriptions: d.length })), error: () => {} });
    }
    else if (this.isDirecteur()) {
      // 1. Récupérer les nouveaux candidats ("EN_ATTENTE_DIRECTEUR")
      this.userService.getUsersByEtat('EN_ATTENTE_DIRECTEUR').subscribe({
        next: (users) => {
          const myCandidates = users.filter(user => user.directeurId === u.id);
          this.stats.update(s => ({ ...s, aValider: myCandidates.length }));
        },
        error: () => {}
      });

      // 2. Récupérer le nombre de doctorants ACTIFS ("DOCTORANT") assignés à ce directeur
      this.userService.getUsersByRole('DOCTORANT').subscribe({
        next: (users) => {
          const myStudents = users.filter(user => user.directeurId === u.id);
          this.stats.update(s => ({ ...s, activeStudents: myStudents.length }));
        },
        error: () => {}
      });

      this.inscriptionService.getReinscritionsEnAttenteDirecteur(u.id).subscribe({ next: (d: any) => this.stats.update(s => ({ ...s, reinscriptionsEnAttente: d.length })), error: () => {} });
      this.derogationService.getDerogationsDirecteur(u.id).subscribe({ next: (d: any) => this.stats.update(s => ({ ...s, derogationsEnAttente: d.filter((x: any) => x.statut === 'EN_ATTENTE_DIRECTEUR' || x.statut === 'EN_ATTENTE').length })), error: () => {} });
      this.soutenanceService.getSoutenancesByDirecteur(u.id).subscribe({ next: (d: any) => this.stats.update(s => ({ ...s, soutenances: d.filter((x: any) => x.statut === 'SOUMIS' || x.statut === 'AUTORISEE').length })), error: () => {} });
    }
  }
}