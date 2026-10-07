package lk.tideline.cleanup.repository;

import lk.tideline.cleanup.model.UserSanction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserSanctionRepository extends JpaRepository<UserSanction, Long> {

    List<UserSanction> findByUserIdOrderByCreatedAtDesc(Long userId);

    long countByUserId(Long userId);
}
