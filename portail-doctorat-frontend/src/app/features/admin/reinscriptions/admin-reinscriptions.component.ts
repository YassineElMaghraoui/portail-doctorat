import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '@shared/components/main-layout/main-layout.component';
import { InscriptionService } from '@core/services/inscription.service';
import { UserService } from '@core/services/user.service';
import { User } from '@core/models/user.model';

@Component({
    selector: 'app-admin-reinscriptions',
    standalone: true,
    imports: [CommonModule, FormsModule, MainLayoutComponent],
    template: `
        <!-- ... (Tout le template reste identique à votre code fourni) ... -->
        <!-- Je ne le remets pas pour économiser de la place, il est parfait -->
        <app-main-layout>
            <div class="page-container">

                <div class="hero-section">
                    <div class="hero-content">
                        <div class="hero-icon"><i class="bi bi-journal-check"></i></div>
                        <div>
                            <h1 class="hero-title">Gestion des Réinscriptions</h1>
                            <p class="hero-subtitle">Validez les dossiers annuels des doctorants</p>
                        </div>
                    </div>
                    <button class="btn-refresh" (click)="loadData()" [disabled]="isLoading()">
                        @if (isLoading()) { <span class="spinner"></span> } @else { <i class="bi bi-arrow-clockwise"></i> }
                        Actualiser
                    </button>
                </div>

                <div class="stats-grid">
                    <div class="stat-card orange">
                        <div class="stat-icon"><i class="bi bi-hourglass-split"></i></div>
                        <div class="stat-info"><span class="stat-value">{{ getCount('EN_ATTENTE_ADMIN') }}</span><span class="stat-label">À traiter (Admin)</span></div>
                    </div>
                    <div class="stat-card blue">
                        <div class="stat-icon"><i class="bi bi-person-badge"></i></div>
                        <div class="stat-info"><span class="stat-value">{{ getCount('EN_ATTENTE_DIRECTEUR') }}</span><span class="stat-label">Chez Directeur</span></div>
                    </div>
                    <div class="stat-card green">
                        <div class="stat-icon"><i class="bi bi-check-circle"></i></div>
                        <div class="stat-info"><span class="stat-value">{{ getCount('ADMIS') }}</span><span class="stat-label">Validées</span></div>
                    </div>
                    <div class="stat-card red">
                        <div class="stat-icon"><i class="bi bi-x-circle"></i></div>
                        <div class="stat-info"><span class="stat-value">{{ getCount('REJETE') }}</span><span class="stat-label">Refusées</span></div>
                    </div>
                </div>

                <div class="tabs-container">
                    <div class="tabs">
                        <button class="tab-btn" [class.active]="activeTab === 'EN_ATTENTE_ADMIN'" (click)="setTab('EN_ATTENTE_ADMIN')">
                            <i class="bi bi-hourglass-split"></i> À traiter
                            @if (getCount('EN_ATTENTE_ADMIN') > 0) { <span class="tab-badge">{{ getCount('EN_ATTENTE_ADMIN') }}</span> }
                        </button>
                        <button class="tab-btn" [class.active]="activeTab === 'EN_ATTENTE_DIRECTEUR'" (click)="setTab('EN_ATTENTE_DIRECTEUR')">
                            <i class="bi bi-person-badge"></i> Chez directeur
                            @if (getCount('EN_ATTENTE_DIRECTEUR') > 0) { <span class="tab-badge info">{{ getCount('EN_ATTENTE_DIRECTEUR') }}</span> }
                        </button>
                        <button class="tab-btn" [class.active]="activeTab === 'HISTORY'" (click)="setTab('HISTORY')">
                            <i class="bi bi-clock-history"></i> Historique
                        </button>
                    </div>
                </div>

                @if (isLoading()) { <div class="loading-state"><div class="loading-spinner"></div><span>Chargement des dossiers...</span></div> }
                @else if (filteredInscriptions().length === 0) {
                    <div class="section-card"><div class="empty-state"><div class="empty-icon"><i class="bi bi-inbox"></i></div><h3>Aucun dossier</h3><p>Rien à afficher ici pour le moment.</p></div></div>
                }

                @if (!isLoading() && filteredInscriptions().length > 0) {
                    <div class="section-card">
                        <div class="table-container">
                            <table class="data-table">
                                <thead>
                                <tr>
                                    <th>Doctorant</th>
                                    <th>Directeur</th>
                                    <th>Année</th>
                                    <th>Sujet</th>
                                    <th>Date soumission</th>
                                    <th>Statut</th>
                                </tr>
                                </thead>
                                <tbody>
                                    @for (insc of filteredInscriptions(); track insc.id) {
                                        <tr class="clickable" (click)="showDetails(insc)">
                                            <td>
                                                <div class="user-cell">
                                                    <div class="user-avatar blue">{{ getInitials(insc) }}</div>
                                                    <div class="user-info">
                                                        <span class="user-name">{{ getDoctorantName(insc) }}</span>
                                                        <span class="user-id">Mat: {{ insc.doctorant?.username || 'N/A' }}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div class="d-flex flex-column">
                                                    <span class="fw-bold text-dark" style="font-size: 0.9rem;">{{ getDirecteurName(insc) }}</span>
                                                </div>
                                            </td>
                                            <td><span class="badge year">{{ insc.anneeInscription }}ème</span></td>
                                            <td><div class="motif-cell" [title]="insc.sujetThese">{{ truncate(insc.sujetThese) }}</div></td>
                                            <td><span class="date-badge">{{ insc.createdAt | date:'dd/MM/yyyy' }}</span></td>
                                            <td>
                                                <span class="status-badge" [ngClass]="getStatusClass(insc.statut)">
                                                    <i class="bi" [ngClass]="getStatusIcon(insc.statut)"></i>
                                                    {{ formatStatus(insc.statut) }}
                                                </span>
                                            </td>
                                        </tr>
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                }

                @if (selectedInscription()) {
                    <div class="modal-overlay" (click)="closeDetails()">
                        <div class="modal-content" (click)="$event.stopPropagation()">
                            <div class="modal-header">
                                <h3><i class="bi bi-file-earmark-text"></i> Détails Réinscription #{{ selectedInscription().id }}</h3>
                                <button class="btn-close" (click)="closeDetails()"><i class="bi bi-x-lg"></i></button>
                            </div>
                            <div class="modal-body">
                                <div class="workflow-container">

                                    <!-- Étape 1 : Soumission -->
                                    <div class="step completed">
                                        <div class="step-circle"><i class="bi bi-check-lg"></i></div>
                                        <span class="step-label">Soumission</span>
                                    </div>

                                    <div class="step-line" [class.active]="getWorkflowStep(selectedInscription()) >= 2"></div>

                                    <!-- Étape 2 : Directeur (EN PREMIER) -->
                                    <div class="step" [ngClass]="getStepClass(selectedInscription(), 2)">
                                        <div class="step-circle">
                                            @if(getWorkflowStep(selectedInscription()) > 2) { <i class="bi bi-check-lg"></i> }
                                            @else { <i class="bi bi-person-badge"></i> }
                                        </div>
                                        <span class="step-label">Directeur</span>
                                    </div>

                                    <div class="step-line" [class.active]="getWorkflowStep(selectedInscription()) >= 3"></div>

                                    <!-- Étape 3 : Administration -->
                                    <div class="step" [ngClass]="getStepClass(selectedInscription(), 3)">
                                        <div class="step-circle">
                                            @if(getWorkflowStep(selectedInscription()) > 3) { <i class="bi bi-check-lg"></i> }
                                            @else { <i class="bi bi-building"></i> }
                                        </div>
                                        <span class="step-label">Administration</span>
                                    </div>

                                </div>


                                <div class="detail-grid">
                                    <div class="detail-item">
                                        <label>Doctorant</label>
                                        <span class="value">{{ getDoctorantName(selectedInscription()) }}</span>
                                    </div>
                                    <div class="detail-item">
                                        <label>Laboratoire</label>
                                        <span class="value">{{ selectedInscription().laboratoireAccueil || 'Non renseigné' }}</span>
                                    </div>
                                    <div class="detail-item full-width">
                                        <label>Sujet de Thèse</label>
                                        <div class="motif-box">{{ selectedInscription().sujetThese || 'Aucun sujet défini' }}</div>
                                    </div>
                                    <div class="detail-item full-width">
                                        <label>Directeur de Thèse</label>
                                        <span class="value fw-bold text-primary">{{ getDirecteurName(selectedInscription()) }}</span>
                                    </div>
                                </div>
                            </div>

                            @if (selectedInscription().statut === 'EN_ATTENTE_ADMIN') {
                                <div class="modal-footer">
                                    <button class="btn-refuse" (click)="rejeter(selectedInscription())">Rejeter</button>
                                    <button class="btn-accept" (click)="valider(selectedInscription())">Valider (Envoyer au Directeur)</button>
                                </div>
                            }
                        </div>
                    </div>
                }

                @if (toast().show) {
                    <div class="toast" [class.success]="toast().type === 'success'" [class.error]="toast().type === 'error'">
                        <i class="bi" [class.bi-check-circle-fill]="toast().type === 'success'" [class.bi-x-circle-fill]="toast().type === 'error'"></i>
                        {{ toast().message }}
                    </div>
                }

            </div>
        </app-main-layout>
    `,
    styles: [`
      /* ... (Styles inchangés car ils étaient bons) ... */
      .page-container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem 3rem; }
      .hero-section { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 24px; padding: 2rem; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; color: white; }
      .hero-content { display: flex; align-items: center; gap: 1.25rem; }
      .hero-icon { width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; }
      .hero-title { margin: 0; font-size: 1.6rem; font-weight: 800; }
      .hero-subtitle { margin: 0.25rem 0 0; opacity: 0.9; }
      .btn-refresh { padding: 0.75rem 1.25rem; background: white; color: #1d4ed8; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; display: flex; gap: 0.5rem; align-items: center; }
      .btn-refresh:hover { transform: translateY(-2px); }
      .spinner { width: 16px; height: 16px; border: 2px solid #dbeafe; border-top-color: #1d4ed8; border-radius: 50%; animation: spin 0.8s linear infinite; }

      .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
      .stat-card { background: white; border-radius: 16px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; }
      .stat-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
      .stat-card.orange .stat-icon { background: #fff7ed; color: #ea580c; }
      .stat-card.blue .stat-icon { background: #eff6ff; color: #3b82f6; }
      .stat-card.green .stat-icon { background: #ecfdf5; color: #16a34a; }
      .stat-card.red .stat-icon { background: #fef2f2; color: #dc2626; }
      .stat-value { font-size: 1.5rem; font-weight: 700; color: #1e293b; display: block; }
      .stat-label { font-size: 0.8rem; color: #64748b; }

      .tabs-container { display: flex; justify-content: center; margin-bottom: 1.5rem; }
      .tabs { background: #f1f5f9; padding: 5px; border-radius: 50px; display: inline-flex; gap: 5px; }
      .tab-btn { border: none; background: transparent; padding: 0.75rem 1.5rem; border-radius: 40px; font-weight: 600; color: #64748b; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; }
      .tab-btn.active { background: white; color: #1d4ed8; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
      .tab-badge { background: #ef4444; color: white; padding: 0.15rem 0.5rem; border-radius: 50px; font-size: 0.75rem; }
      .tab-badge.info { background: #3b82f6; }

      .section-card { background: white; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; overflow: hidden; margin-bottom: 1.5rem; }
      .table-container { overflow-x: auto; }
      .data-table { width: 100%; border-collapse: collapse; }
      .data-table th { padding: 1rem 1.25rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
      .data-table td { padding: 1rem 1.25rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
      .data-table tbody tr { transition: background 0.2s; cursor: pointer; }
      .data-table tbody tr:hover { background: #f0f9ff; }

      .user-cell { display: flex; align-items: center; gap: 0.75rem; }
      .user-avatar { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; font-weight: 700; color: white; }
      .user-avatar.blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
      .user-info { display: flex; flex-direction: column; }
      .user-name { font-weight: 600; color: #1e293b; }
      .user-id { font-size: 0.8rem; color: #64748b; }

      .badge.year { background: #dbeafe; color: #1e40af; padding: 0.3rem 0.7rem; border-radius: 8px; font-size: 0.8rem; font-weight: 600; }
      .motif-cell { max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #475569; }
      .status-badge { padding: 0.35rem 0.75rem; border-radius: 50px; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.4rem; }
      .status-badge.pending { background: #fef3c7; color: #b45309; }
      .status-badge.director { background: #dbeafe; color: #1d4ed8; }
      .status-badge.valid { background: #dcfce7; color: #15803d; }
      .status-badge.rejected { background: #fee2e2; color: #dc2626; }

      .action-buttons { display: flex; gap: 0.5rem; }
      .btn-accept, .btn-refuse { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 8px; border: none; cursor: pointer; transition: all 0.2s; }
      .btn-accept { background: #dcfce7; color: #16a34a; }
      .btn-accept:hover { background: #22c55e; color: white; }
      .btn-refuse { background: #fee2e2; color: #dc2626; }
      .btn-refuse:hover { background: #ef4444; color: white; }

      .loading-state, .empty-state { padding: 4rem; text-align: center; color: #64748b; }
      .empty-icon { font-size: 2.5rem; color: #cbd5e1; margin-bottom: 1rem; }

      .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.2s; }
      .modal-content { background: white; border-radius: 20px; width: 100%; max-width: 650px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px rgba(0,0,0,0.25); animation: slideUp 0.3s; }
      .modal-header { padding: 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #fcfcfc; }
      .modal-header h3 { margin: 0; font-size: 1.2rem; color: #1e293b; display: flex; align-items: center; gap: 0.5rem; }
      .btn-close { border: none; background: transparent; font-size: 1.25rem; color: #64748b; cursor: pointer; }
      .modal-body { padding: 2rem; }

      .workflow-container { display: flex; align-items: center; justify-content: center; margin-bottom: 2rem; padding: 1.5rem; background: #f8fafc; border-radius: 16px; border: 1px solid #f1f5f9; overflow-x: auto; }
      .step { display: flex; flex-direction: column; align-items: center; position: relative; z-index: 2; width: 100px; text-align: center; }
      .step-circle { width: 44px; height: 44px; border-radius: 50%; background: #e2e8f0; color: #94a3b8; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; margin-bottom: 0.5rem; border: 4px solid #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
      .step-label { font-size: 0.75rem; font-weight: 600; color: #64748b; }
      .step.completed .step-circle { background: #22c55e; color: white; }
      .step.current .step-circle { background: #3b82f6; color: white; animation: pulse 2s infinite; }
      .step-line { flex: 1; height: 3px; background: #e2e8f0; margin-top: -25px; position: relative; z-index: 1; }
      .step-line.active { background: #22c55e; }

      .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
      .detail-item { display: flex; flex-direction: column; gap: 0.4rem; }
      .detail-item.full-width { grid-column: 1 / -1; }
      .detail-item label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
      .detail-item .value { font-size: 1rem; color: #1e293b; font-weight: 500; }
      .motif-box { background: #fefce8; padding: 1rem; border-radius: 8px; border: 1px solid #fef08a; color: #854d0e; line-height: 1.5; font-size: 0.95rem; }

      .modal-footer { padding: 1.5rem; border-top: 1px solid #e2e8f0; display: flex; gap: 1rem; justify-content: flex-end; background: #fcfcfc; }
      .btn-accept, .btn-refuse { padding: 0.75rem 1.5rem; border-radius: 10px; font-weight: 600; cursor: pointer; border: none; }
      .btn-accept { background: #22c55e; color: white; }
      .btn-refuse { background: #fff; border: 1px solid #ef4444; color: #ef4444; }

      .toast { position: fixed; bottom: 2rem; right: 2rem; padding: 1rem 1.5rem; border-radius: 12px; display: flex; align-items: center; gap: 0.75rem; font-weight: 500; box-shadow: 0 10px 40px rgba(0,0,0,0.2); z-index: 1000; }
      .toast.success { background: #22c55e; color: white; }
      .toast.error { background: #ef4444; color: white; }

      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); } 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); } }

      @media (max-width: 768px) { .hero-section { flex-direction: column; gap: 1.5rem; text-align: center; } .stats-grid { grid-template-columns: repeat(2, 1fr); } .detail-grid { grid-template-columns: 1fr; } }
    `]
})
export class AdminReinscriptionsComponent implements OnInit {
    inscriptions = signal<any[]>([]);
    isLoading = signal(true);
    activeTab = 'EN_ATTENTE_ADMIN';
    selectedInscription = signal<any>(null);
    toast = signal<{show: boolean, message: string, type: 'success' | 'error'}>({show: false, message: '', type: 'success'});

