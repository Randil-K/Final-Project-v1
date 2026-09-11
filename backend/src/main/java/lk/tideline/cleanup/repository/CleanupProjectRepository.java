package lk.tideline.cleanup.repository;

import lk.tideline.cleanup.model.CleanupProject;
import lk.tideline.cleanup.model.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CleanupProjectRepository extends JpaRepository<CleanupProject, Long> {

    List<CleanupProject> findByStatusOrderByCreatedAtDesc(ProjectStatus status);

    List<CleanupProject> findAllByOrderByCreatedAtDesc();

    long countByStatus(ProjectStatus status);

    List<CleanupProject> findByReportIdOrderByCreatedAtDesc(Long reportId);

    boolean existsByReportId(Long reportId);
}
