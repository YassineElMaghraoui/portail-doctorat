import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '@shared/components/main-layout/main-layout.component';
import { SoutenanceService } from '@core/services/soutenance.service';
import { AuthService } from '@core/services/auth.service';
import { forkJoin } from 'rxjs';

interface MembreJury {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    etablissement: string;
    grade: string;
    specialite: string;
    role: string;
}

interface JurySelection {
    presidentId: number | null;
    rapporteurId: number | null;
    examinateurId: number | null;
}

@Component({
    selector: 'app-director-soutenance',
    standalone: true,
    imports: [CommonModule, FormsModule, MainLayoutComponent],
    template: `
        <app-main-layout>
            <div class="page-container">
                <!-- HERO HEADER -->
                <div class="hero-section">
                    <div class="hero-content">
                        <div class="hero-icon"><i class="bi bi-mortarboard-fill"></i></div>
                        <div>
                            <h1 class="hero-title">Gestion des Soutenances</h1>
                            <p class="hero-subtitle">Supervisez les thèses et validez les étapes académiques</p>
                        </div>
                    </div>
                    <button class="btn-refresh" (click)="loadData()" [disabled]="isLoading()">
                        @if (isLoading()) { <span class="spinner-btn"></span> } @else { <i class="bi bi-arrow-clockwise"></i> }
                        Actualiser
                    </button>
                </div>

                <!-- STATS CARDS -->
                <div class="stats-grid">
                    <div class="stat-card orange">
                        <div class="stat-icon"><i class="bi bi-exclamation-circle-fill"></i></div>
                        <div class="stat-info"><span class="stat-value">{{ getCount('TODO') }}</span><span class="stat-label">À traiter</span></div>
                    </div>
                    <div class="stat-card blue">
                        <div class="stat-icon"><i class="bi bi-hourglass-split"></i></div>
                        <div class="stat-info"><span class="stat-value">{{ getCount('PENDING') }}</span><span class="stat-label">En cours (Admin)</span></div>
                    </div>
                    <div class="stat-card purple">
                        <div class="stat-icon"><i class="bi bi-calendar-event"></i></div>
                        <div class="stat-info"><span class="stat-value">{{ getCount('SCHEDULED') }}</span><span class="stat-label">Planifiées</span></div>
                    </div>
                    <div class="stat-card green">
                        <div class="stat-icon"><i class="bi bi-check-circle-fill"></i></div>
                        <div class="stat-info"><span class="stat-value">{{ getCount('HISTORY') }}</span><span class="stat-label">Terminées</span></div>
                    </div>
                </div>

                <!-- TABS -->
                <div class="tabs-container">
                    <div class="tabs">
                        <button class="tab-btn" [class.active]="activeTab === 'TODO'" (click)="setTab('TODO')">
                            <i class="bi bi-lightning-charge-fill"></i> À traiter
                            @if (getCount('TODO') > 0) { <span class="tab-badge">{{ getCount('TODO') }}</span> }
                        </button>
                        <button class="tab-btn" [class.active]="activeTab === 'PENDING'" (click)="setTab('PENDING')">
                            <i class="bi bi-hourglass-split"></i> En attente Admin
                            @if (getCount('PENDING') > 0) { <span class="tab-badge info">{{ getCount('PENDING') }}</span> }
                        </button>
                        <button class="tab-btn" [class.active]="activeTab === 'HISTORY'" (click)="setTab('HISTORY')">
                            <i class="bi bi-clock-history"></i> Historique
                        </button>
                    </div>
                </div>

                <!-- LOADING & EMPTY -->
                @if (isLoading()) { <div class="loading-state"><div class="spinner-large"></div><p>Chargement...</p></div> }
                @if (!isLoading() && filteredSoutenances().length === 0) {
                    <div class="section-card">
                        <div class="empty-state">
                            <div class="empty-icon"><i class="bi bi-inbox"></i></div>
                            <h3>Aucun dossier</h3>
                            <p>Rien à afficher dans cette catégorie pour le moment.</p>
                        </div>
                    </div>
                }

                <!-- LISTE (Tableau/Cartes) -->
                @if (!isLoading() && filteredSoutenances().length > 0) {
                    <div class="soutenances-list">
                        @for (soutenance of filteredSoutenances(); track soutenance.id) {
                            <div class="soutenance-card" [class.expanded]="expandedId() === soutenance.id">

                                <!-- HEADER (Toujours visible) -->
                                <div class="card-header" (click)="toggleExpand(soutenance.id)">
                                    <div class="user-identity">
                                        <div class="avatar-circle">{{ getInitials(getDoctorantName(soutenance)) }}</div>
                                        <div class="user-info">
                                            <span class="name">{{ getDoctorantName(soutenance) }}</span>
                                            <span class="title text-truncate" [title]="getThesisTitle(soutenance)">{{ getThesisTitle(soutenance) }}</span>
                                        </div>
                                    </div>

                                    <div class="meta-info d-none d-md-flex">
                                        <span class="date"><i class="bi bi-calendar3"></i> {{ soutenance.createdAt | date:'dd/MM/yyyy' }}</span>
                                    </div>

                                    <div class="status-section">
                                        <span class="status-badge" [ngClass]="getStatusBadgeClass(soutenance.statut)">
                                            <i class="bi" [ngClass]="getStatusIcon(soutenance.statut)"></i>
                                            {{ formatStatus(soutenance.statut) }}
                                        </span>
                                        <i class="bi bi-chevron-down expand-icon" [class.rotated]="expandedId() === soutenance.id"></i>
                                    </div>
                                </div>

                                <!-- BODY (Expand) -->
                                @if (expandedId() === soutenance.id) {
                                    <div class="card-body">
                                        <hr class="separator">

                                        <!-- DETAILS & DOCUMENTS -->
                                        <div class="detail-grid">
                                            <!-- Section Prérequis -->
                                            <div class="detail-box prerequis">
                                                <h6><i class="bi bi-award"></i> État des Prérequis</h6>
                                                <div class="prereq-items">
                                                    <div class="p-item" [class.ok]="getPublications(soutenance) >= 2">
                                                        <span>Publications</span>
                                                        <strong>{{ getPublications(soutenance) }}/2</strong>
                                                    </div>
                                                    <div class="p-item" [class.ok]="getConferences(soutenance) >= 2">
                                                        <span>Conférences</span>
                                                        <strong>{{ getConferences(soutenance) }}/2</strong>
                                                    </div>
                                                    <div class="p-item" [class.ok]="getHeuresFormation(soutenance) >= 200">
                                                        <span>Formation</span>
                                                        <strong>{{ getHeuresFormation(soutenance) }}/200h</strong>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Section Documents -->
                                            <div class="detail-box documents">
                                                <h6><i class="bi bi-folder2-open"></i> Documents</h6>
                                                <div class="doc-list">
                                                    <a [href]="getDocumentUrl(soutenance.cheminManuscrit)" target="_blank" class="doc-btn" [class.disabled]="!soutenance.cheminManuscrit">
                                                        <i class="bi bi-file-earmark-pdf"></i> Manuscrit
                                                    </a>
                                                    <a [href]="getDocumentUrl(soutenance.cheminRapportAntiPlagiat)" target="_blank" class="doc-btn" [class.disabled]="!soutenance.cheminRapportAntiPlagiat">
                                                        <i class="bi bi-shield-check"></i> Anti-Plagiat
                                                    </a>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- ACTIONS : VALIDATION (SI STATUT = SOUMIS) -->
                                        @if (soutenance.statut === 'SOUMIS') {
                                            <div class="action-area mt-4">
                                                <h5 class="action-title"><i class="bi bi-clipboard-check"></i> Votre Validation</h5>
                                                @if (!showDecisionForm()) {
                                                    <div class="d-flex gap-2 justify-content-end">
                                                        <button class="btn-refuse" (click)="initiateRejection(soutenance.id, $event)">Demander corrections</button>
                                                        <button class="btn-validate" (click)="initiateValidation(soutenance.id, $event)">Valider les prérequis</button>
                                                    </div>
                                                } @else {
                                                    <div class="decision-form" [class.approve]="decisionType() === 'validate'" [class.reject]="decisionType() === 'reject'">
                                                        <p class="mb-2 fw-bold">
                                                            {{ decisionType() === 'validate' ? 'Confirmer la validation des prérequis ?' : 'Motif des corrections :' }}
                                                        </p>
                                                        @if (decisionType() === 'reject') {
                                                            <textarea [(ngModel)]="commentaire" class="form-control mb-2" rows="2" placeholder="Expliquez les corrections attendues..."></textarea>
                                                        }
                                                        <div class="d-flex gap-2 justify-content-end">
                                                            <button class="btn-cancel" (click)="resetForms()">Annuler</button>
                                                            <button class="btn-confirm" [class.green]="decisionType() === 'validate'" [class.red]="decisionType() === 'reject'"
                                                                    [disabled]="isSubmitting() || (decisionType() === 'reject' && !commentaire)"
                                                                    (click)="decisionType() === 'validate' ? confirmValidation(soutenance.id, $event) : confirmRejection(soutenance.id, $event)">
                                                                {{ decisionType() === 'validate' ? 'Confirmer' : 'Envoyer' }}
                                                            </button>
                                                        </div>
                                                    </div>
                                                }
                                            </div>
                                        }

                                        <!-- ACTIONS : JURY (SI STATUT = AUTORISEE) -->
                                        @if (soutenance.statut === 'AUTORISEE') {
                                            <div class="action-area mt-4">
                                                <h5 class="action-title"><i class="bi bi-people-fill"></i> Proposition du Jury</h5>
                                                <p class="text-muted small mb-3">Sélectionnez les membres du jury pour soumission à l'administration.</p>

                                                <div class="jury-grid">
                                                    <div class="jury-select">
                                                        <label class="text-president">Président</label>
                                                        <select [(ngModel)]="jurySelection.presidentId">
                                                            <option [ngValue]="null">-- Sélectionner --</option>
                                                            @for (m of presidentsDisponibles(); track m.id) { <option [ngValue]="m.id">{{ m.prenom }} {{ m.nom }} ({{ m.etablissement }})</option> }
                                                        </select>
                                                    </div>
                                                    <div class="jury-select">
                                                        <label class="text-rapporteur">Rapporteur</label>
                                                        <select [(ngModel)]="jurySelection.rapporteurId">
                                                            <option [ngValue]="null">-- Sélectionner --</option>
                                                            @for (m of rapporteursDisponibles(); track m.id) { <option [ngValue]="m.id">{{ m.prenom }} {{ m.nom }} ({{ m.etablissement }})</option> }
                                                        </select>
                                                    </div>
                                                    <div class="jury-select">
                                                        <label class="text-examinateur">Examinateur</label>
                                                        <select [(ngModel)]="jurySelection.examinateurId">
                                                            <option [ngValue]="null">-- Sélectionner --</option>
                                                            @for (m of examinateursDisponibles(); track m.id) { <option [ngValue]="m.id">{{ m.prenom }} {{ m.nom }} ({{ m.etablissement }})</option> }
                                                        </select>
                                                    </div>
                                                </div>

                                                <div class="d-flex justify-content-end mt-3">
                                                    <button class="btn-validate" [disabled]="!isJurySelectionValid() || isSubmitting()" (click)="submitJurySelection(soutenance.id, $event)">
                                                        @if (isSubmitting()) { <span class="spinner-sm"></span> } Soumettre le jury
                                                    </button>
                                                </div>
                                            </div>
                                        }

                                        <!-- AFFICHAGE JURY PROPOSÉ / VALIDÉ -->
                                        @if (soutenance.membresJury?.length > 0) {
                                            <div class="detail-box mt-3">
                                                <h6><i class="bi bi-people"></i> Jury {{ soutenance.statut === 'JURY_PROPOSE' ? 'Proposé' : 'Validé' }}</h6>
                                                <div class="jury-list-view">
                                                    @for (m of getUniqueJuryMembers(soutenance.membresJury); track m.id) {
                                                        <div class="jury-item">
                                                            <span class="role-badge" [class]="m.role.toLowerCase()">{{ formatRole(m.role) }}</span>
                                                            <span class="fw-bold">{{ m.prenom }} {{ m.nom }}</span>
                                                            <span class="text-muted small">({{ m.etablissement }})</span>
                                                        </div>
                                                    }
                                                </div>
                                            </div>
                                        }

                                        <!-- RÉSULTAT FINAL -->
                                        @if (soutenance.statut === 'TERMINEE') {
                                            <div class="alert alert-success mt-3 d-flex align-items-center gap-2">
                                                <i class="bi bi-trophy-fill fs-4"></i>
                                                <div>
                                                    <strong>Soutenance terminée</strong><br>
                                                    Mention : {{ soutenance.mention }}
                                                    @if(soutenance.felicitationsJury) { <span class="badge bg-warning text-dark ms-2"><i class="bi bi-star-fill"></i> Félicitations</span> }
                                                </div>
                                            </div>
                                        }

                                    </div>
                                }
                            </div>
                        }
                    </div>
                }

                @if (toastMessage()) {
                    <div class="toast" [ngClass]="toastType()"><i class="bi" [ngClass]="toastType() === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'"></i>{{ toastMessage() }}</div>
                }
            </div>
        </app-main-layout>
    `,
    styles: [`
      .page-container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem 3rem; }

      /* --- HERO --- */
      .hero-section { background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); border-radius: 24px; padding: 2rem; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; color: white; }
      .hero-content { display: flex; align-items: center; gap: 1.25rem; }
      .hero-icon { width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; }
      .hero-title { margin: 0; font-size: 1.6rem; font-weight: 800; }
      .hero-subtitle { margin: 0.25rem 0 0; opacity: 0.9; }
      .btn-refresh { padding: 0.75rem 1.25rem; background: white; color: #6d28d9; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; display: flex; gap: 0.5rem; align-items: center; }
      .btn-refresh:hover { transform: translateY(-2px); }

      /* --- STATS --- */
      .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
      .stat-card { background: white; border-radius: 16px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; }
      .stat-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
      .stat-card.orange .stat-icon { background: #fff7ed; color: #ea580c; }
      .stat-card.blue .stat-icon { background: #eff6ff; color: #3b82f6; }
      .stat-card.purple .stat-icon { background: #f3e8ff; color: #7c3aed; }
      .stat-card.green .stat-icon { background: #dcfce7; color: #16a34a; }
      .stat-value { font-size: 1.5rem; font-weight: 700; color: #1e293b; display: block; }
      .stat-label { font-size: 0.8rem; color: #64748b; }

      /* --- TABS --- */
      .tabs-container { display: flex; justify-content: center; margin-bottom: 1.5rem; }
      .tabs { background: #f1f5f9; padding: 5px; border-radius: 50px; display: inline-flex; gap: 5px; }
      .tab-btn { border: none; background: transparent; padding: 0.75rem 1.5rem; border-radius: 40px; font-weight: 600; color: #64748b; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; transition: all 0.2s; }
      .tab-btn.active { background: white; color: #7c3aed; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
      .tab-badge { background: #ef4444; color: white; padding: 0.15rem 0.5rem; border-radius: 50px; font-size: 0.75rem; }
      .tab-badge.info { background: #3b82f6; }

      /* --- LIST & CARDS --- */
      .soutenances-list { display: flex; flex-direction: column; gap: 1rem; }
      .soutenance-card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; transition: all 0.2s; }
      .soutenance-card:hover { border-color: #c4b5fd; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
      .soutenance-card.expanded { border-color: #7c3aed; box-shadow: 0 8px 25px rgba(124, 58, 237, 0.1); }

      /* Card Header */
      .card-header { padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between; cursor: pointer; gap: 1rem; }
      .user-identity { display: flex; align-items: center; gap: 1rem; flex: 2; }
      .avatar-circle { width: 45px; height: 45px; border-radius: 50%; background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1rem; flex-shrink: 0; }
      .user-info { display: flex; flex-direction: column; overflow: hidden; }
      .user-info .name { font-weight: 700; color: #1e293b; font-size: 1rem; }
      .user-info .title { font-size: 0.85rem; color: #64748b; }

      .meta-info { flex: 1; justify-content: center; color: #64748b; font-size: 0.9rem; }

      .status-section { flex: 1; display: flex; justify-content: flex-end; align-items: center; gap: 1.5rem; }
      .status-badge { padding: 0.4rem 0.8rem; border-radius: 50px; font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.4rem; white-space: nowrap; }
      .status-badge.pending { background: #fef3c7; color: #b45309; } /* Action requise */
      .status-badge.waiting { background: #e0e7ff; color: #4338ca; } /* En attente */
      .status-badge.scheduled { background: #f3e8ff; color: #7c3aed; }
      .status-badge.success { background: #dcfce7; color: #15803d; }
      .status-badge.danger { background: #fee2e2; color: #991b1b; }

      .expand-icon { color: #94a3b8; transition: transform 0.3s; }
      .expand-icon.rotated { transform: rotate(180deg); color: #7c3aed; }

      /* Card Body */
      .card-body { padding: 0 1.5rem 1.5rem; background: #fff; cursor: default; }
      .separator { border-top: 1px solid #f1f5f9; margin: 0 0 1.5rem; }

      .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
      .detail-box { background: #f8fafc; border-radius: 12px; padding: 1rem; border: 1px solid #e2e8f0; }
      .detail-box h6 { font-size: 0.85rem; font-weight: 700; color: #475569; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }

      .prereq-items { display: flex; flex-direction: column; gap: 0.5rem; }
      .p-item { display: flex; justify-content: space-between; font-size: 0.9rem; color: #64748b; padding: 0.4rem 0.6rem; border-radius: 6px; background: white; }
      .p-item.ok { color: #166534; background: #f0fdf4; border: 1px solid #bbf7d0; }

      .doc-list { display: flex; flex-direction: column; gap: 0.5rem; }
      .doc-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1rem; background: white; border: 1px solid #e2e8f0; border-radius: 8px; text-decoration: none; color: #1e293b; font-size: 0.9rem; transition: all 0.2s; }
      .doc-btn:hover:not(.disabled) { border-color: #7c3aed; color: #7c3aed; }
      .doc-btn.disabled { opacity: 0.6; pointer-events: none; background: #f1f5f9; }

      /* Actions Area */
      .action-area { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 1.25rem; }
      .action-title { color: #9a3412; font-size: 1rem; font-weight: 700; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }

      .btn-validate { padding: 0.6rem 1.2rem; background: #22c55e; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
      .btn-refuse { padding: 0.6rem 1.2rem; background: white; color: #dc2626; border: 1px solid #fecaca; border-radius: 8px; font-weight: 600; cursor: pointer; }

      /* Decision Form */
      .decision-form { background: white; padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0; }
      .decision-form.approve { border-color: #86efac; background: #f0fdf4; }
      .decision-form.reject { border-color: #fecaca; background: #fef2f2; }

      /* Jury Grid */
      .jury-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
      .jury-select label { display: block; font-size: 0.75rem; font-weight: 700; margin-bottom: 0.3rem; text-transform: uppercase; }
      .jury-select select { width: 100%; padding: 0.6rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.9rem; }
      .text-president { color: #d97706; }
      .text-rapporteur { color: #2563eb; }
      .text-examinateur { color: #7c3aed; }

      .jury-list-view { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
      .jury-item { background: white; padding: 0.75rem; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 0.25rem; }
      .role-badge { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; width: fit-content; padding: 0.1rem 0.4rem; border-radius: 4px; }
      .role-badge.president { background: #fef3c7; color: #b45309; }
      .role-badge.rapporteur { background: #dbeafe; color: #1d4ed8; }
      .role-badge.examinateur { background: #f3e8ff; color: #6d28d9; }

      .loading-state, .empty-state { text-align: center; padding: 4rem; color: #64748b; background: white; border-radius: 16px; border: 1px solid #e2e8f0; }
      .spinner-large { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #7c3aed; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
      .spinner-btn { width: 16px; height: 16px; border: 2px solid #ddd; border-top-color: #333; border-radius: 50%; animation: spin 1s linear infinite; display: inline-block; }
      @keyframes spin { 100% { transform: rotate(360deg); } }

      .toast { position: fixed; bottom: 2rem; right: 2rem; padding: 1rem 1.5rem; border-radius: 10px; color: white; font-weight: 600; z-index: 2000; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
      .toast.success { background: #22c55e; }
      .toast.error { background: #ef4444; }

      @media (max-width: 992px) { .stats-grid, .detail-grid, .jury-grid, .jury-list-view { grid-template-columns: 1fr; } .hero-section { flex-direction: column; text-align: center; gap: 1rem; } }
    `]
})
export class DirectorSoutenanceComponent implements OnInit {
    soutenances = signal<any[]>([]);
    isLoading = signal(false);
    isSubmitting = signal(false);
    expandedId = signal<number | null>(null);
    activeTab = 'TODO'; // Par défaut : À traiter

