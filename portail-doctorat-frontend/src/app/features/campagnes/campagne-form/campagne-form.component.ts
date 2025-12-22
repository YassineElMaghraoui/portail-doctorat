import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MainLayoutComponent } from '@shared/components/main-layout/main-layout.component';
import { InscriptionService } from '@core/services/inscription.service';
import { Campagne } from '@core/models/inscription.model';

@Component({
    selector: 'app-campagne-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterLink, MainLayoutComponent],
    template: `
    <app-main-layout>
      <div class="page-container p-4">
        
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <a routerLink="/campagnes" class="text-decoration-none text-secondary mb-2 d-inline-block">
              <i class="bi bi-arrow-left"></i> Retour
            </a>
            <h2 class="fw-bold mb-0">{{ isEditMode() ? 'Modifier la campagne' : 'Nouvelle campagne' }}</h2>
          </div>
        </div>

        <div class="card shadow-sm border-0" style="max-width: 800px; margin: 0 auto;">
          <div class="card-body p-4">
            
            <form [formGroup]="campagneForm" (ngSubmit)="onSubmit()">
              
              <div class="row g-3 mb-3">
                <div class="col-md-8">
                  <label class="form-label fw-bold">Titre de la campagne</label>
                  <input type="text" class="form-control" formControlName="titre" placeholder="Ex: Doctorat 2025-2026">
                </div>
                <div class="col-md-4">
                  <label class="form-label fw-bold">Année Universitaire</label>
                  <input type="text" class="form-control" formControlName="anneeUniversitaire" placeholder="Ex: 2025-2026">
                </div>
              </div>

              <div class="row g-3 mb-4">
                <div class="col-md-6">
                  <label class="form-label fw-bold">Date d'ouverture</label>
                  <input type="date" class="form-control" formControlName="dateDebut">
                </div>
                <div class="col-md-6">
                  <label class="form-label fw-bold">Date de fermeture</label>
                  <input type="date" class="form-control" formControlName="dateFin">
                </div>
              </div>

              <div class="d-flex justify-content-end gap-2 pt-3 border-top">
                <button type="button" class="btn btn-light border" routerLink="/campagnes">Annuler</button>
                <button type="submit" class="btn btn-primary px-4" [disabled]="campagneForm.invalid || isLoading()">
                  @if (isLoading()) { <span class="spinner-border spinner-border-sm me-2"></span> }
                  {{ isEditMode() ? 'Mettre à jour' : 'Créer la campagne' }}
                </button>
              </div>

            </form>

          </div>
        </div>
      </div>
    </app-main-layout>
  `
})
export class CampagneFormComponent implements OnInit {
    campagneForm: FormGroup;
    isEditMode = signal(false);
    isLoading = signal(false);
    currentId: number | null = null;

    constructor(
        private fb: FormBuilder,
        private inscriptionService: InscriptionService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        this.campagneForm = this.fb.group({
            titre: ['', Validators.required],
            anneeUniversitaire: ['', Validators.required],
            dateDebut: ['', Validators.required],
            dateFin: ['', Validators.required],
            active: [true]
        });
    }

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.isEditMode.set(true);
            this.currentId = +id;
            this.loadCampagne(this.currentId);
        }
    }

    loadCampagne(id: number) {
        this.inscriptionService.getCampagneById(id).subscribe(data => {
            // Formatage des dates pour l'input type="date" (yyyy-MM-dd)
            const formattedData = {
                ...data,
                dateDebut: data.dateDebut ? new Date(data.dateDebut).toISOString().split('T')[0] : '',
                dateFin: data.dateFin ? new Date(data.dateFin).toISOString().split('T')[0] : ''
            };
            this.campagneForm.patchValue(formattedData);
        });
    }

    onSubmit() {
        if (this.campagneForm.invalid) return;
        this.isLoading.set(true);

        const request = this.campagneForm.value;

        const operation = this.isEditMode() && this.currentId
            ? this.inscriptionService.updateCampagne(this.currentId, request)
            : this.inscriptionService.createCampagne(request);

        operation.subscribe({
            next: () => {
                this.router.navigate(['/campagnes']);
            },
            error: () => {
                alert("Erreur lors de l'enregistrement");
                this.isLoading.set(false);
            }
        });
    }
}