package ma.enset.documentservice.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class UploadedDocument {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nomFichier;    // Ex: cv.pdf
    private String typeFichier;   // Ex: application/pdf

    // Stockage binaire direct (BLOB) pour faire simple
    @Lob
    @Column(length = 10000000) // Pour autoriser les gros fichiers
    private byte[] data;

    private LocalDateTime dateUpload;

    @PrePersist
    protected void onCreate() {
        this.dateUpload = LocalDateTime.now();
    }
}