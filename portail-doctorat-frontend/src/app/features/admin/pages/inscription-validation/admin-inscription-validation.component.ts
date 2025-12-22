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
        <div class="page-container p-4">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 class="page-title mb-1">Validation Administrative</h2>
                    <p class="text-muted">Étape finale : Validation des dossiers acceptés scientifiquement.</p>
                </div>
                <button class="btn btn-outline-primary btn-sm" (click)="loadInscriptions()">
                    <i class="bi bi-arrow-clockwise"></i>
                </button>
            </div>

            <!-- CONTENU -->
            @if (isLoading()) {
                <div class="text-center py-5"><div class="spinner-border text-primary"></div></div>
            }
            @else if (inscriptions().length === 0) {
                <div class="card border-0 shadow-sm text-center py-5">
                    <div class="text-muted">
                        <i class="bi bi-check2-all fs-1 mb-2 d-block text-success opacity-50"></i>
                        Tout est à jour. Aucun dossier en attente.
                    </div>
                </div>
            }
            @else {
                <div class="card shadow-sm border-0">
                    <div class="table-responsive">
                        <table class="table table-hover align-middle mb-0">
                            <thead class="bg-light">
                            <tr>
                                <th class="ps-4">Candidat</th>
                                <th>Directeur (ID)</th>
                                <th>Sujet de thèse</th>
                                <th>Date Validation Dir.</th>
                                <th class="text-end pe-4">Action</th>
                            </tr>
                            </thead>
                            <tbody>
                                @for (ins of inscriptions(); track ins.id) {
                                    <tr>
                                        <td class="ps-4">
                                            <div class="fw-bold">{{ ins.doctorantNom || 'Candidat' }}</div>
                                            <div class="small text-muted">ID: {{ ins.doctorantId }}</div>
                                        </td>
                                        <td><span class="badge bg-light text-dark border">{{ ins.directeurId }}</span></td>
                                        <td><div class="text-truncate" style="max-width: 200px;">{{ ins.sujetThese }}</div></td>
                                        <td>{{ ins.dateValidationDirecteur | date:'dd/MM/yyyy' }}</td>
                                        <td class="text-end pe-4">
                                            <div class="btn-group">
                                                <button class="btn btn-success btn-sm" (click)="valider(ins.id)">
                                                    <i class="bi bi-check-lg me-1"></i> Valider
                                                </button>
                                                <button class="btn btn-outline-danger btn-sm" (click)="rejeter(ins.id)">
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
        // On ne cherche que les dossiers déjà validés par le directeur
        this.inscriptionService.getByStatut(StatutInscription.VALIDE_DIRECTEUR).subscribe({
            next: (data) => {
                this.inscriptions.set(data);
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false)
        });
    }

    valider(id: number) {
        if(confirm("Valider définitivement et générer l'attestation ?")) {
            this.inscriptionService.validerParAdmin(id, "Dossier conforme").subscribe(() => {
                this.loadInscriptions();
                alert("Inscription finalisée !");
            });
        }
    }

    rejeter(id: number) {
        const motif = prompt("Motif du rejet administratif :");
        if (motif) {
            this.inscriptionService.rejeterParAdmin(id, motif).subscribe(() => this.loadInscriptions());
        }
    }
}