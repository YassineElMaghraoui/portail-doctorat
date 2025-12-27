import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, EtatCandidature } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class UserService {

    private baseUrl = `${environment.userServiceUrl}/users`;

    constructor(private http: HttpClient) {
        console.log('🔧 UserService initialized - Base URL:', this.baseUrl);
    }

    // =====================================================
    // CRUD BASIQUE
    // =====================================================

    getAllUsers(): Observable<User[]> {
        return this.http.get<User[]>(this.baseUrl);
    }

    getUsersByRole(role: string): Observable<User[]> {
        return this.http.get<User[]>(`${this.baseUrl}/role/${role}`);
    }

    getUserById(id: number): Observable<User> {
        return this.http.get<User>(`${this.baseUrl}/${id}`);
    }

    getUsersByEtat(etat: string): Observable<User[]> {
        return this.http.get<User[]>(`${this.baseUrl}/etat/${etat}`);
    }

    /**
     * Créer un nouvel utilisateur (Admin seulement)
     * Endpoint: POST /api/users
     */
    createUser(user: any): Observable<User> {
        console.log('📤 UserService.createUser() - Sending:', user);
        return this.http.post<User>(this.baseUrl, user).pipe(
            tap({
                next: (response) => console.log('✅ UserService.createUser() - Success:', response),
                error: (err) => console.error('❌ UserService.createUser() - Error:', err)
            })
        );
    }

    /**
     * Alias pour créer un directeur (utilise createUser en interne)
     */
    createDirecteur(directeurData: any): Observable<User> {
        const data = {
            ...directeurData,
            role: 'DIRECTEUR_THESE',
            etat: 'VALIDE'
        };
        return this.createUser(data);
    }

    updateUser(id: number, user: Partial<User>): Observable<User> {
        return this.http.put<User>(`${this.baseUrl}/${id}`, user);
    }

    updateRole(id: number, newRole: string): Observable<User> {
        return this.http.put<User>(`${this.baseUrl}/${id}/role`, {}, {
            params: { newRole: newRole }
        });
    }

    deleteUser(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    // =====================================================
    // WORKFLOW ADMIN - Validation candidatures
    // =====================================================

    /**
     * L'Admin valide une candidature (passe à EN_ATTENTE_DIRECTEUR)
     * SANS assigner de directeur (non recommandé)
     */
    validerCandidatureAdmin(id: number): Observable<User> {
        console.log('📤 validerCandidatureAdmin() - ID:', id);
        return this.http.put<User>(`${this.baseUrl}/${id}/validate-admin`, {}).pipe(
            tap({
                next: (res) => console.log('✅ Candidature validée:', res),
                error: (err) => console.error('❌ Erreur validation:', err)
            })
        );
    }

    /**
     * L'Admin valide une candidature ET assigne un directeur
     * C'est la méthode recommandée !
     */
    validerCandidatureAdminAvecDirecteur(id: number, directeurId: number): Observable<User> {
        console.log('📤 validerCandidatureAdminAvecDirecteur() - Candidat:', id, 'Directeur:', directeurId);
        return this.http.put<User>(`${this.baseUrl}/${id}/validate-admin`, {}, {
            params: { directeurId: directeurId.toString() }
        }).pipe(
            tap({
                next: (res) => console.log('✅ Candidature validée avec directeur:', res),
                error: (err) => console.error('❌ Erreur validation avec directeur:', err)
            })
        );
    }

    /**
     * L'Admin refuse une candidature avec motif
     */
    refuserCandidatureAdmin(id: number, motif: string): Observable<User> {
        return this.http.put<User>(`${this.baseUrl}/${id}/refuse`, {}, {
            params: { motif: motif }
        });
    }

    // =====================================================
    // WORKFLOW DIRECTEUR - Validation candidatures
    // =====================================================

    /**
     * Le Directeur valide une candidature → VALIDE + rôle DOCTORANT
     * (Version simple sans sujet de thèse)
     */
    validerCandidatureDirecteur(id: number): Observable<User> {
        console.log('📤 validerCandidatureDirecteur() - ID:', id);
        return this.http.put<User>(`${this.baseUrl}/${id}/validate-directeur`, {}).pipe(
            tap({
                next: (res) => console.log('✅ Candidature validée par directeur:', res),
                error: (err) => console.error('❌ Erreur validation directeur:', err)
            })
        );
    }

    /**
     * ✅ Le Directeur valide une candidature AVEC le sujet de thèse
     * Le sujet est stocké dans le champ titreThese de l'utilisateur
     *
     * @param id - ID du candidat
     * @param sujetThese - Sujet de thèse à assigner
     */
    validerCandidatureDirecteurAvecSujet(id: number, sujetThese: string): Observable<User> {
        console.log('📤 validerCandidatureDirecteurAvecSujet() - ID:', id, 'Sujet:', sujetThese);
        return this.http.put<User>(`${this.baseUrl}/${id}/validate-directeur`, {}, {
            params: { sujetThese: sujetThese }
        }).pipe(
            tap({
                next: (res) => console.log('✅ Candidature validée avec sujet de thèse:', res),
                error: (err) => console.error('❌ Erreur validation avec sujet:', err)
            })
        );
    }

    /**
     * Le Directeur refuse une candidature
     */
    refuserCandidatureDirecteur(id: number, motif: string): Observable<User> {
        return this.http.put<User>(`${this.baseUrl}/${id}/refuse-directeur`, {}, {
            params: { motif: motif }
        });
    }

    // =====================================================
    // DOCUMENTS
    // =====================================================

    /**
     * Obtenir l'URL d'un document
     */
    getDocumentUrl(filename: string): string {
        return `${environment.userServiceUrl}/files/${filename}`;
    }
}