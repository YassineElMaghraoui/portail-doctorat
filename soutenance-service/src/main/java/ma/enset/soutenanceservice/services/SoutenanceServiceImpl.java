package ma.enset.soutenanceservice.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.enset.soutenanceservice.clients.UserServiceClient;
import ma.enset.soutenanceservice.dto.UserDTO;
import ma.enset.soutenanceservice.entities.MembreJury;
import ma.enset.soutenanceservice.entities.Soutenance;
import ma.enset.soutenanceservice.enums.StatutSoutenance;
import ma.enset.soutenanceservice.events.SoutenanceCreatedEvent;
import ma.enset.soutenanceservice.events.SoutenanceStatusChangedEvent;
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
    private final UserServiceClient userServiceClient;
    private final SoutenanceEventPublisher eventPublisher;

    private final Path rootLocation = Paths.get("uploads/soutenances");

    @Override
    public Soutenance createSoutenance(Soutenance soutenance) {
        log.info("Creating soutenance for doctorant: {}", soutenance.getDoctorantId());

        UserDTO doctorant = null;
        UserDTO directeur = null;

        try {
            doctorant = userServiceClient.getUserById(soutenance.getDoctorantId());
            directeur = userServiceClient.getUserById(soutenance.getDirecteurId());
            log.info("Doctorant vérifié: {} {}", doctorant.getNom(), doctorant.getPrenom());
            log.info("Directeur vérifié: {} {}", directeur.getNom(), directeur.getPrenom());
        } catch (Exception e) {
            log.error("Erreur lors de la vérification des utilisateurs: {}", e.getMessage());
            throw new RuntimeException("Impossible de vérifier les utilisateurs.");
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
            log.info("✅ Événement SoutenanceCreated publié pour soutenance ID: {}", saved.getId());
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

            if (!Files.exists(rootLocation)) {
                Files.createDirectories(rootLocation);
            }

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
        log.info("Updating soutenance with id: {}", id);
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
        log.info("Deleting soutenance with id: {}", id);
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
    // ✅ NOUVELLES MÉTHODES WORKFLOW DIRECTEUR
    // ========================================================

    /**
     * ✅ Directeur valide les prérequis d'une soutenance
     * Change le statut de SOUMIS → PREREQUIS_VALIDES
     */
    @Override
    public Soutenance validerPrerequisDirecteur(Long soutenanceId, String commentaire) {
        log.info("✅ Validation prérequis par directeur pour soutenance: {}", soutenanceId);

        return soutenanceRepository.findById(soutenanceId)
                .map(soutenance -> {
                    // Vérifier le statut actuel
                    if (soutenance.getStatut() != StatutSoutenance.SOUMIS) {
                        throw new RuntimeException("Cette soutenance n'est pas en attente de validation. Statut actuel: " + soutenance.getStatut());
                    }

                    String ancienStatut = soutenance.getStatut().name();

                    // Mettre à jour le statut
                    soutenance.setStatut(StatutSoutenance.PREREQUIS_VALIDES);

                    // Enregistrer le commentaire du directeur si fourni
                    if (commentaire != null && !commentaire.trim().isEmpty()) {
                        soutenance.setCommentaireDirecteur(commentaire.trim());
                    }

                    Soutenance updated = soutenanceRepository.save(soutenance);

                    // Publier l'événement Kafka
                    publishStatusChangedEvent(updated, ancienStatut, "PREREQUIS_VALIDES",
                            commentaire != null ? commentaire : "Prérequis validés par le directeur");

                    log.info("✅ Prérequis validés pour soutenance {} par le directeur", soutenanceId);

                    return updated;
                })
                .orElseThrow(() -> new RuntimeException("Soutenance non trouvée avec l'id: " + soutenanceId));
    }

    /**
     * ✅ Directeur demande des corrections (rejet temporaire)
     * Change le statut → REJETEE avec commentaire dans commentaire_directeur
     */
    @Override
    public Soutenance rejeterParDirecteur(Long soutenanceId, String commentaire) {
        log.info("❌ Rejet par directeur pour soutenance: {} - Motif: {}", soutenanceId, commentaire);

        return soutenanceRepository.findById(soutenanceId)
                .map(soutenance -> {
                    // Vérifier le statut actuel
                    if (soutenance.getStatut() != StatutSoutenance.SOUMIS) {
                        throw new RuntimeException("Cette soutenance n'est pas en attente de validation. Statut actuel: " + soutenance.getStatut());
                    }

                    String ancienStatut = soutenance.getStatut().name();

                    // Mettre à jour le statut
                    soutenance.setStatut(StatutSoutenance.REJETEE);

                    // ✅ Enregistrer le commentaire du directeur (corrections demandées)
                    soutenance.setCommentaireDirecteur(commentaire);

                    Soutenance updated = soutenanceRepository.save(soutenance);

                    // Publier l'événement Kafka
                    publishStatusChangedEvent(updated, ancienStatut, "REJETEE", commentaire);

                    log.info("❌ Soutenance {} rejetée par le directeur. Motif: {}", soutenanceId, commentaire);

                    return updated;
                })
                .orElseThrow(() -> new RuntimeException("Soutenance non trouvée avec l'id: " + soutenanceId));
    }

    // ========================================================
    // MÉTHODES EXISTANTES
    // ========================================================

    @Override
    public Soutenance verifierPrerequisEtSoumettre(Long id) {
        log.info("Verifying prerequis for soutenance: {}", id);

        return soutenanceRepository.findById(id)
                .map(soutenance -> {
                    // ✅ CORRECTION: Vérifier si prerequisSontValides est null
                    if (soutenance.getPrerequis() != null && !soutenance.prerequisSontValides()) {
                        throw new RuntimeException("Les prérequis ne sont pas remplis.");
                    }

                    String ancienStatut = soutenance.getStatut().name();

                    if (soutenance.getPrerequis() != null) {
                        soutenance.getPrerequis().setPrerequisValides(true);
                    }
                    soutenance.setStatut(StatutSoutenance.PREREQUIS_VALIDES);
                    Soutenance updated = soutenanceRepository.save(soutenance);

                    publishStatusChangedEvent(updated, ancienStatut, "PREREQUIS_VALIDES", "Prérequis validés");

                    return updated;
                })
                .orElseThrow(() -> new RuntimeException("Soutenance non trouvée avec l'id: " + id));
    }

    @Override
    public Soutenance ajouterMembreJury(Long soutenanceId, MembreJury membreJury) {
        log.info("Adding jury member to soutenance: {}", soutenanceId);

        return soutenanceRepository.findById(soutenanceId)
                .map(soutenance -> {
                    membreJury.setSoutenance(soutenance);
                    soutenance.getMembresJury().add(membreJury);
                    return soutenanceRepository.save(soutenance);
                })
                .orElseThrow(() -> new RuntimeException("Soutenance non trouvée avec l'id: " + soutenanceId));
    }

    @Override
    public Soutenance proposerJury(Long id) {
        log.info("Proposing jury for soutenance: {}", id);

        return soutenanceRepository.findById(id)
                .map(soutenance -> {
                    if (soutenance.getStatut() != StatutSoutenance.PREREQUIS_VALIDES) {
                        throw new RuntimeException("Les prérequis doivent être validés avant de proposer le jury");
                    }

                    if (!soutenance.juryEstComplet()) {
                        throw new RuntimeException("Le jury doit contenir au moins 1 président et 2 rapporteurs");
                    }

                    String ancienStatut = soutenance.getStatut().name();
                    soutenance.setStatut(StatutSoutenance.JURY_PROPOSE);
                    Soutenance updated = soutenanceRepository.save(soutenance);

                    publishStatusChangedEvent(updated, ancienStatut, "JURY_PROPOSE", "Jury proposé");

                    try {
                        List<MembreJury> membresJury = membreJuryRepository.findBySoutenanceId(id);
                        String doctorantNom = getDoctorantNom(updated.getDoctorantId());
                        eventPublisher.publishAllJuryInvitations(updated, doctorantNom, membresJury);
                        log.info("✅ Invitations jury envoyées pour {} membres", membresJury.size());
                    } catch (Exception e) {
                        log.warn("⚠️ Impossible d'envoyer les invitations jury: {}", e.getMessage());
                    }

                    return updated;
                })
                .orElseThrow(() -> new RuntimeException("Soutenance non trouvée avec l'id: " + id));
    }

    @Override
    public Soutenance soumettreRapportRapporteur(Long soutenanceId, Long membreJuryId, Boolean avisFavorable, String commentaire) {
        log.info("Submitting rapport for rapporteur {} in soutenance {}", membreJuryId, soutenanceId);

        MembreJury membre = membreJuryRepository.findById(membreJuryId)
                .orElseThrow(() -> new RuntimeException("Membre jury non trouvé avec l'id: " + membreJuryId));

        membre.setRapportSoumis(true);
        membre.setAvisFavorable(avisFavorable);
        membre.setCommentaireRapport(commentaire);
        membreJuryRepository.save(membre);

        return soutenanceRepository.findById(soutenanceId)
                .orElseThrow(() -> new RuntimeException("Soutenance non trouvée avec l'id: " + soutenanceId));
    }

    @Override
    public Soutenance autoriserSoutenance(Long id, String commentaire) {
        log.info("Authorizing soutenance: {}", id);

        return soutenanceRepository.findById(id)
                .map(soutenance -> {
                    if (soutenance.getStatut() != StatutSoutenance.JURY_PROPOSE) {
                        throw new RuntimeException("Le jury doit être proposé avant l'autorisation");
                    }

                    if (!soutenance.tousLesRapportsRecus()) {
                        throw new RuntimeException("Tous les rapports des rapporteurs doivent être soumis");
                    }

                    if (!soutenance.tousLesRapportsFavorables()) {
                        throw new RuntimeException("Tous les rapporteurs doivent donner un avis favorable");
                    }

                    String ancienStatut = soutenance.getStatut().name();
                    soutenance.setStatut(StatutSoutenance.AUTORISEE);
                    soutenance.setCommentaireAdmin(commentaire);
                    soutenance.setDateAutorisation(LocalDateTime.now());
                    Soutenance updated = soutenanceRepository.save(soutenance);

                    publishStatusChangedEvent(updated, ancienStatut, "AUTORISEE", commentaire);

                    return updated;
                })
                .orElseThrow(() -> new RuntimeException("Soutenance non trouvée avec l'id: " + id));
    }

    @Override
    public Soutenance planifierSoutenance(Long id, LocalDate date, LocalTime heure, String lieu) {
        log.info("Planning soutenance: {}", id);

        return soutenanceRepository.findById(id)
                .map(soutenance -> {
                    if (soutenance.getStatut() != StatutSoutenance.AUTORISEE) {
                        throw new RuntimeException("La soutenance doit être autorisée avant la planification");
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
                        log.info("✅ Événement SoutenanceScheduled publié");
                    } catch (Exception e) {
                        log.warn("⚠️ Impossible de publier l'événement: {}", e.getMessage());
                    }

                    return updated;
                })
                .orElseThrow(() -> new RuntimeException("Soutenance non trouvée avec l'id: " + id));
    }

    @Override
    public Soutenance enregistrerResultat(Long id, Double note, String mention, Boolean felicitations) {
        log.info("Recording result for soutenance: {}", id);

        return soutenanceRepository.findById(id)
                .map(soutenance -> {
                    String ancienStatut = soutenance.getStatut().name();
                    soutenance.setNoteFinale(note);
                    soutenance.setMention(mention);
                    soutenance.setFelicitationsJury(felicitations);
                    soutenance.setStatut(StatutSoutenance.TERMINEE);
                    Soutenance updated = soutenanceRepository.save(soutenance);

                    String commentaire = "Soutenance terminée - Mention: " + mention;
                    if (felicitations) {
                        commentaire += " avec félicitations du jury";
                    }
                    publishStatusChangedEvent(updated, ancienStatut, "TERMINEE", commentaire);

                    return updated;
                })
                .orElseThrow(() -> new RuntimeException("Soutenance non trouvée avec l'id: " + id));
    }

    @Override
    public Soutenance rejeterSoutenance(Long id, String motif) {
        log.info("Rejecting soutenance: {}", id);

        return soutenanceRepository.findById(id)
                .map(soutenance -> {
                    String ancienStatut = soutenance.getStatut().name();
                    soutenance.setStatut(StatutSoutenance.REJETEE);
                    soutenance.setCommentaireAdmin(motif);
                    Soutenance updated = soutenanceRepository.save(soutenance);

                    publishStatusChangedEvent(updated, ancienStatut, "REJETEE", motif);

                    return updated;
                })
                .orElseThrow(() -> new RuntimeException("Soutenance non trouvée avec l'id: " + id));
    }

    // ========================================================
    // MÉTHODES UTILITAIRES
    // ========================================================

    private void publishStatusChangedEvent(Soutenance soutenance, String oldStatus, String newStatus, String commentaire) {
        try {
            SoutenanceStatusChangedEvent event = buildStatusChangedEvent(soutenance, oldStatus, newStatus, commentaire);
            eventPublisher.publishSoutenanceStatusChanged(event);
            log.info("✅ Événement SoutenanceStatusChanged publié: {} -> {}", oldStatus, newStatus);
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
            log.warn("Impossible de récupérer les infos du doctorant: {}", e.getMessage());
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

    private String getDoctorantNom(Long doctorantId) {
        try {
            UserDTO doctorant = userServiceClient.getUserById(doctorantId);
            return doctorant.getNom() + " " + doctorant.getPrenom();
        } catch (Exception e) {
            return "Doctorant ID: " + doctorantId;
        }
    }

    private Soutenance enrichirAvecInfosUtilisateurs(Soutenance soutenance) {
        try {
            UserDTO doctorant = userServiceClient.getUserById(soutenance.getDoctorantId());
            UserDTO directeur = userServiceClient.getUserById(soutenance.getDirecteurId());

            soutenance.setDoctorantInfo(doctorant);
            soutenance.setDirecteurInfo(directeur);

            log.info("Infos enrichies - Doctorant: {} {}, Directeur: {} {}",
                    doctorant.getNom(), doctorant.getPrenom(),
                    directeur.getNom(), directeur.getPrenom());

        } catch (Exception e) {
            log.warn("Impossible de récupérer les infos utilisateurs pour la soutenance {}: {}",
                    soutenance.getId(), e.getMessage());
        }

        return soutenance;
    }
}