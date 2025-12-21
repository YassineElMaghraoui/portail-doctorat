import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MainLayoutComponent } from '@shared/components/main-layout/main-layout.component';
import { AuthService } from '@core/services/auth.service';
import { InscriptionService } from '@core/services/inscription.service';
import { DerogationService } from '@core/services/derogation.service';
import { Campagne, TypeInscription } from '@core/models/inscription.model';
import { EligibiliteReinscription } from '@core/models/derogation.model';

@Component({
  selector: 'app-inscription-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MainLayoutComponent],
  template: `
    <app-main-layout>
      <div class="page">
        <header class="page-header">
          <a routerLink="/inscriptions" class="back-link">
            <i class="bi bi-arrow-left"></i> Retour
          </a>
          <h1>Nouvelle inscription</h1>
          <p class="text-muted">Remplissez le formulaire pour créer votre demande d'inscription</p>
        </header>

        <!-- Alerte si dérogation requise -->
        @if (eligibilite() && !eligibilite()!.eligible) {
          <div class="alert alert-danger">
            <i class="bi bi-exclamation-octagon"></i>
            <div>
              <strong>Inscription impossible</strong>
              <p>{{ eligibilite()!.message }}</p>
              @if (eligibilite()!.derogationRequise && !eligibilite()!.derogationObtenue) {
                <a routerLink="/derogations/nouvelle" class="btn btn-sm btn-danger mt-2">
                  Demander une dérogation
                </a>
              }
            </div>
          </div>
        }

        @if (eligibilite()?.eligible !== false) {
          <div class="card">
            <div class="card-body">
              @if (errorMessage()) {
                <div class="alert alert-danger mb-4">{{ errorMessage() }}</div>
              }

              <form [formGroup]="inscriptionForm" (ngSubmit)="onSubmit()">
                <!-- Campagne -->
                <div class="form-group">
                  <label class="form-label">Campagne d'inscription *</label>
                  <select class="form-control form-select" formControlName="campagneId">
                    <option value="">Sélectionnez une campagne</option>
                    @for (campagne of campagnes(); track campagne.id) {
                      <option [value]="campagne.id">
                        {{ campagne.anneeUniversitaire }} - {{ campagne.titre }}
                      </option>
                    }
                  </select>
                </div>

                <!-- Type d'inscription -->
                <div class="form-group">
                  <label class="form-label">Type d'inscription *</label>
                  <select class="form-control form-select" formControlName="typeInscription">
                    <option value="PREMIERE_INSCRIPTION">Première inscription</option>
                    <option value="REINSCRIPTION">Réinscription</option>
                  </select>
                </div>

                <!-- Sujet de thèse -->
                <div class="form-group">
                  <label class="form-label">Sujet de thèse *</label>
                  <textarea
                    class="form-control"
                    formControlName="sujetThese"
                    rows="3"
                    placeholder="Décrivez votre sujet de thèse"
                  ></textarea>
                </div>

                <!-- Laboratoire -->
                <div class="form-group">
                  <label class="form-label">Laboratoire d'accueil *</label>
                  <input
                    type="text"
                    class="form-control"
                    formControlName="laboratoireAccueil"
                    placeholder="Ex: LISAC, LRI, etc."
                  />
                </div>

                <!-- Collaboration externe -->
                <div class="form-group">
                  <label class="form-label">Collaboration externe (optionnel)</label>
                  <input
                    type="text"
                    class="form-control"
                    formControlName="collaborationExterne"
                    placeholder="Entreprise ou institution partenaire"
                  />
                </div>

                <!-- Directeur de thèse -->
                <div class="form-group">
                  <label class="form-label">ID du directeur de thèse *</label>
                  <input
                    type="number"
                    class="form-control"
                    formControlName="directeurId"
                    placeholder="ID du directeur"
                  />
                  <small class="form-text">Entrez l'ID de votre directeur de thèse</small>
                </div>

                <!-- Actions -->
                <div class="form-actions">
                  <button type="button" class="btn btn-outline" (click)="saveDraft()" [disabled]="isLoading()">
                    <i class="bi bi-save"></i>
                    Enregistrer brouillon
                  </button>
                  <button type="submit" class="btn btn-primary" [disabled]="isLoading() || inscriptionForm.invalid">
                    @if (isLoading()) {
                      <span class="spinner"></span>
                    }
                    <i class="bi bi-send"></i>
                    Soumettre
                  </button>
                </div>
              </form>
            </div>
          </div>
        }
      </div>
    </app-main-layout>
  `,
  styles: [`
    .page {
      max-width: 800px;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-muted);
      margin-bottom: 1rem;

      &:hover {
        color: var(--primary-color);
      }
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
    }

    .alert {
      display: flex;
      gap: 1rem;
      align-items: flex-start;

      i {
        font-size: 1.5rem;
      }

      p {
        margin: 0.5rem 0;
      }
    }
  `]
})
export class InscriptionFormComponent implements OnInit {
  inscriptionForm: FormGroup;
  campagnes = signal<Campagne[]>([]);
  eligibilite = signal<EligibiliteReinscription | null>(null);
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private inscriptionService: InscriptionService,
    private derogationService: DerogationService
  ) {
    this.inscriptionForm = this.fb.group({
      campagneId: ['', Validators.required],
      typeInscription: ['PREMIERE_INSCRIPTION', Validators.required],
      sujetThese: ['', [Validators.required, Validators.minLength(20)]],
      laboratoireAccueil: ['', Validators.required],
      collaborationExterne: [''],
      directeurId: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadCampagnes();
    this.checkEligibilite();
  }

  private loadCampagnes(): void {
    this.inscriptionService.getAllCampagnes().subscribe({
      next: (data) => {
        this.campagnes.set(data.filter(c => c.active));
      }
    });
  }

  private checkEligibilite(): void {
    const userId = this.authService.currentUser()?.id;
    if (userId) {
      this.derogationService.verifierEligibilite(userId).subscribe({
        next: (data) => this.eligibilite.set(data)
      });
    }
  }

  saveDraft(): void {
    this.submitInscription(false);
  }

  onSubmit(): void {
    if (this.inscriptionForm.invalid) {
      this.inscriptionForm.markAllAsTouched();
      return;
    }
    this.submitInscription(true);
  }

  private submitInscription(submit: boolean): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    const userId = this.authService.currentUser()?.id;
    const formValue = this.inscriptionForm.value;

    const request = {
      doctorantId: userId!,
      directeurId: Number(formValue.directeurId),
      campagneId: Number(formValue.campagneId),
      sujetThese: formValue.sujetThese,
      laboratoireAccueil: formValue.laboratoireAccueil,
      collaborationExterne: formValue.collaborationExterne,
      typeInscription: formValue.typeInscription as TypeInscription
    };

    this.inscriptionService.create(request).subscribe({
      next: (inscription) => {
        if (submit) {
          this.inscriptionService.soumettre(inscription.id).subscribe({
            next: () => this.router.navigate(['/inscriptions']),
            error: (err) => {
              this.errorMessage.set(err.error?.message || 'Erreur lors de la soumission');
              this.isLoading.set(false);
            }
          });
        } else {
          this.router.navigate(['/inscriptions']);
        }
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Erreur lors de la création');
        this.isLoading.set(false);
      }
    });
  }
}
