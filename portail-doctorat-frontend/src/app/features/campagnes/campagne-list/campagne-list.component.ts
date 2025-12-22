import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MainLayoutComponent } from '@shared/components/main-layout/main-layout.component';
import { InscriptionService } from '@core/services/inscription.service';
import { Campagne } from '@core/models/inscription.model';

@Component({
  selector: 'app-campagne-list',
  standalone: true,
  imports: [CommonModule, RouterLink, MainLayoutComponent],
  template: `
    <app-main-layout>
      <div class="page-wrapper">

        <!-- HEADER (Thème Violet) -->
        <div class="hero-header">
          <div class="container-fluid px-4">
            <div class="d-flex justify-content-between align-items-end header-content">
              <div>
                <h1 class="display-6 fw-bold text-white mb-2">Campagnes</h1>
                <p class="text-white-50 mb-0">Gérez les périodes d'ouverture des inscriptions.</p>
              </div>
              <div class="mb-2">
                <!-- ✅ BOUTON CORRIGÉ : Utilise routerLink -->
                <a routerLink="nouvelle" class="btn btn-light text-primary fw-bold shadow-sm px-4 py-2 rounded-pill">
                  <i class="bi bi-plus-lg me-2"></i> Nouvelle Campagne
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- CONTENU PRINCIPAL -->
        <div class="container-fluid px-4 main-content">

          @if (isLoading()) {
            <div class="text-center py-5">
              <div class="spinner-border text-primary"></div>
            </div>
          } @else if (campagnes().length === 0) {
            <!-- LISTE VIDE -->
            <div class="card border-0 shadow-sm rounded-4 text-center py-5">
              <div class="card-body">
                <div class="mb-3 text-muted opacity-25">
                  <i class="bi bi-calendar-x" style="font-size: 4rem;"></i>
                </div>
                <h4 class="text-dark">Aucune campagne configurée</h4>
                <p class="text-muted">Commencez par créer la première campagne pour l'année universitaire.</p>
              </div>
            </div>
          } @else {
            <!-- TABLEAU DES CAMPAGNES -->
            <div class="card border-0 shadow-sm rounded-4 overflow-hidden">
              <div class="table-responsive">
                <table class="table table-hover align-middle mb-0">
                  <thead class="bg-light">
                  <tr>
                    <th class="ps-4 py-3 text-uppercase small fw-bold text-muted">Année Univ.</th>
                    <th class="text-uppercase small fw-bold text-muted">Titre</th>
                    <th class="text-uppercase small fw-bold text-muted">Période</th>
                    <th class="text-uppercase small fw-bold text-muted">Statut</th>
                    <th class="text-end pe-4 text-uppercase small fw-bold text-muted">Actions</th>
                  </tr>
                  </thead>
                  <tbody>
                    @for (campagne of campagnes(); track campagne.id) {
                      <tr>
                        <td class="ps-4">
                          <div class="fw-bold text-primary">{{ campagne.anneeUniversitaire }}</div>
                        </td>
                        <td class="fw-bold text-dark">{{ campagne.titre }}</td>
                        <td class="text-muted small">
                          <i class="bi bi-calendar3 me-1"></i> {{ campagne.dateDebut | date:'dd/MM/yyyy' }}
                          <i class="bi bi-arrow-right mx-1"></i>
                          {{ campagne.dateFin | date:'dd/MM/yyyy' }}
                        </td>
                        <td>
                          @if (campagne.active) {
                            <span class="badge bg-success-subtle text-success border border-success-subtle px-3 rounded-pill">
                              <i class="bi bi-check-circle-fill me-1"></i> OUVERTE
                            </span>
                          } @else {
                            <span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-3 rounded-pill">
                              <i class="bi bi-lock-fill me-1"></i> FERMÉE
                            </span>
                          }
                        </td>
                        <td class="text-end pe-4">
                          <div class="btn-group">

                            <!-- ✅ BOUTON MODIFIER CORRIGÉ : Lien vers le formulaire d'édition -->
                            <a [routerLink]="['modifier', campagne.id]" class="btn btn-sm btn-outline-primary border-0 bg-primary-subtle text-primary" title="Modifier">
                              <i class="bi bi-pencil-fill"></i>
                            </a>

                            <!-- Bouton Activer (visible si inactive) -->
                            @if (!campagne.active) {
                              <button class="btn btn-sm btn-outline-success border-0 bg-success-subtle text-success ms-2"
                                      (click)="activer(campagne.id)" title="Activer">
                                <i class="bi bi-play-fill fs-6"></i>
                              </button>
                            }
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
        </div>
      </div>
    </app-main-layout>
  `,
  styles: [`
    .page-wrapper { background-color: #f8fafc; min-height: 100vh; }

    /* Hero Header identique au Dashboard Admin */
    .hero-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding-top: 3rem;
      padding-bottom: 5rem;
      border-bottom-left-radius: 30px;
      border-bottom-right-radius: 30px;
      box-shadow: 0 4px 20px rgba(118, 75, 162, 0.2);
    }

    .header-content { position: relative; z-index: 2; }

    .main-content { margin-top: -3rem; position: relative; z-index: 5; }

    /* Table Styles */
    .table thead th { border-bottom: 2px solid #f1f5f9; background-color: #f8fafc; }
    .table tbody tr { transition: background-color 0.2s; }
    .bg-primary-subtle { background-color: #eef2ff !important; }
    .bg-success-subtle { background-color: #f0fdf4 !important; }
    .bg-secondary-subtle { background-color: #f8fafc !important; }
  `]
})
export class CampagneListComponent implements OnInit {
  campagnes = signal<Campagne[]>([]);
  isLoading = signal(true);

  constructor(private inscriptionService: InscriptionService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    this.inscriptionService.getAllCampagnes().subscribe({
      next: (data) => {
        this.campagnes.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  activer(id: number) {
    if(confirm('Voulez-vous ouvrir cette campagne aux inscriptions ?')) {
      this.inscriptionService.activerCampagne(id).subscribe(() => this.loadData());
    }
  }
}