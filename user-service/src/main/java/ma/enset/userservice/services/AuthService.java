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

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    /**
     * Inscription
     */
    public AuthResponse register(RegisterRequest request) {
        log.info("📝 Inscription matricule: {}", request.getMatricule());

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
        log.info("✅ Candidat inscrit: {}", savedUser.getMatricule());

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
                .role(savedUser.getRole())
                .message("Inscription réussie")
                .build();
    }

    /**
     * Connexion (Supporte Matricule OU Email)
     */
    public AuthResponse login(LoginRequest request) {
        String loginInput = request.getUsername(); // Peut être matricule ou email
        log.info("🔐 Tentative de connexion pour: {}", loginInput);

        // 1. RÉCUPÉRATION DE L'UTILISATEUR (Par Matricule OU Email)
        User user = userRepository.findByMatricule(loginInput)
                .orElseGet(() -> userRepository.findByEmail(loginInput)
                        .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé")));

        try {
            // 2. AUTHENTIFICATION (On utilise le VRAI matricule de l'utilisateur trouvé)
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            user.getMatricule(), // Important : Spring Security attend le matricule ici
                            request.getPassword()
                    )
            );

            // 3. GÉNÉRATION DES TOKENS
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();
            String accessToken = jwtService.generateToken(userDetails);
            String refreshToken = jwtService.generateRefreshToken(userDetails);

            log.info("✅ Connexion réussie: {}", user.getMatricule());

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
                    .role(user.getRole())
                    .message("Connexion réussie")
                    .build();

        } catch (BadCredentialsException e) {
            log.warn("❌ Mot de passe incorrect pour {}", loginInput);
            throw new RuntimeException("Identifiant ou mot de passe incorrect");
        }
    }

    public AuthResponse refreshToken(String refreshToken) {
        if (!jwtService.validateToken(refreshToken)) {
            throw new RuntimeException("Invalide");
        }
        String matricule = jwtService.extractUsername(refreshToken);
        User user = userRepository.findByMatricule(matricule)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        UserDetails userDetails = userDetailsService.loadUserByUsername(matricule);
        String newAccessToken = jwtService.generateToken(userDetails);
        String newRefreshToken = jwtService.generateRefreshToken(userDetails);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtExpiration / 1000)
                .userId(user.getId())
                .username(user.getMatricule())
                .email(user.getEmail())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .role(user.getRole())
                .build();
    }

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

    public UserDTO getCurrentUser(String matricule) {
        User user = userRepository.findByMatricule(matricule)
                .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));

        return UserDTO.builder()
                .id(user.getId())
                .username(user.getMatricule())
                .email(user.getEmail())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .role(user.getRole().name())
                .build();
    }
}