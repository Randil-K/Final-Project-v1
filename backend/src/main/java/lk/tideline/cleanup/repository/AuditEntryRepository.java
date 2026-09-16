package lk.tideline.cleanup.repository;

import lk.tideline.cleanup.model.AuditEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditEntryRepository extends JpaRepository<AuditEntry, Long> {

    Page<AuditEntry> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<AuditEntry> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, Long entityId);
}
