package ma.enset.documentservice.repositories;

import ma.enset.documentservice.entities.UploadedDocument;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UploadedDocumentRepository extends JpaRepository<UploadedDocument, Long> {
}