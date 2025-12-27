package ma.enset.userservice.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.enset.userservice.entities.User;
import ma.enset.userservice.enums.Role;
import ma.enset.userservice.repositories.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    // =============================================================
    // CRUD
    // =============================================================

    @Override
    public User createUser(User user) {
        log.info("Creating user: {}", user.getMatricule());

        if (userRepository.existsByMatricule(user.getMatricule())) {
            throw new RuntimeException("Un utilisateur avec ce matricule existe déjà");
        }
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Un utilisateur avec cet email existe déjà");
        }

        // Encoder le mot de passe
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        return userRepository.save(user);
    }

    @Override
    public User updateUser(Long id, User userDetails) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec l'ID: " + id));

        if (userDetails.getNom() != null) user.setNom(userDetails.getNom());
        if (userDetails.getPrenom() != null) user.setPrenom(userDetails.getPrenom());
        if (userDetails.getEmail() != null) user.setEmail(userDetails.getEmail());
        if (userDetails.getTelephone() != null) user.setTelephone(userDetails.getTelephone());
        if (userDetails.getRole() != null) user.setRole(userDetails.getRole());
        if (userDetails.getEnabled() != null) user.setEnabled(userDetails.getEnabled());

        return userRepository.save(user);
    }

    @Override
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("Utilisateur non trouvé avec l'ID: " + id);
        }
        userRepository.deleteById(id);
    }

    // =============================================================
    // RECHERCHE
    // =============================================================

    @Override
    @Transactional(readOnly = true)
    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByMatricule(username);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    // =============================================================
    // LISTES
    // =============================================================

    @Override
    @Transactional(readOnly = true)
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> getUsersByRole(Role role) {
        return userRepository.findByRole(role);
    }

    @Override
    @Transactional(readOnly = true)
    public List<User> getUsersByEtat(String etat) {
        return userRepository.findByEtat(etat);
    }

    // =============================================================
    // CHANGEMENT DE RÔLE
    // =============================================================

    @Override
    public User changeRole(Long id, Role newRole) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        user.setRole(newRole);
        return userRepository.save(user);
    }

    // =============================================================
    // WORKFLOW ADMIN
    // =============================================================

    @Override
    public User validerCandidature(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (!"EN_ATTENTE_ADMIN".equals(user.getEtat())) {
            throw new RuntimeException("Cette candidature n'est pas en attente de validation admin");
        }

        user.setEtat("EN_ATTENTE_DIRECTEUR");
        log.info("✅ Candidature {} validée par admin (sans directeur)", id);
        return userRepository.save(user);
    }

    @Override
    public User validerCandidatureAvecDirecteur(Long id, Long directeurId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec l'ID: " + id));

        if (!"EN_ATTENTE_ADMIN".equals(user.getEtat())) {
            throw new RuntimeException("Cette candidature n'est pas en attente de validation admin. État actuel: " + user.getEtat());
        }

        // Vérifier que le directeur existe
        User directeur = userRepository.findById(directeurId)
                .orElseThrow(() -> new RuntimeException("Directeur non trouvé avec l'ID: " + directeurId));

        if (directeur.getRole() != Role.DIRECTEUR_THESE) {
            throw new RuntimeException("L'utilisateur sélectionné n'est pas un directeur de thèse");
        }

        user.setEtat("EN_ATTENTE_DIRECTEUR");
        user.setDirecteurId(directeurId);

        log.info("✅ Candidature {} validée par admin avec directeur {}", id, directeurId);
        return userRepository.save(user);
    }

    @Override
    public User refuserCandidature(Long id, String motif) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        user.setEtat("REFUSE");
        user.setMotifRefus(motif);

        log.info("❌ Candidature {} refusée par admin. Motif: {}", id, motif);
        return userRepository.save(user);
    }

    // =============================================================
    // WORKFLOW DIRECTEUR
    // =============================================================

    @Override
    public User validerCandidatureDirecteur(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec l'ID: " + id));

        if (!"EN_ATTENTE_DIRECTEUR".equals(user.getEtat())) {
            throw new RuntimeException("Cette candidature n'est pas en attente de validation directeur. État actuel: " + user.getEtat());
        }

        user.setRole(Role.DOCTORANT);
        user.setEtat("VALIDE");
        user.setDateInscription(LocalDateTime.now());
        user.setAnneeThese(1);

        log.info("✅ Candidature {} validée par directeur (sans sujet)", id);
        return userRepository.save(user);
    }

    /**
     * ✅ NOUVEAU : Validation directeur AVEC sujet de thèse
     * Le sujet est stocké dans le champ titreThese de l'utilisateur
     */
    @Override
    public User validerCandidatureDirecteurAvecSujet(Long id, String sujetThese) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé avec l'ID: " + id));

        if (!"EN_ATTENTE_DIRECTEUR".equals(user.getEtat())) {
            throw new RuntimeException("Cette candidature n'est pas en attente de validation directeur. État actuel: " + user.getEtat());
        }

        // Valider le sujet de thèse
        if (sujetThese == null || sujetThese.trim().isEmpty()) {
            throw new RuntimeException("Le sujet de thèse est obligatoire");
        }

        // ✅ Mettre à jour le sujet de thèse
        user.setTitreThese(sujetThese.trim());

        // Changer le rôle en DOCTORANT
        user.setRole(Role.DOCTORANT);
        user.setEtat("VALIDE");
        user.setDateInscription(LocalDateTime.now());
        user.setAnneeThese(1);

        User savedUser = userRepository.save(user);

        log.info("✅ Candidature {} validée par directeur", id);
        log.info("   Doctorant: {} {}", user.getNom(), user.getPrenom());
        log.info("   Sujet de thèse: {}", sujetThese);

        return savedUser;
    }

    @Override
    public User refuserCandidatureDirecteur(Long id, String motif) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        if (!"EN_ATTENTE_DIRECTEUR".equals(user.getEtat())) {
            throw new RuntimeException("Cette candidature n'est pas en attente de validation directeur");
        }

        user.setEtat("REFUSE");
        user.setMotifRefus(motif);

        log.info("❌ Candidature {} refusée par directeur. Motif: {}", id, motif);
        return userRepository.save(user);
    }
}