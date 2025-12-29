import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '@shared/components/main-layout/main-layout.component';
import { SoutenanceService } from '@core/services/soutenance.service';
import { Soutenance, StatutSoutenance } from '@core/models/soutenance.model';

@Component({
  selector: 'app-soutenance-list',
  standalone: true,
  imports: [CommonModule, MainLayoutComponent, FormsModule],
  template: `
    <app-main-layout>
      <div class="soutenances-container p-4">
        <!-- Header -->
        <div class="page-header">
          <div class="header-content">
            <h1 class="page-title"><i class="bi bi-mortarboard me-3"></i>Gestion des Soutenances</h1>
            <p class="page-subtitle">Supervision du processus de soutenance</p>
          </div>
          <button class="btn-refresh" (click)="loadSoutenances()" [disabled]="isLoading()">
            <i class="bi" [class.bi-arrow-clockwise]="!isLoading()" [class.spinner-icon]="isLoading()"></i>
            Actualiser
          </button>
        </div>

        <!-- Stats -->
        <div class="stats-row">
          <div class="stat-card stat-total"><div class="stat-icon"><i class="bi bi-collection"></i></div><div class="stat-info"><span class="stat-value">{{ totalCount() }}</span><span class="stat-label">Total</span></div></div>
          <div class="stat-card stat-prerequis"><div class="stat-icon"><i class="bi bi-shield-check"></i></div><div class="stat-info"><span class="stat-value">{{ prerequisCount() }}</span><span class="stat-label">À autoriser</span></div></div>
          <div class="stat-card stat-jury"><div class="stat-icon"><i class="bi bi-people"></i></div><div class="stat-info"><span class="stat-value">{{ juryCount() }}</span><span class="stat-label">Jury à valider</span></div></div>
          <div class="stat-card stat-planned"><div class="stat-icon"><i class="bi bi-calendar-check"></i></div><div class="stat-info"><span class="stat-value">{{ plannedCount() }}</span><span class="stat-label">Planifiées</span></div></div>
          <div class="stat-card stat-done"><div class="stat-icon"><i class="bi bi-trophy"></i></div><div class="stat-info"><span class="stat-value">{{ doneCount() }}</span><span class="stat-label">Terminées</span></div></div>
        </div>

        <!-- Filters -->
        <div class="filter-section">
          <div class="filter-tabs">
            <button class="filter-tab" [class.active]="activeFilter() === 'all'" (click)="setFilter('all')">Toutes</button>
            <button class="filter-tab" [class.active]="activeFilter() === 'prerequis'" (click)="setFilter('prerequis')">À autoriser <span class="badge-count" *ngIf="prerequisCount() > 0">{{ prerequisCount() }}</span></button>
            <button class="filter-tab" [class.active]="activeFilter() === 'jury'" (click)="setFilter('jury')">Validation Jury <span class="badge-count" *ngIf="juryCount() > 0">{{ juryCount() }}</span></button>
            <button class="filter-tab" [class.active]="activeFilter() === 'planned'" (click)="setFilter('planned')">Planifiées</button>
          </div>
          <div class="search-box">
            <i class="bi bi-search"></i>
            <input type="text" placeholder="Rechercher..." [ngModel]="searchTerm()" (ngModelChange)="searchTerm.set($event)">
          </div>
        </div>

        <!-- List -->
        <div class="soutenances-list">
          @if (isLoading()) {
            <div class="loading-state"><div class="spinner"></div><p>Chargement des dossiers...</p></div>
          } @else if (filteredSoutenances().length === 0) {
            <div class="empty-state"><i class="bi bi-inbox"></i><h3>Aucun dossier trouvé</h3></div>
          } @else {
            @for (soutenance of filteredSoutenances(); track soutenance.id) {
              <div class="soutenance-card" [class.expanded]="expandedId() === soutenance.id" [ngClass]="getCardClass(soutenance.statut)">

                <!-- Card Header -->
                <div class="card-header" (click)="toggleExpand(soutenance.id)">
                  <div class="doctorant-info">
                    <div class="avatar" [style.background]="getAvatarColor(soutenance.doctorantId)">
                      {{ getInitials(getDoctorantNom(soutenance)) }}
                    </div>
                    <div class="info">
                      <h4 class="doctorant-name">{{ getDoctorantNom(soutenance) }}</h4>
                      <!-- Correction TS2339: Cast explicite ou safe navigation -->
                      <span class="matricule-badge">{{ getMatricule(soutenance) }}</span>
                    </div>
                  </div>
                  <div class="header-right">
                    <div class="status-badge" [ngClass]="getStatusBadgeClass(soutenance.statut)">
                      {{ formatStatut(soutenance.statut) }}
                    </div>
                    <i class="bi bi-chevron-down expand-icon" [class.rotated]="expandedId() === soutenance.id"></i>
                  </div>
                </div>

                <!-- Expanded Content -->
                @if (expandedId() === soutenance.id) {
                  <div class="card-body">
                    <div class="thesis-section">
                      <h5 class="section-label"><i class="bi bi-journal-text"></i> Sujet de Thèse</h5>
                      <p class="thesis-title">{{ soutenance.titreThese || 'Non défini' }}</p>
                    </div>

                    <div class="info-grid">
                      <div class="info-card">
                        <div class="info-icon"><i class="bi bi-person-badge"></i></div>
                        <div class="info-content">
                          <span class="info-label">Directeur de thèse</span>
                          <span class="info-value">{{ getDirecteurNom(soutenance) }}</span>
                        </div>
                      </div>
                      <div class="info-card">
                        <div class="info-icon"><i class="bi bi-calendar3"></i></div>
                        <div class="info-content">
                          <span class="info-label">Date de soumission</span>
                          <span class="info-value">{{ soutenance.createdAt | date:'dd/MM/yyyy' }}</span>
                        </div>
                      </div>
                      @if (soutenance.dateSoutenance) {
                        <div class="info-card highlight">
                          <div class="info-icon"><i class="bi bi-calendar-event"></i></div>
                          <div class="info-content">
                            <span class="info-label">Date Soutenance</span>
                            <span class="info-value">{{ soutenance.dateSoutenance | date:'dd/MM/yyyy' }} à {{ soutenance.heureSoutenance }}</span>
                          </div>
                        </div>
                      }
                    </div>

                    <div class="docs-section">
                      <h5 class="section-label"><i class="bi bi-file-earmark-text"></i> Documents</h5>
                      <div class="docs-row">
                        <button class="doc-btn" [disabled]="!soutenance.cheminManuscrit" (click)="openDocument(soutenance.cheminManuscrit!)">
                          <i class="bi bi-file-pdf"></i> Manuscrit
                        </button>
                        <button class="doc-btn" [disabled]="!soutenance.cheminRapportAntiPlagiat" (click)="openDocument(soutenance.cheminRapportAntiPlagiat!)">
                          <i class="bi bi-shield-check"></i> Rapport Anti-Plagiat
                        </button>
                        @if (soutenance.cheminAutorisation) {
                          <button class="doc-btn" (click)="openDocument(soutenance.cheminAutorisation!)">
                            <i class="bi bi-file-earmark-lock"></i> Autorisation
                          </button>
                        }
                      </div>
                    </div>

                    @if (soutenance.membresJury?.length) {
                      <div class="jury-section">
                        <h5 class="section-label"><i class="bi bi-people"></i> Jury proposé ({{ soutenance.membresJury.length }})</h5>
                        <div class="jury-list">
                          @for (m of soutenance.membresJury; track m.id) {
                            <div class="jury-member">
                              <span class="member-role-badge">{{ formatRole(m.role) }}</span>
                              <span class="member-name">{{ m.prenom }} {{ m.nom }}</span>
                              <span class="member-ets">{{ m.etablissement }}</span>
                            </div>
                          }
                        </div>
                      </div>
                    }

                    <!-- ACTIONS SECTION (WORKFLOW) -->
                    <div class="actions-section">

                      <!-- CAS 1: SOUMIS (Admin attend le directeur) -->
                      @if (soutenance.statut === StatutSoutenance.SOUMIS) {
                        <div class="action-box waiting-box">
                          <h5 class="action-title"><i class="bi bi-hourglass-split"></i> En attente du directeur</h5>
                          <p class="action-desc">Le directeur de thèse doit d'abord examiner le dossier et valider les prérequis.</p>
                        </div>
                      }

                      <!-- CAS 2: PREREQUIS_VALIDES (Admin doit autoriser) -->
                      @if (soutenance.statut === StatutSoutenance.PREREQUIS_VALIDES) {
                        <div class="action-box accept-box">
                          <h5 class="action-title"><i class="bi bi-shield-check"></i> Validation Administrative Requise</h5>
                          <p class="action-desc">
                            Le directeur a validé les prérequis académiques.
                            En tant qu'administrateur, vous devez autoriser officiellement la soutenance pour permettre la constitution du jury.
                          </p>
                          <div class="action-buttons">
                            <button class="btn-action btn-success" (click)="approuverDemande(soutenance)" [disabled]="isSubmitting()">
                              <i class="bi bi-check-lg"></i> Autoriser la soutenance
                            </button>
                            <button class="btn-action btn-danger" (click)="rejeterDemande(soutenance)" [disabled]="isSubmitting()">
                              <i class="bi bi-x-lg"></i> Rejeter le dossier
                            </button>
                          </div>
                        </div>
                      }

                      <!-- CAS 3: AUTORISEE (Admin attend la proposition de jury du directeur) -->
                      @if (soutenance.statut === StatutSoutenance.AUTORISEE) {
                        <div class="action-box waiting-box">
                          <h5 class="action-title"><i class="bi bi-person-plus"></i> En attente de proposition du Jury</h5>
                          <p class="action-desc">Dossier autorisé. Le directeur de thèse est en train de sélectionner les membres du jury.</p>
                        </div>
                      }

                      <!-- CAS 4: JURY_PROPOSE (Admin valide jury et planifie) -->
                      @if (soutenance.statut === StatutSoutenance.JURY_PROPOSE) {
                        <div class="action-box jury-box">
                          <h5 class="action-title"><i class="bi bi-calendar-plus"></i> Validation du Jury & Planification</h5>
                          <p class="action-desc">Le jury a été proposé. Veuillez vérifier sa composition et planifier la date.</p>

                          @if (!showPlanificationForm()) {
                            <div class="action-buttons">
                              <button class="btn-action btn-success" (click)="showPlanificationForm.set(true)">
                                <i class="bi bi-check-lg"></i> Valider Jury & Planifier
                              </button>
                              <button class="btn-action btn-danger" (click)="refuserJury(soutenance)">
                                <i class="bi bi-x-lg"></i> Refuser le Jury
                              </button>
                            </div>
                          } @else {
                            <div class="planification-form">
                              <div class="form-row">
                                <div class="form-group"><label>Date</label><input type="date" [(ngModel)]="planificationData.date" class="form-input"></div>
                                <div class="form-group"><label>Heure</label><input type="time" [(ngModel)]="planificationData.heure" class="form-input"></div>
                              </div>
                              <div class="form-group"><label>Lieu</label><input type="text" [(ngModel)]="planificationData.lieu" placeholder="Ex: Amphithéâtre A" class="form-input"></div>
                              <div class="form-actions">
                                <button class="btn-cancel" (click)="showPlanificationForm.set(false)">Annuler</button>
                                <button class="btn-confirm" (click)="validerJuryEtPlanifier(soutenance)" [disabled]="!planificationData.date || isSubmitting()">
                                  <i class="bi bi-calendar-check"></i> Confirmer la planification
                                </button>
                              </div>
                            </div>
                          }
                        </div>
                      }

                      <!-- CAS 5: PLANIFIEE (Saisie des résultats) -->
                      @if (soutenance.statut === StatutSoutenance.PLANIFIEE) {
                        <div class="action-box result-box">
                          <h5 class="action-title"><i class="bi bi-trophy"></i> Enregistrement du Résultat</h5>
                          @if (!showResultForm()) {
                            <button class="btn-action btn-primary" (click)="showResultForm.set(true)">
                              <i class="bi bi-pencil-square"></i> Saisir le PV de soutenance
                            </button>
                          } @else {
                            <div class="result-form">
                              <div class="form-group">
                                <label>Mention attribuée</label>
                                <select [(ngModel)]="resultData.mention" class="form-input">
                                  <option value="">-- Sélectionner --</option>
                                  <option value="Passable">Passable</option>
                                  <option value="Assez Bien">Assez Bien</option>
                                  <option value="Bien">Bien</option>
                                  <option value="Très Bien">Très Bien</option>
                                  <option value="Très Honorable">Très Honorable</option>
                                </select>
                              </div>
                              <div class="form-group">
                                <label>Note Finale (Optionnel)</label>
                                <input type="number" [(ngModel)]="resultData.note" min="0" max="20" step="0.5" class="form-input">
                              </div>
                              <div class="form-group checkbox-group">
                                <input type="checkbox" id="fel-{{soutenance.id}}" [(ngModel)]="resultData.felicitations">
                                <label for="fel-{{soutenance.id}}">Avec félicitations du jury</label>
                              </div>
                              <div class="form-actions">
                                <button class="btn-cancel" (click)="showResultForm.set(false)">Annuler</button>
                                <button class="btn-confirm" (click)="enregistrerResultat(soutenance)" [disabled]="!resultData.mention">
                                  <i class="bi bi-check-circle"></i> Clôturer la soutenance
                                </button>
                              </div>
                            </div>
                          }
                        </div>
                      }

                      <!-- CAS 6: TERMINEE -->
                      @if (soutenance.statut === StatutSoutenance.TERMINEE) {
                        <div class="action-box done-box">
                          <h5 class="action-title"><i class="bi bi-check-circle-fill"></i> Soutenance Clôturée</h5>
                          <div class="result-display">
                            <span class="result-mention">{{ soutenance.mention || 'N/A' }}</span>
                            @if (soutenance.felicitationsJury) {
                              <span class="felicitations-badge"><i class="bi bi-star-fill"></i> Félicitations</span>
                            }
                          </div>
                        </div>
                      }

                    </div> <!-- End Actions -->
                  </div>
                }
              </div>
            }
          }
        </div>
      </div>
    </app-main-layout>
  `,
  styles: [`
    .soutenances-container { max-width: 1400px; margin: 0 auto; }
    .page-header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 24px; padding: 2rem; margin-bottom: 1.5rem; position: relative; overflow: hidden; }
    .page-title { font-size: 1.75rem; font-weight: 800; margin: 0; display: flex; align-items: center; }
    .page-subtitle { margin: 0.5rem 0 0 0; opacity: 0.8; font-size: 0.95rem; }
    .btn-refresh { padding: 0.75rem 1.5rem; background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); border-radius: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; }
    .btn-refresh:hover { background: rgba(255,255,255,0.2); }
    .spinner-icon { animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    .stats-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 1rem; margin-bottom: 2rem; }
    .stat-card { background: white; border-radius: 16px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; transition: transform 0.2s; }
    .stat-card:hover { transform: translateY(-2px); }
    .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .stat-total .stat-icon { background: #f1f5f9; color: #64748b; }
    .stat-prerequis .stat-icon { background: #fef3c7; color: #d97706; }
    .stat-jury .stat-icon { background: #e0e7ff; color: #4f46e5; }
    .stat-planned .stat-icon { background: #dbeafe; color: #2563eb; }
    .stat-done .stat-icon { background: #dcfce7; color: #16a34a; }
    .stat-value { font-size: 1.5rem; font-weight: 800; color: #1e293b; display: block; line-height: 1; }
    .stat-label { font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; margin-top: 0.25rem; }

    .filter-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap; }
    .filter-tabs { display: flex; gap: 0.5rem; background: white; padding: 0.5rem; border-radius: 12px; border: 1px solid #e2e8f0; }
    .filter-tab { padding: 0.6rem 1.2rem; border: none; background: transparent; border-radius: 8px; font-weight: 600; font-size: 0.85rem; color: #64748b; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 0.5rem; }
    .filter-tab:hover { background: #f8fafc; color: #334155; }
    .filter-tab.active { background: #3b82f6; color: white; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3); }
    .badge-count { background: rgba(255,255,255,0.25); padding: 0.15rem 0.5rem; border-radius: 99px; font-size: 0.75rem; }
    .filter-tab:not(.active) .badge-count { background: #e2e8f0; color: #64748b; }

    .search-box { display: flex; align-items: center; gap: 0.75rem; background: white; padding: 0.75rem 1rem; border-radius: 12px; border: 1px solid #e2e8f0; min-width: 280px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
    .search-box i { color: #94a3b8; }
    .search-box input { border: none; outline: none; flex: 1; font-size: 0.9rem; }

    .soutenances-list { display: flex; flex-direction: column; gap: 1.25rem; }
    .loading-state, .empty-state { padding: 4rem; text-align: center; background: white; border-radius: 16px; border: 1px solid #e2e8f0; color: #64748b; }
    .spinner { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
    .empty-state i { font-size: 3rem; color: #cbd5e1; margin-bottom: 1rem; display: block; }

    /* Card Styling */
    .soutenance-card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; border-left: 5px solid transparent; overflow: hidden; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
    .soutenance-card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
    .soutenance-card.expanded { border-color: #3b82f6; box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.1); }

    /* Status Colors */
    .soutenance-card.status-soumis { border-left-color: #94a3b8; }
    .soutenance-card.status-prerequis { border-left-color: #f59e0b; }
    .soutenance-card.status-autorisee { border-left-color: #10b981; }
    .soutenance-card.status-jury { border-left-color: #3b82f6; }
    .soutenance-card.status-planifiee { border-left-color: #ec4899; }
    .soutenance-card.status-terminee { border-left-color: #8b5cf6; }
    .soutenance-card.status-rejetee { border-left-color: #ef4444; }

    .card-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; cursor: pointer; background: #fff; }
    .doctorant-info { display: flex; align-items: center; gap: 1rem; }
    .avatar { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 1.1rem; }
    .doctorant-name { font-size: 1.1rem; font-weight: 700; color: #1e293b; margin: 0; }
    .matricule-badge { font-size: 0.8rem; color: #64748b; font-family: monospace; background: #f1f5f9; padding: 0.1rem 0.4rem; border-radius: 4px; margin-top: 0.25rem; display: inline-block; }

    .status-badge { padding: 0.4rem 0.8rem; border-radius: 50px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
    .status-badge.status-soumis { background: #f1f5f9; color: #64748b; }
    .status-badge.status-prerequis { background: #fffbeb; color: #b45309; border: 1px solid #fcd34d; } /* Orange pour attirer l'attention */
    .status-badge.status-autorisee { background: #dcfce7; color: #166534; }
    .status-badge.status-jury { background: #eff6ff; color: #1d4ed8; border: 1px solid #93c5fd; }
    .status-badge.status-planifiee { background: #fce7f3; color: #9d174d; }
    .status-badge.status-terminee { background: #f3e8ff; color: #6b21a8; }
    .status-badge.status-rejetee { background: #fef2f2; color: #991b1b; }

    .header-right { display: flex; align-items: center; gap: 1.5rem; }
    .expand-icon { color: #cbd5e1; font-size: 1.25rem; transition: transform 0.3s; }
    .expand-icon.rotated { transform: rotate(180deg); color: #3b82f6; }

    .card-body { padding: 1.5rem; border-top: 1px solid #f1f5f9; background: #f8fafc; }

    .thesis-section { margin-bottom: 1.5rem; background: white; padding: 1.25rem; border-radius: 12px; border: 1px solid #e2e8f0; }
    .section-label { font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 0.5rem; display: flex; align-items: center; gap: 0.5rem; }
    .thesis-title { font-size: 1.05rem; font-weight: 600; color: #1e293b; line-height: 1.5; margin: 0; }

    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .info-card { background: white; padding: 1rem; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 1rem; }
    .info-card.highlight { background: #eff6ff; border-color: #bfdbfe; }
    .info-icon { width: 40px; height: 40px; border-radius: 10px; background: #f1f5f9; color: #64748b; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
    .info-card.highlight .info-icon { background: #dbeafe; color: #2563eb; }
    .info-content { display: flex; flex-direction: column; }
    .info-label { font-size: 0.75rem; color: #94a3b8; }
    .info-value { font-size: 0.9rem; font-weight: 600; color: #1e293b; }

    .docs-row { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .doc-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; background: white; border: 1px solid #e2e8f0; border-radius: 10px; font-weight: 500; color: #475569; cursor: pointer; transition: all 0.2s; }
    .doc-btn:hover:not(:disabled) { border-color: #3b82f6; color: #3b82f6; transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .doc-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .jury-section { margin-bottom: 1.5rem; }
    .jury-list { display: flex; flex-wrap: wrap; gap: 0.75rem; }
    .jury-member { background: white; border: 1px solid #e2e8f0; padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem; }
    .member-role-badge { background: #f1f5f9; font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 600; color: #475569; text-transform: uppercase; }
    .member-name { font-weight: 600; color: #1e293b; }
    .member-ets { font-size: 0.8rem; color: #94a3b8; font-style: italic; }

    /* ACTION BOXES */
    .action-box { border-radius: 16px; padding: 1.5rem; border: 1px solid; margin-top: 1.5rem; }

    .action-box.waiting-box { background: #f8fafc; border-color: #e2e8f0; }
    .waiting-box .action-title { color: #64748b; }

    .action-box.accept-box { background: #fffbeb; border-color: #fcd34d; }
    .accept-box .action-title { color: #b45309; }

    .action-box.jury-box { background: #eff6ff; border-color: #60a5fa; }
    .jury-box .action-title { color: #1d4ed8; }

    .action-box.result-box { background: #faf5ff; border-color: #c084fc; }
    .result-box .action-title { color: #7e22ce; }

    .action-box.done-box { background: #f0fdf4; border-color: #4ade80; text-align: center; }
    .done-box .action-title { color: #15803d; justify-content: center; }

    .action-title { margin: 0 0 0.5rem; font-size: 1rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
    .action-desc { margin: 0 0 1.5rem; color: #475569; font-size: 0.95rem; }

    .action-buttons { display: flex; gap: 1rem; flex-wrap: wrap; }
    .btn-action { padding: 0.875rem 1.5rem; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; font-size: 0.95rem; }
    .btn-success { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; box-shadow: 0 4px 6px -1px rgba(34, 197, 94, 0.3); }
    .btn-danger { background: white; color: #ef4444; border: 1px solid #fecaca; }
    .btn-primary { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; }

    .planification-form, .result-form { background: white; padding: 1.5rem; border-radius: 12px; border: 1px solid rgba(0,0,0,0.05); }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
    .form-group { margin-bottom: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .form-group label { font-size: 0.85rem; font-weight: 600; color: #475569; }
    .form-input { padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.95rem; width: 100%; transition: border-color 0.2s; }
    .form-input:focus { border-color: #3b82f6; outline: none; }
    .form-actions { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1rem; }
    .btn-cancel { padding: 0.75rem 1.5rem; background: #f1f5f9; border: none; border-radius: 8px; font-weight: 600; color: #64748b; cursor: pointer; }
    .btn-confirm { padding: 0.75rem 1.5rem; background: #3b82f6; border: none; border-radius: 8px; font-weight: 600; color: white; cursor: pointer; }
    .checkbox-group { flex-direction: row; align-items: center; }

    .result-display { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
    .result-mention { font-size: 1.5rem; font-weight: 800; color: #1e293b; }
    .felicitations-badge { background: #fef3c7; color: #d97706; padding: 0.5rem 1rem; border-radius: 99px; font-weight: 700; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; }

    @media (max-width: 1200px) { .stats-row { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 768px) { .stats-row { grid-template-columns: 1fr; } .form-row { grid-template-columns: 1fr; } .header-content { margin-bottom: 1rem; } .page-header { flex-direction: column; align-items: flex-start; } .action-buttons { flex-direction: column; } .btn-action { width: 100%; justify-content: center; } }
  `]
})
export class SoutenanceListComponent implements OnInit {
  StatutSoutenance = StatutSoutenance;

