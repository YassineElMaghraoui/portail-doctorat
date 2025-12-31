import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '@shared/components/main-layout/main-layout.component';
import { SoutenanceService } from '@core/services/soutenance.service';
import { UserService } from '@core/services/user.service';

@Component({
  selector: 'app-admin-soutenance',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent],
  template: `
    <app-main-layout>
      <div class="page-container">

        <!-- Hero Header -->
        <div class="hero-section">
          <div class="hero-content">
            <div class="hero-icon"><i class="bi bi-mortarboard-fill"></i></div>
            <div>
              <h1 class="hero-title">Administration des Soutenances</h1>
              <p class="hero-subtitle">Supervision, planification et validation finale des thèses</p>
            </div>
          </div>
          <button class="btn-refresh" (click)="loadData()" [disabled]="isLoading()">
            @if (isLoading()) { <span class="spinner"></span> } @else { <i class="bi bi-arrow-clockwise"></i> }
            Actualiser
          </button>
        </div>

        <!-- Stats Grid (Tous les statuts) -->
        <div class="stats-grid">
          <!-- 1. Soumis (Chez Directeur) -->
          <div class="stat-card blue-soft">
            <div class="stat-icon"><i class="bi bi-person-workspace"></i></div>
            <div class="stat-info"><span class="stat-value">{{ getCount('SOUMIS') }}</span><span class="stat-label">En examen (Dir.)</span></div>
          </div>

          <!-- 2. Prérequis Validés (Action Admin: Autoriser) -->
          <div class="stat-card orange">
            <div class="stat-icon"><i class="bi bi-shield-check"></i></div>
            <div class="stat-info"><span class="stat-value">{{ getCount('PREREQUIS_VALIDES') }}</span><span class="stat-label">À Autoriser</span></div>
          </div>

          <!-- 3. Autorisée (Chez Directeur pour Jury) -->
          <div class="stat-card purple-soft">
            <div class="stat-icon"><i class="bi bi-people"></i></div>
            <div class="stat-info"><span class="stat-value">{{ getCount('AUTORISEE') }}</span><span class="stat-label">Attente Jury</span></div>
          </div>

          <!-- 4. Jury Proposé (Action Admin: Planifier) -->
          <div class="stat-card purple">
            <div class="stat-icon"><i class="bi bi-calendar-plus"></i></div>
            <div class="stat-info"><span class="stat-value">{{ getCount('JURY_PROPOSE') }}</span><span class="stat-label">À Planifier</span></div>
          </div>

          <!-- 5. Planifiée (En attente de soutenance) -->
          <div class="stat-card blue">
            <div class="stat-icon"><i class="bi bi-calendar-event"></i></div>
            <div class="stat-info"><span class="stat-value">{{ getCount('PLANIFIEE') }}</span><span class="stat-label">Planifiées</span></div>
          </div>

          <!-- 6. Terminée & Rejetée -->
          <div class="stat-card green">
            <div class="stat-icon"><i class="bi bi-trophy-fill"></i></div>
            <div class="stat-info"><span class="stat-value">{{ getCount('TERMINEE') }}</span><span class="stat-label">Terminées</span></div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="tabs-container">
          <div class="tabs">
            <button class="tab-btn" [class.active]="activeTab === 'A_TRAITER'" (click)="setTab('A_TRAITER')">
              <i class="bi bi-lightning-charge-fill"></i> À traiter (Admin)
              @if (getActionRequiredCount() > 0) { <span class="tab-badge">{{ getActionRequiredCount() }}</span> }
            </button>
            <button class="tab-btn" [class.active]="activeTab === 'CHEZ_DIRECTEUR'" (click)="setTab('CHEZ_DIRECTEUR')">
              <i class="bi bi-person-badge"></i> En cours (Directeur)
              @if (getDirectorPendingCount() > 0) { <span class="tab-badge info">{{ getDirectorPendingCount() }}</span> }
            </button>
            <button class="tab-btn" [class.active]="activeTab === 'PLANIFIEES'" (click)="setTab('PLANIFIEES')">
              <i class="bi bi-calendar-check"></i> Planifiées
            </button>
            <button class="tab-btn" [class.active]="activeTab === 'HISTORIQUE'" (click)="setTab('HISTORIQUE')">
              <i class="bi bi-clock-history"></i> Historique
            </button>
          </div>
        </div>

        <!-- Loading -->
        @if (isLoading()) { <div class="loading-state"><div class="loading-spinner"></div><span>Chargement...</span></div> }

        <!-- Empty State -->
        @if (!isLoading() && filteredSoutenances().length === 0) {
          <div class="section-card"><div class="empty-state"><div class="empty-icon"><i class="bi bi-inbox"></i></div><h3>Aucun dossier</h3><p>Rien à afficher dans cette catégorie.</p></div></div>
        }

        <!-- TABLEAU -->
        @if (!isLoading() && filteredSoutenances().length > 0) {
          <div class="section-card">
            <div class="table-container">
              <table class="data-table">
                <thead>
                <tr>
                  <th>Doctorant</th>
                  <th>Directeur</th>
                  <th>Sujet</th>
                  <th>Date Demande</th>
                  <th>Statut Actuel</th>
                  <th>Action</th>
                </tr>
                </thead>
                <tbody>
                  @for (s of filteredSoutenances(); track s.id) {
                    <tr class="clickable" (click)="openDetails(s)">
                      <td>
                        <div class="user-cell">
                          <div class="user-avatar purple">{{ getInitials(s) }}</div>
                          <div class="user-info">
                            <span class="user-name">{{ getDoctorantName(s) }}</span>
                            <span class="user-id">Mat: {{ s.doctorantInfo?.username }}</span>
                          </div>
                        </div>
                      </td>
                      <td class="fw-bold text-dark">{{ getDirecteurName(s) }}</td>
                      <td><div class="motif-cell" [title]="s.titreThese">{{ truncate(s.titreThese) }}</div></td>
                      <td><span class="date-badge">{{ s.createdAt | date:'dd/MM/yyyy' }}</span></td>
                      <td>
                                                <span class="status-badge" [ngClass]="getStatusClass(s.statut)">
                                                    <i class="bi" [ngClass]="getStatusIcon(s.statut)"></i>
                                                  {{ formatStatus(s.statut) }}
                                                </span>
                      </td>
                      <td (click)="$event.stopPropagation()">
                        @if (canAdminAct(s.statut)) {
                          <button class="btn-action" (click)="openDetails(s)">
                            <i class="bi bi-pencil-square"></i> Traiter
                          </button>
                        } @else {
                          <span class="text-muted small"><i class="bi bi-eye"></i> Voir</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- MODAL DÉTAILS & ACTIONS -->
        @if (selectedSoutenance()) {
          <div class="modal-overlay" (click)="closeDetails()">
            <div class="modal-content" (click)="$event.stopPropagation()">
              <div class="modal-header">
                <h3><i class="bi bi-folder2-open"></i> Dossier de Soutenance #{{ selectedSoutenance().id }}</h3>
                <button class="btn-close" (click)="closeDetails()"><i class="bi bi-x-lg"></i></button>
              </div>

              <div class="modal-body">

                <!-- WORKFLOW -->
                <div class="workflow-container">
                  <div class="step completed">
                    <div class="step-circle"><i class="bi bi-file-earmark-plus"></i></div>
                    <span class="step-label">Dépôt</span>
                  </div>
                  <div class="step-line" [class.active]="getStep(selectedSoutenance()) >= 2"></div>

                  <div class="step" [ngClass]="getStepClass(selectedSoutenance(), 2)">
                    <div class="step-circle"><i class="bi bi-person-check"></i></div>
                    <span class="step-label">Directeur</span>
                  </div>
                  <div class="step-line" [class.active]="getStep(selectedSoutenance()) >= 3"></div>

                  <div class="step" [ngClass]="getStepClass(selectedSoutenance(), 3)">
                    <div class="step-circle"><i class="bi bi-shield-check"></i></div>
                    <span class="step-label">Autorisation</span>
                  </div>
                  <div class="step-line" [class.active]="getStep(selectedSoutenance()) >= 4"></div>

                  <div class="step" [ngClass]="getStepClass(selectedSoutenance(), 4)">
                    <div class="step-circle"><i class="bi bi-people"></i></div>
                    <span class="step-label">Jury</span>
                  </div>
                  <div class="step-line" [class.active]="getStep(selectedSoutenance()) >= 5"></div>

                  <div class="step" [ngClass]="getStepClass(selectedSoutenance(), 5)">
                    <div class="step-circle"><i class="bi bi-trophy"></i></div>
                    <span class="step-label">Soutenance</span>
                  </div>
                </div>

                <!-- INFO GRID -->
                <div class="detail-grid">
                  <div class="detail-item">
                    <label>Doctorant</label>
                    <span class="value">{{ getDoctorantName(selectedSoutenance()) }}</span>
                  </div>
                  <div class="detail-item">
                    <label>Directeur</label>
                    <span class="value">{{ getDirecteurName(selectedSoutenance()) }}</span>
                  </div>
                  <div class="detail-item full-width">
                    <label>Sujet de Thèse</label>
                    <div class="info-box">{{ selectedSoutenance().titreThese }}</div>
                  </div>
                </div>

                <!-- ACTIONS SPECIFIQUES SELON STATUT -->
                <div class="action-section">

                  <!-- CAS 1: Prérequis Validés -> ADMIN DOIT AUTORISER -->
                  @if (selectedSoutenance().statut === 'PREREQUIS_VALIDES') {
                    <div class="admin-action-box">
                      <h5><i class="bi bi-shield-check"></i> Autorisation de Soutenance</h5>
                      <p>Le directeur a validé les prérequis académiques. Confirmez-vous l'autorisation administrative ?</p>
                      <div class="action-buttons">
                        <button class="btn-refuse" (click)="rejeter(selectedSoutenance().id)">Refuser</button>
                        <button class="btn-validate" (click)="autoriser(selectedSoutenance().id)">Autoriser la soutenance</button>
                      </div>
                    </div>
                  }

                  <!-- CAS 2: Jury Proposé -> ADMIN DOIT VALIDER ET PLANIFIER -->
                  @if (selectedSoutenance().statut === 'JURY_PROPOSE') {
                    <div class="admin-action-box">
                      <h5><i class="bi bi-calendar-plus"></i> Validation du Jury & Planification</h5>
                      <p class="mb-3">Vérifiez la composition du jury ci-dessous et fixez la date.</p>

                      <!-- Affichage du jury -->
                      <div class="jury-list mb-3">
                        <h6>Membres proposés :</h6>
                        @for (m of selectedSoutenance().membresJury; track m.id) {
                          <div class="jury-member">
                            <span class="role">{{ m.role }}</span>
                            <span class="name">{{ m.prenom }} {{ m.nom }}</span>
                            <span class="ets text-muted">({{ m.etablissement }})</span>
                          </div>
                        }
                      </div>

                      <div class="planning-form">
                        <div class="form-group">
                          <label>Date</label>
                          <input type="date" [(ngModel)]="planning.date">
                        </div>
                        <div class="form-group">
                          <label>Heure</label>
                          <input type="time" [(ngModel)]="planning.heure">
                        </div>
                        <div class="form-group full">
                          <label>Lieu / Salle</label>
                          <input type="text" [(ngModel)]="planning.lieu" placeholder="Ex: Salle de conférences B">
                        </div>
                      </div>
                      <div class="action-buttons mt-3">
                        <button class="btn-refuse" (click)="rejeter(selectedSoutenance().id)">Refuser le Jury</button>
                        <button class="btn-validate" [disabled]="!isPlanningValid()" (click)="planifier(selectedSoutenance().id)">Valider et Planifier</button>
                      </div>
                    </div>
                  }

                  <!-- CAS 3: Planifiée -> ADMIN DOIT CLÔTURER (RÉSULTAT) -->
                  @if (selectedSoutenance().statut === 'PLANIFIEE') {
                    <div class="admin-action-box final">
                      <h5><i class="bi bi-trophy"></i> Clôture de la Soutenance</h5>
                      <p>La soutenance a eu lieu le <strong>{{ selectedSoutenance().dateSoutenance | date:'dd/MM/yyyy' }}</strong>.</p>

                      <div class="planning-form">
                        <div class="form-group full">
                          <label>Mention obtenue</label>
                          <select [(ngModel)]="resultat.mention">
                            <option value="">-- Sélectionner --</option>
                            <option value="Honorable">Honorable</option>
                            <option value="Tres Honorable">Très Honorable</option>
                            <option value="Tres Honorable avec felicitations">Très Honorable avec félicitations</option>
                          </select>
                        </div>
                      </div>

                      <div class="action-buttons mt-3">
                        <button class="btn-validate w-100" [disabled]="!resultat.mention" (click)="cloturer(selectedSoutenance().id)">Enregistrer le résultat</button>
                      </div>
                    </div>
                  }

                  <!-- CAS 4: Terminée (Info) -->
                  @if (selectedSoutenance().statut === 'TERMINEE') {
                    <div class="info-box success">
                      <i class="bi bi-check-circle-fill"></i>
                      <div>
                        <strong>Soutenance validée</strong>
                        <p>Mention : {{ selectedSoutenance().mention }}</p>
                      </div>
                    </div>
                  }

                </div>
              </div>
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
    .page-container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem 3rem; }
    .hero-section { background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); border-radius: 24px; padding: 2rem; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; color: white; }
    .hero-content { display: flex; align-items: center; gap: 1.25rem; }
    .hero-icon { width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; }
    .hero-title { margin: 0; font-size: 1.6rem; font-weight: 800; }
    .hero-subtitle { margin: 0.25rem 0 0; opacity: 0.9; }
    .btn-refresh { padding: 0.75rem 1.25rem; background: white; color: #6d28d9; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; display: flex; gap: 0.5rem; align-items: center; }
    .btn-refresh:hover { transform: translateY(-2px); }
    .spinner { width: 16px; height: 16px; border: 2px solid #e9d5ff; border-top-color: #7c3aed; border-radius: 50%; animation: spin 0.8s linear infinite; }

    .stats-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: white; border-radius: 16px; padding: 1rem; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; }
    .stat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; margin-bottom: 0.25rem; }
    .stat-card.blue-soft .stat-icon { background: #dbeafe; color: #2563eb; }
    .stat-card.orange .stat-icon { background: #fff7ed; color: #ea580c; }
    .stat-card.purple-soft .stat-icon { background: #f3e8ff; color: #9333ea; }
    .stat-card.purple .stat-icon { background: #7c3aed; color: white; }
    .stat-card.blue .stat-icon { background: #1d4ed8; color: white; }
    .stat-card.green .stat-icon { background: #dcfce7; color: #16a34a; }
    .stat-value { font-size: 1.4rem; font-weight: 800; color: #1e293b; display: block; line-height: 1; }
    .stat-label { font-size: 0.7rem; color: #64748b; font-weight: 600; text-transform: uppercase; }

    .tabs-container { display: flex; justify-content: center; margin-bottom: 1.5rem; }
    .tabs { background: #f1f5f9; padding: 5px; border-radius: 50px; display: inline-flex; gap: 5px; flex-wrap: wrap; justify-content: center; }
    .tab-btn { border: none; background: transparent; padding: 0.75rem 1.25rem; border-radius: 40px; font-weight: 600; color: #64748b; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; transition: all 0.2s; white-space: nowrap; }
    .tab-btn.active { background: white; color: #7c3aed; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .tab-badge { background: #ef4444; color: white; padding: 0.15rem 0.5rem; border-radius: 50px; font-size: 0.7rem; }
    .tab-badge.info { background: #3b82f6; }

    .section-card { background: white; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; overflow: hidden; }
    .table-container { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { padding: 1rem 1.25rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
    .data-table td { padding: 1rem 1.25rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    .data-table tbody tr { transition: background 0.2s; cursor: pointer; }
    .data-table tbody tr:hover { background: #f0f9ff; }

    .user-cell { display: flex; align-items: center; gap: 0.75rem; }
    .user-avatar { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; font-weight: 700; color: white; }
    .user-avatar.purple { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
    .user-info { display: flex; flex-direction: column; }
    .user-name { font-weight: 600; color: #1e293b; }
    .user-id { font-size: 0.8rem; color: #64748b; }

    .status-badge { padding: 0.35rem 0.75rem; border-radius: 50px; font-size: 0.75rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.4rem; white-space: nowrap; }
    .status-badge.pending { background: #fef3c7; color: #b45309; }
    .status-badge.action { background: #fef2f2; color: #dc2626; animation: pulse-red 2s infinite; }
    .status-badge.waiting { background: #e0e7ff; color: #4338ca; }
    .status-badge.success { background: #dcfce7; color: #15803d; }
    .status-badge.danger { background: #fee2e2; color: #991b1b; }

    .btn-action { padding: 0.4rem 0.8rem; background: #7c3aed; color: white; border: none; border-radius: 6px; font-size: 0.8rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.4rem; }
    .btn-action:hover { background: #6d28d9; }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 1000; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.2s; }
    .modal-content { background: white; border-radius: 20px; width: 100%; max-width: 700px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px rgba(0,0,0,0.25); animation: slideUp 0.3s; }
    .modal-header { padding: 1.5rem; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background: #fcfcfc; }
    .modal-header h3 { margin: 0; font-size: 1.2rem; color: #1e293b; display: flex; align-items: center; gap: 0.5rem; }
    .btn-close { border: none; background: transparent; font-size: 1.25rem; color: #64748b; cursor: pointer; }

    .modal-body { padding: 2rem; }

    .workflow-container { display: flex; align-items: center; justify-content: center; margin-bottom: 2rem; padding: 1.5rem; background: #f8fafc; border-radius: 16px; border: 1px solid #f1f5f9; overflow-x: auto; }
    .step { display: flex; flex-direction: column; align-items: center; position: relative; z-index: 2; min-width: 80px; text-align: center; }
    .step-circle { width: 36px; height: 36px; border-radius: 50%; background: #e2e8f0; color: #94a3b8; display: flex; align-items: center; justify-content: center; font-size: 1rem; margin-bottom: 0.5rem; border: 3px solid #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
    .step-label { font-size: 0.65rem; font-weight: 600; color: #64748b; }
    .step.completed .step-circle { background: #22c55e; color: white; }
    .step.current .step-circle { background: #7c3aed; color: white; animation: pulse 2s infinite; }
    .step-line { flex: 1; height: 3px; background: #e2e8f0; margin-top: -20px; position: relative; z-index: 1; min-width: 30px; }
    .step-line.active { background: #22c55e; }

    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
    .detail-item { display: flex; flex-direction: column; gap: 0.4rem; }
    .detail-item.full-width { grid-column: 1 / -1; }
    .detail-item label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
    .detail-item .value { font-size: 1rem; color: #1e293b; font-weight: 500; }
    .info-box { background: #f8fafc; padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0; color: #334155; }

    /* Action Section */
    .action-section { border-top: 1px solid #e2e8f0; padding-top: 1.5rem; }
    .admin-action-box { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 1.5rem; }
    .admin-action-box.final { background: #eff6ff; border-color: #bfdbfe; }
    .admin-action-box h5 { margin: 0 0 0.5rem; color: #9a3412; font-size: 1rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
    .admin-action-box.final h5 { color: #1e40af; }
    .admin-action-box p { margin: 0 0 1rem; font-size: 0.9rem; color: #475569; }

    .action-buttons { display: flex; gap: 1rem; justify-content: flex-end; }
    .btn-validate { padding: 0.75rem 1.5rem; border-radius: 8px; background: #22c55e; color: white; border: none; font-weight: 600; cursor: pointer; }
    .btn-refuse { padding: 0.75rem 1.5rem; border-radius: 8px; background: white; color: #dc2626; border: 1px solid #fecaca; font-weight: 600; cursor: pointer; }

    .jury-list { background: white; padding: 1rem; border-radius: 8px; border: 1px solid #e2e8f0; }
    .jury-member { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
    .jury-member:last-child { border-bottom: none; }
    .jury-member .role { font-weight: 700; color: #7c3aed; width: 100px; }

    .planning-form { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.3rem; }
    .form-group.full { grid-column: 1 / -1; }
    .form-group label { font-size: 0.8rem; font-weight: 600; color: #475569; }
    .form-group input, .form-group select { padding: 0.6rem; border: 1px solid #cbd5e1; border-radius: 6px; }

    .loading-state, .empty-state { padding: 4rem; text-align: center; color: #64748b; }
    .empty-icon { font-size: 2.5rem; color: #cbd5e1; margin-bottom: 1rem; }

    .toast { position: fixed; bottom: 2rem; right: 2rem; padding: 1rem 1.5rem; border-radius: 12px; display: flex; align-items: center; gap: 0.75rem; font-weight: 500; box-shadow: 0 10px 40px rgba(0,0,0,0.2); z-index: 2000; }
    .toast.success { background: #22c55e; color: white; }
    .toast.error { background: #ef4444; color: white; }

    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes pulse-red { 0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); } 70% { box-shadow: 0 0 0 6px rgba(220, 38, 38, 0); } }

    @media (max-width: 1024px) { .stats-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 768px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } .detail-grid { grid-template-columns: 1fr; } .planning-form { grid-template-columns: 1fr; } }
  `]
})
export class AdminSoutenanceComponent implements OnInit {
  soutenances = signal<any[]>([]);
  isLoading = signal(true);
  activeTab = 'A_TRAITER';
  selectedSoutenance = signal<any>(null);
  toast = signal<{show: boolean, message: string, type: 'success' | 'error'}>({show: false, message: '', type: 'success'});

