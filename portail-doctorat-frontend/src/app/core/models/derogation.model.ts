export interface Derogation {
  id: number;
  doctorantId: number;
  directeurId?: number;
  typeDerogation: TypeDerogation; // Utilise le type union
  statut: StatutDerogation;       // Utilise le type union
  motif: string;
  anneeDemandee: number;

  // Dates
  dateDemande: string; // ISO String
  dateValidationDirecteur?: string;
  dateDecision?: string;
  dateExpiration?: string;
  createdAt: string;

  // Validation directeur
  commentaireDirecteur?: string;
  valideParDirecteur?: boolean;

  // Décision admin
  decideParId?: number;
  commentaireDecision?: string;

  // Infos enrichies (transient)
  doctorantNom?: string;
  doctorantPrenom?: string;
  doctorantEmail?: string;
  directeurNom?: string;
  directeurPrenom?: string;
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
  directeurId?: number;
  typeDerogation: TypeDerogation;
  motif: string;
}

export interface DecisionDerogationRequest {
  derogationId: number;
  approuver: boolean;
  decideurId: number;
  commentaire?: string;
}

// ✅ UTILISATION DE TYPE UNION (Plus souple pour le template)
export type TypeDerogation =
    | 'PROLONGATION_4EME_ANNEE'
    | 'PROLONGATION_5EME_ANNEE'
    | 'PROLONGATION_6EME_ANNEE'
    | 'SUSPENSION_TEMPORAIRE'
    | 'AUTRE';

export type StatutDerogation =
    | 'EN_ATTENTE_DIRECTEUR'
    | 'EN_ATTENTE_ADMIN'
    | 'EN_ATTENTE'
    | 'APPROUVEE'
    | 'REFUSEE'
    | 'EXPIREE'
    | 'ANNULEE';