  soutenances = signal<Soutenance[]>([]);
  isLoading = signal(true);
  isSubmitting = signal(false);
  activeFilter = signal<'all' | 'prerequis' | 'jury' | 'planned'>('all');
  searchTerm = signal('');
  expandedId = signal<number | null>(null);

  showPlanificationForm = signal(false);
  showResultForm = signal(false);

  planificationData = { date: '', heure: '09:00', lieu: '' };
  resultData = { mention: '', felicitations: false, note: 0 };

  // --- Computed Stats & Filter ---
  totalCount = computed(() => this.soutenances().filter(s => s.statut !== StatutSoutenance.BROUILLON).length);
  prerequisCount = computed(() => this.soutenances().filter(s => s.statut === StatutSoutenance.PREREQUIS_VALIDES).length);
  juryCount = computed(() => this.soutenances().filter(s => s.statut === StatutSoutenance.JURY_PROPOSE).length);
  plannedCount = computed(() => this.soutenances().filter(s => s.statut === StatutSoutenance.PLANIFIEE).length);
  doneCount = computed(() => this.soutenances().filter(s => s.statut === StatutSoutenance.TERMINEE).length);

  filteredSoutenances = computed(() => {
    let result = this.soutenances().filter(s => s.statut !== StatutSoutenance.BROUILLON);

    // Filtres
    switch (this.activeFilter()) {
      case 'prerequis': result = result.filter(s => s.statut === StatutSoutenance.PREREQUIS_VALIDES); break;
      case 'jury': result = result.filter(s => s.statut === StatutSoutenance.JURY_PROPOSE); break;
      case 'planned': result = result.filter(s => s.statut === StatutSoutenance.PLANIFIEE); break;
    }

    // Recherche
    const search = this.searchTerm().toLowerCase();
    if (search) {
      result = result.filter(s =>
          this.getDoctorantNom(s).toLowerCase().includes(search) ||
          (s.titreThese?.toLowerCase().includes(search)) ||
          (this.getMatricule(s).toLowerCase().includes(search))
      );
    }
    return result;
  });

