import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MainLayoutComponent } from '@shared/components/main-layout/main-layout.component';
import { SoutenanceService } from '@core/services/soutenance.service';
import { AuthService } from '@core/services/auth.service';

@Component({
    selector: 'app-doctorant-soutenance',
    standalone: true,
    imports: [CommonModule, MainLayoutComponent, FormsModule, ReactiveFormsModule],
    template: `
        <app-main-layout>
            <div class="page-container">

                <!-- Hero Header -->
                <div class="hero-section">
                    <div class="hero-content">
                        <div class="hero-icon">
                            <i class="bi bi-mortarboard-fill"></i>
                        </div>
                        <div>
                            <h1 class="hero-title">Ma Soutenance de Thèse</h1>
                            <p class="hero-subtitle">Gérez votre demande de soutenance et suivez son avancement</p>
                        </div>
                    </div>
                    <div class="hero-decoration">
                        <div class="decoration-circle c1"></div>
                        <div class="decoration-circle c2"></div>
                    </div>
                </div>

                <!-- Loading State -->
                @if (isLoadingData()) {
                    <div class="loading-state">
                        <div class="loading-spinner"></div>
                        <span>Chargement de vos données...</span>
                    </div>
                }

                <!-- ============ SECTION: MES DEMANDES EXISTANTES ============ -->
                @if (!isLoadingData() && mySoutenances().length > 0) {
                    <div class="section-card">
                        <div class="section-header">
                            <div class="header-left">
                                <i class="bi bi-list-check"></i>
                                <h3>Mes Demandes de Soutenance</h3>
                            </div>
                            <span class="badge-count">{{ mySoutenances().length }}</span>
                        </div>

                        <div class="table-container">
                            <table class="data-table">
                                <thead>
                                <tr>
                                    <th>Sujet de Thèse</th>
                                    <th>Date Soumission</th>
                                    <th>Statut</th>
                                    <th>Date Soutenance</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                    @for (s of mySoutenances(); track s.id) {
                                        <tr [class.row-expanded]="expandedId() === s.id">
                                            <td class="thesis-cell">
                                                <span class="thesis-text">{{ getThesisTitle(s) }}</span>
                                            </td>
                                            <td>
                                                <span class="date-badge">
                                                    <i class="bi bi-calendar3"></i>
                                                    {{ s.createdAt | date:'dd/MM/yyyy' }}
                                                </span>
                                            </td>
                                            <td>
                                                <span class="status-badge" [ngClass]="getStatusClass(s.statut)">
                                                    {{ formatStatus(s.statut) }}
                                                </span>
                                            </td>
                                            <td>
                                                @if (s.dateSoutenance) {
                                                    <span class="date-badge success">
                                                        <i class="bi bi-calendar-check"></i>
                                                        {{ s.dateSoutenance | date:'dd/MM/yyyy' }}
                                                    </span>
                                                } @else {
                                                    <span class="text-muted">Non planifiée</span>
                                                }
                                            </td>
                                            <td>
                                                <button class="btn-details" (click)="toggleExpand(s.id)">
                                                    <i class="bi" [ngClass]="expandedId() === s.id ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
                                                    Détails
                                                </button>
                                            </td>
                                        </tr>

                                        <!-- Ligne de détails -->
                                        @if (expandedId() === s.id) {
                                            <tr class="details-row">
                                                <td colspan="5">
                                                    <div class="details-content">

                                                        <!-- ✅ ALERTE SI REJETÉE avec commentaire du directeur -->
                                                        @if (s.statut === 'REJETEE' && (s.commentaireDirecteur || s.commentaireAdmin)) {
                                                            <div class="rejection-alert">
                                                                <div class="rejection-header">
                                                                    <i class="bi bi-exclamation-triangle-fill"></i>
                                                                    <span>Corrections demandées par votre directeur</span>
                                                                </div>
                                                                <div class="rejection-message">
                                                                    {{ s.commentaireDirecteur || s.commentaireAdmin }}
                                                                </div>
                                                                <div class="rejection-hint">
                                                                    <i class="bi bi-info-circle"></i>
                                                                    Veuillez effectuer les corrections demandées et soumettre une nouvelle demande.
                                                                </div>
                                                            </div>
                                                        }

                                                        <!-- Timeline -->
                                                        <div class="timeline-mini">
                                                            @for (step of timelineSteps; track step.id; let i = $index) {
                                                                <div class="timeline-step"
                                                                     [class.completed]="getStepNumber(s.statut) >= step.id"
                                                                     [class.current]="getStepNumber(s.statut) === step.id"
                                                                     [class.rejected]="s.statut === 'REJETEE' && step.id === 2">
                                                                    <div class="step-dot">
                                                                        @if (s.statut === 'REJETEE' && step.id === 2) {
                                                                            <i class="bi bi-x-lg"></i>
                                                                        } @else {
                                                                            <i [ngClass]="step.icon"></i>
                                                                        }
                                                                    </div>
                                                                    <span class="step-label">{{ step.label }}</span>
                                                                </div>
                                                                @if (i < timelineSteps.length - 1) {
                                                                    <div class="timeline-line"
                                                                         [class.completed]="getStepNumber(s.statut) > step.id"
                                                                         [class.rejected]="s.statut === 'REJETEE' && step.id === 1"></div>
                                                                }
                                                            }
                                                        </div>

                                                        <!-- Infos supplémentaires -->
                                                        @if (s.lieuSoutenance || s.heureSoutenance || s.mention) {
                                                            <div class="extra-info">
                                                                @if (s.lieuSoutenance) {
                                                                    <div class="info-chip">
                                                                        <i class="bi bi-geo-alt"></i>
                                                                        {{ s.lieuSoutenance }}
                                                                    </div>
                                                                }
                                                                @if (s.heureSoutenance) {
                                                                    <div class="info-chip">
                                                                        <i class="bi bi-clock"></i>
                                                                        {{ s.heureSoutenance }}
                                                                    </div>
                                                                }
                                                                @if (s.mention) {
                                                                    <div class="info-chip success">
                                                                        <i class="bi bi-award"></i>
                                                                        {{ s.mention }}
                                                                    </div>
                                                                }
                                                            </div>
                                                        }
                                                    </div>
                                                </td>
                                            </tr>
                                        }
                                    }
                                </tbody>
                            </table>
                        </div>
                    </div>
                }

                <!-- ============ SECTION: FORMULAIRE NOUVELLE DEMANDE ============ -->
                @if (!isLoadingData() && canSubmitNewRequest()) {
                    <div class="section-card form-section">

                        <!-- Info Banner -->
                        <div class="info-banner">
                            <div class="info-icon">
                                <i class="bi bi-lightbulb"></i>
                            </div>
                            <div class="info-content">
                                <strong>Avant de commencer</strong>
                                <p>Assurez-vous d'avoir complété les prérequis : 2 publications Q1/Q2, 2 conférences internationales et 200h de formation.</p>
                            </div>
                        </div>

                        <div class="section-header">
                            <div class="header-left">
                                <i class="bi bi-file-earmark-plus"></i>
                                <h3>Nouvelle Demande de Soutenance</h3>
                            </div>
                        </div>

                        <div class="form-body">

                            <!-- ✅ Sujet de Thèse NON MODIFIABLE -->
                            <div class="form-group">
                                <label class="form-label">
                                    <i class="bi bi-journal-text me-2"></i>
                                    Sujet de Thèse
                                    <span class="readonly-badge">
                                        <i class="bi bi-lock me-1"></i>Défini par le directeur
                                    </span>
                                </label>
                                <div class="readonly-field">
                                    @if (sujetThese) {
                                        {{ sujetThese }}
                                    } @else {
                                        <span class="no-subject">Aucun sujet de thèse assigné</span>
                                    }
                                </div>
                                @if (!sujetThese) {
                                    <div class="warning-message">
                                        <i class="bi bi-exclamation-triangle me-1"></i>
                                        Contactez votre directeur pour qu'il vous assigne un sujet de thèse.
                                    </div>
                                }
                            </div>

                            <!-- Documents -->
                            <div class="form-group">
                                <label class="form-label">
                                    <i class="bi bi-folder2-open me-2"></i>
                                    Documents Obligatoires
                                    <span class="file-hint">(PDF, max 20 Mo)</span>
                                </label>

                                <div class="upload-grid">
                                    <!-- Manuscrit -->
                                    <div class="upload-card" [class.uploaded]="files.manuscrit">
                                        <div class="upload-icon" [class.success]="files.manuscrit">
                                            @if (files.manuscrit) {
                                                <i class="bi bi-check-circle-fill"></i>
                                            } @else {
                                                <i class="bi bi-file-earmark-pdf"></i>
                                            }
                                        </div>
                                        <div class="upload-info">
                                            <span class="upload-title">Manuscrit de Thèse <span class="required">*</span></span>
                                            <span class="upload-hint">
                                                {{ files.manuscrit?.name || 'Version finale (PDF)' }}
                                            </span>
                                            @if (files.manuscrit) {
                                                <span class="file-size">{{ formatFileSize(files.manuscrit.size) }}</span>
                                            }
                                        </div>
                                        <label class="upload-btn">
                                            <input type="file" (change)="onFileSelect($event, 'manuscrit')" accept=".pdf" hidden>
                                            <i class="bi bi-cloud-upload me-1"></i>
                                            {{ files.manuscrit ? 'Changer' : 'Parcourir' }}
                                        </label>
                                    </div>

                                    <!-- Rapport Anti-Plagiat -->
                                    <div class="upload-card" [class.uploaded]="files.rapport">
                                        <div class="upload-icon" [class.success]="files.rapport">
                                            @if (files.rapport) {
                                                <i class="bi bi-check-circle-fill"></i>
                                            } @else {
                                                <i class="bi bi-shield-check"></i>
                                            }
                                        </div>
                                        <div class="upload-info">
                                            <span class="upload-title">Rapport Anti-Plagiat <span class="required">*</span></span>
                                            <span class="upload-hint">
                                                {{ files.rapport?.name || 'Turnitin/iThenticate < 10%' }}
                                            </span>
                                            @if (files.rapport) {
                                                <span class="file-size">{{ formatFileSize(files.rapport.size) }}</span>
                                            }
                                        </div>
                                        <label class="upload-btn">
                                            <input type="file" (change)="onFileSelect($event, 'rapport')" accept=".pdf" hidden>
                                            <i class="bi bi-cloud-upload me-1"></i>
                                            {{ files.rapport ? 'Changer' : 'Parcourir' }}
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <!-- Workflow Preview -->
                            <div class="workflow-section">
                                <label class="form-label">
                                    <i class="bi bi-diagram-3 me-2"></i>
                                    Processus de Validation
                                </label>
                                <div class="workflow-steps">
                                    <div class="workflow-step">
                                        <div class="step-number active">1</div>
                                        <div class="step-text">
                                            <span class="step-title">Soumission</span>
                                            <span class="step-desc">Vous êtes ici</span>
                                        </div>
                                    </div>
                                    <div class="workflow-arrow"><i class="bi bi-chevron-right"></i></div>
                                    <div class="workflow-step">
                                        <div class="step-number">2</div>
                                        <div class="step-text">
                                            <span class="step-title">Directeur</span>
                                            <span class="step-desc">Valide prérequis</span>
                                        </div>
                                    </div>
                                    <div class="workflow-arrow"><i class="bi bi-chevron-right"></i></div>
                                    <div class="workflow-step">
                                        <div class="step-number">3</div>
                                        <div class="step-text">
                                            <span class="step-title">Admin</span>
                                            <span class="step-desc">Planifie la date</span>
                                        </div>
                                    </div>
                                    <div class="workflow-arrow"><i class="bi bi-chevron-right"></i></div>
                                    <div class="workflow-step">
                                        <div class="step-number final"><i class="bi bi-trophy"></i></div>
                                        <div class="step-text">
                                            <span class="step-title">Soutenance</span>
                                            <span class="step-desc">Jour J</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Submit Button -->
                            <button
                                    type="button"
                                    class="btn-submit"
                                    [disabled]="isLoading() || !sujetThese || !files.manuscrit || !files.rapport"
                                    (click)="onSubmit()">
                                @if (isLoading()) {
                                    <span class="spinner"></span>
                                    <span>Envoi en cours...</span>
                                } @else {
                                    <i class="bi bi-send me-2"></i>
                                    <span>Soumettre ma Demande</span>
                                }
                            </button>

                            @if (errorMessage()) {
                                <div class="alert-banner error">
                                    <i class="bi bi-exclamation-triangle me-2"></i>
                                    {{ errorMessage() }}
                                </div>
                            }

                            @if (successMessage()) {
                                <div class="alert-banner success">
                                    <i class="bi bi-check-circle me-2"></i>
                                    {{ successMessage() }}
                                </div>
                            }
                        </div>
                    </div>
                }

                <!-- Message si demande en cours -->
                @if (!isLoadingData() && !canSubmitNewRequest() && mySoutenances().length > 0) {
                    <div class="info-standalone">
                        <i class="bi bi-info-circle"></i>
                        <p>Vous avez déjà une demande de soutenance en cours. Suivez son avancement dans le tableau ci-dessus.</p>
                    </div>
                }

            </div>
        </app-main-layout>
    `,
    styles: [`
      .page-container { max-width: 1000px; margin: 0 auto; padding: 0 1.5rem 3rem; }

      /* Hero Section */
      .hero-section { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 24px; padding: 2rem; margin-bottom: 1.5rem; position: relative; overflow: hidden; }
      .hero-content { display: flex; align-items: center; gap: 1.25rem; position: relative; z-index: 2; }
      .hero-icon { width: 64px; height: 64px; background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; color: white; }
      .hero-title { color: white; font-size: 1.6rem; font-weight: 800; margin: 0; }
      .hero-subtitle { color: rgba(255, 255, 255, 0.9); margin: 0.25rem 0 0; font-size: 0.95rem; }
      .hero-decoration { position: absolute; right: 0; top: 0; bottom: 0; width: 200px; }
      .decoration-circle { position: absolute; border-radius: 50%; background: rgba(255, 255, 255, 0.1); }
      .c1 { width: 120px; height: 120px; top: -30px; right: 40px; }
      .c2 { width: 80px; height: 80px; bottom: -20px; right: 120px; }

      /* Loading State */
      .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; background: white; border-radius: 20px; border: 1px solid #e2e8f0; }
      .loading-spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 1rem; }
      @keyframes spin { to { transform: rotate(360deg); } }

      /* Section Card */
      .section-card { background: white; border-radius: 20px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0; overflow: hidden; margin-bottom: 1.5rem; }
      .section-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
      .header-left { display: flex; align-items: center; gap: 0.75rem; }
      .header-left i { font-size: 1.25rem; color: #6366f1; }
      .header-left h3 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #1e293b; }
      .badge-count { background: #6366f1; color: white; padding: 0.35rem 0.75rem; border-radius: 50px; font-size: 0.8rem; font-weight: 600; }

      /* Table */
      .table-container { overflow-x: auto; }
      .data-table { width: 100%; border-collapse: collapse; }
      .data-table th { background: #f8fafc; padding: 1rem 1.25rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0; }
      .data-table td { padding: 1rem 1.25rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
      .data-table tbody tr:hover { background: #fafafa; }
      .data-table tbody tr.row-expanded { background: #f0f4ff; }
      .thesis-cell { max-width: 300px; }
      .thesis-text { font-weight: 600; color: #1e293b; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      .date-badge { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.75rem; background: #f1f5f9; border-radius: 6px; font-size: 0.85rem; color: #475569; }
      .date-badge.success { background: #dcfce7; color: #15803d; }
      .text-muted { color: #94a3b8; font-style: italic; font-size: 0.85rem; }
      .status-badge { display: inline-block; padding: 0.35rem 0.75rem; border-radius: 50px; font-size: 0.75rem; font-weight: 600; }
      .status-badge.pending { background: #fef3c7; color: #b45309; }
      .status-badge.approved { background: #dcfce7; color: #15803d; }
      .status-badge.rejected { background: #fee2e2; color: #dc2626; }
      .status-badge.completed { background: #dbeafe; color: #1d4ed8; }
      .btn-details { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.5rem 0.75rem; background: white; border: 1px solid #e2e8f0; border-radius: 8px; color: #475569; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; }
      .btn-details:hover { background: #f8fafc; border-color: #6366f1; color: #6366f1; }

      /* Details Row */
      .details-row td { background: #f8fafc; padding: 0 !important; }
      .details-content { padding: 1.5rem; animation: slideDown 0.3s ease; }
      @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

      /* ✅ NOUVEAU: Alerte de rejet */
      .rejection-alert {
        background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
        border: 1px solid #fecaca;
        border-left: 4px solid #ef4444;
        border-radius: 12px;
        padding: 1.25rem;
        margin-bottom: 1.5rem;
      }
      .rejection-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 700;
        color: #dc2626;
        margin-bottom: 0.75rem;
      }
      .rejection-header i { font-size: 1.1rem; }
      .rejection-message {
        background: white;
        border-radius: 8px;
        padding: 1rem;
        color: #1e293b;
        font-size: 0.95rem;
        line-height: 1.5;
        margin-bottom: 0.75rem;
        border: 1px solid #fecaca;
      }
      .rejection-hint {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.8rem;
        color: #b91c1c;
      }

      /* Timeline Mini */
      .timeline-mini { display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; }
      .timeline-step { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; }
      .timeline-step .step-dot { width: 36px; height: 36px; border-radius: 50%; background: #e2e8f0; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-size: 0.9rem; }
      .timeline-step.completed .step-dot { background: #22c55e; color: white; }
      .timeline-step.current .step-dot { background: #6366f1; color: white; box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2); }
      .timeline-step.rejected .step-dot { background: #ef4444; color: white; }
      .timeline-step .step-label { font-size: 0.7rem; color: #64748b; }
      .timeline-step.completed .step-label, .timeline-step.current .step-label { color: #1e293b; font-weight: 600; }
      .timeline-step.rejected .step-label { color: #dc2626; font-weight: 600; }
      .timeline-line { width: 40px; height: 3px; background: #e2e8f0; margin: 0 0.5rem; margin-bottom: 1.2rem; }
      .timeline-line.completed { background: #22c55e; }
      .timeline-line.rejected { background: #ef4444; }

      /* Extra Info */
      .extra-info { display: flex; gap: 0.75rem; flex-wrap: wrap; }
      .info-chip { display: flex; align-items: center; gap: 0.4rem; padding: 0.5rem 0.75rem; background: white; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.85rem; }
      .info-chip i { color: #6366f1; }
      .info-chip.success { background: #f0fdf4; border-color: #86efac; }
      .info-chip.success i { color: #22c55e; }

      /* Form Section */
      .form-section .section-header { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); }
      .info-banner { display: flex; gap: 1rem; padding: 1.25rem; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #fcd34d; border-radius: 16px; margin: 1.5rem; margin-bottom: 0; }
      .info-icon { width: 44px; height: 44px; background: #f59e0b; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2rem; flex-shrink: 0; }
      .info-content { color: #92400e; }
      .info-content strong { display: block; margin-bottom: 0.25rem; }
      .info-content p { margin: 0; font-size: 0.875rem; line-height: 1.5; }

      /* Form Body */
      .form-body { padding: 1.5rem; }
      .form-group { margin-bottom: 1.5rem; }
      .form-label { display: flex; align-items: center; font-size: 0.9rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem; }
      .form-label i { color: #6366f1; }
      .file-hint { margin-left: 0.5rem; font-weight: 400; color: #94a3b8; font-size: 0.8rem; }
      .readonly-badge { margin-left: auto; padding: 0.25rem 0.6rem; background: #e0e7ff; color: #4f46e5; border-radius: 6px; font-size: 0.7rem; font-weight: 600; }
      .readonly-field { padding: 1rem 1.25rem; background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; color: #1e293b; font-weight: 500; line-height: 1.5; }
      .no-subject { color: #94a3b8; font-style: italic; }
      .warning-message { display: flex; align-items: center; gap: 0.25rem; font-size: 0.8rem; color: #f59e0b; margin-top: 0.5rem; }
      .required { color: #ef4444; }

      /* Upload Grid */
      .upload-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
      .upload-card { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; transition: all 0.2s; }
      .upload-card:hover { border-color: #6366f1; background: #f0f4ff; }
      .upload-card.uploaded { border-style: solid; border-color: #22c55e; background: #f0fdf4; }
      .upload-icon { width: 44px; height: 44px; background: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; color: #6366f1; }
      .upload-icon.success { background: #22c55e; color: white; }
      .upload-info { flex: 1; }
      .upload-title { display: block; font-weight: 600; color: #1e293b; font-size: 0.9rem; }
      .upload-hint { display: block; font-size: 0.8rem; color: #64748b; margin-top: 0.15rem; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .file-size { display: block; font-size: 0.75rem; color: #22c55e; font-weight: 600; margin-top: 0.25rem; }
      .upload-btn { padding: 0.5rem 1rem; background: white; border: 1px solid #e2e8f0; border-radius: 8px; color: #475569; font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: all 0.2s; }
      .upload-btn:hover { background: #6366f1; color: white; border-color: #6366f1; }

      /* Workflow Section */
      .workflow-section { margin: 2rem 0; padding: 1.5rem; background: #f8fafc; border-radius: 16px; }
      .workflow-steps { display: flex; align-items: center; justify-content: space-between; margin-top: 1rem; }
      .workflow-step { display: flex; align-items: center; gap: 0.75rem; }
      .step-number { width: 36px; height: 36px; background: #e2e8f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; color: #64748b; }
      .step-number.active { background: #6366f1; color: white; }
      .step-number.final { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; }
      .step-text { display: flex; flex-direction: column; }
      .step-title { font-weight: 600; font-size: 0.85rem; color: #1e293b; }
      .step-desc { font-size: 0.75rem; color: #64748b; }
      .workflow-arrow { color: #cbd5e1; font-size: 1.2rem; }

      /* Submit Button */
      .btn-submit { width: 100%; padding: 1rem; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; border: none; border-radius: 14px; font-size: 1rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.2s; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.35); margin-top: 1.5rem; }
      .btn-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45); }
      .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
      .spinner { width: 20px; height: 20px; border: 2px solid rgba(255, 255, 255, 0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }

      /* Alert Banner */
      .alert-banner { display: flex; align-items: center; gap: 0.5rem; padding: 1rem; margin-top: 1rem; border-radius: 10px; font-size: 0.9rem; }
      .alert-banner.error { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
      .alert-banner.success { background: #f0fdf4; border: 1px solid #86efac; color: #15803d; }

      /* Info Standalone */
      .info-standalone { display: flex; align-items: center; gap: 1rem; padding: 1.25rem; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 16px; }
      .info-standalone i { font-size: 1.5rem; color: #3b82f6; }
      .info-standalone p { margin: 0; color: #1e40af; }

      @media (max-width: 768px) {
        .upload-grid { grid-template-columns: 1fr; }
        .workflow-steps { flex-wrap: wrap; gap: 1rem; }
        .workflow-arrow { display: none; }
        .timeline-mini { flex-wrap: wrap; gap: 0.5rem; }
        .timeline-line { display: none; }
      }
    `]
})
export class DoctorantSoutenanceComponent implements OnInit {
    mySoutenances = signal<any[]>([]);
    isLoadingData = signal(true);
    isLoading = signal(false);
    errorMessage = signal<string | null>(null);
    successMessage = signal<string | null>(null);
    expandedId = signal<number | null>(null);

