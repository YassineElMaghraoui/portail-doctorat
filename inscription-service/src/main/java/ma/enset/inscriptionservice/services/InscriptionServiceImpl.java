package ma.enset.inscriptionservice.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.enset.inscriptionservice.clients.UserServiceClient;
import ma.enset.inscriptionservice.dto.EligibiliteReinscriptionDTO;
import ma.enset.inscriptionservice.dto.UserDTO;
import ma.enset.inscriptionservice.entities.Campagne;
import ma.enset.inscriptionservice.entities.Inscription;
import ma.enset.inscriptionservice.enums.StatutInscription;
import ma.enset.inscriptionservice.enums.TypeInscription;
import ma.enset.inscriptionservice.events.InscriptionCreatedEvent;
import ma.enset.inscriptionservice.events.InscriptionStatusChangedEvent;
import ma.enset.inscriptionservice.repositories.CampagneRepository;
import ma.enset.inscriptionservice.repositories.InscriptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class InscriptionServiceImpl implements InscriptionService {

    private final InscriptionRepository inscriptionRepository;
    private final CampagneRepository campagneRepository;
    private final UserServiceClient userServiceClient;
    private final InscriptionEventPublisher eventPublisher;
    private final DoctoratDureeService doctoratDureeService;

    @Override
    public Inscription createInscription(Inscription inscription) {
        log.info("Creating inscription for doctorant: {}", inscription.getDoctorantId());

        // ====== VÉRIFICATION DES RÈGLES TEMPORELLES ======
        if (inscription.getTypeInscription() == TypeInscription.REINSCRIPTION) {
            EligibiliteReinscriptionDTO eligibilite = doctoratDureeService
                    .verifierEligibiliteReinscription(inscription.getDoctorantId());

            if (!eligibilite.isEligible()) {
                log.warn("❌ Réinscription refusée pour doctorant {} : {}",
                        inscription.getDoctorantId(), eligibilite.getMessage());
                throw new RuntimeException(eligibilite.getMessage());
            }

            // Mettre à jour l'année d'inscription
            inscription.setAnneeInscription(eligibilite.getProchaineAnnee());
            log.info("✅ Réinscription autorisée pour l'année {}", eligibilite.getProchaineAnnee());
        } else {
            // Première inscription
            inscription.setAnneeInscription(1);
            inscription.setDatePremiereInscription(LocalDate.now());
        }
        // ====== FIN VÉRIFICATION ======

        // Charger la campagne complète si seulement l'ID est fourni
        if (inscription.getCampagne() != null && inscription.getCampagne().getId() != null) {
            Campagne campagne = campagneRepository.findById(inscription.getCampagne().getId())
                    .orElseThrow(() -> new RuntimeException("Campagne non trouvée avec l'id: " + inscription.getCampagne().getId()));
            inscription.setCampagne(campagne);
        }

        Inscription saved = inscriptionRepository.save(inscription);

        // ====== PUBLIER L'ÉVÉNEMENT KAFKA ======
        publishInscriptionCreatedEvent(saved);
        // ====== FIN ÉVÉNEMENT KAFKA ======

        return saved;
    }

    @Override
    public Inscription updateInscription(Long id, Inscription inscription) {
        log.info("Updating inscription with id: {}", id);

        return inscriptionRepository.findById(id)
                .map(existing -> {
                    existing.setSujetThese(inscription.getSujetThese());
                    existing.setLaboratoireAccueil(inscription.getLaboratoireAccueil());
                    existing.setCollaborationExterne(inscription.getCollaborationExterne());
                    existing.setDirecteurId(inscription.getDirecteurId());
                    // On met à jour la campagne si elle a changé
                    if (inscription.getCampagne() != null && inscription.getCampagne().getId() != null) {
                        Campagne camp = campagneRepository.findById(inscription.getCampagne().getId()).orElse(existing.getCampagne());
                        existing.setCampagne(camp);
                    }
                    return inscriptionRepository.save(existing);
                })
                .orElseThrow(() -> new RuntimeException("Inscription non trouvée avec l'id: " + id));
    }

    @Override
    public void deleteInscription(Long id) {
        log.info("Deleting inscription with id: {}", id);
        inscriptionRepository.deleteById(id);
    }

    @Override
    public Optional<Inscription> getInscriptionById(Long id) {
        return inscriptionRepository.findById(id);
    }

    @Override
    public List<Inscription> getAllInscriptions() {
        return inscriptionRepository.findAll();
    }

    @Override
    public List<Inscription> getInscriptionsByDoctorant(Long doctorantId) {
        return inscriptionRepository.findByDoctorantId(doctorantId);
    }

    @Override
    public List<Inscription> getInscriptionsByDirecteur(Long directeurId) {
        return inscriptionRepository.findByDirecteurId(directeurId);
    }

    @Override
    public List<Inscription> getInscriptionsByStatut(StatutInscription statut) {
        return inscriptionRepository.findByStatut(statut);
    }

    // ==========================================================
    // 🆕 NOUVELLE MÉTHODE AJOUTÉE POUR LE BOUTON SOUMETTRE
    // ==========================================================
    @Override
    public Inscription soumettreInscription(Long id) {
        log.info("Tentative de soumission de l'inscription: {}", id);

        return inscriptionRepository.findById(id)
                .map(inscription -> {
                    // 1. Vérifier que c'est bien un brouillon
                    if (inscription.getStatut() != StatutInscription.BROUILLON) {
                        throw new RuntimeException("Seule une inscription en brouillon peut être soumise.");
                    }

                    // 2. Sauvegarder l'ancien statut pour l'historique/kafka
                    String ancienStatut = inscription.getStatut().name();

                    // 3. Changer le statut
                    inscription.setStatut(StatutInscription.SOUMIS);
                    Inscription updated = inscriptionRepository.save(inscription);

                    // 4. Publier l'événement Kafka
                    publishStatusChangedEvent(updated, ancienStatut, "SOUMIS", "Dossier soumis par le doctorant", "Doctorant");

                    return updated;
                })
                .orElseThrow(() -> new RuntimeException("Inscription non trouvée avec l'id: " + id));
    }

    @Override
    public Inscription changerStatut(Long id, StatutInscription nouveauStatut, String commentaire) {
        log.info("Changing status of inscription {} to {}", id, nouveauStatut);

        return inscriptionRepository.findById(id)
                .map(inscription -> {
                    String ancienStatut = inscription.getStatut().name();
                    inscription.setStatut(nouveauStatut);
                    Inscription updated = inscriptionRepository.save(inscription);

                    // ====== PUBLIER L'ÉVÉNEMENT KAFKA ======
                    publishStatusChangedEvent(updated, ancienStatut, nouveauStatut.name(), commentaire, null);
                    // ====== FIN ÉVÉNEMENT KAFKA ======

                    return updated;
                })
                .orElseThrow(() -> new RuntimeException("Inscription non trouvée avec l'id: " + id));
    }

    @Override
    public Inscription validerParDirecteur(Long id, String commentaire) {
        log.info("Validation par directeur de l'inscription: {}", id);

        return inscriptionRepository.findById(id)
                .map(inscription -> {
                    String ancienStatut = inscription.getStatut().name();
                    inscription.setStatut(StatutInscription.VALIDE_DIRECTEUR);
                    inscription.setCommentaireDirecteur(commentaire);
                    inscription.setDateValidationDirecteur(LocalDateTime.now());
                    Inscription updated = inscriptionRepository.save(inscription);

                    // ====== PUBLIER L'ÉVÉNEMENT KAFKA ======
                    publishStatusChangedEvent(updated, ancienStatut, "VALIDE_DIRECTEUR", commentaire, "Directeur");
                    // ====== FIN ÉVÉNEMENT KAFKA ======

                    return updated;
                })
                .orElseThrow(() -> new RuntimeException("Inscription non trouvée avec l'id: " + id));
    }

    @Override
    public Inscription validerParAdmin(Long id, String commentaire) {
        log.info("Validation par admin de l'inscription: {}", id);

        return inscriptionRepository.findById(id)
                .map(inscription -> {
                    if (inscription.getStatut() != StatutInscription.VALIDE_DIRECTEUR) {
                        throw new RuntimeException("L'inscription doit d'abord être validée par le directeur");
                    }

                    String ancienStatut = inscription.getStatut().name();
                    inscription.setStatut(StatutInscription.VALIDE_ADMIN);
                    inscription.setCommentaireAdmin(commentaire);
                    inscription.setDateValidationAdmin(LocalDateTime.now());
                    Inscription updated = inscriptionRepository.save(inscription);

                    // ====== PUBLIER L'ÉVÉNEMENT KAFKA ======
                    publishStatusChangedEvent(updated, ancienStatut, "VALIDE_ADMIN", commentaire, "Admin");
                    // ====== FIN ÉVÉNEMENT KAFKA ======

                    return updated;
                })
                .orElseThrow(() -> new RuntimeException("Inscription non trouvée avec l'id: " + id));
    }

    @Override
    public Inscription rejeterParDirecteur(Long id, String commentaire) {
        log.info("Rejet par directeur de l'inscription: {}", id);

        return inscriptionRepository.findById(id)
                .map(inscription -> {
                    String ancienStatut = inscription.getStatut().name();
                    inscription.setStatut(StatutInscription.REJETE_DIRECTEUR);
                    inscription.setCommentaireDirecteur(commentaire);
                    Inscription updated = inscriptionRepository.save(inscription);

                    // ====== PUBLIER L'ÉVÉNEMENT KAFKA ======
                    publishStatusChangedEvent(updated, ancienStatut, "REJETE_DIRECTEUR", commentaire, "Directeur");
                    // ====== FIN ÉVÉNEMENT KAFKA ======

                    return updated;
                })
                .orElseThrow(() -> new RuntimeException("Inscription non trouvée avec l'id: " + id));
    }

    @Override
    public Inscription rejeterParAdmin(Long id, String commentaire) {
        log.info("Rejet par admin de l'inscription: {}", id);

        return inscriptionRepository.findById(id)
                .map(inscription -> {
                    String ancienStatut = inscription.getStatut().name();
                    inscription.setStatut(StatutInscription.REJETE_ADMIN);
                    inscription.setCommentaireAdmin(commentaire);
                    Inscription updated = inscriptionRepository.save(inscription);

                    // ====== PUBLIER L'ÉVÉNEMENT KAFKA ======
                    publishStatusChangedEvent(updated, ancienStatut, "REJETE_ADMIN", commentaire, "Admin");
                    // ====== FIN ÉVÉNEMENT KAFKA ======

                    return updated;
                })
                .orElseThrow(() -> new RuntimeException("Inscription non trouvée avec l'id: " + id));
    }

    // ====== MÉTHODES PRIVÉES POUR KAFKA ======

    private void publishInscriptionCreatedEvent(Inscription inscription) {
        try {
            UserDTO doctorant = getUserInfo(inscription.getDoctorantId());
            UserDTO directeur = inscription.getDirecteurId() != null
                    ? getUserInfo(inscription.getDirecteurId()) : null;

            InscriptionCreatedEvent event = InscriptionCreatedEvent.builder()
                    .inscriptionId(inscription.getId())
                    .doctorantId(inscription.getDoctorantId())
                    .doctorantEmail(doctorant.getEmail())
                    .doctorantNom(doctorant.getNom())
                    .doctorantPrenom(doctorant.getPrenom())
                    .sujetThese(inscription.getSujetThese())
                    .directeurTheseEmail(directeur != null ? directeur.getEmail() : null)
                    .directeurTheseNom(directeur != null ? directeur.getNom() + " " + directeur.getPrenom() : null)
                    .campagneId(inscription.getCampagne() != null ? inscription.getCampagne().getId() : null)
                    .campagneNom(inscription.getCampagne() != null ? inscription.getCampagne().getAnneeUniversitaire() : null)
                    .status(inscription.getStatut().name())
                    .build();

            eventPublisher.publishInscriptionCreated(event);
            log.info("✅ Événement InscriptionCreated publié pour inscription ID: {}", inscription.getId());

        } catch (Exception e) {
            log.warn("⚠️ Impossible de publier l'événement Kafka: {}", e.getMessage());
        }
    }

    private void publishStatusChangedEvent(Inscription inscription, String oldStatus, String newStatus,
                                           String commentaire, String validatedBy) {
        try {
            UserDTO doctorant = getUserInfo(inscription.getDoctorantId());

            InscriptionStatusChangedEvent event = InscriptionStatusChangedEvent.builder()
                    .inscriptionId(inscription.getId())
                    .doctorantId(inscription.getDoctorantId())
                    .doctorantEmail(doctorant.getEmail())
                    .doctorantNom(doctorant.getNom())
                    .doctorantPrenom(doctorant.getPrenom())
                    .oldStatus(oldStatus)
                    .newStatus(newStatus)
                    .sujetThese(inscription.getSujetThese())
                    .commentaire(commentaire)
                    .validatedBy(validatedBy)
                    .build();

            eventPublisher.publishInscriptionStatusChanged(event);
            log.info("✅ Événement InscriptionStatusChanged publié: {} -> {}", oldStatus, newStatus);

        } catch (Exception e) {
            log.warn("⚠️ Impossible de publier l'événement Kafka: {}", e.getMessage());
        }
    }

    private UserDTO getUserInfo(Long userId) {
        try {
            return userServiceClient.getUserById(userId);
        } catch (Exception e) {
            log.warn("⚠️ Impossible de récupérer l'utilisateur {}: {}", userId, e.getMessage());
            return UserDTO.builder()
                    .id(userId)
                    .nom("Utilisateur")
                    .prenom("ID-" + userId)
                    .email("user" + userId + "@doctorat.ma")
                    .build();
        }
    }
}