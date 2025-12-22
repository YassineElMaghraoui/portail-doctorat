package ma.enset.userservice.repositories;

import ma.enset.userservice.entities.User;
import ma.enset.userservice.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // ✅ MODIFICATION : Recherche par Matricule
    Optional<User> findByMatricule(String matricule);

    // Garde la compatibilité avec Spring Security qui cherche "username"
    default Optional<User> findByUsername(String username) {
        return findByMatricule(username);
    }

    Optional<User> findByEmail(String email);

    // ✅ MODIFICATION
    boolean existsByMatricule(String matricule);

    boolean existsByEmail(String email);

    List<User> findByRole(Role role);

    List<User> findByEnabledTrue();

    List<User> findByRoleAndEnabledTrue(Role role);
}