    sujetThese: string = '';

    // ✅ Limite de taille: 20 Mo
    private readonly MAX_FILE_SIZE = 20 * 1024 * 1024;

    files: { manuscrit: File | null; rapport: File | null } = {
        manuscrit: null,
        rapport: null
    };

    timelineSteps = [
        { id: 1, label: 'Soumise', icon: 'bi bi-send' },
        { id: 2, label: 'Directeur', icon: 'bi bi-person-check' },
        { id: 3, label: 'Admin', icon: 'bi bi-building' },
        { id: 4, label: 'Planifiée', icon: 'bi bi-calendar-check' },
        { id: 5, label: 'Terminée', icon: 'bi bi-trophy' }
    ];

    constructor(
        private soutenanceService: SoutenanceService,
        private authService: AuthService
    ) {}

    ngOnInit() {
        const user = this.authService.currentUser();
        // ✅ Récupérer le sujet depuis titreThese ou sujetThese
        this.sujetThese = user?.titreThese || user?.sujetThese || '';
        console.log('📋 Sujet de thèse:', this.sujetThese);
        this.loadSoutenances();
    }

    loadSoutenances() {
        this.isLoadingData.set(true);
        const user = this.authService.currentUser();

        if (user?.id) {
            this.soutenanceService.getSoutenanceByDoctorantId(user.id).subscribe({
                next: (list: any[]) => {
                    console.log('📋 Soutenances reçues:', list);
                    this.mySoutenances.set(list || []);
                    this.isLoadingData.set(false);
                },
                error: (err) => {
                    console.error('Erreur chargement soutenances:', err);
                    this.mySoutenances.set([]);
                    this.isLoadingData.set(false);
                }
            });
        } else {
            this.isLoadingData.set(false);
        }
    }

