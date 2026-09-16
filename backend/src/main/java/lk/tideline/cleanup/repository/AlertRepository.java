package lk.tideline.cleanup.repository;

import lk.tideline.cleanup.model.Alert;
import lk.tideline.cleanup.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AlertRepository extends JpaRepository<Alert, Long> {

    List<Alert> findByRecipientOrderByCreatedAtDesc(User recipient);

    long countByRecipientAndReadFlagFalse(User recipient);

    /** Every alert already sent about a project, so an escalation does not alert the same person twice. */
    List<Alert> findByProjectId(Long projectId);

    /** REQ-40 / REQ-41 — how many people accepted, across all escalation tiers of a project. */
    @Query("select count(a) from Alert a where a.dispatch.project.id = :projectId and a.response = 'ACCEPTED'")
    long countAcceptedForProject(@Param("projectId") Long projectId);
}
