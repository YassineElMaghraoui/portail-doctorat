import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MainLayoutComponent } from '@shared/components/main-layout/main-layout.component';
import { InscriptionService } from '@core/services/inscription.service';
import { AuthService } from '@core/services/auth.service';
import { Inscription } from '@core/models/inscription.model';

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
          <!-- ✅ BOUTON TOUJOURS VISIBLE -->
          <a routerLink="nouvelle" class="btn-new">
            <i class="bi bi-plus-lg"></i>
            <span>Nouvelle réinscription</span>
          </a>
        </div>

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
              <span class="stat-label">Inscription(s)</span>
            </div>
            <div class="info-stat">
              <span class="stat-number">{{ getApprovedCount() }}</span>
              <span class="stat-label">Validée(s)</span>
            </div>
          </div>
        </div>

        <!-- Explanation -->
        <div class="explanation-card">
          <div class="explanation-icon"><i class="bi bi-info-circle"></i></div>
          <div class="explanation-content">
            <strong>Comment fonctionne la réinscription ?</strong>
            <p>Votre première inscription a été effectuée automatiquement lors de l'acceptation de votre candidature. Chaque année suivante (à partir de la 2ème année), vous devez soumettre une demande de réinscription pour continuer votre parcours doctoral. La durée maximale est de 6 ans avec dérogations.</p>
          </div>
        </div>

        <!-- Loading -->
        @if (isLoading()) {
          <div class="loading-state">
            <div class="loading-spinner"></div>
            <span>Chargement de vos inscriptions...</span>
          </div>
        }

        <!-- Timeline -->
        @if (!isLoading() && inscriptions().length > 0) {
          <div class="inscriptions-section">
            <h3 class="section-title"><i class="bi bi-clock-history me-2"></i>Historique des inscriptions</h3>
            <div class="timeline">
              @for (inscription of inscriptions(); track inscription.id; let i = $index) {
                <div class="timeline-item" [class.first]="i === 0">
                  <div class="timeline-marker" [ngClass]="getStatusClass(inscription.statut)">
                    @if (inscription.statut === 'ADMIS') {
                      <i class="bi bi-check-lg"></i>
                    } @else if (inscription.statut === 'REJETE_ADMIN' || inscription.statut === 'REJETE_DIRECTEUR') {
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
                      <div class="info-row">
                        <span class="info-label">Sujet de thèse</span>
                        <span class="info-value">{{ inscription.sujetThese || 'Non défini' }}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Laboratoire</span>
                        <span class="info-value">{{ inscription.laboratoireAccueil || 'Non défini' }}</span>
                      </div>

                      <!-- ✅ MODIFICATION ICI : Gestion intelligente des commentaires -->

                      <!-- 1. Cas : Rejet par l'ADMINISTRATION -->
                      @if (inscription.statut === 'REJETE_ADMIN' && inscription.commentaireAdmin) {
                        <div class="comment-box error">
                          <i class="bi bi-exclamation-triangle-fill"></i>
                          <div class="comment-content">
                            <strong>Motif du refus (Administration) :</strong>
                            <p>{{ inscription.commentaireAdmin }}</p>
                          </div>
                        </div>
                      }


                      @else if (inscription.statut === 'REJETE_DIRECTEUR' && inscription.commentaireDirecteur) {
                        <div class="comment-box error">
                          <i class="bi bi-exclamation-circle-fill"></i>
                          <div class="comment-content">
                            <strong>Motif du refus (Directeur) :</strong>
                            <p>{{ inscription.commentaireDirecteur }}</p>
                          </div>
                        </div>
                      }


                      @else if (inscription.commentaireDirecteur) {
                        <div class="comment-box">
                          <i class="bi bi-chat-left-text"></i>
                          <div class="comment-content">
                            <strong>Remarque Directeur :</strong>
                            <p>{{ inscription.commentaireDirecteur }}</p>
                          </div>
                        </div>
                      }

                    </div>

                    <!-- Actions pour BROUILLON -->
                    @if (inscription.statut === 'BROUILLON') {
                      <div class="card-actions">
                        <button class="btn-action submit" (click)="submitInscription(inscription.id)" [disabled]="isSubmitting()">
                          @if (isSubmitting()) {
                            <span class="spinner-sm"></span>
                          } @else {
                            <i class="bi bi-send"></i>
                          }
                          Soumettre
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

        <!-- Prérequis -->
        <div class="prerequisites-card">
          <h4 class="prereq-title"><i class="bi bi-list-check me-2"></i>Suivi de vos prérequis</h4>
          <div class="prereq-grid">
            <div class="prereq-item">
              <div class="prereq-icon publications"><i class="bi bi-journal-richtext"></i></div>
              <div class="prereq-info">
                <span class="prereq-label">Publications Q1/Q2</span>
                <div class="prereq-progress">
                  <div class="progress-bar"><div class="progress-fill" [style.width]="getProgressWidth(currentUser()?.nbPublications || 0, 2)"></div></div>
                  <span class="progress-text">{{ currentUser()?.nbPublications || 0 }} / 2</span>
                </div>
              </div>
            </div>
            <div class="prereq-item">
              <div class="prereq-icon conferences"><i class="bi bi-people"></i></div>
              <div class="prereq-info">
                <span class="prereq-label">Conférences internationales</span>
                <div class="prereq-progress">
                  <div class="progress-bar"><div class="progress-fill" [style.width]="getProgressWidth(currentUser()?.nbConferences || 0, 2)"></div></div>
                  <span class="progress-text">{{ currentUser()?.nbConferences || 0 }} / 2</span>
                </div>
              </div>
            </div>
            <div class="prereq-item">
              <div class="prereq-icon formations"><i class="bi bi-book"></i></div>
              <div class="prereq-info">
                <span class="prereq-label">Heures de formation</span>
                <div class="prereq-progress">
                  <div class="progress-bar"><div class="progress-fill" [style.width]="getProgressWidth(currentUser()?.heuresFormation || 0, 200)"></div></div>
                  <span class="progress-text">{{ currentUser()?.heuresFormation || 0 }} / 200h</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Message d'erreur -->
        @if (errorMessage()) {
          <div class="error-toast">
            <i class="bi bi-exclamation-triangle"></i>
            {{ errorMessage() }}
          </div>
        }

      </div>
    </app-main-layout>
  `,
  styles: [`
    .page-container { max-width: 900px; margin: 0 auto; padding: 0 1.5rem 3rem; }
    .hero-section { background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 24px; padding: 2rem; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; position: relative; overflow: hidden; }
    .hero-content { display: flex; align-items: center; gap: 1.25rem; z-index: 2; }
    .hero-icon { width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; color: white; }
    .hero-title { color: white; font-size: 1.6rem; font-weight: 800; margin: 0; }
    .hero-subtitle { color: rgba(255,255,255,0.9); margin: 0.25rem 0 0; font-size: 0.95rem; }
    .btn-new { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: white; color: #059669; border-radius: 12px; font-weight: 600; text-decoration: none; z-index: 2; box-shadow: 0 4px 15px rgba(0,0,0,0.1); transition: all 0.2s; }
    .btn-new:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.15); }
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
    .explanation-card { display: flex; gap: 1rem; padding: 1.25rem; background: linear-gradient(135deg, #ecfdf5, #d1fae5); border: 1px solid #6ee7b7; border-radius: 16px; margin-bottom: 1.5rem; }
    .explanation-icon { width: 44px; height: 44px; background: #10b981; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2rem; flex-shrink: 0; }
    .explanation-content { color: #065f46; }
    .explanation-content strong { display: block; margin-bottom: 0.25rem; }
    .explanation-content p { margin: 0; font-size: 0.875rem; line-height: 1.5; }
    .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; color: #64748b; gap: 1rem; }
    .loading-spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #10b981; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
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
    .info-row { display: flex; flex-direction: column; margin-bottom: 0.75rem; }
    .info-row:last-child { margin-bottom: 0; }
    .info-row .info-label { font-size: 0.75rem; color: #64748b; margin-bottom: 0.15rem; }
    .info-row .info-value { font-size: 0.9rem; font-weight: 500; color: #1e293b; }

    .comment-box { display: flex; align-items: flex-start; gap: 0.75rem; margin-top: 1rem; padding: 0.85rem; background: #eff6ff; border-radius: 8px; border: 1px solid #bfdbfe; color: #1d4ed8; font-size: 0.9rem; }
    .comment-box.error { background: #fef2f2; border-color: #fecaca; color: #dc2626; }
    .comment-content { display: flex; flex-direction: column; gap: 0.25rem; }
    .comment-content p { margin: 0; }

    .card-actions { display: flex; gap: 0.75rem; padding: 1rem 1.25rem; border-top: 1px solid #e2e8f0; background: white; }
    .btn-action { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem 1rem; border-radius: 10px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.2s; text-decoration: none; border: none; }
    .btn-action.submit { background: linear-gradient(135deg, #10b981, #059669); color: white; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }
    .btn-action.submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4); }
    .btn-action.submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    .spinner-sm { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }
    .empty-state { text-align: center; padding: 4rem 2rem; background: white; border-radius: 20px; border: 1px solid #e2e8f0; margin-bottom: 1.5rem; }
    .empty-icon { width: 80px; height: 80px; background: #ecfdf5; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; }
    .empty-icon i { font-size: 2.5rem; color: #10b981; }
    .empty-title { font-size: 1.25rem; font-weight: 700; color: #1e293b; margin: 0 0 0.5rem; }
    .empty-text { color: #64748b; margin: 0; }
    .prerequisites-card { background: white; border-radius: 20px; padding: 1.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .prereq-title { font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0 0 1.25rem; display: flex; align-items: center; }
    .prereq-title i { color: #10b981; }
    .prereq-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .prereq-item { display: flex; align-items: flex-start; gap: 0.75rem; padding: 1rem; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; }
    .prereq-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; }
    .prereq-icon.publications { background: #dbeafe; color: #2563eb; }
    .prereq-icon.conferences { background: #fce7f3; color: #db2777; }
    .prereq-icon.formations { background: #fef3c7; color: #d97706; }
    .prereq-info { flex: 1; }
    .prereq-label { display: block; font-size: 0.8rem; color: #64748b; margin-bottom: 0.5rem; }
    .prereq-progress { display: flex; align-items: center; gap: 0.5rem; }
    .progress-bar { flex: 1; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #10b981, #059669); border-radius: 3px; transition: width 0.3s; }
    .progress-text { font-size: 0.75rem; font-weight: 600; color: #1e293b; white-space: nowrap; }
    .error-toast { position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%); padding: 1rem 1.5rem; background: #fee2e2; border: 1px solid #fca5a5; border-radius: 12px; color: #dc2626; display: flex; align-items: center; gap: 0.5rem; font-weight: 500; z-index: 1000; animation: slideUp 0.3s; }
    @keyframes slideUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
    @media (max-width: 768px) { .hero-section { flex-direction: column; gap: 1.5rem; text-align: center; } .hero-content { flex-direction: column; } .current-info-card { flex-direction: column; gap: 1.5rem; } .prereq-grid { grid-template-columns: 1fr; } }
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
    this.currentUser.set(this.authService.currentUser());
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    const user = this.currentUser();

    if (!user?.id) {
      console.error('❌ Utilisateur non connecté ou ID manquant');
      this.errorMessage.set('Vous devez être connecté pour voir vos inscriptions');
      this.isLoading.set(false);
      return;
    }

    console.log('📤 Chargement des inscriptions pour doctorant ID:', user.id);

    // ✅ Utiliser getByDoctorant avec l'ID de l'utilisateur connecté
    this.inscriptionService.getByDoctorant(user.id).subscribe({
      next: (data) => {
        console.log('✅ Inscriptions reçues:', data);
        this.inscriptions.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('❌ Erreur chargement inscriptions:', err);
        this.isLoading.set(false);

        // Si 404, aucune inscription trouvée (ce n'est pas une erreur)
        if (err.status === 404) {
          this.inscriptions.set([]);
        } else {
          this.errorMessage.set('Erreur lors du chargement des inscriptions');
          setTimeout(() => this.errorMessage.set(null), 5000);
        }
      }
    });
  }

  getApprovedCount(): number {
    return this.inscriptions().filter(i => i.statut === 'ADMIS').length;
  }

  getYearLabel(): string {
    const year = this.currentUser()?.anneeThese || 1;
    return year === 1 ? '1ère année' : `${year}ème année`;
  }

  getStatusClass(statut: string): string {
    if (statut === 'ADMIS') return 'success';
    if (['REJETE_ADMIN', 'REJETE_DIRECTEUR'].includes(statut)) return 'rejected';
    return 'pending';
  }

  getStatusBadgeClass(statut: string): string {
    if (statut === 'ADMIS') return 'success';
    if (['REJETE_ADMIN', 'REJETE_DIRECTEUR'].includes(statut)) return 'rejected';
    return 'pending';
  }

  formatStatus(statut: string): string {
    const map: Record<string, string> = {
      'BROUILLON': 'Brouillon', 'SOUMIS': 'Soumis', 'EN_ATTENTE_ADMIN': 'En attente Admin',
      'EN_ATTENTE_DIRECTEUR': 'En attente Directeur', 'ADMIS': 'Validée',
      'REJETE_ADMIN': 'Refusée (Admin)', 'REJETE_DIRECTEUR': 'Refusée (Directeur)'
    };
    return map[statut] || statut;
  }

  getProgressWidth(current: number, max: number): string {
    return `${Math.min((current / max) * 100, 100)}%`;
  }

  submitInscription(id: number) {
    if (!confirm('Soumettre cette inscription pour validation ?')) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    console.log('📤 Soumission inscription ID:', id);

    this.inscriptionService.soumettre(id).subscribe({
      next: (response) => {
        console.log('✅ Soumission réussie:', response);
        alert('Inscription soumise avec succès !');
        this.isSubmitting.set(false);
        this.loadData();
      },
      error: (err) => {
        console.error('❌ Erreur soumission:', err);
        this.isSubmitting.set(false);

        // Afficher le message d'erreur
        const errorMsg = err.error?.message || err.error?.error || 'Erreur lors de la soumission. Vérifiez les logs du backend.';
        this.errorMessage.set(errorMsg);

        // Cacher le message après 5 secondes
        setTimeout(() => this.errorMessage.set(null), 5000);
      }
    });
  }
}