    canSubmitNewRequest(): boolean {
        // ✅ Permettre une nouvelle soumission si la dernière est REJETEE
        const activeStatuses = ['SOUMIS', 'BROUILLON', 'PREREQUIS_VALIDES', 'JURY_PROPOSE', 'AUTORISEE', 'PLANIFIEE'];
        return !this.mySoutenances().some(s => activeStatuses.includes(s.statut));
    }

    toggleExpand(id: number) {
        this.expandedId.set(this.expandedId() === id ? null : id);
    }

    getThesisTitle(soutenance: any): string {
        return soutenance.titreThese || soutenance.sujetThese || soutenance.titre || 'Sujet non défini';
    }

    getStatusClass(statut: string): string {
        if (['TERMINEE'].includes(statut)) return 'completed';
        if (['PREREQUIS_VALIDES', 'JURY_PROPOSE', 'AUTORISEE', 'PLANIFIEE'].includes(statut)) return 'approved';
        if (['REJETEE', 'REFUSEE'].includes(statut)) return 'rejected';
        return 'pending';
    }

    formatStatus(statut: string): string {
        const statusMap: Record<string, string> = {
            'BROUILLON': 'Brouillon',
            'SOUMIS': 'Soumise',
            'PREREQUIS_VALIDES': 'Prérequis validés',
            'JURY_PROPOSE': 'Jury proposé',
            'AUTORISEE': 'Autorisée',
            'PLANIFIEE': 'Planifiée',
            'TERMINEE': 'Terminée',
            'REJETEE': 'Corrections demandées'
        };
        return statusMap[statut] || statut;
    }

