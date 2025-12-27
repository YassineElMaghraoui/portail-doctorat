package ma.enset.userservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO pour représenter un utilisateur
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {

    private Long id;
    private String username;  // Matricule
    private String email;
    private String nom;
    private String prenom;
    private String telephone;
    private String role;
    private Boolean enabled;  // ✅ Ajouté

    // Documents
    private String cv;
    private String diplome;
    private String lettreMotivation;

    // Workflow
    private String etat;
    private String motifRefus;

    // Directeur assigné
    private Long directeurId;

    // ✅ Sujet de thèse (assigné par le directeur)
    private String titreThese;

    // Suivi doctorant
    private String dateInscription;
    private Integer anneeThese;
    private Integer nbPublications;
    private Integer nbConferences;
    private Integer heuresFormation;

    // Timestamps
    private String createdAt;
    private String updatedAt;
}