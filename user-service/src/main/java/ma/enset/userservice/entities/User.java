package ma.enset.userservice.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import ma.enset.userservice.enums.Role;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le matricule est obligatoire")
    @Column(name = "matricule", unique = true, nullable = false)
    private String matricule;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @Column(nullable = false)
    private String password;

    @Email(message = "Email invalide")
    @NotBlank(message = "L'email est obligatoire")
    @Column(unique = true, nullable = false)
    private String email;

    @NotBlank(message = "Le nom est obligatoire")
    @Column(nullable = false)
    private String nom;

    @NotBlank(message = "Le prénom est obligatoire")
    @Column(nullable = false)
    private String prenom;

    @Column(name = "telephone")
    private String telephone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(nullable = false)
    private Boolean enabled = true;

    // =============================================================
    // DOCUMENTS
    // =============================================================
    private String cv;
    private String diplome;
    private String lettreMotivation;

    // =============================================================
    // WORKFLOW
    // =============================================================
    @Column(name = "etat_candidature")
    private String etat = "EN_ATTENTE_ADMIN";

    @Column(columnDefinition = "TEXT")
    private String motifRefus;

    // ✅ Directeur de thèse assigné
    @Column(name = "directeur_id")
    private Long directeurId;

    // =============================================================
    // ✅ NOUVEAU : SUJET DE THÈSE (assigné par le directeur)
    // =============================================================
    @Column(name = "titre_these", columnDefinition = "TEXT")
    private String titreThese;

    // =============================================================
    // SUIVI DOCTORANT (Selon CDC)
    // =============================================================
    @Column(name = "date_inscription")
    private LocalDateTime dateInscription;

    @Column(name = "annee_these")
    private Integer anneeThese = 1;

    @Column(name = "nb_publications")
    private Integer nbPublications = 0;

    @Column(name = "nb_conferences")
    private Integer nbConferences = 0;

    @Column(name = "heures_formation")
    private Integer heuresFormation = 0;

    // =============================================================
    // TIMESTAMPS
    // =============================================================
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // =============================================================
    // USER DETAILS IMPLEMENTATION
    // =============================================================
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getUsername() {
        return this.matricule;
    }

    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return this.enabled; }

    // =============================================================
    // LIFECYCLE
    // =============================================================
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (this.etat == null) {
            this.etat = "EN_ATTENTE_ADMIN";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}