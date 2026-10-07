package lk.tideline.cleanup.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/** Reference data seeded by migration V3 — one of the 25 districts of Sri Lanka (REQ-58, REQ-59). */
@Entity
@Table(name = "districts")
@Getter
@Setter
public class District {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "province_id")
    private Province province;

    @Column(nullable = false, unique = true, length = 60)
    private String name;

    @Column(nullable = false)
    private boolean coastal;
}
