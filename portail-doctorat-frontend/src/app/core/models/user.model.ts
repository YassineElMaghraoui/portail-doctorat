export interface User {
  id: number;
  username: string; // C'est le Matricule
  email: string;
  nom: string;
  prenom: string;
  role: Role | string;
  enabled: boolean;

  // ✅ AJOUTEZ CETTE LIGNE :
  telephone?: string;

  createdAt?: string;
  updatedAt?: string;
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
  message: string;
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