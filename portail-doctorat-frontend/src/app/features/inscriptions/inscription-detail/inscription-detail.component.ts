import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MainLayoutComponent } from '@shared/components/main-layout/main-layout.component';
import { InscriptionService } from '@core/services/inscription.service';
import { AuthService } from '@core/services/auth.service';
import { Inscription, StatutInscription } from '@core/models/inscription.model';
import { Role } from '@core/models/user.model';

@Component({
  selector: 'app-inscription-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MainLayoutComponent],
  template: `
    <app-main-layout>
      <div class="container-fluid py-4">

        <!-- EN-TÊTE -->
        <div class="d-flex justify-content-between align-items-center mb-4">
          <button class="btn btn-outline-secondary" (click)="goBack()">
            <i class="bi bi-arrow-left"></i> Retour
          </button>

          <span class="badge fs-6 px-3 py-2" [ngClass]="getStatusClass(inscription()?.statut)">
            {{ inscription()?.statut }}
          </span>
        </div>

        @if (isLoading()) {
          <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2 text-muted">Chargement du dossier...</p>
          </div>
        } @else if (inscription()) {
          <div class="card shadow-sm border-0">

            <div class="card-header bg-white p-4 border-bottom">
              <h2 class="h4 mb-1">Détail de l'inscription</h2>
              <p class="text-muted small mb-0">
                Dossier n°{{ inscription()?.id }} • Créé le {{ inscription()?.createdAt | date:'dd/MM/yyyy à HH:mm' }}
              </p>
            </div>

            <div class="card-body p-4">

              <!-- INFOS GÉNÉRALES -->
              <h5 class="text-primary mb-3"><i class="bi bi-person-badge me-2"></i>Informations Générales</h5>
              <div class="row g-4 mb-4">
                <div class="col-md-6">
                  <label class="text-uppercase text-muted small fw-bold">Doctorant</label>
                  <div class="fs-5">{{ inscription()?.doctorantNom || 'Non renseigné' }}</div>
                </div>
                <div class="col-md-6">
                  <label class="text-uppercase text-muted small fw-bold">Type d'inscription</label>
                  <div class="fs-5">{{ inscription()?.typeInscription }}</div>
                </div>
                <div class="col-md-6">
                  <label class="text-uppercase text-muted small fw-bold">Année Universitaire</label>
                  <div class="fs-5">{{ inscription()?.campagne?.anneeUniversitaire || '2025-2026' }}</div>
                </div>
                <div class="col-md-6">
                  <label class="text-uppercase text-muted small fw-bold">Année de thèse</label>
                  <div class="fs-5">{{ inscription()?.anneeInscription || 1 }}ère année</div>
                </div>
              </div>

              <hr class="text-muted opacity-25">

              <!-- THÈSE -->
              <h5 class="text-primary mb-3 mt-4"><i class="bi bi-book me-2"></i>Thèse et Encadrement</h5>

              <div class="mb-4">
                <label class="text-uppercase text-muted small fw-bold">Sujet de thèse</label>
                <div class="p-3 bg-light border rounded mt-1">
                  {{ inscription()?.sujetThese }}
                </div>
              </div>

              <div class="row g-4">
                <div class="col-md-6">
                  <label class="text-uppercase text-muted small fw-bold">Laboratoire d'accueil</label>
                  <div class="fs-6">{{ inscription()?.laboratoireAccueil }}</div>
                </div>
                <div class="col-md-6">
                  <label class="text-uppercase text-muted small fw-bold">Directeur de thèse (ID)</label>
                  <div class="fs-6">{{ inscription()?.directeurId }}</div>
                </div>
                @if (inscription()?.collaborationExterne) {
                  <div class="col-12">
                    <label class="text-uppercase text-muted small fw-bold">Collaboration Externe</label>
                    <div class="fs-6">{{ inscription()?.collaborationExterne }}</div>
                  </div>
                }
              </div>

              <!-- COMMENTAIRES -->
              @if (inscription()?.commentaireDirecteur) {
                <div class="alert alert-info mt-4">
                  <strong><i class="bi bi-chat-quote-fill me-2"></i>Commentaire du Directeur :</strong><br>
                  {{ inscription()?.commentaireDirecteur }}
                </div>
              }
            </div>

            <!-- ACTIONS -->
            <div class="card-footer bg-light p-4 border-top">

              @if (canDirecteurValidate()) {
                <div class="d-flex flex-column align-items-end">
                  <p class="text-muted small mb-2"><i class="bi bi-info-circle me-1"></i> Action requise en tant que Directeur.</p>
                  <div class="d-flex gap-2">
                    <button class="btn btn-danger" (click)="rejeter()">
                      <i class="bi bi-x-circle me-2"></i> Refuser
                    </button>
                    <button class="btn btn-success" (click)="valider()">
                      <i class="bi bi-check-circle me-2"></i> Valider le dossier
                    </button>
                  </div>
                </div>
              } @else if (isStudentOwner() && isBrouillon()) {
                <div class="d-flex justify-content-end gap-2">
                  <a [routerLink]="['/inscriptions/modifier', inscription()?.id]" class="btn btn-outline-primary">
                    <i class="bi bi-pencil me-2"></i> Modifier
                  </a>
                  <button class="btn btn-primary" (click)="soumettre()">
                    <i class="bi bi-send me-2"></i> Soumettre
                  </button>
                </div>
              } @else {
                <div class="text-end text-muted small">
                  Aucune action requise pour le moment.
                </div>
              }
            </div>
          </div>
        }
      </div>
    </app-main-layout>
  `
})
export class InscriptionDetailComponent implements OnInit {
  inscription = signal<Inscription | null>(null);
  isLoading = signal(true);

