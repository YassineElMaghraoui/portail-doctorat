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
@CrossOrigin(origins = "*") // C'est bien présent ici
public class SoutenanceController {

    private final SoutenanceService soutenanceService;

    // ... (CRUD de base inchangé) ...

    @PostMapping
    public ResponseEntity<Soutenance> createSoutenance(@Valid @RequestBody Soutenance soutenance) {
        Soutenance created = soutenanceService.createSoutenance(soutenance);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping(value = "/soumettre", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> soumettreDemande(
            @RequestParam("titre") String titre,
            @RequestParam("doctorantId") Long doctorantId,
            @RequestParam("directeurId") Long directeurId,
            @RequestPart("manuscrit") MultipartFile manuscrit,
            @RequestPart("rapportAntiPlagiat") MultipartFile rapportAntiPlagiat,
            @RequestPart(value = "autorisation", required = false) MultipartFile autorisation) {
        try {
            Soutenance soumise = soutenanceService.soumettreDemande(titre, doctorantId, directeurId, manuscrit, rapportAntiPlagiat, autorisation);
            return ResponseEntity.status(HttpStatus.CREATED).body(soumise);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<Soutenance>> getAllSoutenances() {
        return ResponseEntity.ok(soutenanceService.getAllSoutenances());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Soutenance> getSoutenanceById(@PathVariable Long id) {
        return soutenanceService.getSoutenanceById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/doctorant/{doctorantId}")
    public ResponseEntity<List<Soutenance>> getSoutenancesByDoctorant(@PathVariable Long doctorantId) {
        return ResponseEntity.ok(soutenanceService.getSoutenancesByDoctorant(doctorantId));
    }

    @GetMapping("/directeur/{directeurId}")
    public ResponseEntity<List<Soutenance>> getSoutenancesByDirecteur(@PathVariable Long directeurId) {
        return ResponseEntity.ok(soutenanceService.getSoutenancesByDirecteur(directeurId));
    }

    @GetMapping("/statut/{statut}")
    public ResponseEntity<List<Soutenance>> getSoutenancesByStatut(@PathVariable StatutSoutenance statut) {
        return ResponseEntity.ok(soutenanceService.getSoutenancesByStatut(statut));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Soutenance> updateSoutenance(@PathVariable Long id, @Valid @RequestBody Soutenance soutenance) {
        try {
            return ResponseEntity.ok(soutenanceService.updateSoutenance(id, soutenance));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSoutenance(@PathVariable Long id) {
        soutenanceService.deleteSoutenance(id);
        return ResponseEntity.noContent().build();
    }

    // ========================================================
    // ÉTAPE 1: DIRECTEUR - Valide les prérequis
    // ========================================================

    @PutMapping("/{id}/valider-prerequis")
    public ResponseEntity<?> validerPrerequisDirecteur(@PathVariable Long id, @RequestBody(required = false) Map<String, String> payload) {
        try {
            String commentaire = (payload != null) ? payload.get("commentaire") : null;
            return ResponseEntity.ok(soutenanceService.validerPrerequisDirecteur(id, commentaire));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/rejeter-directeur")
    public ResponseEntity<?> rejeterParDirecteur(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        try {
            String commentaire = payload.get("commentaire");
            return ResponseEntity.ok(soutenanceService.rejeterParDirecteur(id, commentaire));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========================================================
    // ✅ ÉTAPE 2 MANQUANTE : ADMIN - Autorise la soutenance
    // ========================================================

    @PutMapping("/{id}/autoriser")
    public ResponseEntity<?> autoriserSoutenance(@PathVariable Long id, @RequestBody(required = false) Map<String, String> payload) {
        try {
            // Récupérer le commentaire s'il existe, sinon null
            String commentaire = (payload != null) ? payload.get("commentaire") : null;

            // Appel au service (assurez-vous que la méthode existe dans SoutenanceService)
            return ResponseEntity.ok(soutenanceService.autoriserSoutenance(id, commentaire));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ========================================================
    // JURYS DISPONIBLES
    // ========================================================

    @GetMapping("/jury/disponibles")
    public ResponseEntity<List<JuryDisponible>> getJurysDisponibles() {
        return ResponseEntity.ok(soutenanceService.getJurysDisponibles());
    }

    @GetMapping("/jury/disponibles/{role}")
    public ResponseEntity<?> getJurysDisponiblesByRole(@PathVariable String role) {
        try {
            RoleJury roleJury = RoleJury.valueOf(role.toUpperCase());
            return ResponseEntity.ok(soutenanceService.getJurysDisponiblesByRole(roleJury));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Rôle invalide"));
        }
    }

    @GetMapping("/jury/disponibles/id/{id}")
    public ResponseEntity<?> getJuryDisponibleById(@PathVariable Long id) {
        return soutenanceService.getJuryDisponibleById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ... (Le reste de votre fichier : jury, planification, etc. est correct) ...
    // Assurez-vous simplement d'avoir collé la méthode `autoriserSoutenance` ci-dessus.

    // (Je remets les méthodes suivantes pour la cohérence du fichier)
    @PostMapping("/{id}/jury")
    public ResponseEntity<?> ajouterMembreJury(@PathVariable Long id, @Valid @RequestBody MembreJury membreJury) {
        try {
            return ResponseEntity.ok(soutenanceService.ajouterMembreJury(id, membreJury));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/jury")
    public ResponseEntity<?> getMembresJury(@PathVariable Long id) {
        return soutenanceService.getSoutenanceById(id)
                .map(s -> ResponseEntity.ok(s.getMembresJury()))
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{soutenanceId}/jury/{membreId}")
    public ResponseEntity<?> supprimerMembreJury(@PathVariable Long soutenanceId, @PathVariable Long membreId) {
        try {
            return ResponseEntity.ok(soutenanceService.supprimerMembreJury(soutenanceId, membreId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/proposer-jury")
    public ResponseEntity<?> proposerJury(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(soutenanceService.proposerJury(id));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/valider-jury")
    public ResponseEntity<?> validerJury(@PathVariable Long id, @RequestBody(required = false) Map<String, String> payload) {
        try {
            String commentaire = (payload != null) ? payload.get("commentaire") : null;
            return ResponseEntity.ok(soutenanceService.validerJury(id, commentaire));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/refuser-jury")
    public ResponseEntity<?> refuserJury(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        try {
            String commentaire = payload.get("commentaire");
            return ResponseEntity.ok(soutenanceService.refuserJury(id, commentaire));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/proposer-date")
    public ResponseEntity<?> proposerDateSoutenance(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            String dateStr = (String) payload.get("dateSoutenance");
            String heureStr = (String) payload.get("heureSoutenance");
            String lieu = (String) payload.get("lieuSoutenance");
            LocalDate date = LocalDate.parse(dateStr);
            LocalTime heure = (heureStr != null && !heureStr.isEmpty()) ? LocalTime.parse(heureStr) : null;
            return ResponseEntity.ok(soutenanceService.proposerDateSoutenance(id, date, heure, lieu));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/planifier")
    public ResponseEntity<?> planifierSoutenance(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            String dateStr = (String) payload.get("dateSoutenance");
            String heureStr = (String) payload.get("heureSoutenance");
            String lieu = (String) payload.get("lieuSoutenance");
            LocalDate date = LocalDate.parse(dateStr);
            LocalTime heure = (heureStr != null && !heureStr.isEmpty()) ? LocalTime.parse(heureStr) : LocalTime.of(9, 0);
            return ResponseEntity.ok(soutenanceService.planifierSoutenance(id, date, heure, lieu));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/refuser-planification")
    public ResponseEntity<?> refuserPlanification(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        try {
            String commentaire = payload.get("commentaire");
            return ResponseEntity.ok(soutenanceService.refuserPlanification(id, commentaire));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/resultat")
    public ResponseEntity<?> enregistrerResultat(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            Double note = body.get("note") != null ? ((Number) body.get("note")).doubleValue() : null;
            String mention = (String) body.get("mention");
            Boolean felicitations = (Boolean) body.get("felicitations");
            return ResponseEntity.ok(soutenanceService.enregistrerResultat(id, note, mention, felicitations));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/rejeter")
    public ResponseEntity<?> rejeterSoutenance(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(soutenanceService.rejeterSoutenance(id, body.get("motif")));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{soutenanceId}/jury/{membreJuryId}/rapport")
    public ResponseEntity<?> soumettreRapport(@PathVariable Long soutenanceId, @PathVariable Long membreJuryId, @RequestBody Map<String, Object> body) {
        try {
            Boolean avisFavorable = (Boolean) body.get("avisFavorable");
            String commentaire = (String) body.get("commentaire");
            return ResponseEntity.ok(soutenanceService.soumettreRapportRapporteur(soutenanceId, membreJuryId, avisFavorable, commentaire));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("Soutenance Service is running!");
    }
}