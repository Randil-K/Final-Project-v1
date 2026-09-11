package lk.tideline.cleanup.controller;

import jakarta.validation.Valid;
import lk.tideline.cleanup.dto.OpportunityDtos.*;
import lk.tideline.cleanup.service.CurrentUserService;
import lk.tideline.cleanup.service.OpportunityService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/opportunities")
public class OpportunityController {

    private final OpportunityService opportunityService;
    private final CurrentUserService currentUser;

    public OpportunityController(OpportunityService opportunityService, CurrentUserService currentUser) {
        this.opportunityService = opportunityService;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<OpportunityResponse> list() {
        return opportunityService.listOpen();
    }

    @GetMapping("/applications/mine")
    @PreAuthorize("hasRole('DIVER')")
    public List<ApplicationResponse> myApplications() {
        return opportunityService.myApplications(currentUser.require());
    }

    @GetMapping("/{id}")
    public OpportunityResponse get(@PathVariable Long id) {
        return opportunityService.view(id);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ORGANIZATION','ADMIN')")
    public ResponseEntity<OpportunityResponse> create(@Valid @RequestBody CreateOpportunityRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(opportunityService.create(request, currentUser.require()));
    }

    @PostMapping("/{id}/applications")
    @PreAuthorize("hasRole('DIVER')")
    public ResponseEntity<ApplicationResponse> apply(@PathVariable Long id,
                                                     @RequestBody(required = false) ApplyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(opportunityService.apply(id, currentUser.require(), request));
    }

    @GetMapping("/{id}/applications")
    @PreAuthorize("hasAnyRole('ORGANIZATION','ADMIN')")
    public List<ApplicationResponse> applications(@PathVariable Long id) {
        return opportunityService.applications(id, currentUser.require());
    }

    @PostMapping("/applications/{applicationId}/decision")
    @PreAuthorize("hasAnyRole('ORGANIZATION','ADMIN')")
    public ApplicationResponse decide(@PathVariable Long applicationId,
                                      @Valid @RequestBody DecideApplicationRequest request) {
        return opportunityService.decide(applicationId, request.status(), currentUser.require());
    }
}
