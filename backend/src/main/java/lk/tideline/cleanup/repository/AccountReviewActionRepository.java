package lk.tideline.cleanup.repository;

import lk.tideline.cleanup.model.AccountReviewAction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AccountReviewActionRepository extends JpaRepository<AccountReviewAction, Long> {

    List<AccountReviewAction> findByUserIdOrderByCreatedAtAsc(Long userId);
}
