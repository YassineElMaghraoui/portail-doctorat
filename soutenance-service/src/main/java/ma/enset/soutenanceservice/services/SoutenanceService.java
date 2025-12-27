package ma.enset.soutenanceservice.services;

import ma.enset.soutenanceservice.entities.MembreJury;
import ma.enset.soutenanceservice.entities.Soutenance;
import ma.enset.soutenanceservice.enums.StatutSoutenance;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface SoutenanceService {

    // ========================================================
    // CRUD
    // ========================================================

    Soutenance createSoutenance(Soutenance soutenance);

    Soutenance soumettreDemande(String titre, Long doctorantId, Long directeurId,
                                MultipartFile manuscrit, MultipartFile rapportAntiPlagiat,
                                MultipartFile autorisation);

    Soutenance updateSoutenance(Long id, Soutenance soutenance);

    void deleteSoutenance(Long id);

    Optional<Soutenance> getSoutenanceById(Long id);

    List<Soutenance> getAllSoutenances();

    List<Soutenance> getSoutenancesByDoctorant(Long doctorantId);

    List<Soutenance> getSoutenancesByDirecteur(Long directeurId);

    List<Soutenance> getSoutenancesByStatut(StatutSoutenance statut);

    // ========================================================
    // ✅ WORKFLOW DIRECTEUR - NOUVELLES MÉTHODES
    // ========================================================

    /**
     * Directeur valide les prérequis d'une soutenance
     * Change le statut de SOUMIS → PREREQUIS_VALIDES
     *
     * @param soutenanceId ID de la soutenance
     * @param commentaire Commentaire optionnel du directeur
     * @return La soutenance mise à jour
     */
    Soutenance validerPrerequisDirecteur(Long soutenanceId, String commentaire);

    /**
     * Directeur demande des corrections (rejet temporaire)
     * Change le statut → REJETEE avec commentaire dans commentaire_directeur
     *
     * @param soutenanceId ID de la soutenance
     * @param commentaire Motif du rejet / corrections demandées (obligatoire)
     * @return La soutenance mise à jour
     */
    Soutenance rejeterParDirecteur(Long soutenanceId, String commentaire);

    // ========================================================
    // WORKFLOW EXISTANT
    // ========================================================

    /**
     * @deprecated Utiliser validerPrerequisDirecteur() à la place
     * Vérifie automatiquement les prérequis depuis l'objet soutenance.prerequis
     */
    Soutenance verifierPrerequisEtSoumettre(Long id);

    Soutenance ajouterMembreJury(Long soutenanceId, MembreJury membreJury);

    Soutenance proposerJury(Long id);

    Soutenance soumettreRapportRapporteur(Long soutenanceId, Long membreJuryId,
                                          Boolean avisFavorable, String commentaire);

    Soutenance autoriserSoutenance(Long id, String commentaire);

    Soutenance planifierSoutenance(Long id, LocalDate date, LocalTime heure, String lieu);

    Soutenance enregistrerResultat(Long id, Double note, String mention, Boolean felicitations);

    Soutenance rejeterSoutenance(Long id, String motif);
}