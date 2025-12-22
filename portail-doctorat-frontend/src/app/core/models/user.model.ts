export interface User {
  id: number;
  username: string;
  email: string;
  nom: string;
  prenom: string;
  role: Role | string; // Accepte string au cas où
  enabled: boolean;
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
  role: string; // Le backend renvoie une string
  message: string;
}

// 🔴 C'EST ICI QUE CA SE JOUE :
export enum Role {
  ADMIN = 'ADMIN',
  DOCTORANT = 'DOCTORANT',
  DIRECTEUR_THESE = 'DIRECTEUR_THESE',
  CHEF_FILIERE = 'CHEF_FILIERE',
  RESPONSABLE_CEDOC = 'RESPONSABLE_CEDOC',
  CANDIDAT = 'CANDIDAT' // <--- VERIFIEZ QUE CETTE LIGNE EST PRÉSENTE !
}

export interface LoginRequest {
  username?: string;
  password?: string;
}

export interface RegisterRequest {
  nom: string;
  prenom: string;
  username: string;
  email: string;
  password: string;
  role?: string;
}