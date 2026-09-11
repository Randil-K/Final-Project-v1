package lk.tideline.cleanup.controller;

import lk.tideline.cleanup.dto.AlertDtos.AlertResponse;
import lk.tideline.cleanup.service.AlertService;
import lk.tideline.cleanup.service.CurrentUserService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private final AlertService alertService;
    private final CurrentUserService currentUser;

    public AlertController(AlertService alertService, CurrentUserService currentUser) {
        this.alertService = alertService;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<AlertResponse> inbox() {
        return alertService.inbox(currentUser.require());
    }

    @PostMapping("/{id}/read")
    public AlertResponse markRead(@PathVariable Long id) {
        return alertService.markRead(id, currentUser.require());
    }
}