  // Form data
  planning = { date: '', heure: '', lieu: '' };
  resultat = { mention: '' };

  constructor(
      private soutenanceService: SoutenanceService,
      private userService: UserService
  ) {}

  ngOnInit() { this.loadData(); }

  loadData() {
    this.isLoading.set(true);
    // Récupérer toutes les soutenances
    this.soutenanceService.getAllSoutenances().subscribe({
      next: (data) => this.enrichData(data),
      error: () => this.isLoading.set(false)
    });
  }

  enrichData(data: any[]) {
    if(data.length === 0) { this.soutenances.set([]); this.isLoading.set(false); return; }
    let loaded = 0;
    data.forEach(s => {
      // Enrichir avec Doctorant
      this.userService.getUserById(s.doctorantId).subscribe({
        next: (doc) => {
          s.doctorantInfo = doc;
          // Enrichir avec Directeur
          if(doc.directeurId) {
            this.userService.getUserById(doc.directeurId).subscribe(dir => {
              s.directeurInfo = dir;
              if(++loaded === data.length) { this.soutenances.set(data); this.isLoading.set(false); }
            });
          } else {
            if(++loaded === data.length) { this.soutenances.set(data); this.isLoading.set(false); }
          }
        },
        error: () => { if(++loaded === data.length) { this.soutenances.set(data); this.isLoading.set(false); } }
      });
    });
  }

