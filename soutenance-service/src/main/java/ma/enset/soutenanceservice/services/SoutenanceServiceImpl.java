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

    @Override
    public Soutenance createSoutenance(Soutenance soutenance) {
        return soutenanceRepository.save(soutenance);
    }

    @Override
    public Soutenance soumettreDemande(String titre, Long doctorantId, Long directeurId,
                                       MultipartFile manuscrit, MultipartFile rapportAntiPlagiat, MultipartFile autorisation) {
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

        Soutenance saved = soutenanceRepository.save(soutenance);
        // Publier event Kafka si nécessaire...
        return saved;
    }

    // ========================================================
    // ÉTAPE 1: DIRECTEUR - Valide les prérequis
    // SOUMIS → PREREQUIS_VALIDES
    // ========================================================
    @Override
    public Soutenance validerPrerequisDirecteur(Long soutenanceId, String commentaire) {
        return soutenanceRepository.findById(soutenanceId)
                .map(soutenance -> {
                    if (soutenance.getStatut() != StatutSoutenance.SOUMIS) {
                        throw new RuntimeException("Statut invalide. Attendu: SOUMIS");
                    }
                    // ✅ Changement vers PREREQUIS_VALIDES (Le directeur attend maintenant l'admin)
                    soutenance.setStatut(StatutSoutenance.PREREQUIS_VALIDES);
                    if (commentaire != null) soutenance.setCommentaireDirecteur(commentaire);
                    return soutenanceRepository.save(soutenance);
                })
                .orElseThrow(() -> new RuntimeException("Soutenance non trouvée"));
    }

    @Override
    public Soutenance rejeterParDirecteur(Long soutenanceId, String commentaire) {
        return soutenanceRepository.findById(soutenanceId)
                .map(soutenance -> {
                    soutenance.setStatut(StatutSoutenance.REJETEE);
                    soutenance.setCommentaireDirecteur(commentaire);
                    return soutenanceRepository.save(soutenance);
                })
                .orElseThrow(() -> new RuntimeException("Soutenance non trouvée"));
    }

    // ========================================================
    // ÉTAPE 2: ADMIN - Autorise la demande
    // PREREQUIS_VALIDES → AUTORISEE
    // ========================================================
    @Override
    public Soutenance autoriserDemande(Long soutenanceId, String commentaire) {
        return soutenanceRepository.findById(soutenanceId)
                .map(soutenance -> {
                    if (soutenance.getStatut() != StatutSoutenance.PREREQUIS_VALIDES) {
                        throw new RuntimeException("Statut invalide. Attendu: PREREQUIS_VALIDES");
                    }
                    // ✅ L'admin donne le feu vert pour que le directeur choisisse le jury
                    soutenance.setStatut(StatutSoutenance.AUTORISEE);
                    soutenance.setDateAutorisation(LocalDateTime.now());
                    if (commentaire != null) soutenance.setCommentaireAdmin(commentaire);
                    return soutenanceRepository.save(soutenance);
                })
                .orElseThrow(() -> new RuntimeException("Soutenance non trouvée"));
    }

    // ========================================================
    // ÉTAPE 3: DIRECTEUR - Propose le jury
    // AUTORISEE → JURY_PROPOSE
    // ========================================================
    @Override
    public Soutenance proposerJury(Long soutenanceId) {
        return soutenanceRepository.findById(soutenanceId)
                .map(soutenance -> {
                    // ✅ Le directeur ne peut proposer QUE si c'est AUTORISEE
                    if (soutenance.getStatut() != StatutSoutenance.AUTORISEE) {
                        throw new RuntimeException("Statut invalide. Attendu: AUTORISEE. L'administration n'a pas encore validé la demande.");
                    }
                    if (soutenance.getMembresJury().size() < 3) {
                        throw new RuntimeException("Le jury doit contenir au moins 3 membres");
                    }
                    soutenance.setStatut(StatutSoutenance.JURY_PROPOSE);
                    return soutenanceRepository.save(soutenance);
                })
                .orElseThrow(() -> new RuntimeException("Soutenance non trouvée"));
    }

    // ========================================================
    // ÉTAPE 4: ADMIN - Valide le jury (Intermédiaire)
    // ========================================================
    @Override
    public Soutenance validerJury(Long soutenanceId, String commentaire) {
        return soutenanceRepository.findById(soutenanceId)
                .map(soutenance -> {
                    if (soutenance.getStatut() != StatutSoutenance.JURY_PROPOSE) {
                        throw new RuntimeException("Statut invalide. Attendu: JURY_PROPOSE");
                    }
                    if (commentaire != null) soutenance.setCommentaireAdmin(commentaire);
                    return soutenanceRepository.save(soutenance);
                })
                .orElseThrow(() -> new RuntimeException("Soutenance non trouvée"));
    }

    // ========================================================
    // ÉTAPE 5: ADMIN - Planifie la soutenance
    // JURY_PROPOSE → PLANIFIEE
    // ========================================================
    @Override
    public Soutenance planifierSoutenance(Long soutenanceId, LocalDate date, LocalTime heure, String lieu) {
        return soutenanceRepository.findById(soutenanceId)
                .map(soutenance -> {
                    // On accepte la planification si le jury est proposé ou déjà autorisé
                    if (soutenance.getStatut() != StatutSoutenance.JURY_PROPOSE &&
                            soutenance.getStatut() != StatutSoutenance.AUTORISEE) {
                        throw new RuntimeException("Statut invalide pour planification.");
                    }
                    soutenance.setDateSoutenance(date);
                    soutenance.setHeureSoutenance(heure);
                    soutenance.setLieuSoutenance(lieu);
                    soutenance.setStatut(StatutSoutenance.PLANIFIEE);
                    return soutenanceRepository.save(soutenance);
                })
                .orElseThrow(() -> new RuntimeException("Soutenance non trouvée"));
    }

    @Override
    public Soutenance refuserJury(Long soutenanceId, String commentaire) {
        return soutenanceRepository.findById(soutenanceId)
                .map(soutenance -> {
                    // Retour à AUTORISEE pour que le directeur refasse le jury
                    soutenance.setStatut(StatutSoutenance.AUTORISEE);
                    soutenance.setCommentaireAdmin(commentaire);
                    soutenance.getMembresJury().clear();
                    return soutenanceRepository.save(soutenance);
                })
                .orElseThrow(() -> new RuntimeException("Soutenance non trouvée"));
    }

    // ========================================================
    // Helpers & Autres méthodes
    // ========================================================
    @Override
    public Soutenance ajouterMembreJury(Long soutenanceId, MembreJury membreJury) {
        return soutenanceRepository.findById(soutenanceId)
                .map(soutenance -> {
                    membreJury.setSoutenance(soutenance);
                    soutenance.getMembresJury().add(membreJury);
                    return soutenanceRepository.save(soutenance);
                })
                .orElseThrow(() -> new RuntimeException("Soutenance non trouvée"));
    }

    @Override
    public Soutenance supprimerMembreJury(Long soutenanceId, Long membreId) {
        return soutenanceRepository.findById(soutenanceId)
                .map(soutenance -> {
                    soutenance.getMembresJury().removeIf(m -> m.getId().equals(membreId));
                    membreJuryRepository.deleteById(membreId);
                    return soutenanceRepository.save(soutenance);
                })
                .orElseThrow(() -> new RuntimeException("Soutenance non trouvée"));
    }

    @Override
    public List<Soutenance> getAllSoutenances() {
        List<Soutenance> list = soutenanceRepository.findAll();
        list.forEach(this::enrichirAvecInfosUtilisateurs);
        return list;
    }

    @Override
    public List<Soutenance> getSoutenancesByDirecteur(Long directeurId) {
        List<Soutenance> list = soutenanceRepository.findByDirecteurId(directeurId);
        list.forEach(this::enrichirAvecInfosUtilisateurs);
        return list;
    }

    @Override
    public List<Soutenance> getSoutenancesByDoctorant(Long doctorantId) {
        List<Soutenance> list = soutenanceRepository.findByDoctorantId(doctorantId);
        list.forEach(this::enrichirAvecInfosUtilisateurs);
        return list;
    }

    @Override
    public List<Soutenance> getSoutenancesByStatut(StatutSoutenance statut) {
        List<Soutenance> list = soutenanceRepository.findByStatut(statut);
        list.forEach(this::enrichirAvecInfosUtilisateurs);
        return list;
    }

    @Override public Optional<Soutenance> getSoutenanceById(Long id) { return soutenanceRepository.findById(id).map(this::enrichirAvecInfosUtilisateurs); }
    @Override public void deleteSoutenance(Long id) { soutenanceRepository.deleteById(id); }
    @Override public Soutenance updateSoutenance(Long id, Soutenance s) { return null; }
    @Override public List<JuryDisponible> getJurysDisponibles() { return juryDisponibleRepository.findAll(); }
    @Override public List<JuryDisponible> getJurysDisponiblesByRole(RoleJury role) { return juryDisponibleRepository.findByRole(role); }
    @Override public Optional<JuryDisponible> getJuryDisponibleById(Long id) { return juryDisponibleRepository.findById(id); }
    @Override public Soutenance enregistrerResultat(Long id, Double note, String mention, Boolean felicitations) {
        return soutenanceRepository.findById(id).map(s -> { s.setStatut(StatutSoutenance.TERMINEE); s.setNoteFinale(note); s.setMention(mention); s.setFelicitationsJury(felicitations); return soutenanceRepository.save(s); }).orElseThrow();
    }
    @Override public Soutenance rejeterSoutenance(Long id, String motif) {
        return soutenanceRepository.findById(id).map(s -> { s.setStatut(StatutSoutenance.REJETEE); s.setCommentaireAdmin(motif); return soutenanceRepository.save(s); }).orElseThrow();
    }
    @Override public Soutenance soumettreRapportRapporteur(Long sId, Long mId, Boolean a, String c) { return null; }
    @Override public Soutenance verifierPrerequisEtSoumettre(Long id) { return validerPrerequisDirecteur(id, "OK"); }
    @Override public Soutenance refuserPlanification(Long id, String c) { return null; }
    @Override public Soutenance proposerDateSoutenance(Long id, LocalDate d, LocalTime t, String l) { return null; }
    @Override @Deprecated public Soutenance autoriserSoutenance(Long id, String c) { return autoriserDemande(id, c); }

    private String saveFile(MultipartFile file, String prefix) {
        try {
            if (file == null || file.isEmpty()) return null;
            if (!Files.exists(rootLocation)) Files.createDirectories(rootLocation);
            String ext = (file.getOriginalFilename() != null && file.getOriginalFilename().contains(".")) ? file.getOriginalFilename().substring(file.getOriginalFilename().lastIndexOf(".")) : "";
            String filename = prefix + "_" + UUID.randomUUID() + ext;
            Files.copy(file.getInputStream(), rootLocation.resolve(filename), StandardCopyOption.REPLACE_EXISTING);
            return filename;
        } catch (IOException e) { throw new RuntimeException("Erreur fichier: " + e.getMessage()); }
    }

    private Soutenance enrichirAvecInfosUtilisateurs(Soutenance s) {
        try {
            UserDTO doc = userServiceClient.getUserById(s.getDoctorantId());
            UserDTO dir = userServiceClient.getUserById(s.getDirecteurId());
            s.setDoctorantInfo(doc);
            s.setDirecteurInfo(dir);
        } catch (Exception e) { log.warn("Impossible de récupérer les infos utilisateurs"); }
        return s;
    }
}