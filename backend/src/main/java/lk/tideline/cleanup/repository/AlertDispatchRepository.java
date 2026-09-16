package lk.tideline.cleanup.repository;

import lk.tideline.cleanup.model.AlertDispatch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AlertDispatchRepository extends JpaRepository<AlertDispatch, Long> {

    List<AlertDispatch> findByProjectIdOrderByTierAsc(Long projectId);

    Optional<AlertDispatch> findFirstByProjectIdOrderByTierDesc(Long projectId);

    List<AlertDispatch> findByReportIdOrderByTierAsc(Long reportId);
}
