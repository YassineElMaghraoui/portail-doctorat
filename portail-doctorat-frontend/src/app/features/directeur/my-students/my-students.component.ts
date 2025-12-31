import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MainLayoutComponent } from '@shared/components/main-layout/main-layout.component';
import { UserService } from '@core/services/user.service';
import { AuthService } from '@core/services/auth.service';
import { User } from '@core/models/user.model';

@Component({
    selector: 'app-my-students',
    standalone: true,
    imports: [CommonModule, MainLayoutComponent, RouterModule],
    template: `
        <app-main-layout>
            <div class="page-container">

                <!-- HERO HEADER -->
                <div class="hero-section">
                    <div class="hero-content">
                        <div class="hero-icon">
                            <i class="bi bi-people-fill"></i>
                        </div>
                        <div>
                            <h1 class="hero-title">Mes Doctorants</h1>
                            <p class="hero-subtitle">Suivi académique, progression et consultation des prérequis.</p>
                        </div>
                    </div>
                    <div class="hero-actions">
             <span class="director-badge">
               <i class="bi bi-person-badge me-2"></i>
               Directeur: {{ currentDirectorName() }}
             </span>
                    </div>
                    <div class="hero-decoration">
                        <div class="decoration-circle c1"></div>
                        <div class="decoration-circle c2"></div>
                    </div>
                </div>

                <!-- STATS CARDS -->
                <div class="stats-grid">
                    <div class="stat-card purple">
                        <div class="stat-icon"><i class="bi bi-mortarboard-fill"></i></div>
                        <div class="stat-info">
                            <span class="stat-value">{{ students().length }}</span>
                            <span class="stat-label">Total Doctorants</span>
                        </div>
                    </div>
                    <div class="stat-card green">
                        <div class="stat-icon"><i class="bi bi-check-circle-fill"></i></div>
                        <div class="stat-info">
                            <span class="stat-value">{{ stats().onTrack }}</span>
                            <span class="stat-label">Progression Normale</span>
                        </div>
                    </div>
                    <div class="stat-card orange">
                        <div class="stat-icon"><i class="bi bi-clock-history"></i></div>
                        <div class="stat-info">
                            <span class="stat-value">{{ stats().warning }}</span>
                            <span class="stat-label">Fin de Cycle</span>
                        </div>
                    </div>
                    <div class="stat-card red">
                        <div class="stat-icon"><i class="bi bi-exclamation-triangle-fill"></i></div>
                        <div class="stat-info">
                            <span class="stat-value">{{ stats().alert }}</span>
                            <span class="stat-label">Alertes Durée</span>
                        </div>
                    </div>
                </div>

                <!-- LISTE DES DOCTORANTS -->
                <div class="students-list-container">
                    @if (isLoading()) {
                        <div class="loading-state">
                            <div class="spinner"></div>
                            <p>Chargement de vos doctorants...</p>
                        </div>
                    } @else if (students().length === 0) {
                        <div class="empty-state">
                            <div class="empty-icon"><i class="bi bi-people"></i></div>
                            <h3>Aucun doctorant assigné</h3>
                            <p>Vous n'avez pas encore de doctorants sous votre direction.</p>
                        </div>
                    } @else {
                        <div class="d-flex flex-column gap-3">
                            @for (student of students(); track student.id) {

                                <div class="student-row-card" [class.expanded]="expandedId() === student.id" (click)="toggleExpand(student.id)">

                                    <!-- EN-TÊTE -->
                                    <div class="row-header">

                                        <!-- 1. Identité -->
                                        <div class="user-identity">
                                            <div class="avatar-circle" [ngClass]="getAvatarColor(student.id)">
                                                {{ student.nom.charAt(0) }}{{ student.prenom.charAt(0) }}
                                            </div>
                                            <div class="user-text">
                                                <h4 class="name">{{ student.nom }} {{ student.prenom }}</h4>
                                                <span class="matricule"><i class="bi bi-card-heading me-1"></i>Mat: {{ student.username }}</span>
                                            </div>
                                        </div>

                                        <!-- 2. Progression -->
                                        <div class="progress-container d-none d-md-flex">
                                            <div class="d-flex justify-content-between w-100 mb-2">
                                                <span class="label">Progression Thèse</span>
                                                <span class="value text-primary">Année {{ student.anneeThese || 1 }} / 6</span>
                                            </div>
                                            <div class="progress-track">
                                                <!-- ✅ CORRECTION ICI : style.width en string explicite -->
                                                <div class="progress-fill"
                                                     [style.width]="getProgressPercentage(student.anneeThese) + '%'"
                                                     [ngClass]="getProgressBarClass(student)">
                                                </div>
                                            </div>
                                        </div>

                                        <!-- 3. Statut -->
                                        <div class="status-action">
                      <span class="status-badge" [ngClass]="getAlertBadgeClass(student)">
                        @if(getAlertLevel(student) === 'RED') { <i class="bi bi-exclamation-triangle-fill"></i> CRITIQUE }
                        @else if(getAlertLevel(student) === 'YELLOW') { <i class="bi bi-clock-history"></i> FIN CYCLE }
                        @else { <i class="bi bi-check-circle-fill"></i> NORMAL }
                      </span>
                                            <i class="bi bi-chevron-down expand-icon" [class.rotated]="expandedId() === student.id"></i>
                                        </div>
                                    </div>

                                    <!-- DROPDOWN -->
                                    @if (expandedId() === student.id) {
                                        <div class="row-details" (click)="$event.stopPropagation()">
                                            <hr class="separator">

                                            <div class="info-grid">
                                                <div class="info-item">
                                                    <span class="label"><i class="bi bi-envelope"></i> Email</span>
                                                    <span class="val fw-bold text-primary">{{ student.email }}</span>
                                                </div>
                                                <div class="info-item">
                                                    <span class="label"><i class="bi bi-telephone"></i> Téléphone</span>
                                                    <span class="val">{{ student.telephone || 'Non renseigné' }}</span>
                                                </div>
                                                <div class="info-item">
                                                    <span class="label"><i class="bi bi-calendar3"></i> Date Inscription</span>
                                                    <span class="val">{{ student.createdAt | date:'dd/MM/yyyy' }}</span>
                                                </div>
                                                <div class="info-item wide">
                                                    <span class="label"><i class="bi bi-journal-text"></i> Sujet de Thèse</span>
                                                    <span class="val text-dark fw-bold">{{ student.titreThese || student.sujetThese || 'Sujet non défini' }}</span>
                                                </div>
                                            </div>

                                            <div class="mt-4 pt-3 border-top">
                                                <h6 class="section-title mb-3">
                                                    <i class="bi bi-list-check me-2"></i>État des Prérequis (Lecture Seule)
                                                </h6>

                                                <div class="prereq-list">
                                                    <!-- Publications -->
                                                    <div class="prereq-box" [class.done]="(student.nbPublications || 0) >= 2">
                                                        <div class="box-icon"><i class="bi bi-journal-richtext"></i></div>
                                                        <div class="box-content">
                                                            <span class="count">{{ student.nbPublications || 0 }} <span class="total">/ 2</span></span>
                                                            <span class="desc">Publications (Q1/Q2)</span>
                                                        </div>
                                                        <div class="check-mark">
                                                            <i class="bi" [class]="(student.nbPublications || 0) >= 2 ? 'bi-check-circle-fill' : 'bi-circle'"></i>
                                                        </div>
                                                    </div>

                                                    <!-- Conférences -->
                                                    <div class="prereq-box" [class.done]="(student.nbConferences || 0) >= 2">
                                                        <div class="box-icon"><i class="bi bi-mic"></i></div>
                                                        <div class="box-content">
                                                            <span class="count">{{ student.nbConferences || 0 }} <span class="total">/ 2</span></span>
                                                            <span class="desc">Conférences Intern.</span>
                                                        </div>
                                                        <div class="check-mark">
                                                            <i class="bi" [class]="(student.nbConferences || 0) >= 2 ? 'bi-check-circle-fill' : 'bi-circle'"></i>
                                                        </div>
                                                    </div>

                                                    <!-- Formation -->
                                                    <div class="prereq-box" [class.done]="(student.heuresFormation || 0) >= 200">
                                                        <div class="box-icon"><i class="bi bi-clock"></i></div>
                                                        <div class="box-content">
                                                            <span class="count">{{ student.heuresFormation || 0 }}h <span class="total">/ 200h</span></span>
                                                            <span class="desc">Heures Formation</span>
                                                        </div>
                                                        <div class="check-mark">
                                                            <i class="bi" [class]="(student.heuresFormation || 0) >= 200 ? 'bi-check-circle-fill' : 'bi-circle'"></i>
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>

                                        </div>
                                    }
                                </div>
                            }
                        </div>
                    }
                </div>

            </div>
        </app-main-layout>
    `,
    styles: [`
      .page-container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem 3rem; }

      /* --- HERO --- */
      .hero-section {
        background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%);
        border-radius: 24px; padding: 2.5rem; margin-bottom: 2rem;
        display: flex; align-items: center; justify-content: space-between;
        position: relative; overflow: hidden; color: white;
        box-shadow: 0 10px 30px rgba(79, 70, 229, 0.2);
      }
      .hero-content { display: flex; align-items: center; gap: 1.5rem; position: relative; z-index: 2; }
      .hero-icon { width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 2rem; }
      .hero-title { margin: 0; font-size: 1.8rem; font-weight: 800; }
      .hero-subtitle { margin: 0.5rem 0 0; opacity: 0.9; }
      .director-badge { background: rgba(255,255,255,0.15); padding: 0.5rem 1rem; border-radius: 50px; font-weight: 500; border: 1px solid rgba(255,255,255,0.2); }
      .hero-decoration { position: absolute; inset: 0; pointer-events: none; }
      .decoration-circle { position: absolute; border-radius: 50%; background: rgba(255, 255, 255, 0.08); }
      .c1 { width: 150px; height: 150px; top: -40px; right: 50px; }
      .c2 { width: 100px; height: 100px; bottom: -20px; right: 180px; }

      /* --- STATS --- */
      .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
      .stat-card { background: white; border-radius: 16px; padding: 1.5rem; display: flex; align-items: center; gap: 1rem; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
      .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; }
      .stat-value { font-size: 1.5rem; font-weight: 800; color: #1e293b; display: block; }
      .stat-label { font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; }
      .stat-card.purple .stat-icon { background: #e0e7ff; color: #4338ca; }
      .stat-card.green .stat-icon { background: #dcfce7; color: #15803d; }
      .stat-card.orange .stat-icon { background: #ffedd5; color: #c2410c; }
      .stat-card.red .stat-icon { background: #fee2e2; color: #b91c1c; }

      /* --- STUDENTS LIST --- */
      .students-list-container { display: flex; flex-direction: column; gap: 1rem; }
      .student-row-card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; transition: all 0.2s ease; overflow: hidden; cursor: pointer; width: 100%; }
      .student-row-card:hover { border-color: #cbd5e1; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
      .student-row-card.expanded { border-color: #6366f1; box-shadow: 0 8px 24px rgba(99, 102, 241, 0.1); }

      .row-header { display: flex; align-items: center; padding: 1.5rem; gap: 2rem; justify-content: space-between; }

      .user-identity { display: flex; align-items: center; gap: 1.25rem; flex: 2; }
      .avatar-circle { width: 52px; height: 52px; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.2rem; flex-shrink: 0; }
      .avatar-1 { background: linear-gradient(135deg, #4f46e5, #818cf8); }
      .avatar-2 { background: linear-gradient(135deg, #0ea5e9, #38bdf8); }
      .avatar-3 { background: linear-gradient(135deg, #8b5cf6, #a78bfa); }
      .user-text { display: flex; flex-direction: column; gap: 0.2rem; }
      .name { margin: 0; font-size: 1.1rem; font-weight: 700; color: #1e293b; }
      .matricule { font-size: 0.85rem; color: #64748b; font-family: monospace; display: flex; align-items: center; }

      .progress-container { flex: 2; flex-direction: column; justify-content: center; padding: 0 1rem; }
      .progress-container .label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
      .progress-container .value { font-size: 0.9rem; font-weight: 700; color: #4f46e5; }
      .progress-track { height: 10px; background: #f1f5f9; border-radius: 20px; overflow: hidden; }
      .progress-fill { height: 100%; border-radius: 20px; transition: width 0.6s ease-in-out; }

      /* ✅ CORRECTION ICI : Ajout explicite des couleurs de fond pour la barre de progression */
      .bg-success { background-color: #22c55e !important; }
      .bg-warning { background-color: #f59e0b !important; }
      .bg-danger { background-color: #ef4444 !important; }

      .status-action { flex: 1; display: flex; align-items: center; justify-content: flex-end; gap: 2rem; }
      .status-badge { font-size: 0.75rem; font-weight: 700; padding: 0.5rem 1rem; border-radius: 50px; display: flex; align-items: center; gap: 0.5rem; min-width: 110px; justify-content: center; }
      .status-badge.bg-danger-soft { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
      .status-badge.bg-warning-soft { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
      .status-badge.bg-success-soft { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }

      .expand-icon { color: #94a3b8; transition: transform 0.3s; font-size: 1.2rem; }
      .expand-icon.rotated { transform: rotate(180deg); color: #6366f1; }

      .row-details { background: #fcfcfc; padding: 0 1.5rem 1.5rem; cursor: default; border-top: 1px solid #f1f5f9; }
      .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem; margin-top: 1.5rem; }
      .info-item { display: flex; flex-direction: column; gap: 0.5rem; }
      .info-item.wide { grid-column: span 1; }
      .info-item .label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; display: flex; align-items: center; gap: 0.5rem; }
      .info-item .val { font-size: 1rem; color: #334155; font-weight: 500; }

      .section-title { font-size: 0.85rem; font-weight: 800; color: #64748b; letter-spacing: 0.5px; text-transform: uppercase; }

      .prereq-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
      .prereq-box { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; display: flex; align-items: center; gap: 1.25rem; position: relative; }
      .prereq-box.done { background: #f0fdf4; border-color: #86efac; }
      .prereq-box.done .box-icon { background: #dcfce7; color: #16a34a; }
      .prereq-box.done .count { color: #15803d; }
      .prereq-box.done .check-mark { color: #16a34a; }
      .prereq-box .box-icon { width: 48px; height: 48px; border-radius: 12px; background: #f1f5f9; color: #64748b; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; }
      .prereq-box .box-content { display: flex; flex-direction: column; flex: 1; gap: 0.25rem; }
      .prereq-box .count { font-size: 1.2rem; font-weight: 800; color: #334155; }
      .prereq-box .total { font-size: 0.9rem; font-weight: 600; color: #94a3b8; }
      .prereq-box .desc { font-size: 0.8rem; color: #64748b; font-weight: 600; }
      .prereq-box .check-mark { font-size: 1.5rem; color: #cbd5e1; }

      .loading-state, .empty-state { text-align: center; padding: 4rem; background: white; border-radius: 16px; border: 1px solid #e2e8f0; }
      .spinner { margin: 0 auto 1rem; width: 30px; height: 30px; border: 3px solid #e2e8f0; border-top-color: #6366f1; border-radius: 50%; animation: spin 0.8s linear infinite; }
      .empty-icon { font-size: 2.5rem; color: #cbd5e1; margin-bottom: 1rem; }

      @keyframes spin { to { transform: rotate(360deg); } }
      @media (max-width: 992px) {
        .stats-grid, .info-grid, .prereq-list { grid-template-columns: 1fr; gap: 1rem; }
        .row-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
        .status-action { width: 100%; justify-content: space-between; }
        .progress-container { width: 100%; padding: 0; }
      }
    `]
})
export class MyStudentsComponent implements OnInit {
    students = signal<User[]>([]);
    isLoading = signal(true);
    expandedId = signal<number | null>(null);
    currentDirectorName = signal<string>('');

