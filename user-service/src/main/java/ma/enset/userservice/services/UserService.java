package ma.enset.userservice.services;

import ma.enset.userservice.entities.User;
import ma.enset.userservice.enums.Role;

import java.util.List;
import java.util.Optional;

public interface UserService {

    User createUser(User user);

    User updateUser(Long id, User user);

    void deleteUser(Long id);

    Optional<User> getUserById(Long id);

    Optional<User> getUserByUsername(String username);

    Optional<User> getUserByEmail(String email);

    List<User> getAllUsers();

    List<User> getUsersByRole(Role role);

    // ✅ C'EST CETTE LIGNE QUI MANQUAIT :
    User changeRole(Long id, Role newRole);
}