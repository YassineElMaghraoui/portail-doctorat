export enum Role {
  ADMIN = 'ADMIN',
  DOCTORANT = 'DOCTORANT',
  DIRECTEUR_THESE = 'DIRECTEUR_THESE',
  CANDIDAT = 'CANDIDAT'
}

export enum EtatCandidature {
  EN_ATTENTE_ADMIN = 'EN_ATTENTE_ADMIN',
  EN_ATTENTE_DIRECTEUR = 'EN_ATTENTE_DIRECTEUR',
  VALIDE = 'VALIDE',
  REFUSE = 'REFUSE'
}

export interface User {
  id: number;
  username: string; // Matricule ou CNIE
  email: string;
  nom: string;
  prenom: string;
  role: Role | string;
  enabled: boolean;
  telephone?: string;

  // Documents
  cv?: string;
  diplome?: string;
  lettreMotivation?: string;

  // Workflow
  etat?: EtatCandidature | string;
  motifRefus?: string;

  // ✅ Relation Directeur
  directeurId?: number;

  // ✅ Thèse
  titreThese?: string;
  sujetThese?: string; // Alias pour le front

  // ✅ Suivi & Progression (Utilisés dans "Mes Doctorants")
  dateInscription?: string;
  anneeThese?: number;
  nbPublications?: number;
  nbConferences?: number;
  heuresFormation?: number;

  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: number;
  username: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  titreThese?: string;
  sujetThese?: string;
}