    constructor(
        private inscriptionService: InscriptionService,
        private userService: UserService
    ) {}

    ngOnInit(): void { this.loadData(); }

    loadData(): void {
        this.isLoading.set(true);
        this.inscriptionService.getAllInscriptions().subscribe({
            next: (data) => this.enrichWithUserInfo(data),
            error: (err) => {
                console.error('Erreur:', err);
                this.isLoading.set(false);
            }
        });
    }

    enrichWithUserInfo(data: any[]): void {
        if (data.length === 0) { this.inscriptions.set([]); this.isLoading.set(false); return; }

        let loaded = 0;
        data.forEach(insc => {
            if (insc.doctorantId) {
                this.userService.getUserById(insc.doctorantId).subscribe({
                    next: (u) => { insc.doctorant = u; this.checkLoaded(++loaded, data.length * 2, data); },
                    error: () => this.checkLoaded(++loaded, data.length * 2, data)
                });
            } else this.checkLoaded(++loaded, data.length * 2, data);

            if (insc.directeurId) {
                this.userService.getUserById(insc.directeurId).subscribe({
                    next: (u) => { insc.directeur = u; this.checkLoaded(++loaded, data.length * 2, data); },
                    error: () => this.checkLoaded(++loaded, data.length * 2, data)
                });
            } else this.checkLoaded(++loaded, data.length * 2, data);
        });
    }

