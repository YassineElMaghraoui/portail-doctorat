import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MainLayoutComponent } from '../../../shared/components/main-layout/main-layout.component';
import { AuthService } from '../../../core/services/auth.service';
import { DerogationService } from '../../../core/services/derogation.service';
import { Derogation, StatutDerogation, TypeDerogation } from '../../../core/models/derogation.model';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-derogation-list',
  standalone: true,
  imports: [CommonModule, RouterLink, MainLayoutComponent],
  template: `
    <app-main-layout>
      <div class="page-container">

        <!-- Hero Header -->
        <div class="hero-section">
          <div class="hero-content">
            <div class="hero-icon"><i class="bi bi-clock-history"></i></div>
            <div>
              <h1 class="hero-title">Mes Dérogations</h1>
              <p class="hero-subtitle">Gérez vos demandes de prolongation du doctorat</p>
            </div>
          </div>

          <div class="header-actions">
            @if (hasPendingRequest()) {
              <div class="status-message warning">
                <i class="bi bi-hourglass-split"></i> <span>Une demande est déjà en cours.</span>
              </div>
            } @else if (currentYear() < 3) {
              <div class="status-message info">
                <i class="bi bi-info-circle"></i> <span>Possible à partir de la 3ème année.</span>
              </div>
            } @else if (currentYear() >= 6) {
              <div class="status-message danger">
                <i class="bi bi-slash-circle"></i> <span>Limite atteinte (6 ans).</span>
              </div>
            } @else {
              <a routerLink="/derogations/nouvelle" class="btn-new">
                <i class="bi bi-plus-lg"></i> <span>Demander une prolongation</span>
              </a>
            }
          </div>
          <div class="hero-decoration"><div class="decoration-circle c1"></div><div class="decoration-circle c2"></div></div>
        </div>

        <!-- Info Banner -->
        <div class="info-banner" [ngClass]="getInfoClass()">
          <div class="info-icon"><i class="bi bi-mortarboard"></i></div>
          <div class="info-content">
            <strong>Situation : Année {{ currentYear() }}</strong>
            @if (currentYear() < 3) { <p>Délai normal (3 ans). Pas de dérogation requise.</p> }
            @else if (currentYear() < 6) { <p>Dérogation obligatoire pour l'année suivante.</p> }
            @else { <p>Durée maximale atteinte.</p> }
          </div>
        </div>

        <!-- Stats -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon pending"><i class="bi bi-hourglass-split"></i></div>
            <div class="stat-info"><span class="stat-value">{{ getEnAttenteCount() }}</span><span class="stat-label">En attente</span></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon approved"><i class="bi bi-check-circle"></i></div>
            <div class="stat-info"><span class="stat-value">{{ getStatCount('APPROUVEE') }}</span><span class="stat-label">Approuvées</span></div>
          </div>
          <div class="stat-card rejected">
            <div class="stat-icon rejected"><i class="bi bi-x-circle"></i></div>
            <div class="stat-info"><span class="stat-value">{{ getStatCount('REFUSEE') }}</span><span class="stat-label">Refusées</span></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon total"><i class="bi bi-folder2"></i></div>
            <div class="stat-info"><span class="stat-value">{{ derogations().length }}</span><span class="stat-label">Total</span></div>
          </div>
        </div>

        <!-- Liste -->
        @if (isLoading()) {
          <div class="loading-state"><div class="loading-spinner"></div><span>Chargement...</span></div>
        } @else if (derogations().length > 0) {
          <div class="list-section">
            <div class="section-header"><h3 class="section-title"><i class="bi bi-list-ul me-2"></i>Historique</h3></div>
            <div class="derogation-list">
              @for (derogation of derogations(); track derogation.id) {
                <div class="derogation-card" [class]="getCardClass(derogation.statut)" [class.expanded]="expandedId() === derogation.id" (click)="toggleExpand(derogation.id)">
                  <div class="card-main">
                    <div class="card-left">
                      <div class="type-badge" [class]="getTypeBadgeClass(derogation.typeDerogation)">
                        <i class="bi" [class]="getTypeIcon(derogation.typeDerogation)"></i>
                      </div>
                    </div>
                    <div class="card-content">
                      <div class="card-header-row">
                        <span class="derogation-type">{{ getTypeLabel(derogation.typeDerogation) }}</span>
                        <span class="status-badge" [class]="getStatutBadgeClass(derogation.statut)">
                          <i class="bi" [class]="getStatutIcon(derogation.statut)"></i> {{ getStatutLabel(derogation.statut) }}
                        </span>
                      </div>
                      <p class="derogation-motif">{{ derogation.motif }}</p>
                      <div class="card-footer-row">
                        <div class="meta-info">
                          <span class="meta-item"><i class="bi bi-calendar3"></i> {{ derogation.dateDemande | date:'dd MMM yyyy' }}</span>
                          @if (derogation.anneeDemandee) { <span class="meta-item"><i class="bi bi-mortarboard"></i> Année {{ derogation.anneeDemandee }}</span> }
                        </div>
                      </div>
                    </div>
                    <div class="card-right"><i class="bi bi-chevron-down expand-icon" [class.rotated]="expandedId() === derogation.id"></i></div>
                  </div>

                  @if (expandedId() === derogation.id) {
                    <div class="card-details" (click)="$event.stopPropagation()">
                      <div class="info-box info"><i class="bi bi-info-circle"></i><span>Détails complets disponibles ici.</span></div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        } @else {
          <div class="empty-state"><div class="empty-icon"><i class="bi bi-inbox"></i></div><h3>Aucune demande</h3><p>L'historique apparaîtra ici.</p></div>
        }
      </div>
    </app-main-layout>
  `,
  styles: [`
    .page-container { max-width: 1000px; margin: 0 auto; padding: 0 1.5rem 3rem; }
    .hero-section { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 24px; padding: 2rem; margin-bottom: 1.5rem; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: space-between; }
    .hero-content { display: flex; align-items: center; gap: 1.25rem; position: relative; z-index: 2; }
    .hero-icon { width: 64px; height: 64px; background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; color: white; }
    .hero-title { color: white; font-size: 1.6rem; font-weight: 800; margin: 0; }
    .hero-subtitle { color: rgba(255, 255, 255, 0.9); margin: 0.25rem 0 0; font-size: 0.95rem; }
    .header-actions { position: relative; z-index: 2; }
    .status-message { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; border-radius: 10px; font-weight: 600; font-size: 0.9rem; background: rgba(255,255,255,0.9); backdrop-filter: blur(5px); box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
    .status-message.warning { color: #d97706; }
    .status-message.info { color: #2563eb; }
    .status-message.danger { color: #dc2626; }
    .btn-new { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: white; color: #d97706; border-radius: 12px; font-weight: 600; text-decoration: none; transition: all 0.2s; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); }
    .btn-new:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15); }
    .hero-decoration { position: absolute; right: 0; top: 0; bottom: 0; width: 200px; }
    .decoration-circle { position: absolute; border-radius: 50%; background: rgba(255, 255, 255, 0.1); }
    .c1 { width: 120px; height: 120px; top: -30px; right: 40px; }
    .c2 { width: 80px; height: 80px; bottom: -20px; right: 120px; }
    .info-banner { display: flex; gap: 1rem; padding: 1.25rem; border-radius: 16px; margin-bottom: 1.5rem; border: 1px solid transparent; }
    .info-banner.normal { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-color: #93c5fd; }
    .info-banner.warning { background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-color: #fdba74; }
    .info-banner.danger { background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-color: #fca5a5; }
    .info-icon { width: 44px; height: 44px; background: rgba(255,255,255,0.5); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0; }
    .info-content strong { display: block; margin-bottom: 0.25rem; font-size: 0.95rem; }
    .info-content p { margin: 0; font-size: 0.875rem; line-height: 1.5; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: white; border-radius: 16px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04); border: 1px solid #e2e8f0; }
    .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .stat-icon.pending { background: #fef3c7; color: #f59e0b; }
    .stat-icon.approved { background: #dcfce7; color: #22c55e; }
    .stat-icon.rejected { background: #fee2e2; color: #ef4444; }
    .stat-icon.total { background: #e0e7ff; color: #6366f1; }
    .stat-info { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: #1e293b; }
    .stat-label { font-size: 0.8rem; color: #64748b; }
    .list-section { background: white; border-radius: 20px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0; overflow: hidden; margin-bottom: 1.5rem; }
    .section-header { padding: 1.25rem 1.5rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
    .section-title { font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0; display: flex; align-items: center; }
    .section-title i { color: #f59e0b; }
    .derogation-list { padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .derogation-card { background: #f8fafc; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; transition: all 0.2s; cursor: pointer; }
    .derogation-card:hover { border-color: #cbd5e1; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }
    .derogation-card.expanded { border-color: #f59e0b; box-shadow: 0 4px 20px rgba(245, 158, 11, 0.15); }
    .card-main { display: flex; align-items: center; padding: 1.25rem; }
    .card-left { padding-right: 1rem; }
    .card-content { flex: 1; }
    .card-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .derogation-type { font-weight: 700; color: #1e293b; font-size: 1rem; }
    .derogation-motif { color: #475569; font-size: 0.9rem; line-height: 1.5; margin: 0; }
    .card-footer-row { display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem; }
    .meta-info { display: flex; gap: 1rem; }
    .meta-item { display: flex; align-items: center; gap: 0.35rem; font-size: 0.8rem; color: #64748b; }
    .card-right { padding-left: 1rem; }
    .expand-icon { color: #94a3b8; font-size: 1.25rem; transition: transform 0.3s; }
    .expand-icon.rotated { transform: rotate(180deg); }
    .card-details { background: white; border-top: 1px solid #e2e8f0; padding: 1.5rem; animation: slideDown 0.3s ease-out; }
    .type-badge { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .type-badge.type-4 { background: #fef3c7; color: #f59e0b; }
    .type-badge.type-5 { background: #fed7aa; color: #ea580c; }
    .type-badge.type-6 { background: #fecaca; color: #dc2626; }
    .type-badge.type-other { background: #e0e7ff; color: #6366f1; }
    .status-badge { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.75rem; border-radius: 50px; font-size: 0.75rem; font-weight: 600; }
    .status-badge.badge-pending { background: #fef3c7; color: #b45309; }
    .status-badge.badge-approved { background: #dcfce7; color: #15803d; }
    .status-badge.badge-rejected { background: #fee2e2; color: #dc2626; }
    .status-badge.badge-expired { background: #f1f5f9; color: #64748b; }
    .loading-state, .empty-state { text-align: center; padding: 4rem; color: #64748b; background: white; border-radius: 20px; border: 1px solid #e2e8f0; }
    .empty-icon { font-size: 2.5rem; color: #f59e0b; margin-bottom: 1rem; }
    .spinner { width: 16px; height: 16px; border: 2px solid #e0e7ff; border-top-color: #4f46e5; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    @media (max-width: 768px) { .hero-section { flex-direction: column; text-align: center; gap: 1.5rem; } .stats-grid { grid-template-columns: repeat(2, 1fr); } }
  `]
})
export class DerogationListComponent implements OnInit {
  derogations = signal<Derogation[]>([]);
  currentUser = signal<User | null>(null);
  isLoading = signal(true);
  expandedId = signal<number | null>(null);

