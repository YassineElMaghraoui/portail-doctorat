package ma.enset.soutenanceservice.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.enset.soutenanceservice.entities.MembreJury;
import ma.enset.soutenanceservice.entities.Soutenance;
import ma.enset.soutenanceservice.enums.StatutSoutenance;
import ma.enset.soutenanceservice.services.SoutenanceService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/soutenances")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class SoutenanceController {

    private final SoutenanceService soutenanceService;

    @PostMapping
    public ResponseEntity<Soutenance> createSoutenance(@Valid @RequestBody Soutenance soutenance) {
        log.info("REST request to create soutenance for doctorant: {}", soutenance.getDoctorantId());
        Soutenance created = soutenanceService.createSoutenance(soutenance);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping(value = "/soumettre", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Soutenance> soumettreDemande(
            @RequestParam("titre") String titre,
            @RequestParam("doctorantId") Long doctorantId,
            @RequestParam("directeurId") Long directeurId,
            @RequestPart("manuscrit") MultipartFile manuscrit,
            @RequestPart("rapportAntiPlagiat") MultipartFile rapportAntiPlagiat,
            @RequestPart(value = "autorisation", required = false) MultipartFile autorisation
    ) {
        log.info("REST request to submit soutenance request for doctorant: {}", doctorantId);
        try {
            Soutenance soumise = soutenanceService.soumettreDemande(titre, doctorantId, directeurId, manuscrit, rapportAntiPlagiat, autorisation);
            return ResponseEntity.status(HttpStatus.CREATED).body(soumise);
        } catch (RuntimeException e) {
            log.error("Error submitting soutenance request: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<Soutenance>> getAllSoutenances() {
        log.info("REST request to get all soutenances");
        List<Soutenance> soutenances = soutenanceService.getAllSoutenances();
        return ResponseEntity.ok(soutenances);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Soutenance> getSoutenanceById(@PathVariable Long id) {
        log.info("REST request to get soutenance by id: {}", id);
        return soutenanceService.getSoutenanceById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/doctorant/{doctorantId}")
    public ResponseEntity<List<Soutenance>> getSoutenancesByDoctorant(@PathVariable Long doctorantId) {
        log.info("REST request to get soutenances by doctorant: {}", doctorantId);
        List<Soutenance> soutenances = soutenanceService.getSoutenancesByDoctorant(doctorantId);
        return ResponseEntity.ok(soutenances);
    }

    @GetMapping("/directeur/{directeurId}")
    public ResponseEntity<List<Soutenance>> getSoutenancesByDirecteur(@PathVariable Long directeurId) {
        log.info("REST request to get soutenances by directeur: {}", directeurId);
        List<Soutenance> soutenances = soutenanceService.getSoutenancesByDirecteur(directeurId);
        return ResponseEntity.ok(soutenances);
    }

    @GetMapping("/statut/{statut}")
    public ResponseEntity<List<Soutenance>> getSoutenancesByStatut(@PathVariable StatutSoutenance statut) {
        log.info("REST request to get soutenances by statut: {}", statut);
        List<Soutenance> soutenances = soutenanceService.getSoutenancesByStatut(statut);
        return ResponseEntity.ok(soutenances);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Soutenance> updateSoutenance(@PathVariable Long id, @Valid @RequestBody Soutenance soutenance) {
        log.info("REST request to update soutenance with id: {}", id);
        try {
            Soutenance updated = soutenanceService.updateSoutenance(id, soutenance);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ========================================================
    // ✅ WORKFLOW DIRECTEUR - NOUVEAUX ENDPOINTS
    // ========================================================

    /**
     * ✅ Directeur valide les prérequis d'une soutenance
     * Change le statut de SOUMIS → PREREQUIS_VALIDES
     * Endpoint: PUT /api/soutenances/{id}/valider-prerequis
     */
    @PutMapping("/{id}/valider-prerequis")
    public ResponseEntity<?> validerPrerequisDirecteur(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> payload) {
        log.info("REST request to validate prerequis by directeur for soutenance: {}", id);
        try {
            String commentaire = (payload != null) ? payload.get("commentaire") : null;
            Soutenance validated = soutenanceService.validerPrerequisDirecteur(id, commentaire);
            return ResponseEntity.ok(validated);
        } catch (RuntimeException e) {
            log.error("Error validating prerequis: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * ✅ Directeur demande des corrections (rejet temporaire)
     * Change le statut → REJETEE avec commentaire dans commentaire_directeur
     * Endpoint: PUT /api/soutenances/{id}/rejeter-directeur
     */
    @PutMapping("/{id}/rejeter-directeur")
    public ResponseEntity<?> rejeterParDirecteur(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        log.info("REST request to reject soutenance by directeur: {}", id);
        try {
            String commentaire = payload.get("commentaire");
            if (commentaire == null || commentaire.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Le commentaire est obligatoire"));
            }
            Soutenance rejected = soutenanceService.rejeterParDirecteur(id, commentaire.trim());
            return ResponseEntity.ok(rejected);
        } catch (RuntimeException e) {
            log.error("Error rejecting by directeur: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========================================================
    // ANCIEN ENDPOINT (garde pour compatibilité mais renommé)
    // ========================================================

    /**
     * @deprecated Utiliser /valider-prerequis à la place
     * Cet endpoint vérifie automatiquement les prérequis depuis l'objet soutenance
     */
    @PutMapping("/{id}/verifier-prerequis")
    public ResponseEntity<?> verifierPrerequisEtSoumettre(@PathVariable Long id) {
        log.info("REST request to verify prerequis for soutenance: {}", id);
        try {
            Soutenance verified = soutenanceService.verifierPrerequisEtSoumettre(id);
            return ResponseEntity.ok(verified);
        } catch (RuntimeException e) {
            log.error("Error verifying prerequis: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========================================================
    // ENDPOINTS EXISTANTS
    // ========================================================

    @PostMapping("/{id}/jury")
    public ResponseEntity<Soutenance> ajouterMembreJury(@PathVariable Long id, @Valid @RequestBody MembreJury membreJury) {
        log.info("REST request to add jury member to soutenance: {}", id);
        try {
            Soutenance updated = soutenanceService.ajouterMembreJury(id, membreJury);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/proposer-jury")
    public ResponseEntity<Soutenance> proposerJury(@PathVariable Long id) {
        log.info("REST request to propose jury for soutenance: {}", id);
        try {
            Soutenance proposed = soutenanceService.proposerJury(id);
            return ResponseEntity.ok(proposed);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{soutenanceId}/jury/{membreJuryId}/rapport")
    public ResponseEntity<Soutenance> soumettreRapport(
            @PathVariable Long soutenanceId,
            @PathVariable Long membreJuryId,
            @RequestBody Map<String, Object> body) {
        log.info("REST request to submit rapport for rapporteur {} in soutenance {}", membreJuryId, soutenanceId);
        try {
            Boolean avisFavorable = (Boolean) body.get("avisFavorable");
            String commentaire = (String) body.get("commentaire");
            Soutenance updated = soutenanceService.soumettreRapportRapporteur(soutenanceId, membreJuryId, avisFavorable, commentaire);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/autoriser")
    public ResponseEntity<Soutenance> autoriserSoutenance(@PathVariable Long id, @RequestBody Map<String, String> body) {
        log.info("REST request to authorize soutenance: {}", id);
        try {
            String commentaire = body.get("commentaire");
            Soutenance authorized = soutenanceService.autoriserSoutenance(id, commentaire);
            return ResponseEntity.ok(authorized);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/planifier")
    public ResponseEntity<Soutenance> planifierSoutenance(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime heure,
            @RequestParam String lieu) {
        log.info("REST request to plan soutenance: {}", id);
        try {
            Soutenance planned = soutenanceService.planifierSoutenance(id, date, heure, lieu);
            return ResponseEntity.ok(planned);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/resultat")
    public ResponseEntity<Soutenance> enregistrerResultat(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        log.info("REST request to record result for soutenance: {}", id);
        try {
            Double note = ((Number) body.get("note")).doubleValue();
            String mention = (String) body.get("mention");
            Boolean felicitations = (Boolean) body.get("felicitations");
            Soutenance completed = soutenanceService.enregistrerResultat(id, note, mention, felicitations);
            return ResponseEntity.ok(completed);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/rejeter")
    public ResponseEntity<Soutenance> rejeterSoutenance(@PathVariable Long id, @RequestBody Map<String, String> body) {
        log.info("REST request to reject soutenance: {}", id);
        try {
            String motif = body.get("motif");
            Soutenance rejected = soutenanceService.rejeterSoutenance(id, motif);
            return ResponseEntity.ok(rejected);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSoutenance(@PathVariable Long id) {
        log.info("REST request to delete soutenance with id: {}", id);
        soutenanceService.deleteSoutenance(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("Soutenance Service is running!");
    }
}