  setTab(tab: string) { this.activeTab = tab; }

  filteredSoutenances() {
    const all = this.soutenances();
    if (this.activeTab === 'A_TRAITER') {
      // PREREQUIS_VALIDES (Autoriser), JURY_PROPOSE (Planifier), PLANIFIEE (Clôturer)
      return all.filter(s => ['PREREQUIS_VALIDES', 'JURY_PROPOSE', 'PLANIFIEE'].includes(s.statut));
    }
    if (this.activeTab === 'CHEZ_DIRECTEUR') {
      // SOUMIS (Valid prerequis), AUTORISEE (Proposer jury)
      return all.filter(s => ['SOUMIS', 'AUTORISEE'].includes(s.statut));
    }
    if (this.activeTab === 'PLANIFIEES') {
      return all.filter(s => s.statut === 'PLANIFIEE');
    }
    if (this.activeTab === 'HISTORIQUE') {
      return all.filter(s => ['TERMINEE', 'REJETEE'].includes(s.statut));
    }
    return [];
  }

  // Counts
  getCount(statut: string) { return this.soutenances().filter(s => s.statut === statut).length; }
  getActionRequiredCount() { return this.soutenances().filter(s => ['PREREQUIS_VALIDES', 'JURY_PROPOSE', 'PLANIFIEE'].includes(s.statut)).length; }
  getDirectorPendingCount() { return this.soutenances().filter(s => ['SOUMIS', 'AUTORISEE'].includes(s.statut)).length; }