  constructor(
      private authService: AuthService,
      private derogationService: DerogationService
  ) {}

  ngOnInit(): void {
    // ✅ CORRECTION TS2345: Casting pour résoudre le conflit de types
    this.currentUser.set(this.authService.currentUser() as unknown as User);
    this.loadDerogations();
  }

  loadDerogations(): void {
    const user = this.currentUser();
    if (user && user.id) {
      this.derogationService.getMesDerogations(user.id).subscribe({
        next: (data) => {
          this.derogations.set(data);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
    } else {
      this.isLoading.set(false);
    }
  }

  currentYear(): number {
    return this.currentUser()?.anneeThese || 1;
  }

  hasPendingRequest(): boolean {
    return this.derogations().some(d =>
        d.statut === 'EN_ATTENTE' ||
        d.statut === 'EN_ATTENTE_DIRECTEUR' ||
        d.statut === 'EN_ATTENTE_ADMIN'
    );
  }

  getInfoClass(): string {
    const y = this.currentYear();
    if (y < 3) return 'normal';
    if (y >= 6) return 'danger';
    return 'warning';
  }

  toggleExpand(id: number): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  getEnAttenteCount(): number {
    return this.derogations().filter(d => ['EN_ATTENTE_DIRECTEUR', 'EN_ATTENTE_ADMIN', 'EN_ATTENTE'].includes(d.statut)).length;
  }

  getStatCount(statut: string): number {
    return this.derogations().filter(d => d.statut === statut).length;
  }

  getTypeLabel(type: TypeDerogation): string {
    const labels: Record<string, string> = {
      'PROLONGATION_4EME_ANNEE': 'Prolongation 4ème année',
      'PROLONGATION_5EME_ANNEE': 'Prolongation 5ème année',
      'PROLONGATION_6EME_ANNEE': 'Prolongation 6ème année',
      'SUSPENSION_TEMPORAIRE': 'Suspension temporaire',
      'AUTRE': 'Autre demande'
    };
    return labels[type] || type;
  }

  getTypeIcon(type: TypeDerogation): string {
    const icons: Record<string, string> = {
      'PROLONGATION_4EME_ANNEE': 'bi-4-circle',
      'PROLONGATION_5EME_ANNEE': 'bi-5-circle',
      'PROLONGATION_6EME_ANNEE': 'bi-6-circle',
      'SUSPENSION_TEMPORAIRE': 'bi-pause-circle'
    };
    return icons[type] || 'bi-file-text';
  }

  getTypeBadgeClass(type: TypeDerogation): string {
    const classes: Record<string, string> = {
      'PROLONGATION_4EME_ANNEE': 'type-4',
      'PROLONGATION_5EME_ANNEE': 'type-5',
      'PROLONGATION_6EME_ANNEE': 'type-6'
    };
    return classes[type] || 'type-other';
  }

  getCardClass(s: StatutDerogation): string {
    const map: Record<string, string> = {
      'EN_ATTENTE_DIRECTEUR': 'card-pending',
      'EN_ATTENTE_ADMIN': 'card-pending',
      'EN_ATTENTE': 'card-pending',
      'APPROUVEE': 'card-approved',
      'REFUSEE': 'card-rejected'
    };
    return map[s] || 'card-expired';
  }

  getStatutBadgeClass(s: StatutDerogation): string {
    const map: Record<string, string> = {
      'EN_ATTENTE_DIRECTEUR': 'badge-pending',
      'EN_ATTENTE_ADMIN': 'badge-pending',
      'EN_ATTENTE': 'badge-pending',
      'APPROUVEE': 'badge-approved',
      'REFUSEE': 'badge-rejected'
    };
    return map[s] || 'badge-expired';
  }

  getStatutIcon(s: StatutDerogation): string {
    if (s === 'APPROUVEE') return 'bi-check-circle-fill';
    if (s === 'REFUSEE') return 'bi-x-circle-fill';
    return 'bi-hourglass-split';
  }

  getStatutLabel(s: StatutDerogation): string {
    const labels: Record<string, string> = {
      'EN_ATTENTE_DIRECTEUR': 'Attente Directeur',
      'EN_ATTENTE_ADMIN': 'Attente Admin',
      'EN_ATTENTE': 'En attente',
      'APPROUVEE': 'Approuvée',
      'REFUSEE': 'Refusée',
      'EXPIREE': 'Expirée',
      'ANNULEE': 'Annulée'
    };
    return labels[s] || s;
  }
}