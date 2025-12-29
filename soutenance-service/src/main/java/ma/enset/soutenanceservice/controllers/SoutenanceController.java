package ma.enset.soutenanceservice.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.enset.soutenanceservice.entities.JuryDisponible;
import ma.enset.soutenanceservice.entities.MembreJury;
import ma.enset.soutenanceservice.entities.Soutenance;
import ma.enset.soutenanceservice.enums.RoleJury;
import ma.enset.soutenanceservice.enums.StatutSoutenance;
import ma.enset.soutenanceservice.services.SoutenanceService;
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

    // --- CRUD ---
    @PostMapping
    public ResponseEntity<Soutenance> createSoutenance(@Valid @RequestBody Soutenance soutenance) {
        return ResponseEntity.status(HttpStatus.CREATED).body(soutenanceService.createSoutenance(soutenance));
    }

    @PostMapping(value = "/soumettre", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> soumettreDemande(
            @RequestParam("titre") String titre, @RequestParam("doctorantId") Long doctorantId,
            @RequestParam("directeurId") Long directeurId, @RequestPart("manuscrit") MultipartFile manuscrit,
            @RequestPart("rapportAntiPlagiat") MultipartFile rapportAntiPlagiat, @RequestPart(value = "autorisation", required = false) MultipartFile autorisation) {
        try {
            return ResponseEntity.status(HttpStatus.CREATED).body(soutenanceService.soumettreDemande(titre, doctorantId, directeurId, manuscrit, rapportAntiPlagiat, autorisation));
        } catch (RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @GetMapping public ResponseEntity<List<Soutenance>> getAllSoutenances() { return ResponseEntity.ok(soutenanceService.getAllSoutenances()); }
    @GetMapping("/{id}") public ResponseEntity<Soutenance> getById(@PathVariable Long id) { return soutenanceService.getSoutenanceById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build()); }
    @GetMapping("/doctorant/{id}") public ResponseEntity<List<Soutenance>> getByDoctorant(@PathVariable Long id) { return ResponseEntity.ok(soutenanceService.getSoutenancesByDoctorant(id)); }
    @GetMapping("/directeur/{id}") public ResponseEntity<List<Soutenance>> getByDirecteur(@PathVariable Long id) { return ResponseEntity.ok(soutenanceService.getSoutenancesByDirecteur(id)); }

    // --- WORKFLOW ---

    // 1. DIRECTEUR : Valide prérequis -> PREREQUIS_VALIDES
    @PutMapping("/{id}/valider-prerequis")
    public ResponseEntity<?> validerPrerequis(@PathVariable Long id, @RequestBody(required = false) Map<String, String> payload) {
        try {
            String comm = (payload != null) ? payload.get("commentaire") : null;
            return ResponseEntity.ok(soutenanceService.validerPrerequisDirecteur(id, comm));
        } catch (RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @PutMapping("/{id}/rejeter-directeur")
    public ResponseEntity<?> rejeterDirecteur(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(soutenanceService.rejeterParDirecteur(id, payload.get("commentaire")));
    }

    // 2. ADMIN : Autorise -> AUTORISEE
    @PutMapping("/{id}/autoriser")
    public ResponseEntity<?> autoriserDemande(@PathVariable Long id, @RequestBody(required = false) Map<String, String> payload) {
        try {
            String comm = (payload != null) ? payload.get("commentaire") : null;
            return ResponseEntity.ok(soutenanceService.autoriserDemande(id, comm));
        } catch (RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    // 3. DIRECTEUR : Propose Jury -> JURY_PROPOSE
    @PutMapping("/{id}/proposer-jury")
    public ResponseEntity<?> proposerJury(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(soutenanceService.proposerJury(id));
        } catch (RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @PostMapping("/{id}/jury")
    public ResponseEntity<?> ajouterMembreJury(@PathVariable Long id, @Valid @RequestBody MembreJury membre) {
        try { return ResponseEntity.ok(soutenanceService.ajouterMembreJury(id, membre)); } catch (RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @GetMapping("/jury/disponibles/{role}")
    public ResponseEntity<?> getJurysByRole(@PathVariable String role) {
        try { return ResponseEntity.ok(soutenanceService.getJurysDisponiblesByRole(RoleJury.valueOf(role.toUpperCase()))); } catch (Exception e) { return ResponseEntity.badRequest().build(); }
    }

    // 4. ADMIN : Valide Jury + Planifie -> PLANIFIEE
    @PutMapping("/{id}/valider-jury")
    public ResponseEntity<?> validerJury(@PathVariable Long id, @RequestBody(required = false) Map<String, String> payload) {
        try { return ResponseEntity.ok(soutenanceService.validerJury(id, payload != null ? payload.get("commentaire") : null)); } catch (RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @PutMapping("/{id}/refuser-jury")
    public ResponseEntity<?> refuserJury(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        return ResponseEntity.ok(soutenanceService.refuserJury(id, payload.get("commentaire")));
    }

    @PutMapping("/{id}/planifier")
    public ResponseEntity<?> planifier(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            LocalDate date = LocalDate.parse((String) payload.get("dateSoutenance"));
            LocalTime heure = LocalTime.parse((String) payload.get("heureSoutenance"));
            String lieu = (String) payload.get("lieuSoutenance");
            return ResponseEntity.ok(soutenanceService.planifierSoutenance(id, date, heure, lieu));
        } catch (RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    // 5. RESULTAT
    @PutMapping("/{id}/resultat")
    public ResponseEntity<?> enregistrerResultat(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            Double note = body.get("note") != null ? ((Number) body.get("note")).doubleValue() : null;
            return ResponseEntity.ok(soutenanceService.enregistrerResultat(id, note, (String) body.get("mention"), (Boolean) body.get("felicitations")));
        } catch (RuntimeException e) { return ResponseEntity.badRequest().body(Map.of("error", e.getMessage())); }
    }

    @PutMapping("/{id}/rejeter")
    public ResponseEntity<?> rejeterGlobal(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(soutenanceService.rejeterSoutenance(id, body.get("motif")));
    }
}