    checkLoaded(loaded: number, total: number, data: any[]) {
        if (loaded >= total - 1) {
            this.inscriptions.set(data);
            this.isLoading.set(false);
        }
    }

    setTab(tab: string) { this.activeTab = tab; }

    filteredInscriptions(): any[] {
        const all = this.inscriptions();
        if (this.activeTab === 'EN_ATTENTE_ADMIN') return all.filter(i => i.statut === 'EN_ATTENTE_ADMIN');
        if (this.activeTab === 'EN_ATTENTE_DIRECTEUR') return all.filter(i => i.statut === 'EN_ATTENTE_DIRECTEUR');
        return all.filter(i => i.statut === 'ADMIS' || (i.statut && i.statut.includes('REJETE')));
    }

    getCount(type: string): number {
        const all = this.inscriptions();
        if (type === 'EN_ATTENTE_ADMIN') return all.filter(i => i.statut === 'EN_ATTENTE_ADMIN').length;
        if (type === 'EN_ATTENTE_DIRECTEUR') return all.filter(i => i.statut === 'EN_ATTENTE_DIRECTEUR').length;
        if (type === 'ADMIS') return all.filter(i => i.statut === 'ADMIS').length;
        if (type === 'REJETE') return all.filter(i => i.statut && i.statut.includes('REJETE')).length;
        return 0;
    }

