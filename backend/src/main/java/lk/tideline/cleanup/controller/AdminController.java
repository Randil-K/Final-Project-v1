package lk.tideline.cleanup.controller;

import jakarta.validation.Valid;
import lk.tideline.cleanup.dto.UserDtos.AdminUserResponse;
import lk.tideline.cleanup.dto.UserDtos.SuspensionRequest;
import lk.tideline.cleanup.service.UserService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Module 4 — account management for administrators. */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserService userService;

    public AdminController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/users")
    public List<AdminUserResponse> users(@RequestParam(required = false) String query) {
        return userService.listForAdmin(query);
    }

    @PostMapping("/users/{id}/suspension")
    public AdminUserResponse setSuspension(@PathVariable Long id, @Valid @RequestBody SuspensionRequest request) {
        return userService.setSuspension(id, request);
    }
}
