package lk.tideline.cleanup.config;

import lk.tideline.cleanup.model.*;
import lk.tideline.cleanup.repository.*;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Seeds the same demo content the frontend shows, so the API is explorable
 * immediately. Disabled on the mysql profile.
 */
@Configuration
@ConditionalOnProperty(name = "tideline.seed-demo-data", havingValue = "true")
public class DemoDataSeeder {

    private static final String DEMO_PASSWORD = "password123";

    @Bean
    public ApplicationRunner seedDemoData(UserRepository users,
                                          PollutionReportRepository reports,
                                          VerificationVoteRepository votes,
                                          CleanupProjectRepository projects,
                                          ProjectParticipantRepository participants,
                                          OpportunityRepository opportunities,
                                          PasswordEncoder encoder) {
        return args -> {
            if (users.count() > 0) {
                return;
            }

            User admin = user(users, encoder, "System Administrator", "admin@tideline.lk",
                    Role.ADMIN, "Western Province", "Colombo", 6.9271, 79.8612);
            User officer = user(users, encoder, "D. Bandara", "officer@mepa.gov.lk",
                    Role.AUTHORITY, "Western Province", "Colombo", 6.9271, 79.8612);

            User sanduni = user(users, encoder, "Sanduni Perera", "sanduni@example.lk",
                    Role.DIVER, "Western Province", "Negombo", 7.2083, 79.8358);
            DiverProfile sanduniProfile = new DiverProfile();
            sanduniProfile.setUser(sanduni);
            sanduniProfile.setCertificationLevel(CertificationLevel.ADVANCED_OPEN_WATER);
            sanduniProfile.setExperienceYears(4);
            sanduniProfile.setEquipment("Own BCD, regulator, wetsuit");
            sanduniProfile.setPreferredRegions(List.of("Western Province", "North Western Province"));
            sanduni.setDiverProfile(sanduniProfile);
            users.save(sanduni);

            User kasun = user(users, encoder, "Kasun Silva", "kasun@example.lk",
                    Role.CITIZEN, "Western Province", "Negombo", 7.2100, 79.8400);
            User achini = user(users, encoder, "Achini Fernando", "achini@example.lk",
                    Role.CITIZEN, "Eastern Province", "Trincomalee", 8.5874, 81.2152);
            User ishara = user(users, encoder, "Ishara Gunawardena", "ishara@example.lk",
                    Role.CITIZEN, "Western Province", "Mount Lavinia", 6.8389, 79.8653);

            User ngo = user(users, encoder, "Blue Resurgence", "hello@blueresurgence.lk",
                    Role.ORGANIZATION, "Southern Province", "Galle", 6.0535, 80.2210);
            ngo.setOrganizationName("Blue Resurgence NGO");
            ngo.setOrganizationType(OrganizationType.NGO);
            users.save(ngo);

            PollutionReport negombo = report(reports, kasun,
                    "Plastic debris along the tideline near the fish market",
                    "Large drift of plastic packaging and net fragments washed up after the weekend tide, "
                            + "roughly 80m stretch near the fish market jetty.",
                    Severity.HIGH, "Negombo", "Western Province", 7.2083, 79.8358, 3);

            PollutionReport trinco = report(reports, achini,
                    "Oil sheen and dead fish near the harbour outflow",
                    "Visible oil sheen spreading from the harbour outflow pipe, several dead fish observed "
                            + "along a 40m stretch of shoreline.",
                    Severity.CRITICAL, "Trincomalee", "Eastern Province", 8.5874, 81.2152, 5);

            PollutionReport kalpitiya = report(reports, sanduni,
                    "Discarded fishing nets tangled on the reef edge",
                    "Ghost nets caught on the reef edge, roughly 15m from the dive site mooring. "
                            + "Needs diver support to remove safely.",
                    Severity.MEDIUM, "Kalpitiya", "North Western Province", 8.2333, 79.7667, 4);

            report(reports, ishara,
                    "Household waste dumped behind the dune vegetation",
                    "Small pile of household waste bags left behind the dune grass, likely dumped overnight.",
                    Severity.LOW, "Mount Lavinia", "Western Province", 6.8389, 79.8653, 2);

            castVotes(votes, reports, negombo, List.of(sanduni, achini, ishara, ngo), List.of(admin));
            castVotes(votes, reports, trinco, List.of(sanduni, kasun, ishara, ngo, admin), List.of());
            castVotes(votes, reports, kalpitiya, List.of(kasun, achini, ishara, ngo, admin), List.of());

            trinco.setStatus(ReportStatus.ESCALATED);
            trinco.setEscalatedAt(Instant.now().minus(2, ChronoUnit.DAYS));
            trinco.setAuthorityOfficer(officer);
            reports.save(trinco);

            CleanupProject project = new CleanupProject();
            project.setReference("CP-118");
            project.setTitle("Negombo fish market shoreline cleanup");
            project.setDescription("Community cleanup of the tideline debris reported in " + negombo.getReference() + ".");
            project.setOwner(sanduni);
            project.setReport(negombo);
            project.setStatus(ProjectStatus.ACTIVE);
            project.setCompletionPercentage(62);
            project.setLocationName("Negombo");
            project.setProvince("Western Province");
            project.setLatitude(7.2083);
            project.setLongitude(79.8358);
            project.setStartedAt(Instant.now().minus(2, ChronoUnit.DAYS));

            ProjectUpdate before = new ProjectUpdate();
            before.setProject(project);
            before.setAuthor(sanduni);
            before.setStage(UpdateStage.BEFORE);
            before.setNote("Project approved by MEPA, volunteer mobilisation opened.");
            project.getUpdates().add(before);

            ProjectUpdate during = new ProjectUpdate();
            during.setProject(project);
            during.setAuthor(sanduni);
            during.setStage(UpdateStage.DURING);
            during.setNote("38 bags of plastic collected on day one.");
            during.setCompletionPercentage(62);
            project.getUpdates().add(during);

            CleanupProject savedProject = projects.save(project);

            for (User volunteer : List.of(kasun, ishara, achini)) {
                ProjectParticipant participant = new ProjectParticipant();
                participant.setProject(savedProject);
                participant.setUser(volunteer);
                participant.setParticipantRole(ParticipantRole.VOLUNTEER);
                participants.save(participant);
            }

            Opportunity survey = new Opportunity();
            survey.setOrganization(ngo);
            survey.setTitle("Reef survey diver — 3 day assignment");
            survey.setDescription("Support a coral health survey following last month's cleanup at Unawatuna.");
            survey.setRegion("Southern Province");
            survey.setRequiredCertification(CertificationLevel.ADVANCED_OPEN_WATER);
            survey.setPaid(true);
            opportunities.save(survey);

            Opportunity nets = new Opportunity();
            nets.setOrganization(ngo);
            nets.setTitle("Ghost net recovery volunteer");
            nets.setDescription("Weekend volunteer dive to recover nets flagged in report " + kalpitiya.getReference() + ".");
            nets.setRegion("North Western Province");
            nets.setRequiredCertification(CertificationLevel.OPEN_WATER);
            nets.setPaid(false);
            opportunities.save(nets);
        };
    }

