import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '@core/services/user.service';
import { User } from '@core/models/user.model';
import { MainLayoutComponent } from '@shared/components/main-layout/main-layout.component';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MainLayoutComponent,
    RouterLink
  ],
  template: `
    <app-main-layout>
      <div class="page-container p-4">

        <!-- EN-TÊTE -->
        <div class="d-flex justify-content-between align-items-center mb-5">
          <div>
            <h2 class="fw-bold text-dark mb-1">Gestion des Utilisateurs</h2>
            <p class="text-muted mb-0">Validez les inscriptions et gérez les comptes académiques.</p>
          </div>
          <button class="btn btn-light text-primary fw-bold shadow-sm rounded-pill px-4" (click)="loadData()">
            <i class="bi bi-arrow-clockwise me-2"></i> Actualiser
          </button>
        </div>

        <!-- SWITCHER -->
        <div class="switcher-container mb-5">
          <div class="switcher">
            <button class="switcher-btn" [class.active]="activeTab === 'CANDIDATS'" (click)="setTab('CANDIDATS')">
              <i class="bi bi-person-lines-fill me-2"></i> Candidatures
              <span *ngIf="candidats().length > 0"
                    class="badge bg-white text-danger ms-2 shadow-sm rounded-pill">
                {{ candidats().length }}
              </span>
            </button>
            <button class="switcher-btn" [class.active]="activeTab === 'DIRECTEURS'" (click)="setTab('DIRECTEURS')">
              <i class="bi bi-person-video3 me-2"></i> Directeurs de Thèse
            </button>
          </div>
        </div>

        <!-- ==================== SECTION CANDIDATS ==================== -->
        @if (activeTab === 'CANDIDATS') {
          <div class="card border-0 shadow-sm rounded-4 overflow-hidden fade-in">
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="bg-light">
                <tr>
                  <th class="ps-4 py-3 text-uppercase small fw-bold text-muted">Candidat</th>
                  <th class="text-uppercase small fw-bold text-muted">Contact</th>
                  <th class="text-uppercase small fw-bold text-muted">Date Inscription</th>
                  <th class="text-end pe-4 text-uppercase small fw-bold text-muted">Décision</th>
                </tr>
                </thead>
                <tbody>
                  @for (user of candidats(); track user.id) {
                    <tr>
                      <td class="ps-4">
                        <div class="d-flex align-items-center">
                          <div class="avatar-circle bg-gradient-orange me-3 text-white shadow-sm">
                            {{ user.nom.charAt(0).toUpperCase() }}
                          </div>
                          <div>
                            <div class="fw-bold text-dark">{{ user.nom }} {{ user.prenom }}</div>
                            <div class="small text-muted font-monospace">
                              <i class="bi bi-card-heading me-1"></i>{{ user.username }}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div class="text-dark mb-1">{{ user.email }}</div>
                        <div *ngIf="user.telephone" class="small text-muted">
                          <i class="bi bi-phone me-1"></i>{{ user.telephone }}
                        </div>
                      </td>
                      <td>
                        <span class="badge bg-light text-dark border">
                          {{ user.createdAt ? (user.createdAt | date:'dd MMM yyyy') : 'N/A' }}
                        </span>
                      </td>
                      <td class="text-end pe-4">
                        <div class="d-flex gap-2 justify-content-end">
                          <button class="btn btn-success btn-sm px-3 shadow-sm rounded-pill"
                                  (click)="accepterCandidat(user)">
                            <i class="bi bi-check-lg"></i> Valider
                          </button>
                          <button class="btn btn-outline-danger btn-sm px-3 shadow-sm rounded-pill"
                                  (click)="refuserCandidat(user)">
                            <i class="bi bi-x-lg"></i> Refuser
                          </button>
                        </div>
                      </td>
                    </tr>
                  }

                  @if (candidats().length === 0) {
                    <tr>
                      <td colspan="4" class="text-center py-5">
                        <div class="icon-box bg-light mb-3 rounded-circle mx-auto">
                          <i class="bi bi-inbox fs-2 text-muted"></i>
                        </div>
                        <h6 class="fw-bold text-muted">Aucune candidature</h6>
                        <span class="small text-muted">Tout est à jour.</span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }

        <!-- ==================== SECTION DIRECTEURS ==================== -->
        @if (activeTab === 'DIRECTEURS') {
          <div class="card border-0 shadow-sm rounded-4 overflow-hidden fade-in">
            <div class="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center pe-4">
              <h5 class="mb-0 fw-bold text-primary ps-2">
                <i class="bi bi-list-ul me-2"></i> Liste des Directeurs
                <span class="badge bg-primary-subtle text-primary rounded-pill ms-2">
                  {{ directeurs().length }}
                </span>
              </h5>

              <!-- 🔴 BOUTON AJOUTER DIRECTEUR (CORRIGÉ) -->
              <a [routerLink]="['/admin/users/new-director']"
                 class="btn btn-primary btn-sm rounded-circle shadow-sm d-flex align-items-center justify-content-center"
                 style="width: 32px; height: 32px;"
                 title="Ajouter un directeur">
                <i class="bi bi-plus-lg"></i>
              </a>
            </div>

            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                  <thead class="bg-light">
                  <tr>
                    <th class="ps-4 py-3 text-uppercase small fw-bold text-muted">Identité</th>
                    <th class="text-uppercase small fw-bold text-muted">Email</th>
                    <th class="text-end pe-4 text-uppercase small fw-bold text-muted">ID Système</th>
                  </tr>
                  </thead>
                  <tbody>
                    @for (dir of directeurs(); track dir.id) {
                      <tr>
                        <td class="ps-4">
                          <div class="d-flex align-items-center">
                            <div class="avatar-sm bg-primary-subtle text-primary me-3 rounded-3">
                              <i class="bi bi-person-video3"></i>
                            </div>
                            <span class="fw-bold text-dark">{{ dir.nom }} {{ dir.prenom }}</span>
                          </div>
                        </td>
                        <td class="text-muted">{{ dir.email }}</td>
                        <td class="text-end pe-4">
                          <span class="badge bg-light text-secondary border">#{{ dir.id }}</span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

      </div>
    </app-main-layout>
  `,
  styles: [`
    .switcher-container {
      background-color: #e2e8f0;
      padding: 5px;
      border-radius: 16px;
      display: inline-block;
      width: 100%;
      max-width: 600px;
    }
    .switcher { display: flex; }
    .switcher-btn {
      flex: 1;
      background: transparent;
      border: none;
      padding: 12px 20px;
      font-weight: 600;
      color: #64748b;
      border-radius: 12px;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .switcher-btn.active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .avatar-circle {
      width: 45px;
      height: 45px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
    }
    .bg-gradient-orange {
      background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
    }
    .avatar-sm {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class UserManagementComponent implements OnInit {

  activeTab = 'CANDIDATS';

  candidats = signal<User[]>([]);
  directeurs = signal<User[]>([]);

  directeurForm: FormGroup;

  constructor(
      private userService: UserService,
      private fb: FormBuilder
  ) {
    this.directeurForm = this.fb.group({});
  }

  ngOnInit(): void {
    this.loadData();
  }

  setTab(tab: string): void {
    this.activeTab = tab;
    this.loadData();
  }

  loadData(): void {
    this.userService.getUsersByRole('CANDIDAT').subscribe({
      next: users => this.candidats.set(users),
      error: err => console.error(err)
    });

    this.userService.getUsersByRole('DIRECTEUR_THESE').subscribe({
      next: users => this.directeurs.set(users),
      error: err => console.error(err)
    });
  }

  accepterCandidat(user: User): void {
    if (confirm(`Activer le compte de ${user.nom} ${user.prenom} ?`)) {
      this.userService.updateRole(user.id, 'DOCTORANT').subscribe({
        next: () => {
          alert('Candidat validé avec succès !');
          this.loadData();
        },
        error: () => alert("Erreur lors de l'activation.")
      });
    }
  }

  refuserCandidat(user: User): void {
    if (confirm(`Êtes-vous sûr de vouloir rejeter et supprimer la candidature de ${user.nom} ?`)) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          alert('Candidature rejetée.');
          this.loadData();
        },
        error: () => alert("Erreur lors de la suppression")
      });
    }
  }
}
