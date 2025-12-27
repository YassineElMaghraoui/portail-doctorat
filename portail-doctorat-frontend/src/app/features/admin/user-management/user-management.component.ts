import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService } from '@core/services/user.service';
import { User } from '@core/models/user.model';
import { MainLayoutComponent } from '@shared/components/main-layout/main-layout.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, RouterLink, MainLayoutComponent, FormsModule],
  template: `
    <app-main-layout>
      <div class="page-container">

        <!-- Hero Header -->
        <div class="hero-section">
          <div class="hero-content">
            <div class="hero-icon"><i class="bi bi-people-fill"></i></div>
            <div>
              <h1 class="hero-title">Gestion des Utilisateurs</h1>
              <p class="hero-subtitle">Gérez les candidatures, directeurs et doctorants</p>
            </div>
          </div>
          <button class="btn-refresh" (click)="loadData()" [disabled]="isLoading()">
            @if (isLoading()) {
              <span class="spinner"></span>
            } @else {
              <i class="bi bi-arrow-clockwise"></i>
            }
            Actualiser
          </button>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card orange">
            <div class="stat-icon"><i class="bi bi-person-lines-fill"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ candidats().length }}</span>
              <span class="stat-label">Candidatures</span>
            </div>
          </div>
          <div class="stat-card blue">
            <div class="stat-icon"><i class="bi bi-person-video3"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ directeurs().length }}</span>
              <span class="stat-label">Directeurs</span>
            </div>
          </div>
          <div class="stat-card green">
            <div class="stat-icon"><i class="bi bi-mortarboard-fill"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ doctorants().length }}</span>
              <span class="stat-label">Doctorants</span>
            </div>
          </div>
          <div class="stat-card purple">
            <div class="stat-icon"><i class="bi bi-people"></i></div>
            <div class="stat-info">
              <span class="stat-value">{{ candidats().length + directeurs().length + doctorants().length }}</span>
              <span class="stat-label">Total</span>
            </div>
          </div>
        </div>

        <!-- Tabs Switcher -->
        <div class="tabs-container">
          <div class="tabs">
            <button class="tab-btn" [class.active]="activeTab === 'CANDIDATS'" (click)="setTab('CANDIDATS')">
              <i class="bi bi-person-lines-fill"></i>
              Candidatures
              @if (candidats().length > 0) {
                <span class="tab-badge">{{ candidats().length }}</span>
              }
            </button>
            <button class="tab-btn" [class.active]="activeTab === 'DIRECTEURS'" (click)="setTab('DIRECTEURS')">
              <i class="bi bi-person-video3"></i>
              Directeurs
            </button>
            <button class="tab-btn" [class.active]="activeTab === 'DOCTORANTS'" (click)="setTab('DOCTORANTS')">
              <i class="bi bi-mortarboard-fill"></i>
              Doctorants
            </button>
          </div>
        </div>

        <!-- TAB: CANDIDATS -->
        @if (activeTab === 'CANDIDATS') {
          <div class="section-card">
            @if (candidats().length === 0) {
              <div class="empty-state">
                <div class="empty-icon"><i class="bi bi-inbox"></i></div>
                <h3>Aucune candidature en attente</h3>
                <p>Toutes les candidatures ont été traitées.</p>
              </div>
            } @else {
              <div class="table-container">
                <table class="data-table">
                  <thead>
                  <tr>
                    <th>Candidat</th>
                    <th>Contact</th>
                    <th>Date</th>
                    <th>État</th>
                    <th></th>
                  </tr>
                  </thead>
                  <tbody>
                    @for (user of candidats(); track user.id) {
                      <tr [class.expanded]="expandedUserId() === user.id" (click)="toggleExpand(user.id)">
                        <td>
                          <div class="user-cell">
                            <div class="user-avatar">{{ user.nom.charAt(0) }}</div>
                            <div class="user-info">
                              <span class="user-name">{{ user.nom }} {{ user.prenom }}</span>
                              <span class="user-id">Mat: {{ user.username }}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div class="contact-cell">
                            <span>{{ user.email }}</span>
                            <span class="contact-phone">{{ user.telephone || 'Non renseigné' }}</span>
                          </div>
                        </td>
                        <td>
                          <span class="date-badge"><i class="bi bi-calendar3"></i>{{ user.createdAt | date:'dd/MM/yyyy' }}</span>
                        </td>
                        <td>
                          <span class="status-badge" [ngClass]="getEtatBadgeClass(user.etat)">{{ formatEtat(user.etat) }}</span>
                        </td>
                        <td>
                          <i class="bi bi-chevron-down expand-icon" [class.rotated]="expandedUserId() === user.id"></i>
                        </td>
                      </tr>

                      @if (expandedUserId() === user.id) {
                        <tr class="details-row">
                          <td colspan="5">
                            <div class="details-panel">
                              <div class="details-grid">
                                <!-- Infos -->
                                <div class="detail-card">
                                  <h4><i class="bi bi-person-badge"></i>Informations</h4>
                                  <div class="info-list">
                                    <div class="info-item"><span class="label">Matricule</span><span class="value">{{ user.username }}</span></div>
                                    <div class="info-item"><span class="label">Email</span><span class="value">{{ user.email }}</span></div>
                                    <div class="info-item"><span class="label">Téléphone</span><span class="value">{{ user.telephone || 'Non renseigné' }}</span></div>
                                  </div>
                                </div>

                                <!-- Documents -->
                                <div class="detail-card">
                                  <h4><i class="bi bi-folder2-open"></i>Documents</h4>
                                  <div class="docs-list">
                                    <div class="doc-item" [class.available]="user.cv" (click)="viewDocument(user.cv, $event)">
                                      <div class="doc-icon cv"><i class="bi bi-file-earmark-person"></i></div>
                                      <span>CV</span>
                                      <i class="bi status-icon" [ngClass]="user.cv ? 'bi-check-circle-fill text-success' : 'bi-x-circle text-muted'"></i>
                                    </div>
                                    <div class="doc-item" [class.available]="user.diplome" (click)="viewDocument(user.diplome, $event)">
                                      <div class="doc-icon diplome"><i class="bi bi-mortarboard"></i></div>
                                      <span>Diplôme</span>
                                      <i class="bi status-icon" [ngClass]="user.diplome ? 'bi-check-circle-fill text-success' : 'bi-x-circle text-muted'"></i>
                                    </div>
                                    <div class="doc-item" [class.available]="user.lettreMotivation" (click)="viewDocument(user.lettreMotivation, $event)">
                                      <div class="doc-icon lettre"><i class="bi bi-envelope-paper"></i></div>
                                      <span>Lettre</span>
                                      <i class="bi status-icon" [ngClass]="user.lettreMotivation ? 'bi-check-circle-fill text-success' : 'bi-x-circle text-muted'"></i>
                                    </div>
                                  </div>
                                </div>

                                <!-- Actions -->
                                <div class="detail-card actions-card">
                                  <h4><i class="bi bi-lightning"></i>Actions</h4>
                                  @if (showRefusalInputId() !== user.id) {
                                    <div class="actions-buttons">
                                      <button class="btn-validate" (click)="openDirectorModal(user, $event)">
                                        <i class="bi bi-check-lg"></i>Valider & Assigner
                                      </button>
                                      <button class="btn-reject" (click)="initiateRefusal(user.id, $event)">
                                        <i class="bi bi-x-lg"></i>Refuser
                                      </button>
                                    </div>
                                  } @else {
                                    <div class="refusal-form">
                                      <textarea [(ngModel)]="motifText" placeholder="Motif du refus..." rows="3"></textarea>
                                      <div class="refusal-actions">
                                        <button class="btn-cancel-sm" (click)="cancelRefusal($event)">Annuler</button>
                                        <button class="btn-confirm-sm" [disabled]="!motifText.trim()" (click)="confirmRefusal(user, $event)">Confirmer</button>
                                      </div>
                                    </div>
                                  }
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      }
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        }

        <!-- TAB: DIRECTEURS -->
        @if (activeTab === 'DIRECTEURS') {
          <div class="section-card">
            <div class="section-header">
              <h3><i class="bi bi-person-video3"></i>Liste des Directeurs</h3>
              <a routerLink="/admin/users/new-director" class="btn-add">
                <i class="bi bi-plus-lg"></i>Ajouter
              </a>
            </div>
            @if (directeurs().length === 0) {
              <div class="empty-state">
                <div class="empty-icon"><i class="bi bi-person-video3"></i></div>
                <h3>Aucun directeur enregistré</h3>
                <p>Ajoutez des directeurs de thèse pour commencer.</p>
              </div>
            } @else {
              <div class="table-container">
                <table class="data-table">
                  <thead>
                  <tr>
                    <th>Directeur</th>
                    <th>Email</th>
                    <th>Téléphone</th>
                    <th>Doctorants</th>
                    <th>ID</th>
                  </tr>
                  </thead>
                  <tbody>
                    @for (dir of directeurs(); track dir.id) {
                      <tr>
                        <td>
                          <div class="user-cell">
                            <div class="user-avatar blue">{{ dir.nom?.charAt(0) }}{{ dir.prenom?.charAt(0) }}</div>
                            <span class="user-name">{{ dir.nom }} {{ dir.prenom }}</span>
                          </div>
                        </td>
                        <td>{{ dir.email }}</td>
                        <td>{{ dir.telephone || '-' }}</td>
                        <td><span class="count-badge">{{ getDoctorantsCountForDirecteur(dir.id) }}</span></td>
                        <td><span class="id-badge">#{{ dir.id }}</span></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        }

        <!-- TAB: DOCTORANTS -->
        @if (activeTab === 'DOCTORANTS') {
          <div class="section-card">
            <div class="section-header">
              <h3><i class="bi bi-mortarboard-fill"></i>Liste des Doctorants</h3>
            </div>
            @if (doctorants().length === 0) {
              <div class="empty-state">
                <div class="empty-icon"><i class="bi bi-mortarboard"></i></div>
                <h3>Aucun doctorant inscrit</h3>
                <p>Les doctorants apparaîtront ici après validation de leur candidature.</p>
              </div>
            } @else {
              <div class="table-container">
                <table class="data-table">
                  <thead>
                  <tr>
                    <th>Doctorant</th>
                    <th>Matricule</th>
                    <th>Directeur</th>
                    <th>Année</th>
                    <th>Statut</th>
                  </tr>
                  </thead>
                  <tbody>
                    @for (doc of doctorants(); track doc.id) {
                      <tr>
                        <td>
                          <div class="user-cell">
                            <div class="user-avatar green">{{ doc.nom?.charAt(0) }}{{ doc.prenom?.charAt(0) }}</div>
                            <div class="user-info">
                              <span class="user-name">{{ doc.nom }} {{ doc.prenom }}</span>
                              <span class="user-email">{{ doc.email }}</span>
                            </div>
                          </div>
                        </td>
                        <td><span class="matricule-badge">{{ doc.username }}</span></td>
                        <td><span class="director-name">{{ getDirecteurName(doc.directeurId) }}</span></td>
                        <td><span class="year-badge">{{ doc.anneeThese || 1 }}{{ (doc.anneeThese || 1) === 1 ? 'ère' : 'ème' }}</span></td>
                        <td><span class="status-badge success">ACTIF</span></td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        }

      </div>

      <!-- Modal: Sélection Directeur -->
      @if (showDirectorModal()) {
        <div class="modal-overlay" (click)="closeDirectorModal()"></div>
        <div class="modal-container">
          <div class="modal-header">
            <div class="modal-icon"><i class="bi bi-person-check"></i></div>
            <div>
              <h3>Assigner un Directeur</h3>
              <p>Pour {{ selectedCandidat()?.nom }} {{ selectedCandidat()?.prenom }}</p>
            </div>
            <button class="modal-close" (click)="closeDirectorModal()"><i class="bi bi-x-lg"></i></button>
          </div>

          <div class="modal-body">
            <div class="search-box">
              <i class="bi bi-search"></i>
              <input type="text" [(ngModel)]="searchDirecteur" placeholder="Rechercher un directeur...">
            </div>

            <div class="directors-list">
              @for (dir of filteredDirecteurs(); track dir.id) {
                <div class="director-card" [class.selected]="selectedDirecteurId() === dir.id" (click)="selectDirecteur(dir.id)">
                  <div class="director-avatar">{{ dir.nom?.charAt(0) }}{{ dir.prenom?.charAt(0) }}</div>
                  <div class="director-info">
                    <span class="director-name">{{ dir.nom }} {{ dir.prenom }}</span>
                    <span class="director-email">{{ dir.email }}</span>
                    <span class="director-count"><i class="bi bi-people"></i>{{ getDoctorantsCountForDirecteur(dir.id) }} doctorant(s)</span>
                  </div>
                  @if (selectedDirecteurId() === dir.id) {
                    <i class="bi bi-check-circle-fill selected-icon"></i>
                  }
                </div>
              }
              @if (filteredDirecteurs().length === 0) {
                <div class="no-results"><i class="bi bi-search"></i><p>Aucun directeur trouvé</p></div>
              }
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-modal-cancel" (click)="closeDirectorModal()">Annuler</button>
            <button class="btn-modal-confirm" [disabled]="!selectedDirecteurId() || isValidating()" (click)="confirmValidationWithDirector()">
              @if (isValidating()) {
                <span class="spinner-sm"></span>Validation...
              } @else {
                <i class="bi bi-check-lg"></i>Valider
              }
            </button>
          </div>
        </div>
      }

    </app-main-layout>
  `,
  styles: [`
    .page-container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem 3rem; }

    /* Hero */
    .hero-section { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); border-radius: 24px; padding: 2rem; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; }
    .hero-content { display: flex; align-items: center; gap: 1.25rem; color: white; }
    .hero-icon { width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; }
    .hero-title { margin: 0; font-size: 1.6rem; font-weight: 800; }
    .hero-subtitle { margin: 0.25rem 0 0; opacity: 0.9; }
    .btn-refresh { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; background: white; color: #4f46e5; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-refresh:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .btn-refresh:disabled { opacity: 0.7; cursor: not-allowed; }
    .spinner { width: 16px; height: 16px; border: 2px solid #e0e7ff; border-top-color: #4f46e5; border-radius: 50%; animation: spin 0.8s linear infinite; }

    /* Stats */
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-card { background: white; border-radius: 16px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04); border: 1px solid #e2e8f0; }
    .stat-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
    .stat-card.orange .stat-icon { background: #fff7ed; color: #ea580c; }
    .stat-card.blue .stat-icon { background: #eff6ff; color: #2563eb; }
    .stat-card.green .stat-icon { background: #ecfdf5; color: #16a34a; }
    .stat-card.purple .stat-icon { background: #f3e8ff; color: #9333ea; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: #1e293b; display: block; }
    .stat-label { font-size: 0.8rem; color: #64748b; }

    /* Tabs */
    .tabs-container { display: flex; justify-content: center; margin-bottom: 1.5rem; }
    .tabs { background: #f1f5f9; padding: 5px; border-radius: 50px; display: inline-flex; gap: 5px; }
    .tab-btn { border: none; background: transparent; padding: 0.75rem 1.5rem; border-radius: 40px; font-weight: 600; color: #64748b; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; transition: all 0.2s; }
    .tab-btn:hover { color: #334155; }
    .tab-btn.active { background: white; color: #4f46e5; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .tab-badge { background: #ef4444; color: white; padding: 0.15rem 0.5rem; border-radius: 50px; font-size: 0.75rem; }

    /* Section Card */
    .section-card { background: white; border-radius: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; overflow: hidden; }
    .section-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid #e2e8f0; }
    .section-header h3 { margin: 0; font-size: 1rem; font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 0.5rem; }
    .section-header h3 i { color: #6366f1; }
    .btn-add { display: flex; align-items: center; gap: 0.35rem; padding: 0.5rem 1rem; background: #6366f1; color: white; border-radius: 8px; font-size: 0.85rem; font-weight: 600; text-decoration: none; transition: all 0.2s; }
    .btn-add:hover { background: #4f46e5; }

    /* Table */
    .table-container { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th { padding: 1rem 1.25rem; text-align: left; font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
    .data-table td { padding: 1rem 1.25rem; border-bottom: 1px solid #f1f5f9; }
    .data-table tbody tr { cursor: pointer; transition: background 0.2s; }
    .data-table tbody tr:hover { background: #f8fafc; }
    .data-table tbody tr.expanded { background: #eef2ff; border-left: 3px solid #6366f1; }

    /* User Cell */
    .user-cell { display: flex; align-items: center; gap: 0.75rem; }
    .user-avatar { width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; }
    .user-avatar.blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
    .user-avatar.green { background: linear-gradient(135deg, #22c55e, #16a34a); }
    .user-info { display: flex; flex-direction: column; }
    .user-name { font-weight: 600; color: #1e293b; }
    .user-id, .user-email { font-size: 0.8rem; color: #64748b; }

    /* Contact Cell */
    .contact-cell { display: flex; flex-direction: column; }
    .contact-phone { font-size: 0.8rem; color: #64748b; }

    /* Badges */
    .date-badge { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.75rem; background: #f1f5f9; border-radius: 6px; font-size: 0.8rem; color: #475569; }
    .status-badge { padding: 0.35rem 0.75rem; border-radius: 50px; font-size: 0.75rem; font-weight: 600; }
    .status-badge.warning { background: #fef3c7; color: #b45309; }
    .status-badge.success { background: #dcfce7; color: #15803d; }
    .status-badge.info { background: #dbeafe; color: #1d4ed8; }
    .status-badge.danger { background: #fee2e2; color: #dc2626; }
    .count-badge { background: #e0e7ff; color: #4338ca; padding: 0.25rem 0.6rem; border-radius: 50px; font-size: 0.8rem; font-weight: 600; }
    .id-badge { color: #94a3b8; font-size: 0.85rem; }
    .matricule-badge { background: #f1f5f9; padding: 0.3rem 0.6rem; border-radius: 6px; font-family: monospace; font-size: 0.85rem; }
    .year-badge { background: #dbeafe; color: #1d4ed8; padding: 0.25rem 0.6rem; border-radius: 50px; font-size: 0.8rem; font-weight: 600; }
    .director-name { color: #4f46e5; font-weight: 500; }

    /* Expand Icon */
    .expand-icon { color: #94a3b8; transition: transform 0.3s; }
    .expand-icon.rotated { transform: rotate(180deg); }

    /* Details Panel */
    .details-row { background: #f8fafc; }
    .details-row td { padding: 0 !important; border: none !important; }
    .details-panel { padding: 1.5rem; animation: slideDown 0.3s ease-out; }
    .details-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .detail-card { background: white; padding: 1.25rem; border-radius: 14px; border: 1px solid #e2e8f0; }
    .detail-card h4 { margin: 0 0 1rem; font-size: 0.85rem; font-weight: 700; color: #6366f1; display: flex; align-items: center; gap: 0.5rem; }
    .info-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .info-item { display: flex; flex-direction: column; }
    .info-item .label { font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; }
    .info-item .value { font-size: 0.9rem; color: #1e293b; font-weight: 500; }

    /* Docs */
    .docs-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .doc-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: #f8fafc; border-radius: 10px; cursor: pointer; transition: all 0.2s; }
    .doc-item:hover { background: #f1f5f9; }
    .doc-item.available:hover { background: #eef2ff; }
    .doc-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1rem; }
    .doc-icon.cv { background: #f3e8ff; color: #9333ea; }
    .doc-icon.diplome { background: #dbeafe; color: #2563eb; }
    .doc-icon.lettre { background: #ffedd5; color: #ea580c; }
    .doc-item span { flex: 1; font-size: 0.85rem; font-weight: 500; }
    .status-icon { font-size: 1rem; }
    .text-success { color: #22c55e; }
    .text-muted { color: #cbd5e1; }

    /* Actions */
    .actions-card { border-color: #c7d2fe; background: linear-gradient(135deg, #f5f3ff, #eef2ff); }
    .actions-buttons { display: flex; flex-direction: column; gap: 0.75rem; }
    .btn-validate { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-validate:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(34,197,94,0.3); }
    .btn-reject { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem; background: white; color: #dc2626; border: 2px solid #fecaca; border-radius: 10px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
    .btn-reject:hover { background: #fef2f2; border-color: #f87171; }

    /* Refusal Form */
    .refusal-form textarea { width: 100%; padding: 0.75rem; border: 2px solid #fecaca; border-radius: 10px; resize: none; font-size: 0.9rem; margin-bottom: 0.75rem; }
    .refusal-form textarea:focus { outline: none; border-color: #f87171; }
    .refusal-actions { display: flex; gap: 0.5rem; }
    .btn-cancel-sm { flex: 1; padding: 0.5rem; background: #f1f5f9; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-confirm-sm { flex: 1; padding: 0.5rem; background: #dc2626; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-confirm-sm:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Empty State */
    .empty-state { padding: 4rem 2rem; text-align: center; }
    .empty-icon { width: 80px; height: 80px; background: #f1f5f9; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; }
    .empty-icon i { font-size: 2rem; color: #94a3b8; }
    .empty-state h3 { margin: 0 0 0.5rem; font-size: 1.1rem; color: #1e293b; }
    .empty-state p { margin: 0; color: #64748b; }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 1000; }
    .modal-container { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 100%; max-width: 500px; background: white; border-radius: 24px; box-shadow: 0 25px 50px rgba(0,0,0,0.25); z-index: 1001; overflow: hidden; animation: modalIn 0.3s ease-out; }
    .modal-header { display: flex; align-items: center; gap: 1rem; padding: 1.5rem; background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; position: relative; }
    .modal-icon { width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
    .modal-header h3 { margin: 0; font-size: 1.15rem; font-weight: 700; }
    .modal-header p { margin: 0.25rem 0 0; font-size: 0.9rem; opacity: 0.9; }
    .modal-close { position: absolute; top: 1rem; right: 1rem; width: 36px; height: 36px; background: rgba(255,255,255,0.2); border: none; border-radius: 50%; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
    .modal-close:hover { background: rgba(255,255,255,0.3); }
    .modal-body { padding: 1.5rem; max-height: 350px; overflow-y: auto; }
    .search-box { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; background: #f1f5f9; border-radius: 12px; margin-bottom: 1rem; }
    .search-box i { color: #94a3b8; }
    .search-box input { flex: 1; border: none; background: transparent; font-size: 0.95rem; outline: none; }
    .directors-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .director-card { display: flex; align-items: center; gap: 1rem; padding: 1rem; background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 14px; cursor: pointer; transition: all 0.2s; }
    .director-card:hover { border-color: #a5b4fc; background: #f5f3ff; }
    .director-card.selected { border-color: #6366f1; background: #eef2ff; }
    .director-avatar { width: 48px; height: 48px; background: linear-gradient(135deg, #6366f1, #4f46e5); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; }
    .director-info { flex: 1; display: flex; flex-direction: column; }
    .director-info .director-name { font-weight: 700; color: #1e293b; }
    .director-info .director-email { font-size: 0.85rem; color: #64748b; }
    .director-info .director-count { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; color: #6366f1; background: #e0e7ff; padding: 0.2rem 0.5rem; border-radius: 50px; width: fit-content; margin-top: 0.35rem; }
    .selected-icon { color: #22c55e; font-size: 1.5rem; }
    .no-results { text-align: center; padding: 2rem; color: #94a3b8; }
    .no-results i { font-size: 2rem; display: block; margin-bottom: 0.5rem; }
    .modal-footer { display: flex; gap: 1rem; padding: 1.25rem 1.5rem; background: #f8fafc; border-top: 1px solid #e2e8f0; }
    .btn-modal-cancel { flex: 1; padding: 0.875rem; background: white; border: 2px solid #e2e8f0; border-radius: 12px; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.2s; }
    .btn-modal-cancel:hover { background: #f1f5f9; }
    .btn-modal-confirm { flex: 2; padding: 0.875rem; background: linear-gradient(135deg, #22c55e, #16a34a); border: none; border-radius: 12px; font-weight: 600; color: white; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: all 0.2s; }
    .btn-modal-confirm:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(34,197,94,0.3); }
    .btn-modal-confirm:disabled { opacity: 0.6; cursor: not-allowed; }
    .spinner-sm { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }

    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes modalIn { from { opacity: 0; transform: translate(-50%, -48%); } to { opacity: 1; transform: translate(-50%, -50%); } }

    @media (max-width: 992px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .details-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 768px) {
      .hero-section { flex-direction: column; gap: 1.5rem; text-align: center; }
      .hero-content { flex-direction: column; }
      .stats-grid { grid-template-columns: 1fr 1fr; }
      .tabs { flex-wrap: wrap; justify-content: center; }
    }
  `]
})
export class UserManagementComponent implements OnInit {
  activeTab = 'CANDIDATS';
  candidats = signal<User[]>([]);
  directeurs = signal<User[]>([]);
  doctorants = signal<User[]>([]);
  isLoading = signal(false);
  expandedUserId = signal<number | null>(null);
  showRefusalInputId = signal<number | null>(null);
  motifText = '';

