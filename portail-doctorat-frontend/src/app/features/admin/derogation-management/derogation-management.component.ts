import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DerogationService } from '@core/services/derogation.service';
import { Derogation } from '@core/models/derogation.model';
import { MainLayoutComponent } from '@shared/components/main-layout/main-layout.component';

@Component({
  selector: 'app-derogation-management',
  standalone: true,
  imports: [CommonModule, MainLayoutComponent, FormsModule],
  template: `
    <app-main-layout>
      <div class="page-container">

        <!-- Hero Header -->
        <div class="hero-section">
          <div class="hero-content">
            <div class="hero-icon"><i class="bi bi-clock-history"></i></div>
            <div>
              <h1 class="hero-title">Gestion des Dérogations</h1>
              <p class="hero-subtitle">Traitez les demandes de prolongation de thèse</p>
            </div>
          </div>
          <button class="btn-refresh" (click)="loadDerogations()" [disabled]="isLoading()">
            @if (isLoading()) {
              <span class="spinner"></span>
            } @else {
              <i class="bi bi-arrow-clockwise"></i>
            }
            Actualiser
          </button>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card orange">
            <div class="stat-icon"><i class="bi bi-hourglass-split"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ getCountByStatus('EN_ATTENTE') }}</span>
              <span class="stat-label">En attente</span>
            </div>
          </div>
          <div class="stat-card green">
            <div class="stat-icon"><i class="bi bi-check-circle"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ getCountByStatus('APPROUVEE') }}</span>
              <span class="stat-label">Approuvées</span>
            </div>
          </div>
          <div class="stat-card red">
            <div class="stat-icon"><i class="bi bi-x-circle"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ getCountByStatus('REFUSEE') }}</span>
              <span class="stat-label">Refusées</span>
            </div>
          </div>
          <div class="stat-card purple">
            <div class="stat-icon"><i class="bi bi-collection"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ derogations().length }}</span>
              <span class="stat-label">Total</span>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs-container">
          <div class="tabs">
            <button class="tab-btn" [class.active]="activeTab === 'PENDING'" (click)="setTab('PENDING')">
              <i class="bi bi-hourglass-split"></i>
              En attente
              @if (getCountByStatus('EN_ATTENTE') > 0) {
                <span class="tab-badge">{{ getCountByStatus('EN_ATTENTE') }}</span>
              }
            </button>
            <button class="tab-btn" [class.active]="activeTab === 'HISTORY'" (click)="setTab('HISTORY')">
              <i class="bi bi-clock-history"></i>
              Historique
            </button>
          </div>
        </div>

        <!-- Loading -->
        @if (isLoading()) {
          <div class="loading-state">
            <div class="loading-spinner"></div>
            <span>Chargement des demandes...</span>
          </div>
        }

        <!-- Empty State -->
        @if (!isLoading() && filteredDerogations().length === 0) {
          <div class="section-card">
            <div class="empty-state">
              <div class="empty-icon">
                <i class="bi" [ngClass]="activeTab === 'PENDING' ? 'bi-hourglass' : 'bi-clock-history'"></i>
              </div>
              <h3>{{ activeTab === 'PENDING' ? 'Aucune demande en attente' : 'Aucun historique' }}</h3>
              <p>{{ activeTab === 'PENDING' ? 'Toutes les demandes ont été traitées.' : 'Les demandes traitées apparaîtront ici.' }}</p>
            </div>
          </div>
        }

        <!-- Liste des dérogations -->
        @if (!isLoading() && filteredDerogations().length > 0) {
          <div class="section-card">
            <div class="table-container">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Doctorant</th>
                    <th>Type</th>
                    <th>Motif</th>
                    <th>Date demande</th>
                    <th>{{ activeTab === 'PENDING' ? 'Actions' : 'Décision' }}</th>
                  </tr>
                </thead>
                <tbody>
                  @for (derog of filteredDerogations(); track derog.id) {
                    <tr>
                      <td>
                        <div class="user-cell">
                          <div class="user-avatar"><i class="bi bi-person"></i></div>
                          <div class="user-info">
                            <span class="user-name">Doctorant #{{ derog.doctorantId }}</span>
                            <span class="user-id">Dossier #{{ derog.id }}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span class="type-badge" [ngClass]="getTypeBadgeClass(derog.typeDerogation)">
                          {{ formatType(derog.typeDerogation) }}
                        </span>
                      </td>
                      <td>
                        <div class="motif-cell" [title]="derog.motif">
                          {{ truncateMotif(derog.motif) }}
                        </div>
                      </td>
                      <td>
                        <span class="date-badge">
                          <i class="bi bi-calendar3"></i>
                          {{ derog.dateDemande | date:'dd/MM/yyyy' }}
                        </span>
                      </td>
                      <td>
                        @if (activeTab === 'PENDING') {
                          <div class="action-buttons">
                            <button class="btn-accept" (click)="accepter(derog.id)" title="Accepter">
                              <i class="bi bi-check-lg"></i>
                              Accepter
                            </button>
                            <button class="btn-refuse" (click)="refuser(derog.id)" title="Refuser">
                              <i class="bi bi-x-lg"></i>
                              Refuser
                            </button>
                          </div>
                        } @else {
                          <span class="status-badge" [ngClass]="derog.statut === 'APPROUVEE' ? 'success' : 'danger'">
                            <i class="bi" [ngClass]="derog.statut === 'APPROUVEE' ? 'bi-check-circle-fill' : 'bi-x-circle-fill'"></i>
                            {{ derog.statut === 'APPROUVEE' ? 'Accordée' : 'Refusée' }}
                          </span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- Info Card -->
        <div class="info-card">
          <div class="info-icon"><i class="bi bi-info-circle"></i></div>
          <div class="info-content">
            <strong>Règles de dérogation</strong>
            <p>La durée normale de thèse est de 3 ans. Une dérogation peut être accordée pour une prolongation jusqu'à 6 ans maximum. Chaque année supplémentaire nécessite une nouvelle demande.</p>
          </div>
        </div>

      </div>
    </app-main-layout>
  `,
  styles: [`
    .page-container { max-width: 1100px; margin: 0 auto; padding: 0 1.5rem 3rem; }

    /* Hero */
    .hero-section { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 24px; padding: 2rem; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; }
    .hero-content { display: flex; align-items: center; gap: 1.25rem; color: white; }
    .hero-icon { width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; }
    .hero-title { margin: 0; font-size: 1.6rem; font-weight: 800; }
    .hero-subtitle { margin: 0.25rem 0 0; opacity: 0.9; }
    .btn-refresh { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; background: white; color: #d97706; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-refresh:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .btn-refresh:disabled { opacity: 0.7; cursor: not-allowed; }
    .spinner { width: 16px; height: 16px; border: 2px solid #fef3c7; border-top-color: #d97706; border-radius: 50%; animation: spin 0.8s linear infinite; }

    /* Stats */
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: white; border-radius: 16px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; }
    .stat-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .stat-card.orange .stat-icon { background: #fff7ed; color: #ea580c; }
    .stat-card.green .stat-icon { background: #ecfdf5; color: #16a34a; }
    .stat-card.red .stat-icon { background: #fef2f2; color: #dc2626; }
    .stat-card.purple .stat-icon { background: #f3e8ff; color: #9333ea; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: #1e293b; display: block; }
    .stat-label { font-size: 0.8rem; color: #64748b; }

    /* Tabs */
    .tabs-container { display: flex; justify-content: center; margin-bottom: 1.5rem; }
    .tabs { background: #f1f5f9; padding: 5px; border-radius: 50px; display: inline-flex; gap: 5px; }
    .tab-btn { border: none; background: transparent; padding: 0.75rem 1.5rem; border-radius: 40px; font-weight: 600; color: #64748b; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; transition: all 0.2s; }
    .tab-btn:hover { color: #334155; }
    .tab-btn.active { background: white; color: #d97706; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .tab-badge { background: #ef4444; color: white; padding: 0.15rem 0.5rem; border-radius: 50px; font-size: 0.75rem; }

    /* Loading */
    .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem; color: #64748b; gap: 1rem; }
    .loading-spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #f59e0b; border-radius: 50%; animation: spin 0.8s linear infinite; }

    /* Section Card */
    .section-card { background: white; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; overflow: hidden; margin-bottom: 1.5rem; }

    /* Table */
    .table-container { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { padding: 1rem 1.25rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
    .data-table td { padding: 1rem 1.25rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    .data-table tbody tr { transition: background 0.2s; }
    .data-table tbody tr:hover { background: #fffbeb; }

    /* User Cell */
    .user-cell { display: flex; align-items: center; gap: 0.75rem; }
    .user-avatar { width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; display: flex; align-items: center; justify-content: center; font-size: 1rem; }
    .user-info { display: flex; flex-direction: column; }
    .user-name { font-weight: 600; color: #1e293b; }
    .user-id { font-size: 0.8rem; color: #64748b; font-family: monospace; }

    /* Type Badge */
    .type-badge { padding: 0.35rem 0.75rem; border-radius: 8px; font-size: 0.8rem; font-weight: 600; }
    .type-badge.year4 { background: #fef3c7; color: #b45309; }
    .type-badge.year5 { background: #ffedd5; color: #c2410c; }
    .type-badge.year6 { background: #fee2e2; color: #dc2626; }
    .type-badge.other { background: #e0e7ff; color: #4338ca; }

    /* Motif Cell */
    .motif-cell { max-width: 250px; color: #475569; font-size: 0.9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    /* Date Badge */
    .date-badge { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.75rem; background: #f1f5f9; border-radius: 6px; font-size: 0.8rem; color: #475569; }

    /* Action Buttons */
    .action-buttons { display: flex; gap: 0.5rem; }
    .btn-accept { display: flex; align-items: center; gap: 0.35rem; padding: 0.5rem 0.875rem; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; border: none; border-radius: 8px; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-accept:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(34,197,94,0.3); }
    .btn-refuse { display: flex; align-items: center; gap: 0.35rem; padding: 0.5rem 0.875rem; background: white; color: #dc2626; border: 2px solid #fecaca; border-radius: 8px; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-refuse:hover { background: #fef2f2; border-color: #f87171; }

    /* Status Badge */
    .status-badge { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.4rem 0.875rem; border-radius: 50px; font-size: 0.8rem; font-weight: 600; }
    .status-badge.success { background: #dcfce7; color: #15803d; }
    .status-badge.danger { background: #fee2e2; color: #dc2626; }

    /* Empty State */
    .empty-state { padding: 4rem 2rem; text-align: center; }
    .empty-icon { width: 80px; height: 80px; background: #fef3c7; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; }
    .empty-icon i { font-size: 2rem; color: #f59e0b; }
    .empty-state h3 { margin: 0 0 0.5rem; font-size: 1.1rem; color: #1e293b; }
    .empty-state p { margin: 0; color: #64748b; }

    /* Info Card */
    .info-card { display: flex; gap: 1rem; padding: 1.25rem; background: linear-gradient(135deg, #fff7ed, #ffedd5); border: 1px solid #fed7aa; border-radius: 16px; }
    .info-icon { width: 44px; height: 44px; background: #f59e0b; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2rem; flex-shrink: 0; }
    .info-content { color: #9a3412; }
    .info-content strong { display: block; margin-bottom: 0.25rem; }
    .info-content p { margin: 0; font-size: 0.875rem; line-height: 1.5; }

    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 992px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 768px) {
      .hero-section { flex-direction: column; gap: 1.5rem; text-align: center; }
      .hero-content { flex-direction: column; }
      .stats-grid { grid-template-columns: 1fr 1fr; }
      .action-buttons { flex-direction: column; }
    }
  `]
})
export class DerogationManagementComponent implements OnInit {
  derogations = signal<Derogation[]>([]);
  isLoading = signal(true);
  activeTab = 'PENDING';

