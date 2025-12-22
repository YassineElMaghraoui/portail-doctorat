package ma.enset.inscriptionservice.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import ma.enset.inscriptionservice.entities.Campagne;
import ma.enset.inscriptionservice.services.CampagneService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/campagnes")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*") // Autorise Angular (localhost:4200) à appeler ce service
public class CampagneController {

    private final CampagneService campagneService;

    // Créer une nouvelle campagne
    @PostMapping
    public ResponseEntity<Campagne> createCampagne(@Valid @RequestBody Campagne campagne) {
        log.info("REST request to create campagne: {}", campagne.getTitre());
        Campagne created = campagneService.createCampagne(campagne);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // Récupérer toutes les campagnes (C'est souvent cet endpoint que le dropdown appelle)
    @GetMapping
    public ResponseEntity<List<Campagne>> getAllCampagnes() {
        log.info("REST request to get all campagnes");
        List<Campagne> campagnes = campagneService.getAllCampagnes();
        return ResponseEntity.ok(campagnes);
    }

    // Récupérer une campagne par son ID
    @GetMapping("/{id}")
    public ResponseEntity<Campagne> getCampagneById(@PathVariable Long id) {
        log.info("REST request to get campagne by id: {}", id);
        return campagneService.getCampagneById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Récupérer la campagne active (Très important pour l'inscription par défaut)
    @GetMapping("/active")
    public ResponseEntity<Campagne> getCampagneActive() {
        log.info("REST request to get active campagne");
        return campagneService.getCampagneActive()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Mettre à jour une campagne
    @PutMapping("/{id}")
    public ResponseEntity<Campagne> updateCampagne(@PathVariable Long id, @Valid @RequestBody Campagne campagne) {
        log.info("REST request to update campagne with id: {}", id);
        try {
            Campagne updated = campagneService.updateCampagne(id, campagne);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Activer spécifiquement une campagne
    @PutMapping("/{id}/activer")
    public ResponseEntity<Campagne> activerCampagne(@PathVariable Long id) {
        log.info("REST request to activate campagne with id: {}", id);
        try {
            Campagne activated = campagneService.activerCampagne(id);
            return ResponseEntity.ok(activated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Supprimer une campagne
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCampagne(@PathVariable Long id) {
        log.info("REST request to delete campagne with id: {}", id);
        campagneService.deleteCampagne(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("Inscription Service - Campagnes is running!");
    }
}