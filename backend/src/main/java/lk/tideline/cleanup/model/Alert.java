package lk.tideline.cleanup.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Table(name = "alerts")
@Getter
@Setter
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_id")
    private User recipient;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false)
    private AlertType type;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 1000)
    private String body;

    private Long reportId;
    private Long projectId;

    /** Radius the alert was sent at, so escalation steps are auditable. */
    private Double radiusKm;

    @Column(nullable = false)
    private boolean readFlag = false;

    /** Needs the recipient to act, e.g. a reviewer asking the reporter for more information. */
    @Column(nullable = false)
    private boolean critical = false;

    /** REQ-39 — the escalation step this alert went out on, for location alerts. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dispatch_id")
    private AlertDispatch dispatch;

    /** REQ-40 — whether the recipient accepted or declined; null while unanswered. */
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(length = 20)
    private AlertReply response;

    private Instant respondedAt;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
