import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '@shared/components/main-layout/main-layout.component';
import { InscriptionService } from '@core/services/inscription.service';
import { UserService } from '@core/services/user.service';

@Component({
    selector: 'app-admin-reinscriptions',
    standalone: true,
    imports: [CommonModule, FormsModule, MainLayoutComponent],
    template: `
        <app-main-layout>
            <div class="page-container">

                <!-- HERO HEADER -->
                <div class="hero-section">
                    <div class="hero-content">
                        <div class="hero-icon"><i class="bi bi-journal-check"></i></div>
                        <div>
                            <h1 class="hero-title">Gestion des Réinscriptions</h1>
                            <p class="hero-subtitle">Validez les dossiers annuels des doctorants</p>
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
                        <div class="stat-icon-wrap"><i class="bi bi-hourglass-split"></i></div>
                        <div class="stat-info"><span class="stat-value">{{ getCount('EN_ATTENTE_ADMIN') }}</span><span class="stat-label">À traiter (Admin)</span></div>
                    </div>
                    <div class="stat-card blue">
                        <div class="stat-icon-wrap"><i class="bi bi-person-badge"></i></div>
                        <div class="stat-info"><span class="stat-value">{{ getCount('EN_ATTENTE_DIRECTEUR') }}</span><span class="stat-label">Chez Directeur</span></div>
                    </div>
                    <div class="stat-card green">
                        <div class="stat-icon-wrap"><i class="bi bi-check-circle"></i></div>
                        <div class="stat-info"><span class="stat-value">{{ getCount('ADMIS') }}</span><span class="stat-label">Validées</span></div>
                    </div>
                    <div class="stat-card red">
                        <div class="stat-icon-wrap"><i class="bi bi-x-circle"></i></div>
                        <div class="stat-info"><span class="stat-value">{{ getCount('REJETE') }}</span><span class="stat-label">Refusées</span></div>
                    </div>
                </div>

                <!-- TABS -->
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

                <!-- LOADING STATE -->
                @if (isLoading()) {
                    <div class="loading-state"><div class="spinner-large"></div><p>Chargement des dossiers...</p></div>
                }

                <!-- TABLEAU LISTE -->
                @if (!isLoading()) {
                    <div class="section-card">
                        <div class="table-container">
                            <table class="data-table">
                                <thead>
                                <tr>
                                    <th style="width: 28%;">Doctorant</th>
                                    <th>Directeur</th>
                                    <th>Année</th>
                                    <th>Sujet</th>
                                    <th>Date soumission</th>
                                    <th>Statut</th>
                                    <th style="width: 50px;"></th>
                                </tr>
                                </thead>
                                <tbody>
                                    @if (filteredInscriptions().length === 0) {
                                        <tr>
                                            <td colspan="7" class="empty-cell">
                                                <div class="empty-content">
                                                    <i class="bi bi-inbox"></i>
                                                    <p>Aucun dossier dans cette catégorie</p>
                                                </div>
                                            </td>
                                        </tr>
                                    } @else {
                                        @for (insc of filteredInscriptions(); track insc.id) {
                                            <!-- LIGNE PRINCIPALE -->
                                            <tr class="clickable" [class.expanded-row]="expandedId() === insc.id" (click)="toggleExpand(insc.id)">
                                                <td>
                                                    <div class="user-cell">
                                                        <div class="avatar-circle blue">{{ getInitials(insc) }}</div>
                                                        <div class="user-info">
                                                            <span class="name">{{ getDoctorantName(insc) }}</span>
                                                            <span class="id">Mat: {{ insc.doctorant?.username || 'N/A' }}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td class="fw-bold text-dark">{{ getDirecteurName(insc) }}</td>
                                                <td><span class="badge year">{{ insc.anneeInscription }}ème</span></td>
                                                <td><div class="motif-cell" [title]="insc.sujetThese">{{ truncate(insc.sujetThese) }}</div></td>
                                                <td><span class="date-badge">{{ insc.createdAt | date:'dd/MM/yyyy' }}</span></td>
                                                <td>
                                                    <span class="status-badge" [ngClass]="getStatusClass(insc.statut)">
                                                        <i class="bi" [ngClass]="getStatusIcon(insc.statut)"></i>
                                                        {{ formatStatus(insc.statut) }}
                                                    </span>
                                                </td>
                                                <td><i class="bi bi-chevron-down expand-icon" [class.rotated]="expandedId() === insc.id"></i></td>
                                            </tr>

                                            <!-- DÉTAILS EXPANDÉS -->
                                            @if (expandedId() === insc.id) {
                                                <tr class="details-row">
                                                    <td colspan="7">
                                                        <div class="details-panel">

                                                            <!-- WORKFLOW VISUEL (STEPPER) : Soumission → Directeur → Admin → Terminé -->
                                                            <div class="workflow-container">
                                                                <!-- 1. Soumission -->
                                                                <div class="step completed">
                                                                    <div class="step-circle"><i class="bi bi-check-lg"></i></div>
                                                                    <span class="step-label">Soumission</span>
                                                                </div>
                                                                <div class="step-line" [class.active]="getWorkflowStep(insc) >= 2"></div>

                                                                <!-- 2. Directeur (PREMIER) -->
                                                                <div class="step" [ngClass]="getStepClass(insc, 2)">
                                                                    <div class="step-circle">
                                                                        @if(getWorkflowStep(insc) > 2) { <i class="bi bi-check-lg"></i> }
                                                                        @else { <i class="bi bi-person-badge"></i> }
                                                                    </div>
                                                                    <span class="step-label">Directeur</span>
                                                                </div>
                                                                <div class="step-line" [class.active]="getWorkflowStep(insc) >= 3"></div>

                                                                <!-- 3. Administration (SECOND) -->
                                                                <div class="step" [ngClass]="getStepClass(insc, 3)">
                                                                    <div class="step-circle">
                                                                        @if(getWorkflowStep(insc) > 3) { <i class="bi bi-check-lg"></i> }
                                                                        @else { <i class="bi bi-building"></i> }
                                                                    </div>
                                                                    <span class="step-label">Administration</span>
                                                                </div>
                                                                <div class="step-line" [class.active]="getWorkflowStep(insc) >= 4"></div>

                                                                <!-- 4. Terminé -->
                                                                <div class="step" [ngClass]="getStepClass(insc, 4)">
                                                                    <div class="step-circle">
                                                                        @if(getWorkflowStep(insc) >= 4) { <i class="bi bi-check-lg"></i> }
                                                                        @else { <i class="bi bi-flag"></i> }
                                                                    </div>
                                                                    <span class="step-label">Terminé</span>
                                                                </div>
                                                            </div>

                                                            <div class="detail-grid">
                                                                <div class="detail-item">
                                                                    <label>Doctorant</label>
                                                                    <span class="value">{{ getDoctorantName(insc) }}</span>
                                                                </div>
                                                                <div class="detail-item">
                                                                    <label>Laboratoire</label>
                                                                    <span class="value">{{ insc.laboratoireAccueil || 'Non renseigné' }}</span>
                                                                </div>
                                                                <div class="detail-item">
                                                                    <label>Directeur de Thèse</label>
                                                                    <span class="value fw-bold text-primary">{{ getDirecteurName(insc) }}</span>
                                                                </div>
                                                                <div class="detail-item">
                                                                    <label>Année d'inscription</label>
                                                                    <span class="value">{{ insc.anneeInscription }}ème année</span>
                                                                </div>
                                                                <div class="detail-item full-width">
                                                                    <label>Sujet de Thèse</label>
                                                                    <div class="motif-box">{{ insc.sujetThese || 'Aucun sujet défini' }}</div>
                                                                </div>

                                                                <!-- Avis du directeur si disponible -->
                                                                @if (insc.commentaireDirecteur) {
                                                                    <div class="detail-item full-width">
                                                                        <label>Avis du Directeur</label>
                                                                        <div class="comment-box director">{{ insc.commentaireDirecteur }}</div>
                                                                    </div>
                                                                }
                                                            </div>

                                                            <!-- ACTIONS D'ADMINISTRATION (après validation directeur) -->
                                                            @if (insc.statut === 'EN_ATTENTE_ADMIN') {
                                                                <div class="action-section">
                                                                    <div class="admin-action-box">
                                                                        <h5><i class="bi bi-shield-check"></i> Validation Administrative Finale</h5>

                                                                        @if (!isRejecting()) {
                                                                            <p>Le directeur a validé ce dossier. Confirmez-vous la réinscription définitive ?</p>
                                                                            <div class="action-buttons">
                                                                                <button class="btn-refuse" (click)="initiateRejection($event)">Refuser</button>
                                                                                <button class="btn-validate" (click)="valider(insc, $event)">Valider la réinscription</button>
                                                                            </div>
                                                                        } @else {
                                                                            <div class="decision-form">
                                                                                <p class="mb-2 fw-bold text-danger">Motif du refus :</p>
                                                                                <textarea [(ngModel)]="refusalReason" class="form-control mb-3" rows="3" placeholder="Indiquez la raison du refus..." (click)="$event.stopPropagation()"></textarea>
                                                                                <div class="d-flex gap-2 justify-content-end">
                                                                                    <button class="btn-cancel" (click)="cancelRejection($event)">Annuler</button>
                                                                                    <button class="btn-confirm-refuse" [disabled]="!refusalReason.trim()" (click)="confirmRejection(insc, $event)">
                                                                                        Confirmer le refus
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        }
                                                                    </div>
                                                                </div>
                                                            }

                                                            <!-- INFO: EN ATTENTE DIRECTEUR (première étape) -->
                                                            @if (insc.statut === 'EN_ATTENTE_DIRECTEUR') {
                                                                <div class="info-box waiting mt-3">
                                                                    <i class="bi bi-person-badge text-primary"></i>
                                                                    <strong>En attente de validation par le directeur de thèse</strong>
                                                                </div>
                                                            }

                                                            <!-- INFO: ADMIS -->
                                                            @if (insc.statut === 'ADMIS') {
                                                                <div class="info-box success mt-3">
                                                                    <i class="bi bi-check-circle-fill text-success"></i>
                                                                    <strong>Réinscription validée avec succès</strong>
                                                                </div>
                                                            }

                                                            <!-- INFO: REJETÉ -->
                                                            @if (insc.statut && insc.statut.includes('REJETE')) {
                                                                <div class="info-box danger mt-3">
                                                                    <i class="bi bi-x-circle-fill text-danger"></i>
                                                                    <div>
                                                                        <strong>Demande refusée</strong>
                                                                        @if (insc.commentaireAdmin) {
                                                                            <p class="mb-0 mt-1 small">Motif : {{ insc.commentaireAdmin }}</p>
                                                                        }
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
                }

                <!-- Toast -->
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
      /* STYLES UNIFIÉS */
      .page-container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem 3rem; }
      .hero-section { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 20px; padding: 2rem; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; color: white; }
      .hero-content { display: flex; align-items: center; gap: 1.25rem; }
      .hero-icon { width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; }
      .hero-title { margin: 0; font-size: 1.6rem; font-weight: 800; }
      .hero-subtitle { margin: 0.25rem 0 0; opacity: 0.9; }
      .btn-refresh { padding: 0.75rem 1.25rem; background: white; color: #1d4ed8; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; display: flex; gap: 0.5rem; align-items: center; transition: 0.2s; }
      .btn-refresh:hover { transform: translateY(-2px); }

      /* STATS */
      .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
      .stat-card { background: white; border-radius: 14px; padding: 1rem; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.5rem; border: 1px solid #e2e8f0; }
      .stat-icon-wrap { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; }
      .stat-card.orange .stat-icon-wrap { background: #fff7ed; color: #ea580c; }
      .stat-card.blue .stat-icon-wrap { background: #eff6ff; color: #3b82f6; }
      .stat-card.green .stat-icon-wrap { background: #dcfce7; color: #16a34a; }
      .stat-card.red .stat-icon-wrap { background: #fef2f2; color: #dc2626; }
      .stat-value { font-size: 1.5rem; font-weight: 700; color: #1e293b; display: block; }
      .stat-label { font-size: 0.7rem; color: #64748b; font-weight: 600; text-transform: uppercase; }

      /* TABS */
      .tabs-container { display: flex; justify-content: center; margin-bottom: 1.5rem; }
      .tabs { background: #f1f5f9; padding: 5px; border-radius: 50px; display: inline-flex; gap: 5px; }
      .tab-btn { border: none; background: transparent; padding: 0.75rem 1.25rem; border-radius: 40px; font-weight: 600; color: #64748b; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; }
      .tab-btn.active { background: white; color: #1d4ed8; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
      .tab-badge { background: #ef4444; color: white; padding: 0.15rem 0.5rem; border-radius: 50px; font-size: 0.7rem; }
      .tab-badge.info { background: #3b82f6; }

      /* TABLE */
      .section-card { background: white; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; overflow: hidden; }
      .table-container { overflow-x: auto; }
      .data-table { width: 100%; border-collapse: collapse; }
      .data-table th { padding: 1rem 1.25rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
      .data-table td { padding: 1rem 1.25rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
      .data-table tbody tr { transition: background 0.2s; }
      .data-table tbody tr.clickable:hover { background: #f0f9ff; cursor: pointer; }
      .data-table tbody tr.expanded-row { background: #eff6ff; border-left: 4px solid #3b82f6; }

      .empty-cell { padding: 3rem; text-align: center; }
      .empty-content { color: #94a3b8; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
      .empty-content i { font-size: 2rem; }

      .user-cell { display: flex; align-items: center; gap: 0.75rem; }
      .avatar-circle { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; display: flex; justify-content: center; align-items: center; font-weight: 700; font-size: 0.9rem; flex-shrink: 0; }
      .user-info { display: flex; flex-direction: column; }
      .user-info .name { font-weight: 600; color: #1e293b; font-size: 0.95rem; }
      .user-info .id { font-size: 0.75rem; color: #64748b; }

      .badge.year { background: #dbeafe; color: #1e40af; padding: 0.3rem 0.6rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600; }
      .motif-cell { max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #475569; font-size: 0.9rem; }
      .date-badge { background: #f1f5f9; padding: 0.3rem 0.6rem; border-radius: 6px; font-size: 0.8rem; color: #475569; font-weight: 500; }

      /* Expand Icon */
      .expand-icon { color: #94a3b8; transition: transform 0.3s; }
      .expand-icon.rotated { transform: rotate(180deg); color: #3b82f6; }

      .status-badge { padding: 0.35rem 0.75rem; border-radius: 50px; font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.4rem; white-space: nowrap; }
      .status-badge.pending { background: #fef3c7; color: #b45309; }
      .status-badge.director { background: #dbeafe; color: #1d4ed8; }
      .status-badge.valid { background: #dcfce7; color: #15803d; }
      .status-badge.rejected { background: #fee2e2; color: #991b1b; }

      /* DETAILS PANEL */
      .details-row td { padding: 0 !important; border: none !important; }
      .details-panel { padding: 2rem; background: #fff; animation: slideDown 0.3s; border-bottom: 1px solid #e2e8f0; }

      /* STEPPER */
      .workflow-container { display: flex; align-items: center; justify-content: center; margin-bottom: 2rem; padding: 1.5rem; background: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9; overflow-x: auto; }
      .step { display: flex; flex-direction: column; align-items: center; position: relative; z-index: 2; min-width: 80px; text-align: center; }
      .step-circle { width: 36px; height: 36px; border-radius: 50%; background: #e2e8f0; color: #94a3b8; display: flex; align-items: center; justify-content: center; font-size: 1rem; margin-bottom: 0.5rem; border: 3px solid #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
      .step-label { font-size: 0.65rem; font-weight: 600; color: #64748b; }
      .step.completed .step-circle { background: #22c55e; color: white; }
      .step.current .step-circle { background: #3b82f6; color: white; animation: pulse 2s infinite; }
      .step-line { flex: 1; height: 3px; background: #e2e8f0; margin-top: -20px; position: relative; z-index: 1; min-width: 30px; }
      .step-line.active { background: #22c55e; }

      /* DETAILS GRID */
      .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
      .detail-item { display: flex; flex-direction: column; gap: 0.4rem; }
      .detail-item.full-width { grid-column: 1 / -1; }
      .detail-item label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
      .detail-item .value { font-size: 1rem; color: #1e293b; font-weight: 500; }
      .motif-box { background: #fefce8; padding: 1rem; border-radius: 8px; border: 1px solid #fef08a; color: #854d0e; line-height: 1.5; font-size: 0.95rem; }

      /* Comment box for director's note */
      .comment-box { background: #f1f5f9; padding: 1rem; border-radius: 8px; color: #334155; font-style: italic; line-height: 1.5; }
      .comment-box.director { border-left: 3px solid #3b82f6; background: #eff6ff; }

      /* INFO BOX */
      .info-box { background: #f8fafc; padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0; color: #334155; display: flex; align-items: center; gap: 0.75rem; }
      .info-box.success { background: #f0fdf4; border-color: #86efac; }
      .info-box.waiting { background: #eff6ff; border-color: #93c5fd; }
      .info-box.danger { background: #fef2f2; border-color: #fecaca; }

      /* ACTION BOX */
      .action-section { border-top: 1px solid #e2e8f0; padding-top: 1.5rem; margin-top: 1.5rem; }
      .admin-action-box { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 1.5rem; }
      .admin-action-box h5 { margin: 0 0 0.5rem; color: #9a3412; font-size: 1rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
      .admin-action-box p { margin: 0 0 1rem; font-size: 0.9rem; color: #475569; }

      .action-buttons { display: flex; gap: 1rem; justify-content: flex-end; }
      .btn-validate { padding: 0.75rem 1.5rem; border-radius: 8px; background: #22c55e; color: white; border: none; font-weight: 600; cursor: pointer; transition: 0.2s; }
      .btn-validate:hover { background: #16a34a; transform: translateY(-1px); }
      .btn-refuse { padding: 0.75rem 1.5rem; border-radius: 8px; background: white; color: #dc2626; border: 1px solid #fecaca; font-weight: 600; cursor: pointer; transition: 0.2s; }
      .btn-refuse:hover { background: #fef2f2; }

      /* FORMULAIRE REFUS */
      .decision-form { background: white; padding: 1rem; border-radius: 8px; border: 1px solid #fecaca; }
      .form-control { width: 100%; padding: 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; }
      .form-control:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
      .btn-cancel { padding: 0.6rem 1rem; background: white; border: 1px solid #e2e8f0; border-radius: 8px; font-weight: 600; color: #64748b; cursor: pointer; transition: 0.2s; }
      .btn-cancel:hover { background: #f8fafc; }
      .btn-confirm-refuse { padding: 0.6rem 1.2rem; border-radius: 8px; background: #dc2626; color: white; border: none; font-weight: 600; cursor: pointer; transition: 0.2s; }
      .btn-confirm-refuse:hover:not(:disabled) { background: #b91c1c; }
      .btn-confirm-refuse:disabled { opacity: 0.6; cursor: not-allowed; }

      .loading-state { padding: 4rem; text-align: center; color: #64748b; }
      .spinner-btn { width: 16px; height: 16px; border: 2px solid #ddd; border-top-color: #333; border-radius: 50%; animation: spin 1s linear infinite; display: inline-block; }
      .spinner-large { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem; }

      @keyframes spin { 100% { transform: rotate(360deg); } }
      @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); } 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); } }

      .toast { position: fixed; bottom: 2rem; right: 2rem; padding: 1rem 1.5rem; border-radius: 10px; color: white; font-weight: 600; z-index: 2000; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; align-items: center; gap: 0.5rem; animation: slideUp 0.3s; }
      .toast.success { background: #22c55e; }
      .toast.error { background: #ef4444; color: white; }
      @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

      @media (max-width: 992px) {
        .stats-grid { grid-template-columns: repeat(2, 1fr); }
        .detail-grid { grid-template-columns: 1fr; }
      }
    `]
})
export class AdminReinscriptionsComponent implements OnInit {
    inscriptions = signal<any[]>([]);
    isLoading = signal(true);
    activeTab = 'EN_ATTENTE_ADMIN';
    expandedId = signal<number | null>(null);
    toast = signal<{show: boolean, message: string, type: 'success' | 'error'}>({show: false, message: '', type: 'success'});

