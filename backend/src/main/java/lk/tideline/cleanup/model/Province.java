package lk.tideline.cleanup.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/** Reference data seeded by migration V3 — one of the nine provinces of Sri Lanka (REQ-58, REQ-59). */
@Entity
@Table(name = "provinces")
@Getter
@Setter
public class Province {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 60)
    private String name;

    @Column(nullable = false, unique = true, length = 10)
    private String code;

    /** False for the inland provinces, which only have rivers, lakes and reservoirs. */
    @Column(nullable = false)
    private boolean coastal;
}
