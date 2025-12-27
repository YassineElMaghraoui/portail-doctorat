import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '@core/services/user.service';
import { AuthService } from '@core/services/auth.service';
import { User } from '@core/models/user.model';
import { MainLayoutComponent } from '@shared/components/main-layout/main-layout.component';

@Component({
    selector: 'app-director-validation',
    standalone: true,
    imports: [CommonModule, MainLayoutComponent, FormsModule],
    template: `
        <app-main-layout>
            <div class="page-container">

                <!-- Hero Header -->
                <div class="hero-section">
                    <div class="hero-content">
                        <div class="hero-icon">
                            <i class="bi bi-person-check"></i>
                        </div>
                        <div>
                            <h1 class="hero-title">Validation des Candidatures</h1>
                            <p class="hero-subtitle">Candidats qui vous ont été assignés par l'administration</p>
                        </div>
                    </div>
                    <button class="btn-refresh-hero" (click)="loadData()" [disabled]="isLoading()">
                        @if (isLoading()) {
                            <span class="spinner"></span>
                        } @else {
                            <i class="bi bi-arrow-clockwise"></i>
                        }
                        Actualiser
                    </button>
                    <div class="hero-decoration">
                        <div class="decoration-circle c1"></div>
                        <div class="decoration-circle c2"></div>
                    </div>
                </div>

                <!-- Stats -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon pending">
                            <i class="bi bi-hourglass-split"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-value">{{ pendingUsers().length }}</span>
                            <span class="stat-label">En attente</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon info">
                            <i class="bi bi-person-badge"></i>
                        </div>
                        <div class="stat-info">
                            <span class="stat-value">{{ currentDirectorName() }}</span>
                            <span class="stat-label">Connecté en tant que</span>
                        </div>
                    </div>
                </div>

                <!-- Loading -->
                @if (isLoading()) {
                    <div class="loading-state">
                        <div class="loading-spinner"></div>
                        <span>Chargement des candidatures...</span>
                    </div>
                }

                <!-- Empty State -->
                @if (pendingUsers().length === 0 && !isLoading()) {
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i class="bi bi-inbox"></i>
                        </div>
                        <h3 class="empty-title">Aucune candidature en attente</h3>
                        <p class="empty-text">Vous n'avez actuellement aucun candidat assigné en attente de validation.</p>
                    </div>
                }

                <!-- Candidatures List -->
                @if (pendingUsers().length > 0 && !isLoading()) {
                    <div class="list-section">
                        <div class="section-header">
                            <h3 class="section-title">
                                <i class="bi bi-people me-2"></i>
                                Candidats assignés
                            </h3>
                            <span class="count-badge">{{ pendingUsers().length }}</span>
                        </div>

                        <div class="candidates-list">
                            @for (user of pendingUsers(); track user.id) {
                                <div class="candidate-card" [class.expanded]="expandedUserId() === user.id">
                                    <!-- Main Row -->
                                    <div class="card-main" (click)="toggleExpand(user.id)">
                                        <div class="card-left">
                                            <div class="avatar">
                                                {{ user.nom?.charAt(0)?.toUpperCase() || '?' }}
                                            </div>
                                        </div>

                                        <div class="card-content">
                                            <div class="candidate-name">{{ user.nom }} {{ user.prenom }}</div>
                                            <div class="candidate-info">
                                                <span class="info-item">
                                                    <i class="bi bi-envelope"></i>
                                                    {{ user.email }}
                                                </span>
                                                <span class="info-item">
                                                    <i class="bi bi-phone"></i>
                                                    {{ user.telephone || 'Non renseigné' }}
                                                </span>
                                            </div>
                                            <div class="candidate-meta">
                                                <span class="meta-badge matricule">
                                                    <i class="bi bi-hash"></i>
                                                    {{ user.username }}
                                                </span>
                                                <span class="meta-badge status">
                                                    <i class="bi bi-clock-history"></i>
                                                    En attente de votre avis
                                                </span>
                                            </div>
                                        </div>

                                        <div class="card-right">
                                            <i class="bi bi-chevron-down expand-icon" [class.rotated]="expandedUserId() === user.id"></i>
                                        </div>
                                    </div>

                                    <!-- Expanded Details -->
                                    @if (expandedUserId() === user.id) {
                                        <div class="card-details">
                                            <div class="details-grid">
                                                <!-- Documents -->
                                                <div class="detail-section">
                                                    <h5 class="detail-title">
                                                        <i class="bi bi-folder2-open"></i>
                                                        Documents du dossier
                                                    </h5>
                                                    <div class="documents-list">
                                                        <div class="doc-item" [class.available]="user.cv" (click)="viewDocument(user.cv, $event)">
                                                            <div class="doc-icon cv">
                                                                <i class="bi bi-file-earmark-person"></i>
                                                            </div>
                                                            <div class="doc-info">
                                                                <span class="doc-name">Curriculum Vitae</span>
                                                                <span class="doc-status">{{ user.cv ? 'Disponible' : 'Non fourni' }}</span>
                                                            </div>
                                                            @if (user.cv) {
                                                                <i class="bi bi-eye doc-action"></i>
                                                            }
                                                        </div>

                                                        <div class="doc-item" [class.available]="user.diplome" (click)="viewDocument(user.diplome, $event)">
                                                            <div class="doc-icon diploma">
                                                                <i class="bi bi-mortarboard"></i>
                                                            </div>
                                                            <div class="doc-info">
                                                                <span class="doc-name">Diplôme</span>
                                                                <span class="doc-status">{{ user.diplome ? 'Disponible' : 'Non fourni' }}</span>
                                                            </div>
                                                            @if (user.diplome) {
                                                                <i class="bi bi-eye doc-action"></i>
                                                            }
                                                        </div>

                                                        <div class="doc-item" [class.available]="user.lettreMotivation" (click)="viewDocument(user.lettreMotivation, $event)">
                                                            <div class="doc-icon letter">
                                                                <i class="bi bi-envelope-paper"></i>
                                                            </div>
                                                            <div class="doc-info">
                                                                <span class="doc-name">Lettre de motivation</span>
                                                                <span class="doc-status">{{ user.lettreMotivation ? 'Disponible' : 'Non fourni' }}</span>
                                                            </div>
                                                            @if (user.lettreMotivation) {
                                                                <i class="bi bi-eye doc-action"></i>
                                                            }
                                                        </div>
                                                    </div>
                                                </div>

                                                <!-- Decision -->
                                                <div class="detail-section decision">
                                                    <h5 class="detail-title">
                                                        <i class="bi bi-check2-square"></i>
                                                        Votre décision
                                                    </h5>

                                                    @if (showRefusalInputId() !== user.id && showAcceptInputId() !== user.id) {
                                                        <div class="decision-buttons">
                                                            <button class="btn-decision accept" (click)="initiateAccept(user.id, $event)">
                                                                <i class="bi bi-check-lg"></i>
                                                                <span>Accepter et Inscrire</span>
                                                            </button>
                                                            <button class="btn-decision reject" (click)="initiateRefusal(user.id, $event)">
                                                                <i class="bi bi-x-lg"></i>
                                                                <span>Refuser le dossier</span>
                                                            </button>
                                                        </div>
                                                        <p class="decision-hint">
                                                            <i class="bi bi-info-circle"></i>
                                                            En acceptant, vous devrez définir le sujet de thèse du candidat.
                                                        </p>
                                                    } @else if (showAcceptInputId() === user.id) {
                                                        <!-- ✅ FORMULAIRE D'ACCEPTATION AVEC SUJET -->
                                                        <div class="accept-form">
                                                            <label class="accept-label">
                                                                <i class="bi bi-journal-text"></i>
                                                                Sujet / Titre de la thèse <span class="required">*</span>
                                                            </label>
                                                            <textarea
                                                                    class="accept-textarea"
                                                                    rows="4"
                                                                    [(ngModel)]="sujetTheseText"
                                                                    placeholder="Entrez le sujet de thèse complet du doctorant...&#10;&#10;Ex: Étude et développement d'une architecture microservices pour les systèmes de gestion académique">
                                                            </textarea>
                                                            <div class="char-count" [class.warning]="sujetTheseText.length < 20">
                                                                {{ sujetTheseText.length }} caractères (minimum 20 recommandé)
                                                            </div>

                                                            <div class="info-box">
                                                                <i class="bi bi-lightbulb"></i>
                                                                <span>Ce sujet sera enregistré dans le profil du doctorant et utilisé pour sa future soutenance.</span>
                                                            </div>

                                                            <div class="accept-actions">
                                                                <button class="btn-cancel" (click)="cancelAccept($event)">
                                                                    <i class="bi bi-arrow-left"></i>
                                                                    Annuler
                                                                </button>
                                                                <button
                                                                        class="btn-confirm-accept"
                                                                        [disabled]="!sujetTheseText.trim() || sujetTheseText.trim().length < 10 || isValidating()"
                                                                        (click)="confirmerAccept(user, $event)">
                                                                    @if (isValidating()) {
                                                                        <span class="spinner-sm"></span>
                                                                        Validation...
                                                                    } @else {
                                                                        <i class="bi bi-check-circle"></i>
                                                                        Confirmer l'inscription
                                                                    }
                                                                </button>
                                                            </div>
                                                        </div>
                                                    } @else {
                                                        <!-- Formulaire de refus -->
                                                        <div class="refusal-form">
                                                            <label class="refusal-label">
                                                                <i class="bi bi-chat-left-text"></i>
                                                                Motif du refus
                                                            </label>
                                                            <textarea
                                                                    class="refusal-textarea"
                                                                    rows="3"
                                                                    [(ngModel)]="motifText"
                                                                    placeholder="Expliquez la raison du refus (obligatoire)...">
                                                            </textarea>
                                                            <div class="refusal-actions">
                                                                <button class="btn-cancel" (click)="cancelRefusal($event)">
                                                                    <i class="bi bi-arrow-left"></i>
                                                                    Annuler
                                                                </button>
                                                                <button
                                                                        class="btn-confirm-reject"
                                                                        [disabled]="!motifText.trim()"
                                                                        (click)="confirmerRefus(user, $event)">
                                                                    <i class="bi bi-x-circle"></i>
                                                                    Confirmer le refus
                                                                </button>
                                                            </div>
                                                        </div>
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    }
                                </div>
                            }
                        </div>
                    </div>
                }

            </div>
        </app-main-layout>
    `,
    styles: [`
      .page-container { max-width: 1000px; margin: 0 auto; padding: 0 1.5rem 3rem; }

      /* Hero Section */
      .hero-section { background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); border-radius: 24px; padding: 2rem; margin-bottom: 1.5rem; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: space-between; }
      .hero-content { display: flex; align-items: center; gap: 1.25rem; position: relative; z-index: 2; }
      .hero-icon { width: 64px; height: 64px; background: rgba(255, 255, 255, 0.2); backdrop-filter: blur(10px); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; color: white; }
      .hero-title { color: white; font-size: 1.6rem; font-weight: 800; margin: 0; }
      .hero-subtitle { color: rgba(255, 255, 255, 0.9); margin: 0.25rem 0 0; font-size: 0.95rem; }
      .btn-refresh-hero { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: white; color: #6d28d9; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; position: relative; z-index: 2; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); }
      .btn-refresh-hero:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15); }
      .spinner { width: 18px; height: 18px; border: 2px solid rgba(109, 40, 217, 0.2); border-top-color: #6d28d9; border-radius: 50%; animation: spin 0.8s linear infinite; }
      .spinner-sm { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.8s linear infinite; }
      .hero-decoration { position: absolute; right: 0; top: 0; bottom: 0; width: 200px; }
      .decoration-circle { position: absolute; border-radius: 50%; background: rgba(255, 255, 255, 0.1); }
      .c1 { width: 120px; height: 120px; top: -30px; right: 40px; }
      .c2 { width: 80px; height: 80px; bottom: -20px; right: 120px; }

      /* Stats Grid */
      .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
      .stat-card { background: white; border-radius: 16px; padding: 1.25rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04); border: 1px solid #e2e8f0; }
      .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
      .stat-icon.pending { background: #fef3c7; color: #f59e0b; }
      .stat-icon.info { background: #ede9fe; color: #8b5cf6; }
      .stat-info { display: flex; flex-direction: column; }
      .stat-value { font-size: 1.25rem; font-weight: 700; color: #1e293b; }
      .stat-label { font-size: 0.8rem; color: #64748b; }

      /* Loading & Empty States */
      .loading-state, .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; background: white; border-radius: 20px; border: 1px solid #e2e8f0; text-align: center; }
      .loading-spinner { width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #8b5cf6; border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 1rem; }
      @keyframes spin { to { transform: rotate(360deg); } }
      .empty-icon { width: 80px; height: 80px; background: #ede9fe; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 1.5rem; }
      .empty-icon i { font-size: 2.5rem; color: #8b5cf6; }
      .empty-title { font-size: 1.25rem; font-weight: 700; color: #1e293b; margin: 0 0 0.5rem; }
      .empty-text { color: #64748b; margin: 0; }

      /* List Section */
      .list-section { background: white; border-radius: 20px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0; overflow: hidden; }
      .section-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
      .section-title { font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0; display: flex; align-items: center; }
      .section-title i { color: #8b5cf6; }
      .count-badge { background: #8b5cf6; color: white; padding: 0.25rem 0.75rem; border-radius: 50px; font-size: 0.85rem; font-weight: 600; }

      /* Candidates List */
      .candidates-list { padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
      .candidate-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; transition: all 0.2s; }
      .candidate-card:hover { border-color: #c4b5fd; }
      .candidate-card.expanded { border-color: #8b5cf6; box-shadow: 0 4px 20px rgba(139, 92, 246, 0.1); }
      .card-main { display: flex; align-items: center; padding: 1.25rem; cursor: pointer; }
      .card-left { margin-right: 1rem; }
      .avatar { width: 48px; height: 48px; background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 1.1rem; }
      .card-content { flex: 1; }
      .candidate-name { font-size: 1.1rem; font-weight: 700; color: #1e293b; }
      .candidate-info { display: flex; gap: 1.5rem; margin-top: 0.25rem; }
      .info-item { display: flex; align-items: center; gap: 0.35rem; font-size: 0.85rem; color: #64748b; }
      .info-item i { color: #94a3b8; }
      .candidate-meta { display: flex; gap: 0.75rem; margin-top: 0.5rem; }
      .meta-badge { display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.25rem 0.6rem; border-radius: 6px; font-size: 0.75rem; font-weight: 500; }
      .meta-badge.matricule { background: #f1f5f9; color: #475569; }
      .meta-badge.status { background: #fef3c7; color: #b45309; }
      .card-right { padding-left: 1rem; }
      .expand-icon { color: #94a3b8; font-size: 1.25rem; transition: transform 0.3s; }
      .expand-icon.rotated { transform: rotate(180deg); }

      /* Card Details */
      .card-details { background: white; border-top: 1px solid #e2e8f0; padding: 1.5rem; animation: slideDown 0.3s ease-out; }
      @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
      .detail-section { background: #f8fafc; border-radius: 14px; padding: 1.25rem; border: 1px solid #e2e8f0; }
      .detail-section.decision { border-left: 4px solid #8b5cf6; }
      .detail-title { font-size: 0.85rem; font-weight: 700; color: #1e293b; margin: 0 0 1rem; display: flex; align-items: center; gap: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px; }
      .detail-title i { color: #8b5cf6; }

      /* Documents */
      .documents-list { display: flex; flex-direction: column; gap: 0.75rem; }
      .doc-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; background: white; border: 1px dashed #cbd5e1; border-radius: 10px; opacity: 0.6; cursor: not-allowed; }
      .doc-item.available { opacity: 1; border-style: solid; border-color: #e2e8f0; cursor: pointer; transition: all 0.2s; }
      .doc-item.available:hover { border-color: #8b5cf6; background: #faf5ff; }
      .doc-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1rem; }
      .doc-icon.cv { background: #f3e8ff; color: #9333ea; }
      .doc-icon.diploma { background: #dbeafe; color: #2563eb; }
      .doc-icon.letter { background: #ffedd5; color: #ea580c; }
      .doc-info { flex: 1; }
      .doc-name { display: block; font-weight: 600; font-size: 0.85rem; color: #1e293b; }
      .doc-status { display: block; font-size: 0.75rem; color: #64748b; }
      .doc-action { color: #8b5cf6; font-size: 1.1rem; }

      /* Decision Buttons */
      .decision-buttons { display: flex; flex-direction: column; gap: 0.75rem; }
      .btn-decision { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.875rem 1rem; border: none; border-radius: 10px; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; }
      .btn-decision.accept { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3); }
      .btn-decision.accept:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(34, 197, 94, 0.4); }
      .btn-decision.reject { background: white; color: #dc2626; border: 2px solid #fecaca; }
      .btn-decision.reject:hover { background: #fef2f2; border-color: #dc2626; }
      .decision-hint { display: flex; align-items: flex-start; gap: 0.5rem; margin: 1rem 0 0; padding: 0.75rem; background: #ede9fe; border-radius: 8px; font-size: 0.8rem; color: #6d28d9; }

      /* Accept Form */
      .accept-form { background: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 1.25rem; }
      .accept-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; font-weight: 600; color: #15803d; margin-bottom: 0.75rem; }
      .required { color: #ef4444; }
      .accept-textarea { width: 100%; padding: 0.875rem; border: 2px solid #86efac; border-radius: 10px; font-size: 0.95rem; resize: vertical; min-height: 100px; background: white; font-family: inherit; line-height: 1.5; }
      .accept-textarea:focus { outline: none; border-color: #22c55e; box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1); }
      .accept-textarea::placeholder { color: #94a3b8; }
      .char-count { font-size: 0.75rem; color: #64748b; margin-top: 0.35rem; text-align: right; }
      .char-count.warning { color: #f59e0b; }
      .info-box { display: flex; align-items: flex-start; gap: 0.5rem; margin-top: 1rem; padding: 0.75rem; background: #dcfce7; border-radius: 8px; font-size: 0.8rem; color: #166534; }
      .info-box i { margin-top: 0.1rem; flex-shrink: 0; }
      .accept-actions { display: flex; gap: 0.75rem; margin-top: 1rem; }
      .btn-confirm-accept { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.875rem; border-radius: 10px; font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.2s; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border: none; color: white; box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3); }
      .btn-confirm-accept:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(34, 197, 94, 0.4); }
      .btn-confirm-accept:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

      /* Refusal Form */
      .refusal-form { background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 1rem; }
      .refusal-label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 600; color: #dc2626; margin-bottom: 0.75rem; }
      .refusal-textarea { width: 100%; padding: 0.75rem; border: 1px solid #fecaca; border-radius: 8px; font-size: 0.9rem; resize: none; background: white; }
      .refusal-textarea:focus { outline: none; border-color: #f87171; box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.15); }
      .refusal-actions { display: flex; gap: 0.75rem; margin-top: 1rem; }
      .btn-cancel { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem; border-radius: 8px; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; background: white; border: 1px solid #e2e8f0; color: #64748b; }
      .btn-cancel:hover { background: #f8fafc; }
      .btn-confirm-reject { flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem; border-radius: 8px; font-weight: 600; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; background: #dc2626; border: none; color: white; }
      .btn-confirm-reject:hover:not(:disabled) { background: #b91c1c; }
      .btn-confirm-reject:disabled { opacity: 0.5; cursor: not-allowed; }

      @media (max-width: 768px) {
        .hero-section { flex-direction: column; gap: 1.5rem; text-align: center; }
        .hero-content { flex-direction: column; }
        .stats-grid { grid-template-columns: 1fr; }
        .details-grid { grid-template-columns: 1fr; }
        .candidate-info { flex-direction: column; gap: 0.25rem; }
      }
    `]
})
export class DirectorValidationComponent implements OnInit {
    pendingUsers = signal<User[]>([]);
    expandedUserId = signal<number | null>(null);
    showRefusalInputId = signal<number | null>(null);
    showAcceptInputId = signal<number | null>(null);
    isLoading = signal(false);
    isValidating = signal(false);
    motifText = '';
    sujetTheseText = '';