    getStepNumber(statut: string): number {
        const steps: Record<string, number> = {
            'BROUILLON': 1,
            'SOUMIS': 1,
            'PREREQUIS_VALIDES': 2,
            'JURY_PROPOSE': 3,
            'AUTORISEE': 4,
            'PLANIFIEE': 4,
            'TERMINEE': 5,
            'REJETEE': 0
        };
        return steps[statut] || 1;
    }

    // ✅ Formater la taille du fichier
    formatFileSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
        return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
    }

    onFileSelect(event: any, type: 'manuscrit' | 'rapport') {
        const file = event.target.files[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                this.errorMessage.set('Seuls les fichiers PDF sont acceptés.');
                return;
            }
            // ✅ Limite à 20 Mo
            if (file.size > this.MAX_FILE_SIZE) {
                this.errorMessage.set(`Le fichier ne doit pas dépasser 20 Mo. (Taille: ${this.formatFileSize(file.size)})`);
                return;
            }
            this.files[type] = file;
            this.errorMessage.set(null);
        }
    }

    onSubmit() {
        if (!this.sujetThese) {
            this.errorMessage.set('Aucun sujet de thèse assigné. Contactez votre directeur.');
            return;
        }

        if (!this.files.manuscrit || !this.files.rapport) {
            this.errorMessage.set('Veuillez joindre le manuscrit et le rapport anti-plagiat.');
            return;
        }

        this.isLoading.set(true);
        this.errorMessage.set(null);
        this.successMessage.set(null);

        const user = this.authService.currentUser();

        if (!user?.id) {
            this.errorMessage.set('Erreur: Utilisateur non connecté.');
            this.isLoading.set(false);
            return;
        }

        const data = {
            titre: this.sujetThese,
            doctorantId: user.id,
            directeurId: user.directeurId || null
        };

        console.log('📤 Soumission soutenance:', data);
        console.log('📎 Fichiers:', {
            manuscrit: this.files.manuscrit?.name + ' (' + this.formatFileSize(this.files.manuscrit?.size || 0) + ')',
            rapport: this.files.rapport?.name + ' (' + this.formatFileSize(this.files.rapport?.size || 0) + ')'
        });

        this.soutenanceService.soumettreDemande(data, {
            manuscrit: this.files.manuscrit,
            rapport: this.files.rapport
        }).subscribe({
            next: (res) => {
                console.log('✅ Soutenance créée:', res);
                this.successMessage.set('Votre demande de soutenance a été soumise avec succès !');
                this.isLoading.set(false);
                this.files = { manuscrit: null, rapport: null };
                this.loadSoutenances();
            },
            error: (err) => {
                console.error('❌ Erreur soumission:', err);

                // ✅ Meilleur message d'erreur
                let errorMsg = 'Erreur lors de la soumission. ';
                if (err.status === 413) {
                    errorMsg = 'Les fichiers sont trop volumineux. Limite: 20 Mo par fichier.';
                } else if (err.status === 0) {
                    errorMsg = 'Erreur de connexion au serveur. Vérifiez votre connexion.';
                } else {
                    errorMsg += err.error?.message || 'Veuillez réessayer.';
                }

                this.errorMessage.set(errorMsg);
                this.isLoading.set(false);
            }
        });
    }
}