package lk.tideline.cleanup;

import lk.tideline.cleanup.dto.ProjectDtos.CreateProjectRequest;
import lk.tideline.cleanup.dto.ProjectDtos.ProjectResponse;
import lk.tideline.cleanup.dto.ProjectDtos.ProjectUpdateRequest;
import lk.tideline.cleanup.model.*;
import lk.tideline.cleanup.repository.AlertRepository;
import lk.tideline.cleanup.repository.PollutionReportRepository;
import lk.tideline.cleanup.repository.UserRepository;
import lk.tideline.cleanup.service.ProjectService;
import lk.tideline.cleanup.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** The report → cleanup → "your site was cleaned" loop, end to end through the service layer. */
@SpringBootTest
@TestPropertySource(properties = "tideline.seed-demo-data=false")
class CleanupLoopTests {

    @Autowired
    private UserRepository users;

    @Autowired
    private PollutionReportRepository reports;

    @Autowired
    private AlertRepository alerts;

    @Autowired
    private ProjectService projects;

    @Autowired
    private UserService userService;

    @Test
    void reporterHearsWhenACleanupIsPlannedAndWhenTheSiteIsCleaned() {
        User reporter = user(Role.CITIZEN);
        User organiser = user(Role.DIVER);
        User volunteer = user(Role.CITIZEN);
        PollutionReport report = report(reporter, ReportStatus.VERIFIED, null);

        ProjectResponse project = projects.create(request(report), organiser);
        projects.join(project.id(), volunteer, null);
        projects.addUpdate(project.id(),
                new ProjectUpdateRequest(UpdateStage.AFTER, "All clear.", null, 100, 12.5), organiser);

        assertThat(titlesFor(reporter)).containsExactlyInAnyOrder(
                "A cleanup is planned for your report",
                "The site you reported has been cleaned");
        assertThat(titlesFor(volunteer)).contains("Cleanup complete");
        assertThat(reports.findById(report.getId()).orElseThrow().getStatus()).isEqualTo(ReportStatus.CLEANED);
    }

    @Test
    void aReportGetsOnlyOneCleanup() {
        PollutionReport report = report(user(Role.CITIZEN), ReportStatus.VERIFIED, null);
        projects.create(request(report), user(Role.DIVER));

        assertThatThrownBy(() -> projects.create(request(report), user(Role.DIVER)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("already planned");
    }

    @Test
    void anEscalatedReportWaitsForTheAuthorityToApprove() {
        User reporter = user(Role.CITIZEN);
        PollutionReport pending = report(reporter, ReportStatus.ESCALATED, null);
        assertThatThrownBy(() -> projects.create(request(pending), user(Role.DIVER)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("authority");

        PollutionReport approved = report(reporter, ReportStatus.ESCALATED, true);
        assertThat(projects.create(request(approved), user(Role.DIVER)).reportId()).isEqualTo(approved.getId());
    }

    @Test
    void theOrganiserCannotJoinTheirOwnCleanup() {
        User organiser = user(Role.DIVER);
        ProjectResponse project = projects.create(
                request(report(user(Role.CITIZEN), ReportStatus.VERIFIED, null)), organiser);

        assertThatThrownBy(() -> projects.join(project.id(), organiser, null))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void theOrganiserRatesContributionsOnceTheCleanupIsComplete() {
        User organiser = user(Role.DIVER);
        User volunteer = user(Role.DIVER);
        ProjectResponse project = projects.create(
                request(report(user(Role.CITIZEN), ReportStatus.VERIFIED, null)), organiser);
        projects.join(project.id(), volunteer, null);

        assertThat(projects.view(project.id(), volunteer).participants())
                .as("participants stay private to the organiser")
                .isNull();
        Long participantId = projects.view(project.id(), organiser).participants().get(0).id();

        assertThatThrownBy(() -> projects.mark(project.id(), participantId, 4, organiser))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("complete");

        projects.addUpdate(project.id(),
                new ProjectUpdateRequest(UpdateStage.AFTER, "Done.", null, 100, null), organiser);

        assertThatThrownBy(() -> projects.mark(project.id(), participantId, 4, volunteer))
                .isInstanceOf(IllegalStateException.class);

        projects.mark(project.id(), participantId, 4, organiser);
        assertThat(userService.view(volunteer.getId()).averageMark()).isEqualTo(4.0);
        assertThat(titlesFor(volunteer)).contains("Your contribution was rated");
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

    private PollutionReport report(User reporter, ReportStatus status, Boolean authorityApproved) {
        PollutionReport report = new PollutionReport();
        report.setReference("T-" + UUID.randomUUID());
        report.setTitle("Test debris");
        report.setDescription("Test report.");
        report.setSeverity(Severity.MEDIUM);
        report.setStatus(status);
        report.setAuthorityApproved(authorityApproved);
        report.setLocationName("Negombo");
        report.setProvince("Western Province");
        report.setLatitude(7.2083);
        report.setLongitude(79.8358);
        report.setReporter(reporter);
        return reports.save(report);
    }

    private CreateProjectRequest request(PollutionReport report) {
        return new CreateProjectRequest("Test cleanup", null, report.getId(), "Negombo", "Western Province", null, null);
    }
}