  showDirectorModal = signal(false);
  selectedCandidat = signal<User | null>(null);
  selectedDirecteurId = signal<number | null>(null);
  searchDirecteur = '';
  isValidating = signal(false);

  constructor(private userService: UserService) {}

  ngOnInit() { this.loadData(); }

  setTab(tab: string) {
    this.activeTab = tab;
    this.expandedUserId.set(null);
    this.showRefusalInputId.set(null);
    this.motifText = '';
  }

  loadData() {
    this.isLoading.set(true);
    this.userService.getUsersByRole('CANDIDAT').subscribe({
      next: users => this.candidats.set(users.filter(u => !u.etat || u.etat === 'EN_ATTENTE_ADMIN')),
      error: console.error
    });
    this.userService.getUsersByRole('DIRECTEUR_THESE').subscribe({
      next: users => this.directeurs.set(users),
      error: console.error
    });
    this.userService.getUsersByRole('DOCTORANT').subscribe({
      next: users => { this.doctorants.set(users); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  toggleExpand(id: number) {
    if (this.expandedUserId() === id) {
      this.expandedUserId.set(null);
      this.showRefusalInputId.set(null);
    } else {
      this.expandedUserId.set(id);
      this.showRefusalInputId.set(null);
    }
    this.motifText = '';
  }

  viewDocument(filename: string | undefined, event: Event) {
    event.stopPropagation();
    if (filename) window.open(this.userService.getDocumentUrl(filename), '_blank');
  }

  openDirectorModal(user: User, event: Event) {
    event.stopPropagation();
    this.selectedCandidat.set(user);
    this.selectedDirecteurId.set(null);
    this.searchDirecteur = '';
    this.showDirectorModal.set(true);
  }

  closeDirectorModal() {
    this.showDirectorModal.set(false);
    this.selectedCandidat.set(null);
    this.selectedDirecteurId.set(null);
  }

  selectDirecteur(id: number) { this.selectedDirecteurId.set(id); }

  filteredDirecteurs(): User[] {
    const s = this.searchDirecteur.toLowerCase().trim();
    if (!s) return this.directeurs();
    return this.directeurs().filter(d => d.nom?.toLowerCase().includes(s) || d.prenom?.toLowerCase().includes(s) || d.email?.toLowerCase().includes(s));
  }

  confirmValidationWithDirector() {
    const candidat = this.selectedCandidat();
    const directeurId = this.selectedDirecteurId();
    if (!candidat || !directeurId) return;
    this.isValidating.set(true);
    this.userService.validerCandidatureAdminAvecDirecteur(candidat.id, directeurId).subscribe({
      next: () => { this.isValidating.set(false); this.closeDirectorModal(); this.loadData(); this.expandedUserId.set(null); },
      error: (err) => { console.error(err); this.isValidating.set(false); alert('Erreur lors de la validation'); }
    });
  }

  initiateRefusal(id: number, event: Event) {
    event.stopPropagation();
    this.showRefusalInputId.set(id);
    this.motifText = '';
  }

  cancelRefusal(event: Event) {
    event.stopPropagation();
    this.showRefusalInputId.set(null);
    this.motifText = '';
  }

  confirmRefusal(user: User, event: Event) {
    event.stopPropagation();
    if (!this.motifText.trim()) return;
    if (confirm(`Refuser le dossier de ${user.nom} ${user.prenom} ?`)) {
      this.userService.refuserCandidatureAdmin(user.id, this.motifText.trim()).subscribe({
        next: () => { this.loadData(); this.showRefusalInputId.set(null); this.expandedUserId.set(null); },
        error: console.error
      });
    }
  }

  getDirecteurName(directeurId: number | undefined): string {
    if (!directeurId) return 'Non assigné';
    const d = this.directeurs().find(dir => dir.id === directeurId);
    return d ? `${d.nom} ${d.prenom}` : 'Inconnu';
  }

  getDoctorantsCountForDirecteur(directeurId: number): number {
    return this.doctorants().filter(d => d.directeurId === directeurId).length;
  }

  formatEtat(etat: string | undefined): string {
    if (!etat || etat === 'EN_ATTENTE_ADMIN') return 'Nouveau';
    if (etat === 'EN_ATTENTE_DIRECTEUR') return 'Attente Dir.';
    if (etat === 'VALIDE') return 'Validé';
    if (etat === 'REFUSE') return 'Refusé';
    return etat.replace(/_/g, ' ');
  }

  getEtatBadgeClass(etat: string | undefined): string {
    if (etat === 'VALIDE') return 'success';
    if (etat === 'REFUSE') return 'danger';
    if (etat === 'EN_ATTENTE_DIRECTEUR') return 'info';
    return 'warning';
  }
}