    stats = computed(() => {
        const list = this.students();
        return {
            onTrack: list.filter(s => this.getAlertLevel(s) === 'GREEN').length,
            warning: list.filter(s => this.getAlertLevel(s) === 'YELLOW').length,
            alert: list.filter(s => this.getAlertLevel(s) === 'RED').length
        };
    });

    constructor(
        private userService: UserService,
        private authService: AuthService
    ) {}

    ngOnInit() {
        this.loadData();
    }

    loadData() {
        this.isLoading.set(true);
        const currentUser = this.authService.currentUser();

        if (currentUser) {
            this.currentDirectorName.set(`${currentUser.prenom} ${currentUser.nom}`);
            this.userService.getUsersByRole('DOCTORANT').subscribe({
                next: (data) => {
                    const myStudents = data.filter(u => u.directeurId === currentUser.id);
                    this.students.set(myStudents);
                    this.isLoading.set(false);
                },
                error: () => this.isLoading.set(false)
            });
        }
    }

    toggleExpand(id: number) {
        this.expandedId.set(this.expandedId() === id ? null : id);
    }

    getProgressPercentage(annee: number | undefined): number {
        const year = annee || 1;
        // Si l'année est > 6, on bloque à 100%
        return Math.min((year / 6) * 100, 100);
    }

    getAlertLevel(student: User): 'RED' | 'YELLOW' | 'GREEN' {
        const annee = student.anneeThese || 1;
        if (annee >= 5) return 'RED';
        if (annee >= 3) return 'YELLOW'; // Fin de cycle commence à la 3ème année (soutenance théorique)
        return 'GREEN';
    }

    getAlertBadgeClass(student: User): string {
        const level = this.getAlertLevel(student);
        if (level === 'RED') return 'bg-danger-soft';
        if (level === 'YELLOW') return 'bg-warning-soft';
        return 'bg-success-soft';
    }

    getProgressBarClass(student: User): string {
        const level = this.getAlertLevel(student);
        if (level === 'RED') return 'bg-danger';
        if (level === 'YELLOW') return 'bg-warning';
        return 'bg-success';
    }

    getAvatarColor(id: number): string {
        const i = id % 3;
        if (i === 0) return 'avatar-1';
        if (i === 1) return 'avatar-2';
        return 'avatar-3';
    }
}