  constructor(private derogationService: DerogationService) {}

  ngOnInit() { this.loadDerogations(); }

  loadDerogations() {
    this.isLoading.set(true);
    this.derogationService.getAllDerogations().subscribe({
      next: (data: Derogation[]) => { this.derogations.set(data); this.isLoading.set(false); },
      error: (err: any) => { console.error(err); this.isLoading.set(false); }
    });
  }

  setTab(tab: string) { this.activeTab = tab; }

  filteredDerogations() {
    if (this.activeTab === 'PENDING') {
      return this.derogations().filter(d => d.statut === 'EN_ATTENTE');
    }
    return this.derogations().filter(d => d.statut === 'APPROUVEE' || d.statut === 'REFUSEE');
  }

  getCountByStatus(status: string): number {
    return this.derogations().filter(d => d.statut === status).length;
  }

  formatType(type: string): string {
    if (type === 'PROLONGATION_4EME_ANNEE') return '4ème Année';
    if (type === 'PROLONGATION_5EME_ANNEE') return '5ème Année';
    if (type === 'PROLONGATION_6EME_ANNEE') return '6ème Année';
    if (type === 'SUSPENSION_TEMPORAIRE') return 'Suspension';
    return 'Autre';
  }

  getTypeBadgeClass(type: string): string {
    if (type === 'PROLONGATION_4EME_ANNEE') return 'year4';
    if (type === 'PROLONGATION_5EME_ANNEE') return 'year5';
    if (type === 'PROLONGATION_6EME_ANNEE') return 'year6';
    return 'other';
  }

  truncateMotif(motif: string): string {
    return motif.length > 60 ? motif.substring(0, 60) + '...' : motif;
  }

  accepter(id: number) {
    if (confirm('Accorder cette dérogation ?')) {
      this.derogationService.validerDerogation(id, 'Validée par admin').subscribe({
        next: () => { alert('Dérogation accordée.'); this.loadDerogations(); },
        error: () => alert('Erreur lors de la validation')
      });
    }
  }

  refuser(id: number) {
    const motif = prompt('Motif du refus :');
    if (motif) {
      this.derogationService.refuserDerogation(id, motif).subscribe({
        next: () => { alert('Dérogation refusée.'); this.loadDerogations(); },
        error: () => alert('Erreur lors du refus')
      });
    }
  }
}