  constructor(
      private route: ActivatedRoute,
      private router: Router,
      private inscriptionService: InscriptionService,
      private authService: AuthService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadInscription(+id);
    }
  }

  private loadInscription(id: number) {
    this.inscriptionService.getInscriptionById(id).subscribe({
      next: (data) => {
        this.inscription.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.goBack();
      }
    });
  }

  // --- LOGIQUE METIER ---

  isStudentOwner(): boolean {
    const user = this.authService.currentUser();
    return user?.id === this.inscription()?.doctorantId;
  }

  isBrouillon(): boolean {
    return this.inscription()?.statut === StatutInscription.BROUILLON;
  }

  canDirecteurValidate(): boolean {
    const user = this.authService.currentUser();
    const ins = this.inscription();
    return (
        user?.role === Role.DIRECTEUR_THESE &&
        user?.id === ins?.directeurId &&
        ins?.statut === StatutInscription.SOUMIS
    );
  }

  // --- ACTIONS ---

  valider() {
    if (confirm('Confirmer la validation ?')) {
      this.inscriptionService.validerParDirecteur(this.inscription()!.id, "Validé").subscribe({
        next: () => {
          alert('Validé !');
          this.router.navigate(['/validations']);
        }
      });
    }
  }

  rejeter() {
    const motif = prompt("Motif :");
    if (motif) {
      this.inscriptionService.rejeterParDirecteur(this.inscription()!.id, motif).subscribe({
        next: () => {
          alert('Rejeté.');
          this.router.navigate(['/validations']);
        }
      });
    }
  }

  soumettre() {
    if (confirm('Soumettre définitivement ?')) {
      this.inscriptionService.soumettre(this.inscription()!.id).subscribe({
        next: (upd) => this.inscription.set(upd)
      });
    }
  }

  goBack() {
    const user = this.authService.currentUser();
    if (user?.role === Role.DIRECTEUR_THESE) {
      this.router.navigate(['/validations']);
    } else {
      this.router.navigate(['/inscriptions']);
    }
  }

  getStatusClass(statut?: string): string {
    switch(statut) {
      case 'SOUMIS': return 'bg-warning text-dark';
      case 'VALIDE_DIRECTEUR': return 'bg-success';
      case 'VALIDE_ADMIN': return 'bg-success';
      case 'REJETE_DIRECTEUR': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }
}