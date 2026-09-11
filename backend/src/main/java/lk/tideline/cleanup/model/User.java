package lk.tideline.cleanup.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "users")
@Getter
@Setter
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.CITIZEN;

    private String province;
    private String city;

    private Double latitude;
    private Double longitude;

    /** Whether the user currently wants cleanup alerts. */
    @Column(nullable = false)
    private boolean availableForAlerts = true;

    /** Set by an administrator for abusive accounts; a suspended user cannot sign in. */
    @Column(nullable = false)
    private boolean suspended = false;

    @Column(length = 500)
    private String suspensionReason;

    private String organizationName;

    @Enumerated(EnumType.STRING)
    private OrganizationType organizationType;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private DiverProfile diverProfile;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public boolean hasLocation() {
        return latitude != null && longitude != null;
    }
}