    // Form data
    showDecisionForm = signal(false);
    decisionType = signal<'validate' | 'reject' | null>(null);
    commentaire = '';
    currentSoutenanceId: number | null = null;

    // Jury data
    presidentsDisponibles = signal<MembreJury[]>([]);
    rapporteursDisponibles = signal<MembreJury[]>([]);
    examinateursDisponibles = signal<MembreJury[]>([]);
    jurySelection: JurySelection = { presidentId: null, rapporteurId: null, examinateurId: null };

    toastMessage = signal<string>('');
    toastType = signal<'success' | 'error'>('success');

    constructor(private soutenanceService: SoutenanceService, private authService: AuthService) {}

    ngOnInit() { this.loadData(); this.loadMembresJuryDisponibles(); }

    loadData() {
        this.isLoading.set(true);
        const currentUser = this.authService.currentUser();
        if (!currentUser?.id) { this.isLoading.set(false); return; }
        this.soutenanceService.getSoutenancesByDirecteur(currentUser.id).subscribe({
            next: (data) => { this.soutenances.set(data); this.isLoading.set(false); },
            error: () => { this.isLoading.set(false); this.showToast('Erreur chargement', 'error'); }
        });
    }

    loadMembresJuryDisponibles() {
        this.soutenanceService.getMembresJuryByRole('PRESIDENT').subscribe({ next: (d) => this.presidentsDisponibles.set(d) });
        this.soutenanceService.getMembresJuryByRole('RAPPORTEUR').subscribe({ next: (d) => this.rapporteursDisponibles.set(d) });
        this.soutenanceService.getMembresJuryByRole('EXAMINATEUR').subscribe({ next: (d) => this.examinateursDisponibles.set(d) });
    }

