package ma.enset.userservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ma.enset.userservice.enums.Role;

/**
 * DTO pour la réponse d'authentification
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {

    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private Long expiresIn;  // Durée en secondes

    // Informations de l'utilisateur
    private Long userId;
    private String username;
    private String email;
    private String nom;
    private String prenom;
    private Role role;
    private String telephone;

    // ✅ Workflow
    private String etat;
    private String motifRefus;

    // ✅ Directeur assigné
    private Long directeurId;

    // ✅ NOUVEAU : Sujet de thèse (assigné par le directeur)
    private String titreThese;

    // ✅ Suivi doctorant
    private Integer anneeThese;
    private Integer nbPublications;
    private Integer nbConferences;
    private Integer heuresFormation;

    private String message;
}