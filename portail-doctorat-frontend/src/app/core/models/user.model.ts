export interface User {
  id: number;
  username: string;
  email: string;
  nom: string;
  prenom: string;
  role: Role;
  enabled: boolean;
  createdAt?: string;
}

export enum Role {
  DOCTORANT = 'DOCTORANT',
  DIRECTEUR_THESE = 'DIRECTEUR_THESE',
  CHEF_FILIERE = 'CHEF_FILIERE',
  RESPONSABLE_CEDOC = 'RESPONSABLE_CEDOC',
  ADMIN = 'ADMIN'
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  nom: string;
  prenom: string;
  role?: Role;
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
  role: Role;
  message: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}
