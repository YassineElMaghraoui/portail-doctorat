import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class UserService {

    /**
     * environment.userServiceUrl = 'http://localhost:8081/api'
     * baseUrl final = 'http://localhost:8081/api/users'
     */
    private baseUrl = `${environment.userServiceUrl}/users`;

    constructor(private http: HttpClient) {}

    /** 🔹 Récupérer tous les utilisateurs */
    getAllUsers(): Observable<User[]> {
        return this.http.get<User[]>(this.baseUrl);
    }

    /**
     * 🔹 Récupérer les utilisateurs par rôle
     * URL finale : http://localhost:8081/api/users/role/CANDIDAT
     */
    getUsersByRole(role: string): Observable<User[]> {
        return this.http.get<User[]>(`${this.baseUrl}/role/${role}`);
    }

    /** 🔹 Récupérer un utilisateur par ID */
    getUserById(id: number): Observable<User> {
        return this.http.get<User>(`${this.baseUrl}/${id}`);
    }

    /** 🔹 Créer un utilisateur */
    createUser(user: User): Observable<User> {
        return this.http.post<User>(this.baseUrl, user);
    }

    /** 🔹 Mettre à jour un utilisateur */
    updateUser(id: number, user: Partial<User>): Observable<User> {
        return this.http.put<User>(`${this.baseUrl}/${id}`, user);
    }

    /**
     * 🔹 Mettre à jour uniquement le rôle
     * ✅ Appel du endpoint spécifique
     * PUT http://localhost:8081/api/users/123/role?newRole=DOCTORANT
     */
    updateRole(id: number, newRole: string): Observable<User> {
        return this.http.put<User>(`${this.baseUrl}/${id}/role`, {}, {
            params: { newRole: newRole }
        });
    }

    /** 🔹 Supprimer un utilisateur */
    deleteUser(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }
}
