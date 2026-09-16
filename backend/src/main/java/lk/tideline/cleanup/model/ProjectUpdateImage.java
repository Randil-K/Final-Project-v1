package lk.tideline.cleanup.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/** REQ-45 — one of the before / during / after photos attached to a progress update. */
@Entity
@Table(name = "project_update_images")
@Getter
@Setter
public class ProjectUpdateImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "update_id")
    private ProjectUpdate update;

    @Column(nullable = false, length = 1000)
    private String url;

    /** Set for uploaded files; null for an image referenced by an external URL. */
    @Column(unique = true, length = 80)
    private String storedName;

    @Column(length = 100)
    private String contentType;

    private Long sizeBytes;

    @Column(name = "position", nullable = false)
    private int position;
}