  // Helpers
  getDoctorantName(s: any) { return s.doctorantInfo ? `${s.doctorantInfo.prenom} ${s.doctorantInfo.nom}` : `Doc #${s.doctorantId}`; }
  getDirecteurName(s: any) { return s.directeurInfo ? `${s.directeurInfo.prenom} ${s.directeurInfo.nom}` : 'Non assigné'; }
  getInitials(s: any) { return s.doctorantInfo ? (s.doctorantInfo.prenom[0] + s.doctorantInfo.nom[0]).toUpperCase() : '?'; }
  truncate(t: string) { return t?.length > 40 ? t.substr(0, 40) + '...' : t; }

  getStatusClass(s: string) {
    if(['PREREQUIS_VALIDES', 'JURY_PROPOSE'].includes(s)) return 'action';
    if(['SOUMIS', 'AUTORISEE'].includes(s)) return 'waiting';
    if(s === 'PLANIFIEE') return 'pending';
    if(s === 'TERMINEE') return 'success';
    return 'danger';
  }
  getStatusIcon(s: string) {
    if(['PREREQUIS_VALIDES', 'JURY_PROPOSE'].includes(s)) return 'bi-exclamation-circle-fill';
    if(s === 'PLANIFIEE') return 'bi-calendar-event';
    if(s === 'TERMINEE') return 'bi-check-circle-fill';
    return 'bi-hourglass';
  }
  formatStatus(s: string) {
    const map: any = { 'SOUMIS': 'En examen (Dir)', 'PREREQUIS_VALIDES': 'À Autoriser', 'AUTORISEE': 'Attente Jury', 'JURY_PROPOSE': 'Jury à valider', 'PLANIFIEE': 'Planifiée', 'TERMINEE': 'Terminée' };
    return map[s] || s;
  }
  canAdminAct(s: string) { return ['PREREQUIS_VALIDES', 'JURY_PROPOSE', 'PLANIFIEE'].includes(s); }

