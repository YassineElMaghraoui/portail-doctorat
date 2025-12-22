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
      <div class="page-container">
        
        <!-- Header -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <div>
            <a routerLink="/inscriptions" class="text-decoration-none text-secondary mb-2 d-inline-block">
              <i class="bi bi-arrow-left"></i> Retour aux inscriptions
            </a>
            <h2 class="fw-bold mb-0">
              {{ isEditMode() ? 'Modifier mon dossier' : 'Nouvelle Candidature' }}
            </h2>
            <p class="text-muted">Remplissez le formulaire ci-dessous pour postuler au cycle doctoral.</p>
          </div>
        </div>

        <!-- Alerte Éligibilité (Blocage si besoin) -->
        @if (eligibilite() && !eligibilite()!.eligible) {
          <div class="alert alert-danger shadow-sm border-0">
            <div class="d-flex gap-3 align-items-center">
              <i class="bi bi-exclamation-octagon-fill fs-2"></i>
              <div>
                <h5 class="alert-heading fw-bold">Inscription impossible</h5>
                <p class="mb-0">{{ eligibilite()!.message }}</p>
                @if (eligibilite()!.derogationRequise && !eligibilite()!.derogationObtenue) {
                  <a routerLink="/derogations/nouvelle" class="btn btn-sm btn-light text-danger fw-bold mt-2">
                    Demander une dérogation
                  </a>
                }
              </div>
            </div>
          </div>
        }

        <!-- FORMULAIRE PRINCIPAL -->
        @if (eligibilite()?.eligible !== false) {
          <form [formGroup]="inscriptionForm" (ngSubmit)="onSubmit()">
            
            <!-- BLOC 1 : INFORMATIONS PERSONNELLES (Lecture seule) -->
            <div class="card shadow-sm border-0 mb-4">
              <div class="card-header bg-white py-3">
                <h5 class="mb-0 text-primary"><i class="bi bi-person-vcard me-2"></i>Informations Personnelles</h5>
              </div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-md-4">
                    <label class="form-label text-muted small fw-bold">Nom complet</label>
                    <input type="text" class="form-control bg-light" [value]="currentUserName" disabled>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label text-muted small fw-bold">Email</label>
                    <input type="text" class="form-control bg-light" [value]="currentUserEmail" disabled>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label text-muted small fw-bold">Téléphone</label>
                    <input type="text" class="form-control bg-light" [value]="currentUserPhone || 'Non renseigné'" disabled>
                  </div>
                </div>
              </div>
            </div>

            <!-- BLOC 2 : DONNÉES ACADÉMIQUES -->
            <div class="card shadow-sm border-0 mb-4">
              <div class="card-header bg-white py-3">
                <h5 class="mb-0 text-primary"><i class="bi bi-mortarboard me-2"></i>Projet de Thèse</h5>
              </div>
              <div class="card-body">
                
                @if (errorMessage()) {
                  <div class="alert alert-danger mb-3">{{ errorMessage() }}</div>
                }

                <div class="row g-3 mb-3">
                  <div class="col-md-6">
                    <label class="form-label fw-bold">Campagne d'inscription *</label>
                    <select class="form-select" formControlName="campagneId">
                      <option value="">-- Sélectionner --</option>
                      @for (campagne of campagnes(); track campagne.id) {
                        <option [value]="campagne.id">
                          {{ campagne.anneeUniversitaire }} - {{ campagne.titre }}
                        </option>
                      }
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label fw-bold">Type d'inscription *</label>
                    <select class="form-select" formControlName="typeInscription">
                      <option value="PREMIERE_INSCRIPTION">Première inscription</option>
                      <option value="REINSCRIPTION">Réinscription</option>
                    </select>
                  </div>
                </div>

                <div class="mb-3">
                  <label class="form-label fw-bold">Sujet de thèse *</label>
                  <textarea class="form-control" rows="3" formControlName="sujetThese" 
                    placeholder="Intitulé complet du sujet de recherche..."></textarea>
                </div>

                <div class="row g-3 mb-3">
                  <div class="col-md-6">
                    <label class="form-label fw-bold">Laboratoire d'accueil *</label>
                    <input type="text" class="form-control" formControlName="laboratoireAccueil" placeholder="Ex: LISAC, LRI...">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label fw-bold">Collaboration externe</label>
                    <input type="text" class="form-control" formControlName="collaborationExterne" placeholder="Entreprise ou organisme (Optionnel)">
                  </div>
                </div>
                
                <div class="alert alert-info py-2 small">
                  <i class="bi bi-info-circle me-1"></i> Le directeur de thèse sera assigné par l'administration après étude du dossier.
                </div>
              </div>
            </div>

            <!-- BLOC 3 : PIÈCES JUSTIFICATIVES -->
            <div class="card shadow-sm border-0 mb-4">
              <div class="card-header bg-white py-3">
                <h5 class="mb-0 text-primary"><i class="bi bi-paperclip me-2"></i>Documents Requis</h5>
              </div>
              <div class="card-body">
                <div class="alert alert-light border mb-3">
                  <i class="bi bi-info-circle-fill text-info me-2"></i>
                  Veuillez téléverser : <strong>CV, Diplômes, Lettre de motivation, CIN.</strong> (PDF ou Images, Max 10Mo).
                </div>

                <div class="mb-3">
                  <label class="form-label fw-bold">Sélectionner les fichiers</label>
                  <input type="file" class="form-control" multiple (change)="onFileSelected($event)" accept=".pdf,.jpg,.jpeg,.png">
                </div>

                <!-- Liste des fichiers en cours d'upload -->
                @if (selectedFiles.length > 0) {
                  <ul class="list-group">
                    @for (file of selectedFiles; track file.name) {
                      <li class="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <i class="bi bi-file-earmark-check text-success me-2"></i>
                          {{ file.name }}
                          <span class="text-muted small ms-2">({{ (file.size / 1024 / 1024) | number:'1.2-2' }} MB)</span>
                        </div>
                        
                        <!-- Indicateur de statut -->
                        @if (isUploaded(file.name)) {
                          <span class="badge bg-success"><i class="bi bi-check"></i> Envoyé</span>
                        } @else {
                          <div class="spinner-border spinner-border-sm text-primary"></div>
                        }
                      </li>
                    }
                  </ul>
                } @else {
                    <div class="text-muted small fst-italic ps-1">Aucun document ajouté.</div>
                }
              </div>
            </div>

            <!-- ACTION BAR -->
            <div class="d-flex justify-content-end gap-3 pb-5">
              <button type="button" class="btn btn-lg btn-outline-secondary px-4" routerLink="/inscriptions">
                Annuler
              </button>
              <button type="submit" class="btn btn-lg btn-primary px-4" 
                [disabled]="isLoading() || inscriptionForm.invalid || isUploading">
                
                @if (isLoading()) {
                  <span class="spinner-border spinner-border-sm me-2"></span> Traitement...
                } @else if (isUploading) {
                  <span class="spinner-border spinner-border-sm me-2"></span> Envoi fichiers...
                } @else {
                  <i class="bi bi-send me-2"></i> 
                  {{ isEditMode() ? 'Mettre à jour' : 'Soumettre le dossier' }}
                }
              </button>
            </div>

          </form>
        }
      </div>
    </app-main-layout>
  `,
  styles: [`
    .page-container { max-width: 900px; margin: 0 auto; padding-top: 1rem; }
    .card-header { border-bottom: 1px solid rgba(0,0,0,0.05); }
  `]
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
  isUploading = false;
  uploadedFileNames: string[] = [];

  // Infos user (pour affichage lecture seule)
  currentUser = this.authService.currentUser();
  currentUserName = `${this.currentUser?.prenom} ${this.currentUser?.nom}`;
  currentUserEmail = this.currentUser?.email;
  currentUserPhone = this.currentUser?.telephone;

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
      collaborationExterne: ['']
      // ❌ CHAMP DIRECTEUR SUPPRIMÉ
    });
  }

  ngOnInit(): void {
    this.loadCampagnes();
    this.checkEligibilite();

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
    if (this.currentUser?.id) {
      this.derogationService.verifierEligibilite(this.currentUser.id).subscribe({
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
          typeInscription: data.typeInscription,
          campagneId: data.campagne?.id
        });
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMessage.set('Impossible de charger le dossier');
        this.isLoading.set(false);
      }
    });
  }

  // --- GESTION FICHIERS (UPLOAD) ---

  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.isUploading = true;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

        if (validTypes.includes(file.type)) {
          this.selectedFiles.push(file);
          this.uploadFile(file);
        } else {
          alert(`Format invalide pour "${file.name}". PDF ou Images uniquement.`);
        }
      }
    }
  }

  uploadFile(file: File): void {
    this.documentService.upload(file).subscribe({
      next: (response: any) => {
        if (response && response.id) {
          this.uploadedDocIds.push(response.id);
          this.uploadedFileNames.push(file.name);

          if (this.uploadedFileNames.length === this.selectedFiles.length) {
            this.isUploading = false;
          }
        }
      },
      error: () => {
        alert("Erreur technique lors de l'envoi de " + file.name);
        this.isUploading = false;
      }
    });
  }

  isUploaded(fileName: string): boolean {
    return this.uploadedFileNames.includes(fileName);
  }

  // --- SOUMISSION ---

  onSubmit(): void {
    if (this.inscriptionForm.invalid) {
      this.inscriptionForm.markAllAsTouched();
      return;
    }

    if (this.isUploading) {
      alert("Veuillez attendre la fin du téléversement des fichiers.");
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const userId = this.currentUser?.id;
    const formValue = this.inscriptionForm.value;

    const request = {
      doctorantId: userId!,
      // Note: Pas de directeurId, le backend mettra null par défaut
      campagne: { id: Number(formValue.campagneId) },
      sujetThese: formValue.sujetThese,
      laboratoireAccueil: formValue.laboratoireAccueil,
      collaborationExterne: formValue.collaborationExterne,
      typeInscription: formValue.typeInscription as TypeInscription,

      // Liaison des documents uploadés
      documents: this.uploadedDocIds.map(id => ({ id: id }))
    };

    const operation = (this.isEditMode() && this.currentInscriptionId)
        ? this.inscriptionService.update(this.currentInscriptionId, request as any)
        : this.inscriptionService.create(request as any);

    operation.subscribe({
      next: () => {
        if (!this.isEditMode()) {
          if(confirm("Dossier enregistré en BROUILLON.\nVoulez-vous le soumettre définitivement à l'administration ?")) {
            this.router.navigate(['/inscriptions']);
          } else {
            this.router.navigate(['/inscriptions']);
          }
        } else {
          this.router.navigate(['/inscriptions']);
        }
      },
      error: () => {
        this.errorMessage.set('Une erreur est survenue lors de l\'enregistrement.');
        this.isLoading.set(false);
      }
    });
  }
}