import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainLayoutComponent } from '@shared/components/main-layout/main-layout.component';

@Component({
  selector: 'app-inscription-management',
  standalone: true,
  imports: [CommonModule, MainLayoutComponent],
  template: `
    <app-main-layout>
      <div class="page">
        <h1>Toutes les inscriptions</h1>
        <p class="text-muted">Gérez toutes les inscriptions du portail</p>
        
        <div class="card mt-4">
          <div class="card-body text-center" style="padding: 4rem;">
            <i class="bi bi-file-earmark-check" style="font-size: 4rem; color: var(--border-color);"></i>
            <h3 class="mt-3">Module en cours de développement</h3>
          </div>
        </div>
      </div>
    </app-main-layout>
  `
})
export class InscriptionManagementComponent {}
