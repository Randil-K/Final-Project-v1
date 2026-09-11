package lk.tideline.cleanup.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "report_photos")
@Getter
@Setter
public class ReportPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "report_id")
    private PollutionReport report;

    /** Evidence is referenced by URL; binary upload is a later phase. */
    @Column(nullable = false, length = 1000)
    private String url;

    private String caption;
}