    getDoctorantName(insc: any) { return insc.doctorant ? `${insc.doctorant.prenom} ${insc.doctorant.nom}` : 'Inconnu'; }
    getDirecteurName(insc: any) { return insc.directeur ? `${insc.directeur.prenom} ${insc.directeur.nom}` : (insc.directeurId ? `ID: ${insc.directeurId}` : 'Non assigné'); }
    getInitials(insc: any) { return (insc.doctorant?.prenom?.charAt(0) || '') + (insc.doctorant?.nom?.charAt(0) || ''); }
    truncate(text: string) { return text && text.length > 30 ? text.substring(0, 30) + '...' : text; }

    getStatusClass(statut: string) {
        if (!statut) return '';
        if (statut === 'EN_ATTENTE_ADMIN') return 'pending';
        if (statut === 'EN_ATTENTE_DIRECTEUR') return 'director';
        if (statut === 'ADMIS') return 'valid';
        return 'rejected';
    }

    getStatusIcon(statut: string) {
        if (!statut) return '';
        if (statut === 'EN_ATTENTE_ADMIN') return 'bi-hourglass-split';
        if (statut === 'EN_ATTENTE_DIRECTEUR') return 'bi-person-badge';
        if (statut === 'ADMIS') return 'bi-check-circle-fill';
        return 'bi-x-circle-fill';
    }

