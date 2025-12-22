import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import {
  Inscription,
  Campagne,
  CreateInscriptionRequest,
  StatutInscription
} from '../models/inscription.model';

@Injectable({
  providedIn: 'root'
})
export class InscriptionService {

  /** URL API : http://localhost:8082/api/inscriptions */
  private readonly baseUrl = `${environment.apiUrl}/inscriptions`;
  private readonly campagneUrl = `${environment.apiUrl}/campagnes`;

  constructor(private http: HttpClient) {}

  // =====================================================
  // ================= INSCRIPTIONS ======================
  // =====================================================

  /** Récupérer toutes les inscriptions */
  getAll(): Observable<Inscription[]> {
    return this.http.get<Inscription[]>(this.baseUrl);
  }

  /** Récupérer par ID */
  getInscriptionById(id: number): Observable<Inscription> {
    return this.http.get<Inscription>(`${this.baseUrl}/${id}`);
  }

  /** Alias */
  getById(id: number): Observable<Inscription> {
    return this.getInscriptionById(id);
  }

  /** Inscriptions d’un doctorant */
  getByDoctorant(doctorantId: number): Observable<Inscription[]> {
    return this.http.get<Inscription[]>(`${this.baseUrl}/doctorant/${doctorantId}`);
  }

  /**
   * ✅ CORRECTION : C'est cette méthode que votre composant "Validation" appelle.
   * J'utilise 'baseUrl' qui est correctement défini en haut.
   */
  getInscriptionsByDirecteur(directeurId: number): Observable<Inscription[]> {
    return this.http.get<Inscription[]>(`${this.baseUrl}/directeur/${directeurId}`);
  }

  /** Inscriptions par statut */
  getByStatut(statut: StatutInscription): Observable<Inscription[]> {
    return this.http.get<Inscription[]>(`${this.baseUrl}/statut/${statut}`);
  }

  /** Création d’une inscription (POST) */
  create(inscription: CreateInscriptionRequest): Observable<Inscription> {
    return this.http.post<Inscription>(this.baseUrl, inscription);
  }

  /** Mise à jour (PUT) */
  update(id: number, inscription: Partial<Inscription>): Observable<Inscription> {
    return this.http.put<Inscription>(`${this.baseUrl}/${id}`, inscription);
  }

  /** Suppression */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /** Soumettre (Passage BROUILLON → SOUMIS) */
  soumettre(id: number): Observable<Inscription> {
    return this.http.put<Inscription>(`${this.baseUrl}/${id}/soumettre`, {});
  }

  /** Validation par directeur */
  validerParDirecteur(id: number, commentaire?: string): Observable<Inscription> {
    return this.http.put<Inscription>(
        `${this.baseUrl}/${id}/valider-directeur`,
        { commentaire }
    );
  }

  /** Rejet par directeur */
  rejeterParDirecteur(id: number, commentaire: string): Observable<Inscription> {
    return this.http.put<Inscription>(
        `${this.baseUrl}/${id}/rejeter-directeur`,
        { commentaire }
    );
  }

  /** Validation par admin */
  validerParAdmin(id: number, commentaire?: string): Observable<Inscription> {
    return this.http.put<Inscription>(
        `${this.baseUrl}/${id}/valider-admin`,
        { commentaire }
    );
  }

  /** Rejet par admin */
  rejeterParAdmin(id: number, commentaire: string): Observable<Inscription> {
    return this.http.put<Inscription>(
        `${this.baseUrl}/${id}/rejeter-admin`,
        { commentaire }
    );
  }

  // =====================================================
  // ================== CAMPAGNES ========================
  // =====================================================

  getAllCampagnes(): Observable<Campagne[]> {
    return this.http.get<Campagne[]>(this.campagneUrl);
  }

  getCampagneActive(): Observable<Campagne> {
    return this.http.get<Campagne>(`${this.campagneUrl}/active`);
  }

  getCampagneById(id: number): Observable<Campagne> {
    return this.http.get<Campagne>(`${this.campagneUrl}/${id}`);
  }

  createCampagne(campagne: Partial<Campagne>): Observable<Campagne> {
    return this.http.post<Campagne>(this.campagneUrl, campagne);
  }

  updateCampagne(id: number, campagne: Partial<Campagne>): Observable<Campagne> {
    return this.http.put<Campagne>(`${this.campagneUrl}/${id}`, campagne);
  }

  activerCampagne(id: number): Observable<Campagne> {
    return this.http.put<Campagne>(`${this.campagneUrl}/${id}/activer`, {});
  }
}