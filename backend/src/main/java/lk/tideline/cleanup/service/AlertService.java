package lk.tideline.cleanup.service;

import lk.tideline.cleanup.config.TidelineProperties;
import lk.tideline.cleanup.dto.AlertDtos.AlertResponse;
import lk.tideline.cleanup.model.Alert;
import lk.tideline.cleanup.model.AlertType;
import lk.tideline.cleanup.model.CleanupProject;
import lk.tideline.cleanup.model.PollutionReport;
import lk.tideline.cleanup.model.User;
import lk.tideline.cleanup.repository.AlertRepository;
import lk.tideline.cleanup.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.Set;

@Service
public class AlertService {

    private final AlertRepository alertRepository;
    private final UserRepository userRepository;
    private final TidelineProperties properties;

    public AlertService(AlertRepository alertRepository,
                        UserRepository userRepository,
                        TidelineProperties properties) {
        this.alertRepository = alertRepository;
        this.userRepository = userRepository;
        this.properties = properties;
    }

    @Transactional(readOnly = true)
    public List<AlertResponse> inbox(User recipient) {
        return alertRepository.findByRecipientOrderByCreatedAtDesc(recipient).stream()
                .map(AlertResponse::from)
                .toList();
    }

    @Transactional
    public AlertResponse markRead(Long id, User recipient) {
        Alert alert = alertRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Alert " + id + " was not found."));
        if (!Objects.equals(alert.getRecipient().getId(), recipient.getId())) {
            throw new NotFoundException("Alert " + id + " was not found.");
        }
        alert.setReadFlag(true);
        return AlertResponse.from(alertRepository.save(alert));
    }

    @Transactional
    public Alert send(User recipient, AlertType type, String title, String body,
                      Long reportId, Long projectId, Double radiusKm) {
        Alert alert = new Alert();
        alert.setRecipient(recipient);
        alert.setType(type);
        alert.setTitle(title);
        alert.setBody(body);
        alert.setReportId(reportId);
        alert.setProjectId(projectId);
        alert.setRadiusKm(radiusKm);
        return alertRepository.save(alert);
    }

    /**
     * Notifies every available user within {@code radiusKm} of the report. Returns how many
     * people were reached so the caller can decide whether the radius needs widening.
     */
    @Transactional
    public int notifyNearby(PollutionReport report, double radiusKm, AlertType type, String title, String body) {
        List<User> nearby = usersWithin(report.getLatitude(), report.getLongitude(), radiusKm);
        int sent = 0;
        for (User user : nearby) {
            if (Objects.equals(user.getId(), report.getReporter().getId())) {
                continue;
            }
            send(user, type, title, body, report.getId(), null, radiusKm);
            sent++;
        }
        return sent;
    }

    /** Skips {@code excludedUserIds} — e.g. the organiser, and a reporter who gets a personal alert instead. */
    @Transactional
    public int notifyProjectNearby(CleanupProject project, double radiusKm, String title, String body,
                                   Set<Long> excludedUserIds) {
        if (project.getLatitude() == null || project.getLongitude() == null) {
            return 0;
        }
        int sent = 0;
        for (User user : usersWithin(project.getLatitude(), project.getLongitude(), radiusKm)) {
            if (excludedUserIds.contains(user.getId())) {
                continue;
            }
            send(user, AlertType.PROJECT_PLANNED, title, body, null, project.getId(), radiusKm);
            sent++;
        }
        return sent;
    }

    /**
     * Widens the alert radius one step, as the SRS requires when nobody responds to the
     * initial local alert. Returns the new radius.
     */
    @Transactional
    public double escalateRadius(PollutionReport report) {
        double current = report.getAlertRadiusKm();
        List<Double> steps = properties.getAlerts().getEscalationRadiiKm();

        double next = steps.stream()
                .filter(step -> step > current)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("This alert is already at the widest radius."));

        report.setAlertRadiusKm(next);
        notifyNearby(report, next,
                AlertType.ALERT_ESCALATED,
                "Volunteers still needed near " + report.getLocationName(),
                "No one has responded yet, so this alert now covers " + (long) next + " km. Report "
                        + report.getReference() + " is waiting for a cleanup team.");
        return next;
    }

    private List<User> usersWithin(double latitude, double longitude, double radiusKm) {
        return userRepository.findByAvailableForAlertsTrue().stream()
                .filter(User::hasLocation)
                .filter(user -> GeoUtils.distanceKm(latitude, longitude,
                        user.getLatitude(), user.getLongitude()) <= radiusKm)
                .toList();
    }
}
