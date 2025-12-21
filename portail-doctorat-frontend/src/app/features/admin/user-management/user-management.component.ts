import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainLayoutComponent } from '@shared/components/main-layout/main-layout.component';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, MainLayoutComponent],
  template: `
    <app-main-layout>
      <div class="page">
        <h1>Gestion des utilisateurs</h1>
        <p class="text-muted">Administrez les comptes utilisateurs du portail</p>
        
        <div class="card mt-4">
          <div class="card-body text-center" style="padding: 4rem;">
            <i class="bi bi-people" style="font-size: 4rem; color: var(--border-color);"></i>
            <h3 class="mt-3">Module en cours de développement</h3>
            <p class="text-muted">Cette fonctionnalité sera bientôt disponible.</p>
          </div>
        </div>
      </div>
    </app-main-layout>
  `
})
export class UserManagementComponent {}
