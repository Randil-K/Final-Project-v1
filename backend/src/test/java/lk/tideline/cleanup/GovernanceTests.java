package lk.tideline.cleanup;

import lk.tideline.cleanup.dto.AuthDtos.AuthResponse;
import lk.tideline.cleanup.dto.AuthDtos.LoginRequest;
import lk.tideline.cleanup.dto.AuthDtos.RegisterRequest;
import lk.tideline.cleanup.dto.ReportDtos.AuthorityDecisionRequest;
import lk.tideline.cleanup.dto.ReportDtos.ModerationRequest;
import lk.tideline.cleanup.dto.UserDtos.SuspensionRequest;
import lk.tideline.cleanup.model.*;
import lk.tideline.cleanup.repository.AlertRepository;
import lk.tideline.cleanup.repository.PollutionReportRepository;
import lk.tideline.cleanup.repository.UserRepository;
import lk.tideline.cleanup.service.AuthService;
import lk.tideline.cleanup.service.ReportService;
import lk.tideline.cleanup.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.DisabledException;
import org.springframework.test.context.TestPropertySource;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** Module 4 moderation and account control, and module 5 notifications to officials. */
@SpringBootTest
@TestPropertySource(properties = "tideline.seed-demo-data=false")
class GovernanceTests {

    @Autowired
    private UserRepository users;

    @Autowired
    private PollutionReportRepository reports;

    @Autowired
    private AlertRepository alerts;

    @Autowired
    private AuthService authService;

    @Autowired
    private UserService userService;

    @Autowired
    private ReportService reportService;

    @Test
    void aSuspendedMemberCannotSignInUntilReinstated() {
        String email = UUID.randomUUID() + "@test.lk";
        AuthResponse registered = authService.register(new RegisterRequest(
                "Suspended Member", email, "password123", null, Role.CITIZEN,
                null, null, null, null, null, null, null));

        userService.setSuspension(registered.user().id(), new SuspensionRequest(true, "Repeated false reports."));
        assertThatThrownBy(() -> authService.login(new LoginRequest(email, "password123")))
                .isInstanceOf(DisabledException.class);

        userService.setSuspension(registered.user().id(), new SuspensionRequest(false, null));
        assertThat(authService.login(new LoginRequest(email, "password123")).token()).isNotBlank();
    }

    @Test
    void administratorsCannotBeSuspended() {
        User admin = user(Role.ADMIN);
        assertThatThrownBy(() -> userService.setSuspension(admin.getId(), new SuspensionRequest(true, "Test")))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void aSuspensionNeedsAReason() {
        User member = user(Role.CITIZEN);
        assertThatThrownBy(() -> userService.setSuspension(member.getId(), new SuspensionRequest(true, " ")))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void escalationAlertsOfficersAndTheirDecisionAlertsAdministrators() {
        User officer = user(Role.AUTHORITY);
        User admin = user(Role.ADMIN);
        PollutionReport report = report(user(Role.CITIZEN), ReportStatus.VERIFIED);

        reportService.escalate(report.getId(), admin);
        assertThat(titlesFor(officer)).contains("Report escalated for your review");

        reportService.decideAsAuthority(report.getId(),
                new AuthorityDecisionRequest(true, "Approved with conditions."), officer);
        assertThat(titlesFor(admin)).contains("Authority approved " + report.getReference());
    }

    @Test
    void aClarificationRequestReachesTheReporterAndTheDiscussion() {
        User reporter = user(Role.CITIZEN);
        PollutionReport report = report(reporter, ReportStatus.PENDING);

        reportService.moderate(report.getId(),
                new ModerationRequest(ReportStatus.VERIFYING, "Which end of the beach is this?"), user(Role.ADMIN));

        assertThat(titlesFor(reporter)).contains("More detail needed on your report");
        assertThat(reportService.comments(report.getId())).anySatisfy(comment -> {
            assertThat(comment.official()).isTrue();
            assertThat(comment.body()).isEqualTo("Which end of the beach is this?");
        });
    }

    @Test
    void aClarificationRequestMustSayWhatIsUnclear() {
        PollutionReport report = report(user(Role.CITIZEN), ReportStatus.PENDING);
        assertThatThrownBy(() -> reportService.moderate(report.getId(),
                new ModerationRequest(ReportStatus.VERIFYING, null), user(Role.ADMIN)))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void moderationWaitsWhileTheAuthorityDecides() {
        PollutionReport report = report(user(Role.CITIZEN), ReportStatus.ESCALATED);
        assertThatThrownBy(() -> reportService.moderate(report.getId(),
                new ModerationRequest(ReportStatus.REJECTED, "No."), user(Role.ADMIN)))
                .isInstanceOf(IllegalStateException.class);
    }

    private List<String> titlesFor(User user) {
        return alerts.findByRecipientOrderByCreatedAtDesc(user).stream().map(Alert::getTitle).toList();
    }

    private User user(Role role) {
        User user = new User();
        user.setFullName(role.name() + " tester");
        user.setEmail(UUID.randomUUID() + "@test.lk");
        user.setPasswordHash("not-used");
        user.setRole(role);
        return users.save(user);
    }

    private PollutionReport report(User reporter, ReportStatus status) {
        PollutionReport report = new PollutionReport();
        report.setReference("T-" + UUID.randomUUID());
        report.setTitle("Test debris");
        report.setDescription("Test report.");
        report.setSeverity(Severity.MEDIUM);
        report.setStatus(status);
        report.setLocationName("Negombo");
        report.setProvince("Western Province");
        report.setLatitude(7.2083);
        report.setLongitude(79.8358);
        report.setReporter(reporter);
        return reports.save(report);
    }
}
