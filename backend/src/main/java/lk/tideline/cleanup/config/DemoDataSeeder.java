package lk.tideline.cleanup.config;

import lk.tideline.cleanup.model.*;
import lk.tideline.cleanup.repository.*;
import lk.tideline.cleanup.service.AlertService;
import lk.tideline.cleanup.service.DocumentStorageService;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Seeds demo content covering every stage of the workflow, so the API is explorable
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
                                          DocumentStorageService storage,
                                          AlertService alerts,
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
            diverProfile(sanduni, CertificationLevel.ADVANCED_OPEN_WATER, 4, "Own BCD, regulator, wetsuit",
                    List.of("Western Province", "North Western Province"));
            attachCertificate(storage, sanduni, "PADI-Advanced-Open-Water.pdf", "PADI Advanced Open Water - Sanduni Perera");
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
            ngo.setWebsiteUrl("https://blue-resurgence.example.org");
            users.save(ngo);

            // Two applications waiting in the administrator's verification queue.
            User tharindu = user(users, encoder, "Tharindu Wickrama", "tharindu@example.lk",
                    Role.DIVER, "Southern Province", "Unawatuna", 6.0100, 80.2490);
            tharindu.setAccountStatus(AccountStatus.PENDING_REVIEW);
            diverProfile(tharindu, CertificationLevel.RESCUE_DIVER, 6, "Full kit, dive computer", List.of("Southern Province"));
            attachCertificate(storage, tharindu, "PADI-Rescue-Diver.pdf", "PADI Rescue Diver - Tharindu Wickrama");
            attachCertificate(storage, tharindu, "Emergency-First-Response.pdf", "Emergency First Response - Tharindu Wickrama");
            users.save(tharindu);

            User coralGuard = user(users, encoder, "Coral Guard Lanka", "team@coralguard.example.org",
                    Role.ORGANIZATION, "Eastern Province", "Trincomalee", 8.5700, 81.2300);
            coralGuard.setAccountStatus(AccountStatus.PENDING_REVIEW);
            coralGuard.setOrganizationName("Coral Guard Lanka");
            coralGuard.setOrganizationType(OrganizationType.MARINE_INSTITUTION);
            coralGuard.setWebsiteUrl("https://coralguard.example.org");
            users.save(coralGuard);

            alerts.send(admin, AlertType.ACCOUNT_REVIEW, "New volunteer diver to verify",
                    "Tharindu Wickrama registered with 2 certificates.", null, null, null);
            alerts.send(admin, AlertType.ACCOUNT_REVIEW, "New organisation to verify",
                    "Coral Guard Lanka registered. Check https://coralguard.example.org before approving.", null, null, null);

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

            // Kalpitiya is verified by the community and waits for the administrator (the default).

            // Trincomalee: approved by the administrator, waiting for the authority.
            trinco.setAdminDecision(ReviewDecision.APPROVED);
            trinco.setAdminReviewedAt(daysAgo(2));
            trinco.setEscalatedAt(daysAgo(2));
            trinco.setAuthorityDecision(ReviewDecision.PENDING);
            trinco.setStatus(ReportStatus.ESCALATED);
            reports.save(trinco);

            // Negombo: approved by both, so it became project CP-118, owned by Kasun who reported it.
            negombo.setAdminDecision(ReviewDecision.APPROVED);
            negombo.setAdminReviewedAt(daysAgo(4));
            negombo.setEscalatedAt(daysAgo(4));
            negombo.setAuthorityDecision(ReviewDecision.APPROVED);
            negombo.setAuthorityOfficer(officer);
            negombo.setAuthorityComment("Approved. Coordinate with the Negombo Municipal Council before starting.");
            negombo.setDecidedAt(daysAgo(3));
            negombo.setStatus(ReportStatus.APPROVED);
            reports.save(negombo);

            CleanupProject project = new CleanupProject();
            project.setReference("CP-118");
            project.setTitle(negombo.getTitle());
            project.setDescription(negombo.getDescription());
            project.setOwner(kasun);
            project.setReport(negombo);
            project.setStatus(ProjectStatus.ACTIVE);
            project.setCompletionPercentage(62);
            project.setLocationName("Negombo");
            project.setProvince("Western Province");
            project.setLatitude(7.2083);
            project.setLongitude(79.8358);
            project.setStartedAt(daysAgo(2));

            ProjectUpdate before = new ProjectUpdate();
            before.setProject(project);
            before.setAuthor(kasun);
            before.setStage(UpdateStage.BEFORE);
            before.setNote("Approved by MEPA. Volunteers and divers within 5 km have been alerted.");
            project.getUpdates().add(before);

            ProjectUpdate during = new ProjectUpdate();
            during.setProject(project);
            during.setAuthor(kasun);
            during.setStage(UpdateStage.DURING);
            during.setNote("38 bags of plastic collected on day one.");
            during.setCompletionPercentage(62);
            project.getUpdates().add(during);

            CleanupProject savedProject = projects.save(project);

            participant(participants, savedProject, sanduni, ParticipantRole.DIVER);
            participant(participants, savedProject, ishara, ParticipantRole.VOLUNTEER);
            participant(participants, savedProject, achini, ParticipantRole.VOLUNTEER);

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

    private static Instant daysAgo(int days) {
        return Instant.now().minus(days, ChronoUnit.DAYS);
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

    private void diverProfile(User diver, CertificationLevel level, int years, String equipment, List<String> regions) {
        DiverProfile profile = new DiverProfile();
        profile.setUser(diver);
        profile.setCertificationLevel(level);
        profile.setExperienceYears(years);
        profile.setEquipment(equipment);
        profile.setPreferredRegions(regions);
        diver.setDiverProfile(profile);
    }

    /** Writes a small generated PDF so the administrator has a real certificate to open. */
    private void attachCertificate(DocumentStorageService storage, User user, String fileName, String label) {
        byte[] pdf = demoPdf(label);
        String storedName = "demo-" + user.getId() + "-" + fileName.toLowerCase();
        storage.write(storedName, pdf);

        AccountDocument document = new AccountDocument();
        document.setUser(user);
        document.setOriginalName(fileName);
        document.setStoredName(storedName);
        document.setContentType("application/pdf");
        document.setSizeBytes(pdf.length);
        user.getDocuments().add(document);
    }

    private static byte[] demoPdf(String label) {
        String content = "BT /F1 14 Tf 24 100 Td (" + label + ") Tj 0 -28 Td (Demo certificate - not a real document) Tj ET";
        String[] objects = {
                "<< /Type /Catalog /Pages 2 0 R >>",
                "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
                "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 520 180] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
                "<< /Length " + content.length() + " >>\nstream\n" + content + "\nendstream",
                "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
        };
        StringBuilder pdf = new StringBuilder("%PDF-1.4\n");
        int[] offsets = new int[objects.length];
        for (int i = 0; i < objects.length; i++) {
            offsets[i] = pdf.length();
            pdf.append(i + 1).append(" 0 obj\n").append(objects[i]).append("\nendobj\n");
        }
        int xref = pdf.length();
        pdf.append("xref\n0 ").append(objects.length + 1).append("\n0000000000 65535 f \n");
        for (int offset : offsets) {
            pdf.append(String.format("%010d 00000 n \n", offset));
        }
        pdf.append("trailer\n<< /Size ").append(objects.length + 1).append(" /Root 1 0 R >>\nstartxref\n")
                .append(xref).append("\n%%EOF\n");
        return pdf.toString().getBytes(StandardCharsets.US_ASCII);
    }

    private void participant(ProjectParticipantRepository participants, CleanupProject project, User user, ParticipantRole role) {
        ProjectParticipant participant = new ProjectParticipant();
        participant.setProject(project);
        participant.setUser(user);
        participant.setParticipantRole(role);
        participants.save(participant);
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
