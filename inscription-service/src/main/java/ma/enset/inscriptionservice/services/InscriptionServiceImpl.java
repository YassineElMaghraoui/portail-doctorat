package ma.enset.inscriptionservice.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.enset.inscriptionservice.clients.UserServiceClient;
import ma.enset.inscriptionservice.dto.EligibiliteReinscriptionDTO;
import ma.enset.inscriptionservice.dto.UserDTO;
import ma.enset.inscriptionservice.entities.Campagne;
import ma.enset.inscriptionservice.entities.Document; // ✅
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

        // 1. Règles Métier (Réinscription)
        if (inscription.getTypeInscription() == TypeInscription.REINSCRIPTION) {
            EligibiliteReinscriptionDTO eligibilite = doctoratDureeService
                    .verifierEligibiliteReinscription(inscription.getDoctorantId());
            if (!eligibilite.isEligible()) {
                throw new RuntimeException(eligibilite.getMessage());
            }
            inscription.setAnneeInscription(eligibilite.getProchaineAnnee());
        } else {
            inscription.setAnneeInscription(1);
            inscription.setDatePremiereInscription(LocalDate.now());
        }

        // 2. Lier la Campagne
        if (inscription.getCampagne() != null && inscription.getCampagne().getId() != null) {
            Campagne campagne = campagneRepository.findById(inscription.getCampagne().getId())
                    .orElseThrow(() -> new RuntimeException("Campagne introuvable"));
            inscription.setCampagne(campagne);
        }

        // 3. ✅ LIER LES DOCUMENTS (CRUCIAL)
        // Le frontend envoie une liste de documents qui contiennent juste { id: 123 }
        // On doit dire à chaque document : "Ton parent, c'est cette inscription"
        if (inscription.getDocuments() != null) {
            for (Document doc : inscription.getDocuments()) {
                // On mappe l'ID reçu du frontend vers le champ documentServiceId
                // ATTENTION : Si le frontend envoie { id: 123 }, Jackson le mappe sur doc.id
                // On doit le déplacer vers documentServiceId car doc.id doit être null (auto-généré)
                if (doc.getId() != null) {
                    doc.setDocumentServiceId(doc.getId());
                    doc.setId(null); // On reset l'ID pour que JPA en génère un nouveau
                    doc.setNomFichier("Document " + doc.getDocumentServiceId()); // Nom par défaut
                }
                doc.setInscription(inscription); // Liaison Parent-Enfant
            }
        }

        // 4. Sauvegarde en cascade (Inscription + Documents)
        Inscription saved = inscriptionRepository.save(inscription);

        // 5. Événement Kafka
        publishInscriptionCreatedEvent(saved);

        return saved;
    }

    // ... (Le reste des méthodes reste inchangé : update, delete, get, valider, etc.)
    // ... Copiez-collez les autres méthodes de votre ancien fichier ici ...

    @Override
    public Inscription updateInscription(Long id, Inscription inscription) {
        return inscriptionRepository.findById(id)
                .map(existing -> {
                    existing.setSujetThese(inscription.getSujetThese());
                    existing.setLaboratoireAccueil(inscription.getLaboratoireAccueil());
                    existing.setCollaborationExterne(inscription.getCollaborationExterne());
                    existing.setDirecteurId(inscription.getDirecteurId());
                    // Update Campagne
                    if (inscription.getCampagne() != null) {
                        Campagne camp = campagneRepository.findById(inscription.getCampagne().getId()).orElse(existing.getCampagne());
                        existing.setCampagne(camp);
                    }
                    // Update Documents (Ajout)
                    if (inscription.getDocuments() != null) {
                        for(Document d : inscription.getDocuments()) {
                            if(d.getId() != null) { // ID venant du DocService
                                d.setDocumentServiceId(d.getId());
                                d.setId(null);
                                d.setNomFichier("Doc " + d.getDocumentServiceId());
                                existing.addDocument(d);
                            }
                        }
                    }
                    return inscriptionRepository.save(existing);
                })
                .orElseThrow(() -> new RuntimeException("Inscription introuvable"));
    }

    @Override
    public void deleteInscription(Long id) {
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

    @Override
    public Inscription soumettreInscription(Long id) {
        return inscriptionRepository.findById(id)
                .map(inscription -> {
                    if (inscription.getStatut() != StatutInscription.BROUILLON) {
                        throw new RuntimeException("Statut invalide pour soumission");
                    }
                    inscription.setStatut(StatutInscription.SOUMIS);
                    Inscription saved = inscriptionRepository.save(inscription);
                    publishStatusChangedEvent(saved, "BROUILLON", "SOUMIS", "Soumission", "Doctorant");
                    return saved;
                })
                .orElseThrow(() -> new RuntimeException("Inscription introuvable"));
    }

    @Override
    public Inscription changerStatut(Long id, StatutInscription nouveauStatut, String commentaire) {
        return inscriptionRepository.findById(id)
                .map(ins -> {
                    ins.setStatut(nouveauStatut);
                    return inscriptionRepository.save(ins);
                }).orElseThrow();
    }

    @Override
    public Inscription validerParDirecteur(Long id, String commentaire) {
        return inscriptionRepository.findById(id).map(ins -> {
            ins.setStatut(StatutInscription.VALIDE_DIRECTEUR);
            ins.setCommentaireDirecteur(commentaire);
            ins.setDateValidationDirecteur(LocalDateTime.now());
            return inscriptionRepository.save(ins);
        }).orElseThrow();
    }

    @Override
    public Inscription validerParAdmin(Long id, String commentaire) {
        return inscriptionRepository.findById(id).map(ins -> {
            ins.setStatut(StatutInscription.VALIDE_ADMIN);
            ins.setCommentaireAdmin(commentaire);
            ins.setDateValidationAdmin(LocalDateTime.now());
            return inscriptionRepository.save(ins);
        }).orElseThrow();
    }

    @Override
    public Inscription rejeterParDirecteur(Long id, String commentaire) {
        return inscriptionRepository.findById(id).map(ins -> {
            ins.setStatut(StatutInscription.REJETE_DIRECTEUR);
            ins.setCommentaireDirecteur(commentaire);
            return inscriptionRepository.save(ins);
        }).orElseThrow();
    }

    @Override
    public Inscription rejeterParAdmin(Long id, String commentaire) {
        return inscriptionRepository.findById(id).map(ins -> {
            ins.setStatut(StatutInscription.REJETE_ADMIN);
            ins.setCommentaireAdmin(commentaire);
            return inscriptionRepository.save(ins);
        }).orElseThrow();
    }

    // --- Helpers Kafka (Gardez vos méthodes privées existantes) ---
    private void publishInscriptionCreatedEvent(Inscription inscription) { /* ... */ }
    private void publishStatusChangedEvent(Inscription inscription, String s1, String s2, String c, String v) { /* ... */ }
}