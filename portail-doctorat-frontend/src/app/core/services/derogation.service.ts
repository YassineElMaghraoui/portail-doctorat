import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { 
  Derogation, 
  EligibiliteReinscription, 
  DemandeDerogationRequest,
  StatutDerogation 
} from '../models/derogation.model';

@Injectable({
  providedIn: 'root'
})
export class DerogationService {
  private readonly baseUrl = `${environment.apiUrl}/derogations`;

  constructor(private http: HttpClient) {}

  /**
   * Vérifier l'éligibilité à la réinscription
   */
  verifierEligibilite(doctorantId: number): Observable<EligibiliteReinscription> {
    return this.http.get<EligibiliteReinscription>(`${this.baseUrl}/eligibilite/${doctorantId}`);
  }

  /**
   * Obtenir l'année de doctorat et les alertes
   */
  getAnneeDoctorat(doctorantId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/annee/${doctorantId}`);
  }

  /**
   * Demander une dérogation
   */
  demanderDerogation(request: DemandeDerogationRequest): Observable<Derogation> {
    return this.http.post<Derogation>(this.baseUrl, request);
  }

  /**
   * Récupérer mes dérogations (doctorant)
   */
  getMesDerogations(doctorantId: number): Observable<Derogation[]> {
    return this.http.get<Derogation[]>(`${this.baseUrl}/doctorant/${doctorantId}`);
  }

  /**
   * Récupérer une dérogation par ID
   */
  getById(id: number): Observable<Derogation> {
    return this.http.get<Derogation>(`${this.baseUrl}/${id}`);
  }

  /**
   * Récupérer toutes les dérogations en attente (admin)
   */
  getDerogationsEnAttente(): Observable<Derogation[]> {
    return this.http.get<Derogation[]>(`${this.baseUrl}/en-attente`);
  }

  /**
   * Récupérer les dérogations par statut
   */
  getByStatut(statut: StatutDerogation): Observable<Derogation[]> {
    return this.http.get<Derogation[]>(`${this.baseUrl}/statut/${statut}`);
  }

  /**
   * Approuver une dérogation
   */
  approuver(id: number, decideurId: number, commentaire?: string): Observable<Derogation> {
    const params: any = { decideurId };
    if (commentaire) params.commentaire = commentaire;
    return this.http.put<Derogation>(`${this.baseUrl}/${id}/approuver`, null, { params });
  }

  /**
   * Refuser une dérogation
   */
  refuser(id: number, decideurId: number, commentaire: string): Observable<Derogation> {
    return this.http.put<Derogation>(`${this.baseUrl}/${id}/refuser`, null, {
      params: { decideurId, commentaire }
    });
  }

  /**
   * Obtenir les statistiques
   */
  getStatistiques(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/stats`);
  }
}
