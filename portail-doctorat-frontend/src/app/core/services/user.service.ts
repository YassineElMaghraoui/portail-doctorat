import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class UserService {

    // URL de base (ex: http://localhost:8080/api/users)
    private baseUrl = `${environment.userServiceUrl}/users`;

    constructor(private http: HttpClient) {}

    // =====================================================
    // LECTURE
    // =====================================================

    getAllUsers(): Observable<User[]> {
        return this.http.get<User[]>(this.baseUrl);
    }

    // ✅ Utilisé par MyStudentsComponent pour charger la liste
    getUsersByRole(role: string): Observable<User[]> {
        return this.http.get<User[]>(`${this.baseUrl}/role/${role}`);
    }

    getUserById(id: number): Observable<User> {
        return this.http.get<User>(`${this.baseUrl}/${id}`);
    }

    // ✅ Utilisé par DashboardComponent pour les stats (Nouveaux candidats)
    getUsersByEtat(etat: string): Observable<User[]> {
        return this.http.get<User[]>(`${this.baseUrl}/etat/${etat}`);
    }

    getDocumentUrl(filename: string): string {
        return `${environment.userServiceUrl}/files/${filename}`;
    }

    // =====================================================
    // ÉCRITURE
    // =====================================================

    createUser(user: any): Observable<User> {
        return this.http.post<User>(this.baseUrl, user);
    }

    // ✅ Peut être utilisé pour mettre à jour les prérequis (nbPublications, etc.)
    updateUser(id: number, user: Partial<User>): Observable<User> {
        return this.http.put<User>(`${this.baseUrl}/${id}`, user);
    }

    deleteUser(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    // =====================================================
    // WORKFLOW VALIDATION
    // =====================================================

    validerCandidatureAdminAvecDirecteur(id: number, directeurId: number): Observable<User> {
        return this.http.put<User>(`${this.baseUrl}/${id}/validate-admin`, {}, {
            params: { directeurId: directeurId.toString() }
        });
    }

    refuserCandidatureAdmin(id: number, motif: string): Observable<User> {
        return this.http.put<User>(`${this.baseUrl}/${id}/refuse`, {}, {
            params: { motif: motif }
        });
    }

    validerCandidatureDirecteurAvecSujet(id: number, sujetThese: string): Observable<User> {
        return this.http.put<User>(`${this.baseUrl}/${id}/validate-directeur`, {}, {
            params: { sujetThese: sujetThese }
        });
    }

    refuserCandidatureDirecteur(id: number, motif: string): Observable<User> {
        return this.http.put<User>(`${this.baseUrl}/${id}/refuse-directeur`, {}, {
            params: { motif: motif }
        });
    }
}