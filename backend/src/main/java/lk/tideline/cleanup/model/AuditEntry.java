package lk.tideline.cleanup.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/**
 * NF-25 — one row per consequential action: report approval and rejection, user restriction,
 * authority feedback, account review, resource finalisation, project completion.
 */
@Entity
@Table(name = "audit_log")
@Getter
@Setter
public class AuditEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Null once the actor is deleted; the record of what happened outlives them. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id")
    private User actor;

    @Column(nullable = false, length = 60)
    private String action;

    @Column(nullable = false, length = 40)
    private String entityType;

    private Long entityId;

    @Column(nullable = false, length = 500)
    private String summary;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
