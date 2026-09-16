package lk.tideline.cleanup.controller;

import jakarta.validation.Valid;
import lk.tideline.cleanup.dto.UserDtos.AccountReviewRequest;
import lk.tideline.cleanup.dto.UserDtos.AccountReviewResponse;
import lk.tideline.cleanup.dto.UserDtos.AdminUserResponse;
import lk.tideline.cleanup.dto.UserDtos.DocumentDownload;
import lk.tideline.cleanup.dto.AuditDtos.AuditResponse;
import lk.tideline.cleanup.dto.UserDtos.SanctionResponse;
import lk.tideline.cleanup.dto.UserDtos.SuspensionRequest;
import lk.tideline.cleanup.repository.AuditEntryRepository;
import org.springframework.data.domain.PageRequest;
import lk.tideline.cleanup.model.AccountStatus;
import lk.tideline.cleanup.service.UserService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.List;

/** Module 4 — account management for administrators. */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserService userService;
    private final AuditEntryRepository auditLog;

    public AdminController(UserService userService, AuditEntryRepository auditLog) {
        this.userService = userService;
        this.auditLog = auditLog;
    }

    @GetMapping("/users")
    public List<AdminUserResponse> users(@RequestParam(required = false) String query) {
        return userService.listForAdmin(query);
    }

    /** REQ-26, REQ-27 - the warning and restriction history of one account. */
    @GetMapping("/users/{id}/sanctions")
    public List<SanctionResponse> sanctions(@PathVariable Long id) {
        return userService.sanctions(id);
    }

    /** NF-25 - the audit trail of approvals, rejections, restrictions and authority feedback. */
    @GetMapping("/audit")
    public List<AuditResponse> audit(@RequestParam(defaultValue = "0") int page,
                                     @RequestParam(defaultValue = "50") int size) {
        return auditLog.findAllByOrderByCreatedAtDesc(PageRequest.of(page, Math.min(size, 200)))
                .map(AuditResponse::from)
                .getContent();
    }

    @PostMapping("/users/{id}/suspension")
    public AdminUserResponse setSuspension(@PathVariable Long id, @Valid @RequestBody SuspensionRequest request) {
        return userService.setSuspension(id, request);
    }

    @GetMapping("/verifications")
    public List<AccountReviewResponse> verifications(@RequestParam(defaultValue = "PENDING_REVIEW") AccountStatus status) {
        return userService.verifications(status);
    }

    @PostMapping("/verifications/{id}")
    public AccountReviewResponse reviewAccount(@PathVariable Long id, @Valid @RequestBody AccountReviewRequest request) {
        return userService.reviewAccount(id, request);
    }

    /** A diver's uploaded certificate, shown inline in the browser. */
    @GetMapping("/documents/{id}")
    public ResponseEntity<byte[]> document(@PathVariable Long id) {
        DocumentDownload file = userService.document(id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename(file.name(), StandardCharsets.UTF_8).build().toString())
                .body(file.bytes());
    }
}
