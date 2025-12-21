import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainLayoutComponent } from '../../../shared/components/main-layout/main-layout.component';

@Component({
  selector: 'app-soutenance-list',
  standalone: true,
  imports: [CommonModule, MainLayoutComponent],
  template: `
    <app-main-layout>
      <div class="page">
        <header class="page-header">
          <h1>Ma soutenance</h1>
          <p class="text-muted">Gérez votre demande de soutenance de thèse</p>
        </header>

        <div class="card">
          <div class="empty-state">
            <i class="bi bi-award"></i>
            <h3>Module en cours de développement</h3>
            <p>Cette fonctionnalité sera bientôt disponible. Vous pourrez gérer votre soutenance, vos prérequis et votre jury ici.</p>
          </div>
        </div>
      </div>
    </app-main-layout>
  `,
  styles: [`
    .page {
      max-width: 1000px;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .page-header h1 {
      margin-bottom: 0.5rem;
    }

    .text-muted {
      color: #64748b;
    }

    .card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      border: 1px solid #e2e8f0;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
    }

    .empty-state i {
      font-size: 4rem;
      color: #e2e8f0;
      display: block;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      margin-bottom: 0.5rem;
      color: #1e293b;
    }

    .empty-state p {
      color: #64748b;
      max-width: 400px;
      margin: 0 auto;
    }
  `]
})
export class SoutenanceListComponent {}