    // Etat local pour le refus
    isRejecting = signal(false);
    refusalReason = '';

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

    setTab(tab: string) {
        this.activeTab = tab;
        this.expandedId.set(null);
        this.resetForms();
    }

    // --- EXPAND/COLLAPSE ---
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
        this.isRejecting.set(false);
        this.refusalReason = '';
    }

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

    // WORKFLOW INVERSÉ : Soumission (1) → Directeur (2) → Admin (3) → Terminé (4)
    getWorkflowStep(insc: any): number {
        if (!insc || !insc.statut) return 1;
        if (insc.statut === 'EN_ATTENTE_DIRECTEUR') return 2; // Chez le directeur (première validation)
        if (insc.statut === 'EN_ATTENTE_ADMIN') return 3;     // Chez l'admin (validation finale)
        if (insc.statut === 'ADMIS') return 4;                // Terminé
        return 1;
    }

    getStepClass(insc: any, step: number) {
        const current = this.getWorkflowStep(insc);
        if(current > step) return 'completed';
        if(current === step) return 'current';
        return '';
    }

    valider(insc: any, e: Event) {
        e.stopPropagation();
        if(confirm('Valider cette réinscription ? Le doctorant passera à l\'année supérieure.')) {
            this.inscriptionService.validerParAdmin(insc.id, 'OK').subscribe({
                next: () => {
                    this.showToast('Réinscription validée', 'success');
                    if (insc.doctorant && insc.doctorant.id) {
                        const newYear = (insc.doctorant.anneeThese || 1) + 1;
                        this.userService.updateUser(insc.doctorant.id, { anneeThese: newYear }).subscribe({
                            next: () => console.log('✅ Année doctorant mise à jour : ' + newYear),
                            error: (e) => console.error('❌ Erreur update année user', e)
                        });
                    }
                    this.loadData();
                    this.expandedId.set(null);
                },
                error: (err) => this.showToast('Erreur lors de la validation', 'error')
            });
        }
    }

    // --- LOGIQUE REFUS ---
    initiateRejection(e: Event) {
        e.stopPropagation();
        this.isRejecting.set(true);
    }

    cancelRejection(e: Event) {
        e.stopPropagation();
        this.isRejecting.set(false);
        this.refusalReason = '';
    }

    confirmRejection(insc: any, e: Event) {
        e.stopPropagation();
        if(!this.refusalReason.trim()) return;

        this.inscriptionService.rejeterParAdmin(insc.id, this.refusalReason).subscribe(() => {
            this.showToast('Demande rejetée', 'success');
            this.loadData();
            this.expandedId.set(null);
        });
    }

    showToast(message: string, type: 'success' | 'error') {
        this.toast.set({show: true, message, type});
        setTimeout(() => this.toast.set({show: false, message: '', type: 'success'}), 3000);
    }
}