    formatStatus(statut: string) {
        if (!statut) return 'Inconnu';
        if (statut === 'EN_ATTENTE_ADMIN') return 'À traiter';
        if (statut === 'EN_ATTENTE_DIRECTEUR') return 'Chez Directeur';
        if (statut === 'ADMIS') return 'Validée';
        if (statut.includes('REJETE')) return 'Refusée';
        return statut;
    }

    getEmptyIcon() { return this.activeTab === 'EN_ATTENTE_ADMIN' ? 'bi-hourglass' : this.activeTab === 'EN_ATTENTE_DIRECTEUR' ? 'bi-person-badge' : 'bi-clock-history'; }
    getEmptyTitle() { return this.activeTab === 'EN_ATTENTE_ADMIN' ? 'Tout est à jour' : this.activeTab === 'EN_ATTENTE_DIRECTEUR' ? 'Aucun dossier' : 'Historique vide'; }
    getEmptyMessage() { return 'Aucune demande correspondante trouvée.'; }

    showDetails(insc: any) { this.selectedInscription.set(insc); }
    closeDetails() { this.selectedInscription.set(null); }

    getWorkflowStep(insc: any): number {
        if (!insc || !insc.statut) return 1;
        if (insc.statut === 'EN_ATTENTE_ADMIN') return 2;
        if (insc.statut === 'EN_ATTENTE_DIRECTEUR') return 3;
        if (insc.statut === 'ADMIS') return 4;
        return 1;
    }

