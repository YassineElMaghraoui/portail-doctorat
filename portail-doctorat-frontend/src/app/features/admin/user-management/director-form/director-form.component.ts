import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '@core/services/user.service';
import { MainLayoutComponent } from '@shared/components/main-layout/main-layout.component';

@Component({
    selector: 'app-director-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink, MainLayoutComponent],
    template: `
        <app-main-layout>
            <div class="page-container p-4">

                <!-- Header -->
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <a routerLink="/admin/users" class="text-decoration-none text-secondary mb-2 d-inline-block">
                            <i class="bi bi-arrow-left"></i> Retour à la liste
                        </a>
                        <h2 class="fw-bold mb-0 text-dark">Nouveau Directeur de Thèse</h2>
                    </div>
                </div>

                <div class="card shadow-lg border-0 rounded-4" style="max-width: 700px; margin: 0 auto;">
                    <div class="card-header bg-gradient-primary text-white p-4 rounded-top-4">
                        <h5 class="mb-0 fw-bold"><i class="bi bi-person-badge-fill me-2"></i>Informations du Professeur</h5>
                        <p class="mb-0 text-white-50 small">Créez un compte d'accès pour un encadrant.</p>
                    </div>

                    <div class="card-body p-4">
                        <form [formGroup]="directeurForm" (ngSubmit)="onSubmit()">

                            <div class="row g-3 mb-3">
                                <div class="col-md-6">
                                    <label class="form-label fw-bold small text-uppercase text-muted">Nom</label>
                                    <input type="text" class="form-control" formControlName="nom" placeholder="Ex: Alaoui">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold small text-uppercase text-muted">Prénom</label>
                                    <input type="text" class="form-control" formControlName="prenom" placeholder="Ex: Ahmed">
                                </div>
                            </div>

                            <div class="mb-3">
                                <label class="form-label fw-bold small text-uppercase text-muted">Email Professionnel</label>
                                <div class="input-group">
                                    <span class="input-group-text bg-light"><i class="bi bi-envelope"></i></span>
                                    <input type="email" class="form-control" formControlName="email" placeholder="professeur@univ.ma">
                                </div>
                            </div>

                            <div class="row g-3 mb-4">
                                <div class="col-md-6">
                                    <label class="form-label fw-bold small text-uppercase text-muted">Matricule / Username</label>
                                    <input type="text" class="form-control" formControlName="username" placeholder="p.alaoui">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label fw-bold small text-uppercase text-muted">Mot de passe provisoire</label>
                                    <input type="text" class="form-control" formControlName="password" placeholder="******">
                                </div>
                            </div>

                            <div class="d-flex justify-content-end gap-2 pt-3 border-top">
                                <button type="button" class="btn btn-light border" routerLink="/admin/users">Annuler</button>
                                <button type="submit" class="btn btn-primary px-4 shadow-sm" [disabled]="directeurForm.invalid || isLoading()">
                                    <!-- Utilisation de @if (Angular 17+) ou *ngIf -->
                                    <span *ngIf="isLoading()" class="spinner-border spinner-border-sm me-2"></span>
                                    Créer le compte
                                </button>
                            </div>

                        </form>
                    </div>
                </div>

            </div>
        </app-main-layout>
    `,
    styles: [`
      .bg-gradient-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
      .form-control:focus { border-color: #8b5cf6; box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1); }
    `]
})
export class DirectorFormComponent {
    directeurForm: FormGroup;
    isLoading = signal(false);

    constructor(
        private fb: FormBuilder,
        private userService: UserService,
        private router: Router
    ) {
        this.directeurForm = this.fb.group({
            nom: ['', Validators.required],
            prenom: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            username: ['', Validators.required],
            password: ['', [Validators.required, Validators.minLength(6)]]
        });
    }

    onSubmit() {
        if (this.directeurForm.invalid) return;
        this.isLoading.set(true);

        const formValues = this.directeurForm.value;

        // Construction de l'objet utilisateur
        const newUser = {
            nom: formValues.nom,
            prenom: formValues.prenom,
            email: formValues.email,
            password: formValues.password,
            matricule: formValues.username,  // Le backend attend 'matricule'
            username: formValues.username,   // On garde username au cas où
            telephone: "",                   // Champ non présent dans le formulaire, on met vide
            role: 'DIRECTEUR_THESE',
            enabled: true
        };

        console.log("Envoi du nouveau directeur :", newUser);

        // ✅ CORRECTION ICI : Ajout de "as any" pour éviter l'erreur TS2345 (ID manquant)
        this.userService.createUser(newUser as any).subscribe({
            next: () => {
                alert("Compte Directeur créé avec succès !");
                this.router.navigate(['/admin/users']);
            },
            error: (err) => {
                console.error("Erreur création :", err);
                const errorMsg = err.error?.message || err.message || "Impossible de créer le compte";
                alert("Erreur : " + errorMsg);
                this.isLoading.set(false);
            }
        });
    }
}