  constructor(private soutenanceService: SoutenanceService) {}

  ngOnInit(): void { this.loadSoutenances(); }

  loadSoutenances(): void {
    this.isLoading.set(true);
    this.soutenanceService.getAllSoutenances().subscribe({
      next: (data) => { this.soutenances.set(data); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  setFilter(filter: 'all' | 'prerequis' | 'jury' | 'planned'): void {
    this.activeFilter.set(filter);
    this.expandedId.set(null); // Collapse on filter change
  }

  toggleExpand(id: number): void {
    if (this.expandedId() === id) { this.expandedId.set(null); this.resetForms(); }
    else { this.expandedId.set(id); this.resetForms(); }
  }

  resetForms(): void {
    this.showPlanificationForm.set(false);
    this.showResultForm.set(false);
    this.planificationData = { date: '', heure: '09:00', lieu: '' };
    this.resultData = { mention: '', felicitations: false, note: 0 };
  }

  // --- Helpers ---
  getDoctorantNom(s: Soutenance): string { return s.doctorantInfo ? `${s.doctorantInfo.prenom} ${s.doctorantInfo.nom}` : `Doctorant #${s.doctorantId}`; }
  getDirecteurNom(s: Soutenance): string { return s.directeurInfo ? `${s.directeurInfo.prenom} ${s.directeurInfo.nom}` : `Directeur #${s.directeurId}`; }
  openDocument(path: string): void { this.soutenanceService.openDocument(path); }

  // Correction erreur TS2339: utilisation sûre de la propriété username
  getMatricule(s: Soutenance): string {
    return (s.doctorantInfo as any)?.username || 'N/A';
  }

  getInitials(name: string): string {
    const p = name.trim().split(' ');
    return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : name[0]?.toUpperCase() || '?';
  }

  getAvatarColor(id: number): string {
    const c = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#3b82f6'];
    return c[id % c.length];
  }

  // Styles CSS dynamiques
  getCardClass(statut: StatutSoutenance): string { const m: Record<string, string> = { SOUMIS: 'status-soumis', PREREQUIS_VALIDES: 'status-prerequis', AUTORISEE: 'status-autorisee', JURY_PROPOSE: 'status-jury', PLANIFIEE: 'status-planifiee', TERMINEE: 'status-terminee', REJETEE: 'status-rejetee' }; return m[statut] || ''; }
  getStatusBadgeClass(statut: StatutSoutenance): string { return this.getCardClass(statut); }

  formatStatut(statut: StatutSoutenance): string {
    const m: Record<string, string> = {
      SOUMIS: 'Attente Directeur',
      PREREQUIS_VALIDES: 'À Autoriser',
      AUTORISEE: 'Attente Jury',
      JURY_PROPOSE: 'Jury à Valider',
      PLANIFIEE: 'Planifiée',
      TERMINEE: 'Terminée',
      REJETEE: 'Rejetée'
    };
    return m[statut] || statut;
  }

  formatRole(role: string): string {
    const map: Record<string, string> = { 'PRESIDENT': 'Président', 'RAPPORTEUR': 'Rapporteur', 'EXAMINATEUR': 'Examinateur' };
    return map[role] || role;
  }

  // --- ACTIONS WORKFLOW ---

  // Étape 2: Admin approuve les prérequis validés par le directeur
  approuverDemande(s: Soutenance): void {
    if (confirm(`Confirmer l'autorisation de soutenance pour ${this.getDoctorantNom(s)} ?\n\nLe directeur pourra ensuite procéder à la sélection du jury.`)) {
      this.isSubmitting.set(true);
      // Appel API : /api/soutenances/{id}/autoriser
      this.soutenanceService.autoriserSoutenance(s.id).subscribe({
        next: () => {
          alert('✅ Soutenance autorisée avec succès !');
          this.loadSoutenances();
          this.isSubmitting.set(false);
        },
        error: (e) => {
          alert('Erreur: ' + (e.error?.error || 'Une erreur est survenue'));
          this.isSubmitting.set(false);
        }
      });
    }
  }

  rejeterDemande(s: Soutenance): void {
    const motif = prompt('Veuillez saisir le motif du rejet :');
    if (motif?.trim()) {
      this.isSubmitting.set(true);
      this.soutenanceService.rejeterSoutenance(s.id, motif.trim()).subscribe({
        next: () => { this.loadSoutenances(); this.isSubmitting.set(false); },
        error: () => { alert('Erreur lors du rejet'); this.isSubmitting.set(false); }
      });
    }
  }

  refuserJury(s: Soutenance): void {
    const motif = prompt('Motif du refus du jury (le directeur devra recommencer) :');
    if (motif?.trim()) {
      this.isSubmitting.set(true);
      this.soutenanceService.refuserJury(s.id, motif.trim()).subscribe({
        next: () => {
          alert('Jury refusé. Le statut est repassé à "Autorisée".');
          this.loadSoutenances();
          this.isSubmitting.set(false);
        },
        error: () => { alert('Erreur'); this.isSubmitting.set(false); }
      });
    }
  }

  // Étape 5: Admin valide le jury et planifie
  validerJuryEtPlanifier(s: Soutenance): void {
    if (!this.planificationData.date) return;

    if(confirm(`Confirmer la planification pour le ${this.planificationData.date} ?`)) {
      this.isSubmitting.set(true);

      // 1. Valider le jury
      this.soutenanceService.validerJury(s.id, 'Jury validé par administration').subscribe({
        next: () => {
          // 2. Planifier
          this.soutenanceService.planifierSoutenance(s.id, {
            dateSoutenance: this.planificationData.date,
            heureSoutenance: this.planificationData.heure,
            lieuSoutenance: this.planificationData.lieu
          }).subscribe({
            next: () => {
              alert('✅ Soutenance planifiée avec succès !');
              this.loadSoutenances();
              this.resetForms();
              this.isSubmitting.set(false);
            },
            error: () => { alert('Erreur lors de la planification'); this.isSubmitting.set(false); }
          });
        },
        error: () => { alert('Erreur lors de la validation du jury'); this.isSubmitting.set(false); }
      });
    }
  }

  // Étape 6: Enregistrement résultats
  enregistrerResultat(s: Soutenance): void {
    if (!this.resultData.mention) return;
    this.isSubmitting.set(true);

    // Correction erreur TS2353: On passe l'objet complet avec la note (typé any pour éviter l'erreur si l'interface n'est pas à jour)
    const resultPayload: any = {
      mention: this.resultData.mention,
      felicitations: this.resultData.felicitations,
      note: this.resultData.note
    };

    this.soutenanceService.enregistrerResultat(s.id, resultPayload).subscribe({
      next: () => {
        alert('✅ Résultat enregistré. La procédure est terminée.');
        this.loadSoutenances();
        this.resetForms();
        this.isSubmitting.set(false);
      },
      error: () => { alert('Erreur'); this.isSubmitting.set(false); }
    });
  }
}