    // --- TAB LOGIC ---
    setTab(tab: string) {
        this.activeTab = tab;
        this.expandedId.set(null); // Close opened items on tab switch
    }

    filteredSoutenances() {
        const all = this.soutenances();
        if (this.activeTab === 'TODO') {
            // Action requise : Valider prérequis (SOUMIS) ou Proposer jury (AUTORISEE)
            return all.filter(s => ['SOUMIS', 'AUTORISEE'].includes(s.statut));
        }
        if (this.activeTab === 'PENDING') {
            // En attente : Prérequis validés (Attente Admin) ou Jury proposé (Attente Admin) ou Planifiée (Attente Date)
            return all.filter(s => ['PREREQUIS_VALIDES', 'JURY_PROPOSE', 'PLANIFIEE'].includes(s.statut));
        }
        if (this.activeTab === 'HISTORY') {
            return all.filter(s => ['TERMINEE', 'REJETEE'].includes(s.statut));
        }
        return [];
    }

    getCount(tab: string): number {
        const all = this.soutenances();
        if (tab === 'TODO') return all.filter(s => ['SOUMIS', 'AUTORISEE'].includes(s.statut)).length;
        if (tab === 'PENDING') return all.filter(s => ['PREREQUIS_VALIDES', 'JURY_PROPOSE', 'PLANIFIEE'].includes(s.statut)).length;
        if (tab === 'SCHEDULED') return all.filter(s => s.statut === 'PLANIFIEE').length;
        if (tab === 'HISTORY') return all.filter(s => ['TERMINEE', 'REJETEE'].includes(s.statut)).length;
        return 0;
    }

