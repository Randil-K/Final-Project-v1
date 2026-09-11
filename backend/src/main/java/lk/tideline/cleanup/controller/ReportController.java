package lk.tideline.cleanup.controller;

import jakarta.validation.Valid;
import lk.tideline.cleanup.dto.ReportDtos.*;
import lk.tideline.cleanup.model.ReportStatus;
import lk.tideline.cleanup.model.Severity;
import lk.tideline.cleanup.service.CurrentUserService;
import lk.tideline.cleanup.service.ReportService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportService reportService;
    private final CurrentUserService currentUser;

    public ReportController(ReportService reportService, CurrentUserService currentUser) {
        this.reportService = reportService;
        this.currentUser = currentUser;
    }

    @GetMapping
    public Page<ReportResponse> list(@RequestParam(required = false) ReportStatus status,
                                     @RequestParam(required = false) Severity severity,
                                     @RequestParam(required = false) String province,
                                     @RequestParam(defaultValue = "0") int page,
                                     @RequestParam(defaultValue = "20") int size) {
        return reportService.search(status, severity, province, PageRequest.of(page, size));
    }

    @GetMapping("/{id}")
    public ReportResponse get(@PathVariable Long id) {
        return reportService.view(id);
    }

    @PostMapping
    public ResponseEntity<ReportResponse> create(@Valid @RequestBody CreateReportRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reportService.create(request, currentUser.require()));
    }

    /** Module 3 — community verification vote. */
    @PostMapping("/{id}/votes")
    public ReportResponse vote(@PathVariable Long id, @Valid @RequestBody VoteRequest request) {
        return reportService.vote(id, currentUser.require(), request.confirmed());
    }

    @GetMapping("/{id}/comments")
    public List<CommentResponse> comments(@PathVariable Long id) {
        return reportService.comments(id);
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentResponse> comment(@PathVariable Long id,
                                                   @Valid @RequestBody CommentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reportService.comment(id, currentUser.require(), request));
    }

    /** Module 4 — administrator moderation. */
    @PostMapping("/{id}/moderation")
    @PreAuthorize("hasRole('ADMIN')")
    public ReportResponse moderate(@PathVariable Long id, @Valid @RequestBody ModerationRequest request) {
        return reportService.moderate(id, request, currentUser.require());
    }

    /** Module 5 — forward a verified report to the relevant government body. */
    @PostMapping("/{id}/escalation")
    @PreAuthorize("hasAnyRole('ADMIN','AUTHORITY')")
    public ReportResponse escalate(@PathVariable Long id) {
        return reportService.escalate(id, currentUser.require());
    }

    /** Module 5 — the authority officer's approval or rejection. */
    @PostMapping("/{id}/authority-decision")
    @PreAuthorize("hasRole('AUTHORITY')")
    public ReportResponse decide(@PathVariable Long id, @Valid @RequestBody AuthorityDecisionRequest request) {
        return reportService.decideAsAuthority(id, request, currentUser.require());
    }

    /** Module 6 — widen the alert radius when nobody has responded. */
    @PostMapping("/{id}/alert-escalation")
    @PreAuthorize("hasAnyRole('ADMIN','AUTHORITY')")
    public Map<String, Object> widenAlert(@PathVariable Long id) {
        return Map.of("reportId", id, "alertRadiusKm", reportService.escalateAlertRadius(id));
    }
}
