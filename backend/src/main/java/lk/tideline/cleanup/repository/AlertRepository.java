package lk.tideline.cleanup.repository;

import lk.tideline.cleanup.model.Alert;
import lk.tideline.cleanup.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlertRepository extends JpaRepository<Alert, Long> {

    List<Alert> findByRecipientOrderByCreatedAtDesc(User recipient);

    long countByRecipientAndReadFlagFalse(User recipient);
}