    // --- EXPAND LOGIC ---
    toggleExpand(id: number) { this.expandedId() === id ? (this.expandedId.set(null), this.resetForms()) : (this.expandedId.set(id), this.resetForms()); }
    resetForms() { this.showDecisionForm.set(false); this.decisionType.set(null); this.commentaire = ''; this.currentSoutenanceId = null; this.jurySelection = { presidentId: null, rapporteurId: null, examinateurId: null }; }

    // --- HELPERS ---
    getDoctorantName(s: any): string { return s.doctorantInfo ? `${s.doctorantInfo.prenom} ${s.doctorantInfo.nom}` : `Doc #${s.doctorantId}`; }
    getThesisTitle(s: any): string { return s.titreThese || 'Non défini'; }
    getDocumentUrl(filename: string): string { return this.soutenanceService.getDocumentUrl(filename); }
    getInitials(name: string): string { const p = name.trim().split(' '); return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : name[0]?.toUpperCase() || '?'; }

    // Status visual helpers
    getStatusBadgeClass(s: string) { return ['SOUMIS', 'AUTORISEE'].includes(s) ? 'pending' : ['PREREQUIS_VALIDES', 'JURY_PROPOSE'].includes(s) ? 'waiting' : s === 'PLANIFIEE' ? 'scheduled' : s === 'TERMINEE' ? 'success' : 'danger'; }
    getStatusIcon(s: string) { return ['SOUMIS', 'AUTORISEE'].includes(s) ? 'bi-exclamation-circle' : ['PREREQUIS_VALIDES', 'JURY_PROPOSE'].includes(s) ? 'bi-hourglass-split' : s === 'PLANIFIEE' ? 'bi-calendar-check' : s === 'TERMINEE' ? 'bi-check-circle-fill' : 'bi-x-circle'; }
    formatStatus(s: string) {
        const map: any = { 'SOUMIS': 'À Valider', 'PREREQUIS_VALIDES': 'Attente Admin', 'AUTORISEE': 'Jury à faire', 'JURY_PROPOSE': 'Jury en validation', 'PLANIFIEE': 'Planifiée', 'TERMINEE': 'Terminée' };
        return map[s] || s;
    }

