package ma.enset.soutenanceservice.services;

import ma.enset.soutenanceservice.entities.JuryDisponible;
import ma.enset.soutenanceservice.entities.MembreJury;
import ma.enset.soutenanceservice.entities.Soutenance;
import ma.enset.soutenanceservice.enums.RoleJury;
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
    // ÉTAPE 1: DIRECTEUR - Valide les prérequis
    // SOUMIS → PREREQUIS_VALIDES
    // ========================================================

    Soutenance validerPrerequisDirecteur(Long soutenanceId, String commentaire);
    Soutenance rejeterParDirecteur(Long soutenanceId, String commentaire);

    // ========================================================
    // JURYS DISPONIBLES (pour sélection dropdown)
    // ========================================================

    /**
     * Récupérer tous les jurys disponibles
     */
    List<JuryDisponible> getJurysDisponibles();

    /**
     * Récupérer les jurys disponibles par rôle
     * @param role - PRESIDENT, RAPPORTEUR, EXAMINATEUR
     */
    List<JuryDisponible> getJurysDisponiblesByRole(RoleJury role);

    /**
     * Récupérer un jury disponible par ID
     */
    Optional<JuryDisponible> getJuryDisponibleById(Long id);

    // ========================================================
    // ÉTAPE 2: DIRECTEUR - Propose le jury
    // PREREQUIS_VALIDES → JURY_PROPOSE
    // ========================================================

    Soutenance ajouterMembreJury(Long soutenanceId, MembreJury membreJury);
    Soutenance supprimerMembreJury(Long soutenanceId, Long membreId);
    Soutenance proposerJury(Long soutenanceId);

    // ========================================================
    // ÉTAPE 3: ADMIN - Valide ou refuse le jury
    // JURY_PROPOSE → AUTORISEE ou → PREREQUIS_VALIDES (retour)
    // ========================================================

    Soutenance validerJury(Long soutenanceId, String commentaire);
    Soutenance refuserJury(Long soutenanceId, String commentaire);

    // ========================================================
    // ÉTAPE 4: DIRECTEUR - Propose date de soutenance
    // ========================================================

    Soutenance proposerDateSoutenance(Long soutenanceId, LocalDate date, LocalTime heure, String lieu);

    // ========================================================
    // ÉTAPE 5: ADMIN - Planifie la soutenance
    // AUTORISEE → PLANIFIEE
    // ========================================================

    Soutenance planifierSoutenance(Long soutenanceId, LocalDate date, LocalTime heure, String lieu);
    Soutenance refuserPlanification(Long soutenanceId, String commentaire);

    // ========================================================
    // ÉTAPE 6: RÉSULTAT
    // PLANIFIEE → TERMINEE
    // ========================================================

    Soutenance enregistrerResultat(Long id, Double note, String mention, Boolean felicitations);

    // ========================================================
    // AUTRES
    // ========================================================

    Soutenance rejeterSoutenance(Long id, String motif);
    Soutenance soumettreRapportRapporteur(Long soutenanceId, Long membreJuryId, Boolean avisFavorable, String commentaire);

    // Legacy
    Soutenance verifierPrerequisEtSoumettre(Long id);
    Soutenance autoriserSoutenance(Long id, String commentaire);
}