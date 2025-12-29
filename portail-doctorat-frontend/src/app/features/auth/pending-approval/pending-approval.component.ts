import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';
import { UserService } from '@core/services/user.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-pending-approval',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="auth-container">
            <div class="main-card fade-in">
                <!-- EN-TÊTE -->
                <div class="header-section text-center mb-5">
                    <h2 class="fw-bold text-dark mb-2">Suivi de Candidature</h2>
                    <p class="text-muted">Suivez l'état d'avancement de votre dossier doctoral</p>
                </div>

                <div class="row">
                    <!-- INFOS CANDIDAT -->
                    <div class="col-md-5 border-end pe-md-4 mb-4 mb-md-0">
                        <h5 class="section-title text-primary mb-4">
                            <i class="bi bi-person-vcard me-2"></i>Informations Personnelles
                        </h5>
                        <form>
                            <div class="mb-3">
                                <label class="form-label small text-muted">Nom & Prénom</label>
                                <input type="text" class="form-control bg-light"
                                       [value]="(user()?.nom || '') + ' ' + (user()?.prenom || '')" disabled readonly>
                            </div>
                            <div class="mb-3">
                                <label class="form-label small text-muted">Matricule</label>
                                <input type="text" class="form-control bg-light"
                                       [value]="user()?.username" disabled readonly>
                            </div>
                            <div class="mb-3">
                                <label class="form-label small text-muted">Email</label>
                                <input type="text" class="form-control bg-light"
                                       [value]="user()?.email" disabled readonly>
                            </div>

                            @if (!isRefuse()) {
                                <div class="alert alert-light border small text-muted fst-italic mt-4">
                                    <i class="bi bi-info-circle me-1"></i>
                                    Vos documents ont été transmis à l'administration et sont en cours d'examen.
                                </div>
                            }
                        </form>
                    </div>

                    <!-- ÉTAT D'AVANCEMENT -->
                    <div class="col-md-7 ps-md-5">
                        <div class="mb-5">
                            <h5 class="section-title text-primary mb-4">
                                <i class="bi bi-activity me-2"></i>État d'avancement
                            </h5>
                            <!-- TIMELINE -->
                            <div class="timeline-container py-3">
                                <div class="step">
                                    <div class="step-circle"
                                         [class.active]="isAdminPending()"
                                         [class.completed]="isAdminApproved()"
                                         [class.rejected]="isRefusedByAdmin()">
                                        @if (isRefusedByAdmin()) {
                                            <i class="bi bi-x-lg"></i>
                                        } @else if (isAdminApproved()) {
                                            <i class="bi bi-check-lg"></i>
                                        } @else {
                                            1
                                        }
                                    </div>
                                    <div class="step-label" [class.rejected-label]="isRefusedByAdmin()">Admin</div>
                                </div>

                                <div class="step-line">
                                    <div class="step-line-fill"
                                         [class.rejected-line]="isRefusedByAdmin()"
                                         [style.width]="getLineProgress()"></div>
                                </div>

                                <div class="step">
                                    <div class="step-circle"
                                         [class.active]="isDirectorPending()"
                                         [class.completed]="isValide()"
                                         [class.rejected]="isRefusedByDirector()"
                                         [class.disabled]="isAdminPending() || isRefusedByAdmin()">
                                        @if (isRefusedByDirector()) {
                                            <i class="bi bi-x-lg"></i>
                                        } @else if (isValide()) {
                                            <i class="bi bi-check-lg"></i>
                                        } @else {
                                            2
                                        }
                                    </div>
                                    <div class="step-label"
                                         [class.rejected-label]="isRefusedByDirector()"
                                         [class.disabled-label]="isAdminPending() || isRefusedByAdmin()">Directeur</div>
                                </div>
                            </div>
                        </div>

                        <!-- MESSAGE D'ÉTAT -->
                        <div class="status-wrapper mb-5">
                            @if (isAdminPending()) {
                                <div class="status-card warning">
                                    <div class="icon"><i class="bi bi-hourglass-split"></i></div>
                                    <div class="content">
                                        <h5>En attente de validation Administrative</h5>
                                        <p>L'administration vérifie actuellement votre dossier (Diplômes, éligibilité...).</p>
                                    </div>
                                </div>
                            }

                            @if (isRefusedByAdmin()) {
                                <div class="status-card danger">
                                    <div class="icon"><i class="bi bi-x-circle"></i></div>
                                    <div class="content">
                                        <h5>Dossier Refusé par l'Administration</h5>
                                        <p>Votre candidature n'a pas été retenue par l'administration.</p>
                                        @if (user()?.motifRefus) {
                                            <div class="reason mt-3">
                                                <strong><i class="bi bi-chat-square-text me-1"></i>Motif du refus :</strong>
                                                <p class="mt-2 mb-0">{{ user()?.motifRefus }}</p>
                                            </div>
                                        }
                                    </div>
                                </div>
                            }

                            @if (isDirectorPending()) {
                                <div class="status-card info">
                                    <div class="icon"><i class="bi bi-person-workspace"></i></div>
                                    <div class="content">
                                        <h5>En attente du Directeur de Thèse</h5>
                                        <p>Votre dossier a été validé par l'administration. Il est maintenant transmis au directeur de thèse pour validation scientifique.</p>
                                        @if (directeurNom()) {
                                            <div class="director-info mt-2">
                                                <small class="text-muted">
                                                    <i class="bi bi-person-check me-1"></i>
                                                    Directeur assigné : <strong>{{ directeurNom() }}</strong>
                                                </small>
                                            </div>
                                        }
                                    </div>
                                </div>
                            }

                            @if (isRefusedByDirector()) {
                                <div class="status-card danger">
                                    <div class="icon"><i class="bi bi-x-circle"></i></div>
                                    <div class="content">
                                        <h5>Dossier Refusé par le Directeur de Thèse</h5>
                                        <p>Votre candidature n'a pas été retenue par le directeur de thèse.</p>
                                        @if (user()?.motifRefus) {
                                            <div class="reason mt-3">
                                                <strong><i class="bi bi-chat-square-text me-1"></i>Motif du refus :</strong>
                                                <p class="mt-2 mb-0">{{ user()?.motifRefus }}</p>
                                            </div>
                                        }
                                    </div>
                                </div>
                            }

                            @if (isValide()) {
                                <div class="status-card success">
                                    <div class="icon"><i class="bi bi-check-lg"></i></div>
                                    <div class="content">
                                        <h5>Félicitations !</h5>
                                        <p>Vous êtes officiellement inscrit au cycle doctoral.</p>
                                        <button class="btn btn-sm btn-outline-success mt-2 fw-bold" (click)="goToDashboard()">
                                            <i class="bi bi-arrow-right-circle me-1"></i>
                                            Accéder à mon espace
                                        </button>
                                    </div>
                                </div>
                            }
                        </div>

                        @if (isRefuse()) {
                            <div class="help-section mb-4">
                                <div class="alert alert-secondary">
                                    <i class="bi bi-question-circle me-2"></i>
                                    <strong>Besoin d'aide ?</strong>
                                    <p class="mb-0 mt-1 small">
                                        Si vous pensez qu'il y a une erreur ou si vous souhaitez plus d'informations,
                                        contactez le secrétariat du doctorat à <a href="mailto:doctorat@universite.ma">doctorat&#64;universite.ma</a>
                                    </p>
                                </div>
                            </div>
                        }

                        <div class="text-center mt-5 pt-4 border-top">
                            <button class="btn btn-logout px-4 py-2 shadow-sm" (click)="logout()">
                                <i class="bi bi-box-arrow-left me-2"></i> Se déconnecter
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
      .auth-container { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 1rem; }
      .main-card { width: 100%; max-width: 1000px; background: white; border-radius: 16px; padding: 3rem; box-shadow: 0 20px 40px rgba(0,0,0,0.2); }
      .fade-in { animation: fadeIn 0.5s ease-out; }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      .section-title { font-weight: 700; font-size: 1.1rem; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; color: #1e293b; }
      .form-control:disabled, .form-control[readonly] { background-color: #f8fafc; border: 1px solid #e2e8f0; color: #64748b; font-weight: 500; }
      .timeline-container { display: flex; justify-content: space-between; align-items: center; padding: 0 1rem; }
      .step { text-align: center; position: relative; z-index: 2; flex: 1; }
      .step-circle { width: 44px; height: 44px; border-radius: 50%; background: #e0e7ff; color: #6366f1; font-weight: bold; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; transition: all 0.3s; font-size: 1rem; }
      .step-label { font-size: 0.8rem; font-weight: 700; color: #6366f1; transition: all 0.3s; }
      .step-line { flex: 2; height: 4px; background: #e0e7ff; margin: 0 10px; margin-bottom: 25px; border-radius: 2px; position: relative; overflow: hidden; }
      .step-line-fill { height: 100%; background: linear-gradient(90deg, #5b21b6, #7c3aed); transition: width 0.5s ease-in-out; }
      .step-line-fill.rejected-line { background: linear-gradient(90deg, #dc2626, #ef4444); }
      .step-circle.active { border: 3px solid #5b21b6; background: white; color: #5b21b6; transform: scale(1.1); box-shadow: 0 0 0 4px rgba(91, 33, 182, 0.2); }
      .step-circle.completed { background: linear-gradient(135deg, #5b21b6, #7c3aed); color: white; box-shadow: 0 4px 12px rgba(91, 33, 182, 0.3); }
      .step-circle.rejected { background: linear-gradient(135deg, #dc2626, #ef4444); color: white; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3); }
      .step-circle.disabled { background: #f1f5f9; color: #cbd5e1; }
      .step-label.rejected-label { color: #dc2626; }
      .step-label.disabled-label { color: #cbd5e1; }
      .status-card { display: flex; gap: 15px; padding: 1.5rem; border-radius: 12px; border: 1px solid transparent; align-items: flex-start; }
      .status-card .icon { font-size: 1.75rem; line-height: 1; margin-top: 2px; }
      .status-card .content { flex: 1; }
      .status-card h5 { margin-bottom: 0.5rem; font-weight: 700; font-size: 1rem; }
      .status-card p { margin-bottom: 0; font-size: 0.9rem; line-height: 1.5; }
      .reason { background: rgba(255,255,255,0.9); padding: 12px 15px; border-radius: 8px; font-size: 0.9rem; border-left: 4px solid #ef4444; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
      .reason p { color: #1e293b; font-style: italic; }
      .status-card.warning { background: linear-gradient(135deg, #fffbeb, #fef3c7); border: 1px solid #fcd34d; color: #92400e; }
      .status-card.warning .icon { color: #d97706; }
      .status-card.danger { background: linear-gradient(135deg, #fef2f2, #fee2e2); border: 1px solid #fca5a5; color: #991b1b; }
      .status-card.danger .icon { color: #dc2626; }
      .status-card.info { background: linear-gradient(135deg, #eff6ff, #dbeafe); border: 1px solid #bfdbfe; color: #1e40af; }
      .status-card.info .icon { color: #3b82f6; }
      .status-card.success { background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 1px solid #86efac; color: #166534; }
      .status-card.success .icon { color: #16a34a; }
      .director-info { background: rgba(255,255,255,0.5); padding: 8px 12px; border-radius: 8px; border: 1px solid #bfdbfe; }
      .director-info strong { color: #1e40af; }
      .btn-logout { background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 0.9rem; transition: all 0.3s; }
      .btn-logout:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4); }
      .help-section .alert { border-radius: 10px; border: none; background: #f8fafc; }
      .help-section a { color: #6366f1; font-weight: 600; }
      @media (max-width: 768px) { .main-card { padding: 1.5rem; } .timeline-container { padding: 0; } .step-circle { width: 36px; height: 36px; font-size: 0.9rem; } .step-label { font-size: 0.7rem; } }
    `]
})
export class PendingApprovalComponent implements OnInit {

    user = this.authService.currentUser;

    // ✅ Signal pour stocker le nom du directeur
    directeurNom = signal<string>('');

    constructor(
        private authService: AuthService,
        private userService: UserService,  // ✅ Injecter UserService
        private router: Router
    ) {}

    ngOnInit() {
        this.authService.getProfile().subscribe({
            next: (updatedUser) => {
                this.authService.updateUserStorage(updatedUser);

                // ✅ Si un directeur est assigné, récupérer ses infos
                if (updatedUser.directeurId) {
                    this.loadDirecteurInfo(updatedUser.directeurId);
                }
            },
            error: (err) => console.error("Impossible de récupérer le profil", err)
        });
    }

    // ✅ NOUVELLE MÉTHODE: Charger les infos du directeur
    loadDirecteurInfo(directeurId: number): void {
        this.userService.getUserById(directeurId).subscribe({
            next: (directeur) => {
                if (directeur) {
                    this.directeurNom.set(`${directeur.prenom} ${directeur.nom}`);
                }
            },
            error: (err) => {
                console.error("Impossible de récupérer le directeur", err);
                this.directeurNom.set(`Directeur #${directeurId}`);
            }
        });
    }

    logout() { this.authService.logout(); }
    goToDashboard() { this.router.navigate(['/dashboard']); }

    isAdminPending(): boolean { const etat = this.user()?.etat; return !etat || etat === 'EN_ATTENTE_ADMIN'; }
    isDirectorPending(): boolean { return this.user()?.etat === 'EN_ATTENTE_DIRECTEUR'; }
    isRefuse(): boolean { return this.user()?.etat === 'REFUSE'; }
    isRefusedByAdmin(): boolean { if (this.user()?.etat !== 'REFUSE') return false; return !this.user()?.directeurId; }
    isRefusedByDirector(): boolean { if (this.user()?.etat !== 'REFUSE') return false; return !!this.user()?.directeurId; }
    isAdminApproved(): boolean { const etat = this.user()?.etat; return etat === 'EN_ATTENTE_DIRECTEUR' || etat === 'VALIDE' || this.isRefusedByDirector(); }
    isValide(): boolean { return this.user()?.etat === 'VALIDE' || this.user()?.role === 'DOCTORANT'; }
    getLineProgress(): string { if (this.isValide()) return '100%'; if (this.isDirectorPending()) return '100%'; if (this.isRefusedByDirector()) return '100%'; if (this.isRefusedByAdmin()) return '50%'; return '0%'; }
}