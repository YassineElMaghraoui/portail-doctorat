export interface Derogation {
  id: number;
  doctorantId: number;
  typeDerogation: TypeDerogation;
  statut: StatutDerogation;
  motif: string;
  anneeDemandee: number;
  dateDemande: string;
  dateDecision?: string;
  decideParId?: number;
  commentaireDecision?: string;
  dateExpiration?: string;
  createdAt: string;
  
  // Infos supplémentaires
  doctorantNom?: string;
}

export interface EligibiliteReinscription {
  eligible: boolean;
  anneeActuelle: number;
  prochaineAnnee: number;
  derogationRequise: boolean;
  derogationObtenue: boolean;
  typeDerogationRequise?: TypeDerogation;
  message: string;
  anneesRestantes: number;
  enPeriodeAlerte: boolean;
}

export interface DemandeDerogationRequest {
  doctorantId: number;
  typeDerogation: TypeDerogation;
  motif: string;
}

export interface DecisionDerogationRequest {
  derogationId: number;
  approuver: boolean;
  decideurId: number;
  commentaire?: string;
}

export enum TypeDerogation {
  PROLONGATION_4EME_ANNEE = 'PROLONGATION_4EME_ANNEE',
  PROLONGATION_5EME_ANNEE = 'PROLONGATION_5EME_ANNEE',
  PROLONGATION_6EME_ANNEE = 'PROLONGATION_6EME_ANNEE',
  SUSPENSION_TEMPORAIRE = 'SUSPENSION_TEMPORAIRE',
  AUTRE = 'AUTRE'
}

export enum StatutDerogation {
  EN_ATTENTE = 'EN_ATTENTE',
  APPROUVEE = 'APPROUVEE',
  REFUSEE = 'REFUSEE',
  EXPIREE = 'EXPIREE',
  ANNULEE = 'ANNULEE'
}
