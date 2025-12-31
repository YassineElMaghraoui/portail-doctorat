package ma.enset.soutenanceservice.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.enset.soutenanceservice.clients.UserServiceClient;
import ma.enset.soutenanceservice.dto.UserDTO;
import ma.enset.soutenanceservice.entities.JuryDisponible;
import ma.enset.soutenanceservice.entities.MembreJury;
import ma.enset.soutenanceservice.entities.Soutenance;
import ma.enset.soutenanceservice.enums.RoleJury;
import ma.enset.soutenanceservice.enums.StatutSoutenance;
import ma.enset.soutenanceservice.events.SoutenanceCreatedEvent;
import ma.enset.soutenanceservice.events.SoutenanceStatusChangedEvent;
import ma.enset.soutenanceservice.repositories.JuryDisponibleRepository;
import ma.enset.soutenanceservice.repositories.MembreJuryRepository;
import ma.enset.soutenanceservice.repositories.SoutenanceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class SoutenanceServiceImpl implements SoutenanceService {

    private final SoutenanceRepository soutenanceRepository;
    private final MembreJuryRepository membreJuryRepository;
    private final JuryDisponibleRepository juryDisponibleRepository;
    private final UserServiceClient userServiceClient;
    private final SoutenanceEventPublisher eventPublisher;

    private final Path rootLocation = Paths.get("uploads/soutenances");

    // ========================================================
    // CRUD DE BASE
    // ========================================================

    @Override
    public Soutenance createSoutenance(Soutenance soutenance) {
        log.info("Creating soutenance for doctorant: {}", soutenance.getDoctorantId());

        UserDTO doctorant = null;
        UserDTO directeur = null;

        try {
            doctorant = userServiceClient.getUserById(soutenance.getDoctorantId());
            directeur = userServiceClient.getUserById(soutenance.getDirecteurId());
            log.info("Doctorant vérifié: {} {} (Pubs: {}, Conf: {}, Formation: {}h)",
                    doctorant.getPrenom(), doctorant.getNom(),
                    doctorant.getNbPublications(), doctorant.getNbConferences(), doctorant.getHeuresFormation());
        } catch (Exception e) {
            log.error("Erreur lors de la vérification des utilisateurs: {}", e.getMessage());
            // On continue même si le User Service est down, pour ne pas bloquer le test
        }

        Soutenance saved = soutenanceRepository.save(soutenance);

        try {
            SoutenanceCreatedEvent event = SoutenanceCreatedEvent.builder()
                    .soutenanceId(saved.getId())
                    .doctorantId(saved.getDoctorantId())
                    .doctorantEmail(doctorant != null ? doctorant.getEmail() : null)
                    .doctorantNom(doctorant != null ? doctorant.getNom() : null)
                    .doctorantPrenom(doctorant != null ? doctorant.getPrenom() : null)
                    .sujetThese(saved.getTitreThese())
                    .directeurTheseEmail(directeur != null ? directeur.getEmail() : null)
                    .directeurTheseNom(directeur != null ? directeur.getNom() + " " + directeur.getPrenom() : null)
                    .status(saved.getStatut().name())
                    .build();
            eventPublisher.publishSoutenanceCreated(event);
        } catch (Exception e) {
            log.warn("⚠️ Impossible de publier l'événement Kafka: {}", e.getMessage());
        }

        return saved;
    }

    @Override
    public Soutenance soumettreDemande(String titre, Long doctorantId, Long directeurId,
                                       MultipartFile manuscrit, MultipartFile rapportAntiPlagiat, MultipartFile autorisation) {
        log.info("Soumission demande soutenance pour doctorant: {}", doctorantId);

        String manuscritPath = saveFile(manuscrit, "manuscrit");
        String rapportPath = saveFile(rapportAntiPlagiat, "anti-plagiat");
        String autorisationPath = (autorisation != null && !autorisation.isEmpty()) ? saveFile(autorisation, "autorisation") : null;

        Soutenance soutenance = new Soutenance();
        soutenance.setTitreThese(titre);
        soutenance.setDoctorantId(doctorantId);
        soutenance.setDirecteurId(directeurId);
        soutenance.setCheminManuscrit(manuscritPath);
        soutenance.setCheminRapportAntiPlagiat(rapportPath);
        soutenance.setCheminAutorisation(autorisationPath);
        soutenance.setStatut(StatutSoutenance.SOUMIS);

        return createSoutenance(soutenance);
    }

    private String saveFile(MultipartFile file, String prefix) {
        try {
            if (file == null || file.isEmpty()) return null;
            if (!Files.exists(rootLocation)) Files.createDirectories(rootLocation);

            String extension = "";
            if (file.getOriginalFilename() != null && file.getOriginalFilename().contains(".")) {
                extension = file.getOriginalFilename().substring(file.getOriginalFilename().lastIndexOf("."));
            }

            String filename = prefix + "_" + UUID.randomUUID() + extension;
            Path destination = rootLocation.resolve(filename);
            Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
            return filename;
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de la sauvegarde du fichier: " + e.getMessage());
        }
    }

    @Override
    public Soutenance updateSoutenance(Long id, Soutenance soutenance) {
        return soutenanceRepository.findById(id)
                .map(existing -> {
                    existing.setTitreThese(soutenance.getTitreThese());
                    existing.setResume(soutenance.getResume());
                    existing.setMotsCles(soutenance.getMotsCles());
                    return soutenanceRepository.save(existing);
                })
                .orElseThrow(() -> new RuntimeException("Soutenance non trouvée avec l'id: " + id));
    }

    @Override
    public void deleteSoutenance(Long id) {
        soutenanceRepository.deleteById(id);
    }

    @Override
    public Optional<Soutenance> getSoutenanceById(Long id) {
        Optional<Soutenance> soutenance = soutenanceRepository.findById(id);
        soutenance.ifPresent(this::enrichirAvecInfosUtilisateurs);
        return soutenance;
    }

    @Override
    public List<Soutenance> getAllSoutenances() {
        List<Soutenance> soutenances = soutenanceRepository.findAll();
        soutenances.forEach(this::enrichirAvecInfosUtilisateurs);
        return soutenances;
    }

    @Override
    public List<Soutenance> getSoutenancesByDoctorant(Long doctorantId) {
        List<Soutenance> soutenances = soutenanceRepository.findByDoctorantId(doctorantId);
        soutenances.forEach(this::enrichirAvecInfosUtilisateurs);
        return soutenances;
    }

    @Override
    public List<Soutenance> getSoutenancesByDirecteur(Long directeurId) {
        List<Soutenance> soutenances = soutenanceRepository.findByDirecteurId(directeurId);
        soutenances.forEach(this::enrichirAvecInfosUtilisateurs);
        return soutenances;
    }

    @Override
    public List<Soutenance> getSoutenancesByStatut(StatutSoutenance statut) {
        List<Soutenance> soutenances = soutenanceRepository.findByStatut(statut);
        soutenances.forEach(this::enrichirAvecInfosUtilisateurs);
        return soutenances;
    }

    // ========================================================
    // ÉTAPE 1: DIRECTEUR - Valide les prérequis
    // SOUMIS → PREREQUIS_VALIDES
    // ========================================================

    @Override
    public Soutenance validerPrerequisDirecteur(Long soutenanceId, String commentaire) {
        log.info("✅ Validation prérequis par directeur pour soutenance: {}", soutenanceId);

        return soutenanceRepository.findById(soutenanceId)
                .map(soutenance -> {
                    if (soutenance.getStatut() != StatutSoutenance.SOUMIS) {
                        throw new RuntimeException("Statut invalide. Attendu: SOUMIS, Actuel: " + soutenance.getStatut());
                    }

                    String ancienStatut = soutenance.getStatut().name();
                    soutenance.setStatut(StatutSoutenance.PREREQUIS_VALIDES);
                    if (commentaire != null) soutenance.setCommentaireDirecteur(commentaire.trim());

                    Soutenance updated = soutenanceRepository.save(soutenance);
                    publishStatusChangedEvent(updated, ancienStatut, "PREREQUIS_VALIDES", commentaire);
                    return updated;
                })
                .orElseThrow(() -> new RuntimeException("Soutenance non trouvée: " + soutenanceId));
    }

    @Override
    public Soutenance rejeterParDirecteur(Long soutenanceId, String commentaire) {
        log.info("❌ Rejet par directeur pour soutenance: {}", soutenanceId);

        return soutenanceRepository.findById(soutenanceId)
                .map(soutenance -> {
                    if (soutenance.getStatut() != StatutSoutenance.SOUMIS) {
                        throw new RuntimeException("Statut invalide. Attendu: SOUMIS");
                    }

                    String ancienStatut = soutenance.getStatut().name();
                    soutenance.setStatut(StatutSoutenance.REJETEE);
                    soutenance.setCommentaireDirecteur(commentaire);

                    Soutenance updated = soutenanceRepository.save(soutenance);
                    publishStatusChangedEvent(updated, ancienStatut, "REJETEE", commentaire);
                    return updated;
                })
                .orElseThrow(() -> new RuntimeException("Soutenance non trouvée: " + soutenanceId));
    }

    // ========================================================
    // JURYS DISPONIBLES (pour sélection dropdown)
    // ========================================================

    @Override
    public List<JuryDisponible> getJurysDisponibles() {
        log.info("📋 Récupération de tous les jurys disponibles");
        List<JuryDisponible> jurys = juryDisponibleRepository.findAll();
        return jurys;
    }

    @Override
    public List<JuryDisponible> getJurysDisponiblesByRole(RoleJury role) {
        log.info("📋 Récupération des jurys disponibles pour le rôle: {}", role);
        return juryDisponibleRepository.findByRole(role);
    }

    @Override
    public Optional<JuryDisponible> getJuryDisponibleById(Long id) {
        return juryDisponibleRepository.findById(id);
    }

    // ========================================================
    // ÉTAPE 2: DIRECTEUR - Propose le jury
    // PREREQUIS_VALIDES → JURY_PROPOSE
    // ========================================================

    @Override
    public Soutenance ajouterMembreJury(Long soutenanceId, MembreJury membreJury) {
        return soutenanceRepository.findById(soutenanceId)
                .map(soutenance -> {
                    membreJury.setSoutenance(soutenance);
                    soutenance.getMembresJury().add(membreJury);
                    return soutenanceRepository.save(soutenance);
                })
                .orElseThrow(() -> new RuntimeException("Soutenance non trouvée: " + soutenanceId));
    }

    @Override
    public Soutenance supprimerMembreJury(Long soutenanceId, Long membreId) {
        return soutenanceRepository.findById(soutenanceId)
                .map(soutenance -> {
                    soutenance.getMembresJury().removeIf(m -> m.getId().equals(membreId));
                    membreJuryRepository.deleteById(membreId);
                    return soutenanceRepository.save(soutenance);
                })
                .orElseThrow(() -> new RuntimeException("Soutenance non trouvée: " + soutenanceId));
    }

    @Override
    public Soutenance proposerJury(Long soutenanceId) {
        log.info("📋 Proposition jury pour soutenance: {}", soutenanceId);

        return soutenanceRepository.findById(soutenanceId)
                .map(soutenance -> {
                    // Autorise JURY_PROPOSE depuis PREREQUIS_VALIDES (via admin) ou AUTORISEE (via workflow complet)
                    if (soutenance.getStatut() != StatutSoutenance.AUTORISEE) {
                        throw new RuntimeException("Statut invalide. Attendu: AUTORISEE, Actuel: " + soutenance.getStatut());
                    }

                    if (soutenance.getMembresJury().size() < 3) {
                        throw new RuntimeException("Le jury doit contenir au moins 3 membres");
                    }

                    String ancienStatut = soutenance.getStatut().name();
                    soutenance.setStatut(StatutSoutenance.JURY_PROPOSE);

                    Soutenance updated = soutenanceRepository.save(soutenance);
                    publishStatusChangedEvent(updated, ancienStatut, "JURY_PROPOSE", "Jury proposé par le directeur");
                    return updated;
                })
                .orElseThrow(() -> new RuntimeException("Soutenance non trouvée: " + soutenanceId));
    }

    // ========================================================
    // ÉTAPE 3: ADMIN - Valide ou refuse le jury
    // JURY_PROPOSE → AUTORISEE (Date Fixée)
    // ========================================================

    @Override
    public Soutenance validerJury(Long soutenanceId, String commentaire) {
        log.info("✅ Validation jury par admin pour soutenance: {}", soutenanceId);

        return soutenanceRepository.findById(soutenanceId)
                .map(soutenance -> {
                    if (soutenance.getStatut() != StatutSoutenance.JURY_PROPOSE) {
                        throw new RuntimeException("Statut invalide. Attendu: JURY_PROPOSE");
                    }

                    String ancienStatut = soutenance.getStatut().name();
                    // On reste sur un statut indiquant que le jury est validé, en attente de date si pas fixée
                    // Mais souvent on passe direct à PLANIFIEE via planifierSoutenance
                    soutenance.setStatut(StatutSoutenance.AUTORISEE);
                    if (commentaire != null) soutenance.setCommentaireAdmin(commentaire);

                    Soutenance updated = soutenanceRepository.save(soutenance);
                    publishStatusChangedEvent(updated, ancienStatut, "AUTORISEE", "Jury validé par l'administration");
                    return updated;
                })
                .orElseThrow(() -> new RuntimeException("Soutenance non trouvée: " + soutenanceId));
    }

    @Override
    public Soutenance refuserJury(Long soutenanceId, String commentaire) {
        log.info("❌ Refus jury par admin pour soutenance: {}", soutenanceId);

        return soutenanceRepository.findById(soutenanceId)
                .map(soutenance -> {
                    if (soutenance.getStatut() != StatutSoutenance.JURY_PROPOSE) {
                        throw new RuntimeException("Statut invalide. Attendu: JURY_PROPOSE");
                    }

                    String ancienStatut = soutenance.getStatut().name();
                    soutenance.setStatut(StatutSoutenance.AUTORISEE); // Retour à l'état précédent
                    soutenance.setCommentaireAdmin(commentaire);

                    Soutenance updated = soutenanceRepository.save(soutenance);
                    publishStatusChangedEvent(updated, ancienStatut, "AUTORISEE", "Jury refusé: " + commentaire);
                    return updated;
                })
                .orElseThrow(() -> new RuntimeException("Soutenance non trouvée: " + soutenanceId));
    }

    // ========================================================
    // ÉTAPE 4: DIRECTEUR - Propose une date
    // ========================================================

    @Override
    public Soutenance proposerDateSoutenance(Long soutenanceId, LocalDate date, LocalTime heure, String lieu) {
        log.info("📅 Proposition date soutenance: {} - Date: {}", soutenanceId, date);

        return soutenanceRepository.findById(soutenanceId)
                .map(soutenance -> {
                    if (soutenance.getStatut() != StatutSoutenance.AUTORISEE) {
                        throw new RuntimeException("Statut invalide. Attendu: AUTORISEE");
                    }
                    soutenance.setDateSoutenance(date);
                    soutenance.setHeureSoutenance(heure);
                    soutenance.setLieuSoutenance(lieu);
                    return soutenanceRepository.save(soutenance);
                })
                .orElseThrow(() -> new RuntimeException("Soutenance non trouvée: " + soutenanceId));
    }

    // ========================================================
    // ÉTAPE 5: ADMIN - Planifie la soutenance
    // AUTORISEE / JURY_PROPOSE → PLANIFIEE
    // ========================================================

    @Override
    public Soutenance planifierSoutenance(Long soutenanceId, LocalDate date, LocalTime heure, String lieu) {
        log.info("📅 Planification soutenance: {} - Date: {}", soutenanceId, date);

        return soutenanceRepository.findById(soutenanceId)
                .map(soutenance -> {
                    // On accepte JURY_PROPOSE (si admin valide et planifie en meme temps) ou AUTORISEE
                    if (soutenance.getStatut() != StatutSoutenance.JURY_PROPOSE && soutenance.getStatut() != StatutSoutenance.AUTORISEE) {
                        throw new RuntimeException("Statut invalide. Attendu: JURY_PROPOSE ou AUTORISEE");
                    }

                    String ancienStatut = soutenance.getStatut().name();
                    soutenance.setDateSoutenance(date);
                    soutenance.setHeureSoutenance(heure);
                    soutenance.setLieuSoutenance(lieu);
                    soutenance.setStatut(StatutSoutenance.PLANIFIEE);

                    Soutenance updated = soutenanceRepository.save(soutenance);

                    try {
                        SoutenanceStatusChangedEvent event = buildStatusChangedEvent(updated, ancienStatut, "PLANIFIEE",
                                "Soutenance planifiée le " + date + " à " + heure);
                        event.setDateSoutenance(LocalDateTime.of(date, heure));
                        event.setLieu(lieu);
                        eventPublisher.publishSoutenanceScheduled(event);
                    } catch (Exception e) {
                        log.warn("⚠️ Impossible de publier l'événement: {}", e.getMessage());
                    }

                    return updated;
                })
                .orElseThrow(() -> new RuntimeException("Soutenance non trouvée: " + soutenanceId));
    }

    @Override
    public Soutenance refuserPlanification(Long soutenanceId, String commentaire) {
        log.info("❌ Refus planification pour soutenance: {}", soutenanceId);

        return soutenanceRepository.findById(soutenanceId)
                .map(soutenance -> {
                    String ancienStatut = soutenance.getStatut().name();
                    soutenance.setStatut(StatutSoutenance.AUTORISEE);
                    soutenance.setCommentaireAdmin(commentaire);
                    soutenance.setDateSoutenance(null);
                    soutenance.setHeureSoutenance(null);

                    Soutenance updated = soutenanceRepository.save(soutenance);
                    publishStatusChangedEvent(updated, ancienStatut, "AUTORISEE", "Date refusée: " + commentaire);
                    return updated;
                })
                .orElseThrow(() -> new RuntimeException("Soutenance non trouvée: " + soutenanceId));
    }

    // ========================================================
    // ÉTAPE 6: RÉSULTAT
    // ========================================================

    @Override
    public Soutenance enregistrerResultat(Long id, Double note, String mention, Boolean felicitations) {
        return soutenanceRepository.findById(id)
                .map(soutenance -> {
                    String ancienStatut = soutenance.getStatut().name();
                    soutenance.setNoteFinale(note);
                    soutenance.setMention(mention);
                    soutenance.setFelicitationsJury(felicitations);
                    soutenance.setStatut(StatutSoutenance.TERMINEE);

                    Soutenance updated = soutenanceRepository.save(soutenance);
                    publishStatusChangedEvent(updated, ancienStatut, "TERMINEE", "Soutenance terminée - Mention: " + mention);
                    return updated;
                })
                .orElseThrow(() -> new RuntimeException("Soutenance non trouvée: " + id));
    }

    // ========================================================
    // AUTRES MÉTHODES
    // ========================================================

    @Override
    public Soutenance rejeterSoutenance(Long id, String motif) {
        return soutenanceRepository.findById(id)
                .map(soutenance -> {
                    String ancienStatut = soutenance.getStatut().name();
                    soutenance.setStatut(StatutSoutenance.REJETEE);
                    soutenance.setCommentaireAdmin(motif);
                    Soutenance updated = soutenanceRepository.save(soutenance);
                    publishStatusChangedEvent(updated, ancienStatut, "REJETEE", motif);
                    return updated;
                })
                .orElseThrow(() -> new RuntimeException("Soutenance non trouvée: " + id));
    }

    @Override
    public Soutenance soumettreRapportRapporteur(Long soutenanceId, Long membreJuryId, Boolean avisFavorable, String commentaire) {
        MembreJury membre = membreJuryRepository.findById(membreJuryId)
                .orElseThrow(() -> new RuntimeException("Membre jury non trouvé: " + membreJuryId));

        membre.setRapportSoumis(true);
        membre.setAvisFavorable(avisFavorable);
        membre.setCommentaireRapport(commentaire);
        membreJuryRepository.save(membre);

        return soutenanceRepository.findById(soutenanceId)
                .orElseThrow(() -> new RuntimeException("Soutenance non trouvée: " + soutenanceId));
    }

    @Override
    public Soutenance verifierPrerequisEtSoumettre(Long id) {
        return validerPrerequisDirecteur(id, "Prérequis validés");
    }

    // ✅✅✅ C'EST CETTE MÉTHODE QUI MANQUAIT ET QUI CORRIGE L'ERREUR 400 ✅✅✅
    @Override
    public Soutenance autoriserSoutenance(Long id, String commentaire) {
        log.info("✅ Autorisation administrative pour soutenance: {}", id);

        return soutenanceRepository.findById(id)
                .map(soutenance -> {
                    // On vérifie que le statut est bien PREREQUIS_VALIDES
                    if (soutenance.getStatut() != StatutSoutenance.PREREQUIS_VALIDES) {
                        throw new RuntimeException("Statut invalide. Attendu: PREREQUIS_VALIDES, Actuel: " + soutenance.getStatut());
                    }

                    String ancienStatut = soutenance.getStatut().name();
                    // On passe à AUTORISEE (ce qui permettra ensuite au directeur de proposer le jury)
                    soutenance.setStatut(StatutSoutenance.AUTORISEE);
                    soutenance.setDateAutorisation(LocalDateTime.now());
                    if (commentaire != null) soutenance.setCommentaireAdmin(commentaire);

                    Soutenance updated = soutenanceRepository.save(soutenance);
                    publishStatusChangedEvent(updated, ancienStatut, "AUTORISEE", "Autorisation administrative accordée");
                    return updated;
                })
                .orElseThrow(() -> new RuntimeException("Soutenance non trouvée: " + id));
    }

    // ========================================================
    // MÉTHODES UTILITAIRES
    // ========================================================

    private void publishStatusChangedEvent(Soutenance soutenance, String oldStatus, String newStatus, String commentaire) {
        try {
            SoutenanceStatusChangedEvent event = buildStatusChangedEvent(soutenance, oldStatus, newStatus, commentaire);
            eventPublisher.publishSoutenanceStatusChanged(event);
        } catch (Exception e) {
            log.warn("⚠️ Impossible de publier l'événement Kafka: {}", e.getMessage());
        }
    }

    private SoutenanceStatusChangedEvent buildStatusChangedEvent(Soutenance soutenance, String oldStatus,
                                                                 String newStatus, String commentaire) {
        UserDTO doctorant = null;
        try {
            doctorant = userServiceClient.getUserById(soutenance.getDoctorantId());
        } catch (Exception e) {
            log.warn("Impossible de récupérer les infos du doctorant");
        }

        return SoutenanceStatusChangedEvent.builder()
                .soutenanceId(soutenance.getId())
                .doctorantId(soutenance.getDoctorantId())
                .doctorantEmail(doctorant != null ? doctorant.getEmail() : null)
                .doctorantNom(doctorant != null ? doctorant.getNom() : null)
                .doctorantPrenom(doctorant != null ? doctorant.getPrenom() : null)
                .sujetThese(soutenance.getTitreThese())
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .dateSoutenance(soutenance.getDateSoutenance() != null && soutenance.getHeureSoutenance() != null
                        ? LocalDateTime.of(soutenance.getDateSoutenance(), soutenance.getHeureSoutenance()) : null)
                .lieu(soutenance.getLieuSoutenance())
                .commentaire(commentaire)
                .build();
    }

    private Soutenance enrichirAvecInfosUtilisateurs(Soutenance soutenance) {
        try {
            UserDTO doctorant = userServiceClient.getUserById(soutenance.getDoctorantId());
            UserDTO directeur = userServiceClient.getUserById(soutenance.getDirecteurId());

            soutenance.setDoctorantInfo(doctorant);
            soutenance.setDirecteurInfo(directeur);

        } catch (Exception e) {
            log.warn("Impossible de récupérer les infos utilisateurs pour la soutenance {}: {}",
                    soutenance.getId(), e.getMessage());
        }

        return soutenance;
    }
}