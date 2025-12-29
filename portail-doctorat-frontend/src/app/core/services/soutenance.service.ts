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

    // ========== ÉTAPE 6: ADMIN enregistre le résultat (PLANIFIEE → TERMINEE) ==========

    enregistrerResultat(id: number, data: { mention: string; felicitations?: boolean }): Observable<Soutenance> {
        return this.http.put<Soutenance>(`${this.baseUrl}/${id}/resultat`, data);
    }

    // ========== AUTRES ==========

    rejeterSoutenance(id: number, motif: string): Observable<Soutenance> {
        return this.http.put<Soutenance>(`${this.baseUrl}/${id}/rejeter`, { motif });
    }

    getDocumentUrl(filename: string): string {
        if (!filename) return '';
        return `${environment.soutenanceServiceUrl}/uploads/soutenances/${filename}`;
    }

    openDocument(path: string): void {
        if (path) {
            window.open(this.getDocumentUrl(path), '_blank');
        }
    }
}