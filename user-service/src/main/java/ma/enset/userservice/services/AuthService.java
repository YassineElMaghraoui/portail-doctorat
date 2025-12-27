package ma.enset.userservice.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.enset.userservice.dto.*;
import ma.enset.userservice.entities.User;
import ma.enset.userservice.enums.Role;
import ma.enset.userservice.repositories.UserRepository;
import ma.enset.userservice.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;

    // ✅ Injection de ton FileStorageService (pour gérer le stockage disque)
    private final FileStorageService fileStorageService;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    /* =====================================================
       INSCRIPTION SIMPLE (JSON)
       ===================================================== */
    public AuthResponse register(RegisterRequest request) {
        return processRegistration(request);
    }

    /* =====================================================
       ✅ INSCRIPTION AVEC FICHIERS (CORRIGÉE)
       ===================================================== */
    public AuthResponse registerWithFiles(
            RegisterRequest request,
            MultipartFile cv,
            MultipartFile diplome,
            MultipartFile lettre
    ) {
        log.info("📂 Inscription avec fichiers pour matricule: {}", request.getMatricule());

        // 1. Créer l'utilisateur de base (Sauvegarde initiale)
        AuthResponse response = processRegistration(request);

        // 2. Récupérer l'entité User fraîchement créée pour la mettre à jour
        User user = userRepository.findById(response.getUserId())
                .orElseThrow(() -> new RuntimeException("Erreur interne: Utilisateur non trouvé après création"));

        // 3. Sauvegarder les fichiers et mettre à jour les champs de l'entité
        try {
            if (cv != null && !cv.isEmpty()) {
                String cvName = fileStorageService.saveFile(cv);
                user.setCv(cvName);
            }
            if (diplome != null && !diplome.isEmpty()) {
                String diplomeName = fileStorageService.saveFile(diplome);
                user.setDiplome(diplomeName);
            }
            if (lettre != null && !lettre.isEmpty()) {
                String lettreName = fileStorageService.saveFile(lettre);
                user.setLettreMotivation(lettreName);
            }

            // 4. Initialiser le Workflow
            user.setEtat("EN_ATTENTE_ADMIN");

            // 5. Mettre à jour en Base de Données
            userRepository.save(user);
            log.info("✅ Fichiers liés au compte : CV={}, Diplome={}", user.getCv(), user.getDiplome());

        } catch (Exception e) {
            log.error("❌ Erreur lors de la sauvegarde des fichiers", e);
            throw new RuntimeException("Erreur lors de l'enregistrement des pièces jointes : " + e.getMessage());
        }

        return response;
    }

    /* =====================================================
       LOGIQUE COMMUNE DE CREATION UTILISATEUR
       ===================================================== */
    private AuthResponse processRegistration(RegisterRequest request) {

        log.info("📝 Création compte : {}", request.getMatricule());

        if (userRepository.existsByMatricule(request.getMatricule())) {
            throw new RuntimeException("Ce matricule existe déjà");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Cet email est déjà utilisé");
        }

        User user = new User();
        user.setMatricule(request.getMatricule());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setNom(request.getNom());
        user.setPrenom(request.getPrenom());
        user.setTelephone(request.getTelephone());
        user.setRole(Role.CANDIDAT);
        user.setEnabled(true);

        User savedUser = userRepository.save(user);

        UserDetails userDetails = userDetailsService.loadUserByUsername(savedUser.getMatricule());
        String accessToken = jwtService.generateToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtExpiration / 1000)
                .userId(savedUser.getId())
                .username(savedUser.getMatricule())
                .email(savedUser.getEmail())
                .nom(savedUser.getNom())
                .prenom(savedUser.getPrenom())
                .telephone(savedUser.getTelephone())
                .role(savedUser.getRole())
                .etat(savedUser.getEtat())
                .message("Inscription réussie")
                .build();
    }

    /* =====================================================
       LOGIN (Matricule OU Email)
       ===================================================== */
    public AuthResponse login(LoginRequest request) {

        String loginInput = request.getUsername();

        User user = userRepository.findByMatricule(loginInput)
                .orElseGet(() -> userRepository.findByEmail(loginInput)
                        .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé")));

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            user.getMatricule(),
                            request.getPassword()
                    )
            );

            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String accessToken = jwtService.generateToken(userDetails);
            String refreshToken = jwtService.generateRefreshToken(userDetails);

            log.info("✅ Login réussi pour: {} (Role: {})", user.getMatricule(), user.getRole());
            log.info("   Sujet de thèse: {}", user.getTitreThese());

            return AuthResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshToken)
                    .tokenType("Bearer")
                    .expiresIn(jwtExpiration / 1000)
                    .userId(user.getId())
                    .username(user.getMatricule())
                    .email(user.getEmail())
                    .nom(user.getNom())
                    .prenom(user.getPrenom())
                    .telephone(user.getTelephone())
                    .role(user.getRole())
                    // ✅ Workflow
                    .etat(user.getEtat())
                    .motifRefus(user.getMotifRefus())
                    // ✅ Directeur assigné
                    .directeurId(user.getDirecteurId())
                    // ✅ NOUVEAU : Sujet de thèse
                    .titreThese(user.getTitreThese())
                    // ✅ Suivi doctorant
                    .anneeThese(user.getAnneeThese())
                    .nbPublications(user.getNbPublications())
                    .nbConferences(user.getNbConferences())
                    .heuresFormation(user.getHeuresFormation())
                    .message("Connexion réussie")
                    .build();

        } catch (BadCredentialsException e) {
            throw new RuntimeException("Identifiant ou mot de passe incorrect");
        }
    }

    /* =====================================================
       REFRESH TOKEN
       ===================================================== */
    public AuthResponse refreshToken(String refreshToken) {
        if (!jwtService.validateToken(refreshToken)) {
            throw new RuntimeException("Token invalide");
        }
        String matricule = jwtService.extractUsername(refreshToken);
        User user = userRepository.findByMatricule(matricule)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        UserDetails userDetails = userDetailsService.loadUserByUsername(matricule);

        return AuthResponse.builder()
                .accessToken(jwtService.generateToken(userDetails))
                .refreshToken(jwtService.generateRefreshToken(userDetails))
                .tokenType("Bearer")
                .expiresIn(jwtExpiration / 1000)
                .userId(user.getId())
                .username(user.getMatricule())
                .email(user.getEmail())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .telephone(user.getTelephone())
                .role(user.getRole())
                // ✅ Inclure tous les champs aussi pour le refresh
                .etat(user.getEtat())
                .motifRefus(user.getMotifRefus())
                .directeurId(user.getDirecteurId())
                .titreThese(user.getTitreThese())
                .anneeThese(user.getAnneeThese())
                .nbPublications(user.getNbPublications())
                .nbConferences(user.getNbConferences())
                .heuresFormation(user.getHeuresFormation())
                .build();
    }

    /* =====================================================
       CHANGER MOT DE PASSE
       ===================================================== */
    public void changePassword(String matricule, ChangePasswordRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Les mots de passe ne correspondent pas");
        }
        User user = userRepository.findByMatricule(matricule)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new RuntimeException("Ancien mot de passe incorrect");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    /* =====================================================
       PROFIL UTILISATEUR CONNECTÉ
       ===================================================== */
    public UserDTO getCurrentUser(String matricule) {
        User user = userRepository.findByMatricule(matricule)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        return UserDTO.builder()
                .id(user.getId())
                .username(user.getMatricule())
                .email(user.getEmail())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .telephone(user.getTelephone())
                .role(user.getRole().name())
                .etat(user.getEtat())
                .motifRefus(user.getMotifRefus())
                .directeurId(user.getDirecteurId())
                // ✅ NOUVEAU : Sujet de thèse
                .titreThese(user.getTitreThese())
                .anneeThese(user.getAnneeThese())
                .nbPublications(user.getNbPublications())
                .nbConferences(user.getNbConferences())
                .heuresFormation(user.getHeuresFormation())
                .build();
    }
}