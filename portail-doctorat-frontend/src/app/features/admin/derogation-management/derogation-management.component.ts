import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DerogationService } from '@core/services/derogation.service';
import { AuthService } from '@core/services/auth.service';
import { UserService } from '@core/services/user.service';
import { Derogation, StatutDerogation } from '@core/models/derogation.model';
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
            @if (isLoading()) { <span class="spinner"></span> } @else { <i class="bi bi-arrow-clockwise"></i> }
            Actualiser
          </button>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card orange">
            <div class="stat-icon"><i class="bi bi-hourglass-split"></i></div>
            <div class="stat-info"><span class="stat-value">{{ getEnAttenteAdminCount() }}</span><span class="stat-label">À traiter (Admin)</span></div>
          </div>
          <div class="stat-card blue">
            <div class="stat-icon"><i class="bi bi-person-badge"></i></div>
            <div class="stat-info"><span class="stat-value">{{ getEnAttenteDirecteurCount() }}</span><span class="stat-label">Chez Directeur</span></div>
          </div>
          <div class="stat-card green">
            <div class="stat-icon"><i class="bi bi-check-circle"></i></div>
            <div class="stat-info"><span class="stat-value">{{ getCountByStatus('APPROUVEE') }}</span><span class="stat-label">Approuvées</span></div>
          </div>
          <div class="stat-card red">
            <div class="stat-icon"><i class="bi bi-x-circle"></i></div>
            <div class="stat-info"><span class="stat-value">{{ getCountByStatus('REFUSEE') }}</span><span class="stat-label">Refusées</span></div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs-container">
          <div class="tabs">
            <button class="tab-btn" [class.active]="activeTab === 'PENDING_ADMIN'" (click)="setTab('PENDING_ADMIN')">
              <i class="bi bi-hourglass-split"></i> À traiter
              @if (getEnAttenteAdminCount() > 0) { <span class="tab-badge">{{ getEnAttenteAdminCount() }}</span> }
            </button>
            <button class="tab-btn" [class.active]="activeTab === 'PENDING_DIRECTEUR'" (click)="setTab('PENDING_DIRECTEUR')">
              <i class="bi bi-person-badge"></i> Chez directeur
              @if (getEnAttenteDirecteurCount() > 0) { <span class="tab-badge info">{{ getEnAttenteDirecteurCount() }}</span> }
            </button>
            <button class="tab-btn" [class.active]="activeTab === 'HISTORY'" (click)="setTab('HISTORY')">
              <i class="bi bi-clock-history"></i> Historique
            </button>
          </div>
        </div>

        <!-- Loading -->
        @if (isLoading()) {
          <div class="loading-state"><div class="loading-spinner"></div><span>Chargement des demandes...</span></div>
        }

        <!-- Liste des dérogations (Tableau) -->
        @if (!isLoading()) {
          <div class="section-card">
            <div class="table-container">
              <table class="data-table">
                <thead>
                <tr>
                  <th>Doctorant</th>
                  <th>Directeur</th>
                  <th>Type</th>
                  <th>Date demande</th>
                  <th>Statut</th>
                  <th></th>
                </tr>
                </thead>
                <tbody>
                  @for (derog of filteredDerogations(); track derog.id) {
                    <tr class="clickable" (click)="showDetails(derog)">
                      <td>
                        <div class="user-cell">
                          <div class="user-avatar">{{ getInitials(derog) }}</div>
                          <div class="user-info">
                            <span class="user-name">{{ derog.doctorantPrenom }} {{ derog.doctorantNom }}</span>
                            <span class="user-id">Dossier #{{ derog.id }}</span>
                          </div>
                        </div>
                      </td>
                      <td class="fw-bold text-dark">{{ getDirecteurName(derog) }}</td>
                      <td><span class="type-badge" [ngClass]="getTypeBadgeClass(derog.typeDerogation)">{{ formatType(derog.typeDerogation) }}</span></td>
                      <td><span class="date-badge">{{ derog.dateDemande | date:'dd/MM/yyyy' }}</span></td>
                      <td>
                        <span class="status-badge" [ngClass]="getStatusBadgeClass(derog.statut)">
                          <i class="bi" [ngClass]="getStatusIcon(derog.statut)"></i> {{ getStatusLabel(derog.statut) }}
                        </span>
                      </td>
                      <td><i class="bi bi-chevron-right text-muted"></i></td>
                    </tr>
                  }
                  @if (filteredDerogations().length === 0) {
                    <tr><td colspan="6" class="text-center py-4 text-muted">Aucune demande dans cette catégorie.</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- MODAL DÉTAILS -->
        @if (selectedDerogation()) {
          <div class="modal-overlay" (click)="closeDetails()">
            <div class="modal-content" (click)="$event.stopPropagation()">
              <div class="modal-header">
                <h3><i class="bi bi-file-earmark-text"></i> Détails de la demande #{{ selectedDerogation()?.id }}</h3>
                <button class="btn-close" (click)="closeDetails()"><i class="bi bi-x-lg"></i></button>
              </div>

              <div class="modal-body">
                <!-- WORKFLOW VISUEL -->
                <div class="workflow-container">
                  <!-- Étape 1 : Soumission -->
                  <div class="step completed">
                    <div class="step-circle"><i class="bi bi-check-lg"></i></div>
                    <span class="step-label">Demande soumise</span>
                    <span class="step-date">{{ selectedDerogation()?.dateDemande | date:'dd/MM/yyyy' }}</span>
                  </div>

                  <div class="step-line" [class.active]="getWorkflowStep(selectedDerogation()!) >= 2"></div>

                  <!-- Étape 2 : Directeur -->
                  <div class="step" [ngClass]="getStepClass(selectedDerogation()!, 2)">
                    <div class="step-circle">
                      @if(getWorkflowStep(selectedDerogation()!) > 2) { <i class="bi bi-check-lg"></i> }
                      @else if(getWorkflowStep(selectedDerogation()!) === 2) { <i class="bi bi-hourglass-split"></i> }
                      @else { <i class="bi bi-person"></i> }
                    </div>
                    <span class="step-label">Directeur</span>
                  </div>

                  <div class="step-line" [class.active]="getWorkflowStep(selectedDerogation()!) >= 3"></div>

                  <!-- Étape 3 : Administration -->
                  <div class="step" [ngClass]="getStepClass(selectedDerogation()!, 3)">
                    <div class="step-circle">
                      @if(selectedDerogation()?.statut === 'APPROUVEE') { <i class="bi bi-check-lg"></i> }
                      @else if(selectedDerogation()?.statut === 'EN_ATTENTE_ADMIN') { <i class="bi bi-circle-fill"></i> }
                      @else { <i class="bi bi-building"></i> }
                    </div>
                    <span class="step-label">Administration</span>
                  </div>
                </div>

                <div class="detail-grid">
                  <div class="detail-item">
                    <label>Doctorant</label>
                    <span class="value">{{ selectedDerogation()?.doctorantPrenom }} {{ selectedDerogation()?.doctorantNom }}</span>
                  </div>
                  <div class="detail-item">
                    <label>Type</label>
                    <span class="type-badge" [ngClass]="getTypeBadgeClass(selectedDerogation()!.typeDerogation)">
                      {{ formatType(selectedDerogation()!.typeDerogation) }}
                    </span>
                  </div>
                  <div class="detail-item full-width">
                    <label>Motif de la demande</label>
                    <div class="motif-box">{{ selectedDerogation()?.motif }}</div>
                  </div>
                  @if (selectedDerogation()?.commentaireDirecteur) {
                    <div class="detail-item full-width">
                      <label>Avis du Directeur ({{ getDirecteurName(selectedDerogation()) }})</label>
                      <div class="comment-box director">{{ selectedDerogation()?.commentaireDirecteur }}</div>
                    </div>
                  }
                </div>
              </div>

              @if (selectedDerogation()?.statut === 'EN_ATTENTE_ADMIN') {
                <div class="modal-footer">
                  <button class="btn-refuse" (click)="refuser(selectedDerogation()!.id)">Refuser</button>
                  <button class="btn-accept" (click)="accepter(selectedDerogation()!.id)">Accepter</button>
                </div>
              }
            </div>
          </div>
        }

      </div>
    </app-main-layout>
  `,
  styles: [`
    /* CSS COMMUN AUX DEUX PAGES */
    .page-container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem 3rem; }
    .hero-section { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 24px; padding: 2rem; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; color: white; }
    .hero-content { display: flex; align-items: center; gap: 1.25rem; }
    .hero-icon { width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; }
    .hero-title { margin: 0; font-size: 1.6rem; font-weight: 800; }
    .hero-subtitle { margin: 0.25rem 0 0; opacity: 0.9; }
    .btn-refresh { padding: 0.75rem 1.25rem; background: white; color: #d97706; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; display: flex; gap: 0.5rem; align-items: center; }

    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: white; border-radius: 16px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; }
    .stat-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
    .stat-card.orange .stat-icon { background: #fff7ed; color: #ea580c; }
    .stat-card.blue .stat-icon { background: #eff6ff; color: #3b82f6; }
    .stat-card.green .stat-icon { background: #ecfdf5; color: #16a34a; }
    .stat-card.red .stat-icon { background: #fef2f2; color: #dc2626; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: #1e293b; display: block; }
    .stat-label { font-size: 0.8rem; color: #64748b; }

    .tabs-container { display: flex; justify-content: center; margin-bottom: 1.5rem; }
    .tabs { background: #f1f5f9; padding: 5px; border-radius: 50px; display: inline-flex; gap: 5px; }
    .tab-btn { border: none; background: transparent; padding: 0.75rem 1.5rem; border-radius: 40px; font-weight: 600; color: #64748b; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; }
    .tab-btn.active { background: white; color: #d97706; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .tab-badge { background: #ef4444; color: white; padding: 0.15rem 0.5rem; border-radius: 50px; font-size: 0.75rem; }
    .tab-badge.info { background: #3b82f6; }

    .section-card { background: white; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; overflow: hidden; }
    .table-container { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { padding: 1rem 1.25rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
    .data-table td { padding: 1rem 1.25rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    .data-table tbody tr { transition: background 0.2s; cursor: pointer; }
    .data-table tbody tr:hover { background: #fffbeb; }

    .user-cell { display: flex; align-items: center; gap: 0.75rem; }
    .user-avatar { width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; }
    .user-info { display: flex; flex-direction: column; }
    .user-name { font-weight: 600; color: #1e293b; }
    .user-id { font-size: 0.8rem; color: #64748b; }

    /* Badges */
    .type-badge, .status-badge, .date-badge { padding: 0.35rem 0.75rem; border-radius: 50px; font-size: 0.8rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.35rem; }
    .type-badge.year4 { background: #fef3c7; color: #b45309; }
    .type-badge.year5 { background: #ffedd5; color: #c2410c; }
    .type-badge.year6 { background: #fee2e2; color: #dc2626; }
    .type-badge.other { background: #e0e7ff; color: #4338ca; }
    .status-badge.pending-directeur { background: #dbeafe; color: #1d4ed8; }
    .status-badge.pending-admin { background: #fef3c7; color: #b45309; }
    .status-badge.success { background: #dcfce7; color: #15803d; }
    .status-badge.danger { background: #fee2e2; color: #dc2626; }
    .date-badge { background: #f1f5f9; color: #475569; border-radius: 6px; }

    /* Modal & Workflow */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.2s; }
    .modal-content { background: white; border-radius: 20px; width: 100%; max-width: 650px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px rgba(0,0,0,0.25); animation: slideUp 0.3s; }
    .modal-header { padding: 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #fcfcfc; }
    .modal-header h3 { margin: 0; font-size: 1.2rem; color: #1e293b; display: flex; align-items: center; gap: 0.5rem; }
    .btn-close { border: none; background: transparent; font-size: 1.25rem; color: #64748b; cursor: pointer; }

    .modal-body { padding: 2rem; }

    .workflow-container { display: flex; align-items: center; justify-content: center; margin-bottom: 2rem; padding: 1.5rem; background: #f8fafc; border-radius: 16px; border: 1px solid #f1f5f9; }
    .step { display: flex; flex-direction: column; align-items: center; position: relative; z-index: 2; width: 100px; text-align: center; }
    .step-circle { width: 44px; height: 44px; border-radius: 50%; background: #e2e8f0; color: #94a3b8; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; margin-bottom: 0.5rem; transition: all 0.3s; border: 4px solid #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
    .step-label { font-size: 0.75rem; font-weight: 600; color: #64748b; }
    .step-date { font-size: 0.65rem; color: #94a3b8; }

    .step.completed .step-circle { background: #22c55e; color: white; }
    .step.current .step-circle { background: #f59e0b; color: white; animation: pulse 2s infinite; }
    .step.rejected .step-circle { background: #ef4444; color: white; }

    .step-line { flex: 1; height: 3px; background: #e2e8f0; margin-top: -25px; position: relative; z-index: 1; }
    .step-line.active { background: #22c55e; }

    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .detail-item { display: flex; flex-direction: column; gap: 0.4rem; }
    .detail-item.full-width { grid-column: 1 / -1; }
    .detail-item label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
    .detail-item .value { font-size: 1rem; color: #1e293b; font-weight: 500; }
    .motif-box { background: #fefce8; padding: 1rem; border-radius: 8px; border: 1px solid #fef08a; color: #854d0e; line-height: 1.5; font-size: 0.95rem; }
    .comment-box { background: #f1f5f9; padding: 1rem; border-radius: 8px; color: #334155; font-style: italic; }
    .comment-box.director { border-left: 3px solid #f59e0b; }

    .modal-footer { padding: 1.5rem; border-top: 1px solid #e2e8f0; display: flex; gap: 1rem; justify-content: flex-end; background: #fcfcfc; }
    .btn-accept, .btn-refuse { padding: 0.75rem 1.5rem; border-radius: 10px; font-weight: 600; cursor: pointer; border: none; }
    .btn-accept { background: #22c55e; color: white; }
    .btn-refuse { background: #fff; border: 1px solid #ef4444; color: #ef4444; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(245, 158, 11, 0); } 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); } }
  `]
})
export class DerogationManagementComponent implements OnInit {
  derogations = signal<any[]>([]);
  isLoading = signal(true);
  activeTab = 'PENDING_ADMIN';
  selectedDerogation = signal<any>(null);

  constructor(
      private derogationService: DerogationService,
      private userService: UserService,
      private authService: AuthService
  ) {}

  ngOnInit() { this.loadDerogations(); }

  loadDerogations() {
    this.isLoading.set(true);
    this.derogationService.getAllDerogations().subscribe({
      next: (data: any[]) => this.enrichWithDirectorInfo(data),
      error: () => this.isLoading.set(false)
    });
  }

  enrichWithDirectorInfo(data: any[]) {
    if (data.length === 0) { this.derogations.set([]); this.isLoading.set(false); return; }
    let loaded = 0;
    data.forEach(d => {
      // Pour avoir le directeur, on cherche le doctorant d'abord (s'il n'est pas déjà peuplé)
      this.userService.getUserById(d.doctorantId).subscribe(doc => {
        d.doctorant = doc;
        if(doc.directeurId) {
          this.userService.getUserById(doc.directeurId).subscribe(dir => {
            d.directeur = dir;
            loaded++;
            if(loaded >= data.length) { this.derogations.set(data); this.isLoading.set(false); }
          });
        } else {
          loaded++;
          if(loaded >= data.length) { this.derogations.set(data); this.isLoading.set(false); }
        }
      });
    });
  }

  setTab(tab: string) { this.activeTab = tab; }

  filteredDerogations() {
    const all = this.derogations();
    if (this.activeTab === 'PENDING_ADMIN') return all.filter(d => d.statut === 'EN_ATTENTE_ADMIN');
    if (this.activeTab === 'PENDING_DIRECTEUR') return all.filter(d => d.statut === 'EN_ATTENTE_DIRECTEUR' || d.statut === 'EN_ATTENTE');
    return all.filter(d => d.statut === 'APPROUVEE' || d.statut === 'REFUSEE');
  }

  // Helpers
  getEnAttenteAdminCount() { return this.derogations().filter(d => d.statut === 'EN_ATTENTE_ADMIN').length; }
  getEnAttenteDirecteurCount() { return this.derogations().filter(d => d.statut === 'EN_ATTENTE_DIRECTEUR' || d.statut === 'EN_ATTENTE').length; }
  getCountByStatus(st: string) { return this.derogations().filter(d => d.statut === st).length; }
  getInitials(d: any) { return (d.doctorantPrenom?.charAt(0) || '') + (d.doctorantNom?.charAt(0) || ''); }
  getDirecteurName(d: any) { return d?.directeur ? `${d.directeur.prenom} ${d.directeur.nom}` : 'Inconnu'; }
  formatType(t: string) { return t.includes('4') ? '4ème Année' : t.includes('5') ? '5ème Année' : '6ème Année'; }
  getTypeBadgeClass(t: string) { return t.includes('4') ? 'year4' : t.includes('5') ? 'year5' : 'year6'; }
  getStatusBadgeClass(s: string) { return s.includes('ADMIN') ? 'pending-admin' : s.includes('DIRECTEUR') ? 'pending-directeur' : s === 'APPROUVEE' ? 'success' : 'danger'; }
  getStatusIcon(s: string) { return s.includes('ADMIN') ? 'bi-hourglass-split' : s.includes('DIRECTEUR') ? 'bi-person-badge' : s === 'APPROUVEE' ? 'bi-check-circle-fill' : 'bi-x-circle-fill'; }
  getStatusLabel(s: string) { return s === 'EN_ATTENTE_ADMIN' ? 'À traiter' : s.includes('DIRECTEUR') ? 'Chez Directeur' : s === 'APPROUVEE' ? 'Approuvée' : 'Refusée'; }
  truncateMotif(m: string) { return m.length > 30 ? m.substring(0, 30) + '...' : m; }

  // Modal
  showDetails(d: any) { this.selectedDerogation.set(d); }
  closeDetails() { this.selectedDerogation.set(null); }

  getWorkflowStep(d: any): number {
    if (d.statut === 'EN_ATTENTE_DIRECTEUR' || d.statut === 'EN_ATTENTE') return 1; // Etape 1 passée (soumission), en cours 2
    if (d.statut === 'EN_ATTENTE_ADMIN') return 3; // Etape 2 passée (directeur), en cours 3
    if (d.statut === 'APPROUVEE' || d.statut === 'REFUSEE') return 4; // Fini
    return 1;
  }

  getStepClass(d: any, step: number) {
    const current = this.getWorkflowStep(d);
    if(current > step) return 'completed'; // Etape passée
    if(current === step) return 'current'; // Etape en cours (ou c'est ici qu'on attend)
    // Cas spécial pour EN_ATTENTE_ADMIN (step 3) -> step 2 (Directeur) est completed
    if(d.statut === 'EN_ATTENTE_ADMIN' && step === 2) return 'completed';
    return '';
  }

  accepter(id: number) {
    if(confirm('Valider ?')) this.derogationService.approuverDerogation(id, this.authService.currentUser()!.id, 'OK').subscribe(() => { this.loadDerogations(); this.closeDetails(); });
  }
  refuser(id: number) {
    const m = prompt('Motif ?');
    if(m) this.derogationService.refuserDerogation(id, this.authService.currentUser()!.id, m).subscribe(() => { this.loadDerogations(); this.closeDetails(); });
  }
}