    constructor(
        private userService: UserService,
        private authService: AuthService
    ) {}

    ngOnInit() {
        this.loadData();
    }

    currentDirectorName(): string {
        const user = this.authService.currentUser();
        return user ? `${user.prenom} ${user.nom}` : 'Directeur';
    }

    loadData() {
        this.isLoading.set(true);
        const currentUser = this.authService.currentUser();

        if (!currentUser?.id) {
            console.error('Utilisateur non connecté');
            this.isLoading.set(false);
            return;
        }

        this.userService.getUsersByEtat('EN_ATTENTE_DIRECTEUR').subscribe({
            next: users => {
                const myPendingUsers = users.filter(u => u.directeurId === currentUser.id);
                this.pendingUsers.set(myPendingUsers);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Erreur chargement:', err);
                this.isLoading.set(false);
            }
        });
    }

    toggleExpand(id: number) {
        if (this.expandedUserId() === id) {
            this.expandedUserId.set(null);
            this.showRefusalInputId.set(null);
            this.showAcceptInputId.set(null);
            this.motifText = '';
            this.sujetTheseText = '';
        } else {
            this.expandedUserId.set(id);
            this.showRefusalInputId.set(null);
            this.showAcceptInputId.set(null);
            this.motifText = '';
            this.sujetTheseText = '';
        }
    }

