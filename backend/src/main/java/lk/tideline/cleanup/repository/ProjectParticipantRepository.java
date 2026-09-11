package lk.tideline.cleanup.repository;

import lk.tideline.cleanup.model.CleanupProject;
import lk.tideline.cleanup.model.ParticipantRole;
import lk.tideline.cleanup.model.ProjectParticipant;
import lk.tideline.cleanup.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProjectParticipantRepository extends JpaRepository<ProjectParticipant, Long> {

    Optional<ProjectParticipant> findByProjectAndUser(CleanupProject project, User user);

    List<ProjectParticipant> findByUser(User user);

    List<ProjectParticipant> findByProjectOrderByJoinedAtAsc(CleanupProject project);

    long countByProjectAndParticipantRole(CleanupProject project, ParticipantRole participantRole);

    /** Average organiser rating (1-5) across the cleanups this user took part in; null if none yet. */
    @Query("select avg(p.contributionMark) from ProjectParticipant p where p.user.id = :userId and p.contributionMark is not null")
    Double averageMark(@Param("userId") Long userId);

    long countByUserIdAndContributionMarkIsNotNull(Long userId);
}
