export interface Soutenance {
  id: number;
  doctorantId: number;
  directeurId: number;
  sujetThese: string;
  statut: StatutSoutenance;
  prerequis?: Prerequis;
  jury: MembreJury[];
  dateSoutenance?: string;
  heureSoutenance?: string;
  lieuSoutenance?: string;
  noteFinale?: number;
  mention?: string;
  felicitationsJury?: boolean;
  createdAt: string;
  updatedAt?: string;
  
  // Infos utilisateur
  doctorantNom?: string;
  directeurNom?: string;
}

export interface Prerequis {
  id: number;
  nombreArticlesQ1Q2: number;
  nombreConferences: number;
  heuresFormation: number;
  valide: boolean;
}

export interface MembreJury {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  etablissement: string;
  roleJury: RoleJury;
  rapportRecu?: boolean;
  rapportFavorable?: boolean;
}

export enum StatutSoutenance {
  BROUILLON = 'BROUILLON',
  SOUMIS = 'SOUMIS',
  PREREQUIS_VALIDES = 'PREREQUIS_VALIDES',
  JURY_PROPOSE = 'JURY_PROPOSE',
  AUTORISEE = 'AUTORISEE',
  PLANIFIEE = 'PLANIFIEE',
  TERMINEE = 'TERMINEE',
  REJETEE = 'REJETEE'
}

export enum RoleJury {
  PRESIDENT = 'PRESIDENT',
  RAPPORTEUR = 'RAPPORTEUR',
  EXAMINATEUR = 'EXAMINATEUR',
  DIRECTEUR = 'DIRECTEUR',
  CO_DIRECTEUR = 'CO_DIRECTEUR'
}

export interface CreateSoutenanceRequest {
  doctorantId: number;
  directeurId: number;
  sujetThese: string;
  prerequis: {
    nombreArticlesQ1Q2: number;
    nombreConferences: number;
    heuresFormation: number;
  };
}
