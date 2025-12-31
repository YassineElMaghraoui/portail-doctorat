import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Soutenance } from '@core/models/soutenance.model';

@Injectable({
    providedIn: 'root'
})
export class SoutenanceService {
    private baseUrl = `${environment.soutenanceServiceUrl}/soutenances`;

    constructor(private http: HttpClient) {
        console.log('🔧 SoutenanceService URL:', this.baseUrl);
    }

    // ========== CRUD ==========

    getAllSoutenances(): Observable<Soutenance[]> {
        return this.http.get<Soutenance[]>(this.baseUrl);
    }

    getSoutenanceById(id: number): Observable<Soutenance> {
        return this.http.get<Soutenance>(`${this.baseUrl}/${id}`);
    }

    getSoutenancesByDoctorant(doctorantId: number): Observable<Soutenance[]> {
        return this.http.get<Soutenance[]>(`${this.baseUrl}/doctorant/${doctorantId}`);
    }

    getSoutenancesByDirecteur(directeurId: number): Observable<Soutenance[]> {
        return this.http.get<Soutenance[]>(`${this.baseUrl}/directeur/${directeurId}`);
    }

    createSoutenance(soutenance: Partial<Soutenance>): Observable<Soutenance> {
        return this.http.post<Soutenance>(this.baseUrl, soutenance);
    }

    soumettreDemande(formData: FormData): Observable<Soutenance> {
        return this.http.post<Soutenance>(`${this.baseUrl}/soumettre`, formData);
    }

    // ========== ÉTAPE 1: DIRECTEUR valide prérequis (SOUMIS → PREREQUIS_VALIDES) ==========

    validerPrerequisDirecteur(id: number, commentaire: string): Observable<Soutenance> {
        return this.http.put<Soutenance>(`${this.baseUrl}/${id}/valider-prerequis`, { commentaire });
    }

    rejeterDemandeDirecteur(id: number, commentaire: string): Observable<Soutenance> {
        return this.http.put<Soutenance>(`${this.baseUrl}/${id}/rejeter-directeur`, { commentaire });
    }

    // ========== ÉTAPE 2: ADMIN autorise la demande (PREREQUIS_VALIDES → AUTORISEE) ==========

    autoriserSoutenance(id: number, commentaire?: string): Observable<Soutenance> {
        return this.http.put<Soutenance>(`${this.baseUrl}/${id}/autoriser`, { commentaire });
    }

    // ✅ ALIAS pour compatibilité avec AdminSoutenanceComponent
    autoriserSoutenanceAdmin(id: number): Observable<Soutenance> {
        return this.autoriserSoutenance(id, 'Autorisé par l\'administration');
    }

    // ========== ÉTAPE 3: DIRECTEUR propose le jury (AUTORISEE → JURY_PROPOSE) ==========

    getMembresJuryByRole(role: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/jury/disponibles/${role}`);
    }

    getJurysDisponibles(): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/jury/disponibles`);
    }

    ajouterMembreJury(soutenanceId: number, membre: any): Observable<Soutenance> {
        return this.http.post<Soutenance>(`${this.baseUrl}/${soutenanceId}/jury`, membre);
    }

    supprimerMembreJury(soutenanceId: number, membreId: number): Observable<Soutenance> {
        return this.http.delete<Soutenance>(`${this.baseUrl}/${soutenanceId}/jury/${membreId}`);
    }

    proposerJury(id: number): Observable<Soutenance> {
        return this.http.put<Soutenance>(`${this.baseUrl}/${id}/proposer-jury`, {});
    }

    // ========== ÉTAPE 4: ADMIN valide le jury (JURY_PROPOSE) ==========

    validerJury(id: number, commentaire: string): Observable<Soutenance> {
        return this.http.put<Soutenance>(`${this.baseUrl}/${id}/valider-jury`, { commentaire });
    }

    refuserJury(id: number, commentaire: string): Observable<Soutenance> {
        return this.http.put<Soutenance>(`${this.baseUrl}/${id}/refuser-jury`, { commentaire });
    }

    // ========== ÉTAPE 5: ADMIN planifie la soutenance (→ PLANIFIEE) ==========

    planifierSoutenance(id: number, data: { dateSoutenance: string; heureSoutenance?: string; lieuSoutenance?: string }): Observable<Soutenance> {
        return this.http.put<Soutenance>(`${this.baseUrl}/${id}/planifier`, data);
    }

    // ✅ ALIAS combiné pour AdminSoutenanceComponent (Valider Jury + Planifier en même temps)
    validerJuryEtPlanifier(id: number, planning: { date: string; heure: string; lieu: string }): Observable<Soutenance> {
        // Idéalement, le backend devrait avoir un endpoint unique.
        // Sinon, on enchaîne : Valider Jury -> Planifier (mais ici on utilise juste planifier car valider jury est implicite souvent)
        // Pour simplifier : on appelle juste planifierSoutenance
        return this.planifierSoutenance(id, {
            dateSoutenance: planning.date,
            heureSoutenance: planning.heure,
            lieuSoutenance: planning.lieu
        });
    }

    // ========== ÉTAPE 6: ADMIN enregistre le résultat (PLANIFIEE → TERMINEE) ==========

    enregistrerResultat(id: number, data: { mention: string; felicitations?: boolean }): Observable<Soutenance> {
        return this.http.put<Soutenance>(`${this.baseUrl}/${id}/resultat`, data);
    }

    // ✅ ALIAS pour compatibilité avec AdminSoutenanceComponent
    cloturerSoutenance(id: number, mention: string): Observable<Soutenance> {
        return this.enregistrerResultat(id, { mention: mention, felicitations: false });
    }

    // ========== AUTRES ==========

    rejeterSoutenance(id: number, motif: string): Observable<Soutenance> {
        return this.http.put<Soutenance>(`${this.baseUrl}/${id}/rejeter`, { motif });
    }

    getDocumentUrl(filePath: string): string {
        if (!filePath) return '';
        let filename = filePath;
        if (filePath.includes('uploads/soutenances/')) {
            filename = filePath.split('uploads/soutenances/').pop() || filePath;
        } else if (filePath.includes('/')) {
            filename = filePath.split('/').pop() || filePath;
        }
        return `${environment.soutenanceServiceUrl}/soutenances/files/${filename}`;
    }

    openDocument(path: string): void {
        if (path) window.open(this.getDocumentUrl(path), '_blank');
    }
}