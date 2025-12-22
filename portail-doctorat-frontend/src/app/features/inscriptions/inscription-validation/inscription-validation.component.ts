import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MainLayoutComponent } from '@shared/components/main-layout/main-layout.component';
import { InscriptionService } from '@core/services/inscription.service';
import { AuthService } from '@core/services/auth.service';
import { Inscription, StatutInscription } from '@core/models/inscription.model';
import { Role } from '@core/models/user.model';

@Component({
  selector: 'app-inscription-validation',
  standalone: true,
  imports: [CommonModule, RouterLink, MainLayoutComponent],
  template: `
    <app-main-layout>
      <div class="container-fluid py-4">
        <h2 class="mb-4">Validations en attente</h2>

        @if (isLoading()) {
          <!-- BLOC CHARGEMENT -->
          <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2">Récupération des dossiers...</p>
          </div>
        } @else if (inscriptions().length === 0) {
          <!-- BLOC LISTE VIDE -->
          <div class="alert alert-info shadow-sm">
            <h4><i class="bi bi-info-circle"></i> Aucune demande</h4>
            <p class="mb-0">Aucune demande d'inscription ne nécessite votre validation pour le moment.</p>
          </div>
        } @else {
          <!-- BLOC TABLEAU -->
          <div class="card shadow-sm border-0">
            <div class="card-body p-0">
              <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                  <thead class="bg-light">
                  <tr>
                    <th class="ps-4">Doctorant</th>
                    <th>Sujet</th>
                    <th>Date</th>
                    <th>Statut</th>
                    <th class="text-end pe-4">Action</th>
                  </tr>
                  </thead>
                  <tbody>
                    @for (ins of inscriptions(); track ins.id) {
                      <tr>
                        <td class="ps-4">
                          <div class="fw-bold">{{ ins.doctorantNom || 'Étudiant ID ' + ins.doctorantId }}</div>
                        </td>
                        <td>{{ ins.sujetThese }}</td>
                        <td>{{ ins.createdAt | date:'dd/MM/yyyy' }}</td>
                        <td>
                          <span class="badge bg-warning text-dark">{{ ins.statut }}</span>
                        </td>
                        <td class="text-end pe-4">
                          <a [routerLink]="['/inscriptions', ins.id]" class="btn btn-sm btn-primary">
                            Examiner <i class="bi bi-arrow-right"></i>
                          </a>
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
  `
})
export class InscriptionValidationComponent implements OnInit {
  inscriptions = signal<Inscription[]>([]);
  isLoading = signal(true);

  constructor(
      private inscriptionService: InscriptionService,
      private authService: AuthService
  ) {}

  ngOnInit() {
    const user = this.authService.currentUser();

    // On charge si c'est un Directeur
    if (user && (user.role === Role.DIRECTEUR_THESE)) {
      this.loadInscriptions(user.id);
    } else {
      this.isLoading.set(false);
    }
  }

  private loadInscriptions(directeurId: number) {
    this.inscriptionService.getInscriptionsByDirecteur(directeurId).subscribe({
      next: (data: Inscription[]) => {
        // Filtre : On garde seulement les dossiers SOUMIS
        const enAttente = data.filter((i: Inscription) => i.statut === StatutInscription.SOUMIS);
        this.inscriptions.set(enAttente);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        console.error("Erreur chargement validation:", err);
        this.isLoading.set(false);
      }
    });
  }
}