import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { User } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    // Pointe vers le port 8081 (User Service)
    private apiUrl = environment.userServiceUrl || 'http://localhost:8081/api/users';

    constructor(private http: HttpClient) {}

    /** Récupérer tous les utilisateurs */
    getAllUsers(): Observable<User[]> {
        return this.http.get<User[]>(this.apiUrl);
    }

    /** 🔴 NOUVEAU : Récupérer par rôle (pour l'admin dashboard) */
    getUsersByRole(role: string): Observable<User[]> {
        return this.http.get<User[]>(`${this.apiUrl}/role/${role}`);
    }

    /** 🔴 NOUVEAU : Créer un utilisateur (pour créer un Directeur manuellement) */
    createUser(user: any): Observable<User> {
        return this.http.post<User>(this.apiUrl, user);
    }

    /** Mettre à jour un utilisateur (ex: changer son rôle) */
    updateUser(id: number, user: Partial<User>): Observable<User> {
        return this.http.put<User>(`${this.apiUrl}/${id}`, user);
    }

    /** Raccourci pour changer juste le rôle */
    updateRole(id: number, newRole: string): Observable<User> {
        // On envoie un objet partiel avec juste le rôle
        return this.updateUser(id, { role: newRole } as any);
    }

    deleteUser(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}