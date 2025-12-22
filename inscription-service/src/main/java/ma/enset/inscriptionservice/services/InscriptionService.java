package ma.enset.inscriptionservice.services;

import ma.enset.inscriptionservice.entities.Inscription;
import ma.enset.inscriptionservice.enums.StatutInscription;

import java.util.List;
import java.util.Optional;

public interface InscriptionService {

    Inscription createInscription(Inscription inscription);

    Inscription updateInscription(Long id, Inscription inscription);

    void deleteInscription(Long id);

    Optional<Inscription> getInscriptionById(Long id);

    List<Inscription> getAllInscriptions();

    List<Inscription> getInscriptionsByDoctorant(Long doctorantId);

    List<Inscription> getInscriptionsByDirecteur(Long directeurId);

    List<Inscription> getInscriptionsByStatut(StatutInscription statut);

    Inscription changerStatut(Long id, StatutInscription nouveauStatut, String commentaire);

    Inscription validerParDirecteur(Long id, String commentaire);

    Inscription validerParAdmin(Long id, String commentaire);

    Inscription rejeterParDirecteur(Long id, String commentaire);

    Inscription rejeterParAdmin(Long id, String commentaire);

    // ✅ INDISPENSABLE POUR QUE LE CONTRÔLEUR FONCTIONNE
    Inscription soumettreInscription(Long id);
}