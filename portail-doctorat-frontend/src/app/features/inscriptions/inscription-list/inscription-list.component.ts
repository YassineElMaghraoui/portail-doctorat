import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MainLayoutComponent } from '@shared/components/main-layout/main-layout.component';
import { InscriptionService } from '@core/services/inscription.service';
import { AuthService } from '@core/services/auth.service';
import { Inscription } from '@core/models/inscription.model';
import { User } from '@core/models/user.model';

@Component({
  selector: 'app-inscription-list',
  standalone: true,
  imports: [CommonModule, RouterLink, MainLayoutComponent],
  template: `
    <app-main-layout>
      <div class="page-container">

        <!-- Hero Header -->
        <div class="hero-section">
          <div class="hero-content">
            <div class="hero-icon"><i class="bi bi-journal-check"></i></div>
            <div>
              <h1 class="hero-title">Mes Réinscriptions</h1>
              <p class="hero-subtitle">Gérez vos réinscriptions annuelles au doctorat</p>
            </div>
          </div>

          <!-- LOGIQUE D'AFFICHAGE DU BOUTON -->
          <div class="hero-actions">
            <!-- CAS 1 : Demande en cours -->
            @if (hasPendingRequest()) {
              <div class="status-pill pending">
                <i class="bi bi-hourglass-split"></i> Dossier en cours
              </div>
            }

            @else if (currentYear() >= 3) {
            }

            @else {
              <a routerLink="nouvelle" class="btn-new">
                <i class="bi bi-plus-lg"></i>
                <span>Nouvelle réinscription (pour {{ currentYear() + 1 }}ème année)</span>
              </a>
            }
          </div>
        </div>

        <!-- ⚠️ ALERTE 1 : DÉROGATION REQUISE (Années 3, 4, 5) -->
        @if (currentYear() >= 3 && currentYear() < 6 && !hasPendingRequest()) {
          <div class="alert-redirect-card warning">
            <div class="alert-content">
              <div class="icon-wrap warning"><i class="bi bi-exclamation-triangle-fill"></i></div>
              <div>
                <strong>Fin du cycle normal (3 ans)</strong>
                <p>Vous êtes actuellement en {{ currentYear() }}ème année. Pour poursuivre vos études en {{ currentYear() + 1 }}ème année, vous devez soumettre une <strong>demande de dérogation</strong>.</p>
              </div>
            </div>
            <a routerLink="/derogations" class="btn-redirect warning">
              Aller aux Dérogations <i class="bi bi-arrow-right"></i>
            </a>
          </div>
        }

        <!-- ⛔ ALERTE 2 : LIMITE ATTEINTE (Année 6) -->
        @if (currentYear() >= 6) {
          <div class="alert-redirect-card danger">
            <div class="alert-content">
              <div class="icon-wrap danger"><i class="bi bi-slash-circle-fill"></i></div>
              <div>
                <strong>Limite maximale atteinte (6 ans)</strong>
                <p>Vous êtes en 6ème année. Vous avez atteint la durée maximale autorisée pour le doctorat. Aucune réinscription ou prolongation supplémentaire n'est possible.</p>
              </div>
            </div>
            <!-- Pas de bouton de redirection car c'est la fin -->
          </div>
        }

        <!-- Info Card -->
        <div class="current-info-card">
          <div class="info-left">
            <div class="info-icon-large"><i class="bi bi-mortarboard"></i></div>
            <div class="info-details">
              <span class="info-label">Année de thèse actuelle</span>
              <span class="info-value">{{ getYearLabel() }}</span>
            </div>
          </div>
          <div class="info-right">
            <div class="info-stat">
              <span class="stat-number">{{ inscriptions().length }}</span>
              <span class="stat-label">Historique</span>
            </div>
            <div class="info-stat">
              <span class="stat-number">{{ getApprovedCount() }}</span>
              <span class="stat-label">Validée(s)</span>
            </div>
          </div>
        </div>

        <!-- Loading -->
        @if (isLoading()) {
          <div class="loading-state">
            <div class="loading-spinner"></div>
            <span>Chargement de vos inscriptions...</span>
          </div>
        }

        <!-- Timeline (Historique) -->
        @if (!isLoading() && inscriptions().length > 0) {
          <div class="inscriptions-section">
            <h3 class="section-title"><i class="bi bi-clock-history me-2"></i>Historique des inscriptions</h3>
            <div class="timeline">
              @for (inscription of inscriptions(); track inscription.id; let i = $index) {
                <div class="timeline-item" [class.first]="i === 0">
                  <div class="timeline-marker" [ngClass]="getStatusClass(inscription.statut)">
                    @if (inscription.statut === 'ADMIS') {
                      <i class="bi bi-check-lg"></i>
                    } @else if (inscription.statut.includes('REJETE')) {
                      <i class="bi bi-x-lg"></i>
                    } @else {
                      <i class="bi bi-hourglass-split"></i>
                    }
                  </div>

                  <div class="timeline-card">
                    <div class="card-header">
                      <div class="card-title-row">
                        <span class="year-badge">
                          {{ inscription.typeInscription === 'PREMIERE_INSCRIPTION' ? '1ère' : (inscription.anneeInscription || i + 1) + 'ème' }} année
                        </span>
                        <span class="status-badge" [ngClass]="getStatusBadgeClass(inscription.statut)">
                          {{ formatStatus(inscription.statut) }}
                        </span>
                      </div>
                      <span class="card-date"><i class="bi bi-calendar3"></i>{{ inscription.createdAt | date:'dd MMM yyyy' }}</span>
                    </div>

                    <div class="card-body">
                      <div class="info-grid-small">
                        <div><span class="lbl">Sujet</span><span class="val">{{ inscription.sujetThese || 'Non défini' }}</span></div>
                        <div><span class="lbl">Labo</span><span class="val">{{ inscription.laboratoireAccueil || 'Non défini' }}</span></div>
                      </div>

                      @if (inscription.statut.includes('REJETE') && (inscription.commentaireAdmin || inscription.commentaireDirecteur)) {
                        <div class="comment-box error">
                          <i class="bi bi-exclamation-triangle-fill"></i>
                          <div class="comment-content">
                            <strong>Motif du refus :</strong>
                            <p>{{ inscription.commentaireAdmin || inscription.commentaireDirecteur }}</p>
                          </div>
                        </div>
                      } @else if (inscription.commentaireDirecteur) {
                        <div class="comment-box">
                          <i class="bi bi-chat-left-text"></i>
                          <div class="comment-content">
                            <strong>Remarque Directeur :</strong>
                            <p>{{ inscription.commentaireDirecteur }}</p>
                          </div>
                        </div>
                      }

                    </div>

                    @if (inscription.statut === 'BROUILLON') {
                      <div class="card-actions">
                        <button class="btn-action submit" (click)="submitInscription(inscription.id)" [disabled]="isSubmitting()">
                          @if (isSubmitting()) { <span class="spinner-sm"></span> } @else { <i class="bi bi-send"></i> } Soumettre
                        </button>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Empty state -->
        @if (!isLoading() && inscriptions().length === 0) {
          <div class="empty-state">
            <div class="empty-icon"><i class="bi bi-journal-x"></i></div>
            <h3 class="empty-title">Aucune inscription trouvée</h3>
            <p class="empty-text">Votre première inscription sera créée automatiquement après l'acceptation de votre candidature.</p>
          </div>
        }

        <!-- Message d'erreur -->
        @if (errorMessage()) {
          <div class="error-toast"><i class="bi bi-exclamation-triangle"></i> {{ errorMessage() }}</div>
        }

      </div>
    </app-main-layout>
  `,
  styles: [`
    .page-container { max-width: 900px; margin: 0 auto; padding: 0 1.5rem 3rem; }

    /* Hero */
    .hero-section { background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 24px; padding: 2rem; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; position: relative; overflow: hidden; }
    .hero-content { display: flex; align-items: center; gap: 1.25rem; z-index: 2; }
    .hero-icon { width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; color: white; }
    .hero-title { color: white; font-size: 1.6rem; font-weight: 800; margin: 0; }
    .hero-subtitle { color: rgba(255,255,255,0.9); margin: 0.25rem 0 0; font-size: 0.95rem; }
    .hero-actions { z-index: 2; }

    .btn-new { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: white; color: #059669; border-radius: 12px; font-weight: 600; text-decoration: none; box-shadow: 0 4px 15px rgba(0,0,0,0.1); transition: all 0.2s; }
    .btn-new:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.15); }
    .status-pill { background: rgba(255,255,255,0.2); color: white; padding: 0.5rem 1rem; border-radius: 50px; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; backdrop-filter: blur(5px); border: 1px solid rgba(255,255,255,0.3); }

    /* Alert Redirect (Modifié pour gérer Warning et Danger) */
    .alert-redirect-card { padding: 1.5rem; border-radius: 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }

    .alert-redirect-card.warning { background: #fff7ed; border: 1px solid #fdba74; }
    .alert-redirect-card.danger { background: #fef2f2; border: 1px solid #fca5a5; }

    .alert-content { display: flex; gap: 1rem; align-items: center; }
    .icon-wrap { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0; }

    .icon-wrap.warning { background: #ffedd5; color: #ea580c; }
    .icon-wrap.danger { background: #fee2e2; color: #dc2626; }

    .alert-content strong { display: block; margin-bottom: 0.25rem; }
    .alert-redirect-card.warning strong { color: #9a3412; }
    .alert-redirect-card.warning p { color: #9a3412; margin: 0; font-size: 0.9rem; max-width: 500px; }

    .alert-redirect-card.danger strong { color: #991b1b; }
    .alert-redirect-card.danger p { color: #991b1b; margin: 0; font-size: 0.9rem; max-width: 500px; }

    .btn-redirect { padding: 0.75rem 1.5rem; border-radius: 10px; text-decoration: none; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; transition: transform 0.2s; }
    .btn-redirect.warning { background: #ea580c; color: white; }
    .btn-redirect:hover { transform: translateX(5px); }

    /* Info Card */
    .current-info-card { display: flex; justify-content: space-between; align-items: center; background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; margin-bottom: 1.5rem; }
    .info-left { display: flex; align-items: center; gap: 1rem; }
    .info-icon-large { width: 56px; height: 56px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: white; }
    .info-details { display: flex; flex-direction: column; }
    .info-label { font-size: 0.8rem; color: #64748b; }
    .info-value { font-size: 1.25rem; font-weight: 700; color: #1e293b; }
    .info-right { display: flex; gap: 2rem; }
    .info-stat { display: flex; flex-direction: column; align-items: center; }
    .stat-number { font-size: 1.5rem; font-weight: 700; color: #10b981; }
    .stat-label { font-size: 0.75rem; color: #64748b; }

    /* Timeline & List */
    .inscriptions-section { background: white; border-radius: 20px; padding: 1.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; margin-bottom: 1.5rem; }
    .section-title { font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0 0 1.5rem; display: flex; align-items: center; }
    .section-title i { color: #10b981; }
    .timeline { position: relative; padding-left: 2rem; }
    .timeline::before { content: ''; position: absolute; left: 15px; top: 0; bottom: 0; width: 2px; background: #e2e8f0; }
    .timeline-item { position: relative; margin-bottom: 1.5rem; }
    .timeline-item:last-child { margin-bottom: 0; }
    .timeline-marker { position: absolute; left: -2rem; top: 0; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.85rem; z-index: 1; }
    .timeline-marker.success { background: #22c55e; }
    .timeline-marker.pending { background: #f59e0b; }
    .timeline-marker.rejected { background: #ef4444; }
    .timeline-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; }
    .card-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; background: white; border-bottom: 1px solid #e2e8f0; }
    .card-title-row { display: flex; align-items: center; gap: 0.75rem; }
    .year-badge { background: #10b981; color: white; padding: 0.25rem 0.75rem; border-radius: 50px; font-size: 0.8rem; font-weight: 600; }
    .status-badge { padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
    .status-badge.success { background: #dcfce7; color: #15803d; }
    .status-badge.pending { background: #fef3c7; color: #b45309; }
    .status-badge.rejected { background: #fee2e2; color: #dc2626; }
    .card-date { display: flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; color: #64748b; }

    .card-body { padding: 1rem 1.25rem; }
    .info-grid-small { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
    .lbl { font-size: 0.75rem; color: #64748b; display: block; }
    .val { font-size: 0.9rem; font-weight: 500; color: #1e293b; }

    .comment-box { display: flex; align-items: flex-start; gap: 0.75rem; margin-top: 1rem; padding: 0.85rem; background: #eff6ff; border-radius: 8px; border: 1px solid #bfdbfe; color: #1d4ed8; font-size: 0.9rem; }
    .comment-box.error { background: #fef2f2; border-color: #fecaca; color: #dc2626; }
    .comment-content { display: flex; flex-direction: column; gap: 0.25rem; }
    .comment-content p { margin: 0; }

    .card-actions { display: flex; gap: 0.75rem; padding: 1rem 1.25rem; border-top: 1px solid #e2e8f0; background: white; }
    .btn-action { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1rem; border-radius: 10px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s; text-decoration: none; border: none; }
    .btn-action.submit { background: linear-gradient(135deg, #10b981, #059669); color: white; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }
    .btn-action.submit:hover:not(:disabled) { transform: translateY(-2px); }
    .btn-action.submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    .spinner-sm { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }

    .loading-state, .empty-state { text-align: center; padding: 3rem; color: #64748b; }
    .empty-icon { font-size: 2.5rem; color: #10b981; margin-bottom: 1rem; }
    .spinner { width: 30px; height: 30px; border: 3px solid #e2e8f0; border-top-color: #10b981; border-radius: 50%; animation: spin 1s infinite; margin: 0 auto; }
    .error-toast { position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%); padding: 1rem 1.5rem; background: #fee2e2; border: 1px solid #fca5a5; border-radius: 12px; color: #dc2626; display: flex; align-items: center; gap: 0.5rem; font-weight: 500; z-index: 1000; animation: slideUp 0.3s; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }

    @media (max-width: 768px) { .hero-section { flex-direction: column; gap: 1.5rem; text-align: center; } .hero-content { flex-direction: column; } .current-info-card { flex-direction: column; gap: 1.5rem; } .info-grid-small { grid-template-columns: 1fr; } .alert-redirect-card { flex-direction: column; text-align: center; gap: 1rem; } }
  `]
})
export class InscriptionListComponent implements OnInit {
  inscriptions = signal<Inscription[]>([]);
  isLoading = signal(true);
  isSubmitting = signal(false);
  currentUser = signal<any>(null);
  errorMessage = signal<string | null>(null);

