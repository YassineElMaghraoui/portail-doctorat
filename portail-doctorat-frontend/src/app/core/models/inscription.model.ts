export interface Inscription {
  id: number;
  doctorantId: number;
  directeurId: number;
  campagne?: Campagne;
  sujetThese: string;
  laboratoireAccueil: string;
  collaborationExterne?: string;
  statut: StatutInscription;
  typeInscription: TypeInscription;
  anneeInscription: number;
  datePremiereInscription?: string;
  commentaireDirecteur?: string;
  commentaireAdmin?: string;
  dateValidationDirecteur?: string;
  dateValidationAdmin?: string;
  createdAt: string;
  updatedAt?: string;

  // Infos utilisateur (ajoutées par le frontend)
  doctorantNom?: string;
  directeurNom?: string;
}

export interface Campagne {
  id: number;
  titre: string;
  anneeUniversitaire: string;
  dateDebut: string;
  dateFin: string;
  active: boolean;
  description?: string;
}

export enum StatutInscription {
  BROUILLON = 'BROUILLON',
  SOUMIS = 'SOUMIS',
  VALIDE_DIRECTEUR = 'VALIDE_DIRECTEUR',
  VALIDE_ADMIN = 'VALIDE_ADMIN',
  REJETE_DIRECTEUR = 'REJETE_DIRECTEUR',
  REJETE_ADMIN = 'REJETE_ADMIN'
}

export enum TypeInscription {
  PREMIERE_INSCRIPTION = 'PREMIERE_INSCRIPTION',
  REINSCRIPTION = 'REINSCRIPTION'
}

export interface CreateInscriptionRequest {
  doctorantId: number;
  directeurId: number;

  // MODIFICATION ICI : On remplace campagneId par un objet pour matcher le Backend
  campagne: { id: number };

  sujetThese: string;
  laboratoireAccueil: string;
  collaborationExterne?: string;
  typeInscription: TypeInscription;

  // AJOUT ICI : Pour accepter la liste vide envoyée par le formulaire
  documents?: any[];
}