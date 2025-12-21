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
      <div class="page">
        <header class="page-header d-flex justify-content-between align-items-center">
          <div>
            <h1>Campagnes d'inscription</h1>
            <p class="text-muted">Gérez les campagnes d'inscription au doctorat</p>
          </div>
          <button class="btn btn-primary">
            <i class="bi bi-plus-lg"></i> Nouvelle campagne
          </button>
        </header>

        <div class="card">
          <table class="table">
            <thead>
              <tr>
                <th>Année universitaire</th>
                <th>Titre</th>
                <th>Date début</th>
                <th>Date fin</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (campagne of campagnes(); track campagne.id) {
                <tr>
                  <td><strong>{{ campagne.anneeUniversitaire }}</strong></td>
                  <td>{{ campagne.titre }}</td>
                  <td>{{ campagne.dateDebut | date:'dd/MM/yyyy' }}</td>
                  <td>{{ campagne.dateFin | date:'dd/MM/yyyy' }}</td>
                  <td>
                    <span class="badge" [class.badge-success]="campagne.active" [class.badge-secondary]="!campagne.active">
                      {{ campagne.active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td>
                    <button class="btn btn-sm btn-outline">
                      <i class="bi bi-pencil"></i>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </app-main-layout>
  `,
  styles: [`.page { max-width: 1200px; }`]
})
export class CampagneListComponent implements OnInit {
  campagnes = signal<Campagne[]>([]);

  constructor(private inscriptionService: InscriptionService) {}

  ngOnInit(): void {
    this.inscriptionService.getAllCampagnes().subscribe({
      next: (data) => this.campagnes.set(data)
    });
  }
}
