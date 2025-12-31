import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Derogation, EligibiliteReinscription, DemandeDerogationRequest } from '../models/derogation.model';

@Injectable({
  providedIn: 'root'
})
export class DerogationService {
  private apiUrl = `${environment.inscriptionServiceUrl}/derogations`;

  constructor(private http: HttpClient) {}

  // ==================== DOCTORANT ====================

  verifierEligibilite(doctorantId: number): Observable<EligibiliteReinscription> {
    return this.http.get<EligibiliteReinscription>(`${this.apiUrl}/eligibilite/${doctorantId}`);
  }

  demanderDerogation(data: DemandeDerogationRequest): Observable<Derogation> {
    return this.http.post<Derogation>(this.apiUrl, data);
  }

  getMesDerogations(doctorantId: number): Observable<Derogation[]> {
    return this.http.get<Derogation[]>(`${this.apiUrl}/doctorant/${doctorantId}`);
  }

  // ==================== DIRECTEUR ====================

  getDerogationsDirecteur(directeurId: number): Observable<Derogation[]> {
    return this.http.get<Derogation[]>(`${this.apiUrl}/directeur/${directeurId}`);
  }

  validerParDirecteur(derogationId: number, directeurId: number, commentaire?: string): Observable<Derogation> {
    return this.http.put<Derogation>(`${this.apiUrl}/${derogationId}/valider-directeur`, {
      directeurId,
      commentaire
    });
  }

  refuserParDirecteur(derogationId: number, directeurId: number, commentaire: string): Observable<Derogation> {
    return this.http.put<Derogation>(`${this.apiUrl}/${derogationId}/refuser-directeur`, {
      directeurId,
      commentaire
    });
  }

  // ==================== ADMIN ====================

  getAllDerogations(): Observable<Derogation[]> {
    return this.http.get<Derogation[]>(this.apiUrl);
  }

  getDerogationsEnAttenteAdmin(): Observable<Derogation[]> {
    return this.http.get<Derogation[]>(`${this.apiUrl}/en-attente-admin`);
  }

  getDerogationsEnAttente(): Observable<Derogation[]> {
    return this.http.get<Derogation[]>(`${this.apiUrl}/en-attente`);
  }

  approuverDerogation(derogationId: number, decideurId: number, commentaire?: string): Observable<Derogation> {
    return this.http.put<Derogation>(`${this.apiUrl}/${derogationId}/approuver`, {
      decideurId,
      commentaire
    });
  }

  refuserDerogation(derogationId: number, decideurId: number, commentaire: string): Observable<Derogation> {
    return this.http.put<Derogation>(`${this.apiUrl}/${derogationId}/refuser`, {
      decideurId,
      commentaire
    });
  }

  // ==================== COMMUN ====================

  getDerogationById(id: number): Observable<Derogation> {
    return this.http.get<Derogation>(`${this.apiUrl}/${id}`);
  }

  getStatistiques(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }
}