    viewDocument(filename: string | undefined, event: Event) {
        event.stopPropagation();
        if (filename) {
            window.open(this.userService.getDocumentUrl(filename), '_blank');
        }
    }

    // ==================== ACCEPTATION AVEC SUJET ====================

    initiateAccept(id: number, event: Event) {
        event.stopPropagation();
        this.showAcceptInputId.set(id);
        this.showRefusalInputId.set(null);
        this.sujetTheseText = '';
    }

    cancelAccept(event: Event) {
        event.stopPropagation();
        this.showAcceptInputId.set(null);
        this.sujetTheseText = '';
    }

    confirmerAccept(user: User, event: Event) {
        event.stopPropagation();

        if (!this.sujetTheseText.trim() || this.sujetTheseText.trim().length < 10) {
            alert('Veuillez saisir un sujet de thèse valide (minimum 10 caractères).');
            return;
        }

        if (confirm(`Confirmer l'inscription de ${user.nom} ${user.prenom} avec ce sujet de thèse ?\n\n"${this.sujetTheseText.trim()}"`)) {
            this.isValidating.set(true);

            // ✅ Appel API avec le sujet de thèse
            this.userService.validerCandidatureDirecteurAvecSujet(user.id, this.sujetTheseText.trim()).subscribe({
                next: () => {
                    this.isValidating.set(false);
                    alert('✅ Candidature validée ! Le candidat est maintenant doctorant avec son sujet de thèse enregistré.');
                    this.loadData();
                    this.expandedUserId.set(null);
                    this.showAcceptInputId.set(null);
                    this.sujetTheseText = '';
                },
                error: (err) => {
                    this.isValidating.set(false);
                    console.error('Erreur validation:', err);
                    alert('❌ Erreur lors de la validation: ' + (err.error?.message || err.error?.error || 'Erreur inconnue'));
                }
            });
        }
    }

    initiateRefusal(id: number, event: Event) {
        event.stopPropagation();
        this.showRefusalInputId.set(id);
        this.showAcceptInputId.set(null);
        this.motifText = '';
    }

    cancelRefusal(event: Event) {
        event.stopPropagation();
        this.showRefusalInputId.set(null);
        this.motifText = '';
    }

    confirmerRefus(user: User, event: Event) {
        event.stopPropagation();

        if (!this.motifText.trim()) {
            alert('Veuillez saisir un motif de refus.');
            return;
        }

        if (confirm(`Refuser définitivement le dossier de ${user.nom} ${user.prenom} ?`)) {
            this.userService.refuserCandidatureDirecteur(user.id, this.motifText.trim()).subscribe({
                next: () => {
                    alert('Candidature refusée.');
                    this.loadData();
                    this.showRefusalInputId.set(null);
                    this.motifText = '';
                    this.expandedUserId.set(null);
                },
                error: (err) => {
                    console.error('Erreur refus:', err);
                    alert('Erreur lors du refus.');
                }
            });
        }
    }
}