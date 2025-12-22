package ma.enset.documentservice.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.enset.documentservice.dto.*;
import ma.enset.documentservice.entities.GeneratedDocument;
import ma.enset.documentservice.entities.UploadedDocument; // ✅ AJOUT
import ma.enset.documentservice.enums.DocumentType;
import ma.enset.documentservice.repositories.DocumentRepository;
import ma.enset.documentservice.repositories.UploadedDocumentRepository; // ✅ AJOUT
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile; // ✅ AJOUT

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    private final PdfGeneratorService pdfGeneratorService;
    private final DocumentRepository documentRepository;
    private final UploadedDocumentRepository uploadedDocumentRepository; // ✅ AJOUT
    private final ObjectMapper objectMapper;

    @Value("${app.documents.storage-path:./documents}")
    private String storagePath;

    @Value("${app.documents.base-url:http://localhost:8085/api/documents}")
    private String baseUrl;

    // =========================================================================
    // ==================== 📂 GESTION DE L'UPLOAD =============================
    // =========================================================================

    /**
     * Uploader un fichier (CV, Diplôme...)
     */
    @Transactional
    public UploadedDocument uploadFile(MultipartFile file) throws IOException {
        log.info("Upload fichier: {} ({} bytes)", file.getOriginalFilename(), file.getSize());

        UploadedDocument doc = UploadedDocument.builder()
                .nomFichier(file.getOriginalFilename())
                .typeFichier(file.getContentType())
                .data(file.getBytes()) // Stockage BDD pour simplifier (BLOB)
                .build();

        return uploadedDocumentRepository.save(doc);
    }

    /**
     * Récupérer un fichier uploadé par ID
     */
    public Optional<UploadedDocument> getUploadedFile(Long id) {
        return uploadedDocumentRepository.findById(id);
    }

    // =========================================================================
    // ==================== 📄 GÉNÉRATION DE PDF ===============================
    // =========================================================================

    /**
     * Génère et sauvegarde une attestation d'inscription
     */
    @Transactional
    public DocumentResponse generateAttestationInscription(AttestationInscriptionRequest request) {
        log.info("Génération attestation d'inscription - Inscription ID: {}", request.getInscriptionId());

        try {
            // Générer le PDF
            byte[] pdfBytes = pdfGeneratorService.generateAttestationInscription(request);

            // Sauvegarder le fichier
            String fileName = String.format("attestation_inscription_%d_%s_%s.pdf",
                    request.getInscriptionId(),
                    request.getNomDoctorant().toLowerCase(),
                    System.currentTimeMillis());

            String filePath = saveFile(pdfBytes, fileName);

            // Enregistrer en base
            GeneratedDocument document = GeneratedDocument.builder()
                    .documentType(DocumentType.ATTESTATION_INSCRIPTION)
                    .fileName(fileName)
                    .filePath(filePath)
                    .referenceId(request.getInscriptionId())
                    .referenceType("INSCRIPTION")
                    .userId(request.getDoctorantId())
                    .userName(request.getPrenomDoctorant() + " " + request.getNomDoctorant())
                    .userEmail(request.getEmail())
                    .fileSize((long) pdfBytes.length)
                    .metadata(serializeMetadata(request))
                    .build();

            document = documentRepository.save(document);

            log.info("Attestation d'inscription générée avec succès - ID: {}", document.getId());

            return DocumentResponse.builder()
                    .id(document.getId())
                    .documentType(DocumentType.ATTESTATION_INSCRIPTION)
                    .fileName(fileName)
                    .downloadUrl(baseUrl + "/download/" + document.getId())
                    .fileSize(document.getFileSize())
                    .generatedAt(document.getGeneratedAt())
                    .isValid(true)
                    .message("Attestation d'inscription générée avec succès")
                    .build();

        } catch (Exception e) {
            log.error("Erreur lors de la génération de l'attestation d'inscription: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur lors de la génération du document", e);
        }
    }

    /**
     * Génère et sauvegarde une autorisation de soutenance
     */
    @Transactional
    public DocumentResponse generateAutorisationSoutenance(AutorisationSoutenanceRequest request) {
        log.info("Génération autorisation de soutenance - Soutenance ID: {}", request.getSoutenanceId());

        try {
            byte[] pdfBytes = pdfGeneratorService.generateAutorisationSoutenance(request);

            String fileName = String.format("autorisation_soutenance_%d_%s_%s.pdf",
                    request.getSoutenanceId(),
                    request.getNomDoctorant().toLowerCase(),
                    System.currentTimeMillis());

            String filePath = saveFile(pdfBytes, fileName);

            GeneratedDocument document = GeneratedDocument.builder()
                    .documentType(DocumentType.AUTORISATION_SOUTENANCE)
                    .fileName(fileName)
                    .filePath(filePath)
                    .referenceId(request.getSoutenanceId())
                    .referenceType("SOUTENANCE")
                    .userId(request.getDoctorantId())
                    .userName(request.getPrenomDoctorant() + " " + request.getNomDoctorant())
                    .userEmail(request.getEmail())
                    .fileSize((long) pdfBytes.length)
                    .metadata(serializeMetadata(request))
                    .build();

            document = documentRepository.save(document);

            log.info("Autorisation de soutenance générée avec succès - ID: {}", document.getId());

            return DocumentResponse.builder()
                    .id(document.getId())
                    .documentType(DocumentType.AUTORISATION_SOUTENANCE)
                    .fileName(fileName)
                    .downloadUrl(baseUrl + "/download/" + document.getId())
                    .fileSize(document.getFileSize())
                    .generatedAt(document.getGeneratedAt())
                    .isValid(true)
                    .message("Autorisation de soutenance générée avec succès")
                    .build();

        } catch (Exception e) {
            log.error("Erreur lors de la génération de l'autorisation de soutenance: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur lors de la génération du document", e);
        }
    }

    /**
     * Génère et sauvegarde un procès-verbal de soutenance
     */
    @Transactional
    public DocumentResponse generateProcesVerbal(ProcesVerbalRequest request) {
        log.info("Génération PV de soutenance - Soutenance ID: {}", request.getSoutenanceId());

        try {
            byte[] pdfBytes = pdfGeneratorService.generateProcesVerbal(request);

            String fileName = String.format("pv_soutenance_%d_%s_%s.pdf",
                    request.getSoutenanceId(),
                    request.getNomDoctorant().toLowerCase(),
                    System.currentTimeMillis());

            String filePath = saveFile(pdfBytes, fileName);

            GeneratedDocument document = GeneratedDocument.builder()
                    .documentType(DocumentType.PROCES_VERBAL_SOUTENANCE)
                    .fileName(fileName)
                    .filePath(filePath)
                    .referenceId(request.getSoutenanceId())
                    .referenceType("SOUTENANCE")
                    .userId(request.getDoctorantId())
                    .userName(request.getPrenomDoctorant() + " " + request.getNomDoctorant())
                    .userEmail(request.getEmail())
                    .fileSize((long) pdfBytes.length)
                    .metadata(serializeMetadata(request))
                    .build();

            document = documentRepository.save(document);

            log.info("Procès-verbal de soutenance généré avec succès - ID: {}", document.getId());

            return DocumentResponse.builder()
                    .id(document.getId())
                    .documentType(DocumentType.PROCES_VERBAL_SOUTENANCE)
                    .fileName(fileName)
                    .downloadUrl(baseUrl + "/download/" + document.getId())
                    .fileSize(document.getFileSize())
                    .generatedAt(document.getGeneratedAt())
                    .isValid(true)
                    .message("Procès-verbal de soutenance généré avec succès")
                    .build();

        } catch (Exception e) {
            log.error("Erreur lors de la génération du PV de soutenance: {}", e.getMessage(), e);
            throw new RuntimeException("Erreur lors de la génération du document", e);
        }
    }

    /**
     * Récupère un document généré par son ID
     */
    public Optional<GeneratedDocument> getDocumentById(Long id) {
        return documentRepository.findById(id);
    }

    /**
     * Récupère le contenu binaire d'un document généré
     */
    public byte[] getDocumentContent(Long id) throws IOException {
        GeneratedDocument document = documentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Document non trouvé"));

        Path path = Paths.get(document.getFilePath());
        if (!Files.exists(path)) {
            throw new RuntimeException("Fichier non trouvé sur le disque");
        }

        // Incrémenter le compteur de téléchargement
        document.setDownloadCount(document.getDownloadCount() + 1);
        document.setDownloadedAt(LocalDateTime.now());
        documentRepository.save(document);

        return Files.readAllBytes(path);
    }

    /**
     * Récupère les documents d'un utilisateur
     */
    public List<GeneratedDocument> getDocumentsByUser(Long userId) {
        return documentRepository.findByUserId(userId);
    }

    /**
     * Récupère les documents par type
     */
    public List<GeneratedDocument> getDocumentsByType(DocumentType type) {
        return documentRepository.findByDocumentType(type);
    }

    /**
     * Récupère les documents par référence
     */
    public List<GeneratedDocument> getDocumentsByReference(Long referenceId, String referenceType) {
        return documentRepository.findByReferenceIdAndReferenceType(referenceId, referenceType);
    }

    /**
     * Statistiques des documents
     */
    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalDocuments", documentRepository.count());
        stats.put("attestationsInscription", documentRepository.countByDocumentType(DocumentType.ATTESTATION_INSCRIPTION));
        stats.put("autorisationsSoutenance", documentRepository.countByDocumentType(DocumentType.AUTORISATION_SOUTENANCE));
        stats.put("procesVerbaux", documentRepository.countByDocumentType(DocumentType.PROCES_VERBAL_SOUTENANCE));
        stats.put("documentsToday", documentRepository.countByGeneratedAtAfter(LocalDateTime.now().toLocalDate().atStartOfDay()));
        return stats;
    }

    // ==================== MÉTHODES PRIVÉES ====================

    private String saveFile(byte[] content, String fileName) throws IOException {
        Path directory = Paths.get(storagePath);
        if (!Files.exists(directory)) {
            Files.createDirectories(directory);
        }

        Path filePath = directory.resolve(fileName);
        Files.write(filePath, content);

        return filePath.toString();
    }

    private String serializeMetadata(Object request) {
        try {
            return objectMapper.writeValueAsString(request);
        } catch (Exception e) {
            log.warn("Impossible de sérialiser les métadonnées: {}", e.getMessage());
            return null;
        }
    }
}