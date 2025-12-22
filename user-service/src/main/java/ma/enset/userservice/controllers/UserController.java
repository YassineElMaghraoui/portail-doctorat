package ma.enset.userservice.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.enset.userservice.dto.UserDTO;
import ma.enset.userservice.entities.User;
import ma.enset.userservice.enums.Role; // ✅ IMPORTANT : Import de l'Enum Role
import ma.enset.userservice.mappers.UserMapper;
import ma.enset.userservice.services.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
    private final UserMapper userMapper; // ✅ Mis en final pour l'injection par constructeur

    @PostMapping
    public ResponseEntity<User> createUser(@Valid @RequestBody User user) {
        log.info("REST request to create user: {}", user.getUsername());
        User createdUser = userService.createUser(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);
    }

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        log.info("REST request to get all users");
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        log.info("REST request to get user by id: {}", id);
        Optional<User> userOpt = userService.getUserById(id);
        if (userOpt.isPresent()) {
            return ResponseEntity.ok(userOpt.get());
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/username/{username}")
    public ResponseEntity<User> getUserByUsername(@PathVariable String username) {
        log.info("REST request to get user by username: {}", username);
        Optional<User> userOpt = userService.getUserByUsername(username);
        if (userOpt.isPresent()) {
            return ResponseEntity.ok(userOpt.get());
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<User> getUserByEmail(@PathVariable String email) {
        log.info("REST request to get user by email: {}", email);
        Optional<User> userOpt = userService.getUserByEmail(email);
        if (userOpt.isPresent()) {
            return ResponseEntity.ok(userOpt.get());
        }
        return ResponseEntity.notFound().build();
    }

    // 🔴🔴🔴 NOUVEAU ENDPOINT POUR L'ADMIN DASHBOARD 🔴🔴🔴
    @GetMapping("/role/{role}")
    public ResponseEntity<List<User>> getUsersByRole(@PathVariable Role role) {
        log.info("REST request to get users by role: {}", role);
        List<User> users = userService.getUsersByRole(role);
        return ResponseEntity.ok(users);
    }
    // ---------------------------------------------------------

    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(@PathVariable Long id, @Valid @RequestBody User user) {
        log.info("REST request to update user with id: {}", id);
        try {
            User updatedUser = userService.updateUser(id, user);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        log.info("REST request to delete user with id: {}", id);
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("User Service is running!");
    }

    // ========== ENDPOINTS POUR OPENFEIGN ==========

    @GetMapping("/{id}/dto")
    public ResponseEntity<UserDTO> getUserDTO(@PathVariable Long id) {
        log.info("REST request to get User DTO by id: {}", id);
        Optional<User> userOpt = userService.getUserById(id);
        if (userOpt.isPresent()) {
            UserDTO dto = userMapper.toDTO(userOpt.get());
            return ResponseEntity.ok(dto);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/username/{username}/dto")
    public ResponseEntity<UserDTO> getUserDTOByUsername(@PathVariable String username) {
        log.info("REST request to get User DTO by username: {}", username);
        Optional<User> userOpt = userService.getUserByUsername(username);
        if (userOpt.isPresent()) {
            UserDTO dto = userMapper.toDTO(userOpt.get());
            return ResponseEntity.ok(dto);
        }
        return ResponseEntity.notFound().build();
    }
}