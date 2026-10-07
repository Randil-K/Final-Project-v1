package lk.tideline.cleanup.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pollution_reports")
@Getter
@Setter
public class PollutionReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Human-facing reference shown in the UI, e.g. SR-2481. */
    @Column(nullable = false, unique = true)
    private String reference;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 2000)
    private String description;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false)
    private Severity severity = Severity.MEDIUM;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false)
    private ReportStatus status = ReportStatus.PENDING;

    @Column(nullable = false)
    private String locationName;

    private String province;

    /** Region keys resolved from the province text on save; null if it matches no lookup row. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "province_id")
    private Province provinceRef;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "district_id")
    private District district;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reporter_id")
    private User reporter;

    @OneToMany(mappedBy = "report", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReportPhoto> photos = new ArrayList<>();

    @OneToMany(mappedBy = "report", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VerificationVote> votes = new ArrayList<>();

    @OneToMany(mappedBy = "report", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ReportComment> comments = new ArrayList<>();

    @Column(nullable = false)
    private int confirmVotes = 0;

    @Column(nullable = false)
    private int disputeVotes = 0;

    /** Recomputed on every vote; the SRS verifies at 75%. */
    @Column(nullable = false)
    private int trustPercentage = 0;

    /** How far the location alert has currently been widened. */
    @Column(nullable = false)
    private double alertRadiusKm = 0;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false)
    private ReviewDecision adminDecision = ReviewDecision.PENDING;

    @Column(length = 1000)
    private String moderationComment;

    private Instant adminReviewedAt;

    /** Null until an administrator approves the report and sends it to the authority. */
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private ReviewDecision authorityDecision;

    @Column(length = 1000)
    private String authorityComment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "authority_officer_id")
    private User authorityOfficer;

    private Instant escalatedAt;
    private Instant decidedAt;
    private Instant verifiedAt;

    /** REQ-11 — when the pollution happened, as opposed to when it was submitted. */
    private Instant incidentAt;

    /** NF-9 — an administrator judged the site unsafe to clean without guidance. */
    @Column(nullable = false)
    private boolean hazardous = false;

    /** NF-11, NF-14 — the safety guidance that unblocks a hazardous cleanup. */
    @Column(length = 1000)
    private String safetyNote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hazard_marked_by_id")
    private User hazardMarkedBy;

    private Instant hazardMarkedAt;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    private Instant updatedAt;

    public int totalVotes() {
        return confirmVotes + disputeVotes;
    }
}
