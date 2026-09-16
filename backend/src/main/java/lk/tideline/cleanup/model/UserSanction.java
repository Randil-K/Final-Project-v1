package lk.tideline.cleanup.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

/** REQ-26, REQ-27 — the warning and restriction history behind {@code users.suspended}. */
@Entity
@Table(name = "user_sanctions")
@Getter
@Setter
public class UserSanction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issued_by_id")
    private User issuedBy;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private SanctionType type;

    @Column(nullable = false, length = 1000)
    private String reason;

    /** The false report that prompted the sanction, when there was one. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_report_id")
    private PollutionReport relatedReport;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