    getStepClass(insc: any, step: number) {
        const current = this.getWorkflowStep(insc);
        if(current > step) return 'completed';
        if(current === step) return 'current';
        return '';
    }

    // ✅ MODIFICATION ICI : Incrémentation Année Doctorant
    valider(insc: any) {
        if(confirm('Valider cette réinscription ? Le doctorant passera à l\'année supérieure.')) {

            // 1. Validation de la réinscription (Backend Service Inscription)
            this.inscriptionService.validerParAdmin(insc.id, 'OK').subscribe({
                next: () => {
                    this.showToast('Réinscription validée', 'success');

                    // 2. Mise à jour de l'année du doctorant (Backend Service User)
                    if (insc.doctorant && insc.doctorant.id) {
                        const newYear = (insc.doctorant.anneeThese || 1) + 1;
                        this.userService.updateUser(insc.doctorant.id, { anneeThese: newYear }).subscribe({
                            next: () => console.log('✅ Année doctorant mise à jour : ' + newYear),
                            error: (e) => console.error('❌ Erreur update année user', e)
                        });
                    }

                    this.loadData();
                    this.closeDetails();
                },
                error: (err) => this.showToast('Erreur lors de la validation', 'error')
            });
        }
    }

    rejeter(insc: any) {
        const m = prompt('Motif du refus :');
        if(m) {
            this.inscriptionService.rejeterParAdmin(insc.id, m).subscribe(() => {
                this.showToast('Demande rejetée', 'success');
                this.loadData();
                this.closeDetails();
            });
        }
    }

    showToast(message: string, type: 'success' | 'error') {
        this.toast.set({show: true, message, type});
        setTimeout(() => this.toast.set({show: false, message: '', type: 'success'}), 3000);
    }
}