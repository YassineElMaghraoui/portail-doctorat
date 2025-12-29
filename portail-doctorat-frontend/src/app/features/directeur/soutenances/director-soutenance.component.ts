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
                <!-- Header -->
                <div class="hero-section">
                    <div class="hero-content">
                        <div class="hero-icon"><i class="bi bi-mortarboard"></i></div>
                        <div>
                            <h1 class="hero-title">Gestion des Soutenances</h1>
                            <p class="hero-subtitle">Validez les demandes et proposez les membres du jury</p>
                        </div>
                    </div>
                    <button class="btn-refresh" (click)="loadData()" [disabled]="isLoading()">
                        @if (isLoading()) { <span class="spinner"></span> } @else { <i class="bi bi-arrow-clockwise"></i> }
                        Actualiser
                    </button>
                </div>

                <!-- Stats -->
                <div class="stats-grid">
                    <div class="stat-card"><div class="stat-icon pending"><i class="bi bi-hourglass-split"></i></div><div class="stat-info"><span class="stat-value">{{ getPendingValidationCount() }}</span><span class="stat-label">À valider (prérequis)</span></div></div>
                    <div class="stat-card"><div class="stat-icon jury-needed"><i class="bi bi-people"></i></div><div class="stat-info"><span class="stat-value">{{ getJuryNeededCount() }}</span><span class="stat-label">Jury à proposer</span></div></div>
                    <div class="stat-card"><div class="stat-icon waiting"><i class="bi bi-clock-history"></i></div><div class="stat-info"><span class="stat-value">{{ getWaitingAdminCount() }}</span><span class="stat-label">En attente admin</span></div></div>
                    <div class="stat-card"><div class="stat-icon total"><i class="bi bi-collection"></i></div><div class="stat-info"><span class="stat-value">{{ soutenances().length }}</span><span class="stat-label">Total</span></div></div>
                </div>

                <!-- Loading / Empty -->
                @if (isLoading()) { <div class="loading-state"><div class="loading-spinner"></div><span>Chargement...</span></div> }
                @if (!isLoading() && soutenances().length === 0) { <div class="empty-state"><div class="empty-icon"><i class="bi bi-inbox"></i></div><h3>Aucune demande</h3></div> }

                <!-- List -->
                @if (!isLoading() && soutenances().length > 0) {
                    <div class="soutenances-section">
                        <div class="section-header"><h3 class="section-title"><i class="bi bi-list-task me-2"></i>Demandes de soutenance</h3></div>
                        <div class="soutenances-list">
                            @for (soutenance of soutenances(); track soutenance.id) {
                                <div class="soutenance-card" [class.expanded]="expandedId() === soutenance.id">

                                    <!-- Card Main (Summary) -->
                                    <div class="card-main" (click)="toggleExpand(soutenance.id)">
                                        <div class="card-left"><div class="status-indicator" [ngClass]="getStatusIndicatorClass(soutenance.statut)"><i class="bi" [ngClass]="getStatusIcon(soutenance.statut)"></i></div></div>
                                        <div class="card-content">
                                            <div class="card-header-row">
                                                <span class="doctorant-name">{{ getDoctorantName(soutenance) }}</span>
                                                <span class="status-badge" [ngClass]="getStatusBadgeClass(soutenance.statut)">{{ formatStatus(soutenance.statut) }}</span>
                                            </div>
                                            <h4 class="thesis-title">{{ getThesisTitle(soutenance) }}</h4>
                                            <div class="card-meta">
                                                <span class="meta-item"><i class="bi bi-calendar3"></i>{{ soutenance.createdAt | date:'dd MMM yyyy' }}</span>
                                                @if (needsDirectorAction(soutenance.statut)) { <span class="meta-item action-needed"><i class="bi bi-exclamation-circle-fill"></i>{{ getActionNeededText(soutenance.statut) }}</span> }
                                            </div>
                                        </div>
                                        <div class="card-right"><i class="bi bi-chevron-down expand-icon" [class.rotated]="expandedId() === soutenance.id"></i></div>
                                    </div>

                                    <!-- Expanded Details -->
                                    @if (expandedId() === soutenance.id) {
                                        <div class="card-details">
                                            <div class="details-grid">
                                                <!-- Docs -->
                                                <div class="detail-section">
                                                    <h5 class="detail-title"><i class="bi bi-file-earmark-text"></i>Documents</h5>
                                                    <div class="docs-list">
                                                        <a [href]="getDocumentUrl(soutenance.cheminManuscrit)" target="_blank" class="doc-link"><i class="bi bi-file-pdf"></i>Manuscrit</a>
                                                        <a [href]="getDocumentUrl(soutenance.cheminRapportAntiPlagiat)" target="_blank" class="doc-link"><i class="bi bi-shield-check"></i>Rapport Anti-plagiat</a>
                                                    </div>
                                                </div>

                                                <!-- WORKFLOW LOGIC -->

                                                <!-- ÉTAPE 1: SOUMIS (Directeur valide prérequis) -->
                                                <!-- ✨ DESIGN AMÉLIORÉ ✨ -->
                                                @if (soutenance.statut === 'SOUMIS') {
                                                    <div class="detail-section actions-wrapper">
                                                        <h5 class="detail-title"><i class="bi bi-check2-square"></i>Décision sur les prérequis</h5>

                                                        @if (!showDecisionForm() || currentSoutenanceId !== soutenance.id) {
                                                            <div class="choice-grid">
                                                                <button class="choice-card approve" (click)="initiateValidation(soutenance.id, $event)">
                                                                    <div class="choice-icon"><i class="bi bi-check-circle-fill"></i></div>
                                                                    <div class="choice-content">
                                                                        <h6>Valider les prérequis</h6>
                                                                        <p>Le dossier est complet. Transmettre à l'administration.</p>
                                                                    </div>
                                                                    <i class="bi bi-arrow-right choice-arrow"></i>
                                                                </button>

                                                                <button class="choice-card reject" (click)="initiateRejection(soutenance.id, $event)">
                                                                    <div class="choice-icon"><i class="bi bi-pencil-square"></i></div>
                                                                    <div class="choice-content">
                                                                        <h6>Demander des corrections</h6>
                                                                        <p>Le dossier nécessite des modifications par le doctorant.</p>
                                                                    </div>
                                                                    <i class="bi bi-arrow-right choice-arrow"></i>
                                                                </button>
                                                            </div>
                                                        }

                                                     
                                                        @else if (decisionType() === 'validate') {
                                                            <div class="decision-panel approve-mode">
                                                                <div class="panel-header">
                                                                    <i class="bi bi-check-circle-fill"></i>
                                                                    <span>Confirmation de validation</span>
                                                                </div>
                                                                <div class="panel-body">
                                                                    <p>Vous êtes sur le point de valider les prérequis académiques de <strong>{{ getDoctorantName(soutenance) }}</strong>.</p>
                                                                    <p class="sub-text">Cette action transmettra le dossier à l'administration pour autorisation finale.</p>
                                                                </div>
                                                                <div class="panel-actions">
                                                                    <button class="btn-panel-cancel" (click)="cancelDecision($event)">Annuler</button>
                                                                    <button class="btn-panel-confirm approve" [disabled]="isSubmitting()" (click)="confirmValidation(soutenance.id, $event)">
                                                                        @if (isSubmitting()) { <span class="spinner-sm"></span> }
                                                                        Confirmer la validation
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        }

                                               
                                                        @else {
                                                            <div class="decision-panel reject-mode">
                                                                <div class="panel-header">
                                                                    <i class="bi bi-exclamation-triangle-fill"></i>
                                                                    <span>Demande de corrections</span>
                                                                </div>
                                                                <div class="panel-body">
                                                                    <label>Veuillez indiquer les éléments à corriger :</label>
                                                                    <textarea class="decision-textarea" rows="4" [(ngModel)]="commentaire" placeholder="Ex: Le rapport anti-plagiat est manquant ou incomplet..."></textarea>
                                                                </div>
                                                                <div class="panel-actions">
                                                                    <button class="btn-panel-cancel" (click)="cancelDecision($event)">Annuler</button>
                                                                    <button class="btn-panel-confirm reject" [disabled]="!commentaire.trim()" (click)="confirmRejection(soutenance.id, $event)">
                                                                        Envoyer la demande
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        }
                                                    </div>
                                                }

                                                <!-- ÉTAPE 2: PREREQUIS_VALIDES (Attente Admin - PAS DE JURY ICI) -->
                                                @if (soutenance.statut === 'PREREQUIS_VALIDES') {
                                                    <div class="detail-section waiting-section">
                                                        <div class="waiting-content">
                                                            <div class="waiting-icon"><i class="bi bi-hourglass-split"></i></div>
                                                            <div class="waiting-text">
                                                                <h6>En attente d'approbation administrative</h6>
                                                                <p>Vous avez validé les prérequis. L'administration doit maintenant autoriser formellement la soutenance avant que vous puissiez composer le jury.</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                }

                                                <!-- ÉTAPE 3: AUTORISEE (Proposition Jury) -->
                                                @if (soutenance.statut === 'AUTORISEE') {
                                                    <div class="detail-section jury-section">
                                                        <h5 class="detail-title"><i class="bi bi-people-fill"></i>Sélection du jury</h5>
                                                        <p class="jury-info"><i class="bi bi-check-circle"></i> Demande autorisée par l'administration. Veuillez composer le jury.</p>

                                                        <div class="jury-dropdowns-container">
                                                            <!-- Président -->
                                                            <div class="jury-dropdown-card president">
                                                                <div class="dropdown-header"><div class="role-icon president"><i class="bi bi-star-fill"></i></div><div class="role-info"><span class="role-title">Président</span><span class="role-required">Obligatoire</span></div></div>
                                                                <select class="jury-select" [(ngModel)]="jurySelection.presidentId">
                                                                    <option [ngValue]="null">-- Sélectionner --</option>
                                                                    @for (m of presidentsDisponibles(); track m.id) { <option [ngValue]="m.id">{{ m.prenom }} {{ m.nom }} - {{ m.etablissement }}</option> }
                                                                </select>
                                                            </div>
                                                            <!-- Rapporteur -->
                                                            <div class="jury-dropdown-card rapporteur">
                                                                <div class="dropdown-header"><div class="role-icon rapporteur"><i class="bi bi-file-earmark-text-fill"></i></div><div class="role-info"><span class="role-title">Rapporteur</span><span class="role-required">Obligatoire</span></div></div>
                                                                <select class="jury-select" [(ngModel)]="jurySelection.rapporteurId">
                                                                    <option [ngValue]="null">-- Sélectionner --</option>
                                                                    @for (m of rapporteursDisponibles(); track m.id) { <option [ngValue]="m.id">{{ m.prenom }} {{ m.nom }} - {{ m.etablissement }}</option> }
                                                                </select>
                                                            </div>
                                                            <!-- Examinateur -->
                                                            <div class="jury-dropdown-card examinateur">
                                                                <div class="dropdown-header"><div class="role-icon examinateur"><i class="bi bi-search"></i></div><div class="role-info"><span class="role-title">Examinateur</span><span class="role-required">Obligatoire</span></div></div>
                                                                <select class="jury-select" [(ngModel)]="jurySelection.examinateurId">
                                                                    <option [ngValue]="null">-- Sélectionner --</option>
                                                                    @for (m of examinateursDisponibles(); track m.id) { <option [ngValue]="m.id">{{ m.prenom }} {{ m.nom }} - {{ m.etablissement }}</option> }
                                                                </select>
                                                            </div>
                                                        </div>

                                                        <div class="jury-validation">
                                                            <button class="btn-action validate full-width" [disabled]="!isJurySelectionValid() || isSubmitting()" (click)="submitJurySelection(soutenance.id, $event)">
                                                                @if (isSubmitting()) { <span class="spinner-sm"></span>Envoi... } @else { <i class="bi bi-send-check"></i>Soumettre le jury pour validation }
                                                            </button>
                                                        </div>
                                                    </div>
                                                }

                                                <!-- ÉTAPE 4: JURY_PROPOSE (Attente Validation Jury) -->
                                                @if (soutenance.statut === 'JURY_PROPOSE') {
                                                    <div class="detail-section waiting-section">
                                                        <div class="waiting-content">
                                                            <div class="waiting-icon"><i class="bi bi-people"></i></div>
                                                            <div class="waiting-text">
                                                                <h6>Jury en cours de validation</h6>
                                                                <p>Votre proposition de jury a été envoyée. L'administration va la vérifier et planifier la date.</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <!-- Affichage du jury proposé (lecture seule) -->
                                                    @if (soutenance.membresJury?.length > 0) {
                                                        <div class="detail-section jury-display">
                                                            <h5 class="detail-title">Jury Proposé</h5>
                                                            <div class="jury-list">
                                                                @for (m of soutenance.membresJury; track m.id) {
                                                                    <div class="jury-display-card"><span class="jury-name">{{ m.prenom }} {{ m.nom }}</span><span class="jury-role-badge">{{ formatRole(m.role) }}</span></div>
                                                                }
                                                            </div>
                                                        </div>
                                                    }
                                                }

                                                <!-- ÉTAPE 5: PLANIFIEE -->
                                                @if (soutenance.statut === 'PLANIFIEE' && soutenance.dateSoutenance) {
                                                    <div class="detail-section date-section">
                                                        <h5 class="detail-title"><i class="bi bi-calendar-event"></i>Soutenance planifiée</h5>
                                                        <div class="date-display">
                                                            <div class="date-icon"><i class="bi bi-calendar-check-fill"></i></div>
                                                            <div class="date-info">
                                                                <span class="date-value">{{ soutenance.dateSoutenance | date:'EEEE dd MMMM yyyy' }}</span>
                                                                @if (soutenance.heureSoutenance) { <span class="time-value"><i class="bi bi-clock"></i>{{ soutenance.heureSoutenance }}</span> }
                                                                @if (soutenance.lieuSoutenance) { <span class="location-value"><i class="bi bi-geo-alt"></i>{{ soutenance.lieuSoutenance }}</span> }
                                                            </div>
                                                        </div>
                                                    </div>
                                                }
                                            </div>
                                        </div>
                                    }
                                </div>
                            }
                        </div>
                    </div>
                }

                @if (toastMessage()) {
                    <div class="toast" [class.success]="toastType() === 'success'" [class.error]="toastType() === 'error'">
                        <i class="bi" [ngClass]="toastType() === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'"></i>{{ toastMessage() }}
                    </div>
                }
            </div>
        </app-main-layout>
    `,
    styles: [`
      .page-container { max-width: 1000px; margin: 0 auto; padding: 0 1.5rem 3rem; }
      .hero-section { background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); border-radius: 24px; padding: 2rem; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; position: relative; overflow: hidden; }
      .hero-content { display: flex; align-items: center; gap: 1.25rem; z-index: 2; }
      .hero-icon { width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; color: white; }
      .hero-title { font-size: 1.6rem; font-weight: 800; margin: 0; }
      .hero-subtitle { margin: 0.25rem 0 0; opacity: 0.9; }
      .btn-refresh { padding: 0.75rem 1.5rem; background: white; color: #6d28d9; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; }

      .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
      .stat-card { background: white; border-radius: 16px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; border: 1px solid #e2e8f0; }
      .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
      .stat-icon.pending { background: #fef3c7; color: #f59e0b; }
      .stat-icon.jury-needed { background: #dcfce7; color: #166534; }
      .stat-icon.waiting { background: #e0e7ff; color: #6366f1; }
      .stat-icon.total { background: #f1f5f9; color: #64748b; }
      .stat-value { font-size: 1.5rem; font-weight: 700; color: #1e293b; display: block; }
      .stat-label { font-size: 0.75rem; color: #64748b; }

      .soutenances-section { background: white; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; }
      .section-header { padding: 1.25rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
      .section-title { margin: 0; font-size: 1rem; font-weight: 700; color: #1e293b; }
      .soutenances-list { padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }

      .soutenance-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; transition: all 0.2s; }
      .soutenance-card:hover { transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
      .card-main { display: flex; align-items: center; padding: 1.25rem; cursor: pointer; }
      .card-left { margin-right: 1rem; }
      .status-indicator { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
      .status-indicator.pending { background: #fef3c7; color: #f59e0b; }
      .status-indicator.waiting-admin { background: #e0e7ff; color: #6366f1; }
      .status-indicator.jury { background: #dcfce7; color: #166534; }

      .card-content { flex: 1; }
      .card-header-row { display: flex; justify-content: space-between; align-items: center; }
      .doctorant-name { font-weight: 700; color: #1e293b; }
      .thesis-title { font-size: 0.95rem; color: #334155; margin: 0.25rem 0; font-weight: 600; }
      .status-badge { padding: 0.25rem 0.6rem; border-radius: 50px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
      .status-badge.pending { background: #fef3c7; color: #b45309; }
      .status-badge.waiting-admin { background: #e0e7ff; color: #4338ca; }
      .status-badge.jury { background: #dcfce7; color: #166534; }

      .card-details { padding: 1.5rem; border-top: 1px solid #f1f5f9; background: #fafbfc; }
      .detail-section { background: white; padding: 1.25rem; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 1rem; }
      .detail-title { font-size: 0.85rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }

      .detail-section.actions-wrapper { border-left: 4px solid #8b5cf6; }
      .detail-section.waiting-section { border-left: 4px solid #6366f1; background: #eff6ff; }
      .detail-section.jury-section { border-left: 4px solid #10b981; }

      .docs-list { display: flex; gap: 1rem; }
      .doc-link { padding: 0.5rem 1rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; text-decoration: none; color: #334155; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem; }
      .doc-link:hover { border-color: #8b5cf6; color: #8b5cf6; }

      /* --- NOUVEAU DESIGN DE VALIDATION --- */
      .choice-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; }
      .choice-card { display: flex; align-items: center; gap: 1rem; padding: 1.25rem; border-radius: 12px; border: 1px solid; background: white; cursor: pointer; text-align: left; transition: all 0.2s; }
      .choice-card:hover { transform: translateY(-3px); box-shadow: 0 8px 15px -3px rgba(0,0,0,0.05); }

      .choice-card.approve { border-color: #86efac; background: linear-gradient(145deg, #ffffff, #f0fdf4); }
      .choice-card.approve:hover { border-color: #22c55e; }
      .choice-card.approve .choice-icon { background: #dcfce7; color: #16a34a; }

      .choice-card.reject { border-color: #fecaca; background: linear-gradient(145deg, #ffffff, #fef2f2); }
      .choice-card.reject:hover { border-color: #ef4444; }
      .choice-card.reject .choice-icon { background: #fee2e2; color: #dc2626; }

      .choice-icon { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0; }
      .choice-content h6 { margin: 0; font-size: 1rem; font-weight: 700; color: #1e293b; }
      .choice-content p { margin: 0.25rem 0 0; font-size: 0.85rem; color: #64748b; }
      .choice-arrow { margin-left: auto; color: #cbd5e1; font-size: 1.25rem; transition: transform 0.2s; }
      .choice-card:hover .choice-arrow { transform: translateX(4px); color: inherit; }

      /* PANNEAUX DE DÉCISION */
      .decision-panel { margin-top: 1rem; border-radius: 12px; overflow: hidden; animation: slideDown 0.3s ease; border: 1px solid; }
      .approve-mode { background: #f0fdf4; border-color: #86efac; }
      .reject-mode { background: #fef2f2; border-color: #fecaca; }

      .panel-header { padding: 1rem; display: flex; align-items: center; gap: 0.75rem; font-weight: 700; font-size: 1rem; }
      .approve-mode .panel-header { background: rgba(34, 197, 94, 0.1); color: #15803d; }
      .reject-mode .panel-header { background: rgba(239, 68, 68, 0.1); color: #b91c1c; }

      .panel-body { padding: 1.5rem; }
      .panel-body p { margin: 0; color: #1e293b; }
      .sub-text { font-size: 0.9rem; color: #475569; margin-top: 0.5rem !important; }
      .decision-textarea { width: 100%; padding: 0.75rem; border: 1px solid #fca5a5; border-radius: 8px; margin-top: 0.5rem; font-size: 0.95rem; }
      .decision-textarea:focus { outline: none; border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1); }

      .panel-actions { padding: 1rem 1.5rem; background: rgba(255,255,255,0.5); display: flex; justify-content: flex-end; gap: 1rem; border-top: 1px solid rgba(0,0,0,0.05); }
      .btn-panel-cancel { padding: 0.6rem 1.2rem; background: white; border: 1px solid #e2e8f0; border-radius: 8px; font-weight: 600; color: #64748b; cursor: pointer; }
      .btn-panel-confirm { padding: 0.6rem 1.5rem; border: none; border-radius: 8px; font-weight: 600; color: white; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: transform 0.1s; }
      .btn-panel-confirm:active { transform: translateY(1px); }
      .btn-panel-confirm.approve { background: #16a34a; }
      .btn-panel-confirm.approve:hover { background: #15803d; }
      .btn-panel-confirm.reject { background: #dc2626; }
      .btn-panel-confirm.reject:hover { background: #b91c1c; }

      .jury-dropdowns-container { display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem; }
      .jury-dropdown-card { padding: 1rem; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
      .jury-select { width: 100%; padding: 0.6rem; border-radius: 6px; border: 1px solid #cbd5e1; margin-top: 0.5rem; }
      .jury-validation { margin-top: 1.5rem; }
      .full-width { width: 100%; }
      .btn-action.validate { background: #22c55e; color: white; width: 100%; padding: 0.8rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }

      .spinner { width: 18px; height: 18px; border: 2px solid rgba(109,40,217,0.2); border-top-color: #6d28d9; border-radius: 50%; animation: spin 1s linear infinite; }
      .spinner-sm { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite; display: inline-block; }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

      .toast { position: fixed; bottom: 2rem; right: 2rem; padding: 1rem 1.5rem; border-radius: 12px; color: white; font-weight: 600; z-index: 1000; display: flex; align-items: center; gap: 0.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
      .toast.success { background: #10b981; }
      .toast.error { background: #ef4444; }

      @media (max-width: 768px) {
        .choice-grid { grid-template-columns: 1fr; }
        .stats-grid { grid-template-columns: repeat(2, 1fr); }
      }
    `]
})
export class DirectorSoutenanceComponent implements OnInit {
    soutenances = signal<any[]>([]);
    isLoading = signal(false);
    isSubmitting = signal(false);
    expandedId = signal<number | null>(null);
    showDecisionForm = signal(false);
    decisionType = signal<'validate' | 'reject' | null>(null);
    commentaire = '';
    currentSoutenanceId: number | null = null;

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

    toggleExpand(id: number) {
        if (this.expandedId() === id) { this.expandedId.set(null); this.resetForms(); }
        else { this.expandedId.set(id); this.resetForms(); }
    }

    resetForms() {
        this.showDecisionForm.set(false);
        this.decisionType.set(null);
        this.commentaire = '';
        this.currentSoutenanceId = null;
        this.jurySelection = { presidentId: null, rapporteurId: null, examinateurId: null };
    }

    showToast(msg: string, type: 'success' | 'error') {
        this.toastMessage.set(msg);
        this.toastType.set(type);
        setTimeout(() => this.toastMessage.set(''), 4000);
    }

    isJurySelectionValid(): boolean {
        return !!(this.jurySelection.presidentId && this.jurySelection.rapporteurId && this.jurySelection.examinateurId);
    }

    submitJurySelection(soutenanceId: number, event: Event) {
        event.stopPropagation();
        if (!this.isJurySelectionValid()) return;
        this.isSubmitting.set(true);

        const president = this.presidentsDisponibles().find(m => m.id === this.jurySelection.presidentId)!;
        const rapporteur = this.rapporteursDisponibles().find(m => m.id === this.jurySelection.rapporteurId)!;
        const examinateur = this.examinateursDisponibles().find(m => m.id === this.jurySelection.examinateurId)!;

        const addRequests = [
            this.soutenanceService.ajouterMembreJury(soutenanceId, { nom: president.nom, prenom: president.prenom, email: president.email, etablissement: president.etablissement, grade: president.grade, specialite: president.specialite, role: 'PRESIDENT' }),
            this.soutenanceService.ajouterMembreJury(soutenanceId, { nom: rapporteur.nom, prenom: rapporteur.prenom, email: rapporteur.email, etablissement: rapporteur.etablissement, grade: rapporteur.grade, specialite: rapporteur.specialite, role: 'RAPPORTEUR' }),
            this.soutenanceService.ajouterMembreJury(soutenanceId, { nom: examinateur.nom, prenom: examinateur.prenom, email: examinateur.email, etablissement: examinateur.etablissement, grade: examinateur.grade, specialite: examinateur.specialite, role: 'EXAMINATEUR' })
        ];

        forkJoin(addRequests).subscribe({
            next: () => {
                this.soutenanceService.proposerJury(soutenanceId).subscribe({
                    next: () => { this.showToast('Jury proposé avec succès !', 'success'); this.loadData(); this.resetForms(); this.isSubmitting.set(false); },
                    error: (e) => { this.showToast(e.error?.error || 'Erreur lors de la proposition', 'error'); this.isSubmitting.set(false); }
                });
            },
            error: (e) => { this.showToast('Erreur lors de l\'ajout des membres', 'error'); this.isSubmitting.set(false); }
        });
    }

    // Helpers
    getDoctorantName(s: any): string { return s.doctorantInfo ? `${s.doctorantInfo.prenom} ${s.doctorantInfo.nom}` : `Doctorant #${s.doctorantId}`; }
    getThesisTitle(s: any): string { return s.titreThese || 'Sujet non défini'; }
    getDocumentUrl(filename: string): string { return this.soutenanceService.getDocumentUrl(filename); }

    // Actions requises par le directeur uniquement sur SOUMIS (prérequis) et AUTORISEE (jury)
    needsDirectorAction(statut: string): boolean { return ['SOUMIS', 'AUTORISEE'].includes(statut); }

    getActionNeededText(statut: string): string {
        if (statut === 'SOUMIS') return 'Valider prérequis';
        if (statut === 'AUTORISEE') return 'Sélectionner jury';
        return '';
    }

    getPendingValidationCount(): number { return this.soutenances().filter(s => s.statut === 'SOUMIS').length; }
    getJuryNeededCount(): number { return this.soutenances().filter(s => s.statut === 'AUTORISEE').length; }
    getWaitingAdminCount(): number { return this.soutenances().filter(s => ['PREREQUIS_VALIDES', 'JURY_PROPOSE'].includes(s.statut)).length; }

    getStatusIndicatorClass(statut: string): string {
        const map: Record<string, string> = { 'SOUMIS': 'pending', 'PREREQUIS_VALIDES': 'waiting-admin', 'AUTORISEE': 'jury', 'JURY_PROPOSE': 'waiting-admin', 'PLANIFIEE': 'scheduled', 'TERMINEE': 'approved', 'REJETEE': 'rejected' };
        return map[statut] || 'pending';
    }
    getStatusIcon(statut: string): string {
        const map: Record<string, string> = { 'SOUMIS': 'bi-hourglass-split', 'PREREQUIS_VALIDES': 'bi-clock', 'AUTORISEE': 'bi-people', 'JURY_PROPOSE': 'bi-send', 'PLANIFIEE': 'bi-calendar-check', 'TERMINEE': 'bi-trophy' };
        return map[statut] || 'bi-circle';
    }
    getStatusBadgeClass(statut: string): string { return this.getStatusIndicatorClass(statut); }

    formatStatus(statut: string): string {
        const map: Record<string, string> = {
            'SOUMIS': 'À Valider',
            'PREREQUIS_VALIDES': 'Attente Admin',
            'AUTORISEE': 'À Jury',
            'JURY_PROPOSE': 'Jury Soumis',
            'PLANIFIEE': 'Planifiée',
            'TERMINEE': 'Terminée'
        };
        return map[statut] || statut;
    }

    formatRole(role: string): string {
        const map: Record<string, string> = { 'PRESIDENT': 'Président', 'RAPPORTEUR': 'Rapporteur', 'EXAMINATEUR': 'Examinateur' };
        return map[role] || role;
    }

    // Workflow Actions
    initiateValidation(id: number, e: Event) { e.stopPropagation(); this.currentSoutenanceId = id; this.showDecisionForm.set(true); this.decisionType.set('validate'); }
    initiateRejection(id: number, e: Event) { e.stopPropagation(); this.currentSoutenanceId = id; this.showDecisionForm.set(true); this.decisionType.set('reject'); this.commentaire = ''; }
    cancelDecision(e: Event) { e.stopPropagation(); this.showDecisionForm.set(false); this.decisionType.set(null); this.commentaire = ''; this.currentSoutenanceId = null; }

    confirmValidation(id: number, e: Event) {
        e.stopPropagation();
        this.isSubmitting.set(true);
        this.soutenanceService.validerPrerequisDirecteur(id, 'Prérequis validés').subscribe({
            next: () => { this.showToast('Prérequis validés. En attente d\'autorisation admin.', 'success'); this.loadData(); this.showDecisionForm.set(false); this.isSubmitting.set(false); },
            error: (err) => { this.showToast(err.error?.error || 'Erreur', 'error'); this.isSubmitting.set(false); }
        });
    }

    confirmRejection(id: number, e: Event) {
        e.stopPropagation();
        if (!this.commentaire.trim()) return;
        this.isSubmitting.set(true);
        this.soutenanceService.rejeterDemandeDirecteur(id, this.commentaire.trim()).subscribe({
            next: () => { this.showToast('Corrections demandées', 'success'); this.loadData(); this.showDecisionForm.set(false); this.isSubmitting.set(false); },
            error: (err) => { this.showToast(err.error?.error || 'Erreur', 'error'); this.isSubmitting.set(false); }
        });
    }
}