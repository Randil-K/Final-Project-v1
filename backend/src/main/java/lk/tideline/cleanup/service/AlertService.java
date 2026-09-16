package lk.tideline.cleanup.service;

import lk.tideline.cleanup.dto.AlertDtos.AlertResponse;
import lk.tideline.cleanup.model.Alert;
import lk.tideline.cleanup.model.AlertType;
import lk.tideline.cleanup.model.CleanupProject;
import lk.tideline.cleanup.model.PollutionReport;
import lk.tideline.cleanup.model.User;
import lk.tideline.cleanup.model.AlertDispatch;
import lk.tideline.cleanup.model.AlertReply;
import lk.tideline.cleanup.model.ProjectParticipant;
import lk.tideline.cleanup.repository.AlertDispatchRepository;
import lk.tideline.cleanup.repository.AlertRepository;
import lk.tideline.cleanup.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.Set;

@Service
public class AlertService {

    /** REQ-41 — the escalation ladder: the initial radius, then these. */
    private static final double[] ESCALATION_RADII_KM = {10, 25};

    private final AlertRepository alertRepository;
    private final UserRepository userRepository;
    private final AlertDispatchRepository dispatchRepository;

    public AlertService(AlertRepository alertRepository, UserRepository userRepository,
                        AlertDispatchRepository dispatchRepository) {
        this.alertRepository = alertRepository;
        this.userRepository = userRepository;
        this.dispatchRepository = dispatchRepository;
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

    @Transactional(readOnly = true)
    public long unreadCount(User recipient) {
        return alertRepository.countByRecipientAndReadFlagFalse(recipient);
    }

    @Transactional
    public int markAllRead(User recipient) {
        List<Alert> unread = alertRepository.findByRecipientOrderByCreatedAtDesc(recipient).stream()
                .filter(alert -> !alert.isReadFlag())
                .toList();
        unread.forEach(alert -> alert.setReadFlag(true));
        return unread.size();
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

    @Transactional
    public Alert sendCritical(User recipient, AlertType type, String title, String body, Long reportId) {
        return sendCritical(recipient, type, title, body, reportId, null);
    }

    @Transactional
    public Alert sendCritical(User recipient, AlertType type, String title, String body, Long reportId, Long projectId) {
        Alert alert = send(recipient, type, title, body, reportId, projectId, null);
        alert.setCritical(true);
        return alert;
    }

    /**
     * Notifies every available user within {@code radiusKm} of the report. Returns how many
     * people were reached so the caller can decide whether the radius needs widening.
     */
    @Transactional
    public int notifyNearby(PollutionReport report, double radiusKm, AlertType type, String title, String body) {
        // REQ-39 — record the step itself, so who was reached at which radius is auditable.
        AlertDispatch dispatch = new AlertDispatch();
        dispatch.setReport(report);
        dispatch.setRadiusKm(radiusKm);
        dispatch.setTier(1);
        dispatch.setRecipientsNotified(0);
        dispatchRepository.saveAndFlush(dispatch);

        List<User> nearby = usersWithin(report.getLatitude(), report.getLongitude(), radiusKm);
        int sent = 0;
        for (User user : nearby) {
            if (Objects.equals(user.getId(), report.getReporter().getId())) {
                continue;
            }
            Alert alert = send(user, type, title, body, report.getId(), null, radiusKm);
            alert.setDispatch(dispatch);
            sent++;
        }
        dispatch.setRecipientsNotified(sent);
        return sent;
    }

    /** Skips {@code excludedUserIds} — e.g. the organiser, and a reporter who gets a personal alert instead. */
    @Transactional
    public int notifyProjectNearby(CleanupProject project, double radiusKm, String title, String body,
                                   Set<Long> excludedUserIds) {
        return notifyProjectNearby(project, radiusKm, 1, AlertType.PROJECT_PLANNED, title, body, excludedUserIds, null);
    }

    /** REQ-39 / REQ-41 — one dispatch tier of a project alert. Tier 1 is the initial radius. */
    @Transactional
    public int notifyProjectNearby(CleanupProject project, double radiusKm, int tier, AlertType type,
                                   String title, String body, Set<Long> excludedUserIds, User actor) {
        if (project.getLatitude() == null || project.getLongitude() == null) {
            return 0;
        }
        AlertDispatch dispatch = new AlertDispatch();
        dispatch.setProject(project);
        dispatch.setRadiusKm(radiusKm);
        dispatch.setTier(tier);
        dispatch.setRecipientsNotified(0);
        dispatch.setCreatedBy(actor);
        dispatchRepository.saveAndFlush(dispatch);

        int sent = 0;
        for (User user : usersWithin(project.getLatitude(), project.getLongitude(), radiusKm)) {
            if (excludedUserIds.contains(user.getId())) {
                continue;
            }
            Alert alert = send(user, type, title, body, null, project.getId(), radiusKm);
            alert.setDispatch(dispatch);
            sent++;
        }
        dispatch.setRecipientsNotified(sent);
        return sent;
    }

    /**
     * REQ-40 — the recipient accepts or declines a location alert. Accepting a project alert
     * is only an expression of interest; joining the project is still a separate step.
     */
    @Transactional
    public AlertReply respond(Long alertId, User recipient, AlertReply response) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new NotFoundException("Alert " + alertId + " was not found."));
        if (!Objects.equals(alert.getRecipient().getId(), recipient.getId())) {
            throw new NotFoundException("Alert " + alertId + " was not found.");
        }
        if (alert.getDispatch() == null) {
            throw new IllegalStateException("This alert does not ask for an answer.");
        }
        alert.setResponse(response);
        alert.setRespondedAt(java.time.Instant.now());
        alert.setReadFlag(true);
        return response;
    }

    /** How many people accepted across every dispatch for a project. */
    @Transactional(readOnly = true)
    public long acceptedCount(Long projectId) {
        return alertRepository.countAcceptedForProject(projectId);
    }

    /**
     * REQ-41 — widen the alert area when the response is insufficient. Returns how many extra
     * people were reached, or -1 when the ladder is already exhausted or the target is met.
     */
    @Transactional
    public int escalate(CleanupProject project, long joinedSoFar, User actor) {
        Integer target = project.getMinimumParticipants();
        if (target != null && joinedSoFar + acceptedCount(project.getId()) >= target) {
            return -1;
        }
        int lastTier = dispatchRepository.findFirstByProjectIdOrderByTierDesc(project.getId())
                .map(AlertDispatch::getTier)
                .orElse(0);
        if (lastTier == 0 || lastTier > ESCALATION_RADII_KM.length) {
            return -1;
        }
        double radius = ESCALATION_RADII_KM[lastTier - 1];

        Set<Long> already = new java.util.HashSet<>();
        already.add(project.getOwner().getId());
        for (ProjectParticipant participant : project.getParticipants()) {
            already.add(participant.getUser().getId());
        }
        for (Alert previous : alertRepository.findByProjectId(project.getId())) {
            already.add(previous.getRecipient().getId());
        }

        return notifyProjectNearby(project, radius, lastTier + 1, AlertType.ALERT_ESCALATED,
                "Cleanup needs more help near " + project.getLocationName(),
                project.getTitle() + " has not reached the turnout it needs, so the alert has been widened to "
                        + (int) radius + " km. Join if you can help.",
                already, actor);
    }

    private List<User> usersWithin(double latitude, double longitude, double radiusKm) {
        return userRepository.findByAvailableForAlertsTrue().stream()
                .filter(User::hasLocation)
                .filter(user -> GeoUtils.distanceKm(latitude, longitude,
                        user.getLatitude(), user.getLongitude()) <= radiusKm)
                .toList();
    }
}
