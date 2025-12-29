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

/**
 * Service de gestion des soutenances
 *
 * WORKFLOW CORRECT:
 * 1. SOUMIS → Directeur valide prérequis → PREREQUIS_VALIDES
 * 2. PREREQUIS_VALIDES → Admin autorise → AUTORISEE
 * 3. AUTORISEE → Directeur propose jury → JURY_PROPOSE
 * 4. JURY_PROPOSE → Admin valide jury + planifie → PLANIFIEE
 * 5. PLANIFIEE → Admin enregistre résultat → TERMINEE
 */
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
    // ÉTAPE 2: ADMIN - Autorise la demande
    // PREREQUIS_VALIDES → AUTORISEE
    // ========================================================

    /**
     * L'admin approuve la demande après validation des prérequis par le directeur.
     * Le directeur pourra ensuite proposer le jury.
     */
    Soutenance autoriserDemande(Long soutenanceId, String commentaire);

    // ========================================================
    // JURYS DISPONIBLES
    // ========================================================

    List<JuryDisponible> getJurysDisponibles();
    List<JuryDisponible> getJurysDisponiblesByRole(RoleJury role);
    Optional<JuryDisponible> getJuryDisponibleById(Long id);

    // ========================================================
    // ÉTAPE 3: DIRECTEUR - Propose le jury
    // AUTORISEE → JURY_PROPOSE
    // ========================================================

    Soutenance ajouterMembreJury(Long soutenanceId, MembreJury membreJury);
    Soutenance supprimerMembreJury(Long soutenanceId, Long membreId);
    Soutenance proposerJury(Long soutenanceId);

    // ========================================================
    // ÉTAPE 4: ADMIN - Valide ou refuse le jury
    // ========================================================

    Soutenance validerJury(Long soutenanceId, String commentaire);
    Soutenance refuserJury(Long soutenanceId, String commentaire);

    // ========================================================
    // ÉTAPE 5: ADMIN - Planifie la soutenance
    // ========================================================

    Soutenance planifierSoutenance(Long soutenanceId, LocalDate date, LocalTime heure, String lieu);
    Soutenance refuserPlanification(Long soutenanceId, String commentaire);
    Soutenance proposerDateSoutenance(Long soutenanceId, LocalDate date, LocalTime heure, String lieu);

    // ========================================================
    // ÉTAPE 6: RÉSULTAT
    // ========================================================

    Soutenance enregistrerResultat(Long id, Double note, String mention, Boolean felicitations);

    // ========================================================
    // AUTRES
    // ========================================================

    Soutenance rejeterSoutenance(Long id, String motif);
    Soutenance soumettreRapportRapporteur(Long soutenanceId, Long membreJuryId, Boolean avisFavorable, String commentaire);
    Soutenance verifierPrerequisEtSoumettre(Long id);

    @Deprecated
    Soutenance autoriserSoutenance(Long id, String commentaire);
}