package ma.enset.inscriptionservice.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import ma.enset.inscriptionservice.enums.StatutInscription;
import ma.enset.inscriptionservice.enums.TypeInscription;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "inscriptions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Inscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // L'ID du doctorant est obligatoire (c'est lui qui crée le dossier)
    @NotNull(message = "L'ID du doctorant est obligatoire")
    @Column(name = "doctorant_id", nullable = false)
    private Long doctorantId;

    // ✅ CORRECTION : Pas de @NotNull ici.
    // Ce champ est optionnel à la création. L'Admin l'assignera plus tard.
    @Column(name = "directeur_id")
    private Long directeurId;

    @NotNull(message = "La campagne est obligatoire")
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "campagne_id", nullable = false)
    private Campagne campagne;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeInscription typeInscription;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutInscription statut = StatutInscription.BROUILLON;

    @NotBlank(message = "Le sujet de thèse est obligatoire")
    @Column(name = "sujet_these", nullable = false, length = 500)
    private String sujetThese;

    @Column(name = "laboratoire_accueil")
    private String laboratoireAccueil;

    @Column(name = "collaboration_externe")
    private String collaborationExterne;

    @Column(name = "annee_inscription")
    private Integer anneeInscription;

    @Column(name = "date_premiere_inscription")
    private LocalDate datePremiereInscription;

    // Relation avec les documents (CV, Diplômes, etc.)
    @OneToMany(mappedBy = "inscription", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Document> documents = new ArrayList<>();

    // Commentaires pour le workflow de validation
    @Column(name = "commentaire_directeur", length = 1000)
    private String commentaireDirecteur;

    @Column(name = "commentaire_admin", length = 1000)
    private String commentaireAdmin;

    @Column(name = "date_validation_directeur")
    private LocalDateTime dateValidationDirecteur;

    @Column(name = "date_validation_admin")
    private LocalDateTime dateValidationAdmin;

    // Champs d'audit
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Méthode utilitaire pour ajouter un document et maintenir la relation bidirectionnelle
    public void addDocument(Document doc) {
        documents.add(doc);
        doc.setInscription(this);
    }
}