  // Details Modal
  openDetails(s: any) {
    this.selectedSoutenance.set(s);
    // Reset forms
    this.planning = { date: '', heure: '', lieu: '' };
    this.resultat = { mention: '' };
  }
  closeDetails() { this.selectedSoutenance.set(null); }

  getStep(s: any): number {
    const steps = ['SOUMIS', 'PREREQUIS_VALIDES', 'AUTORISEE', 'JURY_PROPOSE', 'PLANIFIEE', 'TERMINEE'];
    return steps.indexOf(s.statut) + 1;
  }
  getStepClass(s: any, step: number) {
    const current = this.getStep(s);
    if(current > step) return 'completed';
    if(current === step) return 'current';
    return '';
  }

  // Actions
  autoriser(id: number) {
    if(!confirm('Confirmer l\'autorisation de soutenance ?')) return;
    this.soutenanceService.autoriserSoutenanceAdmin(id).subscribe({
      next: () => { this.showToast('Soutenance autorisée', 'success'); this.loadData(); this.closeDetails(); },
      error: () => this.showToast('Erreur', 'error')
    });
  }

  planifier(id: number) {
    if(!this.isPlanningValid()) return;
    this.soutenanceService.validerJuryEtPlanifier(id, this.planning).subscribe({
      next: () => { this.showToast('Soutenance planifiée', 'success'); this.loadData(); this.closeDetails(); },
      error: () => this.showToast('Erreur', 'error')
    });
  }
  isPlanningValid() { return this.planning.date && this.planning.heure && this.planning.lieu; }

  cloturer(id: number) {
    if(!this.resultat.mention) return;
    this.soutenanceService.cloturerSoutenance(id, this.resultat.mention).subscribe({
      next: () => { this.showToast('Soutenance terminée !', 'success'); this.loadData(); this.closeDetails(); },
      error: () => this.showToast('Erreur', 'error')
    });
  }

  rejeter(id: number) {
    const motif = prompt('Motif du rejet :');
    if(motif) {
      // Implémenter le service de rejet si nécessaire
      alert('Rejet non implémenté dans cet exemple');
    }
  }

  showToast(msg: string, type: 'success' | 'error') {
    this.toast.set({ show: true, message: msg, type });
    setTimeout(() => this.toast.set({ show: false, message: '', type: 'success' }), 3000);
  }
}