    // Prerequis Data
    getPublications(s: any): number { return s.doctorantInfo?.nbPublications || 0; }
    getConferences(s: any): number { return s.doctorantInfo?.nbConferences || 0; }
    getHeuresFormation(s: any): number { return s.doctorantInfo?.heuresFormation || 0; }

    needsDirectorAction(statut: string): boolean { return ['SOUMIS', 'AUTORISEE'].includes(statut); }
    getActionNeededText(statut: string): string { return statut === 'SOUMIS' ? 'Valider prérequis' : 'Proposer jury'; }

    // Jury Helpers
    getUniqueJuryMembers(members: any[]): any[] { if (!members) return []; const seen = new Map(); return members.filter(m => { const k = `${m.nom}-${m.role}`; if (seen.has(k)) return false; seen.set(k, true); return true; }); }
    formatRole(r: string) { return { 'PRESIDENT': 'Président', 'RAPPORTEUR': 'Rapporteur', 'EXAMINATEUR': 'Examinateur' }[r] || r; }

    // Forms Logic
    isJurySelectionValid() { return !!(this.jurySelection.presidentId && this.jurySelection.rapporteurId && this.jurySelection.examinateurId); }
    initiateValidation(id: number, e: Event) { e.stopPropagation(); this.currentSoutenanceId = id; this.showDecisionForm.set(true); this.decisionType.set('validate'); }
    initiateRejection(id: number, e: Event) { e.stopPropagation(); this.currentSoutenanceId = id; this.showDecisionForm.set(true); this.decisionType.set('reject'); }

