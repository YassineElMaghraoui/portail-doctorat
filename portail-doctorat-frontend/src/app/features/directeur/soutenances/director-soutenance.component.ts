import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '@shared/components/main-layout/main-layout.component';
import { SoutenanceService } from '@core/services/soutenance.service';
import { AuthService } from '@core/services/auth.service';
import { forkJoin } from 'rxjs';

// --- Interfaces locales ---
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

                <!-- HERO -->
                <div class="hero-header">
                    <div class="hero-content">
                        <div class="hero-icon"><i class="bi bi-mortarboard-fill"></i></div>
                        <div>
                            <h1 class="hero-title">Gestion des Soutenances</h1>
                            <p class="hero-subtitle">Supervisez les thèses et validez les étapes académiques</p>
                        </div>
                    </div>
                    <button class="btn-refresh" (click)="loadData()" [disabled]="isLoading()">
                        @if (isLoading()) { <span class="spinner-btn"></span> } @else { <i class="bi bi-arrow-clockwise"></i> } Actualiser
                    </button>
                </div>

                <!-- STATS -->
                <div class="stats-grid">
                    <div class="stat-card orange"><div class="stat-icon-wrap"><i class="bi bi-exclamation-circle-fill"></i></div><div class="stat-info"><span class="stat-value">{{ getCount('TODO') }}</span><span class="stat-label">À traiter</span></div></div>
                    <div class="stat-card blue"><div class="stat-icon-wrap"><i class="bi bi-hourglass-split"></i></div><div class="stat-info"><span class="stat-value">{{ getCount('PENDING') }}</span><span class="stat-label">En cours (Admin)</span></div></div>
                    <div class="stat-card purple"><div class="stat-icon-wrap"><i class="bi bi-calendar-event"></i></div><div class="stat-info"><span class="stat-value">{{ getCount('SCHEDULED') }}</span><span class="stat-label">Planifiées</span></div></div>
                    <div class="stat-card green"><div class="stat-icon-wrap"><i class="bi bi-check-circle-fill"></i></div><div class="stat-info"><span class="stat-value">{{ getCount('HISTORY') }}</span><span class="stat-label">Terminées</span></div></div>
                </div>

                <!-- TABS -->
                <div class="tabs-container">
                    <div class="tabs">
                        <button class="tab-btn" [class.active]="activeTab === 'TODO'" (click)="setTab('TODO')"><i class="bi bi-lightning-charge-fill"></i> À traiter @if (getCount('TODO') > 0) { <span class="tab-badge">{{ getCount('TODO') }}</span> }</button>
                        <button class="tab-btn" [class.active]="activeTab === 'PENDING'" (click)="setTab('PENDING')"><i class="bi bi-hourglass-split"></i> En attente Admin @if (getCount('PENDING') > 0) { <span class="tab-badge info">{{ getCount('PENDING') }}</span> }</button>
                        <button class="tab-btn" [class.active]="activeTab === 'HISTORY'" (click)="setTab('HISTORY')"><i class="bi bi-clock-history"></i> Historique</button>
                    </div>
                </div>

                <!-- LISTE -->
                <div class="section-card">
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                            <tr>
                                <th style="width: 35%;">Doctorant</th>
                                <th>Sujet</th>
                                <th>Date Dépôt</th>
                                <th>Statut</th>
                                <th style="width: 50px;"></th>
                            </tr>
                            </thead>
                            <tbody>
                                @if (isLoading()) {
                                    <tr><td colspan="5" class="loading-cell"><div class="spinner-sm"></div> Chargement...</td></tr>
                                } @else if (filteredSoutenances().length === 0) {
                                    <tr>
                                        <td colspan="5" class="empty-cell">
                                            <div class="empty-content"><i class="bi bi-inbox"></i><p>Aucun dossier dans cette catégorie</p></div>
                                        </td>
                                    </tr>
                                } @else {
                                    @for (s of filteredSoutenances(); track s.id) {
                                        <!-- LIGNE -->
                                        <tr class="clickable" [class.expanded-row]="expandedId() === s.id" (click)="toggleExpand(s.id)">
                                            <td>
                                                <div class="user-cell">
                                                    <div class="avatar-circle">{{ getInitials(getDoctorantName(s)) }}</div>
                                                    <div class="user-info"><span class="name">{{ getDoctorantName(s) }}</span><span class="id">Mat: {{ s.doctorantInfo?.username }}</span></div>
                                                </div>
                                            </td>
                                            <td><div class="topic-cell text-truncate" [title]="getThesisTitle(s)">{{ getThesisTitle(s) }}</div></td>
                                            <td><span class="date-badge">{{ s.createdAt | date:'dd/MM/yyyy' }}</span></td>
                                            <td><span class="status-badge" [ngClass]="getStatusBadgeClass(s.statut)"><i class="bi" [ngClass]="getStatusIcon(s.statut)"></i> {{ formatStatus(s.statut) }}</span></td>
                                            <td><i class="bi bi-chevron-down expand-icon" [class.rotated]="expandedId() === s.id"></i></td>
                                        </tr>

                                        <!-- DETAILS -->
                                        @if (expandedId() === s.id) {
                                            <tr class="details-row">
                                                <td colspan="5">
                                                    <div class="details-panel">

                                                        <!-- STEPPER -->
                                                        <div class="workflow-container">
                                                            <div class="step completed"><div class="step-circle"><i class="bi bi-file-earmark-text"></i></div><span class="step-label">Dépôt</span></div>
                                                            <div class="step-line" [class.active]="getStep(s) >= 2"></div>
                                                            <div class="step" [ngClass]="getStepClass(s, 2)"><div class="step-circle"><i class="bi bi-person-check"></i></div><span class="step-label">Directeur</span></div>
                                                            <div class="step-line" [class.active]="getStep(s) >= 3"></div>
                                                            <div class="step" [ngClass]="getStepClass(s, 3)"><div class="step-circle"><i class="bi bi-shield-check"></i></div><span class="step-label">Admin</span></div>
                                                            <div class="step-line" [class.active]="getStep(s) >= 4"></div>
                                                            <div class="step" [ngClass]="getStepClass(s, 4)"><div class="step-circle"><i class="bi bi-people"></i></div><span class="step-label">Jury</span></div>
                                                            <div class="step-line" [class.active]="getStep(s) >= 5"></div>
                                                            <div class="step" [ngClass]="getStepClass(s, 5)"><div class="step-circle"><i class="bi bi-trophy"></i></div><span class="step-label">Soutenance</span></div>
                                                        </div>

                                                        <div class="detail-grid">
                                                            <div class="detail-box prerequis">
                                                                <h6><i class="bi bi-award"></i> État des Prérequis</h6>
                                                                <div class="info-item-row"><span class="lbl">Publications</span><span class="val" [class.ok]="getPublications(s) >= 2">{{ getPublications(s) }}/2</span></div>
                                                                <div class="info-item-row"><span class="lbl">Conférences</span><span class="val" [class.ok]="getConferences(s) >= 2">{{ getConferences(s) }}/2</span></div>
                                                                <div class="info-item-row"><span class="lbl">Formation</span><span class="val" [class.ok]="getHeuresFormation(s) >= 200">{{ getHeuresFormation(s) }}/200h</span></div>
                                                            </div>
                                                            <div class="detail-box documents">
                                                                <h6><i class="bi bi-folder2-open"></i> Documents</h6>
                                                                <div class="doc-list">
                                                                    <a [href]="getDocumentUrl(s.cheminManuscrit)" target="_blank" class="doc-btn" [class.disabled]="!s.cheminManuscrit"><i class="bi bi-file-earmark-pdf"></i> Manuscrit</a>
                                                                    <a [href]="getDocumentUrl(s.cheminRapportAntiPlagiat)" target="_blank" class="doc-btn" [class.disabled]="!s.cheminRapportAntiPlagiat"><i class="bi bi-shield-check"></i> Anti-Plagiat</a>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <!-- ACTION 1 : VALIDATION PRÉREQUIS (Si SOUMIS) -->
                                                        @if (s.statut === 'SOUMIS') {
                                                            <div class="action-area mt-4">
                                                                <h5 class="action-title"><i class="bi bi-clipboard-check"></i> Votre Validation</h5>

                                                                @if (!showDecisionForm()) {
                                                                    <!-- Boutons Initiaux -->
                                                                    <div class="d-flex gap-2 justify-content-end">
                                                                        <button class="btn-refuse" (click)="initiateRejection(s.id, $event)">Demander corrections</button>
                                                                        <button class="btn-validate" (click)="initiateValidation(s.id, $event)">Valider les prérequis</button>
                                                                    </div>
                                                                } @else {
                                                                    <!-- Formulaire de confirmation -->
                                                                    <div class="decision-form" [class.approve-bg]="decisionType() === 'validate'" [class.reject-bg]="decisionType() === 'reject'">

                                                                        <div class="mb-3 d-flex align-items-center gap-2">
                                                                            <i class="bi" [class.bi-check-circle-fill]="decisionType() === 'validate'" [class.text-success]="decisionType() === 'validate'"
                                                                               [class.bi-exclamation-triangle-fill]="decisionType() === 'reject'" [class.text-danger]="decisionType() === 'reject'"></i>
                                                                            <span class="fw-bold text-dark">
                                         {{ decisionType() === 'validate' ? 'Confirmer la validation des prérequis ?' : 'Indiquez le motif du refus :' }}
                                       </span>
                                                                        </div>

                                                                        @if (decisionType() === 'reject') {
                                                                            <textarea [(ngModel)]="commentaire" class="form-control mb-3" rows="2" placeholder="Expliquez les corrections attendues..."></textarea>
                                                                        }

                                                                        <div class="d-flex gap-2 justify-content-end">
                                                                            <!-- Bouton Annuler -->
                                                                            <button class="btn-cancel" (click)="resetForms()">Annuler</button>

                                                                            <!-- Bouton Confirmer (Coloré selon action) -->
                                                                            <button class="btn-confirm"
                                                                                    [class.green]="decisionType() === 'validate'"
                                                                                    [class.red]="decisionType() === 'reject'"
                                                                                    [disabled]="isSubmitting() || (decisionType() === 'reject' && !commentaire)"
                                                                                    (click)="decisionType() === 'validate' ? confirmValidation(s.id, $event) : confirmRejection(s.id, $event)">
                                                                                @if (isSubmitting()) { <span class="spinner-sm-white"></span> }
                                                                                {{ decisionType() === 'validate' ? 'Confirmer' : 'Envoyer' }}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                }
                                                            </div>
                                                        }

                                                        <!-- ACTION 2 : JURY (Si AUTORISEE) -->
                                                        @if (s.statut === 'AUTORISEE') {
                                                            <div class="action-area mt-4">
                                                                <h5 class="action-title"><i class="bi bi-people-fill"></i> Proposition du Jury</h5>
                                                                <div class="jury-grid">
                                                                    <div class="jury-select"><label class="text-president">Président</label><select [(ngModel)]="jurySelection.presidentId"><option [ngValue]="null">-- Choisir --</option>@for (m of presidentsDisponibles(); track m.id) { <option [ngValue]="m.id">{{ m.prenom }} {{ m.nom }}</option> }</select></div>
                                                                    <div class="jury-select"><label class="text-rapporteur">Rapporteur</label><select [(ngModel)]="jurySelection.rapporteurId"><option [ngValue]="null">-- Choisir --</option>@for (m of rapporteursDisponibles(); track m.id) { <option [ngValue]="m.id">{{ m.prenom }} {{ m.nom }}</option> }</select></div>
                                                                    <div class="jury-select"><label class="text-examinateur">Examinateur</label><select [(ngModel)]="jurySelection.examinateurId"><option [ngValue]="null">-- Choisir --</option>@for (m of examinateursDisponibles(); track m.id) { <option [ngValue]="m.id">{{ m.prenom }} {{ m.nom }}</option> }</select></div>
                                                                </div>
                                                                <div class="d-flex justify-content-end mt-3">
                                                                    <button class="btn-validate" [disabled]="!isJurySelectionValid() || isSubmitting()" (click)="submitJurySelection(s.id, $event)">
                                                                        @if (isSubmitting()) { <span class="spinner-sm-white"></span> } Soumettre le jury
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        }

                                                        <!-- INFO JURY -->
                                                        @if (s.membresJury?.length > 0) {
                                                            <div class="detail-box mt-3">
                                                                <h6><i class="bi bi-people"></i> Jury {{ s.statut === 'JURY_PROPOSE' ? 'Proposé' : 'Validé' }}</h6>
                                                                <div class="jury-list-view">
                                                                    @for (m of getUniqueJuryMembers(s.membresJury); track m.id) {
                                                                        <div class="jury-item">
                                                                            <span class="role-badge" [class]="m.role.toLowerCase()">{{ formatRole(m.role) }}</span>
                                                                            <span class="fw-bold">{{ m.prenom }} {{ m.nom }}</span>
                                                                            <span class="text-muted small">({{ m.etablissement }})</span>
                                                                        </div>
                                                                    }
                                                                </div>
                                                            </div>
                                                        }

                                                        <!-- RESULTAT -->
                                                        @if (s.statut === 'TERMINEE') {
                                                            <div class="alert alert-success mt-3 d-flex align-items-center gap-2">
                                                                <i class="bi bi-trophy-fill fs-4"></i>
                                                                <div>
                                                                    <strong>Soutenance terminée</strong><br>
                                                                    Mention : {{ s.mention }}
                                                                    @if(s.felicitationsJury) { <span class="badge bg-warning text-dark ms-2"><i class="bi bi-star-fill"></i> Félicitations</span> }
                                                                </div>
                                                            </div>
                                                        }
                                                    </div>
                                                </td>
                                            </tr>
                                        }
                                    }
                                }
                            </tbody>
                        </table>
                    </div>
                </div>

                @if (toastMessage()) { <div class="toast" [ngClass]="toastType()"><i class="bi" [ngClass]="toastType() === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'"></i>{{ toastMessage() }}</div> }
            </div>
        </app-main-layout>
    `,
    styles: [`
      /* STYLE UNIFIÉ */
      .page-container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem 3rem; }
      .hero-header { background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); border-radius: 20px; padding: 2rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; color: white; }
      .hero-content { display: flex; gap: 1.25rem; align-items: center; }
      .hero-icon { width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 16px; display: flex; justify-content: center; align-items: center; font-size: 1.75rem; }
      .hero-title { font-size: 1.5rem; font-weight: 800; margin: 0; }
      .hero-subtitle { margin: 0.25rem 0 0; opacity: 0.9; }
      .btn-refresh { padding: 0.75rem 1.25rem; background: white; color: #6d28d9; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; display: flex; gap: 0.5rem; align-items: center; }

      /* STATS */
      .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
      .stat-card { background: white; border-radius: 14px; padding: 1rem; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.5rem; border: 1px solid #e2e8f0; }
      .stat-icon-wrap { width: 48px; height: 48px; border-radius: 12px; display: flex; justify-content: center; align-items: center; font-size: 1.25rem; }
      .stat-card.orange .stat-icon-wrap { background: #fef3c7; color: #d97706; }
      .stat-card.blue .stat-icon-wrap { background: #eff6ff; color: #3b82f6; }
      .stat-card.purple .stat-icon-wrap { background: #f3e8ff; color: #7c3aed; }
      .stat-card.green .stat-icon-wrap { background: #dcfce7; color: #16a34a; }
      .stat-value { font-size: 1.5rem; font-weight: 800; color: #1e293b; display: block; }
      .stat-label { font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; }

      /* TABS */
      .tabs-container { display: flex; justify-content: center; margin-bottom: 1.5rem; }
      .tabs { background: #f1f5f9; padding: 5px; border-radius: 50px; display: inline-flex; gap: 5px; }
      .tab-btn { border: none; background: transparent; padding: 0.75rem 1.5rem; border-radius: 40px; font-weight: 600; color: #64748b; cursor: pointer; display: flex; gap: 0.5rem; align-items: center; transition: 0.2s; }
      .tab-btn.active { background: white; color: #6d28d9; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
      .tab-badge { background: #ef4444; color: white; padding: 0.15rem 0.5rem; border-radius: 50px; font-size: 0.7rem; }
      .tab-badge.info { background: #3b82f6; }

      /* TABLE */
      .section-card { background: white; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; overflow: hidden; }
      .table-container { overflow-x: auto; }
      .data-table { width: 100%; border-collapse: collapse; }
      .data-table th { padding: 1rem 1.5rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
      .data-table td { padding: 1rem 1.5rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
      .data-table tbody tr { transition: background 0.2s; }
      .data-table tbody tr.clickable:hover { background: #f8fafc; cursor: pointer; }
      .data-table tbody tr.expanded-row { background: #eff6ff; border-left: 4px solid #7c3aed; }

      .user-cell { display: flex; align-items: center; gap: 1rem; }
      .avatar-circle { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; display: flex; justify-content: center; align-items: center; font-weight: 700; font-size: 0.9rem; flex-shrink: 0; }
      .user-info { display: flex; flex-direction: column; }
      .user-info .name { font-weight: 700; color: #1e293b; font-size: 0.95rem; }
      .user-info .id { font-size: 0.75rem; color: #64748b; }
      .topic-cell { max-width: 250px; font-size: 0.9rem; color: #475569; }
      .date-badge { background: #f1f5f9; padding: 0.3rem 0.6rem; border-radius: 6px; font-size: 0.8rem; color: #475569; font-weight: 500; }

      /* STATUS BADGE */
      .status-badge { padding: 0.35rem 0.75rem; border-radius: 50px; font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.4rem; white-space: nowrap; }
      .status-badge.pending { background: #fef3c7; color: #b45309; }
      .status-badge.waiting { background: #e0e7ff; color: #4338ca; }
      .status-badge.scheduled { background: #f3e8ff; color: #7c3aed; }
      .status-badge.success { background: #dcfce7; color: #15803d; }
      .status-badge.danger { background: #fee2e2; color: #991b1b; }
      .expand-icon { color: #94a3b8; transition: transform 0.3s; }
      .expand-icon.rotated { transform: rotate(180deg); color: #7c3aed; }

      /* DETAILS */
      .details-row td { padding: 0; border: none; }
      .details-panel { padding: 2rem; background: #fff; animation: slideDown 0.3s; border-bottom: 1px solid #e2e8f0; }
      .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 1.5rem; }
      .detail-box { background: #f8fafc; padding: 1.5rem; border-radius: 12px; border: 1px solid #e2e8f0; }
      .detail-box h6 { font-size: 0.85rem; font-weight: 700; color: #475569; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }

      /* PRE REQUIS */
      .info-item-row { display: flex; justify-content: space-between; margin-bottom: 0.75rem; font-size: 0.9rem; color: #64748b; }
      .info-item-row .val { font-weight: 600; color: #1e293b; }
      .info-item-row .val.ok { color: #166534; }

      /* DOCUMENTS */
      .doc-list { display: flex; flex-direction: column; gap: 0.5rem; }
      .doc-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; background: white; border: 1px solid #e2e8f0; border-radius: 8px; text-decoration: none; color: #1e293b; font-size: 0.9rem; transition: 0.2s; }
      .doc-btn:hover:not(.disabled) { border-color: #7c3aed; color: #7c3aed; }
      .doc-btn.disabled { opacity: 0.6; pointer-events: none; background: #f1f5f9; }

      /* STEPPER */
      .workflow-container { display: flex; align-items: center; justify-content: center; margin-bottom: 2rem; padding: 1.5rem; background: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9; overflow-x: auto; }
      .step { display: flex; flex-direction: column; align-items: center; position: relative; z-index: 2; min-width: 80px; text-align: center; }
      .step-circle { width: 36px; height: 36px; border-radius: 50%; background: #e2e8f0; color: #94a3b8; display: flex; align-items: center; justify-content: center; font-size: 1rem; margin-bottom: 0.5rem; border: 3px solid #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
      .step-label { font-size: 0.65rem; font-weight: 600; color: #64748b; }
      .step.completed .step-circle { background: #22c55e; color: white; }
      .step.current .step-circle { background: #7c3aed; color: white; animation: pulse 2s infinite; }
      .step-line { flex: 1; height: 3px; background: #e2e8f0; margin-top: -20px; position: relative; z-index: 1; min-width: 30px; }
      .step-line.active { background: #22c55e; }

      /* ACTIONS & FORMS */
      .action-area { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 1.5rem; margin-top: 1.5rem; }
      .action-title { color: #9a3412; font-size: 1rem; font-weight: 700; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }

      .btn-validate { padding: 0.6rem 1.2rem; background: #22c55e; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; }
      .btn-validate:hover { transform: translateY(-1px); }
      .btn-refuse { padding: 0.6rem 1.2rem; background: white; color: #dc2626; border: 1px solid #fecaca; border-radius: 8px; font-weight: 600; cursor: pointer; transition: 0.2s; }
      .btn-refuse:hover { background: #fef2f2; }

      /* Confirmation Box */
      .decision-form { padding: 1.25rem; border-radius: 8px; border: 1px solid #e2e8f0; background: white; }
      .decision-form.approve-bg { background: #f0fdf4; border-color: #86efac; }
      .decision-form.reject-bg { background: #fef2f2; border-color: #fecaca; }

      .btn-cancel { padding: 0.6rem 1rem; background: white; border: 1px solid #e2e8f0; border-radius: 8px; font-weight: 600; color: #64748b; cursor: pointer; }
      .btn-confirm { padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 600; border: none; color: white; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; }
      .btn-confirm.green { background: #22c55e; }
      .btn-confirm.red { background: #ef4444; }

      /* Jury Grid */
      .jury-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
      .jury-select label { display: block; font-size: 0.75rem; font-weight: 700; margin-bottom: 0.3rem; text-transform: uppercase; }
      .jury-select select { width: 100%; padding: 0.6rem; border-radius: 8px; border: 1px solid #cbd5e1; font-size: 0.9rem; }
      .text-president { color: #d97706; } .text-rapporteur { color: #2563eb; } .text-examinateur { color: #7c3aed; }

      /* Jury List View */
      .jury-list-view { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
      .jury-item { background: white; padding: 0.75rem; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 0.25rem; }
      .role-badge { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; width: fit-content; padding: 0.1rem 0.4rem; border-radius: 4px; }
      .role-badge.president { background: #fef3c7; color: #b45309; }
      .role-badge.rapporteur { background: #dbeafe; color: #1d4ed8; }
      .role-badge.examinateur { background: #f3e8ff; color: #6d28d9; }

      .loading-cell, .empty-cell { padding: 3rem; text-align: center; color: #64748b; }
      .empty-icon { font-size: 2rem; color: #cbd5e1; margin-bottom: 0.5rem; }
      .spinner-btn { width: 16px; height: 16px; border: 2px solid #ddd; border-top-color: #333; border-radius: 50%; animation: spin 1s linear infinite; display: inline-block; }
      .spinner-large { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #7c3aed; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
      .spinner-sm { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #7c3aed; border-radius: 50%; animation: spin 1s linear infinite; display: inline-block; }
      .spinner-sm-white { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite; display: inline-block; }

      @keyframes spin { 100% { transform: rotate(360deg); } }
      @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(124, 58, 237, 0); } }

      .toast { position: fixed; bottom: 2rem; right: 2rem; padding: 1rem 1.5rem; border-radius: 10px; color: white; font-weight: 600; z-index: 2000; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
      .toast.success { background: #22c55e; } .toast.error { background: #ef4444; }

      @media (max-width: 992px) {
        .stats-grid { grid-template-columns: repeat(2, 1fr); }
        .detail-grid, .jury-grid, .jury-list-view { grid-template-columns: 1fr; }
      }
    `]
})
export class DirectorSoutenanceComponent implements OnInit {
    soutenances = signal<any[]>([]);
    isLoading = signal(false);
    isSubmitting = signal(false);
    expandedId = signal<number | null>(null);
    activeTab = 'TODO';

    // Forms
    showDecisionForm = signal(false);
    decisionType = signal<'validate' | 'reject' | null>(null);
    commentaire = '';
    currentSoutenanceId: number | null = null;

    // Jury
    presidentsDisponibles = signal<MembreJury[]>([]);
    rapporteursDisponibles = signal<MembreJury[]>([]);
    examinateursDisponibles = signal<MembreJury[]>([]);
    jurySelection: JurySelection = { presidentId: null, rapporteurId: null, examinateurId: null };

    toastMessage = signal<string>('');
    toastType = signal<'success' | 'error'>('success');

    constructor(private soutenanceService: SoutenanceService, private authService: AuthService) {}

    ngOnInit() {
        this.loadData();
        this.loadMembresJuryDisponibles();
    }

    // --- CHARGEMENT ---
    loadData() {
        this.isLoading.set(true);
        const currentUser = this.authService.currentUser();
        if (!currentUser?.id) { this.isLoading.set(false); return; }

        this.soutenanceService.getSoutenancesByDirecteur(currentUser.id).subscribe({
            next: (data) => {
                this.soutenances.set(data);
                this.isLoading.set(false);
            },
            error: () => {
                this.isLoading.set(false);
                this.showToast('Erreur chargement des données', 'error');
            }
        });
    }

    loadMembresJuryDisponibles() {
        this.soutenanceService.getMembresJuryByRole('PRESIDENT').subscribe({ next: (d) => this.presidentsDisponibles.set(d) });
        this.soutenanceService.getMembresJuryByRole('RAPPORTEUR').subscribe({ next: (d) => this.rapporteursDisponibles.set(d) });
        this.soutenanceService.getMembresJuryByRole('EXAMINATEUR').subscribe({ next: (d) => this.examinateursDisponibles.set(d) });
    }

    // --- FILTRES ---
    setTab(tab: string) {
        this.activeTab = tab;
        this.expandedId.set(null);
    }

    filteredSoutenances() {
        const all = this.soutenances();
        if (this.activeTab === 'TODO') return all.filter(s => ['SOUMIS', 'AUTORISEE'].includes(s.statut));
        if (this.activeTab === 'PENDING') return all.filter(s => ['PREREQUIS_VALIDES', 'JURY_PROPOSE', 'PLANIFIEE'].includes(s.statut));
        if (this.activeTab === 'HISTORY') return all.filter(s => ['TERMINEE', 'REJETEE'].includes(s.statut));
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

    toggleExpand(id: number) {
        if (this.expandedId() === id) {
            this.expandedId.set(null);
            this.resetForms();
        } else {
            this.expandedId.set(id);
            this.resetForms();
        }
    }

    resetForms() {
        this.showDecisionForm.set(false);
        this.decisionType.set(null);
        this.commentaire = '';
        this.currentSoutenanceId = null;
    }

    // --- HELPERS ---
    getDoctorantName(s: any): string { return s.doctorantInfo ? `${s.doctorantInfo.prenom} ${s.doctorantInfo.nom}` : `Doc #${s.doctorantId}`; }
    getThesisTitle(s: any): string { return s.titreThese || 'Sujet non défini'; }
    getDocumentUrl(filename: string): string { return this.soutenanceService.getDocumentUrl(filename); }
    getInitials(name: string): string { const p = name.trim().split(' '); return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : name[0]?.toUpperCase() || '?'; }

    // Visuals
    getStatusBadgeClass(s: string) { return ['SOUMIS', 'AUTORISEE'].includes(s) ? 'pending' : ['PREREQUIS_VALIDES', 'JURY_PROPOSE'].includes(s) ? 'waiting' : s === 'PLANIFIEE' ? 'scheduled' : s === 'TERMINEE' ? 'success' : 'danger'; }
    getStatusIcon(s: string) { return ['SOUMIS', 'AUTORISEE'].includes(s) ? 'bi-exclamation-circle' : ['PREREQUIS_VALIDES', 'JURY_PROPOSE'].includes(s) ? 'bi-hourglass-split' : s === 'PLANIFIEE' ? 'bi-calendar-check' : s === 'TERMINEE' ? 'bi-check-circle-fill' : 'bi-x-circle'; }
    formatStatus(s: string) { const map: any = { 'SOUMIS': 'À Valider', 'PREREQUIS_VALIDES': 'Attente Admin', 'AUTORISEE': 'Jury à faire', 'JURY_PROPOSE': 'Jury en validation', 'PLANIFIEE': 'Planifiée', 'TERMINEE': 'Terminée' }; return map[s] || s; }

    // Data
    getPublications(s: any): number { return s.doctorantInfo?.nbPublications || 0; }
    getConferences(s: any): number { return s.doctorantInfo?.nbConferences || 0; }
    getHeuresFormation(s: any): number { return s.doctorantInfo?.heuresFormation || 0; }

    getStep(s: any): number { const steps = ['SOUMIS', 'PREREQUIS_VALIDES', 'AUTORISEE', 'JURY_PROPOSE', 'PLANIFIEE', 'TERMINEE']; return steps.indexOf(s.statut) + 1; }
    getStepClass(s: any, step: number) { const current = this.getStep(s); if (current > step) return 'completed'; if (current === step) return 'current'; return ''; }

    // Jury
    isJurySelectionValid() { return !!(this.jurySelection.presidentId && this.jurySelection.rapporteurId && this.jurySelection.examinateurId); }
    getUniqueJuryMembers(members: any[]): any[] { if (!members) return []; const seen = new Map(); return members.filter(m => { const k = `${m.nom}-${m.role}`; if (seen.has(k)) return false; seen.set(k, true); return true; }); }
    formatRole(r: string) { const roles: any = { 'PRESIDENT': 'Président', 'RAPPORTEUR': 'Rapporteur', 'EXAMINATEUR': 'Examinateur' }; return roles[r] || r; }

    // --- ACTIONS ---
    initiateValidation(id: number, e: Event) { e.stopPropagation(); this.currentSoutenanceId = id; this.showDecisionForm.set(true); this.decisionType.set('validate'); }
    initiateRejection(id: number, e: Event) { e.stopPropagation(); this.currentSoutenanceId = id; this.showDecisionForm.set(true); this.decisionType.set('reject'); }

    confirmValidation(id: number, e: Event) {
        e.stopPropagation();
        this.isSubmitting.set(true);
        this.soutenanceService.validerPrerequisDirecteur(id, 'Validé').subscribe({
            next: () => { this.showToast('Prérequis validés avec succès !', 'success'); this.loadData(); this.resetForms(); this.isSubmitting.set(false); },
            error: () => { this.showToast('Erreur lors de la validation', 'error'); this.isSubmitting.set(false); }
        });
    }

    confirmRejection(id: number, e: Event) {
        e.stopPropagation();
        this.isSubmitting.set(true);
        this.soutenanceService.rejeterDemandeDirecteur(id, this.commentaire).subscribe({
            next: () => { this.showToast('Demande de corrections envoyée', 'success'); this.loadData(); this.resetForms(); this.isSubmitting.set(false); },
            error: () => { this.showToast('Erreur lors du rejet', 'error'); this.isSubmitting.set(false); }
        });
    }

    submitJurySelection(id: number, e: Event) {
        e.stopPropagation();
        if (!this.isJurySelectionValid()) return;
        this.isSubmitting.set(true);

        const p = this.presidentsDisponibles().find(m => m.id === this.jurySelection.presidentId)!;
        const r = this.rapporteursDisponibles().find(m => m.id === this.jurySelection.rapporteurId)!;
        const ex = this.examinateursDisponibles().find(m => m.id === this.jurySelection.examinateurId)!;

        const cleanMember = (m: MembreJury, role: string) => ({ nom: m.nom, prenom: m.prenom, email: m.email, etablissement: m.etablissement, grade: m.grade, specialite: m.specialite, role: role });

        const reqs = [
            this.soutenanceService.ajouterMembreJury(id, cleanMember(p, 'PRESIDENT')),
            this.soutenanceService.ajouterMembreJury(id, cleanMember(r, 'RAPPORTEUR')),
            this.soutenanceService.ajouterMembreJury(id, cleanMember(ex, 'EXAMINATEUR'))
        ];

        forkJoin(reqs).subscribe({
            next: () => {
                this.soutenanceService.proposerJury(id).subscribe({
                    next: () => { this.showToast('Jury soumis pour validation !', 'success'); this.loadData(); this.resetForms(); this.isSubmitting.set(false); },
                    error: () => { this.showToast('Erreur lors de la proposition du jury', 'error'); this.isSubmitting.set(false); }
                });
            },
            error: (err) => { this.showToast('Erreur lors de l\'ajout des membres', 'error'); this.isSubmitting.set(false); }
        });
    }

    showToast(msg: string, type: 'success' | 'error') {
        this.toastMessage.set(msg); this.toastType.set(type);
        setTimeout(() => this.toastMessage.set(''), 4000);
    }
}