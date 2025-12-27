export interface User {
  id: number;
  username: string; // Sert de Matricule ou CNIE
  email: string;
  nom: string;
  prenom: string;
  role: Role | string;
  enabled: boolean;
  telephone?: string;

  // Documents (Noms des fichiers stockés sur le serveur)
  cv?: string;
  diplome?: string;
  lettreMotivation?: string;

  // Gestion du Workflow
  etat?: EtatCandidature | string; // Ex: EN_ATTENTE_ADMIN
  motifRefus?: string;             // Rempli si refusé

  // ✅ Directeur de thèse assigné
  directeurId?: number;

  // ✅ Sujet de thèse (assigné par le directeur lors de l'acceptation)
  // Le champ peut s'appeler titreThese (backend) ou sujetThese (alias frontend)
  titreThese?: string;
  sujetThese?: string;

  // ✅ Champs pour le suivi
  dateInscription?: string;
  anneeThese?: number;      // 1, 2, 3, 4, 5, 6

  // Progression Prérequis
  nbPublications?: number;  // Requis: 2
  nbConferences?: number;   // Requis: 2
  heuresFormation?: number; // Requis: 200

  createdAt?: string;
  updatedAt?: string;
}

export enum EtatCandidature {
  EN_ATTENTE_ADMIN = 'EN_ATTENTE_ADMIN',
  EN_ATTENTE_DIRECTEUR = 'EN_ATTENTE_DIRECTEUR',
  VALIDE = 'VALIDE',
  REFUSE = 'REFUSE'
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userId: number;
  username: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  telephone: string;
  message: string;

  // ✅ Ajout du sujet de thèse dans la réponse d'authentification
  titreThese?: string;
  sujetThese?: string;
}

export enum Role {
  ADMIN = 'ADMIN',
  DOCTORANT = 'DOCTORANT',
  DIRECTEUR_THESE = 'DIRECTEUR_THESE',
  CANDIDAT = 'CANDIDAT'
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  nom: string;
  prenom: string;
  matricule: string;
  telephone: string;
  email: string;
  password: string;
}

export interface UpdateSuiviRequest {
  anneeThese?: number;
  nbPublications?: number;
  nbConferences?: number;
  heuresFormation?: number;
}