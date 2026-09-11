package lk.tideline.cleanup.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "opportunities")
@Getter
@Setter
public class Opportunity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id")
    private User organization;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 2000)
    private String description;

    @Column(nullable = false)
    private String region;

    @Enumerated(EnumType.STRING)
    private CertificationLevel requiredCertification;

    @Column(nullable = false)
    private boolean paid = false;

    @Column(nullable = false)
    private boolean open = true;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