  constructor(private inscriptionService: InscriptionService, private authService: AuthService) {}

  ngOnInit() {
    this.currentUser.set(this.authService.currentUser() as unknown as User);
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    const user = this.currentUser();
    if (user?.id) {
      this.inscriptionService.getByDoctorant(user.id).subscribe({
        next: (data) => {
          this.inscriptions.set(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.isLoading.set(false);
          if (err.status !== 404) this.errorMessage.set('Erreur chargement');
        }
      });
    } else {
      this.isLoading.set(false);
    }
  }

  // --- LOGIQUE METIER ---

  currentYear(): number {
    return this.currentUser()?.anneeThese || 1;
  }

  hasPendingRequest(): boolean {
    // Une demande est en cours si elle n'est pas finalisée (ADMIS) ni rejetée
    return this.inscriptions().some(i => i.statut !== 'ADMIS' && !i.statut.includes('REJETE'));
  }

  // --- Helpers UI ---
  getApprovedCount(): number { return this.inscriptions().filter(i => i.statut === 'ADMIS').length; }
  getYearLabel(): string { const y = this.currentYear(); return y === 1 ? '1ère année' : `${y}ème année`; }

  getStatusClass(s: string): string {
    if (s === 'ADMIS') return 'success';
    if (s.includes('REJETE')) return 'rejected';
    return 'pending';
  }

  getStatusBadgeClass(s: string): string { return this.getStatusClass(s); }

  formatStatus(s: string): string {
    const map: Record<string, string> = { 'BROUILLON': 'Brouillon', 'SOUMIS': 'Soumis', 'EN_ATTENTE_ADMIN': 'Attente Admin', 'EN_ATTENTE_DIRECTEUR': 'Attente Directeur', 'ADMIS': 'Validée', 'REJETE_ADMIN': 'Refus Admin', 'REJETE_DIRECTEUR': 'Refus Directeur' };
    return map[s] || s;
  }

  getProgressWidth(c: number, m: number): string { return `${Math.min((c / m) * 100, 100)}%`; }

  submitInscription(id: number) {
    if (!confirm('Soumettre ?')) return;
    this.isSubmitting.set(true);
    this.inscriptionService.soumettre(id).subscribe({
      next: () => { alert('Envoyé !'); this.isSubmitting.set(false); this.loadData(); },
      error: () => { this.errorMessage.set('Erreur soumission'); this.isSubmitting.set(false); }
    });
  }
}