    private User user(UserRepository users, PasswordEncoder encoder, String name, String email,
                      Role role, String province, String city, double lat, double lon) {
        User user = new User();
        user.setFullName(name);
        user.setEmail(email);
        user.setPasswordHash(encoder.encode(DEMO_PASSWORD));
        user.setRole(role);
        user.setProvince(province);
        user.setCity(city);
        user.setLatitude(lat);
        user.setLongitude(lon);
        return users.save(user);
    }

    private PollutionReport report(PollutionReportRepository reports, User reporter, String title,
                                   String description, Severity severity, String location,
                                   String province, double lat, double lon, int photoCount) {
        PollutionReport report = new PollutionReport();
        report.setTitle(title);
        report.setDescription(description);
        report.setSeverity(severity);
        report.setLocationName(location);
        report.setProvince(province);
        report.setLatitude(lat);
        report.setLongitude(lon);
        report.setReporter(reporter);
        report.setReference("TMP-" + title.hashCode());

        for (int i = 1; i <= photoCount; i++) {
            ReportPhoto photo = new ReportPhoto();
            photo.setReport(report);
            photo.setUrl("https://placeholder.tideline.lk/evidence/" + location.toLowerCase() + "-" + i + ".jpg");
            report.getPhotos().add(photo);
        }

        PollutionReport saved = reports.saveAndFlush(report);
        saved.setReference("SR-" + (2400 + saved.getId()));
        return reports.save(saved);
    }

    private void castVotes(VerificationVoteRepository votes, PollutionReportRepository reports,
                           PollutionReport report, List<User> confirming, List<User> disputing) {
        for (User voter : confirming) {
            vote(votes, report, voter, true);
        }
        for (User voter : disputing) {
            vote(votes, report, voter, false);
        }

        int confirm = confirming.size();
        int dispute = disputing.size();
        int total = confirm + dispute;
        report.setConfirmVotes(confirm);
        report.setDisputeVotes(dispute);
        report.setTrustPercentage(total == 0 ? 0 : Math.round((confirm * 100f) / total));
        report.setStatus(report.getTrustPercentage() >= 75 && total >= 5
                ? ReportStatus.VERIFIED
                : ReportStatus.VERIFYING);
        if (report.getStatus() == ReportStatus.VERIFIED) {
            report.setVerifiedAt(Instant.now());
        }
        reports.save(report);
    }

    private void vote(VerificationVoteRepository votes, PollutionReport report, User voter, boolean confirmed) {
        VerificationVote vote = new VerificationVote();
        vote.setReport(report);
        vote.setVoter(voter);
        vote.setConfirmed(confirmed);
        votes.save(vote);
    }
}
