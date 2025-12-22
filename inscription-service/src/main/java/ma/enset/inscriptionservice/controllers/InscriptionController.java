package ma.enset.inscriptionservice.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.enset.inscriptionservice.entities.Inscription;
import ma.enset.inscriptionservice.enums.StatutInscription;
import ma.enset.inscriptionservice.services.InscriptionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inscriptions")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class InscriptionController {

    private final InscriptionService inscriptionService;

    @PostMapping
    public ResponseEntity<Inscription> createInscription(@Valid @RequestBody Inscription inscription) {
        log.info("REST request to create inscription for doctorant: {}", inscription.getDoctorantId());
        Inscription created = inscriptionService.createInscription(inscription);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    public ResponseEntity<List<Inscription>> getAllInscriptions() {
        log.info("REST request to get all inscriptions");
        List<Inscription> inscriptions = inscriptionService.getAllInscriptions();
        return ResponseEntity.ok(inscriptions);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Inscription> getInscriptionById(@PathVariable Long id) {
        log.info("REST request to get inscription by id: {}", id);
        return inscriptionService.getInscriptionById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/doctorant/{doctorantId}")
    public ResponseEntity<List<Inscription>> getInscriptionsByDoctorant(@PathVariable Long doctorantId) {
        log.info("REST request to get inscriptions by doctorant: {}", doctorantId);
        List<Inscription> inscriptions = inscriptionService.getInscriptionsByDoctorant(doctorantId);
        return ResponseEntity.ok(inscriptions);
    }

    @GetMapping("/directeur/{directeurId}")
    public ResponseEntity<List<Inscription>> getInscriptionsByDirecteur(@PathVariable Long directeurId) {
        log.info("REST request to get inscriptions by directeur: {}", directeurId);
        List<Inscription> inscriptions = inscriptionService.getInscriptionsByDirecteur(directeurId);
        return ResponseEntity.ok(inscriptions);
    }

    @GetMapping("/statut/{statut}")
    public ResponseEntity<List<Inscription>> getInscriptionsByStatut(@PathVariable StatutInscription statut) {
        log.info("REST request to get inscriptions by statut: {}", statut);
        List<Inscription> inscriptions = inscriptionService.getInscriptionsByStatut(statut);
        return ResponseEntity.ok(inscriptions);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Inscription> updateInscription(@PathVariable Long id, @Valid @RequestBody Inscription inscription) {
        log.info("REST request to update inscription with id: {}", id);
        try {
            Inscription updated = inscriptionService.updateInscription(id, inscription);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/valider-directeur")
    public ResponseEntity<Inscription> validerParDirecteur(@PathVariable Long id, @RequestBody Map<String, String> body) {
        log.info("REST request to validate inscription {} by directeur", id);
        try {
            String commentaire = body.get("commentaire");
            Inscription validated = inscriptionService.validerParDirecteur(id, commentaire);
            return ResponseEntity.ok(validated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/valider-admin")
    public ResponseEntity<Inscription> validerParAdmin(@PathVariable Long id, @RequestBody Map<String, String> body) {
        log.info("REST request to validate inscription {} by admin", id);
        try {
            String commentaire = body.get("commentaire");
            Inscription validated = inscriptionService.validerParAdmin(id, commentaire);
            return ResponseEntity.ok(validated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/rejeter-directeur")
    public ResponseEntity<Inscription> rejeterParDirecteur(@PathVariable Long id, @RequestBody Map<String, String> body) {
        log.info("REST request to reject inscription {} by directeur", id);
        try {
            String commentaire = body.get("commentaire");
            Inscription rejected = inscriptionService.rejeterParDirecteur(id, commentaire);
            return ResponseEntity.ok(rejected);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/rejeter-admin")
    public ResponseEntity<Inscription> rejeterParAdmin(@PathVariable Long id, @RequestBody Map<String, String> body) {
        log.info("REST request to reject inscription {} by admin", id);
        try {
            String commentaire = body.get("commentaire");
            Inscription rejected = inscriptionService.rejeterParAdmin(id, commentaire);
            return ResponseEntity.ok(rejected);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInscription(@PathVariable Long id) {
        log.info("REST request to delete inscription with id: {}", id);
        inscriptionService.deleteInscription(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("Inscription Service is running!");
    }

    // ✅ CETTE MÉTHODE CORRIGE L'ERREUR 404
    @PutMapping("/{id}/soumettre")
    public ResponseEntity<Inscription> soumettreInscription(@PathVariable Long id) {
        log.info("REST request to submit (soumettre) inscription with id: {}", id);
        try {
            Inscription submitted = inscriptionService.soumettreInscription(id);
            return ResponseEntity.ok(submitted);
        } catch (RuntimeException e) {
            log.error("Erreur lors de la soumission: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
}