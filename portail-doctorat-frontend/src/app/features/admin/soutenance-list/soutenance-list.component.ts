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

        <!-- HERO HEADER -->
        <div class="hero-header">
          <div class="hero-content">
            <div class="hero-icon"><i class="bi bi-mortarboard-fill"></i></div>
            <div>
              <h1 class="hero-title">Administration des Soutenances</h1>
              <p class="hero-subtitle">Supervision, planification et validation finale des thèses</p>
            </div>
          </div>
          <button class="btn-refresh" (click)="loadData()" [disabled]="isLoading()">
            @if (isLoading()) { <span class="spinner-btn"></span> } @else { <i class="bi bi-arrow-clockwise"></i> }
            Actualiser
          </button>
        </div>

        <!-- STATS -->
        <div class="stats-grid">
          <div class="stat-card blue-soft"><div class="stat-icon-wrap"><i class="bi bi-person-workspace"></i></div><div class="stat-info"><span class="stat-value">{{ getCount('SOUMIS') }}</span><span class="stat-label">En examen (Dir.)</span></div></div>
          <div class="stat-card orange"><div class="stat-icon-wrap"><i class="bi bi-shield-check"></i></div><div class="stat-info"><span class="stat-value">{{ getCount('PREREQUIS_VALIDES') }}</span><span class="stat-label">À Autoriser</span></div></div>
          <div class="stat-card purple-soft"><div class="stat-icon-wrap"><i class="bi bi-people"></i></div><div class="stat-info"><span class="stat-value">{{ getCount('AUTORISEE') }}</span><span class="stat-label">Attente Jury</span></div></div>
          <div class="stat-card purple"><div class="stat-icon-wrap"><i class="bi bi-calendar-plus"></i></div><div class="stat-info"><span class="stat-value">{{ getCount('JURY_PROPOSE') }}</span><span class="stat-label">À Planifier</span></div></div>
          <div class="stat-card blue"><div class="stat-icon-wrap"><i class="bi bi-calendar-event"></i></div><div class="stat-info"><span class="stat-value">{{ getCount('PLANIFIEE') }}</span><span class="stat-label">Planifiées</span></div></div>
          <div class="stat-card green"><div class="stat-icon-wrap"><i class="bi bi-trophy-fill"></i></div><div class="stat-info"><span class="stat-value">{{ getCount('TERMINEE') }}</span><span class="stat-label">Terminées</span></div></div>
        </div>

        <!-- TABS -->
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

        <!-- TABLEAU -->
        <div class="section-card">
          <div class="table-container">
            <table class="data-table">
              <thead>
              <tr>
                <th style="width: 30%;">Doctorant</th>
                <th>Directeur</th>
                <th>Sujet</th>
                <th>Date Demande</th>
                <th>Statut</th>
                <th style="width: 50px;"></th>
              </tr>
              </thead>
              <tbody>
                @if (isLoading()) {
                  <tr><td colspan="6" class="loading-cell"><div class="spinner-sm"></div> Chargement...</td></tr>
                }
                @else if (filteredSoutenances().length === 0) {
                  <tr><td colspan="6" class="empty-cell"><div class="empty-content"><i class="bi bi-inbox"></i><p>Aucun dossier dans cette catégorie</p></div></td></tr>
                }
                @else {
                  @for (s of filteredSoutenances(); track s.id) {
                    <!-- LIGNE PRINCIPALE -->
                    <tr class="clickable" [class.expanded-row]="expandedId() === s.id" (click)="toggleExpand(s.id)">
                      <td>
                        <div class="user-cell">
                          <div class="avatar-circle purple">{{ getInitials(s) }}</div>
                          <div class="user-info">
                            <span class="name">{{ getDoctorantName(s) }}</span>
                            <span class="id">Mat: {{ s.doctorantInfo?.username }}</span>
                          </div>
                        </div>
                      </td>
                      <td class="fw-bold text-dark">{{ getDirecteurName(s) }}</td>
                      <td><div class="motif-cell" [title]="s.titreThese">{{ truncate(s.titreThese) }}</div></td>
                      <td><span class="date-badge">{{ s.createdAt | date:'dd/MM/yyyy' }}</span></td>
                      <td><span class="status-badge" [ngClass]="getStatusClass(s.statut)"><i class="bi" [ngClass]="getStatusIcon(s.statut)"></i> {{ formatStatus(s.statut) }}</span></td>
                      <td><i class="bi bi-chevron-down expand-icon" [class.rotated]="expandedId() === s.id"></i></td>
                    </tr>

                    <!-- DETAILS EXPANDÉS -->
                    @if (expandedId() === s.id) {
                      <tr class="details-row">
                        <td colspan="6">
                          <div class="details-panel">

                            <!-- STEPPER -->
                            <div class="workflow-container">
                              <div class="step completed"><div class="step-circle"><i class="bi bi-file-earmark-plus"></i></div><span class="step-label">Dépôt</span></div>
                              <div class="step-line" [class.active]="getStep(s) >= 2"></div>
                              <div class="step" [ngClass]="getStepClass(s, 2)"><div class="step-circle"><i class="bi bi-person-check"></i></div><span class="step-label">Directeur</span></div>
                              <div class="step-line" [class.active]="getStep(s) >= 3"></div>
                              <div class="step" [ngClass]="getStepClass(s, 3)"><div class="step-circle"><i class="bi bi-shield-check"></i></div><span class="step-label">Autorisation</span></div>
                              <div class="step-line" [class.active]="getStep(s) >= 4"></div>
                              <div class="step" [ngClass]="getStepClass(s, 4)"><div class="step-circle"><i class="bi bi-people"></i></div><span class="step-label">Jury</span></div>
                              <div class="step-line" [class.active]="getStep(s) >= 5"></div>
                              <div class="step" [ngClass]="getStepClass(s, 5)"><div class="step-circle"><i class="bi bi-trophy"></i></div><span class="step-label">Soutenance</span></div>
                            </div>

                            <!-- ════════════════════════════════════════════════════════════════ -->
                            <!-- INFOS DOCTORANT (Style carte comme DirectorSoutenanceComponent) -->
                            <!-- ════════════════════════════════════════════════════════════════ -->
                            <div class="doctorant-info-card">
                              <div class="doctorant-header">
                                <div class="doctorant-avatar">{{ getInitials(s) }}</div>
                                <div class="doctorant-main-info">
                                  <h4>{{ getDoctorantName(s) }}</h4>
                                  <span class="doctorant-status">Doctorant</span>
                                </div>
                              </div>
                              <div class="doctorant-details">
                                <div class="info-item">
                                  <i class="bi bi-person-badge"></i>
                                  <div>
                                    <span class="info-label">Matricule</span>
                                    <span class="info-value">{{ s.doctorantInfo?.username || 'Non renseigné' }}</span>
                                  </div>
                                </div>
                                <div class="info-item">
                                  <i class="bi bi-envelope"></i>
                                  <div>
                                    <span class="info-label">Email</span>
                                    <span class="info-value">{{ s.doctorantInfo?.email || 'Non renseigné' }}</span>
                                  </div>
                                </div>
                                <div class="info-item">
                                  <i class="bi bi-telephone"></i>
                                  <div>
                                    <span class="info-label">Téléphone</span>
                                    <span class="info-value">{{ s.doctorantInfo?.telephone || 'Non renseigné' }}</span>
                                  </div>
                                </div>
                                <div class="info-item">
                                  <i class="bi bi-mortarboard"></i>
                                  <div>
                                    <span class="info-label">Année de thèse</span>
                                    <span class="info-value">{{ s.doctorantInfo?.anneeThese || 1 }}ème année</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <!-- ════════════════════════════════════════════════════════════════ -->
                            <!-- INFOS DIRECTEUR -->
                            <!-- ════════════════════════════════════════════════════════════════ -->
                            <div class="directeur-info-card">
                              <div class="directeur-header">
                                <div class="directeur-avatar">{{ getDirecteurInitials(s) }}</div>
                                <div class="directeur-main-info">
                                  <h4>{{ getDirecteurName(s) }}</h4>
                                  <span class="directeur-status">Directeur de Thèse</span>
                                </div>
                              </div>
                              <div class="directeur-details">
                                <div class="info-item">
                                  <i class="bi bi-envelope"></i>
                                  <div>
                                    <span class="info-label">Email</span>
                                    <span class="info-value">{{ s.directeurInfo?.email || 'Non renseigné' }}</span>
                                  </div>
                                </div>
                                <div class="info-item">
                                  <i class="bi bi-building"></i>
                                  <div>
                                    <span class="info-label">Établissement</span>
                                    <span class="info-value">{{ s.directeurInfo?.etablissement || 'ENSET Mohammedia' }}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <!-- ════════════════════════════════════════════════════════════════ -->
                            <!-- SUJET DE THÈSE -->
                            <!-- ════════════════════════════════════════════════════════════════ -->
                            <div class="thesis-box">
                              <h6><i class="bi bi-journal-text"></i> Sujet de Thèse</h6>
                              <p>{{ s.titreThese || 'Sujet non défini' }}</p>
                            </div>

                            <!-- ════════════════════════════════════════════════════════════════ -->
                            <!-- PRÉREQUIS & DOCUMENTS -->
                            <!-- ════════════════════════════════════════════════════════════════ -->
                            <div class="detail-grid-two">
                              <div class="detail-box prerequis">
                                <h6><i class="bi bi-award"></i> État des Prérequis</h6>
                                <div class="prereq-item">
                                  <span class="prereq-label">Publications Q1/Q2</span>
                                  <div class="prereq-progress">
                                    <div class="progress-bar" [style.width.%]="(getPublications(s) / 2) * 100" [class.complete]="getPublications(s) >= 2"></div>
                                  </div>
                                  <span class="prereq-value" [class.ok]="getPublications(s) >= 2">{{ getPublications(s) }}/2</span>
                                </div>
                                <div class="prereq-item">
                                  <span class="prereq-label">Conférences</span>
                                  <div class="prereq-progress">
                                    <div class="progress-bar" [style.width.%]="(getConferences(s) / 2) * 100" [class.complete]="getConferences(s) >= 2"></div>
                                  </div>
                                  <span class="prereq-value" [class.ok]="getConferences(s) >= 2">{{ getConferences(s) }}/2</span>
                                </div>
                                <div class="prereq-item">
                                  <span class="prereq-label">Heures Formation</span>
                                  <div class="prereq-progress">
                                    <div class="progress-bar" [style.width.%]="(getHeuresFormation(s) / 200) * 100" [class.complete]="getHeuresFormation(s) >= 200"></div>
                                  </div>
                                  <span class="prereq-value" [class.ok]="getHeuresFormation(s) >= 200">{{ getHeuresFormation(s) }}/200h</span>
                                </div>
                              </div>

                              <div class="detail-box documents">
                                <h6><i class="bi bi-folder2-open"></i> Documents Soumis</h6>
                                <div class="doc-list">
                                  <a [href]="getDocumentUrl(s.cheminManuscrit)" target="_blank" class="doc-btn" [class.disabled]="!s.cheminManuscrit">
                                    <i class="bi bi-file-earmark-pdf"></i> Manuscrit de Thèse
                                  </a>
                                  <a [href]="getDocumentUrl(s.cheminRapportAntiPlagiat)" target="_blank" class="doc-btn" [class.disabled]="!s.cheminRapportAntiPlagiat">
                                    <i class="bi bi-shield-check"></i> Rapport Anti-Plagiat
                                  </a>
                                  @if (s.cheminAutorisation) {
                                    <a [href]="getDocumentUrl(s.cheminAutorisation)" target="_blank" class="doc-btn">
                                      <i class="bi bi-file-earmark-check"></i> Autorisation
                                    </a>
                                  }
                                </div>
                              </div>
                            </div>

                            <!-- ════════════════════════════════════════════════════════════════ -->
                            <!-- JURY (si présent) -->
                            <!-- ════════════════════════════════════════════════════════════════ -->
                            @if (s.membresJury && s.membresJury.length > 0) {
                              <div class="detail-box jury-box">
                                <h6><i class="bi bi-people-fill"></i> Composition du Jury</h6>
                                <div class="jury-grid-view">
                                  @for (m of getUniqueJuryMembers(s.membresJury); track m.id) {
                                    <div class="jury-member-card" [class]="m.role.toLowerCase()">
                                      <div class="jury-role-badge">{{ formatRole(m.role) }}</div>
                                      <div class="jury-member-name">{{ m.prenom }} {{ m.nom }}</div>
                                      <div class="jury-member-details">
                                        <span><i class="bi bi-building"></i> {{ m.etablissement }}</span>
                                        @if (m.grade) { <span><i class="bi bi-mortarboard"></i> {{ m.grade }}</span> }
                                      </div>
                                      @if (m.email) {
                                        <div class="jury-member-email"><i class="bi bi-envelope"></i> {{ m.email }}</div>
                                      }
                                    </div>
                                  }
                                </div>
                              </div>
                            }

                            <!-- ════════════════════════════════════════════════════════════════ -->
                            <!-- INFOS SOUTENANCE PLANIFIÉE -->
                            <!-- ════════════════════════════════════════════════════════════════ -->
                            @if (s.dateSoutenance || s.lieu || s.heureSoutenance) {
                              <div class="soutenance-info-box">
                                <h6><i class="bi bi-calendar-event"></i> Informations Soutenance</h6>
                                <div class="soutenance-details">
                                  @if (s.dateSoutenance) {
                                    <div class="soutenance-item">
                                      <i class="bi bi-calendar3"></i>
                                      <div>
                                        <span class="label">Date</span>
                                        <span class="value">{{ s.dateSoutenance | date:'EEEE dd MMMM yyyy' }}</span>
                                      </div>
                                    </div>
                                  }
                                  @if (s.heureSoutenance) {
                                    <div class="soutenance-item">
                                      <i class="bi bi-clock"></i>
                                      <div>
                                        <span class="label">Heure</span>
                                        <span class="value">{{ s.heureSoutenance }}</span>
                                      </div>
                                    </div>
                                  }
                                  @if (s.lieu || s.lieuSoutenance) {
                                    <div class="soutenance-item">
                                      <i class="bi bi-geo-alt"></i>
                                      <div>
                                        <span class="label">Lieu</span>
                                        <span class="value">{{ s.lieu || s.lieuSoutenance }}</span>
                                      </div>
                                    </div>
                                  }
                                </div>
                              </div>
                            }

                            <!-- ════════════════════════════════════════════════════════════════ -->
                            <!-- SECTION ACTIONS -->
                            <!-- ════════════════════════════════════════════════════════════════ -->
                            <div class="action-section">

                              <!-- CAS 1: AUTORISATION -->
                              @if (s.statut === 'PREREQUIS_VALIDES') {
                                <div class="admin-action-box">
                                  <h5><i class="bi bi-shield-check"></i> Autorisation de Soutenance</h5>

                                  @if (decisionType() === null) {
                                    <p>Les prérequis ont été validés par le directeur. Confirmez-vous l'autorisation administrative ?</p>
                                    <div class="action-buttons">
                                      <button class="btn-refuse" (click)="initiateRefusal($event)">Refuser</button>
                                      <button class="btn-validate" (click)="autoriser(s.id, $event)">Autoriser</button>
                                    </div>
                                  } @else if (decisionType() === 'reject') {
                                    <div class="decision-form">
                                      <p class="mb-2 fw-bold text-danger">Motif du refus :</p>
                                      <textarea [(ngModel)]="commentaire" class="form-control mb-3" rows="2" placeholder="Expliquez pourquoi..." (click)="$event.stopPropagation()"></textarea>
                                      <div class="d-flex gap-2 justify-content-end">
                                        <button class="btn-cancel" (click)="resetForms($event)">Annuler</button>
                                        <button class="btn-refuse" [disabled]="!commentaire" (click)="confirmRefusal(s.id, $event)">Confirmer Refus</button>
                                      </div>
                                    </div>
                                  }
                                </div>
                              }

                              <!-- CAS 2: PLANIFICATION -->
                              @if (s.statut === 'JURY_PROPOSE') {
                                <div class="admin-action-box">
                                  <h5><i class="bi bi-calendar-plus"></i> Validation Jury & Planification</h5>

                                  @if (decisionType() === null) {
                                    <div class="planning-form">
                                      <div class="form-group"><label>Date</label><input type="date" [(ngModel)]="planning.date" (click)="$event.stopPropagation()"></div>
                                      <div class="form-group"><label>Heure</label><input type="time" [(ngModel)]="planning.heure" (click)="$event.stopPropagation()"></div>
                                      <div class="form-group full"><label>Lieu</label><input type="text" [(ngModel)]="planning.lieu" placeholder="Salle de soutenance" (click)="$event.stopPropagation()"></div>
                                    </div>
                                    <div class="action-buttons mt-3">
                                      <button class="btn-refuse" (click)="initiateRefusal($event)">Refuser Jury</button>
                                      <button class="btn-validate" [disabled]="!isPlanningValid()" (click)="planifier(s.id, $event)">Valider & Planifier</button>
                                    </div>
                                  } @else if (decisionType() === 'reject') {
                                    <div class="decision-form">
                                      <p class="mb-2 fw-bold text-danger">Motif du refus du Jury :</p>
                                      <textarea [(ngModel)]="commentaire" class="form-control mb-3" rows="2" placeholder="Expliquez les raisons..." (click)="$event.stopPropagation()"></textarea>
                                      <div class="d-flex gap-2 justify-content-end">
                                        <button class="btn-cancel" (click)="resetForms($event)">Annuler</button>
                                        <button class="btn-refuse" [disabled]="!commentaire" (click)="confirmRefusal(s.id, $event)">Confirmer Refus</button>
                                      </div>
                                    </div>
                                  }
                                </div>
                              }

                              <!-- CAS 3: CLÔTURE -->
                              @if (s.statut === 'PLANIFIEE') {
                                <div class="admin-action-box final">
                                  <h5><i class="bi bi-trophy"></i> Clôture de la Soutenance</h5>
                                  <div class="planning-form">
                                    <div class="form-group full">
                                      <label>Mention obtenue</label>
                                      <select [(ngModel)]="resultat.mention" (click)="$event.stopPropagation()">
                                        <option value="">-- Sélectionner la mention --</option>
                                        <option value="Honorable">Honorable</option>
                                        <option value="Tres Honorable">Très Honorable</option>
                                        <option value="Tres Honorable avec felicitations">Très Honorable avec Félicitations du Jury</option>
                                      </select>
                                    </div>
                                  </div>
                                  <div class="action-buttons mt-3">
                                    <button class="btn-validate w-100" [disabled]="!resultat.mention" (click)="cloturer(s.id, $event)">
                                      <i class="bi bi-check-circle"></i> Enregistrer le Résultat
                                    </button>
                                  </div>
                                </div>
                              }

                              <!-- ════════════════════════════════════════════════════════════════ -->
                              <!-- RÉSULTAT FINAL (HISTORIQUE - TERMINEE) -->
                              <!-- ════════════════════════════════════════════════════════════════ -->
                              @if (s.statut === 'TERMINEE') {
                                <div class="result-box success">
                                  <div class="result-icon"><i class="bi bi-trophy-fill"></i></div>
                                  <div class="result-content">
                                    <strong>🎉 Soutenance terminée avec succès !</strong>
                                    <p class="mb-0">
                                      Mention obtenue : <span class="mention-badge">{{ s.mention }}</span>
                                    </p>
                                    @if (s.felicitationsJury) {
                                      <span class="felicitations-badge"><i class="bi bi-star-fill"></i> Félicitations du Jury</span>
                                    }
                                    @if (s.noteFinale) {
                                      <p class="note-info">Note finale : {{ s.noteFinale }}/20</p>
                                    }
                                  </div>
                                </div>
                              }

                              <!-- REJETEE -->
                              @if (s.statut === 'REJETEE') {
                                <div class="result-box danger">
                                  <div class="result-icon danger"><i class="bi bi-x-circle-fill"></i></div>
                                  <div class="result-content">
                                    <strong>Demande rejetée</strong>
                                    @if (s.commentaire || s.commentaireAdmin || s.commentaireDirecteur) {
                                      <p class="mb-0 mt-1">Motif : {{ s.commentaire || s.commentaireAdmin || s.commentaireDirecteur }}</p>
                                    }
                                  </div>
                                </div>
                              }

                              <!-- INFO: EN ATTENTE (pas d'action admin) -->
                              @if (s.statut === 'SOUMIS') {
                                <div class="info-box waiting">
                                  <i class="bi bi-hourglass-split text-warning"></i>
                                  <strong>En attente de validation par le directeur de thèse</strong>
                                </div>
                              }

                              @if (s.statut === 'AUTORISEE') {
                                <div class="info-box waiting">
                                  <i class="bi bi-people text-primary"></i>
                                  <strong>En attente de proposition du jury par le directeur</strong>
                                </div>
                              }
                            </div>

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

        <!-- TOAST -->
        @if (toast().show) {
          <div class="toast" [ngClass]="toast().type === 'success' ? 'success' : 'error'">
            <i class="bi" [ngClass]="toast().type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'"></i>
            {{ toast().message }}
          </div>
        }
      </div>
    </app-main-layout>
  `,
  styles: [`
    /* ════════════════════════════════════════════════════════════════ */
    /* GLOBAL LAYOUT */
    /* ════════════════════════════════════════════════════════════════ */
    .page-container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem 3rem; }
    .hero-header { background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); border-radius: 20px; padding: 2rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; color: white; }
    .hero-content { display: flex; gap: 1.25rem; align-items: center; }
    .hero-icon { width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 16px; display: flex; justify-content: center; align-items: center; font-size: 1.75rem; }
    .hero-title { font-size: 1.5rem; font-weight: 800; margin: 0; }
    .hero-subtitle { margin: 0.25rem 0 0; opacity: 0.9; }
    .btn-refresh { padding: 0.75rem 1.25rem; background: white; color: #6d28d9; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; display: flex; gap: 0.5rem; align-items: center; transition: 0.2s; }
    .btn-refresh:hover { transform: translateY(-2px); }

    /* ════════════════════════════════════════════════════════════════ */
    /* STATS */
    /* ════════════════════════════════════════════════════════════════ */
    .stats-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: white; border-radius: 14px; padding: 1rem; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.5rem; border: 1px solid #e2e8f0; }
    .stat-icon-wrap { width: 40px; height: 40px; border-radius: 10px; display: flex; justify-content: center; align-items: center; font-size: 1.1rem; }
    .stat-card.blue-soft .stat-icon-wrap { background: #dbeafe; color: #2563eb; }
    .stat-card.orange .stat-icon-wrap { background: #fef3c7; color: #d97706; }
    .stat-card.purple-soft .stat-icon-wrap { background: #f3e8ff; color: #7c3aed; }
    .stat-card.purple .stat-icon-wrap { background: #7c3aed; color: white; }
    .stat-card.blue .stat-icon-wrap { background: #1d4ed8; color: white; }
    .stat-card.green .stat-icon-wrap { background: #dcfce7; color: #16a34a; }
    .stat-value { font-size: 1.4rem; font-weight: 800; color: #1e293b; display: block; line-height: 1; }
    .stat-label { font-size: 0.7rem; color: #64748b; font-weight: 600; text-transform: uppercase; }

    /* ════════════════════════════════════════════════════════════════ */
    /* TABS */
    /* ════════════════════════════════════════════════════════════════ */
    .tabs-container { display: flex; justify-content: center; margin-bottom: 1.5rem; }
    .tabs { background: #f1f5f9; padding: 5px; border-radius: 50px; display: inline-flex; gap: 5px; flex-wrap: wrap; justify-content: center; }
    .tab-btn { border: none; background: transparent; padding: 0.75rem 1.25rem; border-radius: 40px; font-weight: 600; color: #64748b; cursor: pointer; display: flex; gap: 0.5rem; align-items: center; transition: 0.2s; white-space: nowrap; }
    .tab-btn.active { background: white; color: #7c3aed; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .tab-badge { background: #ef4444; color: white; padding: 0.15rem 0.5rem; border-radius: 50px; font-size: 0.7rem; }
    .tab-badge.info { background: #3b82f6; }

    /* ════════════════════════════════════════════════════════════════ */
    /* TABLE */
    /* ════════════════════════════════════════════════════════════════ */
    .section-card { background: white; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; overflow: hidden; }
    .table-container { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { padding: 1rem 1.25rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
    .data-table td { padding: 1rem 1.25rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
    .data-table tbody tr { transition: background 0.2s; }
    .data-table tbody tr.clickable:hover { background: #f8fafc; cursor: pointer; }
    .data-table tbody tr.expanded-row { background: #eff6ff; border-left: 4px solid #7c3aed; }
    .empty-cell { padding: 3rem; text-align: center; }
    .empty-content { color: #94a3b8; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; }
    .empty-content i { font-size: 2rem; }
    .loading-cell { text-align: center; padding: 2rem; color: #64748b; }

    .user-cell { display: flex; align-items: center; gap: 0.75rem; }
    .avatar-circle { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; display: flex; justify-content: center; align-items: center; font-weight: 700; font-size: 0.9rem; flex-shrink: 0; }
    .user-info { display: flex; flex-direction: column; }
    .user-info .name { font-weight: 700; color: #1e293b; font-size: 0.95rem; }
    .user-info .id { font-size: 0.75rem; color: #64748b; }
    .date-badge { background: #f1f5f9; padding: 0.3rem 0.6rem; border-radius: 6px; font-size: 0.8rem; color: #475569; font-weight: 500; }
    .expand-icon { color: #94a3b8; transition: transform 0.3s; }
    .expand-icon.rotated { transform: rotate(180deg); color: #7c3aed; }

    /* ════════════════════════════════════════════════════════════════ */
    /* STATUS BADGE */
    /* ════════════════════════════════════════════════════════════════ */
    .status-badge { padding: 0.35rem 0.75rem; border-radius: 50px; font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.4rem; white-space: nowrap; }
    .status-badge.pending { background: #fef3c7; color: #b45309; }
    .status-badge.action { background: #fef2f2; color: #dc2626; animation: pulse-red 2s infinite; }
    .status-badge.waiting { background: #e0e7ff; color: #4338ca; }
    .status-badge.scheduled { background: #f3e8ff; color: #7c3aed; }
    .status-badge.success { background: #dcfce7; color: #15803d; }
    .status-badge.danger { background: #fee2e2; color: #991b1b; }

    /* ════════════════════════════════════════════════════════════════ */
    /* DETAILS PANEL */
    /* ════════════════════════════════════════════════════════════════ */
    .details-row td { padding: 0 !important; border: none !important; }
    .details-panel { padding: 2rem; background: #fff; animation: slideDown 0.3s; border-bottom: 1px solid #e2e8f0; }

    /* ════════════════════════════════════════════════════════════════ */
    /* STEPPER */
    /* ════════════════════════════════════════════════════════════════ */
    .workflow-container { display: flex; align-items: center; justify-content: center; margin-bottom: 2rem; padding: 1.5rem; background: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9; overflow-x: auto; }
    .step { display: flex; flex-direction: column; align-items: center; position: relative; z-index: 2; min-width: 80px; text-align: center; }
    .step-circle { width: 36px; height: 36px; border-radius: 50%; background: #e2e8f0; color: #94a3b8; display: flex; align-items: center; justify-content: center; font-size: 1rem; margin-bottom: 0.5rem; border: 3px solid #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
    .step-label { font-size: 0.65rem; font-weight: 600; color: #64748b; }
    .step.completed .step-circle { background: #22c55e; color: white; }
    .step.current .step-circle { background: #7c3aed; color: white; animation: pulse 2s infinite; }
    .step-line { flex: 1; height: 3px; background: #e2e8f0; margin-top: -20px; position: relative; z-index: 1; min-width: 30px; }
    .step-line.active { background: #22c55e; }

    /* ════════════════════════════════════════════════════════════════ */
    /* DOCTORANT INFO CARD */
    /* ════════════════════════════════════════════════════════════════ */
    .doctorant-info-card { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .doctorant-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; padding-bottom: 1rem; border-bottom: 1px solid #e2e8f0; }
    .doctorant-avatar { width: 56px; height: 56px; border-radius: 50%; background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; display: flex; justify-content: center; align-items: center; font-weight: 700; font-size: 1.25rem; flex-shrink: 0; }
    .doctorant-main-info h4 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #1e293b; }
    .doctorant-status { font-size: 0.75rem; color: #7c3aed; font-weight: 600; background: #f3e8ff; padding: 0.2rem 0.6rem; border-radius: 50px; }
    .doctorant-details { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .doctorant-details .info-item { display: flex; align-items: flex-start; gap: 0.75rem; }
    .doctorant-details .info-item i { width: 32px; height: 32px; background: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #7c3aed; font-size: 0.9rem; flex-shrink: 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    .doctorant-details .info-item .info-label { font-size: 0.7rem; color: #64748b; text-transform: uppercase; font-weight: 600; display: block; }
    .doctorant-details .info-item .info-value { font-size: 0.9rem; color: #1e293b; font-weight: 500; }

    /* ════════════════════════════════════════════════════════════════ */
    /* DIRECTEUR INFO CARD */
    /* ════════════════════════════════════════════════════════════════ */
    .directeur-info-card { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 1px solid #bfdbfe; border-radius: 16px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .directeur-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
    .directeur-avatar { width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; display: flex; justify-content: center; align-items: center; font-weight: 700; font-size: 1rem; flex-shrink: 0; }
    .directeur-main-info h4 { margin: 0; font-size: 1rem; font-weight: 700; color: #1e3a5f; }
    .directeur-status { font-size: 0.7rem; color: #1d4ed8; font-weight: 600; background: #bfdbfe; padding: 0.2rem 0.5rem; border-radius: 50px; }
    .directeur-details { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .directeur-details .info-item { display: flex; align-items: flex-start; gap: 0.75rem; }
    .directeur-details .info-item i { width: 28px; height: 28px; background: white; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #2563eb; font-size: 0.8rem; flex-shrink: 0; }
    .directeur-details .info-item .info-label { font-size: 0.65rem; color: #64748b; text-transform: uppercase; font-weight: 600; display: block; }
    .directeur-details .info-item .info-value { font-size: 0.85rem; color: #1e293b; font-weight: 500; }

    /* ════════════════════════════════════════════════════════════════ */
    /* THESIS BOX */
    /* ════════════════════════════════════════════════════════════════ */
    .thesis-box { background: #fefce8; border: 1px solid #fef08a; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; }
    .thesis-box h6 { font-size: 0.8rem; font-weight: 700; color: #854d0e; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.5rem; }
    .thesis-box p { margin: 0; color: #713f12; font-size: 0.95rem; line-height: 1.6; }

    /* ════════════════════════════════════════════════════════════════ */
    /* DETAIL GRID */
    /* ════════════════════════════════════════════════════════════════ */
    .detail-grid-two { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
    .detail-box { background: #f8fafc; padding: 1.25rem; border-radius: 12px; border: 1px solid #e2e8f0; }
    .detail-box h6 { font-size: 0.85rem; font-weight: 700; color: #475569; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }

    /* PREREQUISITES */
    .prereq-item { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
    .prereq-label { font-size: 0.85rem; color: #64748b; width: 120px; flex-shrink: 0; }
    .prereq-progress { flex: 1; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
    .prereq-progress .progress-bar { height: 100%; background: #f59e0b; border-radius: 4px; transition: width 0.3s; }
    .prereq-progress .progress-bar.complete { background: #22c55e; }
    .prereq-value { font-size: 0.85rem; font-weight: 600; color: #64748b; width: 50px; text-align: right; }
    .prereq-value.ok { color: #16a34a; }

    /* DOCUMENTS */
    .doc-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .doc-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; background: white; border: 1px solid #e2e8f0; border-radius: 8px; text-decoration: none; color: #1e293b; font-size: 0.9rem; transition: all 0.2s; }
    .doc-btn:hover:not(.disabled) { border-color: #7c3aed; color: #7c3aed; background: #faf5ff; transform: translateX(4px); }
    .doc-btn.disabled { opacity: 0.5; pointer-events: none; background: #f1f5f9; }
    .doc-btn i { font-size: 1.1rem; }

    /* ════════════════════════════════════════════════════════════════ */
    /* JURY BOX */
    /* ════════════════════════════════════════════════════════════════ */
    .jury-box { margin-bottom: 1.5rem; }
    .jury-grid-view { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .jury-member-card { background: white; padding: 1rem; border-radius: 10px; border: 1px solid #e2e8f0; transition: all 0.2s; }
    .jury-member-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .jury-member-card.president { border-left: 4px solid #d97706; }
    .jury-member-card.rapporteur { border-left: 4px solid #2563eb; }
    .jury-member-card.examinateur { border-left: 4px solid #7c3aed; }
    .jury-role-badge { font-size: 0.65rem; font-weight: 700; text-transform: uppercase; margin-bottom: 0.5rem; padding: 0.15rem 0.5rem; border-radius: 4px; display: inline-block; }
    .jury-member-card.president .jury-role-badge { background: #fef3c7; color: #b45309; }
    .jury-member-card.rapporteur .jury-role-badge { background: #dbeafe; color: #1d4ed8; }
    .jury-member-card.examinateur .jury-role-badge { background: #f3e8ff; color: #6d28d9; }
    .jury-member-name { font-weight: 700; color: #1e293b; font-size: 0.95rem; margin-bottom: 0.25rem; }
    .jury-member-details { font-size: 0.8rem; color: #64748b; display: flex; flex-direction: column; gap: 0.15rem; }
    .jury-member-details span { display: flex; align-items: center; gap: 0.35rem; }
    .jury-member-email { font-size: 0.75rem; color: #94a3b8; margin-top: 0.5rem; display: flex; align-items: center; gap: 0.35rem; }

    /* ════════════════════════════════════════════════════════════════ */
    /* SOUTENANCE INFO BOX */
    /* ════════════════════════════════════════════════════════════════ */
    .soutenance-info-box { background: linear-gradient(135deg, #f3e8ff 0%, #ede9fe 100%); border: 1px solid #c4b5fd; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; }
    .soutenance-info-box h6 { font-size: 0.85rem; font-weight: 700; color: #6d28d9; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
    .soutenance-details { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .soutenance-item { display: flex; align-items: flex-start; gap: 0.75rem; }
    .soutenance-item i { width: 36px; height: 36px; background: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #7c3aed; font-size: 1rem; flex-shrink: 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    .soutenance-item .label { font-size: 0.7rem; color: #64748b; text-transform: uppercase; font-weight: 600; display: block; }
    .soutenance-item .value { font-size: 0.9rem; color: #1e293b; font-weight: 600; }

    /* ════════════════════════════════════════════════════════════════ */
    /* ACTION SECTION */
    /* ════════════════════════════════════════════════════════════════ */
    .action-section { border-top: 1px solid #e2e8f0; padding-top: 1.5rem; margin-top: 0.5rem; }
    .admin-action-box { background: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 1.5rem; }
    .admin-action-box.final { background: #eff6ff; border-color: #bfdbfe; }
    .admin-action-box h5 { margin: 0 0 1rem; color: #9a3412; font-size: 1rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; }
    .admin-action-box.final h5 { color: #1e40af; }
    .admin-action-box p { margin: 0 0 1rem; font-size: 0.9rem; color: #475569; }
    .action-buttons { display: flex; gap: 1rem; justify-content: flex-end; }

    .btn-validate { padding: 0.75rem 1.5rem; border-radius: 8px; background: #22c55e; color: white; border: none; font-weight: 600; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 0.5rem; }
    .btn-validate:hover:not(:disabled) { background: #16a34a; transform: translateY(-1px); }
    .btn-validate:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-refuse { padding: 0.75rem 1.5rem; border-radius: 8px; background: white; color: #dc2626; border: 1px solid #fecaca; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-refuse:hover:not(:disabled) { background: #fef2f2; }
    .btn-refuse:disabled { opacity: 0.6; cursor: not-allowed; }

    .planning-form { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
    .form-group.full { grid-column: 1 / -1; }
    .form-group label { font-size: 0.8rem; font-weight: 600; color: #475569; }
    .form-group input, .form-group select { padding: 0.7rem; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; }
    .form-group input:focus, .form-group select:focus { outline: none; border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1); }

    .decision-form { background: white; padding: 1.25rem; border-radius: 8px; border: 1px solid #fecaca; margin-top: 1rem; }
    .btn-cancel { padding: 0.6rem 1rem; background: white; border: 1px solid #e2e8f0; border-radius: 8px; font-weight: 600; color: #64748b; cursor: pointer; transition: 0.2s; }
    .btn-cancel:hover { background: #f8fafc; }

    /* ════════════════════════════════════════════════════════════════ */
    /* RESULT BOX */
    /* ════════════════════════════════════════════════════════════════ */
    .result-box { display: flex; align-items: center; gap: 1.25rem; padding: 1.5rem; border-radius: 12px; }
    .result-box.success { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #86efac; }
    .result-box.danger { background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 1px solid #fecaca; }
    .result-icon { width: 56px; height: 56px; background: #22c55e; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; flex-shrink: 0; }
    .result-icon.danger { background: #ef4444; }
    .result-content { flex: 1; }
    .result-content strong { color: #166534; display: block; font-size: 1.1rem; margin-bottom: 0.5rem; }
    .result-box.danger .result-content strong { color: #991b1b; }
    .result-content p { color: #166534; font-size: 0.95rem; margin: 0; }
    .result-box.danger .result-content p { color: #7f1d1d; }
    .mention-badge { background: #166534; color: white; padding: 0.3rem 0.75rem; border-radius: 6px; font-weight: 700; font-size: 0.9rem; }
    .felicitations-badge { background: #fef3c7; color: #b45309; padding: 0.3rem 0.75rem; border-radius: 50px; font-size: 0.8rem; font-weight: 600; margin-left: 0.75rem; display: inline-flex; align-items: center; gap: 0.3rem; }
    .note-info { margin-top: 0.5rem !important; font-size: 0.85rem; color: #166534; }

    /* ════════════════════════════════════════════════════════════════ */
    /* INFO BOX */
    /* ════════════════════════════════════════════════════════════════ */
    .info-box { background: #f8fafc; padding: 1rem 1.25rem; border-radius: 10px; border: 1px solid #e2e8f0; color: #334155; display: flex; align-items: center; gap: 0.75rem; }
    .info-box.waiting { background: #fffbeb; border-color: #fcd34d; }
    .info-box i { font-size: 1.25rem; }

    /* ════════════════════════════════════════════════════════════════ */
    /* UTILITIES */
    /* ════════════════════════════════════════════════════════════════ */
    .spinner-btn { width: 16px; height: 16px; border: 2px solid #ddd; border-top-color: #333; border-radius: 50%; animation: spin 1s linear infinite; display: inline-block; }
    .spinner-sm { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #7c3aed; border-radius: 50%; animation: spin 1s linear infinite; display: inline-block; }

    @keyframes spin { 100% { transform: rotate(360deg); } }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes pulse-red { 0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); } 70% { box-shadow: 0 0 0 6px rgba(220, 38, 38, 0); } }
    @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(124, 58, 237, 0); } }

    .toast { position: fixed; bottom: 2rem; right: 2rem; padding: 1rem 1.5rem; border-radius: 10px; color: white; font-weight: 600; z-index: 2000; box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: slideUp 0.3s; display: flex; align-items: center; gap: 0.5rem; }
    .toast.success { background: #22c55e; }
    .toast.error { background: #ef4444; }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    /* ════════════════════════════════════════════════════════════════ */
    /* RESPONSIVE */
    /* ════════════════════════════════════════════════════════════════ */
    @media (max-width: 1024px) {
      .stats-grid { grid-template-columns: repeat(3, 1fr); }
      .jury-grid-view { grid-template-columns: repeat(2, 1fr); }
      .soutenance-details { grid-template-columns: 1fr; }
    }
    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .detail-grid-two { grid-template-columns: 1fr; }
      .planning-form { grid-template-columns: 1fr; }
      .doctorant-details, .directeur-details { grid-template-columns: 1fr; }
      .jury-grid-view { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminSoutenanceComponent implements OnInit {
  soutenances = signal<any[]>([]);
  isLoading = signal(true);
  activeTab = 'A_TRAITER';
  expandedId = signal<number | null>(null);
  toast = signal<{show: boolean, message: string, type: 'success' | 'error'}>({show: false, message: '', type: 'success'});

  // Forms
  planning = { date: '', heure: '', lieu: '' };
  resultat = { mention: '' };
  decisionType = signal<'reject' | null>(null);
  commentaire = '';

  constructor(
      private soutenanceService: SoutenanceService,
      private userService: UserService
  ) {}

  ngOnInit() { this.loadData(); }

  loadData() {
    this.isLoading.set(true);
    this.soutenanceService.getAllSoutenances().subscribe({
      next: (data) => this.enrichData(data),
      error: () => this.isLoading.set(false)
    });
  }

  // --- ENRICHISSEMENT ---
  enrichData(data: any[]) {
    if(data.length === 0) { this.soutenances.set([]); this.isLoading.set(false); return; }

    let loaded = 0;
    data.forEach(s => {
      this.userService.getUserById(s.doctorantId).subscribe({
        next: (doc) => {
          s.doctorantInfo = doc;
          if(doc.directeurId) {
            this.userService.getUserById(doc.directeurId).subscribe(dir => {
              s.directeurInfo = dir;
              if(++loaded === data.length) { this.soutenances.set(data); this.isLoading.set(false); }
            });
          } else {
            if(++loaded === data.length) { this.soutenances.set(data); this.isLoading.set(false); }
          }
        },
        error: () => {
          if(++loaded === data.length) { this.soutenances.set(data); this.isLoading.set(false); }
        }
      });
    });
  }

  // --- FILTRES ---
  setTab(tab: string) {
    this.activeTab = tab;
    this.expandedId.set(null);
    this.resetForms();
  }

  filteredSoutenances() {
    const all = this.soutenances();
    if (this.activeTab === 'A_TRAITER') {
      return all.filter(s => ['PREREQUIS_VALIDES', 'JURY_PROPOSE', 'PLANIFIEE'].includes(s.statut));
    }
    if (this.activeTab === 'CHEZ_DIRECTEUR') {
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

  // --- EXPAND/COLLAPSE ---
  toggleExpand(id: number) {
    if (this.expandedId() === id) {
      this.expandedId.set(null);
      this.resetForms();
    } else {
      this.expandedId.set(id);
      this.resetForms();
      this.planning = { date: '', heure: '', lieu: '' };
      this.resultat = { mention: '' };
    }
  }

  // --- HELPERS ---
  getCount(statut: string) { return this.soutenances().filter(s => s.statut === statut).length; }
  getActionRequiredCount() { return this.soutenances().filter(s => ['PREREQUIS_VALIDES', 'JURY_PROPOSE', 'PLANIFIEE'].includes(s.statut)).length; }
  getDirectorPendingCount() { return this.soutenances().filter(s => ['SOUMIS', 'AUTORISEE'].includes(s.statut)).length; }

  getDoctorantName(s: any) { return s.doctorantInfo ? `${s.doctorantInfo.prenom} ${s.doctorantInfo.nom}` : `Doc #${s.doctorantId}`; }
  getDirecteurName(s: any) { return s.directeurInfo ? `${s.directeurInfo.prenom} ${s.directeurInfo.nom}` : 'Non assigné'; }
  getInitials(s: any) { return s.doctorantInfo ? (s.doctorantInfo.prenom[0] + s.doctorantInfo.nom[0]).toUpperCase() : '?'; }
  getDirecteurInitials(s: any) { return s.directeurInfo ? (s.directeurInfo.prenom[0] + s.directeurInfo.nom[0]).toUpperCase() : '?'; }
  truncate(t: string) { return t?.length > 40 ? t.substr(0, 40) + '...' : t; }

  // PREREQUIS HELPERS
  getPublications(s: any): number { return s.doctorantInfo?.nbPublications || 0; }
  getConferences(s: any): number { return s.doctorantInfo?.nbConferences || 0; }
  getHeuresFormation(s: any): number { return s.doctorantInfo?.heuresFormation || 0; }

  // Document URL
  getDocumentUrl(filename: string): string {
    return this.soutenanceService.getDocumentUrl(filename);
  }

  // Jury helpers
  getUniqueJuryMembers(members: any[]): any[] {
    if (!members) return [];
    const seen = new Map();
    return members.filter(m => {
      const k = `${m.nom}-${m.role}`;
      if (seen.has(k)) return false;
      seen.set(k, true);
      return true;
    });
  }

  formatRole(r: string) {
    const roles: any = { 'PRESIDENT': 'Président', 'RAPPORTEUR': 'Rapporteur', 'EXAMINATEUR': 'Examinateur' };
    return roles[r] || r;
  }

  // Visuals
  getStatusClass(s: string) {
    if(['PREREQUIS_VALIDES', 'JURY_PROPOSE'].includes(s)) return 'action';
    if(['SOUMIS', 'AUTORISEE'].includes(s)) return 'waiting';
    if(s === 'PLANIFIEE') return 'scheduled';
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
    const map: any = { 'SOUMIS': 'En examen (Dir)', 'PREREQUIS_VALIDES': 'À Autoriser', 'AUTORISEE': 'Attente Jury', 'JURY_PROPOSE': 'Jury à valider', 'PLANIFIEE': 'Planifiée', 'TERMINEE': 'Terminée', 'REJETEE': 'Rejetée' };
    return map[s] || s;
  }

  // --- STEPPER ---
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

  // --- FORMS ---
  resetForms(e?: Event) {
    if (e) e.stopPropagation();
    this.decisionType.set(null);
    this.commentaire = '';
  }

  isPlanningValid() { return this.planning.date && this.planning.heure && this.planning.lieu; }

  // --- ACTIONS ---

  // 1. Autorisation
  autoriser(id: number, e: Event) {
    e.stopPropagation();
    if(!confirm('Confirmer l\'autorisation de soutenance ?')) return;
    this.soutenanceService.autoriserSoutenanceAdmin(id).subscribe({
      next: () => { this.showToast('Soutenance autorisée', 'success'); this.loadData(); this.expandedId.set(null); },
      error: () => this.showToast('Erreur', 'error')
    });
  }

  // 2. Planification
  planifier(id: number, e: Event) {
    e.stopPropagation();
    if(!this.isPlanningValid()) return;
    this.soutenanceService.validerJuryEtPlanifier(id, this.planning).subscribe({
      next: () => { this.showToast('Soutenance planifiée', 'success'); this.loadData(); this.expandedId.set(null); },
      error: () => this.showToast('Erreur', 'error')
    });
  }

  // 3. Clôture
  cloturer(id: number, e: Event) {
    e.stopPropagation();
    if(!this.resultat.mention) return;
    this.soutenanceService.cloturerSoutenance(id, this.resultat.mention).subscribe({
      next: () => { this.showToast('Soutenance terminée !', 'success'); this.loadData(); this.expandedId.set(null); },
      error: () => this.showToast('Erreur', 'error')
    });
  }

  // 4. Refus
  initiateRefusal(e: Event) {
    e.stopPropagation();
    this.decisionType.set('reject');
  }

  confirmRefusal(id: number, e: Event) {
    e.stopPropagation();
    if (!this.commentaire) return;

    const s = this.soutenances().find(x => x.id === id);
    if (s?.statut === 'JURY_PROPOSE') {
      this.soutenanceService.refuserJury(id, this.commentaire).subscribe({
        next: () => { this.showToast('Jury refusé', 'success'); this.loadData(); this.expandedId.set(null); },
        error: () => this.showToast('Erreur', 'error')
      });
    } else {
      this.soutenanceService.rejeterSoutenance(id, this.commentaire).subscribe({
        next: () => { this.showToast('Dossier refusé', 'success'); this.loadData(); this.expandedId.set(null); },
        error: () => this.showToast('Erreur', 'error')
      });
    }
  }

  showToast(msg: string, type: 'success' | 'error') {
    this.toast.set({ show: true, message: msg, type });
    setTimeout(() => this.toast.set({ show: false, message: '', type: 'success' }), 3000);
  }
}