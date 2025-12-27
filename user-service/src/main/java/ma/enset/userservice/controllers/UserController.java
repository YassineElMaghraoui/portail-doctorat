package ma.enset.userservice.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.enset.userservice.dto.UserDTO;
import ma.enset.userservice.entities.User;
import ma.enset.userservice.enums.Role;
import ma.enset.userservice.mappers.UserMapper;
import ma.enset.userservice.services.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;
    private final UserMapper userMapper;

    @PostMapping
    public ResponseEntity<User> createUser(@Valid @RequestBody User user) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        log.info("🔐 POST /api/users - Authenticated user: {}", auth != null ? auth.getName() : "NONE");
        log.info("🔐 POST /api/users - Authorities: {}", auth != null ? auth.getAuthorities() : "NONE");

        log.info("REST request to create user: {}", user.getUsername());
        User createdUser = userService.createUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        Optional<User> userOpt = userService.getUserById(id);
        return userOpt.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/username/{username}")
    public ResponseEntity<User> getUserByUsername(@PathVariable String username) {
        return userService.getUserByUsername(username)
                .map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<User> getUserByEmail(@PathVariable String email) {
        return userService.getUserByEmail(email)
                .map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/role/{role}")
    public ResponseEntity<List<User>> getUsersByRole(@PathVariable Role role) {
        return ResponseEntity.ok(userService.getUsersByRole(role));
    }

    @GetMapping("/etat/{etat}")
    public ResponseEntity<List<User>> getUsersByEtat(@PathVariable String etat) {
        return ResponseEntity.ok(userService.getUsersByEtat(etat));
    }

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @RequestBody User user) {
        try {
            User updatedUser = userService.updateUser(id, user);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ========================================================
    // WORKFLOW ADMIN
    // ========================================================

    /**
     * L'Admin valide une candidature ET assigne un directeur
     */
    @PutMapping("/{id}/validate-admin")
    public ResponseEntity<User> validateAdmin(
            @PathVariable Long id,
            @RequestParam(required = false) Long directeurId) {
        log.info("Request to validate candidate by admin: {} with directeur: {}", id, directeurId);

        if (directeurId != null) {
            return ResponseEntity.ok(userService.validerCandidatureAvecDirecteur(id, directeurId));
        } else {
            return ResponseEntity.ok(userService.validerCandidature(id));
        }
    }

    /**
     * L'Admin refuse une candidature avec motif
     */
    @PutMapping("/{id}/refuse")
    public ResponseEntity<User> refuseCandidate(@PathVariable Long id, @RequestParam String motif) {
        log.info("Request to refuse candidate by admin: {}", id);
        return ResponseEntity.ok(userService.refuserCandidature(id, motif));
    }

    // ========================================================
    // WORKFLOW DIRECTEUR DE THÈSE
    // ========================================================

    /**
     * Le Directeur valide une candidature
     * - Sans sujet: valide simplement
     * - Avec sujet (param sujetThese): valide ET stocke le sujet de thèse
     */
    @PutMapping("/{id}/validate-directeur")
    public ResponseEntity<User> validateDirecteur(
            @PathVariable Long id,
            @RequestParam(required = false) String sujetThese) {
        log.info("Request to validate candidate by directeur: {} with sujet: {}", id, sujetThese);

        // ✅ Si un sujet est fourni, utiliser la nouvelle méthode
        if (sujetThese != null && !sujetThese.trim().isEmpty()) {
            return ResponseEntity.ok(userService.validerCandidatureDirecteurAvecSujet(id, sujetThese.trim()));
        } else {
            // Sinon, validation simple (sans sujet)
            return ResponseEntity.ok(userService.validerCandidatureDirecteur(id));
        }
    }

    /**
     * Le Directeur refuse une candidature avec motif
     */
    @PutMapping("/{id}/refuse-directeur")
    public ResponseEntity<User> refuseDirecteur(@PathVariable Long id, @RequestParam String motif) {
        log.info("Request to refuse candidate by directeur: {} with motif: {}", id, motif);
        return ResponseEntity.ok(userService.refuserCandidatureDirecteur(id, motif));
    }

    // ========================================================
    // AUTRES ENDPOINTS
    // ========================================================

    @PutMapping("/{id}/role")
    public ResponseEntity<User> changeUserRole(@PathVariable Long id, @RequestParam Role newRole) {
        return ResponseEntity.ok(userService.changeRole(id, newRole));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("User Service is running!");
    }

    /**
     * 🔍 DEBUG: Endpoint pour vérifier l'authentification actuelle
     */
    @GetMapping("/debug/auth")
    public ResponseEntity<String> debugAuth() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return ResponseEntity.ok("No authentication found");
        }
        return ResponseEntity.ok(String.format(
                "User: %s, Authorities: %s, Authenticated: %s",
                auth.getName(),
                auth.getAuthorities(),
                auth.isAuthenticated()
        ));
    }

    // ========== DTOs ==========
    @GetMapping("/{id}/dto")
    public ResponseEntity<UserDTO> getUserDTO(@PathVariable Long id) {
        return userService.getUserById(id)
                .map(user -> ResponseEntity.ok(userMapper.toDTO(user)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/username/{username}/dto")
    public ResponseEntity<UserDTO> getUserDTOByUsername(@PathVariable String username) {
        return userService.getUserByUsername(username)
                .map(user -> ResponseEntity.ok(userMapper.toDTO(user)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}