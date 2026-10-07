package lk.tideline.cleanup.repository;

import lk.tideline.cleanup.model.PollutionReport;
import lk.tideline.cleanup.model.ReportReviewAction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportReviewActionRepository extends JpaRepository<ReportReviewAction, Long> {

    List<ReportReviewAction> findByReportOrderByCreatedAtAsc(PollutionReport report);

    long countByReportId(Long reportId);
}
