import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { MainLayoutComponent } from '@shared/components/main-layout/main-layout.component';
import { AuthService } from '@core/services/auth.service';
import { InscriptionService } from '@core/services/inscription.service';
import { DerogationService } from '@core/services/derogation.service';
import { DocumentService } from '@core/services/document.service';
import { Campagne, TypeInscription, Inscription } from '@core/models/inscription.model';
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
            <i class="bi bi-arrow-left"></i> Retour aux inscriptions
          </a>
          <h1>
            {{ isEditMode() ? 'Modifier l’inscription' : 'Nouvelle inscription' }}
          </h1>
          <p class="text-muted">
            {{ isEditMode()
              ? 'Mettez à jour les informations de votre dossier.'
              : 'Remplissez le formulaire ci-dessous pour candidater.' }}
          </p>
        </header>

        <!-- ALERTE ELIGIBILITE -->
        @if (eligibilite() && !eligibilite()!.eligible) {
          <div class="alert alert-danger shadow-sm">
            <div class="d-flex gap-3">
              <i class="bi bi-exclamation-octagon-fill fs-4"></i>
              <div>
                <h5 class="alert-heading">Inscription impossible</h5>
                <p class="mb-0">{{ eligibilite()!.message }}</p>
                @if (eligibilite()!.derogationRequise && !eligibilite()!.derogationObtenue) {
                  <a routerLink="/derogations/nouvelle" class="btn btn-sm btn-outline-danger mt-2">
                    Effectuer une demande de dérogation
                  </a>
                }
              </div>
            </div>
          </div>
        }

        <!-- FORMULAIRE (Si éligible) -->
        @if (eligibilite()?.eligible !== false) {
          <div class="card shadow-sm border-0">
            <div class="card-body p-4">

              @if (errorMessage()) {
                <div class="alert alert-danger mb-4">{{ errorMessage() }}</div>
              }

              <form [formGroup]="inscriptionForm" (ngSubmit)="onSubmit()">

                <!-- 1. INFO ACADEMIQUES -->
                <h5 class="text-primary border-bottom pb-2 mb-3">1. Informations Académiques</h5>
                <div class="row g-3 mb-4">
                  <div class="col-md-6">
                    <label class="form-label fw-bold">Campagne *</label>
                    <select class="form-control form-select" formControlName="campagneId">
                      <option value="">-- Choisir une campagne --</option>
                      @for (campagne of campagnes(); track campagne.id) {
                        <option [value]="campagne.id">
                          {{ campagne.anneeUniversitaire }} - {{ campagne.titre }}
                        </option>
                      }
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label fw-bold">Type d'inscription *</label>
                    <select class="form-control form-select" formControlName="typeInscription">
                      <option value="PREMIERE_INSCRIPTION">Première inscription</option>
                      <option value="REINSCRIPTION">Réinscription</option>
                    </select>
                  </div>
                </div>

                <!-- 2. INFO THESE -->
                <h5 class="text-primary border-bottom pb-2 mb-3">2. Thèse et Encadrement</h5>
                <div class="mb-3">
                  <label class="form-label fw-bold">Sujet de thèse *</label>
                  <textarea class="form-control" rows="3" formControlName="sujetThese"
                            placeholder="Intitulé complet du sujet de thèse..."></textarea>
                </div>

                <div class="row g-3 mb-3">
                  <div class="col-md-6">
                    <label class="form-label fw-bold">Laboratoire d'accueil *</label>
                    <input class="form-control" formControlName="laboratoireAccueil" placeholder="Ex: LISAC" />
                  </div>
                  <div class="col-md-6">
                    <label class="form-label fw-bold">ID Directeur de thèse *</label>
                    <input type="number" class="form-control" formControlName="directeurId" placeholder="ID numérique (Ex: 25)" />
                    <div class="form-text">Demandez cet ID à votre directeur.</div>
                  </div>
                </div>

                <div class="mb-4">
                  <label class="form-label fw-bold">Collaboration externe</label>
                  <input class="form-control" formControlName="collaborationExterne" placeholder="Entreprise ou Organisme (Optionnel)" />
                </div>

                <!-- 3. DOCUMENTS (UPLOAD) -->
                <h5 class="text-primary border-bottom pb-2 mb-3">3. Pièces Justificatives</h5>
                <div class="bg-light p-3 rounded mb-4 border">
                  <div class="mb-3">
                    <label class="form-label fw-bold">Ajouter des fichiers</label>
                    <input type="file" class="form-control" multiple (change)="onFileSelected($event)" accept=".pdf,.jpg,.jpeg,.png">
                    <div class="form-text">
                      <i class="bi bi-info-circle"></i> CV, Diplômes, CIN. (PDF/JPG, Max 5Mo).
                    </div>
                  </div>

                  <!-- Liste des fichiers -->
                  @if (selectedFiles.length > 0) {
                    <ul class="list-group">
                      @for (file of selectedFiles; track file.name) {
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                          <span class="text-truncate">
                            <i class="bi bi-file-earmark-check-fill text-success me-2"></i>{{ file.name }}
                          </span>
                          <span class="badge bg-secondary">{{ (file.size / 1024 / 1024) | number:'1.2-2' }} MB</span>
                        </li>
                      }
                    </ul>
                  } @else {
                    <div class="text-muted small fst-italic">Aucun fichier sélectionné pour le moment.</div>
                  }
                </div>

                <!-- BOUTONS -->
                <div class="d-flex justify-content-end gap-2 pt-3 border-top">
                  <button type="button" class="btn btn-light border" routerLink="/inscriptions">Annuler</button>
                  <button type="submit" class="btn btn-primary px-4" [disabled]="isLoading() || inscriptionForm.invalid">
                    @if (isLoading()) {
                      <span class="spinner-border spinner-border-sm me-2"></span> Traitement...
                    } @else {
                      <i class="bi bi-save me-2"></i> {{ isEditMode() ? 'Mettre à jour' : 'Enregistrer le brouillon' }}
                    }
                  </button>
                </div>

              </form>
            </div>
          </div>
        }
      </div>
    </app-main-layout>
  `
})
export class InscriptionFormComponent implements OnInit {
  inscriptionForm: FormGroup;
  campagnes = signal<Campagne[]>([]);
  eligibilite = signal<EligibiliteReinscription | null>(null);
  isLoading = signal(false);
  errorMessage = signal('');
  isEditMode = signal(false);
  currentInscriptionId: number | null = null;

  // Gestion des fichiers
  selectedFiles: File[] = [];
  uploadedDocIds: number[] = [];

  constructor(
      private fb: FormBuilder,
      private router: Router,
      private route: ActivatedRoute,
      private authService: AuthService,
      private inscriptionService: InscriptionService,
      private derogationService: DerogationService,
      private documentService: DocumentService
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

    // Mode édition ?
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.currentInscriptionId = +id;
      this.loadInscriptionData(+id);
    }
  }

  private loadCampagnes(): void {
    this.inscriptionService.getAllCampagnes().subscribe({
      next: data => this.campagnes.set(data.filter(c => c.active))
    });
  }

  private checkEligibilite(): void {
    const userId = this.authService.currentUser()?.id;
    if (userId) {
      this.derogationService.verifierEligibilite(userId).subscribe({
        next: data => this.eligibilite.set(data)
      });
    }
  }

  private loadInscriptionData(id: number): void {
    this.isLoading.set(true);
    this.inscriptionService.getInscriptionById(id).subscribe({
      next: (data: Inscription) => {
        this.inscriptionForm.patchValue({
          sujetThese: data.sujetThese,
          laboratoireAccueil: data.laboratoireAccueil,
          collaborationExterne: data.collaborationExterne,
          directeurId: data.directeurId,
          typeInscription: data.typeInscription,
          campagneId: data.campagne?.id
        });
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Impossible de charger l’inscription');
        this.isLoading.set(false);
      }
    });
  }

  // --- GESTION FICHIERS ---

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

        if (validTypes.includes(file.type)) {
          this.selectedFiles.push(file);
          this.uploadFile(file); // Upload direct
        } else {
          alert(`Fichier "${file.name}" invalide. PDF/Images uniquement.`);
        }
      }
    }
  }

  uploadFile(file: File): void {
    this.documentService.upload(file).subscribe({
      next: (response: any) => {
        if (response && response.id) {
          this.uploadedDocIds.push(response.id);
          console.log('✅ Document uploadé ID:', response.id);
        }
      },
      error: () => {
        alert("Erreur upload fichier : " + file.name);
        this.selectedFiles = this.selectedFiles.filter(f => f !== file);
      }
    });
  }

  // --- SUBMIT ---

  onSubmit(): void {
    if (this.inscriptionForm.invalid) {
      this.inscriptionForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const userId = this.authService.currentUser()?.id;
    const formValue = this.inscriptionForm.value;

    const request = {
      doctorantId: userId!,
      directeurId: Number(formValue.directeurId),
      campagne: { id: Number(formValue.campagneId) },
      sujetThese: formValue.sujetThese,
      laboratoireAccueil: formValue.laboratoireAccueil,
      collaborationExterne: formValue.collaborationExterne,
      typeInscription: formValue.typeInscription as TypeInscription,
      // Ajout des documents au payload
      documents: this.uploadedDocIds.map(id => ({ id: id }))
    };

    const operation = (this.isEditMode() && this.currentInscriptionId)
        ? this.inscriptionService.update(this.currentInscriptionId, request as any)
        : this.inscriptionService.create(request as any);

    operation.subscribe({
      next: () => this.router.navigate(['/inscriptions']),
      error: () => {
        this.errorMessage.set(this.isEditMode() ? 'Erreur modification' : 'Erreur création');
        this.isLoading.set(false);
      }
    });
  }
}