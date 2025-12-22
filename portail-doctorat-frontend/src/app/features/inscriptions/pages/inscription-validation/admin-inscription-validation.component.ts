import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InscriptionService } from '@core/services/inscription.service';
import { Inscription, StatutInscription } from '@core/models/inscription.model';

@Component({
    selector: 'app-admin-inscription-validation',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <div class="container-fluid py-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-1">Validation Administrative</h2>
          <p class="text-muted">Liste des dossiers validés sciemment par les directeurs, en attente de validation finale.</p>
        </div>
        <button class="btn btn-outline-primary" (click)="ngOnInit()">
          <i class="bi bi-arrow-clockwise me-1"></i> Actualiser
        </button>
      </div>

      <!-- CHARGEMENT -->
      @if (isLoading()) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary"></div>
        </div>
      } 
      
      <!-- LISTE VIDE -->
      @else if (inscriptions().length === 0) {
        <div class="alert alert-info shadow-sm">
          <i class="bi bi-info-circle-fill me-2"></i> Aucun dossier en attente de validation administrative.
        </div>
      } 
      
      <!-- TABLEAU -->
      @else {
        <div class="card shadow-sm border-0">
          <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="table-light">
                <tr>
                  <th class="ps-4">Doctorant</th>
                  <th>Directeur (ID)</th>
                  <th>Sujet</th>
                  <th>Date Validation Dir.</th>
                  <th>Statut Actuel</th>
                  <th class="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (ins of inscriptions(); track ins.id) {
                  <tr>
                    <td class="ps-4">
                      <div class="fw-bold">{{ ins.doctorantNom || 'Nom inconnu' }}</div>
                      <div class="small text-muted">ID: {{ ins.doctorantId }}</div>
                    </td>
                    <td>
                      <span class="badge bg-light text-dark border">ID {{ ins.directeurId }}</span>
                    </td>
                    <td>
                      <div class="text-truncate" style="max-width: 250px;" title="{{ ins.sujetThese }}">
                        {{ ins.sujetThese }}
                      </div>
                    </td>
                    <td>{{ ins.dateValidationDirecteur | date:'shortDate' }}</td>
                    <td><span class="badge bg-info text-dark">{{ ins.statut }}</span></td>
                    <td class="text-end pe-4">
                      <div class="btn-group">
                        <button class="btn btn-success btn-sm" (click)="valider(ins.id)" title="Valider définitivement">
                          <i class="bi bi-check-lg"></i> Valider
                        </button>
                        <button class="btn btn-danger btn-sm" (click)="rejeter(ins.id)" title="Rejeter le dossier">
                          <i class="bi bi-x-lg"></i>
                        </button>
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
  `
})
export class AdminInscriptionValidationComponent implements OnInit {
    inscriptions = signal<Inscription[]>([]);
    isLoading = signal(true);

    constructor(private inscriptionService: InscriptionService) {}

    ngOnInit() {
        this.loadInscriptions();
    }

    loadInscriptions() {
        this.isLoading.set(true);
        // On ne veut que ce qui a été validé par les directeurs
        this.inscriptionService.getByStatut(StatutInscription.VALIDE_DIRECTEUR).subscribe({
            next: (data) => {
                this.inscriptions.set(data);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error(err);
                this.isLoading.set(false);
            }
        });
    }

    valider(id: number) {
        if(confirm('Confirmer la validation administrative ?\nCela générera l\'attestation d\'inscription.')) {
            this.inscriptionService.validerParAdmin(id, "Dossier administratif complet").subscribe({
                next: () => {
                    alert("Inscription validée définitivement !");
                    this.loadInscriptions(); // Rafraîchir la liste
                },
                error: () => alert("Erreur lors de la validation.")
            });
        }
    }

    rejeter(id: number) {
        const motif = prompt("Motif du rejet administratif (Ex: Photo manquante, Diplôme illisible...) :");
        if(motif) {
            this.inscriptionService.rejeterParAdmin(id, motif).subscribe({
                next: () => {
                    alert("Dossier rejeté.");
                    this.loadInscriptions();
                },
                error: () => alert("Erreur lors du rejet.")
            });
        }
    }
}