import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { Inscription, Campagne, CreateInscriptionRequest, StatutInscription } from '../models/inscription.model';

@Injectable({
  providedIn: 'root'
})
export class InscriptionService {
  private readonly baseUrl = `${environment.apiUrl}/inscriptions`;
  private readonly campagneUrl = `${environment.apiUrl}/campagnes`;

  constructor(private http: HttpClient) {}

  // ============ INSCRIPTIONS ============

  /**
   * Récupérer toutes les inscriptions
   */
  getAll(): Observable<Inscription[]> {
    return this.http.get<Inscription[]>(this.baseUrl);
  }

  /**
   * Récupérer une inscription par ID
   */
  getById(id: number): Observable<Inscription> {
    return this.http.get<Inscription>(`${this.baseUrl}/${id}`);
  }

  /**
   * Récupérer les inscriptions d'un doctorant
   */
  getByDoctorant(doctorantId: number): Observable<Inscription[]> {
    return this.http.get<Inscription[]>(`${this.baseUrl}/doctorant/${doctorantId}`);
  }

  /**
   * Récupérer les inscriptions à valider (directeur)
   */
  getByDirecteur(directeurId: number): Observable<Inscription[]> {
    return this.http.get<Inscription[]>(`${this.baseUrl}/directeur/${directeurId}`);
  }

  /**
   * Récupérer les inscriptions par statut
   */
  getByStatut(statut: StatutInscription): Observable<Inscription[]> {
    return this.http.get<Inscription[]>(`${this.baseUrl}/statut/${statut}`);
  }

  /**
   * Créer une nouvelle inscription
   */
  create(inscription: CreateInscriptionRequest): Observable<Inscription> {
    return this.http.post<Inscription>(this.baseUrl, inscription);
  }

  /**
   * Mettre à jour une inscription
   */
  update(id: number, inscription: Partial<Inscription>): Observable<Inscription> {
    return this.http.put<Inscription>(`${this.baseUrl}/${id}`, inscription);
  }

  /**
   * Supprimer une inscription
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Soumettre une inscription (BROUILLON -> SOUMIS)
   */
  soumettre(id: number): Observable<Inscription> {
    return this.http.put<Inscription>(`${this.baseUrl}/${id}/soumettre`, {});
  }

  /**
   * Valider par directeur
   */
  validerParDirecteur(id: number, commentaire?: string): Observable<Inscription> {
    return this.http.put<Inscription>(`${this.baseUrl}/${id}/valider-directeur`, { commentaire });
  }

  /**
   * Rejeter par directeur
   */
  rejeterParDirecteur(id: number, commentaire: string): Observable<Inscription> {
    return this.http.put<Inscription>(`${this.baseUrl}/${id}/rejeter-directeur`, { commentaire });
  }

  /**
   * Valider par admin
   */
  validerParAdmin(id: number, commentaire?: string): Observable<Inscription> {
    return this.http.put<Inscription>(`${this.baseUrl}/${id}/valider-admin`, { commentaire });
  }

  /**
   * Rejeter par admin
   */
  rejeterParAdmin(id: number, commentaire: string): Observable<Inscription> {
    return this.http.put<Inscription>(`${this.baseUrl}/${id}/rejeter-admin`, { commentaire });
  }

  // ============ CAMPAGNES ============

  /**
   * Récupérer toutes les campagnes
   */
  getAllCampagnes(): Observable<Campagne[]> {
    return this.http.get<Campagne[]>(this.campagneUrl);
  }

  /**
   * Récupérer la campagne active
   */
  getCampagneActive(): Observable<Campagne> {
    return this.http.get<Campagne>(`${this.campagneUrl}/active`);
  }

  /**
   * Récupérer une campagne par ID
   */
  getCampagneById(id: number): Observable<Campagne> {
    return this.http.get<Campagne>(`${this.campagneUrl}/${id}`);
  }

  /**
   * Créer une campagne
   */
  createCampagne(campagne: Partial<Campagne>): Observable<Campagne> {
    return this.http.post<Campagne>(this.campagneUrl, campagne);
  }

  /**
   * Mettre à jour une campagne
   */
  updateCampagne(id: number, campagne: Partial<Campagne>): Observable<Campagne> {
    return this.http.put<Campagne>(`${this.campagneUrl}/${id}`, campagne);
  }

  /**
   * Activer une campagne
   */
  activerCampagne(id: number): Observable<Campagne> {
    return this.http.put<Campagne>(`${this.campagneUrl}/${id}/activer`, {});
  }
}