    // Actions
    confirmValidation(id: number, e: Event) {
        e.stopPropagation(); this.isSubmitting.set(true);
        this.soutenanceService.validerPrerequisDirecteur(id, 'Validé').subscribe({
            next: () => { this.showToast('Validé !', 'success'); this.loadData(); this.resetForms(); this.isSubmitting.set(false); },
            error: () => { this.showToast('Erreur', 'error'); this.isSubmitting.set(false); }
        });
    }

    confirmRejection(id: number, e: Event) {
        e.stopPropagation(); this.isSubmitting.set(true);
        this.soutenanceService.rejeterDemandeDirecteur(id, this.commentaire).subscribe({
            next: () => { this.showToast('Rejeté', 'success'); this.loadData(); this.resetForms(); this.isSubmitting.set(false); },
            error: () => { this.showToast('Erreur', 'error'); this.isSubmitting.set(false); }
        });
    }

    submitJurySelection(id: number, e: Event) {
        e.stopPropagation();
        if (!this.isJurySelectionValid()) return;
        this.isSubmitting.set(true);

        // Simuler ajout en chaîne (en vrai, backend devrait avoir un endpoint groupé)
        const p = this.presidentsDisponibles().find(m => m.id === this.jurySelection.presidentId)!;
        const r = this.rapporteursDisponibles().find(m => m.id === this.jurySelection.rapporteurId)!;
        const ex = this.examinateursDisponibles().find(m => m.id === this.jurySelection.examinateurId)!;

        const reqs = [
            this.soutenanceService.ajouterMembreJury(id, { ...p, role: 'PRESIDENT' }),
            this.soutenanceService.ajouterMembreJury(id, { ...r, role: 'RAPPORTEUR' }),
            this.soutenanceService.ajouterMembreJury(id, { ...ex, role: 'EXAMINATEUR' })
        ];

        forkJoin(reqs).subscribe({
            next: () => {
                this.soutenanceService.proposerJury(id).subscribe({
                    next: () => { this.showToast('Jury soumis !', 'success'); this.loadData(); this.resetForms(); this.isSubmitting.set(false); },
                    error: () => { this.showToast('Erreur proposition', 'error'); this.isSubmitting.set(false); }
                });
            },
            error: () => { this.showToast('Erreur ajout membres', 'error'); this.isSubmitting.set(false); }
        });
    }

    showToast(msg: string, type: 'success' | 'error') {
        this.toastMessage.set(msg); this.toastType.set(type);
        setTimeout(() => this.toastMessage.set(''), 4000);
    }
}