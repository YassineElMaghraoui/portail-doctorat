import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SoutenanceService {

    private baseUrl = `${environment.soutenanceServiceUrl}/soutenances`;

    constructor(private http: HttpClient) {
        console.log('🔧 SoutenanceService initialized - Base URL:', this.baseUrl);
    }

    // =====================================================
    // CRUD
    // =====================================================

    getAllSoutenances(): Observable<any[]> {
        return this.http.get<any[]>(this.baseUrl);
    }

    getSoutenanceById(id: number): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}/${id}`);
    }

    // =====================================================
    // PAR UTILISATEUR
    // =====================================================

    getSoutenanceByDoctorantId(doctorantId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/doctorant/${doctorantId}`);
    }

    getSoutenancesByDirecteur(directeurId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/directeur/${directeurId}`);
    }

    // =====================================================
    // SOUMISSION DOCTORANT
    // =====================================================

    soumettreDemande(data: any, files: { manuscrit: File; rapport: File }): Observable<any> {
        const formData = new FormData();
        formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
        if (files.manuscrit) {
            formData.append('manuscrit', files.manuscrit);
        }
        if (files.rapport) {
            formData.append('rapport', files.rapport);
        }
        return this.http.post<any>(`${this.baseUrl}/soumettre`, formData);
    }

    soumettreDemandeSimple(data: any): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/soumettre-simple`, data);
    }

    // =====================================================
    // WORKFLOW DIRECTEUR
    // =====================================================

    /**
     * ✅ Directeur valide les prérequis d'une soutenance
     * Endpoint: PUT /soutenances/{id}/valider-prerequis
     */
    validerPrerequisDirecteur(soutenanceId: number, commentaire?: string): Observable<any> {
        console.log('📤 validerPrerequisDirecteur - ID:', soutenanceId);
        return this.http.put<any>(`${this.baseUrl}/${soutenanceId}/valider-prerequis`, {
            commentaire: commentaire || 'Prérequis validés par le directeur'
        });
    }

    /**
     * ✅ Directeur demande des corrections (rejet temporaire)
     * Endpoint: PUT /soutenances/{id}/rejeter-directeur
     */
    rejeterDemandeDirecteur(soutenanceId: number, commentaire: string): Observable<any> {
        console.log('📤 rejeterDemandeDirecteur - ID:', soutenanceId, 'Commentaire:', commentaire);
        return this.http.put<any>(`${this.baseUrl}/${soutenanceId}/rejeter-directeur`, {
            commentaire: commentaire
        });
    }

    // Alias pour compatibilité avec l'ancien code
    validerPrerequis(soutenanceId: number): Observable<any> {
        return this.validerPrerequisDirecteur(soutenanceId);
    }

    rejeterDemande(soutenanceId: number, commentaire: string): Observable<any> {
        return this.rejeterDemandeDirecteur(soutenanceId, commentaire);
    }

    // =====================================================
    // WORKFLOW ADMIN
    // =====================================================

    planifierSoutenance(soutenanceId: number, data: {
        dateSoutenance: string;
        heureSoutenance?: string;
        lieuSoutenance?: string;
    }): Observable<any> {
        return this.http.put<any>(`${this.baseUrl}/${soutenanceId}/planifier`, data);
    }

    autoriserSoutenance(soutenanceId: number): Observable<any> {
        return this.http.put<any>(`${this.baseUrl}/${soutenanceId}/autoriser`, {});
    }

    enregistrerResultat(soutenanceId: number, data: {
        mention?: string;
        noteFinale?: number;
        felicitationsJury?: boolean;
        commentaire?: string;
    }): Observable<any> {
        return this.http.put<any>(`${this.baseUrl}/${soutenanceId}/resultat`, data);
    }

    // =====================================================
    // JURY
    // =====================================================

    ajouterMembreJury(soutenanceId: number, membre: any): Observable<any> {
        return this.http.post<any>(`${this.baseUrl}/${soutenanceId}/jury`, membre);
    }

    getMembresJury(soutenanceId: number): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/${soutenanceId}/jury`);
    }

    supprimerMembreJury(soutenanceId: number, membreId: number): Observable<any> {
        return this.http.delete<any>(`${this.baseUrl}/${soutenanceId}/jury/${membreId}`);
    }

    // =====================================================
    // DOCUMENTS
    // =====================================================

    getDocumentUrl(filename: string): string {
        if (!filename) return '';
        if (filename.startsWith('http')) return filename;
        return `${environment.soutenanceServiceUrl}/files/${filename}`;
    }

    downloadDocument(filename: string): Observable<Blob> {
        return this.http.get(`${environment.soutenanceServiceUrl}/files/${filename}`, {
            responseType: 'blob'
        });
    }

    // =====================================================
    // STATISTIQUES
    // =====================================================

    getStatistiques(): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}/statistiques`);
    }

    getStatistiquesByDirecteur(directeurId: number): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}/statistiques/directeur/${directeurId}`);
    }
}