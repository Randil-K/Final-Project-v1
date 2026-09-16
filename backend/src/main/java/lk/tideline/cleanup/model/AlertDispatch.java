package lk.tideline.cleanup.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/**
 * REQ-39 / REQ-41 — one escalation step of a location alert: the radius it went out at and how
 * many people it reached. The individual alerts point back here, so responses can be counted
 * per step and the radius widened when the response is insufficient.
 */
@Entity
@Table(name = "alert_dispatches")
@Getter
@Setter
public class AlertDispatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id")
    private PollutionReport report;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private CleanupProject project;

    @Column(nullable = false)
    private double radiusKm;

    /** 1 = the initial radius, 2 and 3 the widened ones. */
    @Column(nullable = false)
    private int tier;

    @Column(nullable = false)
    private int recipientsNotified;

    /** Null when the system escalated on its own rather than a person asking. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
