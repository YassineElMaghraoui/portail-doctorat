package ma.enset.inscriptionservice.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import ma.enset.inscriptionservice.enums.StatutDerogation;
import ma.enset.inscriptionservice.enums.TypeDerogation;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "derogations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Derogation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "L'ID du doctorant est obligatoire")
    @Column(name = "doctorant_id", nullable = false)
    private Long doctorantId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inscription_id")
    private Inscription inscription;

    @NotNull(message = "Le type de dérogation est obligatoire")
    @Enumerated(EnumType.STRING)
    @Column(name = "type_derogation", nullable = false)
    private TypeDerogation typeDerogation;

    // ✅ CORRECTION ICI : @Builder.Default force Lombok à garder cette valeur par défaut
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutDerogation statut = StatutDerogation.EN_ATTENTE;

    @NotBlank(message = "Le motif est obligatoire")
    @Column(nullable = false, length = 2000)
    private String motif;

    @Column(name = "annee_demandee")
    private Integer anneeDemandee;

    @Column(name = "date_demande", nullable = false)
    private LocalDateTime dateDemande;

    @Column(name = "date_decision")
    private LocalDateTime dateDecision;

    @Column(name = "decide_par")
    private Long decideParId;

    @Column(name = "commentaire_decision", length = 1000)
    private String commentaireDecision;

    @Column(name = "date_expiration")
    private LocalDate dateExpiration;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (dateDemande == null) {
            dateDemande = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public boolean estValide() {
        if (statut != StatutDerogation.APPROUVEE) {
            return false;
        }
        if (dateExpiration == null) {
            return true;
        }
        return LocalDate.now().isBefore(dateExpiration) || LocalDate.now().isEqual(dateExpiration);
    }

    public boolean estEnAttente() {
        return statut == StatutDerogation.EN_ATTENTE;
    }
}